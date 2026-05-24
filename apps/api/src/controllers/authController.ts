import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import { generateToken } from '../utils/token';
import { User } from '../models/User';
import { ensureConnected } from '../config/database';
import { sendPasswordResetEmail, sendEmailVerification } from '../services/emailService';

// ---------------------------------------------------------------------------
// Structured auth error — carries HTTP status and machine-readable code so
// route handlers can respond without string-matching on error messages.
// ---------------------------------------------------------------------------
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function serializeUser(user: InstanceType<typeof User>) {
  return {
    id: user._id.toString(),
    _id: user._id.toString(),
    email: user.email,
    name: user.name || null,
    avatarUrl: user.avatarUrl || null,
    authProvider: user.authProvider || 'email',
    plan: user.plan || 'free',
    subscriptionStatus: user.subscriptionStatus || null,
    emailVerified: user.emailVerified ?? false,
  };
}

function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------
export async function register(email: string, password: string) {
  await ensureConnected();

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (existingUser.passwordHash) {
      // Full email/password account already exists — cannot register again.
      throw new AuthError(
        'An account with this email already exists. Please sign in.',
        'EMAIL_TAKEN',
        409
      );
    }

    // Google-only account exists — add a password and upgrade to 'mixed'.
    // Preserves existing _id, plan, Stripe, tasks, brain dumps, etc.
    existingUser.passwordHash = await bcryptjs.hash(password, 10);
    existingUser.authProvider = 'mixed';
    await existingUser.save();

    const token = generateToken({
      userId: existingUser._id.toString(),
      email: existingUser.email,
    });
    return { token, user: serializeUser(existingUser) };
  }

  // New user — create with email/password.
  const passwordHash = await bcryptjs.hash(password, 10);
  const user = new User({ email: normalizedEmail, passwordHash, authProvider: 'email', emailVerified: false });
  await user.save();

  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
  });

  // Fire-and-forget verification email — never block registration on email failure.
  const rawToken = generateRawToken();
  user.emailVerificationToken = hashToken(rawToken);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.save().then(() =>
    sendEmailVerification(user.email, rawToken).catch((err: unknown) => {
      console.error('[Auth] Verification email failed after register:', err instanceof Error ? err.message : err);
    })
  ).catch((err: unknown) => {
    console.error('[Auth] Failed to save verification token after register:', err instanceof Error ? err.message : err);
  });

  return { token, user: serializeUser(user) };
}

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------
export async function login(email: string, password: string) {
  await ensureConnected();

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AuthError('Invalid email or password.', 'INVALID_CREDENTIALS', 401);
  }

  if (!user.passwordHash) {
    // Google-only account — no password has ever been set.
    throw new AuthError(
      'This account uses Google sign-in. Use the "Continue with Google" button, or register with a password first.',
      'GOOGLE_ACCOUNT_NO_PASSWORD',
      400
    );
  }

  const isValid = await bcryptjs.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AuthError('Invalid email or password.', 'INVALID_CREDENTIALS', 401);
  }

  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
  });
  return { token, user: serializeUser(user) };
}

// ---------------------------------------------------------------------------
// getMe
// ---------------------------------------------------------------------------
export async function getMe(userId: string) {
  await ensureConnected();

  const user = await User.findById(userId);
  if (!user) {
    throw new AuthError('User not found', 'USER_NOT_FOUND', 404);
  }
  return serializeUser(user);
}

// ---------------------------------------------------------------------------
// forgotPassword
// Always returns successfully to prevent email enumeration.
// ---------------------------------------------------------------------------
export async function forgotPassword(email: string): Promise<void> {
  await ensureConnected();

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  // Silently return if user not found or is Google-only (no password to reset).
  if (!user || !user.passwordHash) return;

  const rawToken = generateRawToken();
  user.passwordResetToken = hashToken(rawToken);
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save();

  sendPasswordResetEmail(user.email, rawToken).catch(err => {
    console.error('[Auth] Failed to send password reset email:', err?.message);
  });
}

// ---------------------------------------------------------------------------
// resetPassword
// ---------------------------------------------------------------------------
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await ensureConnected();

  const hashed = hashToken(token);
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AuthError(
      'This password reset link is invalid or has expired. Please request a new one.',
      'INVALID_RESET_TOKEN',
      400
    );
  }

  user.passwordHash = await bcryptjs.hash(newPassword, 10);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // Resetting via email proves email access — mark it verified.
  if (!user.emailVerified) user.emailVerified = true;
  await user.save();
}

// ---------------------------------------------------------------------------
// sendVerificationEmailForUser  (protected — requires logged-in user)
// ---------------------------------------------------------------------------
export async function sendVerificationEmailForUser(userId: string): Promise<void> {
  await ensureConnected();

  const user = await User.findById(userId);
  if (!user) throw new AuthError('User not found', 'USER_NOT_FOUND', 404);
  if (user.emailVerified) {
    throw new AuthError('Your email is already verified.', 'ALREADY_VERIFIED', 400);
  }

  const rawToken = generateRawToken();
  user.emailVerificationToken = hashToken(rawToken);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await user.save();

  await sendEmailVerification(user.email, rawToken);
}

// ---------------------------------------------------------------------------
// verifyEmail  (GET with token — redirects to frontend after verification)
// ---------------------------------------------------------------------------
export async function verifyEmail(token: string): Promise<void> {
  await ensureConnected();

  const hashed = hashToken(token);
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AuthError(
      'This verification link is invalid or has expired. Please request a new one.',
      'INVALID_VERIFICATION_TOKEN',
      400
    );
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
}
