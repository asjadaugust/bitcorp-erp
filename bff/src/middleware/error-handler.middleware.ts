import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  isAppError,
  ValidationError,
  InternalServerError,
  NotFoundError,
} from '../errors';
import Logger from '../utils/logger';

/**
 * Error Response Structure
 *
 * Consistent error response format for all API errors
 */
interface ErrorResponse {
  success: false;
  error: {
    name: string;
    message: string;
    statusCode: number;
    code?: string;
    timestamp: string;
    correlationId: string;
    errors?: unknown[];
    metadata?: Record<string, unknown>;
    stack?: string;
  };
}

/**
 * Global Error Handler Middleware
 *
 * Catches all errors thrown in the application and converts them to
 * consistent JSON responses.
 *
 * Features:
 * - Handles AppError instances with proper status codes
 * - Converts unknown errors to InternalServerError
 * - Logs all errors with appropriate log levels
 * - Includes correlation IDs in responses
 * - Sanitizes error details in production
 * - Provides user-friendly error messages
 *
 * Error Types Handled:
 * - AppError (all custom error classes)
 * - ValidationError (with field details)
 * - DatabaseError (with error type)
 * - BusinessRuleError (with error code)
 * - Standard JavaScript Error
 * - Unknown errors
 *
 * Usage:
 *   app.use(errorHandler);  // Register as last middleware
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const correlationId = Logger.getCorrelationId();
  const isProduction = process.env.NODE_ENV === 'production';

  // Convert error to AppError if it isn't already
  let appError: AppError;
  if (isAppError(error)) {
    appError = error;
  } else {
    // Wrap unknown errors in InternalServerError
    appError = new InternalServerError(
      error.message || 'An unexpected error occurred',
      false, // Programming error
      {
        originalError: error.constructor.name,
        ...(error.stack && { stack: error.stack }),
      }
    );
  }

  // Log the error with appropriate level
  const logLevel = appError.getLogLevel();
  const logMetadata = {
    errorName: appError.name,
    statusCode: appError.statusCode,
    isOperational: appError.isOperational,
    method: req.method,
    path: req.path,
    userId: (req as Request & { user?: { id: number } }).user?.id,
    ...(appError.metadata && { metadata: appError.metadata }),
    ...(error.stack && { stack: error.stack }),
  };

  if (logLevel === 'error') {
    Logger.error(appError.message, logMetadata);
  } else {
    Logger.warn(appError.message, logMetadata);
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      name: appError.name,
      message: isProduction ? appError.getUserMessage() : appError.message,
      statusCode: appError.statusCode,
      timestamp: appError.timestamp.toISOString(),
      correlationId,
    },
  };

  // Add error code for business rule errors
  if ('code' in appError && appError.code) {
    errorResponse.error.code = appError.code as string;
  }

  // Add field errors for validation errors
  if (appError instanceof ValidationError && appError.errors.length > 0) {
    errorResponse.error.errors = appError.errors;
  }

  // Add metadata in development mode
  if (!isProduction && appError.metadata) {
    errorResponse.error.metadata = appError.metadata;
  }

  // Add stack trace in development mode
  if (!isProduction && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  // Send response
  res.status(appError.statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 *
 * Handles requests to routes that don't exist.
 * Should be registered after all other routes.
 *
 * Usage:
 *   app.use(notFoundHandler);  // Register after all routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError('Route', req.originalUrl, {
    method: req.method,
    path: req.path,
  });

  next(error);
};

/**
 * Unhandled Rejection Handler
 *
 * Catches unhandled promise rejections at the process level.
 * This is a safety net for promises that weren't properly caught.
 *
 * Usage:
 *   setupUnhandledRejectionHandler();
 */
export const setupUnhandledRejectionHandler = (): void => {
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    Logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString(),
    });

    // In production, we might want to exit the process
    // and let a process manager (PM2, Docker, Kubernetes) restart it
    if (process.env.NODE_ENV === 'production') {
      Logger.error('Shutting down due to unhandled rejection');
      process.exit(1);
    }
  });
};

/**
 * Uncaught Exception Handler
 *
 * Catches uncaught exceptions at the process level.
 * These are serious errors that indicate programming bugs.
 *
 * Usage:
 *   setupUncaughtExceptionHandler();
 */
export const setupUncaughtExceptionHandler = (): void => {
  process.on('uncaughtException', (error: Error) => {
    Logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });

    // Uncaught exceptions are serious - exit immediately
    Logger.error('Shutting down due to uncaught exception');
    process.exit(1);
  });
};

/**
 * Setup all process-level error handlers
 *
 * Call this once during application startup.
 *
 * Usage:
 *   setupProcessErrorHandlers();
 */
export const setupProcessErrorHandlers = (): void => {
  setupUnhandledRejectionHandler();
  setupUncaughtExceptionHandler();
};
