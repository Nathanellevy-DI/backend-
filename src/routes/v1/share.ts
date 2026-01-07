import { Router } from 'express';
import { shareController } from '../../controllers/shareController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/v1/share - Get items shared with me
router.get('/', (req, res) => shareController.getSharedWithMe(req, res));

// POST /api/v1/share/pin/:pinId - Share a pin
router.post('/pin/:pinId', (req, res) => shareController.sharePin(req, res));

// DELETE /api/v1/share/pin/:pinId/:toUserId - Unshare a pin
router.delete('/pin/:pinId/:toUserId', (req, res) => shareController.unsharePin(req, res));

// GET /api/v1/share/pin/:pinId - Get who a pin is shared with
router.get('/pin/:pinId', (req, res) => shareController.getPinShares(req, res));

// POST /api/v1/share/category/:categoryId - Share a category
router.post('/category/:categoryId', (req, res) => shareController.shareCategory(req, res));

// DELETE /api/v1/share/category/:categoryId/:toUserId - Unshare a category
router.delete('/category/:categoryId/:toUserId', (req, res) => shareController.unshareCategory(req, res));

// GET /api/v1/share/category/:categoryId - Get who a category is shared with
router.get('/category/:categoryId', (req, res) => shareController.getCategoryShares(req, res));

export default router;
