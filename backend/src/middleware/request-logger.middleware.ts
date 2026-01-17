/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger';
import { asyncContext } from '../utils/async-context';
import { performanceMetrics } from '../utils/performance-metrics.service';
import { performanceConfig } from '../config/performance.config';

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
        const user = (req as any).user;

        // Record performance metrics
        if (performanceConfig.metrics.enabled) {
          performanceMetrics.recordEndpointTime(duration);

          // Track slow endpoints
          if (duration >= performanceConfig.http.slowEndpointWarning) {
            performanceMetrics.recordSlowEndpoint();
          }

          // Track HTTP errors
          if (res.statusCode >= 400) {
            performanceMetrics.recordHttpError();
          }
        }

        // Determine log level and add performance warnings
        let level: 'http' | 'warn' | 'error' = 'http';
        let performanceNote: string | undefined;

        if (duration >= performanceConfig.http.slowEndpointError) {
          level = 'error';
          performanceNote = 'CRITICAL: Very slow endpoint';
        } else if (duration >= performanceConfig.http.slowEndpointWarning) {
          level = 'warn';
          performanceNote = 'WARNING: Slow endpoint';
        } else if (res.statusCode >= 500) {
          level = 'error';
        } else if (res.statusCode >= 400) {
          level = 'warn';
        }

        const logData: Record<string, unknown> = {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          durationMs: duration,
          userId: user?.id,
          username: user?.username,
          context: 'RequestLogger.response',
        };

        // Add performance note if applicable
        if (performanceNote) {
          logData.performance = performanceNote;
          logData.threshold =
            duration >= performanceConfig.http.slowEndpointError
              ? performanceConfig.http.slowEndpointError
              : performanceConfig.http.slowEndpointWarning;
        }

        Logger[level](`${req.method} ${req.path} ${res.statusCode}`, logData);
      });

      // Continue with request
      next();
    }
  );
};
