import crypto from 'crypto';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Constant-time string equality check to prevent timing attacks
 */
function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Middleware to protect /api/internal endpoints using INTERNAL_API_KEY
 * Accepts ONLY X-Internal-Key header (case-insensitive).
 * Rejects all other headers (x-api-key, Authorization, etc.)
 * Compares in constant time, returns a generic 401, never logs the key.
 */
export const requireInternalKey = (req, res, next) => {
  const headerKey = req.headers['x-internal-key'];

  if (
    !headerKey ||
    typeof headerKey !== 'string' ||
    !env.INTERNAL_API_KEY ||
    !timingSafeEqualStr(headerKey, env.INTERNAL_API_KEY)
  ) {
    return next(new UnauthorizedError('Unauthorized'));
  }

  next();
};
