import { AppError } from '../utils/errors.js';
import { errorResponse } from '../utils/response.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known AppError
  if (err instanceof AppError) {
    logger.warn(
      {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        path: req.originalUrl,
        method: req.method,
      },
      'Application error'
    );

    return errorResponse(res, err.message, err.statusCode, err.code, err.details);
  }

  // Handle PostgreSQL specific errors
  if (err.code === '23505') {
    // Unique violation
    return errorResponse(
      res,
      'A record with this identifier already exists',
      409,
      'DUPLICATE_RESOURCE'
    );
  }

  if (err.code === '23503') {
    // Foreign key violation
    return errorResponse(res, 'Referenced record does not exist', 400, 'FOREIGN_KEY_VIOLATION');
  }

  // Unhandled / 500 errors
  logger.error(
    {
      err: {
        message: err.message,
        stack: env.NODE_ENV === 'production' ? undefined : err.stack,
      },
      path: req.originalUrl,
      method: req.method,
    },
    'Unhandled server error'
  );

  const message =
    env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message;
  return errorResponse(res, message, 500, 'INTERNAL_SERVER_ERROR');
};
