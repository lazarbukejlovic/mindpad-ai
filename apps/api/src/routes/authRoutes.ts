import { Router, Request, Response } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { getGoogleAuthUrl, handleGoogleCallback } from '../controllers/googleAuthController';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { config } from '../config/env';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const result = await register(email, password);
    res.status(201).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    if (message === 'User already exists') {
      res.status(409).json({ error: message });
    } else if (message.includes('temporarily unavailable')) {
      res.status(503).json({ error: message });
    } else {
      res.status(400).json({ error: message });
    }
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const result = await login(email, password);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    if (message.includes('temporarily unavailable')) {
      res.status(503).json({ error: message });
    } else {
      res.status(401).json({ error: message });
    }
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await getMe(req.userId);
    res.status(200).json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    res.status(400).json({ error: message });
  }
});

// Google OAuth — initiate
router.get('/google', (_req: Request, res: Response) => {
  try {
    if (!config.googleClientId || !config.googleClientSecret) {
      console.error('[Google OAuth] initiate failed: client credentials not configured');
      res.redirect(`${config.clientUrl}/login?error=google_not_configured`);
      return;
    }
    const url = getGoogleAuthUrl();
    res.redirect(url);
  } catch (error: unknown) {
    console.error('[Google OAuth] initiate error:', error instanceof Error ? error.message : error);
    res.redirect(`${config.clientUrl}/login?error=google_auth_failed`);
  }
});

// Google OAuth — callback
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    console.error('[Google OAuth] provider returned error:', error);
    res.redirect(`${config.clientUrl}/login?error=google_auth_failed`);
    return;
  }

  if (!code || !state) {
    console.error('[Google OAuth] callback missing code or state');
    res.redirect(`${config.clientUrl}/login?error=google_auth_failed`);
    return;
  }

  try {
    const { token } = await handleGoogleCallback(code, state);
    res.redirect(
      `${config.clientUrl}/dashboard?google=success&token=${encodeURIComponent(token)}`
    );
  } catch (err: unknown) {
    console.error('[Google OAuth] callback error:', err instanceof Error ? err.message : err);
    res.redirect(`${config.clientUrl}/login?error=google_auth_failed`);
  }
});

export default router;
