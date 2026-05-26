import { Request, Response, NextFunction } from 'express';

interface RateRecord {
  count: number;
  resetAt: number;
}

function createLimiter(maxRequests: number, windowMs: number) {
  const store = new Map<string, RateRecord>();

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    const record = store.get(ip);

    if (!record || now > record.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    record.count += 1;

    if (record.count > maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    next();
  };
}

// 20 req per 15 min — login and register
export const authLimiter = createLimiter(20, 15 * 60 * 1000);

// 5 req per 15 min — forgot-password and resend verification
export const forgotPasswordLimiter = createLimiter(5, 15 * 60 * 1000);

// 30 req per 1 min — AI generation endpoints
export const aiLimiter = createLimiter(30, 60 * 1000);

// 20 req per hour — team invites
export const teamInviteLimiter = createLimiter(20, 60 * 60 * 1000);
