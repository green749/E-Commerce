import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { addressController } from '../controllers/address.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, changePasswordSchema } from '../validators/auth.validator.js';
import { createAddressSchema, updateAddressSchema } from '../validators/address.validator.js';

const router = Router();

// Protect all /api/me routes
router.use(authenticate);

// Profile endpoints
router.get('/', userController.getProfile);
router.patch('/', validate(updateProfileSchema), userController.updateProfile);
router.patch('/password', validate(changePasswordSchema), userController.changePassword);


// Address CRUD endpoints
router.get('/addresses', addressController.list);
router.post('/addresses', validate(createAddressSchema), addressController.create);
router.get('/addresses/:id', addressController.getById);
router.patch('/addresses/:id', validate(updateAddressSchema), addressController.update);
router.delete('/addresses/:id', addressController.delete);

export default router;
