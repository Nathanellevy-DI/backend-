import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Factory function to create validation middleware
 */
export function validateInput(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = target === 'body' ? req.body : target === 'query' ? req.query : req.params;
            const validated = schema.parse(data);

            // Replace with validated/transformed data
            if (target === 'body') {
                req.body = validated;
            } else if (target === 'query') {
                req.query = validated;
            } else {
                req.params = validated;
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                res.status(400).json({
                    error: 'Validation failed',
                    details: errors,
                });
                return;
            }
            next(error);
        }
    };
}

/**
 * Validate request body
 */
export function validateBody(schema: ZodSchema) {
    return validateInput(schema, 'body');
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: ZodSchema) {
    return validateInput(schema, 'query');
}

/**
 * Validate route parameters
 */
export function validateParams(schema: ZodSchema) {
    return validateInput(schema, 'params');
}
