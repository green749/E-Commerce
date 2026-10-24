import { Router } from 'express';
import { internalController } from '../controllers/internal.controller.js';
import { requireInternalKey } from '../middleware/internalAuth.js';

const router = Router();

// Protect all internal routes: strictly accepts X-Internal-Key header
router.use(requireInternalKey);

// 1. Products: Pause & Resume
router.post('/products/:id/pause', internalController.pauseProduct);
router.post('/products/:id/resume', internalController.resumeProduct);

// 2. Orders: Hold & Release (by public orderNumber)
router.post('/orders/:orderNumber/hold', internalController.holdOrder);
router.post('/orders/:orderNumber/release', internalController.releaseOrder);

// 3. Supplier Purchase Requests
router.post('/purchase-requests', internalController.createPurchaseRequest);

export default router;
