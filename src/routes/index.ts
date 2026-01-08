import { Router } from 'express';
import authRoutes from './v1/auth';
import userRoutes from './v1/users';
import pinRoutes from './v1/pins';
import categoryRoutes from './v1/categories';
import shareRoutes from './v1/share';
import friendRoutes from './v1/friendRoutes';

const router = Router();

// API v1 routes
router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/pins', pinRoutes);
router.use('/v1/categories', categoryRoutes);
router.use('/v1/share', shareRoutes);
router.use('/v1/friends', friendRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
