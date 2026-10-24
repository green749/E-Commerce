import { Router } from 'express';
import { successResponse } from '../utils/response.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/health', (req, res) => {
  return successResponse(res, {
    status: 'healthy',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

export default router;
