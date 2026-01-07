import { prisma } from '../config/database';
import { PinWithCategory } from '../models/Pin';
import { CategoryWithPinCount } from '../models/Category';

export class ShareService {
    /**
     * Share a pin with a specific user
     */
    async sharePin(pinId: string, fromUserId: string, toUserId: string): Promise<void> {
        // Verify pin belongs to the sender
        const pin = await prisma.pin.findFirst({
            where: { id: pinId, userId: fromUserId },
        });

        if (!pin) {
            throw new Error('Pin not found or you do not own it');
        }

        // Verify recipient exists
        const recipient = await prisma.user.findUnique({
            where: { id: toUserId },
        });

        if (!recipient) {
            throw new Error('Recipient user not found');
        }

        // Cannot share with yourself
        if (fromUserId === toUserId) {
            throw new Error('Cannot share with yourself');
        }

        // Create share (will fail if already shared due to unique constraint)
        try {
            await prisma.sharedPin.create({
                data: {
                    pinId,
                    fromUserId,
                    toUserId,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new Error('Pin already shared with this user');
            }
            throw error;
        }
    }

    /**
     * Share a category with a specific user (shares all pins in it)
     */
    async shareCategory(categoryId: string, fromUserId: string, toUserId: string): Promise<void> {
        // Verify category belongs to the sender
        const category = await prisma.category.findFirst({
            where: { id: categoryId, userId: fromUserId },
        });

        if (!category) {
            throw new Error('Category not found or you do not own it');
        }

        // Verify recipient exists
        const recipient = await prisma.user.findUnique({
            where: { id: toUserId },
        });

        if (!recipient) {
            throw new Error('Recipient user not found');
        }

        // Cannot share with yourself
        if (fromUserId === toUserId) {
            throw new Error('Cannot share with yourself');
        }

        // Create category share
        try {
            await prisma.sharedCategory.create({
                data: {
                    categoryId,
                    fromUserId,
                    toUserId,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new Error('Category already shared with this user');
            }
            throw error;
        }
    }

    /**
     * Unshare a pin from a user
     */
    async unsharePin(pinId: string, fromUserId: string, toUserId: string): Promise<void> {
        const share = await prisma.sharedPin.findFirst({
            where: { pinId, fromUserId, toUserId },
        });

        if (!share) {
            throw new Error('Share not found');
        }

        await prisma.sharedPin.delete({
            where: { id: share.id },
        });
    }

    /**
     * Unshare a category from a user
     */
    async unshareCategory(categoryId: string, fromUserId: string, toUserId: string): Promise<void> {
        const share = await prisma.sharedCategory.findFirst({
            where: { categoryId, fromUserId, toUserId },
        });

        if (!share) {
            throw new Error('Share not found');
        }

        await prisma.sharedCategory.delete({
            where: { id: share.id },
        });
    }

    /**
     * Get all pins shared with a user
     */
    async getPinsSharedWithMe(userId: string): Promise<PinWithCategory[]> {
        const sharedPins = await prisma.sharedPin.findMany({
            where: { toUserId: userId },
            include: {
                pin: {
                    include: {
                        category: {
                            select: { id: true, name: true, color: true },
                        },
                    },
                },
                fromUser: {
                    select: { id: true, username: true, displayName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return sharedPins.map((sp) => ({
            ...sp.pin,
            sharedBy: sp.fromUser,
            sharedAt: sp.createdAt,
        })) as any;
    }

    /**
     * Get all categories shared with a user
     */
    async getCategoriesSharedWithMe(userId: string): Promise<CategoryWithPinCount[]> {
        const sharedCategories = await prisma.sharedCategory.findMany({
            where: { toUserId: userId },
            include: {
                category: {
                    include: {
                        _count: {
                            select: { pins: true },
                        },
                    },
                },
                fromUser: {
                    select: { id: true, username: true, displayName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return sharedCategories.map((sc) => ({
            ...sc.category,
            sharedBy: sc.fromUser,
            sharedAt: sc.createdAt,
        })) as any;
    }

    /**
     * Check if a user can access a specific pin
     */
    async canUserAccessPin(userId: string, pinId: string): Promise<boolean> {
        const pin = await prisma.pin.findFirst({
            where: {
                id: pinId,
                OR: [
                    { userId }, // Owner
                    { isPublic: true }, // Public
                    { shares: { some: { toUserId: userId } } }, // Shared directly
                    {
                        category: {
                            shares: { some: { toUserId: userId } },
                        },
                    }, // Category shared
                ],
            },
        });

        return !!pin;
    }

    /**
     * Check if a user can access a specific category
     */
    async canUserAccessCategory(userId: string, categoryId: string): Promise<boolean> {
        const category = await prisma.category.findFirst({
            where: {
                id: categoryId,
                OR: [
                    { userId }, // Owner
                    { isPublic: true }, // Public
                    { shares: { some: { toUserId: userId } } }, // Shared
                ],
            },
        });

        return !!category;
    }

    /**
     * Get who I've shared a pin with
     */
    async getPinShares(pinId: string, userId: string) {
        // Verify ownership
        const pin = await prisma.pin.findFirst({
            where: { id: pinId, userId },
        });

        if (!pin) {
            throw new Error('Pin not found or you do not own it');
        }

        const shares = await prisma.sharedPin.findMany({
            where: { pinId },
            include: {
                toUser: {
                    select: { id: true, username: true, displayName: true },
                },
            },
        });

        return shares.map((s) => ({
            userId: s.toUser.id,
            username: s.toUser.username,
            displayName: s.toUser.displayName,
            sharedAt: s.createdAt,
        }));
    }

    /**
     * Get who I've shared a category with
     */
    async getCategoryShares(categoryId: string, userId: string) {
        // Verify ownership
        const category = await prisma.category.findFirst({
            where: { id: categoryId, userId },
        });

        if (!category) {
            throw new Error('Category not found or you do not own it');
        }

        const shares = await prisma.sharedCategory.findMany({
            where: { categoryId },
            include: {
                toUser: {
                    select: { id: true, username: true, displayName: true },
                },
            },
        });

        return shares.map((s) => ({
            userId: s.toUser.id,
            username: s.toUser.username,
            displayName: s.toUser.displayName,
            sharedAt: s.createdAt,
        }));
    }
}

export const shareService = new ShareService();
