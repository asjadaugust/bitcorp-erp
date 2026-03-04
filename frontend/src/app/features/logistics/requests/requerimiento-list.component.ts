import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SolicitudMaterialService, Requerimiento } from './solicitud-material.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../core/design-system/data-grid/aero-data-grid.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../shared/components/filter-bar/filter-bar.component';
import { ActionsContainerComponent } from '../../../shared/components/actions-container/actions-container.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import { AeroButtonComponent } from '../../../core/design-system';

@Component({
  selector: 'app-requerimiento-list',
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
      title="Requerimientos"
      icon="fa-clipboard-list"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToNew()">
          Nuevo Requerimiento
        </aero-button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [columns]="columns"
          [data]="filteredRequerimientos"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          (rowClick)="onRowClick($event)"
          (sortChange)="onSort($event)"
        >
        </aero-data-grid>
      </app-page-card>
    </app-page-layout>
  `,
})
export class RequerimientoListComponent implements OnInit {
  private readonly solicitudService = inject(SolicitudMaterialService);
  private readonly router = inject(Router);

  requerimientos: Requerimiento[] = [];
  filteredRequerimientos: Requerimiento[] = [];
  loading = false;
  filters = { search: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Logistica', url: '/logistics' },
    { label: 'Requerimientos' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por motivo, solicitante...',
    },
  ];

  columns: DataGridColumn[] = [
    {
      key: 'numero_requerimiento',
      label: 'N\u00b0 Requerimiento',
      type: 'number',
      sortable: true,
    },
    {
      key: 'motivo',
      label: 'Motivo',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      key: 'fecha_requerimiento',
      label: 'Fecha Requerimiento',
      type: 'date',
      sortable: true,
    },
    {
      key: 'solicitado_por',
      label: 'Solicitado Por',
      type: 'text',
      sortable: true,
      filterable: true,
    },
  ];

  ngOnInit(): void {
    this.loadRequerimientos();
  }

  loadRequerimientos(): void {
    this.loading = true;
    this.solicitudService.getRequerimientos({ page: 1, limit: 100 }).subscribe({
      next: (requerimientos) => {
        this.requerimientos = requerimientos;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.requerimientos = [];
        this.filteredRequerimientos = [];
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredRequerimientos = this.requerimientos.filter((req) => {
      const matchesSearch =
        !this.filters.search ||
        req.motivo?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        req.solicitado_por?.toLowerCase().includes(this.filters.search.toLowerCase());

      return matchesSearch;
    });
  }

  onRowClick(row: Requerimiento): void {
    this.router.navigate(['/logistics/requirements', row.id]);
  }

  onSort(_event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }

  navigateToNew(): void {
    this.router.navigate(['/logistics/requirements/new']);
  }
}
