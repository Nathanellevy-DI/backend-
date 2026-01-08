import { prisma } from '../config/database';
import * as friendService from './friendService';

export interface SharePinInput {
    pinId: string;
    fromUserId: string;
    toUserIds: string[]; // List of friend IDs to share with
}

export interface ShareCategoryInput {
    categoryId: string;
    fromUserId: string;
    toUserIds: string[];
}

/**
 * Share a pin with multiple friends
 */
// Helper to find or create category
async function getOrCreateCategory(userId: string, categoryName: string) {
    let category = await prisma.category.findFirst({
        where: { userId, name: categoryName }
    });

    if (!category) {
        category = await prisma.category.create({
            data: {
                name: categoryName,
                userId,
                isPublic: false
            }
        });
    }
    return category;
}

export async function sharePin(input: SharePinInput & { pinData?: any }) {
    const { pinId, fromUserId, toUserIds, pinData } = input;

    // 1. Try to find the pin
    let pin = await prisma.pin.findUnique({
        where: { id: pinId }
    });

    // 2. If not found, and we have data, CREATE IT (Sync-on-Share)
    if (!pin && pinData) {
        // Resolve category
        const categoryName = pinData.category || 'Default';
        const category = await getOrCreateCategory(fromUserId, categoryName);

        // Create pin
        try {
            pin = await prisma.pin.create({
                data: {
                    // If pinId is a valid UUID, try to use it. If not, let Prisma generate one?
                    // For safety, let's use the provided ID if it looks like a UUID, otherwise generate new.
                    // Actually, to keep simple, let's try to use the passed ID. If it fails (e.g. format), we might need fallback.
                    // But Prisma create with specific ID requires it to match the type.
                    // We'll rely on the frontend sending a UUID or we generate one.
                    // For now, let's try to map the fields.
                    title: pinData.title || pinData.name || 'Untitled Pin',
                    description: pinData.description || '',
                    latitude: parseFloat(pinData.lat),
                    longitude: parseFloat(pinData.lon),
                    address: pinData.formatted || '',
                    notes: pinData.notes || '',
                    imageUrl: pinData.imageBase64 || null, // Assuming base64 or url
                    userId: fromUserId,
                    categoryId: category.id,
                    isPublic: false
                }
            });
        } catch (err) {
            console.error('Failed to auto-create pin:', err);
            // If creation fails (e.g. invalid ID format if we tried to enforce it), throw original error
            throw new Error('Pin not found and could not be created');
        }
    }

    if (!pin) {
        throw new Error('Pin not found');
    }

    if (pin.userId !== fromUserId) {
        throw new Error('Unauthorized');
    }

    // Filter valid friends
    const friends = await friendService.getFriends(fromUserId);
    const validFriendIds = friends.map(f => f.friend.id);
    const targetIds = toUserIds.filter(id => validFriendIds.includes(id));

    if (targetIds.length === 0) {
        return { count: 0 };
    }

    // Create share records
    const results = await Promise.allSettled(
        targetIds.map(toUserId =>
            prisma.sharedPin.upsert({
                where: {
                    pinId_toUserId: {
                        pinId: pin.id, // Use the actual pin ID (might be newly created)
                        toUserId
                    }
                },
                create: {
                    pinId: pin.id,
                    fromUserId,
                    toUserId
                },
                update: {} // Do nothing if already shared
            })
        )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    return { count: successCount };
}

/**
 * Share a category with multiple friends
 */
export async function shareCategory(input: ShareCategoryInput) {
    const { categoryId, fromUserId, toUserIds } = input;

    // Verify category exists and belongs to user
    const category = await prisma.category.findUnique({
        where: { id: categoryId }
    });

    if (!category) {
        throw new Error('Category not found');
    }

    if (category.userId !== fromUserId) {
        throw new Error('Unauthorized');
    }

    // Filter valid friends
    const friends = await friendService.getFriends(fromUserId);
    const validFriendIds = friends.map(f => f.friend.id);
    const targetIds = toUserIds.filter(id => validFriendIds.includes(id));

    if (targetIds.length === 0) {
        return { count: 0 };
    }

    // Create share records
    const results = await Promise.allSettled(
        targetIds.map(toUserId =>
            prisma.sharedCategory.upsert({
                where: {
                    categoryId_toUserId: {
                        categoryId,
                        toUserId
                    }
                },
                create: {
                    categoryId,
                    fromUserId,
                    toUserId
                },
                update: {} // Do nothing if already shared
            })
        )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    return { count: successCount };
}

/**
 * Get items shared with the current user
 */
export async function getSharedItems(userId: string) {
    const sharedPins = await prisma.sharedPin.findMany({
        where: { toUserId: userId },
        include: {
            pin: true,
            fromUser: {
                select: {
                    id: true,
                    username: true,
                    displayName: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const sharedCategories = await prisma.sharedCategory.findMany({
        where: { toUserId: userId },
        include: {
            category: {
                include: {
                    pins: true
                }
            },
            fromUser: {
                select: {
                    id: true,
                    username: true,
                    displayName: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return {
        pins: sharedPins.map(s => ({
            ...s.pin,
            sharedBy: s.fromUser,
            sharedAt: s.createdAt,
            type: 'pin'
        })),
        categories: sharedCategories.map(s => ({
            ...s.category,
            sharedBy: s.fromUser,
            sharedAt: s.createdAt,
            type: 'category'
        }))
    };
}
