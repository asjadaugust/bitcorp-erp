import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PermissionsService, Permiso } from './permissions.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-permission-list',
  standalone: true,
  imports: [
    CommonModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ActionsContainerComponent,
    PageCardComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Gestión de Permisos"
      icon="fa-shield-halved"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <aero-button variant="secondary" iconLeft="fa-table-cells" (clicked)="navigateToMatrix()"
          >Matriz Rol-Permiso</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [columns]="columns"
          [data]="filteredPermisos"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          (sortChange)="onSort($event)"
        >
        </aero-data-grid>
      </app-page-card>
    </app-page-layout>
  `,
})
export class PermissionListComponent implements OnInit {
  private readonly permissionsService = inject(PermissionsService);
  private readonly router = inject(Router);

  permisos: Permiso[] = [];
  filteredPermisos: Permiso[] = [];
  loading = false;
  filters = { search: '', proceso: '' };

  breadcrumbs: Breadcrumb[] = [{ label: 'Inicio', url: '/app' }, { label: 'Permisos' }];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por módulo, permiso...',
    },
    {
      key: 'proceso',
      label: 'Proceso',
      type: 'select',
      options: [],
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'proceso', label: 'Proceso', type: 'text', sortable: true, filterable: true },
    { key: 'modulo', label: 'Módulo', type: 'text', sortable: true, filterable: true },
    { key: 'permiso', label: 'Permiso', type: 'text', sortable: true, filterable: true },
    {
      key: 'is_active',
      label: 'Estado',
      type: 'badge',
      sortable: true,
      badgeConfig: {
        true: { label: 'Activo', class: 'badge success' },
        false: { label: 'Inactivo', class: 'badge error' },
      },
    },
  ];

  ngOnInit(): void {
    this.loadPermisos();
  }

  loadPermisos(): void {
    this.loading = true;
    this.permissionsService.getPermisos().subscribe({
      next: (permisos) => {
        this.permisos = permisos;
        this.buildProcesoOptions();
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.permisos = [];
        this.filteredPermisos = [];
        this.loading = false;
      },
    });
  }

  private buildProcesoOptions(): void {
    const procesos = [...new Set(this.permisos.map((p) => p.proceso).filter(Boolean))];
    const procesoFilter = this.filterConfig.find((f) => f.key === 'proceso');
    if (procesoFilter) {
      procesoFilter.options = procesos.map((p) => ({ label: p, value: p }));
    }
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.proceso = (filters['proceso'] as string) || '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredPermisos = this.permisos.filter((permiso) => {
      const matchesSearch =
        !this.filters.search ||
        permiso.modulo?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        permiso.permiso?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        permiso.proceso?.toLowerCase().includes(this.filters.search.toLowerCase());

      const matchesProceso = !this.filters.proceso || permiso.proceso === this.filters.proceso;

      return matchesSearch && matchesProceso;
    });
  }

  onSort(_event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }

  navigateToMatrix(): void {
    this.router.navigate(['/permissions/matrix']);
  }
}
