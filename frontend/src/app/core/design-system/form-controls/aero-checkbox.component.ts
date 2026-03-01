import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'aero-checkbox',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AeroCheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <label
      class="aero-checkbox"
      [class.aero-checkbox--disabled]="disabled"
      [class.aero-checkbox--checked]="checked"
      [class.aero-checkbox--indeterminate]="indeterminate"
    >
      <input
        type="checkbox"
        class="aero-checkbox__input"
        [checked]="checked"
        [disabled]="disabled"
        [indeterminate]="indeterminate"
        (change)="onToggle($event)"
        (blur)="onTouched()"
      />
      <span class="aero-checkbox__box">
        <svg
          *ngIf="checked && !indeterminate"
          class="aero-checkbox__check"
          viewBox="0 0 14 10"
          fill="none"
        >
          <path
            d="M1 5L5 9L13 1"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span *ngIf="indeterminate" class="aero-checkbox__minus"></span>
      </span>
      <span *ngIf="label" class="aero-checkbox__label">{{ label }}</span>
      <ng-content></ng-content>
    </label>
  `,
  styles: [
    `
      .aero-checkbox {
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        cursor: pointer;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
      }

      .aero-checkbox--disabled {
        cursor: not-allowed;
        opacity: 0.4;
      }

      .aero-checkbox__input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
        pointer-events: none;
      }

      .aero-checkbox__box {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border: 2px solid var(--primary-900);
        border-radius: var(--radius-xs);
        background-color: transparent;
        transition: all 0.15s ease;
        flex-shrink: 0;
      }

      .aero-checkbox--checked .aero-checkbox__box,
      .aero-checkbox--indeterminate .aero-checkbox__box {
        background-color: var(--primary-900);
        border-color: var(--primary-900);
        color: var(--grey-100);
      }

      .aero-checkbox:hover:not(.aero-checkbox--disabled) .aero-checkbox__box {
        border-color: var(--primary-500);
      }

      .aero-checkbox--checked:hover:not(.aero-checkbox--disabled) .aero-checkbox__box,
      .aero-checkbox--indeterminate:hover:not(.aero-checkbox--disabled) .aero-checkbox__box {
        background-color: var(--primary-500);
        border-color: var(--primary-500);
      }

      .aero-checkbox__check {
        width: 14px;
        height: 10px;
      }

      .aero-checkbox__minus {
        display: block;
        width: 10px;
        height: 2px;
        background-color: var(--grey-100);
      }

      .aero-checkbox__label {
        user-select: none;
      }
    `,
  ],
})
export class AeroCheckboxComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() disabled = false;
  @Input() indeterminate = false;

  checked = false;

  onChange: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  onToggle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.checked = input.checked;
    this.indeterminate = false;
    this.onChange(this.checked);
  }

  writeValue(value: boolean): void {
    this.checked = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
