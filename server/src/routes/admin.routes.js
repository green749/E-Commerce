import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { categoryController } from '../controllers/category.controller.js';
import { orderController } from '../controllers/order.controller.js';
import { adminController } from '../controllers/admin.controller.js';
import { couponController } from '../controllers/coupon.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  createCategorySchema,
  updateCategorySchema,
  adjustInventorySchema,
} from '../validators/catalog.validator.js';
import {
  updateOrderStatusSchema,
  handleReturnActionSchema,
} from '../validators/order.validator.js';
import {
  getCustomersSchema,
  getCustomerByIdSchema,
  getLowStockSchema,
} from '../validators/admin.validator.js';
import {
  createCouponSchema,
  updateCouponSchema,
} from '../validators/coupon.validator.js';

const router = Router();

// Enforce authentication & admin role across all /api/admin routes
router.use(authenticate, requireRole('admin'));

// Operational Admin Dashboard: Summary & Overview
router.get('/summary', adminController.getSummary);

// Operational Admin Dashboard: Customers
router.get('/customers', validate(getCustomersSchema, 'query'), adminController.getCustomers);
router.get(
  '/customers/:id',
  validate(getCustomerByIdSchema, 'params'),
  adminController.getCustomerById
);

// Operational Admin Dashboard: Low-Stock Inventory
router.get(
  '/inventory/low-stock',
  validate(getLowStockSchema, 'query'),
  adminController.getLowStock
);

// Admin: General Inventory with search and low-stock filter
router.get('/inventory', adminController.getInventory);

// Admin: Products
router.get('/products', productController.getAdminProducts);
router.post('/products', validate(createProductSchema), productController.createProduct);
router.patch('/products/:id', validate(updateProductSchema), productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Admin: Variants
router.post('/variants', validate(createVariantSchema), productController.createVariant);
router.patch('/variants/:id', validate(updateVariantSchema), productController.updateVariant);
router.delete('/variants/:id', productController.deleteVariant);

// Admin: Categories
router.post('/categories', validate(createCategorySchema), categoryController.create);
router.patch('/categories/:id', validate(updateCategorySchema), categoryController.update);
router.delete('/categories/:id', categoryController.delete);

// Admin: Inventory adjustment with audit reason
router.patch(
  '/inventory/:variantId',
  validate(adjustInventorySchema),
  productController.adjustInventory
);

// Admin: Orders
router.get('/orders', orderController.getAdminOrders);
router.patch(
  '/orders/:id/status',
  validate(updateOrderStatusSchema),
  orderController.updateAdminOrderStatus
);

// Admin: Returns
router.get('/returns', orderController.getAdminReturns);
router.patch('/returns/:id', validate(handleReturnActionSchema), orderController.handleAdminReturn);

// Admin: Promotional Coupons
router.get('/coupons', couponController.list);
router.post('/coupons', validate(createCouponSchema), couponController.create);
router.patch('/coupons/:id', validate(updateCouponSchema), couponController.update);
router.delete('/coupons/:id', couponController.delete);

export default router;

