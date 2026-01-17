/**
 * Custom Error Classes for Bitcorp ERP
 *
 * This module provides a comprehensive error handling system with:
 * - Type-safe error classes
 * - HTTP status codes
 * - User-friendly messages
 * - Structured metadata
 * - Factory methods for common scenarios
 *
 * Usage:
 *   import { NotFoundError, ValidationError, DatabaseError } from './errors';
 *
 *   // Simple usage
 *   throw new NotFoundError('Project', projectId);
 *
 *   // With validation
 *   throw ValidationError.required('email');
 *
 *   // From database error
 *   throw DatabaseError.fromTypeORMError(error, 'Failed to save project');
 *
 *   // Business rule
 *   throw BusinessRuleError.cannotDelete('Project', 'has active equipment');
 */

// Base error
export { AppError } from './base.error';
import { AppError } from './base.error';

// HTTP errors
export {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  InternalServerError,
  ServiceUnavailableError,
  TooManyRequestsError,
} from './http.errors';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  InternalServerError,
  ServiceUnavailableError,
  TooManyRequestsError,
} from './http.errors';

// Validation errors
export { ValidationError, ValidationErrorField } from './validation.error';
import { ValidationError, ValidationErrorField } from './validation.error';

// Database errors
export { DatabaseError, DatabaseErrorType } from './database.error';
import { DatabaseError, DatabaseErrorType } from './database.error';

// Business rule errors
export { BusinessRuleError } from './business.error';
import { BusinessRuleError } from './business.error';

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is operational
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}

/**
 * Error factory helpers for common scenarios
 */
export const Errors = {
  /**
   * HTTP errors
   */
  badRequest: (message?: string, metadata?: Record<string, unknown>) =>
    new BadRequestError(message, metadata),

  unauthorized: (message?: string, metadata?: Record<string, unknown>) =>
    new UnauthorizedError(message, metadata),

  forbidden: (message?: string, metadata?: Record<string, unknown>) =>
    new ForbiddenError(message, metadata),

  notFound: (resource: string, id?: string | number, metadata?: Record<string, unknown>) =>
    new NotFoundError(resource, id, metadata),

  conflict: (message: string, metadata?: Record<string, unknown>) =>
    new ConflictError(message, metadata),

  unprocessable: (message: string, metadata?: Record<string, unknown>) =>
    new UnprocessableEntityError(message, metadata),

  internal: (message?: string, metadata?: Record<string, unknown>) =>
    new InternalServerError(message, false, metadata),

  unavailable: (service?: string, metadata?: Record<string, unknown>) =>
    new ServiceUnavailableError(service, metadata),

  tooManyRequests: (message?: string, retryAfter?: number, metadata?: Record<string, unknown>) =>
    new TooManyRequestsError(message, retryAfter, metadata),

  /**
   * Validation errors
   */
  validation: {
    general: (message?: string, errors?: ValidationErrorField[]) =>
      new ValidationError(message, errors),
    required: (field: string, customMessage?: string) =>
      ValidationError.required(field, customMessage),
    invalid: (field: string, customMessage?: string) =>
      ValidationError.invalid(field, customMessage),
    minLength: (field: string, minLength: number, actualLength?: number) =>
      ValidationError.minLength(field, minLength, actualLength),
    maxLength: (field: string, maxLength: number, actualLength?: number) =>
      ValidationError.maxLength(field, maxLength, actualLength),
    min: (field: string, min: number, actualValue?: number) =>
      ValidationError.min(field, min, actualValue),
    max: (field: string, max: number, actualValue?: number) =>
      ValidationError.max(field, max, actualValue),
    email: (field: string) => ValidationError.email(field),
    date: (field: string) => ValidationError.invalidDate(field),
    pattern: (field: string, pattern: string | RegExp) => ValidationError.pattern(field, pattern),
  },

  /**
   * Database errors
   */
  database: {
    general: (message: string, originalError?: Error) =>
      new DatabaseError(message, DatabaseErrorType.UNKNOWN, originalError),
    connection: (message?: string, originalError?: Error) =>
      DatabaseError.connection(message, originalError),
    query: (message: string, query?: string, originalError?: Error) =>
      DatabaseError.query(message, query, originalError),
    transaction: (message?: string, originalError?: Error) =>
      DatabaseError.transaction(message, originalError),
    timeout: (message?: string, originalError?: Error) =>
      DatabaseError.timeout(message, originalError),
    constraint: (message: string, constraint?: string, table?: string, originalError?: Error) =>
      DatabaseError.constraint(message, constraint, table, originalError),
    fromTypeORM: (
      error: Error & { code?: string; constraint?: string; table?: string; detail?: string },
      contextMessage?: string
    ) => DatabaseError.fromTypeORMError(error, contextMessage),
  },

  /**
   * Business rule errors
   */
  business: {
    general: (message: string, code: string, metadata?: Record<string, unknown>) =>
      new BusinessRuleError(message, code, metadata),
    cannotDelete: (entity: string, reason: string, dependencies?: Record<string, unknown>) =>
      BusinessRuleError.cannotDelete(entity, reason, dependencies),
    invalidState: (
      entity: string,
      currentState: string,
      operation: string,
      allowedStates: string[]
    ) => BusinessRuleError.invalidState(entity, currentState, operation, allowedStates),
    limitExceeded: (resource: string, limit: number, current: number, requested: number) =>
      BusinessRuleError.limitExceeded(resource, limit, current, requested),
    budgetExceeded: (budget: number, allocated: number, requested: number) =>
      BusinessRuleError.budgetExceeded(budget, allocated, requested),
    dateConflict: (
      entity: string,
      requestedStart: Date,
      requestedEnd: Date,
      conflictingEntity?: string
    ) => BusinessRuleError.dateConflict(entity, requestedStart, requestedEnd, conflictingEntity),
    resourceInUse: (resource: string, resourceId: string | number, usedBy?: string) =>
      BusinessRuleError.resourceInUse(resource, resourceId, usedBy),
    duplicateAssignment: (entity: string, assignee: string, context?: string) =>
      BusinessRuleError.duplicateAssignment(entity, assignee, context),
    approvalRequired: (entity: string, requiredApprover: string, operation?: string) =>
      BusinessRuleError.approvalRequired(entity, requiredApprover, operation),
    incompleteData: (entity: string, missingFields: string[], operation?: string) =>
      BusinessRuleError.incompleteData(entity, missingFields, operation),
    notAllowed: (entity: string, operation: string, reason: string) =>
      BusinessRuleError.notAllowed(entity, operation, reason),
  },
};
