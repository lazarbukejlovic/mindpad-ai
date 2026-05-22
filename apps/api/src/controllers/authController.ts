import bcryptjs from 'bcryptjs';
import { generateToken } from '../utils/token';
import { User } from '../models/User';
import { ensureConnected } from '../config/database';

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
  };
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
  const user = new User({ email: normalizedEmail, passwordHash, authProvider: 'email' });
  await user.save();

  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
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
