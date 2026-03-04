import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SolicitudMaterialService, SolicitudMaterial } from './solicitud-material.service';
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
  selector: 'app-solicitud-list',
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
      title="Solicitudes de Material"
      icon="fa-file-lines"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToNew()">
          Nueva Solicitud
        </aero-button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [columns]="columns"
          [data]="filteredSolicitudes"
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
export class SolicitudListComponent implements OnInit {
  private readonly solicitudService = inject(SolicitudMaterialService);
  private readonly router = inject(Router);

  solicitudes: SolicitudMaterial[] = [];
  filteredSolicitudes: SolicitudMaterial[] = [];
  loading = false;
  filters = { search: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Logistica', url: '/logistics' },
    { label: 'Solicitudes de Material' },
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
      key: 'motivo',
      label: 'Motivo',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      key: 'fecha_solicitud',
      label: 'Fecha Solicitud',
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
    this.loadSolicitudes();
  }

  loadSolicitudes(): void {
    this.loading = true;
    this.solicitudService.getSolicitudes({ page: 1, limit: 100 }).subscribe({
      next: (solicitudes) => {
        this.solicitudes = solicitudes;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.solicitudes = [];
        this.filteredSolicitudes = [];
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredSolicitudes = this.solicitudes.filter((sol) => {
      const matchesSearch =
        !this.filters.search ||
        sol.motivo?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        sol.solicitado_por?.toLowerCase().includes(this.filters.search.toLowerCase());

      return matchesSearch;
    });
  }

  onRowClick(row: SolicitudMaterial): void {
    this.router.navigate(['/logistics/material-requests', row.id]);
  }

  onSort(_event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }

  navigateToNew(): void {
    this.router.navigate(['/logistics/material-requests/new']);
  }
}
