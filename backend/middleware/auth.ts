import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.ts';

export interface AuthPayload {
  sub: string;
  role: string;
  email?: string;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(
      token,
      config.jwtSecret
    ) as AuthPayload;

    (req as any).user = payload;
    next();
  } catch (err: any) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      detail: err.message
    });
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(
    payload,
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as any
  );
}

/**
 * Verify a JWT token.
 * Used by WebSocket authentication.
 */
export function verifyToken(token: string): AuthPayload {
  return jwt.verify(
    token,
    config.jwtSecret
  ) as AuthPayload;
}
