import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger';

/**
 * Request logger middleware
 *
 * Logs all HTTP requests with:
 * - Correlation ID (auto-generated)
 * - Request method, path, query params
 * - Response status code and duration
 * - Client IP and user agent
 *
 * The correlation ID is:
 * - Generated for each request
 * - Added to response headers (X-Correlation-ID)
 * - Included in all logs for that request
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate or use existing correlation ID
  const correlationId =
    (req.headers['x-correlation-id'] as string) || Logger.generateCorrelationId();
  Logger.setCorrelationId(correlationId);

  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  const start = Date.now();

  // Log incoming request
  Logger.http(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'http';

    Logger[level](`${req.method} ${req.path} - ${res.statusCode}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};
