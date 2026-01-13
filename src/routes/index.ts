import { Router } from 'express';
import authRoutes from './v1/auth';
import userRoutes from './v1/users';
import pinRoutes from './v1/pins';
import categoryRoutes from './v1/categories';
import shareRoutes from './v1/share';
import friendRoutes from './v1/friendRoutes';
import { prisma } from '../config/database';

const router = Router();

// API v1 routes
router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/pins', pinRoutes);
router.use('/v1/categories', categoryRoutes);
router.use('/v1/share', shareRoutes);
router.use('/v1/friends', friendRoutes);

// Health check with database connectivity test
router.get('/health', async (req, res) => {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            database: 'disconnected'
        });
    }
});

export default router;
