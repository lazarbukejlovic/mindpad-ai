import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { generateToken } from '../utils/token';
import { User } from '../models/User';
import { isMongoConnected } from '../config/database';

// ---------------------------------------------------------------------------
// Serverless-safe state: signed JWT instead of an in-memory Map.
// Vercel may route /google and /google/callback to different function
// instances, so process memory cannot be shared between the two requests.
// The state token is self-contained and verified using the shared JWT_SECRET.
// ---------------------------------------------------------------------------

interface StatePayload {
  nonce: string;
  returnTo?: string;
}

export function generateStateToken(returnTo?: string): string {
  const nonce = randomBytes(16).toString('hex');
  const payload: StatePayload = { nonce, ...(returnTo ? { returnTo } : {}) };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '10m' });
}

export function verifyStateToken(state: string): StatePayload {
  // Throws jwt.JsonWebTokenError / jwt.TokenExpiredError on bad/expired state.
  return jwt.verify(state, config.jwtSecret) as StatePayload;
}

// ---------------------------------------------------------------------------
// OAuth URL
// ---------------------------------------------------------------------------

export function getGoogleAuthUrl(returnTo?: string): string {
  if (!config.googleClientId) throw new Error('Google OAuth not configured');

  const state = generateStateToken(returnTo);
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: config.googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  verified_email?: boolean;
}

async function exchangeCodeForToken(code: string): Promise<GoogleTokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: config.googleRedirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });
  return res.json() as Promise<GoogleTokenResponse>;
}

async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json() as Promise<GoogleUserInfo>;
}

// ---------------------------------------------------------------------------
// Main callback handler
// ---------------------------------------------------------------------------

export async function handleGoogleCallback(
  code: string,
  state: string
): Promise<{ token: string; isNewUser: boolean }> {
  console.log('[Google OAuth] callback started');

  // 1. Verify signed state — no memory required, just signature + expiry check
  try {
    verifyStateToken(state);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown';
    console.error('[Google OAuth] state verification failed:', reason);
    throw new Error('Invalid or expired OAuth state');
  }

  // 2. Exchange authorization code for access token
  let tokenData: GoogleTokenResponse;
  try {
    tokenData = await exchangeCodeForToken(code);
  } catch (err) {
    console.error('[Google OAuth] token exchange network error:', err instanceof Error ? err.message : err);
    throw new Error('Failed to reach Google token endpoint');
  }

  if (tokenData.error || !tokenData.access_token) {
    console.error('[Google OAuth] token exchange failed:', tokenData.error, tokenData.error_description);
    throw new Error(tokenData.error_description || 'Failed to exchange authorization code');
  }

  console.log('[Google OAuth] token exchange succeeded');

  // 3. Fetch user profile
  let profile: GoogleUserInfo;
  try {
    profile = await getGoogleUserInfo(tokenData.access_token);
  } catch (err) {
    console.error('[Google OAuth] userinfo fetch failed:', err instanceof Error ? err.message : err);
    throw new Error('Failed to fetch Google user profile');
  }

  if (!profile.email) {
    console.error('[Google OAuth] userinfo missing email');
    throw new Error('Google account has no email address');
  }

  console.log('[Google OAuth] userinfo fetched, email domain:', profile.email.split('@')[1]);

  // 4. Require database
  if (!isMongoConnected()) {
    console.error('[Google OAuth] database not connected');
    throw new Error('Database unavailable — cannot complete Google login');
  }

  // 5. Find-or-create user — always use the existing MongoDB _id
  const email = profile.email.toLowerCase().trim();
  let isNewUser = false;
  let user = await User.findOne({ email });

  if (user) {
    // Link Google to existing account — preserve _id, plan, Stripe, tasks, etc.
    user.googleId = profile.id;
    if (profile.picture) user.avatarUrl = profile.picture;
    if (profile.name) user.name = profile.name;
    user.authProvider = user.passwordHash ? 'mixed' : 'google';
    await user.save();
    console.log('[Google OAuth] existing user linked by email');
  } else {
    isNewUser = true;
    user = new User({
      email,
      authProvider: 'google',
      googleId: profile.id,
      avatarUrl: profile.picture || undefined,
      name: profile.name || undefined,
      plan: 'free',
    });
    await user.save();
    console.log('[Google OAuth] new user created');
  }

  // 6. Sign JWT using MongoDB _id — never googleId, never UUID
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
  });

  console.log('[Google OAuth] JWT issued for MongoDB user');
  return { token, isNewUser };
}
