import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ExportFormat = 'excel' | 'csv';

@Component({
  selector: 'app-export-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="export-dropdown" [class.open]="isOpen">
      <button class="export-button" (click)="toggleDropdown()" [disabled]="disabled" type="button">
        <i class="fa-solid fa-download"></i>
        <span>{{ label }}</span>
        <i class="fa-solid fa-chevron-down arrow"></i>
      </button>

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
    <div class="dropdown-backdrop" *ngIf="isOpen" (click)="closeDropdown()"></div>
  `,
  styles: [
    `
      .export-dropdown {
        position: relative;
        display: inline-block;
      }

      .export-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1rem;
        background: var(--secondary-500, #6366f1);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .export-button:hover:not(:disabled) {
        background: var(--accent-500);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(227, 114, 34, 0.3);
      }

      .export-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .export-button .arrow {
        font-size: 12px;
        transition: transform 0.2s;
      }

      .export-dropdown.open .arrow {
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
