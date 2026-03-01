import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface DropdownOption {
  value: unknown;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export type DropdownHeight = '44' | '56';
export type DropdownState = 'default' | 'error';

@Component({
  selector: 'aero-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AeroDropdownComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="aero-dropdown"
      [class.aero-dropdown--disabled]="disabled"
      [class.aero-dropdown--error]="state === 'error'"
    >
      <label *ngIf="label" class="aero-dropdown__label">
        {{ label }} <span *ngIf="required" class="aero-dropdown__required">*</span>
      </label>

      <div
        class="aero-dropdown__field"
        [ngClass]="'aero-dropdown__field--h' + height"
        [class.aero-dropdown__field--open]="isOpen"
        [class.aero-dropdown__field--error]="state === 'error'"
        (click)="toggle()"
        role="combobox"
        [attr.aria-expanded]="isOpen"
        tabindex="0"
        (keydown.enter)="toggle()"
        (keydown.space)="toggle(); $event.preventDefault()"
        (keydown.escape)="close()"
        (keydown.arrowDown)="onArrowDown($event)"
        (keydown.arrowUp)="onArrowUp($event)"
      >
        <i *ngIf="selectedIcon" class="aero-dropdown__selected-icon" [ngClass]="selectedIcon"></i>
        <span class="aero-dropdown__text" [class.aero-dropdown__placeholder]="!hasSelection">
          {{ displayText }}
        </span>
        <i
          class="fa-solid fa-chevron-down aero-dropdown__chevron"
          [class.aero-dropdown__chevron--open]="isOpen"
        ></i>
      </div>

      <div *ngIf="state === 'error' && error" class="aero-dropdown__feedback">
        <i class="fa-solid fa-circle-exclamation"></i> {{ error }}
      </div>

      <!-- Options Panel -->
      <div *ngIf="isOpen" class="aero-dropdown__panel" role="listbox">
        <div *ngIf="searchable" class="aero-dropdown__search-wrap">
          <i class="fa-solid fa-magnifying-glass aero-dropdown__search-icon"></i>
          <input
            #searchInput
            type="text"
            class="aero-dropdown__search"
            [placeholder]="searchPlaceholder"
            [(ngModel)]="searchTerm"
            (click)="$event.stopPropagation()"
            autocomplete="off"
          />
        </div>

        <div class="aero-dropdown__options" role="listbox">
          <button
            *ngFor="let opt of filteredOptions; let i = index"
            type="button"
            class="aero-dropdown__option"
            [class.aero-dropdown__option--selected]="isOptionSelected(opt)"
            [class.aero-dropdown__option--highlighted]="i === highlightedIndex"
            [class.aero-dropdown__option--disabled]="opt.disabled"
            [disabled]="opt.disabled"
            (click)="selectOption(opt, $event)"
            role="option"
            [attr.aria-selected]="isOptionSelected(opt)"
          >
            <span *ngIf="multiple" class="aero-dropdown__check">
              <i *ngIf="isOptionSelected(opt)" class="fa-solid fa-check"></i>
            </span>
            <i *ngIf="opt.icon" class="aero-dropdown__option-icon" [ngClass]="opt.icon"></i>
            <span class="aero-dropdown__option-label">{{ opt.label }}</span>
          </button>

          <div *ngIf="filteredOptions.length === 0" class="aero-dropdown__empty">
            Sin resultados
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }

      .aero-dropdown {
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
      }

      .aero-dropdown__label {
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        font-weight: 400;
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
      }

      .aero-dropdown__required {
        color: var(--accent-500);
      }

      .aero-dropdown--error .aero-dropdown__label {
        color: var(--accent-500);
      }

      /* Field */
      .aero-dropdown__field {
        display: flex;
        align-items: center;
        border: 1px solid var(--grey-600);
        border-radius: var(--radius-sm);
        background-color: var(--grey-100);
        padding: 0 var(--s-12);
        gap: var(--s-8);
        cursor: pointer;
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;
        outline: none;
      }

      .aero-dropdown__field--h44 {
        height: 44px;
      }
      .aero-dropdown__field--h56 {
        height: 56px;
      }

      .aero-dropdown__field:hover {
        border-color: var(--primary-900);
      }

      .aero-dropdown__field:focus {
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(0, 119, 205, 0.1);
      }

      .aero-dropdown__field--open {
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(0, 119, 205, 0.1);
      }

      .aero-dropdown__field--error {
        border-color: var(--accent-500);
      }

      .aero-dropdown--disabled .aero-dropdown__field {
        background-color: var(--grey-100);
        border-color: var(--grey-500);
        cursor: not-allowed;
      }

      .aero-dropdown__selected-icon {
        color: var(--primary-900);
        font-size: 16px;
        flex-shrink: 0;
      }

      .aero-dropdown__text {
        flex: 1;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .aero-dropdown__placeholder {
        color: var(--grey-500);
      }

      .aero-dropdown__chevron {
        color: var(--primary-900);
        font-size: 12px;
        flex-shrink: 0;
        transition: transform 0.2s ease;
      }

      .aero-dropdown__chevron--open {
        transform: rotate(180deg);
      }

      .aero-dropdown__feedback {
        display: flex;
        align-items: center;
        gap: var(--s-4);
        font-family: var(--font-text);
        font-size: var(--type-bodySmall-size);
        line-height: var(--type-bodySmall-line-height);
        color: var(--accent-500);
      }

      /* Panel */
      .aero-dropdown__panel {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 1000;
        margin-top: var(--s-4);
        background-color: var(--grey-100);
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        overflow: hidden;
      }

      .aero-dropdown__search-wrap {
        display: flex;
        align-items: center;
        padding: var(--s-8) var(--s-12);
        border-bottom: 1px solid var(--grey-200);
        gap: var(--s-8);
      }

      .aero-dropdown__search-icon {
        color: var(--grey-600);
        font-size: 14px;
        flex-shrink: 0;
      }

      .aero-dropdown__search {
        flex: 1;
        border: none;
        outline: none;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        color: var(--primary-900);
        background: transparent;
      }

      .aero-dropdown__search::placeholder {
        color: var(--grey-500);
      }

      .aero-dropdown__options {
        max-height: 240px;
        overflow-y: auto;
      }

      .aero-dropdown__option {
        display: flex;
        align-items: center;
        width: 100%;
        padding: var(--s-8) var(--s-12);
        border: none;
        background: none;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
        cursor: pointer;
        gap: var(--s-8);
        text-align: left;
        transition: background-color 0.1s ease;
      }

      .aero-dropdown__option:hover:not(:disabled) {
        background-color: var(--grey-100);
      }

      .aero-dropdown__option--highlighted {
        background-color: var(--grey-100);
      }

      .aero-dropdown__option--selected {
        background-color: var(--primary-100);
        font-weight: 500;
      }

      .aero-dropdown__option--disabled {
        color: var(--grey-500);
        cursor: not-allowed;
      }

      .aero-dropdown__check {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        font-size: 12px;
        color: var(--primary-500);
      }

      .aero-dropdown__option-icon {
        font-size: 16px;
        flex-shrink: 0;
      }

      .aero-dropdown__option-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .aero-dropdown__empty {
        padding: var(--s-16) var(--s-12);
        text-align: center;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        color: var(--grey-500);
      }
    `,
  ],
})
export class AeroDropdownComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Seleccionar...';
  @Input() options: DropdownOption[] = [];
  @Input() height: DropdownHeight = '44';
  @Input() state: DropdownState = 'default';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() multiple = false;
  @Input() searchable = false;
  @Input() searchPlaceholder = 'Buscar...';

  @Output() selectionChange = new EventEmitter<unknown>();

  isOpen = false;
  searchTerm = '';
  highlightedIndex = -1;

  private selectedValue: unknown = null;
  private selectedValues: Set<unknown> = new Set();

  onChange: (value: unknown) => void = () => {};
  onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  get hasSelection(): boolean {
    if (this.multiple) return this.selectedValues.size > 0;
    return this.selectedValue !== null && this.selectedValue !== undefined;
  }

  get displayText(): string {
    if (this.multiple) {
      if (this.selectedValues.size === 0) return this.placeholder;
      const labels = this.options
        .filter((o) => this.selectedValues.has(o.value))
        .map((o) => o.label);
      return labels.join(', ');
    }

    if (!this.hasSelection) return this.placeholder;
    const found = this.options.find((o) => o.value === this.selectedValue);
    return found?.label ?? this.placeholder;
  }

  get selectedIcon(): string {
    if (this.multiple || !this.hasSelection) return '';
    const found = this.options.find((o) => o.value === this.selectedValue);
    return found?.icon ?? '';
  }

  get filteredOptions(): DropdownOption[] {
    if (!this.searchTerm) return this.options;
    const term = this.searchTerm.toLowerCase();
    return this.options.filter((o) => o.label.toLowerCase().includes(term));
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    this.isOpen = true;
    this.searchTerm = '';
    this.highlightedIndex = -1;
  }

  close(): void {
    this.isOpen = false;
    this.searchTerm = '';
    this.onTouched();
  }

  isOptionSelected(opt: DropdownOption): boolean {
    if (this.multiple) return this.selectedValues.has(opt.value);
    return this.selectedValue === opt.value;
  }

  selectOption(opt: DropdownOption, event: Event): void {
    event.stopPropagation();
    if (opt.disabled) return;

    if (this.multiple) {
      if (this.selectedValues.has(opt.value)) {
        this.selectedValues.delete(opt.value);
      } else {
        this.selectedValues.add(opt.value);
      }
      const value = Array.from(this.selectedValues);
      this.onChange(value);
      this.selectionChange.emit(value);
    } else {
      this.selectedValue = opt.value;
      this.onChange(opt.value);
      this.selectionChange.emit(opt.value);
      this.close();
    }
  }

  onArrowDown(event: Event): void {
    event.preventDefault();
    if (!this.isOpen) {
      this.open();
      return;
    }
    if (this.highlightedIndex < this.filteredOptions.length - 1) {
      this.highlightedIndex++;
    }
  }

  onArrowUp(event: Event): void {
    event.preventDefault();
    if (this.highlightedIndex > 0) {
      this.highlightedIndex--;
    }
  }

  writeValue(value: unknown): void {
    if (this.multiple) {
      this.selectedValues = new Set(Array.isArray(value) ? value : []);
    } else {
      this.selectedValue = value;
    }
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
