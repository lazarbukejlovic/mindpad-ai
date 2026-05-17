import express, { Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { connectDB } from './config/database';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/authRoutes';
import brainDumpRoutes from './routes/brainDumpRoutes';
import taskRoutes from './routes/taskRoutes';
import focusRoutes from './routes/focusRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();

// Middleware
app.use(cors({ origin: config.clientUrl }));
app.use(express.json());

// Database connection
connectDB().catch(console.error);

// Health check
app.get('/api/health', (_req: express.Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/brain-dumps', authMiddleware, brainDumpRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/focus-sessions', authMiddleware, focusRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);

// 404 handler
app.use((_req: express.Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: Response,
    _next: express.NextFunction
  ) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

const port = config.port;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📝 API available at http://localhost:${port}/api`);
});
