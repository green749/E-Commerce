import { eventRepository } from '../repositories/event.repository.js';
import { successResponse } from '../utils/response.js';

/**
 * Helper to determine device type from User-Agent if not explicitly passed
 */
function detectDeviceType(userAgent = '') {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

export const eventController = {
  /**
   * POST /api/events
   * Track single or batched analytics events (page_view, search, product_view, add_to_cart, etc.)
   */
  async track(req, res, next) {
    try {
      const defaultUserId = req.user?.id || null;
      const defaultSessionId =
        req.cookies?.session_id ||
        req.headers['x-session-id'] ||
        req.body?.sessionId ||
        req.body?.session_id ||
        null;

      const detectedDevice = detectDeviceType(req.headers['user-agent']);
      const defaultPageUrl = req.headers['referer'] || req.headers['origin'] || null;

      // Extract raw events from single or batched request body
      let rawEvents = [];
      if (Array.isArray(req.body)) {
        rawEvents = req.body;
      } else if (Array.isArray(req.body?.events)) {
        rawEvents = req.body.events;
      } else if (typeof req.body === 'object' && req.body !== null) {
        rawEvents = [req.body];
      }

      if (rawEvents.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'No events provided in payload' },
        });
      }

      const validEvents = [
        'page_view',
        'search',
        'product_view',
        'add_to_cart',
        'remove_from_cart',
        'begin_checkout',
        'purchase',
      ];

      // Normalize all events into consistent format
      const normalizedEvents = [];
      for (const ev of rawEvents) {
        const finalEventType = ev.eventType || ev.event_type;
        if (!finalEventType || !validEvents.includes(finalEventType)) {
          continue;
        }

        normalizedEvents.push({
          userId: ev.userId || ev.user_id || defaultUserId,
          sessionId: ev.sessionId || ev.session_id || defaultSessionId,
          eventType: finalEventType,
          deviceType: ev.deviceType || ev.device_type || detectedDevice,
          pageUrl: ev.pageUrl || ev.page_url || defaultPageUrl,
          properties:
            typeof ev.properties === 'object' && ev.properties !== null
              ? ev.properties
              : {},
          occurredAt: ev.occurredAt || ev.occurred_at || new Date().toISOString(),
        });
      }

      if (normalizedEvents.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: `No valid events found. Allowed types: ${validEvents.join(', ')}`,
          },
        });
      }

      const insertedCount = await eventRepository.recordBatch(normalizedEvents);

      return successResponse(
        res,
        {
          tracked: true,
          count: insertedCount,
        },
        201
      );
    } catch (err) {
      next(err);
    }
  },
};

export default eventController;
