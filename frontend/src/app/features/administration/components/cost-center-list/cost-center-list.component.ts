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
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { PageCardComponent } from '../../../../shared/components/page-card/page-card.component';

@Component({
  selector: 'app-cost-center-list',
  standalone: true,
  imports: [
    CommonModule,
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ButtonComponent,
    PageCardComponent,
  ],
  template: `
    <app-page-layout
      title="Centros de Costo"
      icon="fa-building"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <div actions>
        <app-button
          variant="primary"
          icon="fa-plus"
          label="Nuevo Centro de Costo"
          (clicked)="createCostCenter()"
        ></app-button>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-table
          [columns]="columns"
          [data]="filteredCostCenters"
          [loading]="loading"
          [actionsTemplate]="actionsTemplate"
        >
        </aero-table>
      </app-page-card>

      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <app-button
            variant="icon"
            size="sm"
            icon="fa-pen"
            (clicked)="editCostCenter(row)"
          ></app-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
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
      next: (response: unknown) => {
        // Handle paginated response { success, data, pagination } or direct array
        const resp = response as Record<string, unknown>;
        if (resp && typeof resp === 'object' && 'data' in resp) {
          this.costCenters = Array.isArray(resp['data']) ? (resp['data'] as CostCenter[]) : [];
        } else if (Array.isArray(response)) {
          this.costCenters = response as CostCenter[];
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

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
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
