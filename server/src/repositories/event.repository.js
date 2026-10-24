import { query } from '../db/index.js';
import { logger } from '../config/logger.js';

export const eventRepository = {
  /**
   * Record a single analytics event in the events table
   * @param {Object} params
   * @param {string|null} params.userId
   * @param {string|null} params.sessionId
   * @param {'page_view'|'search'|'product_view'|'add_to_cart'|'remove_from_cart'|'begin_checkout'|'purchase'} params.eventType
   * @param {string|null} params.deviceType
   * @param {string|null} params.pageUrl
   * @param {Object} params.properties
   * @param {Date|string} [params.occurredAt]
   * @returns {Promise<Object|null>}
   */
  async record({
    userId = null,
    sessionId = null,
    eventType,
    deviceType = null,
    pageUrl = null,
    properties = {},
    occurredAt = null,
  }) {
    try {
      const res = await query(
        `INSERT INTO events (user_id, session_id, event_type, device_type, page_url, properties, occurred_at)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::timestamptz, CURRENT_TIMESTAMP))
         RETURNING id, user_id, session_id, event_type, device_type, page_url, properties, occurred_at;`,
        [
          userId || null,
          sessionId || null,
          eventType,
          deviceType || null,
          pageUrl || null,
          JSON.stringify(properties || {}),
          occurredAt ? new Date(occurredAt).toISOString() : null,
        ]
      );
      return res.rows[0];
    } catch (err) {
      logger.error({ error: err.message, eventType }, 'Failed to record analytics event');
      return null;
    }
  },

  /**
   * Record a batch of analytics events in a single parameterized multi-row INSERT
   * @param {Array<Object>} events
   * @returns {Promise<number>} count of inserted rows
   */
  async recordBatch(events = []) {
    if (!Array.isArray(events) || events.length === 0) {
      return 0;
    }

    try {
      const values = [];
      const placeholders = [];

      events.forEach((ev, idx) => {
        const offset = idx * 7;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, COALESCE($${offset + 7}::timestamptz, CURRENT_TIMESTAMP))`
        );

        values.push(
          ev.userId || ev.user_id || null,
          ev.sessionId || ev.session_id || null,
          ev.eventType || ev.event_type,
          ev.deviceType || ev.device_type || null,
          ev.pageUrl || ev.page_url || null,
          JSON.stringify(ev.properties || {}),
          ev.occurredAt || ev.occurred_at
            ? new Date(ev.occurredAt || ev.occurred_at).toISOString()
            : null
        );
      });

      const sql = `
        INSERT INTO events (user_id, session_id, event_type, device_type, page_url, properties, occurred_at)
        VALUES ${placeholders.join(', ')}
        RETURNING id;
      `;

      const res = await query(sql, values);
      return res.rowCount || res.rows.length;
    } catch (err) {
      logger.error({ error: err.message, batchSize: events.length }, 'Failed to record batch analytics events');
      return 0;
    }
  },
};

export default eventRepository;
