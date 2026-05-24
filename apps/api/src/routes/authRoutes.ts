import { Router, Request, Response } from 'express';
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  sendVerificationEmailForUser,
  verifyEmail,
  AuthError,
} from '../controllers/authController';
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
    error: 'Unable to connect. Please check your connection and try again.',
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
// POST /auth/forgot-password  (public)
// ---------------------------------------------------------------------------
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };

  if (!email?.trim()) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    await forgotPassword(email);
    // Always respond 200 to prevent email enumeration.
    res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err: unknown) {
    handleAuthError(err, res, 'forgotPassword unexpected error');
  }
});

// ---------------------------------------------------------------------------
// POST /auth/reset-password  (public — token from email)
// ---------------------------------------------------------------------------
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string };

  if (!token?.trim() || !password) {
    res.status(400).json({ error: 'Token and new password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  try {
    await resetPassword(token, password);
    res.status(200).json({ message: 'Password has been reset successfully. You can now sign in.' });
  } catch (err: unknown) {
    if (!(err instanceof AuthError)) {
      console.error('[Auth] resetPassword failed:', err instanceof Error ? err.message : err);
    }
    handleAuthError(err, res, 'resetPassword unexpected error');
  }
});

// ---------------------------------------------------------------------------
// POST /auth/send-verification-email  (protected)
// ---------------------------------------------------------------------------
router.post('/send-verification-email', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ error: 'Not authenticated', code: 'NO_TOKEN' });
    return;
  }

  try {
    await sendVerificationEmailForUser(req.userId);
    res.status(200).json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (err: unknown) {
    if (!(err instanceof AuthError)) {
      console.error('[Auth] sendVerificationEmail failed:', err instanceof Error ? err.message : err);
    }
    handleAuthError(err, res, 'sendVerificationEmail unexpected error');
  }
});

// ---------------------------------------------------------------------------
// GET /auth/verify-email  (public — linked from email, redirects to frontend)
// ---------------------------------------------------------------------------
router.get('/verify-email', async (req: Request, res: Response) => {
  const { token } = req.query as { token?: string };

  if (!token?.trim()) {
    res.redirect(`${config.clientUrl}/settings?verified=error&reason=missing_token`);
    return;
  }

  try {
    await verifyEmail(token);
    res.redirect(`${config.clientUrl}/settings?verified=success`);
  } catch (err: unknown) {
    const code = err instanceof AuthError ? err.code : 'unknown';
    res.redirect(`${config.clientUrl}/settings?verified=error&reason=${code}`);
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
