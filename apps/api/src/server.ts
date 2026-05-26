import express, { Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { connectDB } from './config/database';
import { authMiddleware } from './middleware/auth';
import { authLimiter, forgotPasswordLimiter, aiLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/authRoutes';
import brainDumpRoutes from './routes/brainDumpRoutes';
import taskRoutes from './routes/taskRoutes';
import focusRoutes from './routes/focusRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import aiRoutes from './routes/aiRoutes';
import billingRoutes from './routes/billingRoutes';
import webhookRoutes from './routes/webhookRoutes';
import teamRoutes from './routes/teamRoutes';
import executionPlanRoutes from './routes/executionPlanRoutes';
import reportsRoutes from './routes/reportsRoutes';
import onboardingRoutes from './routes/onboardingRoutes';
import calendarRoutes from './routes/calendarRoutes';
import { handleCalendarCallback } from './controllers/calendarController';
import { getAIStatus } from './services/aiService';
import { previewInvite } from './controllers/teamController';
import { logger } from './utils/logger';

const app = express();

app.use(cors({ origin: config.clientUrl }));

// Stripe webhooks need raw body for signature verification — register BEFORE express.json()
app.use('/api/stripe', express.raw({ type: 'application/json' }), webhookRoutes);

// All other routes get JSON parsing
app.use(express.json());

connectDB().catch((err: Error) => logger.error('DB connection failed', { message: err.message }));

app.get('/api/health', (_req: express.Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rate limit sensitive auth endpoints before routing
app.post('/api/auth/login', authLimiter);
app.post('/api/auth/register', authLimiter);
app.post('/api/auth/forgot-password', forgotPasswordLimiter);
app.post('/api/auth/send-verification-email', forgotPasswordLimiter);
app.use('/api/auth', authRoutes);

// Public invite preview — must be registered BEFORE authMiddleware covers /api/team
app.get('/api/team/invite/preview', async (req: express.Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  if (!token) { res.status(400).json({ error: 'Token is required' }); return; }
  try {
    res.json(await previewInvite(token));
  } catch {
    res.status(500).json({ error: 'Failed to preview invite' });
  }
});

app.use('/api/brain-dumps', authMiddleware, brainDumpRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/focus-sessions', authMiddleware, focusRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/billing', authMiddleware, billingRoutes);
app.use('/api/team', authMiddleware, teamRoutes);
app.use('/api/execution-plans', authMiddleware, executionPlanRoutes);
app.use('/api/reports', authMiddleware, reportsRoutes);
app.use('/api/onboarding', authMiddleware, onboardingRoutes);

// Calendar callback is public (Google redirect, no auth header)
app.get('/api/calendar/google/callback', async (req: express.Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;
  if (error || !code || !state) {
    res.redirect(`${config.clientUrl}/settings?calendar=failed`);
    return;
  }
  try {
    await handleCalendarCallback(code, state);
    res.redirect(`${config.clientUrl}/settings?calendar=connected`);
  } catch {
    res.redirect(`${config.clientUrl}/settings?calendar=failed`);
  }
});
// All other calendar routes require auth
app.use('/api/calendar', authMiddleware, calendarRoutes);

// Public AI status — registered before authMiddleware covers /api/ai
app.get('/api/ai/status', async (_req: express.Request, res: Response) => {
  try {
    res.json(await getAIStatus());
  } catch {
    res.json({ configured: false, available: false, mode: 'offline', reason: 'unknown' });
  }
});
app.use('/api/ai', authMiddleware, aiLimiter, aiRoutes);

app.use((_req: express.Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: Response,
    _next: express.NextFunction
  ) => {
    logger.error('Unhandled server error', { name: err.name, message: err.message });
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
);

const port = config.port;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📝 API available at http://localhost:${port}/api`);
});
