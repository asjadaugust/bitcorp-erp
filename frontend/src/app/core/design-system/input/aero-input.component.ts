import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'aero-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AeroInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="aero-form-field" [class.aero-form-field--error]="error">
      <label *ngIf="label" [for]="inputId" class="aero-label">
        {{ label }} <span *ngIf="required" class="required">*</span>
      </label>

      <div class="aero-input-wrapper">
        <input
          [id]="inputId"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onTouched()"
          class="aero-input"
        />
      </div>

      <div *ngIf="hint && !error" class="aero-hint">{{ hint }}</div>
      <div *ngIf="error" class="aero-error">{{ error }}</div>
    </div>
  `,
  styles: [
    `
      .aero-form-field {
        display: flex;
        flex-direction: column;
        margin-bottom: var(--s-16);

        &.aero-form-field--error {
          .aero-input {
            border-color: var(--semantic-red-500);

            &:focus {
              box-shadow: 0 0 0 3px rgba(209, 0, 49, 0.1);
            }
          }

          .aero-label {
            color: var(--semantic-red-500);
          }
        }
      }

      .aero-label {
        font-size: var(--type-bodySmall-size);
        font-weight: 500;
        color: var(--primary-900);
        margin-bottom: var(--s-4);

        .required {
          color: var(--semantic-red-500);
        }
      }

      .aero-input {
        width: 100%;
        height: 40px;
        padding: var(--s-8) var(--s-12);
        border: 1px solid var(--grey-500);
        border-radius: var(--s-4);
        font-family: var(--font-family-base);
        font-size: var(--type-body-size);
        color: var(--primary-900);
        background-color: var(--neutral-0);
        transition: all 0.2s ease;

        &:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px rgba(0, 119, 205, 0.1);
        }

        &:disabled {
          background-color: var(--grey-100);
          color: var(--grey-500);
          cursor: not-allowed;
        }

        &::placeholder {
          color: var(--grey-500);
        }
      }

      .aero-hint {
        font-size: var(--type-label-size);
        color: var(--grey-700);
        margin-top: var(--s-4);
      }

      .aero-error {
        font-size: var(--type-label-size);
        color: var(--semantic-red-500);
        margin-top: var(--s-4);
      }
    `,
  ],
})
export class AeroInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() inputId = `aero-input-${Math.random().toString(36).substr(2, 9)}`;

  value: unknown = '';
  disabled = false;

  onChange: (value: unknown) => void = () => { /* noop */ };
  onTouched: () => void = () => { /* noop */ };

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }

  writeValue(value: unknown): void {
    this.value = value;
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
