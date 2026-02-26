import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange';
  placeholder?: string;
  options?: { label: string; value: unknown }[];
  value?: unknown; // For text, select, date
  valueStart?: unknown; // For dateRange
  valueEnd?: unknown; // For dateRange
}

import { DropdownComponent } from '../dropdown/dropdown.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent, ButtonComponent],
  template: `
    <div class="filter-bar">
      <div class="filter-main">
        <!-- Search Input (Always visible if configured) -->
        <div class="search-wrapper" *ngIf="getSearchConfig() as searchConfig">
          <i class="fa-solid fa-search search-icon"></i>
          <input
            type="text"
            [placeholder]="searchConfig.placeholder || 'Buscar...'"
            [(ngModel)]="searchConfig.value"
            (input)="onFilterChange()"
            class="search-input"
          />
        </div>

        <!-- Toggle Advanced Filters -->
        <button
          *ngIf="hasAdvancedFilters()"
          class="btn-filter-toggle"
          [class.active]="showAdvanced"
          (click)="toggleAdvanced()"
        >
          <i class="fa-solid fa-filter"></i>
          <span>Filtros</span>
          <span class="badge" *ngIf="activeFiltersCount > 0">{{ activeFiltersCount }}</span>
        </button>

        <ng-content select="[actions]"></ng-content>
      </div>

      <!-- Advanced Filters Panel -->
      <div class="advanced-filters" *ngIf="showAdvanced && hasAdvancedFilters()">
        <div class="filters-grid">
          <ng-container *ngFor="let filter of getAdvancedFilters()">
            <div class="filter-group">
              <span class="label">{{ filter.label }}</span>

              <!-- Dropdown -->
              <app-dropdown
                *ngIf="filter.type === 'select'"
                [options]="getDropdownOptions(filter)"
                [(ngModel)]="filter.value"
                (selectionChange)="onFilterChange()"
                [placeholder]="'Seleccionar...'"
                [searchable]="(filter.options && filter.options.length > 5) || false"
              ></app-dropdown>

              <!-- Date -->
              <input
                *ngIf="filter.type === 'date'"
                type="date"
                [(ngModel)]="filter.value"
                (change)="onFilterChange()"
                class="form-control"
              />

              <!-- Date Range -->
              <div *ngIf="filter.type === 'dateRange'" class="date-range-inputs">
                <input
                  type="date"
                  [(ngModel)]="filter.valueStart"
                  (change)="onFilterChange()"
                  class="form-control date-input"
                  placeholder="Desde"
                />
                <span class="date-separator">-</span>
                <input
                  type="date"
                  [(ngModel)]="filter.valueEnd"
                  (change)="onFilterChange()"
                  class="form-control date-input"
                  placeholder="Hasta"
                />
              </div>
            </div>
          </ng-container>
        </div>

        <div class="filter-actions">
          <app-button
            variant="ghost"
            size="sm"
            label="Limpiar filtros"
            icon="fa-times"
            (clicked)="clearFilters()"
          ></app-button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .filter-bar {
        background: var(--neutral-0);
        border-radius: var(--s-12);
        box-shadow: var(--shadow-sm);
        margin-bottom: var(--s-24);
        border: 1px solid var(--grey-200);
      }

      .filter-main {
        padding: var(--s-16);
        display: flex;
        gap: var(--s-16);
        align-items: center;
        flex-wrap: wrap;
      }

      .search-wrapper {
        flex: 1;
        position: relative;
        min-width: 200px;
        max-width: 400px;
      }

      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--grey-400);
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: 10px 16px 10px 36px;
        border: 1px solid var(--grey-300);
        border-radius: var(--s-8);
        font-size: 14px;
        transition: all 0.2s;
        background: white;
      }

      .search-input:focus,
      .form-control:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(0, 119, 205, 0.1);
      }

      .date-range-inputs {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        flex-wrap: wrap;
      }

      .date-input {
        flex: 1;
        min-width: 130px;
      }

      /* Premium Toggle Button */
      .btn-filter-toggle {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: white;
        border: 1px solid var(--grey-300);
        border-radius: var(--s-8);
        color: var(--grey-700);
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }

      .btn-filter-toggle:hover {
        background: var(--grey-50);
        border-color: var(--primary-500);
        color: var(--primary-700);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .btn-filter-toggle.active {
        background: var(--primary-50);
        border-color: var(--primary-500);
        color: var(--primary-700);
        box-shadow: none;
      }

      .badge {
        background: var(--primary-500);
        color: white;
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
        line-height: 1;
      }

      /* Advanced Filters Panel */
      .advanced-filters {
        padding: var(--s-24);
        border-top: 1px solid var(--grey-200);
        background: var(--grey-50);
        border-bottom-left-radius: var(--s-12);
        border-bottom-right-radius: var(--s-12);
      }

      .filter-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: var(--s-20);
        margin-top: var(--s-16);
        border-top: 1px dashed var(--grey-200);
      }

      .date-range-inputs {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        height: 42px;
      }

      .date-input {
        flex: 1;
        min-width: 0;
      }

      .date-separator {
        color: var(--grey-500);
        font-weight: 500;
      }
    `,
  ],
})
export class FilterBarComponent {
  @Input() config: FilterConfig[] = [];
  @Output() filterChange = new EventEmitter<Record<string, unknown>>();

  showAdvanced = false;

  getSearchConfig(): FilterConfig | undefined {
    return this.config.find((c) => c.type === 'text');
  }

  hasAdvancedFilters(): boolean {
    return this.config.some((c) => c.type !== 'text');
  }

  getAdvancedFilters(): FilterConfig[] {
    return this.config.filter((c) => c.type !== 'text');
  }

  getDropdownOptions(filter: FilterConfig): { label: string; value: unknown }[] {
    const opts = filter.options || [];
    return [{ label: 'Todos', value: '' }, ...opts];
  }

  get activeFiltersCount(): number {
    return this.getAdvancedFilters().filter((c) => {
      if (c.type === 'dateRange') {
        return c.valueStart || c.valueEnd;
      }
      return c.value !== '' && c.value !== null && c.value !== undefined;
    }).length;
  }

  toggleAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }

  onFilterChange() {
    const filters: Record<string, unknown> = {};
    this.config.forEach((c) => {
      if (c.type === 'dateRange') {
        filters[c.key + '_start'] = c.valueStart;
        filters[c.key + '_end'] = c.valueEnd;
      } else {
        filters[c.key] = c.value;
      }
    });
    this.filterChange.emit(filters);
  }

  clearFilters() {
    this.config.forEach((c) => {
      if (c.type !== 'text') {
        // Optionally keep search or clear it too
        c.value = '';
      }
    });
    this.onFilterChange();
  }
}
