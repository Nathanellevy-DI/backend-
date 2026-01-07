import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvConfig {
    NODE_ENV: string;
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    CORS_ORIGIN: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const env: EnvConfig = {
    NODE_ENV: getEnvVar('NODE_ENV', 'development'),
    PORT: parseInt(getEnvVar('PORT', '3000'), 10),
    DATABASE_URL: getEnvVar('DATABASE_URL'),
    JWT_SECRET: getEnvVar('JWT_SECRET'),
    JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
    JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '1h'),
    JWT_REFRESH_EXPIRES_IN: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),
    CORS_ORIGIN: getEnvVar('CORS_ORIGIN', '*'),
};
