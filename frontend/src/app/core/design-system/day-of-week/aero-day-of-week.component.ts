import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type DayOfWeekMode = 'read' | 'edit';

@Component({
  selector: 'aero-day-of-week',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AeroDayOfWeekComponent),
      multi: true,
    },
  ],
  template: `
    <div class="aero-dow" [ngClass]="'aero-dow--' + mode" [class.aero-dow--disabled]="disabled">
      <button
        *ngFor="let day of days; let i = index"
        type="button"
        class="aero-dow__day"
        [class.aero-dow__day--selected]="isSelected(i)"
        [disabled]="disabled || mode === 'read'"
        (click)="toggleDay(i)"
        tabindex="0"
      >
        {{ day }}
      </button>
    </div>
  `,
  styles: [
    `
      .aero-dow {
        display: inline-flex;
        align-items: center;
      }

      .aero-dow--edit {
        gap: var(--s-8);
      }

      .aero-dow--read {
        gap: var(--s-4);
      }

      .aero-dow__day {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 9999px;
        border: none;
        background: none;
        font-family: var(--font-text);
        font-size: 10px;
        font-weight: 500;
        line-height: 1;
        color: var(--grey-600);
        cursor: pointer;
        transition: all 0.15s ease;
        padding: 0;
        flex-shrink: 0;
      }

      .aero-dow--edit .aero-dow__day {
        width: 32px;
        height: 32px;
        font-size: 14px;
        border: 1px solid var(--grey-500);
        color: var(--primary-900);
      }

      .aero-dow--edit .aero-dow__day:hover:not(:disabled):not(.aero-dow__day--selected) {
        border-color: var(--primary-500);
        color: var(--primary-500);
      }

      .aero-dow__day--selected {
        background-color: var(--primary-500);
        color: white;
        border-color: var(--primary-500);
      }

      .aero-dow--edit .aero-dow__day--selected {
        background-color: var(--primary-500);
        color: white;
        border-color: var(--primary-500);
      }

      .aero-dow--edit .aero-dow__day--selected:hover:not(:disabled) {
        background-color: var(--primary-900);
        border-color: var(--primary-900);
      }

      .aero-dow--read .aero-dow__day {
        cursor: default;
      }

      .aero-dow--read .aero-dow__day--selected {
        background-color: var(--primary-500);
        color: white;
      }

      .aero-dow--disabled {
        opacity: 0.4;
        pointer-events: none;
      }

      .aero-dow__day:disabled {
        cursor: not-allowed;
      }
    `,
  ],
})
export class AeroDayOfWeekComponent implements ControlValueAccessor {
  @Input() mode: DayOfWeekMode = 'edit';
  @Input() disabled = false;

  days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  /** Bitmask or array of selected day indices (0=Monday, 6=Sunday) */
  selectedDays: Set<number> = new Set();

  onChange: (value: number[]) => void = () => {};
  onTouched: () => void = () => {};

  isSelected(index: number): boolean {
    return this.selectedDays.has(index);
  }

  toggleDay(index: number): void {
    if (this.mode === 'read' || this.disabled) return;

    if (this.selectedDays.has(index)) {
      this.selectedDays.delete(index);
    } else {
      this.selectedDays.add(index);
    }

    const value = Array.from(this.selectedDays).sort();
    this.onChange(value);
    this.onTouched();
  }

  writeValue(value: number[]): void {
    this.selectedDays = new Set(value ?? []);
  }

  registerOnChange(fn: (value: number[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
