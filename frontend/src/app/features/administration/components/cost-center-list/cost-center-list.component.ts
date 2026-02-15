import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdministrationService, CostCenter } from '../../services/administration.service';
import {
  AeroTableComponent,
  TableColumn,
} from '../../../../core/design-system/table/aero-table.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../../shared/components/filter-bar/filter-bar.component';

@Component({
  selector: 'app-cost-center-list',
  standalone: true,
  imports: [CommonModule, AeroTableComponent, PageLayoutComponent, FilterBarComponent],
  template: `
    <app-page-layout
      title="Centros de Costo"
      icon="fa-building"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <div actions>
        <button class="btn btn-primary" (click)="createCostCenter()">
          <i class="fa-solid fa-plus"></i> Nuevo Centro de Costo
        </button>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="filteredCostCenters"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
      >
      </aero-table>

      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button class="btn-icon" (click)="editCostCenter(row)" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .btn {
        padding: var(--s-8) var(--s-16);
        border: none;
        border-radius: var(--s-8);
        font-size: var(--type-bodySmall-size);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        transition: all 0.2s ease;
      }
      .btn-primary {
        background: var(--primary-500);
        color: var(--neutral-0);
      }
      .btn-primary:hover {
        background: var(--primary-800);
      }

      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        color: var(--grey-500);
        transition: color 0.2s;
      }

      .btn-icon:hover {
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: var(--s-4);
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ],
})
export class CostCenterListComponent implements OnInit {
  private adminService = inject(AdministrationService);
  private router = inject(Router);

  costCenters: CostCenter[] = [];
  filteredCostCenters: CostCenter[] = [];
  loading = false;
  filters = { search: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Administración', url: '/administracion' },
    { label: 'Centros de Costo' },
  ];

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Buscar centros de costo...' },
  ];

  columns: TableColumn[] = [
    { key: 'codigo', label: 'Código', type: 'text' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'presupuesto', label: 'Presupuesto', type: 'currency', format: 'PEN' },
  ];

  ngOnInit() {
    this.loadCostCenters();
  }

  loadCostCenters() {
    this.loading = true;
    this.adminService.getCostCenters().subscribe({
      next: (response: any) => {
        // Handle paginated response { success, data, pagination } or direct array
        if (response && typeof response === 'object' && 'data' in response) {
          this.costCenters = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          this.costCenters = response;
        } else {
          this.costCenters = [];
        }
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.costCenters = [];
        this.filteredCostCenters = [];
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.filters.search = filters['search'] || '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredCostCenters = this.costCenters.filter((cc) => {
      const matchesSearch =
        !this.filters.search ||
        cc.nombre?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        cc.codigo?.toLowerCase().includes(this.filters.search.toLowerCase());

      return matchesSearch;
    });
  }

  createCostCenter(): void {
    this.router.navigate(['/administracion/cost-centers/new']);
  }

  editCostCenter(costCenter: CostCenter): void {
    this.router.navigate(['/administracion/cost-centers', costCenter.id, 'edit']);
  }
}
