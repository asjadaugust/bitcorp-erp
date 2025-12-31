import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/api-response';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', error);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const code = statusCode === 500 ? 'INTERNAL_ERROR' : 'UNHANDLED_ERROR';

  sendError(
    res,
    statusCode,
    code,
    error.message || 'Internal server error',
    process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
  );
};

export const notFound = (req: Request, res: Response, _next: NextFunction): void => {
  sendError(res, 404, 'ROUTE_NOT_FOUND', `Route ${req.originalUrl} not found`);
};
