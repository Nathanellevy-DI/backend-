import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import routes from './routes';

// Create Express app
const app = express();

// Middleware
app.use(cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
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
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    try {
        // Connect to database
        await connectDatabase();

        // Start listening
        app.listen(env.PORT, () => {
            console.log(`
🚀 Travel Maps Backend is running!
   
   Local:    http://localhost:${env.PORT}
   Health:   http://localhost:${env.PORT}/api/health
   
   Environment: ${env.NODE_ENV}
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;
