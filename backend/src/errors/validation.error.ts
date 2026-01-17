import { AppError } from './base.error';

/**
 * Field-level validation error details
 */
export interface ValidationErrorField {
  /**
   * Field name that failed validation
   */
  field: string;

  /**
   * Validation error message
   */
  message: string;

  /**
   * Type of validation that failed
   *
   * Examples: 'required', 'minLength', 'maxLength', 'pattern', 'email', 'custom'
   */
  rule: string;

  /**
   * The value that failed validation (optional, for debugging)
   */
  value?: unknown;

  /**
   * Constraint parameters (e.g., minLength: 3)
   */
  constraints?: Record<string, unknown>;
}

/**
 * Validation Error (422)
 *
 * Represents validation failures for one or more fields.
 *
 * Examples:
 * - Email format invalid
 * - Password too short
 * - Required field missing
 * - Date range invalid
 *
 * Usage:
 *   throw new ValidationError('Invalid input', [
 *     { field: 'email', message: 'Invalid email format', rule: 'email' },
 *     { field: 'password', message: 'Password must be at least 8 characters', rule: 'minLength' }
 *   ]);
 */
export class ValidationError extends AppError {
  /**
   * List of field validation errors
   */
  public readonly errors: ValidationErrorField[];

  constructor(message = 'Validation failed', errors: ValidationErrorField[] = []) {
    super(message, 422, true, { errors });
    this.errors = errors;
  }

  /**
   * Add a validation error for a field
   */
  addError(error: ValidationErrorField): void {
    this.errors.push(error);
  }

  /**
   * Check if a specific field has an error
   */
  hasFieldError(field: string): boolean {
    return this.errors.some((error) => error.field === field);
  }

  /**
   * Get all errors for a specific field
   */
  getFieldErrors(field: string): ValidationErrorField[] {
    return this.errors.filter((error) => error.field === field);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    if (this.errors.length === 0) {
      return this.message;
    }

    if (this.errors.length === 1) {
      return this.errors[0].message;
    }

    return `Validation failed for ${this.errors.length} fields`;
  }

  /**
   * Serialize to JSON with detailed field errors
   */
  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }

  /**
   * Create ValidationError from a single field error
   */
  static fromField(
    field: string,
    message: string,
    rule: string,
    value?: unknown,
    constraints?: Record<string, unknown>
  ): ValidationError {
    return new ValidationError('Validation failed', [{ field, message, rule, value, constraints }]);
  }

  /**
   * Create ValidationError for a required field
   */
  static required(field: string, customMessage?: string): ValidationError {
    const message = customMessage || `${field} is required`;
    return ValidationError.fromField(field, message, 'required');
  }

  /**
   * Create ValidationError for an invalid field
   */
  static invalid(field: string, customMessage?: string): ValidationError {
    const message = customMessage || `${field} is invalid`;
    return ValidationError.fromField(field, message, 'invalid');
  }

  /**
   * Create ValidationError for a min length constraint
   */
  static minLength(field: string, minLength: number, actualLength?: number): ValidationError {
    const message = `${field} must be at least ${minLength} characters`;
    return ValidationError.fromField(field, message, 'minLength', actualLength, { minLength });
  }

  /**
   * Create ValidationError for a max length constraint
   */
  static maxLength(field: string, maxLength: number, actualLength?: number): ValidationError {
    const message = `${field} must be at most ${maxLength} characters`;
    return ValidationError.fromField(field, message, 'maxLength', actualLength, { maxLength });
  }

  /**
   * Create ValidationError for a min value constraint
   */
  static min(field: string, min: number, actualValue?: number): ValidationError {
    const message = `${field} must be at least ${min}`;
    return ValidationError.fromField(field, message, 'min', actualValue, { min });
  }

  /**
   * Create ValidationError for a max value constraint
   */
  static max(field: string, max: number, actualValue?: number): ValidationError {
    const message = `${field} must be at most ${max}`;
    return ValidationError.fromField(field, message, 'max', actualValue, { max });
  }

  /**
   * Create ValidationError for an email format
   */
  static email(field: string): ValidationError {
    const message = `${field} must be a valid email address`;
    return ValidationError.fromField(field, message, 'email');
  }

  /**
   * Create ValidationError for a date format
   */
  static invalidDate(field: string): ValidationError {
    const message = `${field} must be a valid date`;
    return ValidationError.fromField(field, message, 'date');
  }

  /**
   * Create ValidationError for a pattern constraint
   */
  static pattern(field: string, pattern: string | RegExp): ValidationError {
    const message = `${field} format is invalid`;
    return ValidationError.fromField(field, message, 'pattern', undefined, {
      pattern: pattern.toString(),
    });
  }
}
