import { z } from 'zod';

// Zod schemas for validation
export const CreateUserSchema = z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    displayName: z.string().min(1).max(100).optional(),
});

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const UpdateUserSchema = z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
    displayName: z.string().min(1).max(100).optional(),
});

// TypeScript types
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export interface UserPublic {
    id: string;
    username: string;
    displayName: string | null;
    createdAt: Date;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
