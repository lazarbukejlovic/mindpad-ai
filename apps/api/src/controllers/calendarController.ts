import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { config } from '../config/env';
import { CalendarConnection } from '../models/CalendarConnection';
import { User } from '../models/User';
import { encryptToken, decryptToken } from '../utils/calendarCrypto';
import { logger } from '../utils/logger';
import { ensureConnected } from '../config/database';

// ---------------------------------------------------------------------------
// State token (signed JWT, serverless-safe — no shared memory)
// ---------------------------------------------------------------------------

interface CalendarStatePayload {
  nonce: string;
  userId: string;
}

function generateCalendarState(userId: string): string {
  const payload: CalendarStatePayload = { nonce: randomBytes(12).toString('hex'), userId };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
}

function verifyCalendarState(state: string): CalendarStatePayload {
  return jwt.verify(state, config.jwtSecret) as CalendarStatePayload;
}

// ---------------------------------------------------------------------------
// Google OAuth helpers
// ---------------------------------------------------------------------------

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

async function exchangeCode(code: string): Promise<GoogleTokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri:  config.googleCalendarRedirectUri,
      grant_type:    'authorization_code',
    }).toString(),
  });
  return res.json() as Promise<GoogleTokenResponse>;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     config.googleClientId,
      client_secret: config.googleClientSecret,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }).toString(),
  });
  const data = await res.json() as GoogleTokenResponse;
  if (!data.access_token) throw new Error('refresh_failed');
  return { access_token: data.access_token, expires_in: data.expires_in ?? 3600 };
}

async function getGoogleUserinfo(accessToken: string): Promise<{ email?: string }> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.json() as Promise<{ email?: string }>;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Ensure a valid (possibly refreshed) access token
// ---------------------------------------------------------------------------

async function getValidAccessToken(conn: InstanceType<typeof CalendarConnection>): Promise<string> {
  const isExpired = !conn.tokenExpiryDate || conn.tokenExpiryDate.getTime() < Date.now() + 60_000;

  if (!isExpired) {
    return decryptToken(conn.accessTokenEncrypted);
  }

  if (!conn.refreshTokenEncrypted) {
    throw new Error('reconnect_required');
  }

  const refreshToken = decryptToken(conn.refreshTokenEncrypted);
  let newToken: { access_token: string; expires_in: number };
  try {
    newToken = await refreshAccessToken(refreshToken);
  } catch {
    conn.disconnectedAt = new Date();
    await conn.save();
    throw new Error('reconnect_required');
  }

  conn.accessTokenEncrypted = encryptToken(newToken.access_token);
  conn.tokenExpiryDate = new Date(Date.now() + newToken.expires_in * 1000);
  conn.disconnectedAt = undefined;
  await conn.save();

  return newToken.access_token;
}

// ---------------------------------------------------------------------------
// Public controller functions
// ---------------------------------------------------------------------------

export async function getCalendarStatus(userId: string) {
  await ensureConnected();
  const conn = await CalendarConnection.findOne({ userId, disconnectedAt: { $exists: false } });
  if (!conn) return { connected: false, googleEmail: null, requiresReconnect: false };

  const requiresReconnect = !conn.tokenExpiryDate || (conn.tokenExpiryDate.getTime() < Date.now() && !conn.refreshTokenEncrypted);
  return {
    connected: true,
    googleEmail: conn.googleEmail ?? null,
    requiresReconnect,
  };
}

export function buildCalendarOAuthUrl(userId: string): string {
  if (!config.googleClientId) throw new Error('Google not configured');
  const state = generateCalendarState(userId);
  const params = new URLSearchParams({
    client_id:    config.googleClientId,
    redirect_uri: config.googleCalendarRedirectUri,
    response_type: 'code',
    scope:        config.googleCalendarScope,
    access_type:  'offline',
    prompt:       'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleCalendarCallback(code: string, state: string): Promise<void> {
  let userId: string;
  try {
    const payload = verifyCalendarState(state);
    userId = payload.userId;
  } catch (err) {
    logger.warn('Calendar OAuth: invalid state', { reason: err instanceof Error ? err.message : 'unknown' });
    throw new Error('invalid_state');
  }

  const tokenData = await exchangeCode(code);
  if (tokenData.error || !tokenData.access_token) {
    logger.warn('Calendar OAuth: token exchange failed', { error: tokenData.error });
    throw new Error('token_exchange_failed');
  }

  const userinfo = await getGoogleUserinfo(tokenData.access_token);
  const expiresIn = tokenData.expires_in ?? 3600;

  await ensureConnected();

  const update: Record<string, unknown> = {
    provider: 'google',
    calendarId: 'primary',
    accessTokenEncrypted: encryptToken(tokenData.access_token),
    tokenExpiryDate: new Date(Date.now() + expiresIn * 1000),
    scopes: config.googleCalendarScope.split(/\s+/),
    connectedAt: new Date(),
    $unset: { disconnectedAt: 1 },
  };

  if (tokenData.refresh_token) {
    update.refreshTokenEncrypted = encryptToken(tokenData.refresh_token);
  }
  if (userinfo.email) {
    update.googleEmail = userinfo.email;
  }

  await CalendarConnection.findOneAndUpdate(
    { userId },
    { $set: update },
    { upsert: true, new: true }
  );

  logger.info('Calendar OAuth: connected', { userId });
}

export async function disconnectCalendar(userId: string): Promise<void> {
  await ensureConnected();
  await CalendarConnection.findOneAndUpdate(
    { userId },
    { $set: { disconnectedAt: new Date() } }
  );
  logger.info('Calendar disconnected', { userId });
}

export interface FocusBlockInput {
  title: string;
  taskId?: string;
  startDateTime: string;
  durationMinutes: 25 | 50 | 90;
  notes?: string;
  timezone?: string;
}

export interface FocusBlockResult {
  eventId: string;
  htmlLink: string | null;
  start: string;
  end: string;
  message: string;
}

export async function createFocusBlock(userId: string, input: FocusBlockInput): Promise<FocusBlockResult> {
  await ensureConnected();

  const user = await User.findById(userId).select('plan');
  if (!user || user.plan === 'free') {
    throw new Error('plan_required');
  }

  const conn = await CalendarConnection.findOne({ userId, disconnectedAt: { $exists: false } });
  if (!conn) throw new Error('not_connected');

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(conn);
  } catch (err) {
    if (err instanceof Error && err.message === 'reconnect_required') throw err;
    throw new Error('not_connected');
  }

  const start = new Date(input.startDateTime);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);

  const eventBody = {
    summary: `Focus: ${input.title}`,
    description: [
      'Scheduled from MindPad AI.',
      input.notes ? `Notes: ${input.notes}` : '',
    ].filter(Boolean).join('\n'),
    start: {
      dateTime: start.toISOString(),
      timeZone: input.timezone || 'UTC',
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: input.timezone || 'UTC',
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 10 }],
    },
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${conn.calendarId}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({})) as { error?: { message?: string } };
    logger.warn('Calendar event creation failed', { status: res.status, userId });
    if (res.status === 401) {
      conn.disconnectedAt = new Date();
      await conn.save();
      throw new Error('reconnect_required');
    }
    throw new Error(errBody?.error?.message || 'event_creation_failed');
  }

  const event = await res.json() as { id?: string; htmlLink?: string; start?: { dateTime?: string }; end?: { dateTime?: string } };
  logger.info('Calendar event created', { userId, eventId: event.id });

  return {
    eventId: event.id ?? '',
    htmlLink: event.htmlLink ?? null,
    start: event.start?.dateTime ?? start.toISOString(),
    end: event.end?.dateTime ?? end.toISOString(),
    message: 'Focus block added to Google Calendar.',
  };
}
