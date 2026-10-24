import cron from 'node-cron';
import { orderService } from '../services/order.service.js';
import { logger } from '../config/logger.js';

let task = null;

/**
 * Background job to release expired inventory reservations
 * and cancel stale pending_payment orders every minute
 */
export function startReservationCleanupJob() {
  if (task) return task;

  // Run every minute: '* * * * *'
  task = cron.schedule('* * * * *', async () => {
    try {
      logger.debug('Running scheduled reservation cleanup job...');
      const result = await orderService.releaseExpiredReservations();
      if (result.releasedCount > 0) {
        logger.info(
          {
            releasedCount: result.releasedCount,
            cancelledOrders: result.cancelledOrders,
          },
          'Released expired inventory reservations'
        );
      }
    } catch (err) {
      logger.error({ error: err.message }, 'Failed during scheduled reservation cleanup');
    }
  });

  logger.info('Scheduled reservation cleanup job initialized (runs every minute)');
  return task;
}

export function stopReservationCleanupJob() {
  if (task) {
    task.stop();
    task = null;
    logger.info('Stopped reservation cleanup job');
  }
}
