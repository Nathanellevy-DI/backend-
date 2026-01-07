import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { CreateUserInput, LoginInput, AuthTokens, UserPublic } from '../models/User';

const SALT_ROUNDS = 12;

export class AuthService {
    /**
     * Register a new user
     */
    async register(input: CreateUserInput): Promise<UserPublic> {
        const { username, email, password, displayName } = input;

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new Error('Email already registered');
            }
            throw new Error('Username already taken');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                displayName,
            },
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
     * Login user and return tokens
     */
    async login(input: LoginInput): Promise<{ user: UserPublic; tokens: AuthTokens }> {
        const { email, password } = input;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }

        // Generate tokens
        const tokens = this.generateTokens(user.id);

        return {
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                createdAt: user.createdAt,
            },
            tokens,
        };
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string): Promise<AuthTokens> {
        try {
            const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };

            // Verify user still exists
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
            });

            if (!user) {
                throw new Error('User not found');
            }

            return this.generateTokens(user.id);
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    /**
     * Generate JWT tokens
     */
    private generateTokens(userId: string): AuthTokens {
        const accessToken = jwt.sign(
            { userId },
            env.JWT_SECRET,
            { expiresIn: '1h' } as jwt.SignOptions
        );

        const refreshToken = jwt.sign(
            { userId },
            env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' } as jwt.SignOptions
        );

        return { accessToken, refreshToken };
    }

    /**
     * Verify access token and return user ID
     */
    verifyAccessToken(token: string): string {
        try {
            const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
            return payload.userId;
        } catch (error) {
            throw new Error('Invalid access token');
        }
    }
}

export const authService = new AuthService();
