import { Router } from 'express';
import { z } from 'zod';
import * as friendService from '../../services/friendService';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Search for users
 * GET /api/v1/users/search?q=query
 */
router.get('/search', async (req, res, next) => {
    try {
        const schema = z.object({
            q: z.string().min(1)
        });

        const { q } = schema.parse(req.query);
        const userId = (req as any).userId;

        const users = await friendService.searchUsers({
            query: q,
            currentUserId: userId
        });

        res.json(users);
    } catch (error) {
        next(error);
    }
});

/**
 * Send friend request
 * POST /api/v1/friends/request
 */
router.post('/request', async (req, res, next) => {
    try {
        const schema = z.object({
            friendId: z.string()
        });

        const { friendId } = schema.parse(req.body);
        const userId = (req as any).userId;

        const friendship = await friendService.sendFriendRequest({
            userId,
            friendId
        });

        res.status(201).json(friendship);
    } catch (error) {
        console.error('Friend request error:', error);
        next(error);
    }
});

/**
 * Accept friend request
 * PUT /api/v1/friends/:id/accept
 */
router.put('/:id/accept', async (req, res, next) => {
    try {
        const friendshipId = req.params.id;
        const userId = (req as any).userId;

        const friendship = await friendService.acceptFriendRequest({
            friendshipId,
            userId
        });

        res.json(friendship);
    } catch (error) {
        next(error);
    }
});

/**
 * Reject friend request
 * PUT /api/v1/friends/:id/reject
 */
router.put('/:id/reject', async (req, res, next) => {
    try {
        const friendshipId = req.params.id;
        const userId = (req as any).userId;

        const result = await friendService.rejectFriendRequest({
            friendshipId,
            userId
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * Remove friend
 * DELETE /api/v1/friends/:id
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const friendshipId = req.params.id;
        const userId = (req as any).userId;

        const result = await friendService.removeFriend({
            friendshipId,
            userId
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * Get friends list
 * GET /api/v1/friends
 */
router.get('/', async (req, res, next) => {
    try {
        const userId = (req as any).userId;
        const friends = await friendService.getFriends(userId);
        res.json(friends);
    } catch (error) {
        next(error);
    }
});

/**
 * Get pending friend requests
 * GET /api/v1/friends/pending
 */
router.get('/pending', async (req, res, next) => {
    try {
        const userId = (req as any).userId;
        const requests = await friendService.getPendingRequests(userId);
        res.json(requests);
    } catch (error) {
        next(error);
    }
});

export default router;
