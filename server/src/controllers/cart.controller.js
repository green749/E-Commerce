import crypto from 'crypto';
import { cartService } from '../services/cart.service.js';
import { successResponse } from '../utils/response.js';
import { env } from '../config/env.js';

const SESSION_COOKIE_NAME = 'session_id';
const isCrossSite =
  env.NODE_ENV === 'production' ||
  Boolean(process.env.RENDER) ||
  process.env.COOKIE_CROSS_SITE === 'true';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isCrossSite || env.NODE_ENV === 'production',
  sameSite: isCrossSite ? 'none' : 'lax',
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

/**
 * Extract or generate guest session ID and set cookie/headers
 */
function getOrCreateSessionId(req, res) {
  let sessionId =
    req.cookies?.session_id ||
    req.cookies?.cartSessionId ||
    req.headers['x-session-id'] ||
    req.body?.sessionId ||
    req.query?.sessionId;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie(SESSION_COOKIE_NAME, sessionId, COOKIE_OPTIONS);
  } else if (!req.cookies?.session_id) {
    res.cookie(SESSION_COOKIE_NAME, sessionId, COOKIE_OPTIONS);
  }

  res.setHeader('X-Session-Id', sessionId);
  return sessionId;
}

export const cartController = {
  /**
   * GET /api/cart
   * Retrieve active cart with line items, calculations, and warnings
   */
  async getCart(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const sessionId = getOrCreateSessionId(req, res);

      const cart = await cartService.getCart({ userId, sessionId });
      return successResponse(res, cart, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/cart/items
   * Add variant item to cart
   */
  async addItem(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const sessionId = getOrCreateSessionId(req, res);
      const { variant_id, quantity = 1 } = req.body;

      const cart = await cartService.addItem({
        userId,
        sessionId,
        variantId: variant_id,
        quantity: Number(quantity),
      });

      return successResponse(res, cart, 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/cart/items/:id
   * Update quantity of a cart line item
   */
  async updateItem(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const sessionId = getOrCreateSessionId(req, res);
      const { id } = req.params;
      const { quantity } = req.body;

      const cart = await cartService.updateItem({
        userId,
        sessionId,
        itemId: id,
        quantity: Number(quantity),
      });

      return successResponse(res, cart, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/cart/items/:id
   * Remove a line item from cart
   */
  async removeItem(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const sessionId = getOrCreateSessionId(req, res);
      const { id } = req.params;

      const cart = await cartService.removeItem({
        userId,
        sessionId,
        itemId: id,
      });

      return successResponse(res, cart, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/cart
   * Clear all items and coupon from active cart
   */
  async clearCart(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const sessionId = getOrCreateSessionId(req, res);

      const cart = await cartService.clearCart({ userId, sessionId });
      return successResponse(res, cart, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/cart/coupon
   * Apply a coupon code to the active cart
   */
  async applyCoupon(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const sessionId = getOrCreateSessionId(req, res);
      const { code } = req.body;

      const cart = await cartService.applyCoupon({
        userId,
        sessionId,
        code,
      });

      return successResponse(res, cart, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/cart/coupon
   * Remove applied coupon from active cart
   */
  async removeCoupon(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const sessionId = getOrCreateSessionId(req, res);

      const cart = await cartService.removeCoupon({ userId, sessionId });
      return successResponse(res, cart, 200);
    } catch (err) {
      next(err);
    }
  },
};
