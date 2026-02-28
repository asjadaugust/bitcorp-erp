import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

/**
 * HTTP Error Response shape from Angular
 */
interface HttpErrorBody {
  status?: number;
  error?: {
    error?: {
      code?: string;
      message?: string;
      details?: ValidationError[];
    };
  };
}

/**
 * Validation Error Interface
 * Represents a single field validation error from backend
 */
export interface ValidationError {
  field: string;
  errors: string[];
}

/**
 * Form Error Handler Service
 *
 * Service to extract and handle backend validation errors
 * and apply them to Angular reactive forms.
 *
 * Backend error format:
 * {
 *   success: false,
 *   error: {
 *     code: 'VALIDATION_ERROR',
 *     message: string,
 *     details: ValidationError[]
 *   }
 * }
 */
@Injectable({ providedIn: 'root' })
export class FormErrorHandlerService {
  /**
   * Extract validation errors from backend error response
   *
   * @param error - Error object from HTTP request
   * @returns Array of validation errors
   */
  extractValidationErrors(error: HttpErrorBody): ValidationError[] {
    // Check if error is a validation error from backend
    const isErrorValidation = error?.error?.error?.code === 'VALIDATION_ERROR';

    if (!isErrorValidation) {
      return [];
    }

    // Extract details array from backend response
    const details = (error as any)['error']?.['error']?.['details'] || [];
    return Array.isArray(details) ? details : [];
  }

  /**
   * Get user-friendly error message from error
   *
   * Handles different error types:
   * - Validation errors: Returns message about form validation
   * - Backend errors: Returns backend error message
   * - Network errors: Returns connection error message
   * - Auth errors: Returns permission error message
   * - Generic: Returns fallback message
   *
   * @param error - Error object from HTTP request
   * @returns User-friendly error message (Spanish)
   */
  getErrorMessage(error: HttpErrorBody): string {
    // Handle validation errors
    const validationErrors = this.extractValidationErrors(error);
    if (validationErrors.length > 0) {
      return '';
    }

    // Handle backend errors with message
    const backendMessage = error?.error?.error?.message;
    if (backendMessage) {
      return backendMessage;
    }

    // Handle network errors (status 0)
    if (error?.status === 0) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    }

    // Handle authentication errors (401)
    if (error?.status === 401) {
      return 'Sesión expirada. Por favor inicia sesión nuevamente.';
    }

    // Handle authorization errors (403)
    if (error?.status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }

    // Handle not found errors (404)
    if (error?.status === 404) {
      return 'Recurso no encontrado.';
    }

    // Handle server errors (500)
    if (error?.status === 500) {
      return 'Error del servidor. Por favor intenta más tarde.';
    }

    // Generic fallback message
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }

  /**
   * Apply validation errors to Angular FormGroup
   *
   * Maps backend validation errors to form controls and marks them as touched
   *
   * @param form - The Angular FormGroup to apply errors to
   * @param errors - Array of validation errors from backend
   */
  applyValidationErrors(form: FormGroup, errors: ValidationError[]): void {
    if (!form || !errors || errors.length === 0) {
      return;
    }

    errors.forEach((validationError) => {
      const control = form.get(validationError.field);

      // Only apply errors to controls that exist in the form
      if (control) {
        // Set backend error on control
        control.setErrors({
          backend: validationError.errors.join(', '),
        });

        // Mark control as touched to display error immediately
        control.markAsTouched();
      }
    });
  }

  /**
   * Clear validation errors from a form
   *
   * Removes backend errors from all form controls
   *
   * @param form - The Angular FormGroup to clear errors from
   */
  clearValidationErrors(form: FormGroup): void {
    if (!form) {
      return;
    }

    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);

      if (control && control.errors) {
        // Remove only backend errors, preserve other validation
        const { backend: _backend, ...otherErrors } = control.errors;

        if (Object.keys(otherErrors).length === 0) {
          control.setErrors(null);
        } else {
          control.setErrors(otherErrors);
        }
      }
    });
  }

  /**
   * Check if error is a validation error
   *
   * @param error - Error object from HTTP request
   * @returns True if error is a validation error
   */
  isValidationError(error: HttpErrorBody): boolean {
    return error?.error?.error?.code === 'VALIDATION_ERROR';
  }

  /**
   * Get validation error details for a specific field
   *
   * @param error - Error object from HTTP request
   * @param fieldName - Name of the field to get errors for
   * @returns Array of error messages for the field, or empty array
   */
  getFieldErrors(error: HttpErrorBody, fieldName: string): string[] {
    const validationErrors = this.extractValidationErrors(error);
    const fieldError = validationErrors.find((e) => e.field === fieldName);
    return fieldError ? fieldError.errors : [];
  }
}
