import { Request, Response } from 'express';
import { shareService } from '../services/shareService';

export class ShareController {
    /**
     * POST /api/v1/share/pin/:pinId
     * Share a pin with a user
     */
    async sharePin(req: Request, res: Response): Promise<void> {
        try {
            const fromUserId = req.userId!;
            const { pinId } = req.params;
            const { toUserId } = req.body;

            if (!toUserId) {
                res.status(400).json({ error: 'toUserId is required' });
                return;
            }

            await shareService.sharePin(pinId, fromUserId, toUserId);

            res.json({ message: 'Pin shared successfully' });
        } catch (error: any) {
            if (error.message.includes('not found') || error.message.includes('not own')) {
                res.status(404).json({ error: error.message });
                return;
            }
            if (error.message.includes('already shared') || error.message.includes('yourself')) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to share pin' });
        }
    }

    /**
     * DELETE /api/v1/share/pin/:pinId/:toUserId
     * Unshare a pin from a user
     */
    async unsharePin(req: Request, res: Response): Promise<void> {
        try {
            const fromUserId = req.userId!;
            const { pinId, toUserId } = req.params;

            await shareService.unsharePin(pinId, fromUserId, toUserId);

            res.json({ message: 'Pin unshared successfully' });
        } catch (error: any) {
            if (error.message.includes('not found')) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to unshare pin' });
        }
    }

    /**
     * POST /api/v1/share/category/:categoryId
     * Share a category with a user
     */
    async shareCategory(req: Request, res: Response): Promise<void> {
        try {
            const fromUserId = req.userId!;
            const { categoryId } = req.params;
            const { toUserId } = req.body;

            if (!toUserId) {
                res.status(400).json({ error: 'toUserId is required' });
                return;
            }

            await shareService.shareCategory(categoryId, fromUserId, toUserId);

            res.json({ message: 'Category shared successfully' });
        } catch (error: any) {
            if (error.message.includes('not found') || error.message.includes('not own')) {
                res.status(404).json({ error: error.message });
                return;
            }
            if (error.message.includes('already shared') || error.message.includes('yourself')) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to share category' });
        }
    }

    /**
     * DELETE /api/v1/share/category/:categoryId/:toUserId
     * Unshare a category from a user
     */
    async unshareCategory(req: Request, res: Response): Promise<void> {
        try {
            const fromUserId = req.userId!;
            const { categoryId, toUserId } = req.params;

            await shareService.unshareCategory(categoryId, fromUserId, toUserId);

            res.json({ message: 'Category unshared successfully' });
        } catch (error: any) {
            if (error.message.includes('not found')) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to unshare category' });
        }
    }

    /**
     * GET /api/v1/share
     * Get all items shared with current user
     */
    async getSharedWithMe(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;

            const [pins, categories] = await Promise.all([
                shareService.getPinsSharedWithMe(userId),
                shareService.getCategoriesSharedWithMe(userId),
            ]);

            res.json({
                sharedPins: pins,
                sharedCategories: categories,
            });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get shared items' });
        }
    }

    /**
     * GET /api/v1/share/pin/:pinId
     * Get who a pin is shared with
     */
    async getPinShares(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const { pinId } = req.params;

            const shares = await shareService.getPinShares(pinId, userId);
            res.json({ shares });
        } catch (error: any) {
            if (error.message.includes('not found') || error.message.includes('not own')) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to get pin shares' });
        }
    }

    /**
     * GET /api/v1/share/category/:categoryId
     * Get who a category is shared with
     */
    async getCategoryShares(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const { categoryId } = req.params;

            const shares = await shareService.getCategoryShares(categoryId, userId);
            res.json({ shares });
        } catch (error: any) {
            if (error.message.includes('not found') || error.message.includes('not own')) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to get category shares' });
        }
    }
}

export const shareController = new ShareController();
