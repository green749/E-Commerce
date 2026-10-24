import { tracker } from '../utils/tracker.js';

export const eventsApi = {
  /**
   * Track analytics event (page_view, search, product_view, add_to_cart, remove_from_cart, begin_checkout, purchase)
   * Queues the event in the client batch tracker
   */
  track: (eventType, properties = {}) => {
    tracker.track(eventType, properties);
    return Promise.resolve({ queued: true });
  },

  pageView: (props) => tracker.pageView(props),
  search: (query, props) => tracker.search(query, props),
  productView: (product, props) => tracker.productView(product, props),
  addToCart: (item, props) => tracker.addToCart(item, props),
  removeFromCart: (item, props) => tracker.removeFromCart(item, props),
  beginCheckout: (cart, props) => tracker.beginCheckout(cart, props),
  purchase: (order, props) => tracker.purchase(order, props),
  flush: () => tracker.flush(),
};

export default eventsApi;
