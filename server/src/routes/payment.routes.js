import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { verifyPaymentSchema } from '../validators/order.validator.js';

const router = Router();

// POST /api/payments/verify - verify signature from frontend checkout
router.post(
  '/verify',
  optionalAuth,
  validate(verifyPaymentSchema),
  paymentController.verifyPayment
);

// POST /api/payments/webhook - Razorpay webhook notification
router.post('/webhook', paymentController.webhook);

export default router;
