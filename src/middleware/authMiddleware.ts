import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { prisma } from '../config/database';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            user?: {
                id: string;
                username: string;
                email: string;
            };
        }
    }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid authorization header' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const userId = authService.verifyAccessToken(token);

        // Optionally fetch full user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, email: true },
        });

        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        req.userId = userId;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Optional auth middleware - attaches user if token present, continues otherwise
 */
export async function optionalAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const userId = authService.verifyAccessToken(token);

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, username: true, email: true },
            });

            if (user) {
                req.userId = userId;
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Token invalid but we continue anyway for optional auth
        next();
    }
}
