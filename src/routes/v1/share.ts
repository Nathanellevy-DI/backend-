import { Router } from 'express';
import { z } from 'zod';
import * as shareService from '../../services/shareService';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Share a pin
 * POST /api/v1/share/pin
 */
router.post('/pin', async (req, res, next) => {
    try {
        const schema = z.object({
            pinId: z.string(),
            toUserIds: z.array(z.string()).min(1),
            pinData: z.record(z.any()).optional()
        });

        const { pinId, toUserIds, pinData } = schema.parse(req.body);
        const userId = (req as any).userId;

        const result = await shareService.sharePin({
            pinId,
            fromUserId: userId,
            toUserIds,
            pinData
        });

        res.json(result);
    } catch (error) {
        console.error('Share pin error:', error);
        require('fs').appendFileSync('error.log', `[${new Date().toISOString()}] Share Pin Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        next(error);
    }
});

/**
 * Share a category
 * POST /api/v1/share/category
 */
router.post('/category', async (req, res, next) => {
    try {
        const schema = z.object({
            categoryId: z.string(),
            toUserIds: z.array(z.string()).min(1)
        });

        const { categoryId, toUserIds } = schema.parse(req.body);
        const userId = (req as any).userId;

        const result = await shareService.shareCategory({
            categoryId,
            fromUserId: userId,
            toUserIds
        });

        res.json(result);
    } catch (error) {
        console.error('Share category error:', error);
        require('fs').appendFileSync('error.log', `[${new Date().toISOString()}] Share Category Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        next(error);
    }
});

/**
 * Get shared items
 * GET /api/v1/share/items
 */
router.get('/items', async (req, res, next) => {
    try {
        const userId = (req as any).userId;
        const items = await shareService.getSharedItems(userId);
        res.json(items);
    } catch (error) {
        console.error('Get shared items error:', error);
        next(error);
    }
});

export default router;
