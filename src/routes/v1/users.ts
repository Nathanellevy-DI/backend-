import { Router } from 'express';
import { userController } from '../../controllers/userController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validateBody } from '../../middleware/validateInput';
import { UpdateUserSchema } from '../../models/User';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/v1/users/me
router.get('/me', (req, res) => userController.getMe(req, res));

// PUT /api/v1/users/me
router.put(
    '/me',
    validateBody(UpdateUserSchema),
    (req, res) => userController.updateMe(req, res)
);

// GET /api/v1/users/search?q=query
router.get('/search', (req, res) => userController.searchUsers(req, res));

// GET /api/v1/users - Get all users (discovery)
router.get('/', (req, res) => userController.getAllUsers(req, res));

// GET /api/v1/users/:id
router.get('/:id', (req, res) => userController.getUserById(req, res));

export default router;
