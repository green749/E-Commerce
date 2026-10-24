import { Router } from 'express';
import { cartController } from '../controllers/cart.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  addToCartSchema,
  updateCartItemSchema,
  applyCouponSchema,
} from '../validators/cart.validator.js';

const router = Router();

// All cart endpoints support optional authentication (guests + logged-in users)
router.use(optionalAuth);

// Active cart
router.get('/', cartController.getCart);
router.delete('/', cartController.clearCart);

// Cart line items
router.post('/items', validate(addToCartSchema), cartController.addItem);
router.patch('/items/:id', validate(updateCartItemSchema), cartController.updateItem);
router.delete('/items/:id', cartController.removeItem);

// Coupon management
router.post('/coupon', validate(applyCouponSchema), cartController.applyCoupon);
router.delete('/coupon', cartController.removeCoupon);

export default router;
