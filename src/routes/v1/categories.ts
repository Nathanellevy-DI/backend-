import { Router } from 'express';
import { categoryController } from '../../controllers/categoryController';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/authMiddleware';
import { validateBody } from '../../middleware/validateInput';
import { CreateCategorySchema, UpdateCategorySchema } from '../../models/Category';

const router = Router();

// GET /api/v1/categories/public - Public categories (optional auth)
router.get('/public', optionalAuthMiddleware, (req, res) => categoryController.getPublicCategories(req, res));

// All other routes require authentication
router.use(authMiddleware);

// GET /api/v1/categories - Get my categories
router.get('/', (req, res) => categoryController.getMyCategories(req, res));

// POST /api/v1/categories - Create category
router.post(
    '/',
    validateBody(CreateCategorySchema),
    (req, res) => categoryController.createCategory(req, res)
);

// GET /api/v1/categories/:id - Get specific category
router.get('/:id', (req, res) => categoryController.getCategory(req, res));

// PUT /api/v1/categories/:id - Update category
router.put(
    '/:id',
    validateBody(UpdateCategorySchema),
    (req, res) => categoryController.updateCategory(req, res)
);

// DELETE /api/v1/categories/:id - Delete category
router.delete('/:id', (req, res) => categoryController.deleteCategory(req, res));

export default router;
