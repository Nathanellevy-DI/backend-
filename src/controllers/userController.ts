import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { UpdateUserInput } from '../models/User';

export class UserController {
    /**
     * GET /api/v1/users/me
     * Get current user's profile
     */
    async getMe(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const user = await userService.getMyProfile(userId);

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({ user });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get profile' });
        }
    }

    /**
     * PUT /api/v1/users/me
     * Update current user's profile
     */
    async updateMe(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const input: UpdateUserInput = req.body;
            const user = await userService.updateProfile(userId, input);

            res.json({
                message: 'Profile updated successfully',
                user,
            });
        } catch (error: any) {
            if (error.message.includes('already taken')) {
                res.status(409).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    /**
     * GET /api/v1/users/search?q=query
     * Search for users
     */
    async searchUsers(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const query = (req.query.q as string) || '';

            if (query.length < 2) {
                res.status(400).json({ error: 'Search query must be at least 2 characters' });
                return;
            }

            const users = await userService.searchUsers(query, userId);
            res.json({ users });
        } catch (error: any) {
            res.status(500).json({ error: 'Search failed' });
        }
    }

    /**
     * GET /api/v1/users/:id
     * Get a user's public profile
     */
    async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = await userService.getUserById(id);

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({ user });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get user' });
        }
    }

    /**
     * GET /api/v1/users
     * Get all users (discovery)
     */
    async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const limit = parseInt(req.query.limit as string) || 50;
            const users = await userService.getAllUsers(userId, limit);

            res.json({ users });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get users' });
        }
    }
}

export const userController = new UserController();
