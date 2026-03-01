import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'aero-toggle',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AeroToggleComponent),
      multi: true,
    },
  ],
  template: `
    <label
      class="aero-toggle"
      [class.aero-toggle--checked]="checked"
      [class.aero-toggle--disabled]="disabled"
    >
      <input
        type="checkbox"
        class="aero-toggle__input"
        [checked]="checked"
        [disabled]="disabled"
        (change)="onToggle($event)"
        (blur)="onTouched()"
      />
      <span class="aero-toggle__track">
        <span class="aero-toggle__knob"></span>
      </span>
      <span *ngIf="label" class="aero-toggle__label">{{ label }}</span>
      <ng-content></ng-content>
    </label>
  `,
  styles: [
    `
      .aero-toggle {
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        cursor: pointer;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
      }

      .aero-toggle--disabled {
        cursor: not-allowed;
        opacity: 0.4;
      }

      .aero-toggle__input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
        pointer-events: none;
      }

      .aero-toggle__track {
        position: relative;
        display: flex;
        align-items: center;
        width: 36px;
        height: 14px;
        border-radius: 7px;
        background-color: var(--grey-500);
        transition: background-color 0.2s ease;
        flex-shrink: 0;
      }

      .aero-toggle--checked .aero-toggle__track {
        background-color: var(--primary-900);
      }

      .aero-toggle:hover:not(.aero-toggle--disabled) .aero-toggle__track {
        background-color: var(--grey-700);
      }

      .aero-toggle--checked:hover:not(.aero-toggle--disabled) .aero-toggle__track {
        background-color: var(--primary-500);
      }

      .aero-toggle__knob {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: var(--radius-full);
        background-color: var(--neutral-0);
        box-shadow:
          0px 1px 3px rgba(0, 0, 0, 0.2),
          0px 1px 1px rgba(0, 0, 0, 0.14),
          0px 2px 1px rgba(0, 0, 0, 0.12);
        transition: transform 0.2s ease;
        transform: translateX(0);
      }

      .aero-toggle--checked .aero-toggle__knob {
        transform: translateX(16px);
      }

      .aero-toggle__label {
        user-select: none;
      }
    `,
  ],
})
export class AeroToggleComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() disabled = false;

  checked = false;

  onChange: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  onToggle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.checked = input.checked;
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
