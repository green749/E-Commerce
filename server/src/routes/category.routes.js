import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';

const router = Router();

// Public: GET /api/categories (tree)
router.get('/', categoryController.getTree);

export default router;
