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
import { LOGISTICS_TABS } from '../logistics-tabs';

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
      [tabs]="tabs"
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
          [gridId]="'solicitud-material-list'"
          [columns]="columns"
          [data]="solicitudes"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [serverSide]="true"
          [totalItems]="total"
          [pageSize]="pageSize"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
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

  tabs = LOGISTICS_TABS;
  solicitudes: SolicitudMaterial[] = [];
  loading = false;
  total = 0;
  pageSize = 50;
  page = 1;
  filters = { search: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/dashboard' },
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
    this.solicitudService
      .getSolicitudes({
        page: this.page,
        limit: this.pageSize,
        search: this.filters.search || undefined,
      })
      .subscribe({
        next: (response) => {
          this.solicitudes = response.data;
          this.total = response.pagination.total;
          this.loading = false;
        },
        error: () => {
          this.solicitudes = [];
          this.loading = false;
        },
      });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.page = 1;
    this.loadSolicitudes();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadSolicitudes();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadSolicitudes();
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
