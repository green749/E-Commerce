import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import searchRoutes from './search.routes.js';
import adminRoutes from './admin.routes.js';
import cartRoutes from './cart.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import checkoutRoutes from './checkout.routes.js';
import paymentRoutes from './payment.routes.js';
import orderRoutes from './order.routes.js';
import eventRoutes from './event.routes.js';

const router = Router();

// Health check: /api/health
router.use('/', healthRoutes);

// Authentication: /api/auth
router.use('/auth', authRoutes);

// User Profile & Addresses: /api/me
router.use('/me', userRoutes);

// Public Catalog Categories: /api/categories
router.use('/categories', categoryRoutes);

// Public Catalog Products: /api/products
router.use('/products', productRoutes);

// Search Suggestions: /api/search
router.use('/search', searchRoutes);

// Shopping Cart: /api/cart
router.use('/cart', cartRoutes);

// Customer Wishlist: /api/wishlist
router.use('/wishlist', wishlistRoutes);

// Checkout: /api/checkout
router.use('/checkout', checkoutRoutes);

// Payments: /api/payments
router.use('/payments', paymentRoutes);

// Customer Orders: /api/orders
router.use('/orders', orderRoutes);

// Admin Management: /api/admin
router.use('/admin', adminRoutes);

// Analytics Events: /api/events
router.use('/events', eventRoutes);

export default router;
