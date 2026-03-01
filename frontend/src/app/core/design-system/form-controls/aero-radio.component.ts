import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'aero-radio',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AeroRadioComponent),
      multi: true,
    },
  ],
  template: `
    <label
      class="aero-radio"
      [class.aero-radio--disabled]="disabled"
      [class.aero-radio--selected]="selected"
    >
      <input
        type="radio"
        class="aero-radio__input"
        [name]="name"
        [value]="value"
        [checked]="selected"
        [disabled]="disabled"
        (change)="onSelect()"
        (blur)="onTouched()"
      />
      <span class="aero-radio__circle">
        <span *ngIf="selected" class="aero-radio__dot"></span>
      </span>
      <span *ngIf="label" class="aero-radio__label">{{ label }}</span>
      <ng-content></ng-content>
    </label>
  `,
  styles: [
    `
      .aero-radio {
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        cursor: pointer;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
      }

      .aero-radio--disabled {
        cursor: not-allowed;
        opacity: 0.4;
      }

      .aero-radio__input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
        pointer-events: none;
      }

      .aero-radio__circle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border: 2px solid var(--primary-900);
        border-radius: var(--radius-full);
        background-color: transparent;
        transition: all 0.15s ease;
        flex-shrink: 0;
      }

      .aero-radio:hover:not(.aero-radio--disabled) .aero-radio__circle {
        border-color: var(--primary-500);
      }

      .aero-radio--selected .aero-radio__circle {
        border-color: var(--primary-900);
      }

      .aero-radio--selected:hover:not(.aero-radio--disabled) .aero-radio__circle {
        border-color: var(--primary-500);
      }

      .aero-radio__dot {
        display: block;
        width: 10px;
        height: 10px;
        border-radius: var(--radius-full);
        background-color: var(--primary-900);
      }

      .aero-radio--selected:hover:not(.aero-radio--disabled) .aero-radio__dot {
        background-color: var(--primary-500);
      }

      .aero-radio__label {
        user-select: none;
      }
    `,
  ],
})
export class AeroRadioComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() name = '';
  @Input() value: unknown = '';
  @Input() disabled = false;

  selected = false;
  private modelValue: unknown = null;

  onChange: (value: unknown) => void = () => {};
  onTouched: () => void = () => {};

  onSelect(): void {
    this.modelValue = this.value;
    this.selected = true;
    this.onChange(this.value);
  }

  writeValue(value: unknown): void {
    this.modelValue = value;
    this.selected = this.value === value;
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
