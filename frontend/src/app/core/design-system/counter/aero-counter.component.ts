import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export type CounterOrientation = 'horizontal' | 'vertical';
export type CounterHeight = '44' | '56';

@Component({
  selector: 'aero-counter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AeroCounterComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="aero-counter"
      [ngClass]="['aero-counter--' + orientation, 'aero-counter--h' + height]"
      [class.aero-counter--error]="error"
      [class.aero-counter--disabled]="disabled"
    >
      <button
        type="button"
        class="aero-counter__btn aero-counter__btn--subtract"
        [disabled]="disabled || value <= min"
        (click)="decrement()"
      >
        <i class="fa-solid fa-minus"></i>
      </button>

      <input
        type="number"
        class="aero-counter__input"
        [value]="value"
        [min]="min"
        [max]="max"
        [step]="step"
        [disabled]="disabled"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />

      <button
        type="button"
        class="aero-counter__btn aero-counter__btn--add"
        [disabled]="disabled || value >= max"
        (click)="increment()"
      >
        <i class="fa-solid fa-plus"></i>
      </button>
    </div>
  `,
  styles: [
    `
      .aero-counter {
        display: inline-flex;
        align-items: center;
      }

      .aero-counter--horizontal {
        flex-direction: row;
      }

      .aero-counter--vertical {
        flex-direction: column-reverse;
      }

      .aero-counter__btn {
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--grey-500);
        background-color: var(--grey-100);
        color: var(--primary-900);
        cursor: pointer;
        transition: all 0.15s ease;
        flex-shrink: 0;
        font-size: 14px;
      }

      .aero-counter__btn:hover:not(:disabled) {
        border-color: var(--primary-500);
        color: var(--primary-500);
      }

      .aero-counter__btn:active:not(:disabled) {
        background-color: var(--primary-100);
      }

      .aero-counter__btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* Horizontal layout */
      .aero-counter--horizontal .aero-counter__btn--subtract {
        border-radius: var(--radius-sm) 0 0 var(--radius-sm);
        border-right: none;
      }

      .aero-counter--horizontal .aero-counter__btn--add {
        border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        border-left: none;
      }

      .aero-counter--horizontal .aero-counter__input {
        border-radius: 0;
      }

      /* Vertical layout */
      .aero-counter--vertical .aero-counter__btn--add {
        border-radius: var(--radius-sm) var(--radius-sm) 0 0;
        border-bottom: none;
        width: 100%;
      }

      .aero-counter--vertical .aero-counter__btn--subtract {
        border-radius: 0 0 var(--radius-sm) var(--radius-sm);
        border-top: none;
        width: 100%;
      }

      .aero-counter--vertical .aero-counter__input {
        border-radius: 0;
        text-align: center;
      }

      /* Size: h44 */
      .aero-counter--h44 .aero-counter__btn {
        width: 44px;
        height: 44px;
      }

      .aero-counter--h44 .aero-counter__input {
        height: 44px;
      }

      /* Size: h56 */
      .aero-counter--h56 .aero-counter__btn {
        width: 56px;
        height: 56px;
      }

      .aero-counter--h56 .aero-counter__input {
        height: 56px;
      }

      .aero-counter__input {
        width: 64px;
        border: 1px solid var(--grey-500);
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
        text-align: center;
        background-color: var(--grey-100);
        outline: none;
        -moz-appearance: textfield;
      }

      .aero-counter__input::-webkit-outer-spin-button,
      .aero-counter__input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      .aero-counter__input:focus {
        border-color: var(--primary-500);
      }

      .aero-counter--error .aero-counter__input {
        border-color: var(--accent-500);
      }

      .aero-counter--error .aero-counter__btn {
        border-color: var(--accent-500);
      }

      .aero-counter--disabled {
        opacity: 0.4;
      }

      .aero-counter--disabled .aero-counter__input {
        background-color: var(--grey-100);
        cursor: not-allowed;
      }
    `,
  ],
})
export class AeroCounterComponent implements ControlValueAccessor {
  @Input() min = 0;
  @Input() max = 999;
  @Input() step = 1;
  @Input() orientation: CounterOrientation = 'horizontal';
  @Input() height: CounterHeight = '44';
  @Input() error = false;
  @Input() disabled = false;

  value = 0;

  onChange: (value: number) => void = () => {};
  onTouched: () => void = () => {};

  increment(): void {
    if (this.value < this.max) {
      this.value = Math.min(this.value + this.step, this.max);
      this.onChange(this.value);
    }
  }

  decrement(): void {
    if (this.value > this.min) {
      this.value = Math.max(this.value - this.step, this.min);
      this.onChange(this.value);
    }
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = parseInt(input.value, 10);
    if (isNaN(val)) val = this.min;
    this.value = Math.min(Math.max(val, this.min), this.max);
    this.onChange(this.value);
  }

  writeValue(value: number): void {
    this.value = value ?? this.min;
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
