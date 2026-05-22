import { randomBytes } from 'crypto';
import { config } from '../config/env';
import { generateToken } from '../utils/token';
import { User } from '../models/User';
import { isMongoConnected } from '../config/database';

// In-memory state store: state -> expiry timestamp
const pendingStates = new Map<string, number>();
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateState(): string {
  const state = randomBytes(24).toString('hex');
  pendingStates.set(state, Date.now() + STATE_TTL_MS);
  // Clean up expired states
  for (const [k, exp] of pendingStates) {
    if (Date.now() > exp) pendingStates.delete(k);
  }
  return state;
}

function consumeState(state: string): boolean {
  const exp = pendingStates.get(state);
  if (!exp) return false;
  pendingStates.delete(state);
  return Date.now() <= exp;
}

export function getGoogleAuthUrl(): string {
  if (!config.googleClientId) throw new Error('Google OAuth not configured');

  const state = generateState();
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

interface GoogleTokenResponse {
  access_token: string;
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

export async function handleGoogleCallback(
  code: string,
  state: string
): Promise<{ token: string; isNewUser: boolean }> {
  if (!consumeState(state)) {
    throw new Error('Invalid or expired OAuth state');
  }

  const tokenData = await exchangeCodeForToken(code);
  if (tokenData.error || !tokenData.access_token) {
    throw new Error(tokenData.error_description || 'Failed to exchange authorization code');
  }

  const profile = await getGoogleUserInfo(tokenData.access_token);
  if (!profile.email) {
    throw new Error('Google account has no email address');
  }

  if (!isMongoConnected()) {
    throw new Error('Database unavailable — cannot complete Google login');
  }

  const email = profile.email.toLowerCase().trim();
  let isNewUser = false;

  let user = await User.findOne({ email });

  if (user) {
    // Link Google to existing account — preserve all existing data
    user.googleId = profile.id;
    if (profile.picture) user.avatarUrl = profile.picture;
    if (profile.name) user.name = profile.name;
    // If they already had a password, mark as mixed; otherwise pure google
    user.authProvider = user.passwordHash ? 'mixed' : 'google';
    await user.save();
  } else {
    // New user — create with Google provider, free plan
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
  }

  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
  });

  return { token, isNewUser };
}
