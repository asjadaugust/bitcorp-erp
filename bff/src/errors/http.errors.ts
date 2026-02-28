import { AppError } from './base.error';

/**
 * 400 Bad Request Error
 *
 * The request is malformed or contains invalid data.
 *
 * Examples:
 * - Invalid JSON in request body
 * - Missing required fields
 * - Invalid data types
 * - Malformed URLs or query parameters
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', metadata?: Record<string, unknown>) {
    super(message, 400, true, metadata);
  }
}

/**
 * 401 Unauthorized Error
 *
 * Authentication is required but was not provided or is invalid.
 *
 * Examples:
 * - Missing authentication token
 * - Invalid credentials
 * - Expired token
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', metadata?: Record<string, unknown>) {
    super(message, 401, true, metadata);
  }

  getUserMessage(): string {
    return 'You must be logged in to access this resource';
  }
}

/**
 * 403 Forbidden Error
 *
 * User is authenticated but lacks permission to access the resource.
 *
 * Examples:
 * - User doesn't have required role
 * - Resource belongs to another user
 * - Action not allowed in current state
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', metadata?: Record<string, unknown>) {
    super(message, 403, true, metadata);
  }

  getUserMessage(): string {
    return 'You do not have permission to access this resource';
  }
}

/**
 * 404 Not Found Error
 *
 * The requested resource does not exist.
 *
 * Examples:
 * - Project with ID not found
 * - User does not exist
 * - Route does not exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number, metadata?: Record<string, unknown>) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(message, 404, true, {
      resource,
      identifier,
      ...metadata,
    });
  }

  getUserMessage(): string {
    return this.message;
  }
}

/**
 * 409 Conflict Error
 *
 * The request conflicts with the current state of the server.
 *
 * Examples:
 * - Duplicate resource (e.g., email already exists)
 * - Concurrent modification conflict
 * - Resource state conflict (e.g., cannot delete active project)
 */
export class ConflictError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 409, true, metadata);
  }

  getUserMessage(): string {
    return this.message;
  }
}

/**
 * 422 Unprocessable Entity Error
 *
 * The request is well-formed but contains semantic errors.
 *
 * Examples:
 * - Validation failures
 * - Business rule violations
 * - Invalid data combinations
 *
 * Note: Use ValidationError for detailed validation failures
 */
export class UnprocessableEntityError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 422, true, metadata);
  }
}

/**
 * 500 Internal Server Error
 *
 * An unexpected error occurred on the server.
 *
 * Examples:
 * - Unhandled exceptions
 * - Programming errors
 * - System failures
 *
 * Note: This is a programming error (isOperational = false)
 */
export class InternalServerError extends AppError {
  constructor(
    message = 'Internal server error',
    isOperational = false,
    metadata?: Record<string, unknown>
  ) {
    super(message, 500, isOperational, metadata);
  }

  getUserMessage(): string {
    // Never expose internal error details to users
    return 'An unexpected error occurred. Please try again later.';
  }
}

/**
 * 503 Service Unavailable Error
 *
 * The server is temporarily unable to handle the request.
 *
 * Examples:
 * - Database connection lost
 * - External service unavailable
 * - Server overloaded
 */
export class ServiceUnavailableError extends AppError {
  constructor(service?: string, metadata?: Record<string, unknown>) {
    const message = service
      ? `Service '${service}' is temporarily unavailable`
      : 'Service temporarily unavailable';

    super(message, 503, true, { service, ...metadata });
  }

  getUserMessage(): string {
    return 'The service is temporarily unavailable. Please try again later.';
  }
}

/**
 * 429 Too Many Requests Error
 *
 * Rate limit exceeded.
 *
 * Examples:
 * - API rate limit exceeded
 * - Too many login attempts
 * - Spam protection triggered
 */
export class TooManyRequestsError extends AppError {
  constructor(
    message = 'Too many requests',
    retryAfter?: number,
    metadata?: Record<string, unknown>
  ) {
    super(message, 429, true, { retryAfter, ...metadata });
  }

  getUserMessage(): string {
    const retryAfter = this.metadata?.retryAfter;
    if (retryAfter && typeof retryAfter === 'number') {
      return `Too many requests. Please try again in ${retryAfter} seconds.`;
    }
    return 'Too many requests. Please try again later.';
  }
}
