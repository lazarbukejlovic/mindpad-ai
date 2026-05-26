import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { verifyToken } from '../utils/token';

export interface AuthRequest extends Request {
  userId?: string;
  email?: string;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token', code: 'NO_TOKEN' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(payload.userId)) {
    res.status(401).json({
      error: 'Invalid session. Please sign in again.',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  req.userId = payload.userId;
  req.email = payload.email;
  next();
}
