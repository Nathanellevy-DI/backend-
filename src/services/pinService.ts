import { prisma } from '../config/database';
import { CreatePinInput, UpdatePinInput, PinWithCategory } from '../models/Pin';

export class PinService {
    /**
     * Create a new pin
     */
    async createPin(userId: string, input: CreatePinInput): Promise<PinWithCategory> {
        // Verify category belongs to user if provided
        if (input.categoryId) {
            const category = await prisma.category.findFirst({
                where: { id: input.categoryId, userId },
            });
            if (!category) {
                throw new Error('Category not found or does not belong to you');
            }
        }

        const pin = await prisma.pin.create({
            data: {
                ...input,
                userId,
            },
            include: {
                category: {
                    select: { id: true, name: true, color: true },
                },
            },
        });

        return pin;
    }

    /**
     * Get all pins for a user
     */
    async getUserPins(userId: string): Promise<PinWithCategory[]> {
        const pins = await prisma.pin.findMany({
            where: { userId },
            include: {
                category: {
                    select: { id: true, name: true, color: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return pins;
    }

    /**
     * Get a single pin by ID
     */
    async getPinById(pinId: string, userId: string): Promise<PinWithCategory | null> {
        const pin = await prisma.pin.findFirst({
            where: {
                id: pinId,
                OR: [
                    { userId }, // Own pin
                    { isPublic: true }, // Public pin
                    { shares: { some: { toUserId: userId } } }, // Shared with user
                ],
            },
            include: {
                category: {
                    select: { id: true, name: true, color: true },
                },
            },
        });

        return pin;
    }

    /**
     * Update a pin
     */
    async updatePin(pinId: string, userId: string, input: UpdatePinInput): Promise<PinWithCategory> {
        // Verify ownership
        const existingPin = await prisma.pin.findFirst({
            where: { id: pinId, userId },
        });

        if (!existingPin) {
            throw new Error('Pin not found or you do not have permission to edit it');
        }

        // Verify category if being updated
        if (input.categoryId) {
            const category = await prisma.category.findFirst({
                where: { id: input.categoryId, userId },
            });
            if (!category) {
                throw new Error('Category not found or does not belong to you');
            }
        }

        const pin = await prisma.pin.update({
            where: { id: pinId },
            data: input,
            include: {
                category: {
                    select: { id: true, name: true, color: true },
                },
            },
        });

        return pin;
    }

    /**
     * Delete a pin
     */
    async deletePin(pinId: string, userId: string): Promise<void> {
        const pin = await prisma.pin.findFirst({
            where: { id: pinId, userId },
        });

        if (!pin) {
            throw new Error('Pin not found or you do not have permission to delete it');
        }

        await prisma.pin.delete({
            where: { id: pinId },
        });
    }

    /**
     * Get all public pins
     */
    async getPublicPins(limit = 50): Promise<PinWithCategory[]> {
        const pins = await prisma.pin.findMany({
            where: { isPublic: true },
            include: {
                category: {
                    select: { id: true, name: true, color: true },
                },
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        return pins;
    }

    /**
     * Get pins by category
     */
    async getPinsByCategory(categoryId: string, userId: string): Promise<PinWithCategory[]> {
        const pins = await prisma.pin.findMany({
            where: {
                categoryId,
                OR: [
                    { userId },
                    { isPublic: true },
                    { shares: { some: { toUserId: userId } } },
                ],
            },
            include: {
                category: {
                    select: { id: true, name: true, color: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return pins;
    }
}

export const pinService = new PinService();
