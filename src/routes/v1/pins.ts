import { Router } from 'express';
import { pinController } from '../../controllers/pinController';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/authMiddleware';
import { validateBody } from '../../middleware/validateInput';
import { CreatePinSchema, UpdatePinSchema } from '../../models/Pin';

const router = Router();

// GET /api/v1/pins/public - Public pins (optional auth)
router.get('/public', optionalAuthMiddleware, (req, res) => pinController.getPublicPins(req, res));

// All other routes require authentication
router.use(authMiddleware);

// GET /api/v1/pins - Get my pins
router.get('/', (req, res) => pinController.getMyPins(req, res));

// POST /api/v1/pins - Create pin
router.post(
    '/',
    validateBody(CreatePinSchema),
    (req, res) => pinController.createPin(req, res)
);

// GET /api/v1/pins/category/:categoryId - Get pins by category
router.get('/category/:categoryId', (req, res) => pinController.getPinsByCategory(req, res));

// GET /api/v1/pins/:id - Get specific pin
router.get('/:id', (req, res) => pinController.getPin(req, res));

// PUT /api/v1/pins/:id - Update pin
router.put(
    '/:id',
    validateBody(UpdatePinSchema),
    (req, res) => pinController.updatePin(req, res)
);

// DELETE /api/v1/pins/:id - Delete pin
router.delete('/:id', (req, res) => pinController.deletePin(req, res));

export default router;
