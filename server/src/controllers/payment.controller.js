import { orderService } from '../services/order.service.js';
import { successResponse } from '../utils/response.js';

export const paymentController = {
  /**
   * POST /api/payments/verify
   * Verify frontend Razorpay signature and mark order 'placed'
   */
  async verifyPayment(req, res, next) {
    try {
      const { order_id, order_number, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

      const result = await orderService.verifyPayment({
        orderId: order_id,
        orderNumber: order_number,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        userId: req.user?.id || null,
      });

      return successResponse(res, result, 200);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/payments/webhook
   * Verify Razorpay webhook signature and idempotently handle payment.captured and payment.failed
   */
  async webhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const rawBody = req.rawBody || JSON.stringify(req.body);

      const result = await orderService.handleWebhook(rawBody, signature, req.body);
      return res.status(200).json({ success: true, result });
    } catch (err) {
      next(err);
    }
  },
};
