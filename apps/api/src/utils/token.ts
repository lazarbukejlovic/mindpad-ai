import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
