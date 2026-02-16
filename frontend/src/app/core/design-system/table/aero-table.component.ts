import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChild,
  TemplateRef,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'currency' | 'date' | 'badge' | 'template' | 'custom';
  format?: string; // For date pipes
  sticky?: boolean; // For sticky columns
  badgeConfig?: {
    [key: string]: { label: string; class: string; icon?: string }; // Added icon support
  };
  customTemplate?: (row: any) => string; // For custom HTML rendering
}

@Component({
  selector: 'aero-table',
  encapsulation: ViewEncapsulation.None, // Add this to fix table rendering
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  template: `
    <div class="aero-table-container">
      <div *ngIf="loading" class="loading-overlay">
        <div class="spinner"></div>
      </div>

      <table class="aero-table">
        <thead>
          <tr>
            <th
              *ngFor="let col of columns"
              [style.width]="col.width"
              [class.text-center]="col.align === 'center'"
              [class.text-right]="col.align === 'right'"
            >
              {{ col.label }}
            </th>
            <th *ngIf="actionsTemplate" style="width: 100px" class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of paginatedData" (click)="onRowClick(row)">
            <td
              *ngFor="let col of columns"
              [class.text-center]="col.align === 'center'"
              [class.text-right]="col.align === 'right'"
            >
              <!-- Template Column -->
              <ng-container *ngIf="col.type === 'template'">
                <ng-container
                  *ngTemplateOutlet="getTemplate(col.key); context: { $implicit: row }"
                ></ng-container>
              </ng-container>

              <!-- Badge Column -->
              <ng-container *ngIf="col.type === 'badge'">
                <span [class]="getBadgeClass(col, row[col.key])">
                  <i
                    *ngIf="getBadgeIcon(col, row[col.key])"
                    [class]="'fa-solid ' + getBadgeIcon(col, row[col.key])"
                  ></i>
                  {{ getBadgeLabel(col, row[col.key]) }}
                </span>
              </ng-container>

              <!-- Currency Column -->
              <ng-container *ngIf="col.type === 'currency'">
                <span class="font-mono font-bold">
                  {{ row[col.key] | currency: col.format || 'PEN' : 'symbol' }}
                </span>
              </ng-container>

              <!-- Date Column -->
              <ng-container *ngIf="col.type === 'date'">
                <div class="date-cell">
                  {{ row[col.key] | date: col.format || 'dd/MM/yyyy' }}
                </div>
              </ng-container>

              <!-- Default Text Column -->
              <ng-container *ngIf="!col.type || col.type === 'text'">
                {{ row[col.key] }}
              </ng-container>
            </td>
            <td *ngIf="actionsTemplate" class="actions-cell">
              <ng-container
                *ngTemplateOutlet="actionsTemplate; context: { $implicit: row }"
              ></ng-container>
            </td>
          </tr>
          <tr *ngIf="!loading && (!data || data.length === 0)">
            <td [attr.colspan]="columns.length + (actionsTemplate ? 1 : 0)" class="empty-state">
              <div class="empty-content">
                <i class="fa-solid fa-inbox"></i>
                <p>No hay datos disponibles</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination Controls -->
      <div *ngIf="totalResults > 0" class="pagination-container">
        <div class="pagination-info">
          <span
            >Mostrando {{ startIndex + 1 }} - {{ endIndex }} de {{ totalResults }} resultados</span
          >
          <div class="page-size-selector">
            <label>Filas por página:</label>
            <app-dropdown
              [(ngModel)]="pageSize"
              [options]="pageSizeOptions"
              (ngModelChange)="onPageSizeChange()"
              [placeholder]="'Select size'"
            ></app-dropdown>
          </div>
        </div>
        <div class="pagination-controls">
          <button
            class="btn-pagination"
            [disabled]="currentPage === 1"
            (click)="goToPage(1)"
            title="Primera página"
          >
            <i class="fa-solid fa-angles-left"></i>
          </button>
          <button
            class="btn-pagination"
            [disabled]="currentPage === 1"
            (click)="goToPage(currentPage - 1)"
            title="Página anterior"
          >
            <i class="fa-solid fa-angle-left"></i>
          </button>
          <span class="page-indicator">Página {{ currentPage }} de {{ totalPages }}</span>
          <button
            class="btn-pagination"
            [disabled]="currentPage === totalPages"
            (click)="goToPage(currentPage + 1)"
            title="Página siguiente"
          >
            <i class="fa-solid fa-angle-right"></i>
          </button>
          <button
            class="btn-pagination"
            [disabled]="currentPage === totalPages"
            (click)="goToPage(totalPages)"
            title="Última página"
          >
            <i class="fa-solid fa-angles-right"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .aero-table-container {
        width: 100%;
        overflow-x: auto;
        border-radius: var(--radius-md);
        border: 1px solid var(--grey-200);
        background: var(--neutral-0);
        box-shadow: var(--shadow-sm);
        position: relative;
        min-height: 200px;
      }

      .loading-overlay {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.78);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        backdrop-filter: blur(2px);
        pointer-events: all;
        animation: fadeOverlay 180ms ease;
      }

      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--grey-200);
        border-top-color: var(--primary-500);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes fadeOverlay {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .aero-table {
        width: 100%;
        border-collapse: collapse;
        white-space: nowrap;

        thead {
          background-color: var(--grey-50);

          th {
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            color: var(--grey-700);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid var(--grey-200);
          }
        }

        tbody {
          tr {
            border-bottom: 1px solid var(--grey-100);
            transition: all 0.15s ease;

            &:last-child {
              border-bottom: none;
            }

            &:hover {
              background-color: var(--primary-100);
              transform: translateY(-1px);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
          }

          td {
            padding: 12px 16px;
            font-size: 14px;
            color: var(--grey-700);
            vertical-align: middle;
          }
        }

        .text-center {
          text-align: center;
        }
        .text-right {
          text-align: right;
        }
        .font-mono {
          font-family: monospace;
        }
        .font-bold {
          font-weight: 600;
        }

        .empty-state {
          text-align: center;
          padding: 48px 0;

          .empty-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;

            i {
              font-size: 32px;
              color: var(--grey-300);
            }

            p {
              margin: 0;
              color: var(--grey-500);
            }
          }
        }

        .actions-cell {
          white-space: nowrap;
          text-align: right;
        }

        .date-cell {
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          text-align: center;
          color: var(--grey-700);
        }
      }

      /* Badge Styles overridden by Global Styles, keeping minimal defaults */
      .badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      /* Pagination Styles */
      .pagination-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-top: 1px solid var(--grey-200);
        background: var(--grey-50);
        flex-wrap: wrap;
        gap: 12px;
      }

      .pagination-info {
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 13px;
        color: var(--grey-700);
        flex-wrap: wrap;
      }

      .page-size-selector {
        display: flex;
        align-items: center;
        gap: 8px;

        label {
          font-size: 13px;
          color: var(--grey-700);
          white-space: nowrap;
          margin-right: 8px;
        }

        .form-select {
          padding: 4px 8px;
          border: 1px solid var(--grey-300);
          border-radius: 4px;
          background: white;
          font-size: 13px;
          cursor: pointer;

          &:focus {
            outline: none;
            border-color: var(--primary-500);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        }
      }

      .pagination-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-pagination {
        padding: 6px 10px;
        border: 1px solid var(--grey-300);
        background: white;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--grey-700);
        font-size: 14px;

        &:hover:not(:disabled) {
          background: var(--primary-100);
          border-color: var(--primary-500);
          color: var(--primary-500);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        i {
          display: block;
        }
      }

      .page-indicator {
        padding: 0 12px;
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-700);
      }
    `,
  ],
})
export class AeroTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() actionsTemplate?: TemplateRef<any>;
  @Input() templates: { [key: string]: TemplateRef<any> } = {};
  @Output() rowClick = new EventEmitter<any>();

  @Input() serverSide = false;
  @Input() totalItems = 0;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  // Pagination properties
  pageSize = 10;
  currentPage = 1;

  pageSizeOptions: DropdownOption[] = [
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
  ];

  get paginatedData(): any[] {
    if (this.serverSide) {
      return this.data || [];
    }
    if (!this.data || !Array.isArray(this.data)) {
      return [];
    }
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.data.slice(start, end);
  }

  get totalPages(): number {
    if (this.serverSide) {
      return Math.ceil(this.totalItems / this.pageSize);
    }
    if (!this.data || !Array.isArray(this.data)) {
      return 0;
    }
    return Math.ceil(this.data.length / this.pageSize);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    if (this.serverSide) {
      return Math.min(this.startIndex + this.pageSize, this.totalItems);
    }
    const end = this.startIndex + this.pageSize;
    return Math.min(end, this.data.length);
  }

  get totalResults(): number {
    return this.serverSide ? this.totalItems : this.data ? this.data.length : 0;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      if (this.serverSide) {
        this.pageChange.emit(this.currentPage);
      }
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page when changing page size
    if (this.serverSide) {
      this.pageSizeChange.emit(this.pageSize);
      this.pageChange.emit(1); // Also emit page change to reload data
    }
  }

  onRowClick(row: any) {
    this.rowClick.emit(row);
  }

  getTemplate(key: string): TemplateRef<any> | null {
    return this.templates[key] || null;
  }

  getBadgeClass(col: TableColumn, value: string): string {
    if (col.badgeConfig && col.badgeConfig[value]) {
      return col.badgeConfig[value].class;
    }
    // Updated default fallback to use global status-badge and status-{value}
    // Normalize value to ensure it matches common patterns (e.g. lowercase) if needed,
    // but usually status classes are robust. Adding 'status-badge' is key.
    return 'status-badge status-' + (value ? value.toString().toLowerCase() : 'unknown');
  }

  getBadgeLabel(col: TableColumn, value: string): string {
    if (col.badgeConfig && col.badgeConfig[value]) {
      return col.badgeConfig[value].label;
    }
    return value;
  }

  getBadgeIcon(col: TableColumn, value: string): string | undefined {
    if (col.badgeConfig && col.badgeConfig[value]) {
      return col.badgeConfig[value].icon;
    }
    return undefined;
  }
}
