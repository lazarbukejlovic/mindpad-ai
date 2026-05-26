const SENSITIVE_KEYS = new Set([
  'password', 'token', 'jwt', 'apikey', 'api_key', 'secret', 'authorization',
  'resettoken', 'reset_token', 'verificationtoken', 'verification_token',
  'invitetoken', 'invite_token', 'stripekey', 'stripe_key', 'webhooksecret',
  'webhook_secret', 'clientsecret', 'client_secret', 'accesstoken', 'access_token',
  'refreshtoken', 'refresh_token', 'sessiontoken', 'session_token',
]);

const JWT_RE = /^eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase().replace(/[-_]/g, ''));
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[truncated]';
  if (typeof value === 'string') {
    if (JWT_RE.test(value.trim())) return '[REDACTED:jwt]';
    if (value.length > 200) return value.slice(0, 60) + '…[truncated]';
    return value;
  }
  if (Array.isArray(value)) return value.map(v => sanitize(v, depth + 1));
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = isSensitiveKey(k) ? '[REDACTED]' : sanitize(v, depth + 1);
    }
    return result;
  }
  return value;
}

function formatMessage(level: string, message: string, meta?: unknown): string {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg: message,
  };
  if (meta !== undefined) {
    entry.meta = sanitize(meta);
  }
  return JSON.stringify(entry);
}

export const logger = {
  info(message: string, meta?: unknown): void {
    console.log(formatMessage('info', message, meta));
  },
  warn(message: string, meta?: unknown): void {
    console.warn(formatMessage('warn', message, meta));
  },
  error(message: string, meta?: unknown): void {
    const sanitizedMeta = meta instanceof Error
      ? { name: meta.name, message: meta.message }
      : sanitize(meta);
    console.error(formatMessage('error', message, sanitizedMeta));
  },
};
