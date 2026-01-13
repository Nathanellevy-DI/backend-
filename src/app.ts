import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import routes from './routes';

// Create Express app
const app = express();

// Middleware
app.use(cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map(o => o.trim()),
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
}

// Lazy database connection for serverless
let dbConnected = false;
app.use(async (req, res, next) => {
    if (!dbConnected) {
        try {
            await connectDatabase();
            dbConnected = true;
        } catch (error) {
            console.error('Database connection failed:', error);
            return res.status(500).json({ error: 'Database connection failed' });
        }
    }
    next();
});

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Travel Maps Backend',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            pins: '/api/v1/pins',
            categories: '/api/v1/categories',
            share: '/api/v1/share',
        },
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error & { name?: string; issues?: any }, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err.message || err);

    // Zod validation errors
    if (err.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: err.issues });
        return;
    }

    // Known errors with messages
    if (err.message && !err.message.includes('prisma')) {
        res.status(400).json({ error: err.message });
        return;
    }

    res.status(500).json({ error: 'Internal server error' });
});

// Start server only in non-serverless environment
if (process.env.VERCEL !== '1') {
    async function startServer() {
        try {
            await connectDatabase();
            // Use process.env.PORT directly for Railway, fall back to env.PORT
            const port = process.env.PORT || env.PORT;
            // Bind to 0.0.0.0 to accept connections from Railway's proxy
            app.listen(Number(port), '0.0.0.0', () => {
                console.log(`
🚀 Travel Maps Backend is running!
   
   Local:    http://localhost:${port}
   Health:   http://localhost:${port}/api/health
   
   Environment: ${env.NODE_ENV}
      `);
            });
        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }
    startServer();
}

// Export for Vercel
export default app;
module.exports = app;
