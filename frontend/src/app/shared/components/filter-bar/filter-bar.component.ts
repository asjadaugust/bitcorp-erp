import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange';
  placeholder?: string;
  options?: { label: string; value: any }[];
  value?: any; // For text, select, date
  valueStart?: any; // For dateRange
  valueEnd?: any;   // For dateRange
}

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
              <label>{{ filter.label }}</label>
              
              <!-- Select -->
              <select 
                *ngIf="filter.type === 'select'"
                [(ngModel)]="filter.value"
                (change)="onFilterChange()"
                class="form-control"
              >
                <option value="">Todos</option>
                <option *ngFor="let opt of filter.options" [value]="opt.value">
                  {{ opt.label }}
                </option>
              </select>

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
          <button class="btn-clear" (click)="clearFilters()">
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
    }

    .search-wrapper {
      flex: 1;
      position: relative;
      max-width: 400px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--grey-400);
    }

    .search-input {
      width: 100%;
      padding: 10px 16px 10px 36px;
      border: 1px solid var(--grey-300);
      border-radius: var(--s-8);
      font-size: 14px;
      transition: all 0.2s;
    }

    .filter-input:focus {
      outline: none;
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .date-range-inputs {
      display: flex;
      align-items: center;
      gap: var(--s-8);
    }

    .date-input {
      flex: 1;
      min-width: 140px;
    }

    .date-separator {
      color: var(--grey-400);
      font-weight: 500;
    }
    .btn-filter-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: var(--neutral-0);
      border: 1px solid var(--grey-300);
      border-radius: var(--s-8);
      color: var(--grey-700);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-filter-toggle:hover {
      background: var(--grey-50);
      border-color: var(--grey-400);
    }

    .btn-filter-toggle.active {
      background: var(--primary-100);
      border-color: var(--primary-200);
      color: var(--primary-800);
    }

    .badge {
      background: var(--primary-500);
      color: white;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }

    /* Advanced Filters */
    .advanced-filters {
      padding: var(--s-24);
      border-top: 1px solid var(--grey-100);
      background: var(--grey-50);
      border-bottom-left-radius: var(--s-12);
      border-bottom-right-radius: var(--s-12);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--s-16);
      margin-bottom: var(--s-16);
    }

    .filter-group label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--grey-700);
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--grey-300);
      border-radius: var(--s-6);
      font-size: 14px;
      background: white;
    }

    .filter-actions {
      display: flex;
      justify-content: flex-end;
    }

    .btn-clear {
      background: none;
      border: none;
      color: var(--primary-500);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: underline;
    }

    .btn-clear:hover {
      color: var(--primary-800);
    }
  `]
})
export class FilterBarComponent {
  @Input() config: FilterConfig[] = [];
  @Output() filterChange = new EventEmitter<Record<string, any>>();

  showAdvanced = false;

  getSearchConfig(): FilterConfig | undefined {
    return this.config.find(c => c.type === 'text');
  }

  hasAdvancedFilters(): boolean {
    return this.config.some(c => c.type !== 'text');
  }

  getAdvancedFilters(): FilterConfig[] {
    return this.config.filter(c => c.type !== 'text');
  }

  get activeFiltersCount(): number {
    return this.getAdvancedFilters().filter(c => {
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
    const filters: Record<string, any> = {};
    this.config.forEach(c => {
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
    this.config.forEach(c => {
      if (c.type !== 'text') { // Optionally keep search or clear it too
        c.value = '';
      }
    });
    this.onFilterChange();
  }
}
