import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err.status || err.statusCode || 500;
  const correlationId = (req as any).correlationId;
  console.error(`[${correlationId || 'no-correlation'}]`, err);
  res.status(status).json({
    error: err.message || 'Internal server error',
    correlationId,
  });
}
