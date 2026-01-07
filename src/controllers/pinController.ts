import { Request, Response } from 'express';
import { pinService } from '../services/pinService';
import { CreatePinInput, UpdatePinInput } from '../models/Pin';

export class PinController {
    /**
     * GET /api/v1/pins
     * Get all pins for current user
     */
    async getMyPins(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const pins = await pinService.getUserPins(userId);

            res.json({ pins });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get pins' });
        }
    }

    /**
     * POST /api/v1/pins
     * Create a new pin
     */
    async createPin(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const input: CreatePinInput = req.body;
            const pin = await pinService.createPin(userId, input);

            res.status(201).json({
                message: 'Pin created successfully',
                pin,
            });
        } catch (error: any) {
            if (error.message.includes('Category')) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to create pin' });
        }
    }

    /**
     * GET /api/v1/pins/:id
     * Get a specific pin
     */
    async getPin(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const { id } = req.params;
            const pin = await pinService.getPinById(id, userId);

            if (!pin) {
                res.status(404).json({ error: 'Pin not found or you do not have access' });
                return;
            }

            res.json({ pin });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get pin' });
        }
    }

    /**
     * PUT /api/v1/pins/:id
     * Update a pin
     */
    async updatePin(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const { id } = req.params;
            const input: UpdatePinInput = req.body;
            const pin = await pinService.updatePin(id, userId, input);

            res.json({
                message: 'Pin updated successfully',
                pin,
            });
        } catch (error: any) {
            if (error.message.includes('not found') || error.message.includes('permission')) {
                res.status(404).json({ error: error.message });
                return;
            }
            if (error.message.includes('Category')) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to update pin' });
        }
    }

    /**
     * DELETE /api/v1/pins/:id
     * Delete a pin
     */
    async deletePin(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const { id } = req.params;
            await pinService.deletePin(id, userId);

            res.json({ message: 'Pin deleted successfully' });
        } catch (error: any) {
            if (error.message.includes('not found') || error.message.includes('permission')) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to delete pin' });
        }
    }

    /**
     * GET /api/v1/pins/public
     * Get public pins
     */
    async getPublicPins(req: Request, res: Response): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const pins = await pinService.getPublicPins(limit);

            res.json({ pins });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get public pins' });
        }
    }

    /**
     * GET /api/v1/pins/category/:categoryId
     * Get pins by category
     */
    async getPinsByCategory(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const { categoryId } = req.params;
            const pins = await pinService.getPinsByCategory(categoryId, userId);

            res.json({ pins });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get pins' });
        }
    }
}

export const pinController = new PinController();
