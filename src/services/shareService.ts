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

        // Handle memories - serialize to notes field as JSON
        let notesValue = pinData.notes || '';
        let imageUrlValue = pinData.imageBase64 || pinData.imageUrl || null;

        // If memories array exists, serialize it to notes field
        if (pinData.memories && Array.isArray(pinData.memories) && pinData.memories.length > 0) {
            // Store memories as JSON with a special prefix so we can parse it later
            notesValue = `__MEMORIES_JSON__${JSON.stringify(pinData.memories)}`;

            // Use first image from memories as imageUrl if not already set
            if (!imageUrlValue) {
                const firstImage = pinData.memories.find((m: any) => m.type === 'image');
                if (firstImage) {
                    imageUrlValue = firstImage.content;
                }
            }
        }

        // Create pin
        try {
            pin = await prisma.pin.create({
                data: {
                    title: pinData.title || pinData.name || 'Untitled Pin',
                    description: pinData.description || '',
                    latitude: parseFloat(pinData.lat),
                    longitude: parseFloat(pinData.lon),
                    address: pinData.formatted || '',
                    notes: notesValue,
                    imageUrl: imageUrlValue,
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

    // 3. If pin exists and we have pinData with memories, UPDATE the pin's notes
    if (pinData && pinData.memories && Array.isArray(pinData.memories) && pinData.memories.length > 0) {
        // Serialize memories to notes field
        const notesValue = `__MEMORIES_JSON__${JSON.stringify(pinData.memories)}`;

        // Find first image for imageUrl
        let imageUrlValue = pin.imageUrl;
        const firstImage = pinData.memories.find((m: any) => m.type === 'image');
        if (firstImage && firstImage.content) {
            imageUrlValue = firstImage.content;
        }

        // Update the pin with memories
        pin = await prisma.pin.update({
            where: { id: pin.id },
            data: {
                notes: notesValue,
                imageUrl: imageUrlValue
            }
        });
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

/**
 * Share a pin with ALL accepted friends
 */
export async function shareWithAllFriends(pinId: string, fromUserId: string, pinData?: any) {
    // Get all friends
    const friends = await friendService.getFriends(fromUserId);
    const allFriendIds = friends.map(f => f.friend.id);

    if (allFriendIds.length === 0) {
        return { count: 0, message: 'No friends to share with' };
    }

    return sharePin({
        pinId,
        fromUserId,
        toUserIds: allFriendIds,
        pinData
    });
}

/**
 * Get public pins (excluding own pins)
 */
export async function getPublicPins(userId: string, limit = 50) {
    const pins = await prisma.pin.findMany({
        where: {
            isPublic: true,
            userId: { not: userId } // Exclude own pins
        },
        include: {
            category: {
                select: { id: true, name: true, color: true }
            },
            user: {
                select: { id: true, username: true, displayName: true }
            }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
    });

    return pins.map(pin => ({
        ...pin,
        sharedBy: pin.user,
        type: 'public'
    }));
}
