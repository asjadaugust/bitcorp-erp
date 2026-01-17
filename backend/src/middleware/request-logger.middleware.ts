/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger';
import { asyncContext } from '../utils/async-context';

/**
 * Request logger middleware with AsyncLocalStorage
 *
 * Features:
 * - Automatic correlation ID generation per request
 * - Request/response logging with timing
 * - User context tracking (added by auth middleware)
 * - Isolation between concurrent requests
 *
 * The correlation ID is:
 * - Generated for each request or reused from header
 * - Added to response headers (X-Correlation-ID)
 * - Automatically included in all logs via AsyncLocalStorage
 * - Isolated per request (thread-safe)
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate or use existing correlation ID
  const correlationId =
    (req.headers['x-correlation-id'] as string) || Logger.generateCorrelationId();

  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  const start = Date.now();

  // Run the rest of the request in AsyncLocalStorage context
  asyncContext.run(
    {
      correlationId,
      path: req.path,
      method: req.method,
    },
    () => {
      // Log incoming request
      Logger.http(`${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        context: 'RequestLogger.incoming',
      });

      // Log response when finished
      res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'warn' : 'http';
        const user = (req as any).user;

        Logger[level](`${req.method} ${req.path} ${res.statusCode}`, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          durationMs: duration,
          userId: user?.id,
          username: user?.username,
          context: 'RequestLogger.response',
        });
      });

      // Continue with request
      next();
    }
  );
};
