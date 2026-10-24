import { Router } from 'express';
import { eventController } from '../controllers/event.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { eventsLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { eventsPayloadSchema } from '../validators/event.validator.js';

const router = Router();

// Rate limit and optional authentication for all analytics ingestion
router.use(eventsLimiter);
router.use(optionalAuth);

// POST /api/events (Batched, rate-limited, validated)
router.post('/', validate(eventsPayloadSchema), eventController.track);

export default router;
