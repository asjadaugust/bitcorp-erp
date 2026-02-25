import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ElementRef,
  ViewChild,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';

export interface DropdownOption {
  label: string;
  value: unknown;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, OverlayModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="dropdown-container"
      [class.disabled]="disabled"
      [class.open]="isOpen"
      [class.has-error]="error"
    >
      <!-- Trigger -->
      <div
        class="dropdown-trigger"
        (click)="toggle()"
        (keydown.enter)="toggle()"
        tabindex="0"
        role="combobox"
        [attr.aria-expanded]="isOpen"
        aria-controls="dropdown-listbox"
        cdkOverlayOrigin
        #trigger="cdkOverlayOrigin"
      >
        <div class="selected-value" [class.placeholder]="!hasValue()">
          <span *ngIf="!hasValue()">{{ placeholder }}</span>
          <span *ngIf="hasValue()">{{ getDisplayValue() }}</span>
        </div>
        <i class="fa-solid fa-chevron-down arrow-icon"></i>
      </div>

      <!-- Menu Overlay -->
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="trigger"
        [cdkConnectedOverlayOpen]="isOpen"
        [cdkConnectedOverlayHasBackdrop]="true"
        [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
        [cdkConnectedOverlayMinWidth]="triggerWidth"
        [cdkConnectedOverlayPositions]="[
          {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
            offsetY: 4,
          },
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'bottom',
            offsetY: -4,
          },
        ]"
        (backdropClick)="close()"
        (detach)="close()"
      >
        <div class="dropdown-menu">
          <!-- Search -->
          <div class="search-box" *ngIf="searchable">
            <i class="fa-solid fa-search search-icon"></i>
            <input
              #searchInput
              type="text"
              [(ngModel)]="searchTerm"
              (input)="filterOptions()"
              placeholder="Buscar..."
              class="search-input"
              (click)="$event.stopPropagation()"
            />
          </div>

          <!-- Options -->
          <div class="options-list" id="dropdown-listbox" role="listbox">
            <div
              *ngFor="let option of filteredOptions"
              class="option-item"
              [class.selected]="isSelected(option)"
              [class.disabled]="option.disabled"
              (click)="selectOption(option)"
              (keydown.enter)="selectOption(option)"
              tabindex="0"
              role="option"
              [attr.aria-selected]="isSelected(option)"
            >
              <div class="option-content">
                <i *ngIf="option.icon" [class]="option.icon"></i>
                <span>{{ option.label }}</span>
              </div>
              <i *ngIf="isSelected(option) && !multiple" class="fa-solid fa-check check-icon"></i>
              <div *ngIf="multiple" class="checkbox" [class.checked]="isSelected(option)">
                <i class="fa-solid fa-check"></i>
              </div>
            </div>
            <div *ngIf="filteredOptions.length === 0" class="no-results">
              No se encontraron resultados
            </div>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        position: relative;
        font-family: 'UniversalSans', sans-serif;
      }

      .dropdown-container {
        position: relative;
        width: 100%;
      }

      /* Trigger */
      .dropdown-trigger {
        width: 100%;
        padding: 10px 12px;
        background: white;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 42px;
        user-select: none;
      }

      .dropdown-trigger:hover {
        border-color: var(--primary-300);
      }

      .dropdown-container.has-error .dropdown-trigger {
        border-color: var(--error-500, #ef4444);
        background-color: #fef2f2;
      }

      .dropdown-container.open .dropdown-trigger {
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(0, 119, 205, 0.1);
      }

      .dropdown-container.disabled .dropdown-trigger {
        background: #f5f5f5;
        cursor: not-allowed;
        opacity: 0.7;
      }

      .selected-value {
        flex: 1;
        font-size: 14px;
        color: var(--primary-900);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .selected-value.placeholder {
        color: var(--grey-500);
      }

      .arrow-icon {
        font-size: 12px;
        color: var(--grey-500);
        margin-left: 8px;
        transition: transform 0.2s ease;
      }

      .dropdown-container.open .arrow-icon {
        transform: rotate(180deg);
        color: var(--primary-500);
      }

      /* Menu */
      .dropdown-menu {
        background: white;
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-lg);
        overflow: hidden;
        animation: slideDown 0.15s ease-out;
        min-width: 100%;
        /* Ensure specificty for overlay content */
        pointer-events: auto;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Search */
      .search-box {
        padding: 8px;
        border-bottom: 1px solid var(--grey-100);
        position: relative;
      }

      .search-icon {
        position: absolute;
        left: 18px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--grey-400);
        font-size: 12px;
      }

      .search-input {
        width: 100%;
        padding: 8px 12px 8px 30px;
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-sm);
        font-size: 13px;
        outline: none;
      }

      .search-input:focus {
        border-color: var(--primary-300);
      }

      /* Options */
      .options-list {
        max-height: 250px;
        overflow-y: auto;
      }

      .option-item {
        padding: 10px 12px;
        font-size: 14px;
        color: var(--primary-900);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background 0.1s;
      }

      .option-item:hover {
        background: var(--grey-50);
        color: var(--primary-700);
      }

      .option-item.selected {
        background: var(--primary-50);
        color: var(--primary-900);
        font-weight: 500;
      }

      .option-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .check-icon {
        font-size: 12px;
        color: var(--primary-500);
      }

      .no-results {
        padding: 12px;
        text-align: center;
        color: var(--grey-500);
        font-size: 13px;
      }

      /* Checkbox for multi-select */
      .checkbox {
        width: 16px;
        height: 16px;
        border: 1px solid var(--grey-400);
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .checkbox.checked {
        background: var(--primary-500);
        border-color: var(--primary-500);
      }

      .checkbox i {
        font-size: 10px;
        color: white;
        opacity: 0;
        transform: scale(0.5);
        transition: all 0.2s;
      }

      .checkbox.checked i {
        opacity: 1;
        transform: scale(1);
      }
    `,
  ],
})
export class DropdownComponent implements OnInit, ControlValueAccessor {
  @Input() options: DropdownOption[] = [];
  @Input() placeholder = 'Seleccionar...';
  @Input() disabled = false;
  @Input() multiple = false;
  @Input() searchable = false;
  @Input() error = false;

  @Output() selectionChange = new EventEmitter<unknown>();

  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('trigger', { read: ElementRef }) trigger!: ElementRef;

  isOpen = false;
  searchTerm = '';
  filteredOptions: DropdownOption[] = [];
  triggerWidth = 0;

  // Value accessor storage
  private value: unknown = null;

  // Callbacks
  onChange: (value: unknown) => void = () => {
    /* noop */
  };
  onTouch: () => void = () => {
    /* noop */
  };

  private elementRef = inject(ElementRef);

  ngOnInit() {
    this.filteredOptions = this.options;
  }

  // Value Accessor Interface
  writeValue(value: unknown): void {
    this.value = value;
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Component Logic
  toggle() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.updateTriggerWidth();
      this.searchTerm = '';
      this.filteredOptions = this.options;
      if (this.searchable) {
        setTimeout(() => this.searchInput?.nativeElement.focus(), 50);
      }
    } else {
      this.onTouch();
    }
  }

  close() {
    this.isOpen = false;
    this.onTouch();
  }

  updateTriggerWidth() {
    if (this.trigger) {
      this.triggerWidth = this.trigger.nativeElement.getBoundingClientRect().width;
    }
  }

  filterOptions() {
    if (!this.searchTerm) {
      this.filteredOptions = this.options;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredOptions = this.options.filter((opt) => opt.label.toLowerCase().includes(term));
  }

  selectOption(option: DropdownOption) {
    if (option.disabled) return;

    if (this.multiple) {
      const currentValues = Array.isArray(this.value) ? [...this.value] : [];
      const index = currentValues.indexOf(option.value);

      if (index === -1) {
        currentValues.push(option.value);
      } else {
        currentValues.splice(index, 1);
      }

      this.value = currentValues;
    } else {
      this.value = option.value;
      this.close();
    }

    this.onChange(this.value);
    this.selectionChange.emit(this.value);
  }

  isSelected(option: DropdownOption): boolean {
    if (this.multiple) {
      return Array.isArray(this.value) && this.value.includes(option.value);
    }
    return this.value === option.value;
  }

  hasValue(): boolean {
    if (this.multiple) {
      return Array.isArray(this.value) && this.value.length > 0;
    }
    return this.value !== null && this.value !== undefined && this.value !== '';
  }

  getDisplayValue(): string {
    if (this.multiple) {
      if (!Array.isArray(this.value) || this.value.length === 0) return '';
      if (this.value.length === 1) {
        const valArray = this.value as unknown[];
        const opt = this.options.find((o) => o.value === valArray[0]);
        return opt ? opt.label : '';
      }
      return `${this.value.length} seleccionados`;
    } else {
      const opt = this.options.find((o) => o.value === this.value);
      return opt ? opt.label : '';
    }
  }

  // Public method to update options dynamically
  updateOptions(newOptions: DropdownOption[]) {
    this.options = newOptions;
    this.filteredOptions = newOptions;
  }
}
