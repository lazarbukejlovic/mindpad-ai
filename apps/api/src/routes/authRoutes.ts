import { Router, Request, Response } from 'express';
import { register, login, getMe, AuthError } from '../controllers/authController';
import { getGoogleAuthUrl, handleGoogleCallback } from '../controllers/googleAuthController';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { config } from '../config/env';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function handleAuthError(err: unknown, res: Response, fallbackMsg: string) {
  if (err instanceof AuthError) {
    res.status(err.httpStatus).json({ error: err.message, code: err.code });
    return;
  }
  // Unexpected error — treat as service unavailable (connection failure, etc.)
  console.error(`[Auth] ${fallbackMsg}:`, err instanceof Error ? err.message : err);
  res.status(503).json({
    error: 'Service temporarily unavailable. Please try again in a moment.',
  });
}

// ---------------------------------------------------------------------------
// POST /auth/register
// ---------------------------------------------------------------------------
router.post('/register', async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email?.trim() || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const result = await register(email, password);
    res.status(201).json(result);
  } catch (err: unknown) {
    if (!(err instanceof AuthError)) {
      console.error('[Auth] Register failed:', err instanceof Error ? err.message : err);
    }
    handleAuthError(err, res, 'Register unexpected error');
  }
});

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------
router.post('/login', async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email?.trim() || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const result = await login(email, password);
    res.status(200).json(result);
  } catch (err: unknown) {
    if (!(err instanceof AuthError)) {
      console.error('[Auth] Login failed:', err instanceof Error ? err.message : err);
    }
    handleAuthError(err, res, 'Login unexpected error');
  }
});

// ---------------------------------------------------------------------------
// GET /auth/me
// ---------------------------------------------------------------------------
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'Not authenticated', code: 'NO_TOKEN' });
    return;
  }

  try {
    const user = await getMe(req.userId);
    res.status(200).json(user);
  } catch (err: unknown) {
    handleAuthError(err, res, 'getMe unexpected error');
  }
});

// ---------------------------------------------------------------------------
// Google OAuth — initiate
// ---------------------------------------------------------------------------
router.get('/google', (_req: Request, res: Response) => {
  try {
    if (!config.googleClientId || !config.googleClientSecret) {
      console.error('[Google OAuth] initiate failed: credentials not configured');
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

// ---------------------------------------------------------------------------
// Google OAuth — callback
// ---------------------------------------------------------------------------
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
