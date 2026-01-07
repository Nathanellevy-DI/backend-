import { prisma } from '../config/database';
import { CreateCategoryInput, UpdateCategoryInput, CategoryWithPinCount } from '../models/Category';

export class CategoryService {
    /**
     * Create a new category
     */
    async createCategory(userId: string, input: CreateCategoryInput): Promise<CategoryWithPinCount> {
        const category = await prisma.category.create({
            data: {
                ...input,
                userId,
            },
            include: {
                _count: {
                    select: { pins: true },
                },
            },
        });

        return category;
    }

    /**
     * Get all categories for a user
     */
    async getUserCategories(userId: string): Promise<CategoryWithPinCount[]> {
        const categories = await prisma.category.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { pins: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        return categories;
    }

    /**
     * Get a single category by ID
     */
    async getCategoryById(categoryId: string, userId: string): Promise<CategoryWithPinCount | null> {
        const category = await prisma.category.findFirst({
            where: {
                id: categoryId,
                OR: [
                    { userId },
                    { isPublic: true },
                    { shares: { some: { toUserId: userId } } },
                ],
            },
            include: {
                _count: {
                    select: { pins: true },
                },
            },
        });

        return category;
    }

    /**
     * Update a category
     */
    async updateCategory(categoryId: string, userId: string, input: UpdateCategoryInput): Promise<CategoryWithPinCount> {
        const existingCategory = await prisma.category.findFirst({
            where: { id: categoryId, userId },
        });

        if (!existingCategory) {
            throw new Error('Category not found or you do not have permission to edit it');
        }

        const category = await prisma.category.update({
            where: { id: categoryId },
            data: input,
            include: {
                _count: {
                    select: { pins: true },
                },
            },
        });

        return category;
    }

    /**
     * Delete a category
     */
    async deleteCategory(categoryId: string, userId: string): Promise<void> {
        const category = await prisma.category.findFirst({
            where: { id: categoryId, userId },
        });

        if (!category) {
            throw new Error('Category not found or you do not have permission to delete it');
        }

        await prisma.category.delete({
            where: { id: categoryId },
        });
    }

    /**
     * Get public categories
     */
    async getPublicCategories(limit = 50): Promise<CategoryWithPinCount[]> {
        const categories = await prisma.category.findMany({
            where: { isPublic: true },
            include: {
                _count: {
                    select: { pins: true },
                },
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        return categories;
    }
}

export const categoryService = new CategoryService();
