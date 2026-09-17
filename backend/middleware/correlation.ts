import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-correlation-id'] as string) || randomUUID();
  (req as any).correlationId = id;
  res.setHeader('x-correlation-id', id);
  next();
}
