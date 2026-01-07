import { Request, Response } from 'express';
import { categoryService } from '../services/categoryService';
import { CreateCategoryInput, UpdateCategoryInput } from '../models/Category';

export class CategoryController {
    /**
     * GET /api/v1/categories
     * Get all categories for current user
     */
    async getMyCategories(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const categories = await categoryService.getUserCategories(userId);

            res.json({ categories });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get categories' });
        }
    }

    /**
     * POST /api/v1/categories
     * Create a new category
     */
    async createCategory(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const input: CreateCategoryInput = req.body;
            const category = await categoryService.createCategory(userId, input);

            res.status(201).json({
                message: 'Category created successfully',
                category,
            });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to create category' });
        }
    }

    /**
     * GET /api/v1/categories/:id
     * Get a specific category
     */
    async getCategory(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const { id } = req.params;
            const category = await categoryService.getCategoryById(id, userId);

            if (!category) {
                res.status(404).json({ error: 'Category not found or you do not have access' });
                return;
            }

            res.json({ category });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get category' });
        }
    }

    /**
     * PUT /api/v1/categories/:id
     * Update a category
     */
    async updateCategory(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const { id } = req.params;
            const input: UpdateCategoryInput = req.body;
            const category = await categoryService.updateCategory(id, userId, input);

            res.json({
                message: 'Category updated successfully',
                category,
            });
        } catch (error: any) {
            if (error.message.includes('not found') || error.message.includes('permission')) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to update category' });
        }
    }

    /**
     * DELETE /api/v1/categories/:id
     * Delete a category
     */
    async deleteCategory(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const { id } = req.params;
            await categoryService.deleteCategory(id, userId);

            res.json({ message: 'Category deleted successfully' });
        } catch (error: any) {
            if (error.message.includes('not found') || error.message.includes('permission')) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to delete category' });
        }
    }

    /**
     * GET /api/v1/categories/public
     * Get public categories
     */
    async getPublicCategories(req: Request, res: Response): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const categories = await categoryService.getPublicCategories(limit);

            res.json({ categories });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get public categories' });
        }
    }
}

export const categoryController = new CategoryController();
