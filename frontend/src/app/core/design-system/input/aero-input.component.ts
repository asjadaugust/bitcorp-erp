import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export type InputType =
  | 'text'
  | 'password'
  | 'search'
  | 'select'
  | 'display'
  | 'number'
  | 'email'
  | 'tel'
  | 'url';
export type InputHeight = '44' | '56';
export type InputOrientation = 'vertical' | 'horizontal';
export type InputState = 'default' | 'error' | 'service';

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
    <div
      class="aero-form-field"
      [ngClass]="[
        'aero-form-field--' + orientation,
        'aero-form-field--' + state,
        'aero-form-field--h' + height,
      ]"
      [class.aero-form-field--disabled]="disabled"
    >
      <div *ngIf="label" class="aero-form-field__label-wrap">
        <label [for]="inputId" class="aero-form-field__label">
          {{ label }} <span *ngIf="required" class="aero-form-field__required">*</span>
        </label>
        <span *ngIf="hint && orientation === 'vertical'" class="aero-form-field__hint">{{
          hint
        }}</span>
      </div>

      <div class="aero-form-field__field-wrap">
        <div
          class="aero-form-field__field"
          [class.aero-form-field__field--focused]="focused"
          [class.aero-form-field__field--display]="type === 'display'"
        >
          <i *ngIf="iconLeft" class="aero-form-field__icon-left" [ngClass]="iconLeft"></i>

          <ng-container [ngSwitch]="type">
            <!-- Search input -->
            <ng-container *ngSwitchCase="'search'">
              <i class="fa-solid fa-magnifying-glass aero-form-field__search-icon"></i>
              <input
                [id]="inputId"
                type="text"
                class="aero-form-field__input"
                [placeholder]="placeholder"
                [disabled]="disabled"
                [value]="value"
                (input)="onInput($event)"
                (focus)="onFocus()"
                (blur)="onBlurEvent()"
              />
              <button
                *ngIf="value"
                type="button"
                class="aero-form-field__clear"
                (click)="clearValue()"
                tabindex="-1"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </ng-container>

            <!-- Password input -->
            <ng-container *ngSwitchCase="'password'">
              <input
                [id]="inputId"
                [type]="showPassword ? 'text' : 'password'"
                class="aero-form-field__input"
                [placeholder]="placeholder"
                [disabled]="disabled"
                [value]="value"
                (input)="onInput($event)"
                (focus)="onFocus()"
                (blur)="onBlurEvent()"
              />
              <button
                type="button"
                class="aero-form-field__toggle-pw"
                (click)="showPassword = !showPassword"
                tabindex="-1"
              >
                <i [ngClass]="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
              </button>
            </ng-container>

            <!-- Display (read-only) -->
            <ng-container *ngSwitchCase="'display'">
              <span class="aero-form-field__display-text">{{ value || placeholder }}</span>
            </ng-container>

            <!-- Select mode -->
            <ng-container *ngSwitchCase="'select'">
              <span
                class="aero-form-field__input aero-form-field__select-text"
                [class.aero-form-field__placeholder]="!value"
              >
                {{ value || placeholder }}
              </span>
              <i class="fa-solid fa-chevron-down aero-form-field__chevron"></i>
            </ng-container>

            <!-- Default text/number/email/tel/url input -->
            <ng-container *ngSwitchDefault>
              <input
                [id]="inputId"
                [type]="type"
                class="aero-form-field__input"
                [placeholder]="placeholder"
                [disabled]="disabled"
                [value]="value"
                (input)="onInput($event)"
                (focus)="onFocus()"
                (blur)="onBlurEvent()"
              />
            </ng-container>
          </ng-container>

          <i *ngIf="iconRight" class="aero-form-field__icon-right" [ngClass]="iconRight"></i>
        </div>

        <!-- Feedback messages -->
        <div
          *ngIf="state === 'error' && error"
          class="aero-form-field__feedback aero-form-field__feedback--error"
        >
          <i class="fa-solid fa-circle-exclamation"></i> {{ error }}
        </div>
        <div
          *ngIf="state === 'service' && serviceMessage"
          class="aero-form-field__feedback aero-form-field__feedback--service"
        >
          <i class="fa-solid fa-circle-info"></i> {{ serviceMessage }}
        </div>
        <div
          *ngIf="state === 'default' && hint && orientation === 'horizontal'"
          class="aero-form-field__hint"
        >
          {{ hint }}
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .aero-form-field {
        display: flex;
        width: 100%;
      }

      /* Orientations */
      .aero-form-field--vertical {
        flex-direction: column;
        gap: var(--s-8);
      }

      .aero-form-field--horizontal {
        flex-direction: row;
        align-items: center;
      }

      .aero-form-field--horizontal .aero-form-field__label-wrap {
        min-width: 120px;
        flex-shrink: 0;
      }

      .aero-form-field__field-wrap {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
        flex: 1;
        min-width: 0;
        position: relative;
      }

      /* Label */
      .aero-form-field__label-wrap {
        display: flex;
        flex-direction: column;
      }

      .aero-form-field__label {
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        font-weight: 400;
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
      }

      .aero-form-field__required {
        color: var(--accent-500);
      }

      .aero-form-field__hint {
        font-family: var(--font-text);
        font-size: var(--type-bodySmall-size);
        line-height: var(--type-bodySmall-line-height);
        font-weight: 400;
        color: var(--grey-700);
      }

      /* Field container */
      .aero-form-field__field {
        display: flex;
        align-items: center;
        border: 1px solid var(--grey-700);
        border-radius: var(--radius-sm);
        background-color: var(--neutral-0);
        padding: 0;
        gap: var(--s-8);
        transition:
          border-color 0.15s ease,
          border-width 0.15s ease,
          box-shadow 0.15s ease;
        width: 100%;
      }

      .aero-form-field--h44 .aero-form-field__field {
        height: 44px;
      }

      .aero-form-field--h56 .aero-form-field__field {
        height: 56px;
      }

      /* Focus / Hover */
      .aero-form-field__field:hover:not(.aero-form-field__field--display) {
        border-color: var(--grey-700);
        border-width: 2px;
        padding: 0;
      }

      .aero-form-field__field--focused {
        border-color: var(--primary-500);
        border-width: 2px;
        padding: 0;
        box-shadow: 0 0 0 3px rgba(0, 119, 205, 0.1);
      }

      /* Display mode */
      .aero-form-field__field--display {
        border-color: transparent;
        background-color: transparent;
        padding: 0;
      }

      /* Error state */
      .aero-form-field--error .aero-form-field__field {
        border-color: var(--semantic-red-600);
        border-width: 2px;
        padding: 0;
      }

      .aero-form-field--error .aero-form-field__field--focused {
        box-shadow: 0 0 0 3px rgba(209, 0, 49, 0.1);
      }

      /* Service state */
      .aero-form-field--service .aero-form-field__field {
        border-color: var(--semantic-blue-500);
      }

      /* Disabled */
      .aero-form-field--disabled .aero-form-field__field {
        background-color: var(--grey-100);
        border-color: var(--grey-500);
        cursor: not-allowed;
      }

      .aero-form-field--disabled .aero-form-field__label {
        color: var(--grey-500);
      }

      /* Input */
      .aero-form-field__input {
        flex: 1;
        min-width: 0;
        border: none;
        outline: none;
        background: transparent;
        padding: 0 var(--s-12);
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
        height: 100%;
      }

      .aero-form-field__input::placeholder {
        color: var(--grey-500);
      }

      .aero-form-field__input:disabled {
        cursor: not-allowed;
        color: var(--grey-500);
      }

      /* Display text */
      .aero-form-field__display-text {
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Select text */
      .aero-form-field__select-text {
        cursor: pointer;
        display: flex;
        align-items: center;
      }

      .aero-form-field__placeholder {
        color: var(--grey-500);
      }

      /* Icons */
      .aero-form-field__icon-left,
      .aero-form-field__icon-right,
      .aero-form-field__search-icon {
        color: var(--primary-900);
        font-size: 16px;
        flex-shrink: 0;
      }

      .aero-form-field__search-icon {
        color: var(--grey-600);
      }

      .aero-form-field__chevron {
        color: var(--primary-900);
        font-size: 12px;
        flex-shrink: 0;
        transition: transform 0.2s ease;
      }

      /* Clear button */
      .aero-form-field__clear,
      .aero-form-field__toggle-pw {
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        color: var(--grey-600);
        cursor: pointer;
        padding: 0;
        font-size: 14px;
        flex-shrink: 0;
      }

      .aero-form-field__clear:hover,
      .aero-form-field__toggle-pw:hover {
        color: var(--primary-900);
      }

      /* Feedback */
      .aero-form-field__feedback {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        display: flex;
        align-items: center;
        gap: var(--s-4);
        font-family: var(--font-text);
        font-size: var(--type-bodySmall-size);
        line-height: var(--type-bodySmall-line-height);
      }

      .aero-form-field__feedback--error {
        color: var(--semantic-red-600);
      }

      .aero-form-field__feedback--service {
        color: var(--semantic-blue-500);
      }

      /* Hide native number spinners */
      .aero-form-field__input::-webkit-outer-spin-button,
      .aero-form-field__input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      .aero-form-field__input[type='number'] {
        -moz-appearance: textfield;
      }
    `,
  ],
})
export class AeroInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: InputType = 'text';
  @Input() height: InputHeight = '44';
  @Input() orientation: InputOrientation = 'vertical';
  @Input() state: InputState = 'default';
  @Input() hint = '';
  @Input() error = '';
  @Input() serviceMessage = '';
  @Input() required = false;
  @Input() iconLeft = '';
  @Input() iconRight = '';
  @Input() inputId = `aero-input-${Math.random().toString(36).substr(2, 9)}`;

  @Output() cleared = new EventEmitter<void>();

  value: unknown = '';
  disabled = false;
  focused = false;
  showPassword = false;

  onChange: (value: unknown) => void = () => {};
  onTouched: () => void = () => {};

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this.onChange(val);
  }

  onFocus(): void {
    this.focused = true;
  }

  onBlurEvent(): void {
    this.focused = false;
    this.onTouched();
  }

  clearValue(): void {
    this.value = '';
    this.onChange('');
    this.cleared.emit();
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
