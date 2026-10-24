import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';

const router = Router();

// Public: GET /api/search/suggestions?q=
router.get('/suggestions', productController.getSuggestions);

export default router;
