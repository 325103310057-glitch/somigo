import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'An internal error occurred. Please try again later.' 
      : message,
    code: err.code || 'SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
}
