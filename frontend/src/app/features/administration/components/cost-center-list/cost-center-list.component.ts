import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdministrationService, CostCenter } from '../../services/administration.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../../core/design-system/data-grid/aero-data-grid.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../../shared/components/page-layout/page-layout.component';
import { ADMINISTRACION_TABS } from '../../administracion-tabs';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../../shared/components/filter-bar/filter-bar.component';
import { PageCardComponent } from '../../../../shared/components/page-card/page-card.component';
import { AeroButtonComponent } from '../../../../core/design-system';

@Component({
  selector: 'app-cost-center-list',
  standalone: true,
  imports: [
    CommonModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    FilterBarComponent,
    AeroButtonComponent,
    PageCardComponent,
  ],
  template: `
    <app-page-layout
      title="Centros de Costo"
      icon="fa-building"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <div actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="createCostCenter()"
          >Nuevo Centro de Costo</aero-button
        >
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [columns]="columns"
          [data]="filteredCostCenters"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [actionsTemplate]="actionsTemplate"
          (sortChange)="onSort($event)"
        >
        </aero-data-grid>
      </app-page-card>

      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-pen"
            (clicked)="editCostCenter(row)"
          ></aero-button>
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

  tabs = ADMINISTRACION_TABS;
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

  columns: DataGridColumn[] = [
    { key: 'codigo', label: 'Código', type: 'text', sortable: true, filterable: true },
    { key: 'nombre', label: 'Nombre', type: 'text', sortable: true, filterable: true },
    { key: 'presupuesto', label: 'Presupuesto', type: 'currency', format: 'PEN', sortable: true },
    // Legacy hidden columns
    { key: 'presupuesto', label: 'Presupuesto', type: 'currency', hidden: true },
    { key: 'gasto_acumulado', label: 'Gasto Acum.', type: 'currency', hidden: true },
    { key: 'saldo_disponible', label: 'Saldo Disp.', type: 'currency', hidden: true },
    { key: 'responsable', label: 'Responsable', hidden: true },
    { key: 'proyecto_asociado', label: 'Proyecto', hidden: true },
    { key: 'observaciones', label: 'Observaciones', hidden: true },
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

  onSort(event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }

  createCostCenter(): void {
    this.router.navigate(['/administracion/cost-centers/new']);
  }

  editCostCenter(costCenter: CostCenter): void {
    this.router.navigate(['/administracion/cost-centers', costCenter.id, 'edit']);
  }
}
