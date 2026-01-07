import { z } from 'zod';

// Zod schemas for validation
export const CreateCategorySchema = z.object({
    name: z.string().min(1).max(100),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
    icon: z.string().max(50).optional(),
    isPublic: z.boolean().default(false),
});

export const UpdateCategorySchema = z.object({
    name: z.string().min(1).max(100).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
    icon: z.string().max(50).optional(),
    isPublic: z.boolean().optional(),
});

// TypeScript types
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

export interface CategoryWithPinCount {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    isPublic: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
        pins: number;
    };
}
