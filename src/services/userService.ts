import { prisma } from '../config/database';
import { UpdateUserInput, UserPublic } from '../models/User';

export class UserService {
    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<UserPublic | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                displayName: true,
                createdAt: true,
            },
        });

        return user;
    }

    /**
     * Get user's full profile (includes email for own profile)
     */
    async getMyProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                createdAt: true,
                _count: {
                    select: {
                        pins: true,
                        categories: true,
                    },
                },
            },
        });

        return user;
    }

    /**
     * Search users by username
     */
    async searchUsers(query: string, currentUserId: string): Promise<UserPublic[]> {
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } }, // Exclude current user
                    {
                        OR: [
                            { username: { contains: query, mode: 'insensitive' } },
                            { displayName: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                createdAt: true,
            },
            take: 20, // Limit results
            orderBy: { username: 'asc' },
        });

        return users;
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, input: UpdateUserInput): Promise<UserPublic> {
        // Check if username is taken (if being updated)
        if (input.username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username: input.username,
                    id: { not: userId },
                },
            });

            if (existingUser) {
                throw new Error('Username already taken');
            }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: input,
            select: {
                id: true,
                username: true,
                displayName: true,
                createdAt: true,
            },
        });

        return user;
    }

    /**
     * Get all users (for admin/discovery)
     */
    async getAllUsers(currentUserId: string, limit = 50): Promise<UserPublic[]> {
        const users = await prisma.user.findMany({
            where: { id: { not: currentUserId } },
            select: {
                id: true,
                username: true,
                displayName: true,
                createdAt: true,
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        return users;
    }
}

export const userService = new UserService();
