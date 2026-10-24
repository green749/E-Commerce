import crypto from 'crypto';
import { orderRepository } from '../repositories/order.repository.js';
import { reservationRepository } from '../repositories/reservation.repository.js';
import { cartRepository } from '../repositories/cart.repository.js';
import { addressRepository } from '../repositories/address.repository.js';
import { couponRepository } from '../repositories/coupon.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { paymentService } from './payment.service.js';
import { withTransaction } from '../db/index.js';
import { env } from '../config/env.js';
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from '../utils/errors.js';

export const FREE_SHIPPING_THRESHOLD = 99900; // ₹999
export const STANDARD_SHIPPING_FEE = 9900; // ₹99
export const EXPRESS_SHIPPING_FEE = 19900; // ₹199
export const TAX_RATE = 0.18; // 18% GST
export const RETURN_WINDOW_DAYS = 7;

export const orderService = {
  /**
   * Start Checkout Flow:
   * Re-validate cart, lock inventory rows with SELECT ... FOR UPDATE,
   * create 15-minute reservations, snapshot order & items, and create Razorpay order
   * All inside ONE single database transaction
   * @param {Object} params
   * @returns {Promise<{ order: Object, razorpay: Object }>}
   */
  async startCheckout({ userId, addressId, shippingOption = 'standard', idempotencyKey = null }) {
    if (!userId) {
      throw new ForbiddenError('Authentication required to checkout');
    }
    if (!addressId) {
      throw new BadRequestError('Delivery address is required');
    }

    // 1. Idempotency Check: Return existing order if key was already processed
    if (idempotencyKey) {
      const existingOrder = await orderRepository.findByIdempotencyKey(idempotencyKey);
      if (existingOrder) {
        const fullOrder = await orderRepository.findWithDetails(existingOrder.order_number, userId);
        const payments = await paymentRepository.findByOrderId(existingOrder.id);
        const latestPayment = payments[0];

        return {
          order: fullOrder,
          razorpay: {
            key: env.RAZORPAY_KEY_ID,
            order_id: latestPayment?.gateway_order_id || null,
            amount: Number(existingOrder.total),
            currency: 'INR',
          },
          idempotentReplay: true,
        };
      }
    }

    // 2. Validate Address belongs to user
    const address = await addressRepository.findById(addressId);
    if (!address || address.user_id !== userId) {
      throw new NotFoundError('Delivery address not found');
    }

    // 3. Validate user cart before opening transaction
    const cart = await cartRepository.findActiveByUserId(userId);
    if (!cart) {
      throw new BadRequestError('Active cart not found');
    }

    const cartItems = await cartRepository.getItems(cart.id);
    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestError('Cannot start checkout with an empty cart');
    }

    // 4. Execute Checkout within ONE Database Transaction
    return await withTransaction(async (tx) => {
      // b) Lock inventory rows for each item with SELECT ... FOR UPDATE & check stock
      for (const item of cartItems) {
        const lockedInv = await reservationRepository.lockVariantForUpdate(item.variant_id, tx);
        if (!lockedInv || !lockedInv.is_active || lockedInv.deleted_at) {
          throw new BadRequestError(
            `Product "${item.product_name}" is discontinued or no longer available`
          );
        }

        const available = lockedInv.available;
        if (available < item.quantity) {
          throw new ConflictError(
            `Insufficient stock for "${item.product_name} (${item.sku})". Requested: ${item.quantity}, Available: ${available}`
          );
        }
      }

      // c) Compute Pricing
      let subtotal = 0;
      for (const item of cartItems) {
        subtotal += Number(item.price) * item.quantity;
      }

      // Process coupon
      let discount = 0;
      let appliedCouponId = null;
      if (cart.coupon_id) {
        const coupon = await couponRepository.findById(cart.coupon_id);
        const now = new Date();
        if (
          coupon &&
          coupon.is_active &&
          now >= new Date(coupon.starts_at) &&
          now <= new Date(coupon.ends_at) &&
          (!coupon.usage_limit || coupon.used_count < coupon.usage_limit) &&
          subtotal >= Number(coupon.min_order_amount)
        ) {
          appliedCouponId = coupon.id;
          if (coupon.type === 'percent') {
            const rawDiscount = Math.round((subtotal * Number(coupon.value)) / 100);
            discount = coupon.max_discount
              ? Math.min(Number(coupon.max_discount), rawDiscount)
              : rawDiscount;
          } else {
            discount = Math.min(subtotal, Number(coupon.value));
          }
        }
      }

      const taxableBase = Math.max(0, subtotal - discount);

      // Shipping calculation
      let shipping_fee = 0;
      if (shippingOption === 'express') {
        shipping_fee = EXPRESS_SHIPPING_FEE;
      } else if (taxableBase >= FREE_SHIPPING_THRESHOLD) {
        shipping_fee = 0;
      } else {
        shipping_fee = STANDARD_SHIPPING_FEE;
      }

      // Tax calculation
      const tax = Math.round(taxableBase * TAX_RATE);
      const total = taxableBase + shipping_fee + tax;

      // d) Create Order
      const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const order = await orderRepository.create(
        {
          order_number: orderNumber,
          user_id: userId,
          address_snapshot: {
            full_name: address.full_name,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            shipping_option: shippingOption,
          },
          subtotal,
          discount,
          shipping_fee,
          tax,
          total,
          coupon_id: appliedCouponId,
          status: 'pending_payment',
          payment_status: 'unpaid',
          idempotency_key: idempotencyKey,
        },
        tx
      );

      // e) Snapshot Order Items
      const formattedItems = cartItems.map((ci) => ({
        variant_id: ci.variant_id,
        name: ci.product_name,
        sku: ci.sku,
        price: Number(ci.price),
        quantity: ci.quantity,
        line_total: Number(ci.price) * ci.quantity,
      }));
      await orderRepository.createItems(order.id, formattedItems, tx);

      // f) Create 15-minute inventory reservations
      for (const item of cartItems) {
        await reservationRepository.createReservation(
          {
            variantId: item.variant_id,
            orderId: order.id,
            cartId: cart.id,
            quantity: item.quantity,
            durationMinutes: 15,
          },
          tx
        );
      }

      // g) Status History
      await orderRepository.addStatusHistory(
        {
          order_id: order.id,
          to_status: 'pending_payment',
          changed_by: userId,
          note: 'Checkout started, inventory reserved for 15 minutes',
        },
        tx
      );

      // h) Create Razorpay Order
      const rzpOrder = await paymentService.createOrder({
        amount: total,
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          order_id: order.id,
          order_number: orderNumber,
          user_id: userId,
        },
      });

      // i) Save Payment record with gateway_order_id
      await paymentRepository.create(
        {
          order_id: order.id,
          gateway: 'razorpay',
          gateway_order_id: rzpOrder.id,
          amount: total,
          status: 'created',
          raw_payload: rzpOrder,
        },
        tx
      );

      return {
        order: {
          ...order,
          subtotal,
          discount,
          shipping_fee,
          tax,
          total,
          items: formattedItems,
        },
        razorpay: {
          key: env.RAZORPAY_KEY_ID,
          order_id: rzpOrder.id,
          amount: total,
          currency: 'INR',
        },
      };
    });
  },

  /**
   * Complete Order on Payment Success (Idempotent for both Verify & Webhook)
   * Commits inventory reservations, marks order placed, increments coupon used_count,
   * clears cart, and records purchase event
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async processPaymentSuccess({
    orderId = null,
    gatewayOrderId = null,
    gatewayPaymentId,
    rawPayload = {},
    userId = null,
  }) {
    if (!gatewayPaymentId) {
      throw new BadRequestError('Gateway payment ID is required');
    }

    // Resolve order by orderId or gatewayOrderId
    let order = null;
    if (orderId) {
      order = await orderRepository.findById(orderId);
    } else if (gatewayOrderId) {
      const payment = await paymentRepository.findByGatewayOrderId(gatewayOrderId);
      if (payment) {
        order = await orderRepository.findById(payment.order_id);
      }
    }

    if (!order) {
      throw new NotFoundError('Order matching payment not found');
    }

    // IDEMPOTENCY CHECK:
    // If order is already placed/packed/shipped/delivered, return immediately without duplicate updates
    if (
      order.status === 'placed' ||
      order.status === 'packed' ||
      order.status === 'shipped' ||
      order.status === 'delivered'
    ) {
      return {
        alreadyProcessed: true,
        order: await orderRepository.findWithDetails(order.order_number),
      };
    }

    // Execute inside ONE database transaction
    await withTransaction(async (tx) => {
      // 1. Commit inventory reservations (deduct quantity_on_hand, reduce reserved)
      await reservationRepository.commitReservationsForOrder(order.id, tx);

      // 2. Increment coupon used_count if a coupon was used
      if (order.coupon_id) {
        await tx(
          `UPDATE coupons
           SET used_count = used_count + 1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1;`,
          [order.coupon_id]
        );
      }

      // 3. Mark Order as 'placed' and 'paid'
      await orderRepository.updateStatus(
        order.id,
        {
          status: 'placed',
          payment_status: 'paid',
          changed_by: userId || order.user_id,
          note: `Payment captured successfully via Razorpay (ID: ${gatewayPaymentId})`,
        },
        tx
      );

      // 4. Update or Create Payment record
      const existingPayment = await paymentRepository.findByGatewayPaymentId(gatewayPaymentId, tx);
      if (existingPayment) {
        await paymentRepository.update(
          existingPayment.id,
          {
            status: 'captured',
            raw_payload: rawPayload,
          },
          tx
        );
      } else {
        const orderPayment = (await paymentRepository.findByOrderId(order.id, tx))[0];
        if (orderPayment) {
          await paymentRepository.update(
            orderPayment.id,
            {
              status: 'captured',
              gateway_payment_id: gatewayPaymentId,
              raw_payload: rawPayload,
            },
            tx
          );
        } else {
          await paymentRepository.create(
            {
              order_id: order.id,
              gateway: 'razorpay',
              gateway_order_id: gatewayOrderId,
              gateway_payment_id: gatewayPaymentId,
              amount: Number(order.total),
              status: 'captured',
              raw_payload: rawPayload,
            },
            tx
          );
        }
      }

      // 5. Clear customer's active cart
      if (order.user_id) {
        const cart = await cartRepository.findActiveByUserId(order.user_id);
        if (cart) {
          await cartRepository.clearItems(cart.id);
          await cartRepository.updateCoupon(cart.id, null);
        }
      }

      // 6. Record purchase event in events table
      await eventRepository.record({
        userId: order.user_id,
        eventType: 'purchase',
        properties: {
          order_id: order.id,
          order_number: order.order_number,
          total: Number(order.total),
          subtotal: Number(order.subtotal),
          discount: Number(order.discount),
          shipping_fee: Number(order.shipping_fee),
          tax: Number(order.tax),
        },
      });
    });

    const fullOrder = await orderRepository.findWithDetails(order.order_number);
    return {
      alreadyProcessed: false,
      order: fullOrder,
    };
  },

  /**
   * Complete Order on Payment Failure
   * Releases held reservations and marks order cancelled / payment failed
   * @param {Object} params
   * @returns {Promise<void>}
   */
  async processPaymentFailure({
    orderId = null,
    gatewayOrderId = null,
    gatewayPaymentId = null,
    rawPayload = {},
  }) {
    let order = null;
    if (orderId) {
      order = await orderRepository.findById(orderId);
    } else if (gatewayOrderId) {
      const payment = await paymentRepository.findByGatewayOrderId(gatewayOrderId);
      if (payment) {
        order = await orderRepository.findById(payment.order_id);
      }
    }

    if (!order) return;

    // Do not cancel if already paid or completed
    if (order.status !== 'pending_payment') return;

    await withTransaction(async (tx) => {
      // 1. Release held reservations
      await reservationRepository.releaseReservationsForOrder(order.id, tx);

      // 2. Mark order cancelled
      await orderRepository.updateStatus(
        order.id,
        {
          status: 'cancelled',
          payment_status: 'failed',
          note: `Payment failed at gateway (${gatewayPaymentId || 'unspecified'})`,
        },
        tx
      );

      // 3. Record failed payment
      if (gatewayPaymentId) {
        await paymentRepository.create(
          {
            order_id: order.id,
            gateway: 'razorpay',
            gateway_order_id: gatewayOrderId,
            gateway_payment_id: gatewayPaymentId,
            amount: Number(order.total),
            status: 'failed',
            raw_payload: rawPayload,
          },
          tx
        );
      }
    });
  },

  /**
   * Verify Razorpay Payment from frontend
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async verifyPayment({
    orderId = null,
    orderNumber = null,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId = null,
  }) {
    const isValid = paymentService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      throw new BadRequestError('Invalid payment signature verification failed');
    }

    let targetOrderId = orderId;
    if (!targetOrderId && orderNumber) {
      const order = await orderRepository.findByOrderNumber(orderNumber);
      targetOrderId = order?.id;
    }

    return await this.processPaymentSuccess({
      orderId: targetOrderId,
      gatewayOrderId: razorpay_order_id,
      gatewayPaymentId: razorpay_payment_id,
      rawPayload: { razorpay_order_id, razorpay_payment_id, razorpay_signature },
      userId,
    });
  },

  /**
   * Handle Razorpay Webhook Events (Idempotent)
   * @param {Buffer|string} rawBody
   * @param {string} signature
   * @param {Object} event
   * @returns {Promise<Object>}
   */
  async handleWebhook(rawBody, signature, event) {
    const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new BadRequestError('Invalid webhook signature');
    }

    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;

    if (!paymentEntity) {
      return { status: 'ignored', reason: 'No payment entity in webhook payload' };
    }

    const gatewayPaymentId = paymentEntity.id;
    const gatewayOrderId = paymentEntity.order_id;

    if (eventType === 'payment.captured') {
      const result = await this.processPaymentSuccess({
        gatewayOrderId,
        gatewayPaymentId,
        rawPayload: event,
      });
      return {
        status: result.alreadyProcessed ? 'already_processed' : 'captured',
        orderNumber: result.order?.order_number,
      };
    }

    if (eventType === 'payment.failed') {
      await this.processPaymentFailure({
        gatewayOrderId,
        gatewayPaymentId,
        rawPayload: event,
      });
      return { status: 'failed_recorded' };
    }

    return { status: 'unhandled_event', event: eventType };
  },

  /**
   * Customer cancels an order before shipping
   * Releases stock (adds to on_hand if placed/packed, releases held if pending)
   * and starts refund if already paid
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async cancelOrder({ orderNumber, userId, reason = 'Cancelled by customer' }) {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.user_id !== userId) {
      throw new ForbiddenError('You can only cancel your own orders');
    }

    const allowedToCancel = ['pending_payment', 'placed', 'packed'];
    if (!allowedToCancel.includes(order.status)) {
      throw new BadRequestError(
        `Order cannot be cancelled in "${order.status}" status. Cancellations are only allowed before shipping.`
      );
    }

    return await withTransaction(async (tx) => {
      // 1. Release Stock
      if (order.status === 'pending_payment') {
        await reservationRepository.releaseReservationsForOrder(order.id, tx);
      } else {
        // Order was placed or packed, inventory was already committed: restore quantity_on_hand
        const items = await tx(
          `SELECT variant_id, quantity FROM order_items WHERE order_id = $1;`,
          [order.id]
        );
        for (const item of items.rows) {
          if (item.variant_id) {
            await reservationRepository.restoreCommittedStock(item.variant_id, item.quantity, tx);
          }
        }
      }

      // 2. If payment was captured, initiate refund
      let newPaymentStatus = order.payment_status;
      if (order.payment_status === 'paid') {
        const payments = await paymentRepository.findByOrderId(order.id, tx);
        const captured = payments.find((p) => p.status === 'captured');
        if (captured?.gateway_payment_id) {
          await paymentService.refundPayment({
            paymentId: captured.gateway_payment_id,
            amount: Number(order.total),
            notes: { order_number: order.order_number, reason },
          });
        }
        newPaymentStatus = 'refunded';
      }

      // 3. Update Order status
      const updated = await orderRepository.updateStatus(
        order.id,
        {
          status: 'cancelled',
          payment_status: newPaymentStatus,
          changed_by: userId,
          note: reason,
        },
        tx
      );

      return updated;
    });
  },

  /**
   * Customer requests a return for a delivered order within 7 days
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async requestReturn({ orderNumber, userId, orderItemId, reason }) {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.user_id !== userId) {
      throw new ForbiddenError('You can only request returns for your own orders');
    }

    if (order.status !== 'delivered') {
      throw new BadRequestError('Returns are only allowed for delivered orders');
    }

    // Check 7-day return window from delivery date
    const historyRes = await orderRepository.findWithDetails(orderNumber);
    const deliveredEntry = historyRes.timeline?.find((t) => t.to_status === 'delivered');
    const deliveredAt = deliveredEntry
      ? new Date(deliveredEntry.created_at)
      : new Date(order.updated_at);
    const daysSinceDelivery = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
      throw new BadRequestError(
        `Return window of ${RETURN_WINDOW_DAYS} days has expired. Order was delivered on ${deliveredAt.toLocaleDateString()}.`
      );
    }

    const orderItem = await orderRepository.findOrderItemById(orderItemId);
    if (!orderItem || orderItem.order_id !== order.id) {
      throw new NotFoundError('Order item not found on this order');
    }

    const returnRecord = await orderRepository.createReturn({
      order_item_id: orderItemId,
      reason,
      refund_amount: Number(orderItem.line_total),
      status: 'requested',
    });

    return returnRecord;
  },

  /**
   * Admin transitions order status:
   * Valid transitions: placed -> packed -> shipped -> delivered
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async updateOrderStatusByAdmin({ orderId, status, adminUserId, note = null }) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const validTransitions = {
      placed: ['packed'],
      packed: ['shipped'],
      shipped: ['delivered'],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestError(
        `Invalid status transition from "${order.status}" to "${status}". Allowed next status: ${
          allowed.length > 0 ? allowed.join(', ') : 'none (terminal status)'
        }`
      );
    }

    const updated = await orderRepository.updateStatus(order.id, {
      status,
      changed_by: adminUserId,
      note: note || `Status updated to ${status} by admin`,
    });

    return updated;
  },

  /**
   * Admin manages return: approve, reject, or refund
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async handleReturnAction({ returnId, action, reason = null, adminUserId }) {
    const returnRecord = await orderRepository.findReturnById(returnId);
    if (!returnRecord) {
      throw new NotFoundError('Return request not found');
    }

    if (!['approve', 'reject', 'refund'].includes(action)) {
      throw new BadRequestError('Invalid return action. Allowed: approve, reject, refund');
    }

    return await withTransaction(async (tx) => {
      let nextStatus = returnRecord.status;

      if (action === 'approve') {
        nextStatus = 'approved';
      } else if (action === 'reject') {
        nextStatus = 'rejected';
      } else if (action === 'refund') {
        // Process refund through payment gateway
        if (returnRecord.gateway_payment_id) {
          await paymentService.refundPayment({
            paymentId: returnRecord.gateway_payment_id,
            amount: Number(returnRecord.refund_amount),
            notes: { return_id: returnRecord.id, reason },
          });
        }

        // Restore returned inventory
        if (returnRecord.variant_id) {
          await reservationRepository.restoreCommittedStock(
            returnRecord.variant_id,
            returnRecord.item_quantity,
            tx
          );
        }

        nextStatus = 'refunded';
      }

      const updated = await orderRepository.updateReturn(
        returnRecord.id,
        { status: nextStatus },
        tx
      );

      // Log note in order status history
      await orderRepository.addStatusHistory(
        {
          order_id: returnRecord.order_id,
          to_status: returnRecord.order_status || 'delivered',
          changed_by: adminUserId,
          note: `Return #${returnRecord.id} ${action}ed by admin. ${reason || ''}`.trim(),
        },
        tx
      );

      return updated;
    });
  },

  /**
   * Background Worker Job:
   * Releases all expired held reservations and cancels stale pending orders
   * @returns {Promise<{ releasedCount: number, cancelledOrders: Array }>}
   */
  async releaseExpiredReservations() {
    return await reservationRepository.releaseExpiredReservations();
  },
};
