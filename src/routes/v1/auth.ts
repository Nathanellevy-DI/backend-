import { Router } from 'express';
import { authController } from '../../controllers/authController';
import { validateBody } from '../../middleware/validateInput';
import { CreateUserSchema, LoginSchema } from '../../models/User';

const router = Router();

// POST /api/v1/auth/register
router.post(
    '/register',
    validateBody(CreateUserSchema),
    (req, res) => authController.register(req, res)
);

// POST /api/v1/auth/login
router.post(
    '/login',
    validateBody(LoginSchema),
    (req, res) => authController.login(req, res)
);

// POST /api/v1/auth/refresh
router.post('/refresh', (req, res) => authController.refresh(req, res));

export default router;
