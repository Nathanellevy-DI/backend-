import { prisma } from '../config/database';

export interface SearchUsersInput {
    query: string;
    currentUserId: string;
}

export interface FriendRequestInput {
    userId: string;
    friendId: string;
}

export interface FriendshipActionInput {
    friendshipId: string;
    userId: string;
}

/**
 * Search for users by username or email
 */
export async function searchUsers(input: SearchUsersInput) {
    const { query, currentUserId } = input;

    const users = await prisma.user.findMany({
        where: {
            AND: [
                {
                    id: {
                        not: currentUserId // Exclude current user
                    }
                },
                {
                    OR: [
                        {
                            username: {
                                contains: query,
                                mode: 'insensitive'
                            }
                        },
                        {
                            email: {
                                contains: query,
                                mode: 'insensitive'
                            }
                        },
                        {
                            displayName: {
                                contains: query,
                                mode: 'insensitive'
                            }
                        }
                    ]
                }
            ]
        },
        select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            createdAt: true
        },
        take: 20 // Limit results
    });

    return users;
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(input: FriendRequestInput) {
    const { userId, friendId } = input;

    // Check if friendship already exists
    const existing = await prisma.friendship.findUnique({
        where: {
            userId_friendId: {
                userId,
                friendId
            }
        }
    });

    if (existing) {
        throw new Error('Friend request already exists');
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
        data: {
            userId,
            friendId,
            status: 'pending'
        },
        include: {
            friend: {
                select: {
                    id: true,
                    username: true,
                    displayName: true
                }
            }
        }
    });

    return friendship;
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(input: FriendshipActionInput) {
    const { friendshipId, userId } = input;

    const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId }
    });

    if (!friendship) {
        throw new Error('Friend request not found');
    }

    // Verify the user is the recipient
    if (friendship.friendId !== userId) {
        throw new Error('Unauthorized');
    }

    if (friendship.status !== 'pending') {
        throw new Error('Friend request is not pending');
    }

    const updated = await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    displayName: true
                }
            }
        }
    });

    return updated;
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(input: FriendshipActionInput) {
    const { friendshipId, userId } = input;

    const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId }
    });

    if (!friendship) {
        throw new Error('Friend request not found');
    }

    // Verify the user is the recipient
    if (friendship.friendId !== userId) {
        throw new Error('Unauthorized');
    }

    await prisma.friendship.delete({
        where: { id: friendshipId }
    });

    return { success: true };
}

/**
 * Remove a friend
 */
export async function removeFriend(input: FriendshipActionInput) {
    const { friendshipId, userId } = input;

    const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId }
    });

    if (!friendship) {
        throw new Error('Friendship not found');
    }

    // Verify the user is part of the friendship
    if (friendship.userId !== userId && friendship.friendId !== userId) {
        throw new Error('Unauthorized');
    }

    await prisma.friendship.delete({
        where: { id: friendshipId }
    });

    return { success: true };
}

/**
 * Get list of friends (accepted friendships)
 */
export async function getFriends(userId: string) {
    const friendships = await prisma.friendship.findMany({
        where: {
            OR: [
                { userId, status: 'accepted' },
                { friendId: userId, status: 'accepted' }
            ]
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    email: true
                }
            },
            friend: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    email: true
                }
            }
        }
    });

    // Map to return the friend (not the current user)
    return friendships.map(f => ({
        friendshipId: f.id,
        friend: f.userId === userId ? f.friend : f.user,
        createdAt: f.createdAt
    }));
}

/**
 * Get pending friend requests (incoming and outgoing)
 */
export async function getPendingRequests(userId: string) {
    const incoming = await prisma.friendship.findMany({
        where: {
            friendId: userId,
            status: 'pending'
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    displayName: true
                }
            }
        }
    });

    const outgoing = await prisma.friendship.findMany({
        where: {
            userId,
            status: 'pending'
        },
        include: {
            friend: {
                select: {
                    id: true,
                    username: true,
                    displayName: true
                }
            }
        }
    });

    return {
        incoming: incoming.map(f => ({
            friendshipId: f.id,
            user: f.user,
            createdAt: f.createdAt
        })),
        outgoing: outgoing.map(f => ({
            friendshipId: f.id,
            user: f.friend,
            createdAt: f.createdAt
        }))
    };
}
