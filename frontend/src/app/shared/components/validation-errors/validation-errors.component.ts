import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidationError } from '../../../core/services/form-error-handler.service';

/**
 * Validation Errors Component
 *
 * Displays a list of validation errors returned from backend.
 *
 * @example
 * <app-validation-errors
 *   [errors]="validationErrors"
 *   [fieldLabels]="fieldLabelMap">
 * </app-validation-errors>
 */
@Component({
  selector: 'app-validation-errors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './validation-errors.component.html',
  styleUrls: ['./validation-errors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationErrorsComponent {
  /**
   * Array of validation errors to display
   * Format: { field: string, errors: string[] }[]
   */
  @Input({ required: true }) errors: ValidationError[] = [];

  /**
   * Map of field names to user-friendly labels (Spanish)
   * Example: { 'codigo_equipo': 'Código de Equipo', 'marca': 'Marca' }
   */
  @Input({ required: true }) fieldLabels: Record<string, string> = {};

  /**
   * Get human-readable label for a field name
   *
   * @param fieldName - The field name from validation error
   * @returns User-friendly label (Spanish), or the field name itself if not found
   */
  getFieldLabel(fieldName: string): string {
    return this.fieldLabels[fieldName] || fieldName;
  }

  /**
   * Check if there are any errors to display
   */
  hasErrors(): boolean {
    return this.errors && this.errors.length > 0;
  }
}
