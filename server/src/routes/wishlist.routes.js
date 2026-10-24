import { Router } from 'express';
import { wishlistController } from '../controllers/wishlist.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addToWishlistSchema } from '../validators/cart.validator.js';

const router = Router();

// Wishlist is strictly for authenticated users
router.use(authenticate);

// Wishlist endpoints
router.get('/', wishlistController.getWishlist);
router.post('/', validate(addToWishlistSchema), wishlistController.addItem);
router.delete('/:id', wishlistController.removeItem);
router.delete('/', wishlistController.removeItem);

export default router;
