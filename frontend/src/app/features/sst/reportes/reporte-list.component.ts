import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  InspeccionSsomaService,
  ReporteActoCondicionLista,
} from '../inspecciones/inspeccion-ssoma.service';
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
import { SST_TABS } from '../sst-tabs';

@Component({
  selector: 'app-reporte-list',
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
      title="Reportes Acto/Condición"
      icon="fa-file-lines"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToNew()">
          Nuevo Reporte
        </aero-button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'reporte-sst-list'"
          [columns]="columns"
          [data]="reportes"
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
export class ReporteListComponent implements OnInit {
  private readonly service = inject(InspeccionSsomaService);
  private readonly router = inject(Router);

  tabs = SST_TABS;
  reportes: ReporteActoCondicionLista[] = [];
  loading = false;
  total = 0;
  pageSize = 50;
  page = 1;
  filters = { tipo_reporte: '', estado: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/dashboard' },
    { label: 'SST', url: '/sst' },
    { label: 'Reportes A/C' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'tipo_reporte',
      label: 'Tipo Reporte',
      type: 'select',
      options: [
        { label: 'Acto Inseguro', value: 'ACTO INSEGURO' },
        { label: 'Condición Insegura', value: 'CONDICION INSEGURA' },
      ],
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Abierto', value: 'ABIERTO' },
        { label: 'Cerrado', value: 'CERRADO' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    {
      key: 'fecha_evento',
      label: 'Fecha Evento',
      type: 'date',
      sortable: true,
    },
    {
      key: 'lugar',
      label: 'Lugar',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      key: 'tipo_reporte',
      label: 'Tipo Reporte',
      type: 'badge',
      sortable: true,
      badgeConfig: {
        'ACTO INSEGURO': { label: 'Acto Inseguro', class: 'badge warning' },
        'CONDICION INSEGURA': { label: 'Condición Insegura', class: 'badge error' },
      },
    },
    {
      key: 'acto_condicion',
      label: 'Acto/Condición',
      type: 'text',
      sortable: true,
    },
    {
      key: 'reportado_por_nombre',
      label: 'Reportado Por',
      type: 'text',
      sortable: true,
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      sortable: true,
      badgeConfig: {
        ABIERTO: { label: 'Abierto', class: 'badge warning' },
        CERRADO: { label: 'Cerrado', class: 'badge success' },
      },
    },
  ];

  ngOnInit(): void {
    this.loadReportes();
  }

  loadReportes(): void {
    this.loading = true;
    this.service
      .getReportes({
        page: this.page,
        limit: this.pageSize,
        tipo_reporte: this.filters.tipo_reporte || undefined,
        estado: this.filters.estado || undefined,
      })
      .subscribe({
        next: (res) => {
          this.reportes = res.data;
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: () => {
          this.reportes = [];
          this.loading = false;
        },
      });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.tipo_reporte = (filters['tipo_reporte'] as string) || '';
    this.filters.estado = (filters['estado'] as string) || '';
    this.page = 1;
    this.loadReportes();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadReportes();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadReportes();
  }

  onRowClick(row: ReporteActoCondicionLista): void {
    this.router.navigate(['/sst/reportes-acto', row.id]);
  }

  onSort(_event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }

  navigateToNew(): void {
    this.router.navigate(['/sst/reportes-acto/new']);
  }
}
