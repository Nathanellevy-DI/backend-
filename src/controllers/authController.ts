import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { CreateUserInput, LoginInput } from '../models/User';

export class AuthController {
    /**
     * POST /api/v1/auth/register
     * Create a new user account
     */
    async register(req: Request, res: Response): Promise<void> {
        try {
            const input: CreateUserInput = req.body;
            const user = await authService.register(input);

            res.status(201).json({
                message: 'User registered successfully',
                user,
            });
        } catch (error: any) {
            if (error.message.includes('already')) {
                res.status(409).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Registration failed' });
        }
    }

    /**
     * POST /api/v1/auth/login
     * Login and get JWT tokens
     */
    async login(req: Request, res: Response): Promise<void> {
        try {
            const input: LoginInput = req.body;
            const result = await authService.login(input);

            res.json({
                message: 'Login successful',
                user: result.user,
                tokens: result.tokens,
            });
        } catch (error: any) {
            res.status(401).json({ error: error.message || 'Login failed' });
        }
    }

    /**
     * POST /api/v1/auth/refresh
     * Refresh access token
     */
    async refresh(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                res.status(400).json({ error: 'Refresh token required' });
                return;
            }

            const tokens = await authService.refreshToken(refreshToken);
            res.json({ tokens });
        } catch (error: any) {
            res.status(401).json({ error: error.message || 'Token refresh failed' });
        }
    }
}

export const authController = new AuthController();
