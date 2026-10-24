import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let razorpayClient = null;

function getRazorpayClient() {
  if (!razorpayClient && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    razorpayClient = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
}

/**
 * Payment Service wrapping Razorpay in test mode
 * Abstracted so gateway can be swapped later without touching core order logic
 */
export const paymentService = {
  /**
   * Create gateway order
   * @param {Object} params
   * @param {number} params.amount - in paise
   * @param {string} params.currency - default 'INR'
   * @param {string} params.receipt - internal order number
   * @param {Object} params.notes - metadata
   * @returns {Promise<{ id: string, amount: number, currency: string, receipt: string }>}
   */
  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    const client = getRazorpayClient();

    // Use simulated order in test environment or if client is unavailable
    if (env.NODE_ENV === 'test' || !client) {
      const mockOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
      logger.debug({ mockOrderId, amount, receipt }, 'Generated simulated Razorpay order');
      return {
        id: mockOrderId,
        amount,
        currency,
        receipt,
        status: 'created',
        notes,
      };
    }

    try {
      const order = await client.orders.create({
        amount,
        currency,
        receipt,
        notes,
      });
      return order;
    } catch (err) {
      logger.warn(
        { error: err.message },
        'Razorpay order creation failed, falling back to simulated order in non-production'
      );
      if (env.NODE_ENV !== 'production') {
        const fallbackOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
        return {
          id: fallbackOrderId,
          amount,
          currency,
          receipt,
          status: 'created',
          notes,
        };
      }
      throw err;
    }
  },

  /**
   * Verify Razorpay checkout signature from frontend
   * Formula: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
   * @param {Object} params
   * @param {string} params.razorpay_order_id
   * @param {string} params.razorpay_payment_id
   * @param {string} params.razorpay_signature
   * @returns {boolean}
   */
  verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return false;
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature.length !== razorpay_signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(razorpay_signature, 'utf-8')
    );
  },

  /**
   * Helper to generate a valid checkout signature (useful in integration tests)
   */
  generateTestSignature(orderId, paymentId) {
    return crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  },

  /**
   * Verify Razorpay Webhook signature
   * Formula: HMAC_SHA256(raw_body, webhook_secret)
   * @param {Buffer|string} rawBody
   * @param {string} signature
   * @returns {boolean}
   */
  verifyWebhookSignature(rawBody, signature) {
    if (!rawBody || !signature) {
      return false;
    }

    const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (expectedSignature.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  },

  /**
   * Helper to generate a valid webhook signature (useful in integration tests)
   */
  generateWebhookSignature(payloadString) {
    return crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(Buffer.from(payloadString))
      .digest('hex');
  },

  /**
   * Initiate a refund for an order payment
   * @param {Object} params
   * @param {string} params.paymentId
   * @param {number} params.amount - in paise
   * @param {string} params.notes
   * @returns {Promise<{ id: string, amount: number, status: string }>}
   */
  async refundPayment({ paymentId, amount, notes = {} }) {
    const client = getRazorpayClient();

    if (env.NODE_ENV === 'test' || !client) {
      const mockRefundId = `rfnd_${crypto.randomBytes(8).toString('hex')}`;
      logger.info({ mockRefundId, paymentId, amount }, 'Processed simulated refund');
      return {
        id: mockRefundId,
        payment_id: paymentId,
        amount,
        status: 'processed',
        notes,
      };
    }

    try {
      return await client.payments.refund(paymentId, {
        amount,
        notes,
      });
    } catch (err) {
      logger.warn(
        { error: err.message, paymentId },
        'Razorpay refund API failed, falling back to simulated refund in development'
      );
      if (env.NODE_ENV !== 'production') {
        const mockRefundId = `rfnd_${crypto.randomBytes(8).toString('hex')}`;
        return {
          id: mockRefundId,
          payment_id: paymentId,
          amount,
          status: 'processed',
          notes,
        };
      }
      throw err;
    }
  },
};
