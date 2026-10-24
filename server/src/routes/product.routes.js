import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';

const router = Router();

// Public: GET /api/products
router.get('/', productController.getProducts);

// Public: GET /api/products/:slug
router.get('/:slug', productController.getBySlug);

export default router;
