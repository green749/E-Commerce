import { Router } from 'express';
import { checkoutController } from '../controllers/checkout.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { startCheckoutSchema } from '../validators/order.validator.js';

const router = Router();

// POST /api/checkout/start
router.post(
  '/start',
  authenticate,
  validate(startCheckoutSchema),
  checkoutController.startCheckout
);

export default router;
