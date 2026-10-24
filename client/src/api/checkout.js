import apiClient from './axios.js';

export const checkoutApi = {
  /**
   * Start Checkout
   * Creates 15-minute stock reservation, locks inventory, creates order and Razorpay order
   * @param {Object} params
   * @param {string} params.addressId
   * @param {'standard'|'express'} params.shippingOption
   * @param {string} [params.idempotencyKey]
   * @returns {Promise<{ order: Object, razorpay: Object, idempotentReplay?: boolean }>}
   */
  startCheckout: async ({ addressId, shippingOption = 'standard', idempotencyKey = null }) => {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    return apiClient.post(
      '/checkout/start',
      {
        address_id: addressId,
        shipping_option: shippingOption,
      },
      { headers }
    );
  },

  /**
   * Verify Razorpay Payment Signature
   * @param {Object} params
   * @param {string} [params.orderId]
   * @param {string} [params.orderNumber]
   * @param {string} params.razorpayOrderId
   * @param {string} params.razorpayPaymentId
   * @param {string} params.razorpaySignature
   * @returns {Promise<{ order: Object, payment: Object }>}
   */
  verifyPayment: async ({
    orderId,
    orderNumber,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }) => {
    return apiClient.post('/payments/verify', {
      order_id: orderId,
      order_number: orderNumber,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    });
  },
};

export default checkoutApi;
