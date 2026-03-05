import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WorkerRegistryService, RegistroTrabajadorLista } from './worker-registry.service';
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
import { HR_TABS } from '../hr-tabs';

@Component({
  selector: 'app-registro-list',
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
      title="Registro de Trabajadores"
      icon="fa-id-card"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToNew()">
          Nuevo Registro
        </aero-button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'registro-trabajador-list'"
          [columns]="columns"
          [data]="registros"
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
export class RegistroListComponent implements OnInit {
  private readonly service = inject(WorkerRegistryService);
  private readonly router = inject(Router);

  tabs = HR_TABS;
  registros: RegistroTrabajadorLista[] = [];
  loading = false;
  total = 0;
  pageSize = 50;
  page = 1;
  filters = { search: '', estatus: '', sub_grupo: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'RRHH', url: '/rrhh' },
    { label: 'Registro Trabajadores' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por DNI...',
    },
    {
      key: 'estatus',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Activo', value: 'ACTIVO' },
        { label: 'Cesado', value: 'CESADO' },
        { label: 'Suspendido', value: 'SUSPENDIDO' },
      ],
    },
    {
      key: 'sub_grupo',
      label: 'Sub Grupo',
      type: 'select',
      options: [
        { label: 'Obrero', value: 'OBRERO' },
        { label: 'Empleado', value: 'EMPLEADO' },
        { label: 'Practicante', value: 'PRACTICANTE' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    {
      key: 'trabajador_dni',
      label: 'DNI',
      type: 'text',
      sortable: true,
    },
    {
      key: 'proveedor_ruc',
      label: 'RUC Proveedor',
      type: 'text',
    },
    {
      key: 'fecha_ingreso',
      label: 'Ingreso',
      type: 'date',
      sortable: true,
    },
    {
      key: 'fecha_cese',
      label: 'Cese',
      type: 'date',
    },
    {
      key: 'estatus',
      label: 'Estado',
      type: 'badge',
      sortable: true,
      badgeConfig: {
        ACTIVO: { label: 'Activo', class: 'badge success' },
        CESADO: { label: 'Cesado', class: 'badge error' },
        SUSPENDIDO: { label: 'Suspendido', class: 'badge warning' },
      },
    },
    {
      key: 'sub_grupo',
      label: 'Sub Grupo',
      type: 'text',
    },
  ];

  ngOnInit(): void {
    this.loadRegistros();
  }

  loadRegistros(): void {
    this.loading = true;
    this.service
      .getRegistros(
        this.page,
        this.pageSize,
        this.filters.estatus || undefined,
        this.filters.sub_grupo || undefined,
        this.filters.search || undefined
      )
      .subscribe({
        next: (res) => {
          this.registros = res.data;
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: () => {
          this.registros = [];
          this.loading = false;
        },
      });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.estatus = (filters['estatus'] as string) || '';
    this.filters.sub_grupo = (filters['sub_grupo'] as string) || '';
    this.page = 1;
    this.loadRegistros();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadRegistros();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadRegistros();
  }

  onRowClick(row: RegistroTrabajadorLista): void {
    this.router.navigate(['/rrhh/worker-registry', row.id]);
  }

  onSort(_event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }

  navigateToNew(): void {
    this.router.navigate(['/rrhh/worker-registry/new']);
  }
}
