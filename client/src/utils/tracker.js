/**
 * Client-Side Analytics Tracker
 * Batches events and transmits them periodically (every 4 seconds) or upon
 * page visibility changes and window unloads via navigator.sendBeacon.
 */

const FLUSH_INTERVAL_MS = 4000;
const MAX_BATCH_SIZE = 10;
const ENDPOINT = '/api/events';

function getSessionId() {
  try {
    const match = document.cookie.match(/(?:^|;\s*)session_id=([^;]*)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    let fallbackId = window.sessionStorage?.getItem('shoppe_tracker_session');
    if (!fallbackId) {
      fallbackId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      window.sessionStorage?.setItem('shoppe_tracker_session', fallbackId);
    }
    return fallbackId;
  } catch {
    return 'sess_fallback';
  }
}

function getDeviceType() {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  const ua = navigator.userAgent || '';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (width >= 768 && width <= 1024)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua) || width < 768) {
    return 'mobile';
  }
  return 'desktop';
}

class AnalyticsTracker {
  constructor() {
    this.queue = [];
    this.timer = null;
    this.isFlushing = false;
    this.initLifecycleListeners();
    this.startTimer();
  }

  initLifecycleListeners() {
    if (typeof window === 'undefined') return;

    // Flush when tab is hidden or closing
    const handleUnloadOrHide = () => {
      this.flushBeacon();
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleUnloadOrHide();
      }
    });

    window.addEventListener('pagehide', handleUnloadOrHide);
    window.addEventListener('beforeunload', handleUnloadOrHide);
  }

  startTimer() {
    if (typeof window === 'undefined') return;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, FLUSH_INTERVAL_MS);
  }

  /**
   * Enqueue an analytics event
   * @param {'page_view'|'search'|'product_view'|'add_to_cart'|'remove_from_cart'|'begin_checkout'|'purchase'} eventType
   * @param {Object} [properties]
   */
  track(eventType, properties = {}) {
    if (!eventType) return;

    const event = {
      event_type: eventType,
      session_id: getSessionId(),
      device_type: getDeviceType(),
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      properties: typeof properties === 'object' && properties !== null ? properties : {},
      occurred_at: new Date().toISOString(),
    };

    this.queue.push(event);

    // If batch size threshold reached, flush immediately
    if (this.queue.length >= MAX_BATCH_SIZE) {
      this.flush();
    }
  }

  /**
   * Asynchronous flush using fetch / axios for standard scheduled interval
   */
  async flush() {
    if (this.queue.length === 0 || this.isFlushing) return;

    this.isFlushing = true;
    const batch = this.queue.splice(0, MAX_BATCH_SIZE);

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
        credentials: 'include',
      });

      if (!response.ok) {
        // Re-insert uncommitted events to head of queue if server rejected
        this.queue.unshift(...batch);
      }
    } catch (err) {
      // Put back on network failure
      this.queue.unshift(...batch);
      console.debug('Analytics batch flush failed (will retry):', err.message);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Synchronous beacon flush on page close / unload
   */
  flushBeacon() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.queue.length);
    const payload = JSON.stringify(batch);

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon(ENDPOINT, blob);
      if (!sent) {
        this.fallbackKeepaliveFetch(payload);
      }
    } else {
      this.fallbackKeepaliveFetch(payload);
    }
  }

  fallbackKeepaliveFetch(payload) {
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
        credentials: 'include',
      }).catch(() => {});
    } catch {
      // Best-effort send on unload
    }
  }

  // --- Convenience Tracking Helpers ---

  pageView(properties = {}) {
    this.track('page_view', {
      title: typeof document !== 'undefined' ? document.title : '',
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      ...properties,
    });
  }

  search(query, properties = {}) {
    this.track('search', {
      query: String(query || '').trim(),
      ...properties,
    });
  }

  productView(product, properties = {}) {
    this.track('product_view', {
      productId: product?.id,
      slug: product?.slug,
      name: product?.name,
      brand: product?.brand,
      price: product?.base_price || product?.price,
      ...properties,
    });
  }

  addToCart(item, properties = {}) {
    this.track('add_to_cart', {
      productId: item?.product_id || item?.productId,
      variantId: item?.variant_id || item?.variantId,
      name: item?.name || item?.product_name,
      sku: item?.sku,
      quantity: item?.quantity || 1,
      price: item?.price || item?.unit_price,
      ...properties,
    });
  }

  removeFromCart(item, properties = {}) {
    this.track('remove_from_cart', {
      itemId: item?.id,
      productId: item?.product_id || item?.productId,
      variantId: item?.variant_id || item?.variantId,
      name: item?.name || item?.product_name,
      sku: item?.sku,
      quantity: item?.quantity || 1,
      price: item?.price || item?.unit_price,
      ...properties,
    });
  }

  beginCheckout(cart, properties = {}) {
    this.track('begin_checkout', {
      items_count: cart?.items?.length || cart?.count || 0,
      subtotal: cart?.subtotal,
      total: cart?.total,
      ...properties,
    });
  }

  purchase(order, properties = {}) {
    this.track('purchase', {
      orderId: order?.id,
      orderNumber: order?.order_number,
      total: order?.total,
      items_count: order?.items?.length || order?.items_count || 0,
      paymentStatus: order?.payment_status || 'paid',
      ...properties,
    });
  }
}

export const tracker = new AnalyticsTracker();
export default tracker;
