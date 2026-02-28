/**
 * Base Error Class for Application Errors
 *
 * All custom errors in the application should extend this class.
 *
 * Features:
 * - HTTP status code
 * - Operational vs Programming error flag
 * - Stack trace capture
 * - Serialization to JSON
 * - Metadata support
 *
 * Usage:
 *   class MyError extends AppError {
 *     constructor(message: string) {
 *       super(message, 400, true);
 *     }
 *   }
 */
export abstract class AppError extends Error {
  /**
   * HTTP status code for this error
   */
  public readonly statusCode: number;

  /**
   * Whether this is an operational error (expected, handled)
   * vs a programming error (bug, unexpected)
   *
   * Operational errors (isOperational = true):
   * - Invalid user input
   * - Resource not found
   * - Business rule violations
   * - External service failures
   *
   * Programming errors (isOperational = false):
   * - Null pointer exceptions
   * - Undefined variable access
   * - Logic errors
   */
  public readonly isOperational: boolean;

  /**
   * Additional metadata about the error
   */
  public readonly metadata?: Record<string, unknown>;

  /**
   * Timestamp when error occurred
   */
  public readonly timestamp: Date;

  /**
   * Creates a new application error
   *
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code (default: 500)
   * @param isOperational - Whether this is an operational error (default: true)
   * @param metadata - Additional error context
   */
  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    metadata?: Record<string, unknown>
  ) {
    super(message);

    // Set the prototype explicitly (required for extending built-in classes in TypeScript)
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.metadata = metadata;
    this.timestamp = new Date();

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize error to JSON for API responses
   *
   * @returns Object safe for JSON serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      ...(this.metadata && { metadata: this.metadata }),
      // Only include stack in development
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }

  /**
   * Get user-friendly error message (safe to expose to clients)
   *
   * Override this in subclasses to provide custom user messages
   */
  getUserMessage(): string {
    return this.message;
  }

  /**
   * Get log-level for this error
   *
   * Operational errors: warn
   * Programming errors: error
   */
  getLogLevel(): 'warn' | 'error' {
    return this.isOperational ? 'warn' : 'error';
  }
}
