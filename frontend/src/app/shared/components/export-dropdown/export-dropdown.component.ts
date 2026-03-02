import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AeroButtonComponent } from '../../../core/design-system';

export type ExportFormat = 'excel' | 'csv';

@Component({
  selector: 'app-export-dropdown',
  standalone: true,
  imports: [CommonModule, AeroButtonComponent],
  template: `
    <div class="export-dropdown" [class.open]="isOpen">
      <aero-button
        variant="secondary"
        iconLeft="fa-download"
        [disabled]="disabled"
        (clicked)="toggleDropdown()"
        >{{ label }}<i class="fa-solid fa-chevron-down export-arrow" [class.open]="isOpen"></i
      ></aero-button>

      <div class="dropdown-menu" *ngIf="isOpen">
        <button class="dropdown-item" (click)="selectExport('excel')" type="button">
          <i class="fa-solid fa-file-excel"></i>
          <span>Exportar Excel</span>
        </button>
        <button class="dropdown-item" (click)="selectExport('csv')" type="button">
          <i class="fa-solid fa-file-csv"></i>
          <span>Exportar CSV</span>
        </button>
      </div>
    </div>

    <!-- Backdrop to close dropdown -->
    <div
      class="dropdown-backdrop"
      *ngIf="isOpen"
      (click)="closeDropdown()"
      (keydown.enter)="closeDropdown()"
      tabindex="0"
      role="button"
    ></div>
  `,
  styles: [
    `
      .export-dropdown {
        position: relative;
        display: inline-block;
      }

      .export-arrow {
        font-size: 12px;
        margin-left: 4px;
        transition: transform 0.2s ease;
      }

      .export-arrow.open {
        transform: rotate(180deg);
      }

      .dropdown-menu {
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        min-width: 180px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        overflow: hidden;
        animation: slideDown 0.2s ease-out;
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

      .dropdown-item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: transparent;
        border: none;
        text-align: left;
        font-size: 14px;
        color: var(--grey-700);
        cursor: pointer;
        transition: all 0.15s;
      }

      .dropdown-item:hover {
        background: var(--grey-50);
        color: var(--primary-500);
      }

      .dropdown-item i {
        font-size: 16px;
        width: 20px;
        text-align: center;
      }

      .dropdown-item:first-child i {
        color: #10b981;
      }

      .dropdown-item:last-child i {
        color: #06b6d4;
      }

      .dropdown-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999;
        background: transparent;
      }
    `,
  ],
})
export class ExportDropdownComponent {
  @Input() label = 'Exportar';
  @Input() disabled = false;
  @Output() export = new EventEmitter<ExportFormat>();

  isOpen = false;

  toggleDropdown(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  selectExport(format: ExportFormat): void {
    this.export.emit(format);
    this.closeDropdown();
  }
}
