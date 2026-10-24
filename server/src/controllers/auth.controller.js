import { authService } from '../services/auth.service.js';
import { cartService } from '../services/cart.service.js';
import { successResponse } from '../utils/response.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const COOKIE_NAME = 'refreshToken';
const isCrossSite =
  env.NODE_ENV === 'production' ||
  Boolean(process.env.RENDER) ||
  process.env.COOKIE_CROSS_SITE === 'true';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isCrossSite || env.NODE_ENV === 'production',
  sameSite: isCrossSite ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const authController = {
  /**
   * Helper to set refresh token cookie
   */
  setCookie(res, token) {
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  },

  /**
   * Helper to clear refresh token cookie
   */
  clearCookie(res) {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  },

  /**
   * Register customer
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      authController.setCookie(res, result.refreshToken);

      const guestSessionId =
        req.cookies?.session_id ||
        req.cookies?.cartSessionId ||
        req.headers['x-session-id'] ||
        req.body?.session_id;

      if (guestSessionId) {
        try {
          await cartService.mergeGuestCartOnLogin(result.user.id, guestSessionId);
        } catch (mergeErr) {
          logger.warn({ error: mergeErr.message }, 'Failed to merge guest cart on register');
        }
      }

      return successResponse(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        201
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * Login user
   */
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      authController.setCookie(res, result.refreshToken);

      const guestSessionId =
        req.cookies?.session_id ||
        req.cookies?.cartSessionId ||
        req.headers['x-session-id'] ||
        req.body?.session_id;

      if (guestSessionId) {
        try {
          await cartService.mergeGuestCartOnLogin(result.user.id, guestSessionId);
        } catch (mergeErr) {
          logger.warn({ error: mergeErr.message }, 'Failed to merge guest cart on login');
        }
      }

      return successResponse(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        200
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * Refresh access token
   */
  async refresh(req, res, next) {
    try {
      const token = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
      const result = await authService.refresh(token);
      authController.setCookie(res, result.refreshToken);

      return successResponse(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        200
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * Logout user
   */
  async logout(req, res, next) {
    try {
      const token = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
      await authService.logout(token);
      authController.clearCookie(res);

      return successResponse(res, { message: 'Successfully logged out' }, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Request password reset link
   */
  async forgotPassword(req, res, next) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Submit password reset
   */
  async resetPassword(req, res, next) {
    try {
      const result = await authService.resetPassword(req.body);
      authController.clearCookie(res);
      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
};
