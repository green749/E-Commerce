import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cancelOrderSchema, requestReturnSchema } from '../validators/order.validator.js';

const router = Router();

// Customer order routes require authentication
router.use(authenticate);

// GET /api/orders - list user orders
router.get('/', orderController.getCustomerOrders);

// GET /api/orders/:orderNumber - get single order details
router.get('/:orderNumber', orderController.getOrderByNumber);

// POST /api/orders/:orderNumber/cancel - cancel order before shipping
router.post('/:orderNumber/cancel', validate(cancelOrderSchema), orderController.cancelOrder);

// POST /api/orders/:orderNumber/return - request return for delivered order within 7 days
router.post('/:orderNumber/return', validate(requestReturnSchema), orderController.requestReturn);

export default router;
