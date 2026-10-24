import cron from 'node-cron';
import { withTransaction } from '../db/index.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let task = null;

/**
 * Execute retention archival for events and closed orders older than the specified threshold
 * @param {Object} [options]
 * @param {number} [options.days]
 * @returns {Promise<{ archivedEventsCount: number, archivedOrdersCount: number }>}
 */
export async function runRetentionArchival({ days = env.RETENTION_DAYS } = {}) {
  const retentionDays = Number(days) || 90;
  logger.info({ retentionDays }, 'Starting retention archival for records older than threshold...');

  return await withTransaction(async (txQuery) => {
    // 1. Archive events older than retentionDays
    const archiveEventsSql = `
      WITH moved_events AS (
        DELETE FROM events
        WHERE occurred_at < CURRENT_TIMESTAMP - ($1 || ' days')::interval
        RETURNING id, user_id, session_id, event_type, device_type, page_url, properties, occurred_at, created_at, updated_at
      )
      INSERT INTO events_archive (id, user_id, session_id, event_type, device_type, page_url, properties, occurred_at, created_at, updated_at, archived_at)
      SELECT id, user_id, session_id, event_type, device_type, page_url, properties, occurred_at, created_at, updated_at, CURRENT_TIMESTAMP
      FROM moved_events
      RETURNING id;
    `;
    const eventsRes = await txQuery(archiveEventsSql, [retentionDays]);
    const archivedEventsCount = eventsRes.rows.length;

    // 2. Archive closed orders older than retentionDays
    // Find eligible closed orders: delivered, cancelled, returned
    const findOrdersSql = `
      SELECT id
      FROM orders
      WHERE status IN ('delivered', 'cancelled', 'returned')
        AND updated_at < CURRENT_TIMESTAMP - ($1 || ' days')::interval;
    `;
    const ordersToArchiveRes = await txQuery(findOrdersSql, [retentionDays]);
    const orderIds = ordersToArchiveRes.rows.map((r) => r.id);

    let archivedOrdersCount = 0;
    if (orderIds.length > 0) {
      // Archive order items
      await txQuery(
        `INSERT INTO order_items_archive (id, order_id, variant_id, product_name_snapshot, sku, unit_price, quantity, line_total, created_at, updated_at, archived_at)
         SELECT id, order_id, variant_id, product_name_snapshot, sku, unit_price, quantity, line_total, created_at, updated_at, CURRENT_TIMESTAMP
         FROM order_items
         WHERE order_id = ANY($1);`,
        [orderIds]
      );

      // Archive orders
      await txQuery(
        `INSERT INTO orders_archive (id, order_number, user_id, status, payment_status, subtotal, discount, shipping_fee, tax, total, address_snapshot, created_at, updated_at, archived_at)
         SELECT id, order_number, user_id, status, payment_status, subtotal, discount, shipping_fee, tax, total, address_snapshot, created_at, updated_at, CURRENT_TIMESTAMP
         FROM orders
         WHERE id = ANY($1);`,
        [orderIds]
      );

      // Delete orders from active table (cascades to order_items, payments, status history)
      const delOrdersRes = await txQuery(
        `DELETE FROM orders WHERE id = ANY($1) RETURNING id;`,
        [orderIds]
      );
      archivedOrdersCount = delOrdersRes.rows.length;
    }

    logger.info(
      { archivedEventsCount, archivedOrdersCount, retentionDays },
      'Retention archival completed successfully'
    );

    return {
      archivedEventsCount,
      archivedOrdersCount,
    };
  });
}

/**
 * Start background retention archival job if enabled by environment configuration
 */
export function startRetentionJob() {
  if (task) return task;

  if (!env.ENABLE_RETENTION_JOB) {
    logger.info('Retention archival job is disabled by default via ENABLE_RETENTION_JOB flag');
    return null;
  }

  // Schedule to run daily at 03:00 AM: '0 3 * * *'
  task = cron.schedule('0 3 * * *', async () => {
    try {
      logger.info('Executing scheduled daily retention archival job...');
      await runRetentionArchival({ days: env.RETENTION_DAYS });
    } catch (err) {
      logger.error({ error: err.message }, 'Failed during scheduled retention archival job');
    }
  });

  logger.info(
    { retentionDays: env.RETENTION_DAYS },
    'Scheduled retention archival job started (runs daily at 03:00 AM)'
  );
  return task;
}

/**
 * Stop retention archival job
 */
export function stopRetentionJob() {
  if (task) {
    task.stop();
    task = null;
    logger.info('Stopped retention archival job');
  }
}

export default {
  runRetentionArchival,
  startRetentionJob,
  stopRetentionJob,
};
