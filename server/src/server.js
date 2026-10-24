import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initDatabase } from './db/index.js';
import {
  startReservationCleanupJob,
  stopReservationCleanupJob,
} from './jobs/reservationCleanup.job.js';
import {
  startRetentionJob,
  stopRetentionJob,
} from './jobs/retention.job.js';

async function bootstrap() {
  try {
    logger.info('Initializing database connection...');
    await initDatabase();

    // Start background jobs
    if (env.NODE_ENV !== 'test') {
      startReservationCleanupJob();
      startRetentionJob();
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`Server is running on http://localhost:${env.PORT}`);
      logger.info(`Health check available at: http://localhost:${env.PORT}/api/health`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });

    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, gracefully shutting down...`);
      stopReservationCleanupJob();
      stopRetentionJob();
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forceful shutdown timeout expired');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, 'Server bootstrap failed');
    process.exit(1);
  }
}

bootstrap();
