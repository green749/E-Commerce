import { orderService } from '../services/order.service.js';
import { successResponse } from '../utils/response.js';

export const checkoutController = {
  /**
   * POST /api/checkout/start
   * Re-validate cart, lock inventory with FOR UPDATE, reserve stock (15 min),
   * create pending_payment order, snapshot items/address, create Razorpay order
   */
  async startCheckout(req, res, next) {
    try {
      const userId = req.user.id;
      const { address_id, shipping_option = 'standard' } = req.body;
      const idempotencyKey =
        req.headers['idempotency-key'] ||
        req.headers['x-idempotency-key'] ||
        req.body?.idempotency_key ||
        null;

      const result = await orderService.startCheckout({
        userId,
        addressId: address_id,
        shippingOption: shipping_option,
        idempotencyKey,
      });

      const statusCode = result.idempotentReplay ? 200 : 201;
      return successResponse(res, result, statusCode);
    } catch (err) {
      next(err);
    }
  },
};
