import { z } from 'zod';

// Zod schemas for validation
export const CreatePinSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().max(500).optional(),
    notes: z.string().max(5000).optional(),
    imageUrl: z.string().optional(), // Allows URLs and base64 data URIs
    isPublic: z.boolean().default(false),
    categoryId: z.string().uuid().optional(),
});

export const UpdatePinSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    address: z.string().max(500).optional(),
    notes: z.string().max(5000).optional(),
    imageUrl: z.string().optional(), // Allows URLs and base64 data URIs
    isPublic: z.boolean().optional(),
    categoryId: z.string().uuid().nullable().optional(),
});

// TypeScript types
export type CreatePinInput = z.infer<typeof CreatePinSchema>;
export type UpdatePinInput = z.infer<typeof UpdatePinSchema>;

export interface PinWithCategory {
    id: string;
    title: string;
    description: string | null;
    latitude: number;
    longitude: number;
    address: string | null;
    notes: string | null;
    imageUrl: string | null;
    isPublic: boolean;
    userId: string;
    categoryId: string | null;
    createdAt: Date;
    updatedAt: Date;
    category?: {
        id: string;
        name: string;
        color: string | null;
    } | null;
}
