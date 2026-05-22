import { Router, Request, Response } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { getGoogleAuthUrl, handleGoogleCallback } from '../controllers/googleAuthController';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { config } from '../config/env';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await register(email, password);
    res.status(201).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await login(email, password);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
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
      res.redirect(`${config.clientUrl}/login?error=google_not_configured`);
      return;
    }
    const url = getGoogleAuthUrl();
    res.redirect(url);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Google auth failed';
    console.error('[Google OAuth] initiate error:', message);
    res.redirect(`${config.clientUrl}/login?error=google_auth_failed`);
  }
});

// Google OAuth — callback
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error || !code || !state) {
    res.redirect(`${config.clientUrl}/login?error=google_auth_failed`);
    return;
  }

  try {
    const { token } = await handleGoogleCallback(code, state);
    res.redirect(
      `${config.clientUrl}/dashboard?google=success&token=${encodeURIComponent(token)}`
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Google auth failed';
    console.error('[Google OAuth] callback error:', message);
    res.redirect(`${config.clientUrl}/login?error=google_auth_failed`);
  }
});

export default router;
