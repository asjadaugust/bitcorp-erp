import { AppError } from './base.error';
import { ConflictError } from './http.errors';

/**
 * Database Error Types
 */
export enum DatabaseErrorType {
  CONNECTION = 'CONNECTION',
  QUERY = 'QUERY',
  TRANSACTION = 'TRANSACTION',
  CONSTRAINT = 'CONSTRAINT',
  TIMEOUT = 'TIMEOUT',
  DEADLOCK = 'DEADLOCK',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Database Error (500)
 *
 * Represents errors that occur during database operations.
 *
 * Examples:
 * - Connection failures
 * - Query syntax errors
 * - Transaction failures
 * - Constraint violations
 * - Timeouts
 * - Deadlocks
 *
 * Usage:
 *   try {
 *     await repository.save(entity);
 *   } catch (error) {
 *     throw DatabaseError.fromTypeORMError(error, 'Failed to save project');
 *   }
 */
export class DatabaseError extends AppError {
  /**
   * Type of database error
   */
  public readonly errorType: DatabaseErrorType;

  /**
   * Original database error (for debugging)
   */
  public readonly originalError?: Error;

  /**
   * SQL query that caused the error (if available)
   */
  public readonly query?: string;

  /**
   * Database table involved (if known)
   */
  public readonly table?: string;

  constructor(
    message: string,
    errorType: DatabaseErrorType = DatabaseErrorType.UNKNOWN,
    originalError?: Error,
    metadata?: Record<string, unknown>
  ) {
    // Database errors are generally operational (connection issues, constraints)
    // but query errors might be programming errors
    const isOperational = errorType !== DatabaseErrorType.QUERY;

    super(message, 500, isOperational, {
      errorType,
      ...(originalError && { originalMessage: originalError.message }),
      ...metadata,
    });

    this.errorType = errorType;
    this.originalError = originalError;
    this.query = metadata?.query as string | undefined;
    this.table = metadata?.table as string | undefined;
  }

  getUserMessage(): string {
    switch (this.errorType) {
      case DatabaseErrorType.CONNECTION:
        return 'Database connection error. Please try again later.';
      case DatabaseErrorType.TIMEOUT:
        return 'Database operation timed out. Please try again.';
      case DatabaseErrorType.CONSTRAINT:
        return 'Database constraint violation. The operation conflicts with existing data.';
      case DatabaseErrorType.DEADLOCK:
        return 'Database deadlock detected. Please try again.';
      default:
        return 'A database error occurred. Please try again later.';
    }
  }

  /**
   * Create DatabaseError from TypeORM/PostgreSQL error
   */
  static fromTypeORMError(
    error: Error & { code?: string; constraint?: string; table?: string; detail?: string },
    contextMessage?: string
  ): DatabaseError | ConflictError {
    const errorCode = error.code;
    const constraint = error.constraint;
    const table = error.table;
    const detail = error.detail;

    // PostgreSQL error codes
    // https://www.postgresql.org/docs/current/errcodes-appendix.html

    // Unique constraint violation (23505)
    if (errorCode === '23505') {
      const message = contextMessage || `Duplicate entry: ${constraint || 'unknown constraint'}`;
      return new ConflictError(message, {
        constraint,
        table,
        detail,
        errorCode,
      });
    }

    // Foreign key constraint violation (23503)
    if (errorCode === '23503') {
      const message =
        contextMessage || `Foreign key constraint violation: ${constraint || 'unknown'}`;
      return new DatabaseError(message, DatabaseErrorType.CONSTRAINT, error, {
        constraint,
        table,
        detail,
        errorCode,
      });
    }

    // Check constraint violation (23514)
    if (errorCode === '23514') {
      const message = contextMessage || `Check constraint violation: ${constraint || 'unknown'}`;
      return new DatabaseError(message, DatabaseErrorType.CONSTRAINT, error, {
        constraint,
        table,
        detail,
        errorCode,
      });
    }

    // Not null constraint violation (23502)
    if (errorCode === '23502') {
      const message = contextMessage || `Not null constraint violation: ${constraint || 'unknown'}`;
      return new DatabaseError(message, DatabaseErrorType.CONSTRAINT, error, {
        constraint,
        table,
        detail,
        errorCode,
      });
    }

    // Deadlock detected (40P01)
    if (errorCode === '40P01') {
      const message = contextMessage || 'Database deadlock detected';
      return new DatabaseError(message, DatabaseErrorType.DEADLOCK, error, {
        detail,
        errorCode,
      });
    }

    // Query canceled (57014) / Statement timeout (57014)
    if (errorCode === '57014') {
      const message = contextMessage || 'Database query timeout';
      return new DatabaseError(message, DatabaseErrorType.TIMEOUT, error, {
        detail,
        errorCode,
      });
    }

    // Connection errors (08xxx)
    if (errorCode?.startsWith('08')) {
      const message = contextMessage || 'Database connection error';
      return new DatabaseError(message, DatabaseErrorType.CONNECTION, error, {
        detail,
        errorCode,
      });
    }

    // Syntax error or access rule violation (42xxx)
    if (errorCode?.startsWith('42')) {
      const message = contextMessage || 'Database query error';
      return new DatabaseError(message, DatabaseErrorType.QUERY, error, {
        detail,
        errorCode,
      });
    }

    // Generic database error
    const message = contextMessage || error.message || 'Database error';
    return new DatabaseError(message, DatabaseErrorType.UNKNOWN, error, {
      detail,
      errorCode,
    });
  }

  /**
   * Create connection error
   */
  static connection(message = 'Database connection failed', originalError?: Error): DatabaseError {
    return new DatabaseError(message, DatabaseErrorType.CONNECTION, originalError);
  }

  /**
   * Create query error
   */
  static query(message: string, query?: string, originalError?: Error): DatabaseError {
    return new DatabaseError(message, DatabaseErrorType.QUERY, originalError, { query });
  }

  /**
   * Create transaction error
   */
  static transaction(
    message = 'Database transaction failed',
    originalError?: Error
  ): DatabaseError {
    return new DatabaseError(message, DatabaseErrorType.TRANSACTION, originalError);
  }

  /**
   * Create timeout error
   */
  static timeout(message = 'Database operation timed out', originalError?: Error): DatabaseError {
    return new DatabaseError(message, DatabaseErrorType.TIMEOUT, originalError);
  }

  /**
   * Create constraint violation error
   */
  static constraint(
    message: string,
    constraint?: string,
    table?: string,
    originalError?: Error
  ): DatabaseError {
    return new DatabaseError(message, DatabaseErrorType.CONSTRAINT, originalError, {
      constraint,
      table,
    });
  }
}
