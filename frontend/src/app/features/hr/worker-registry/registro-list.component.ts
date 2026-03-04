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
          [columns]="columns"
          [data]="registros"
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
export class RegistroListComponent implements OnInit {
  private readonly service = inject(WorkerRegistryService);
  private readonly router = inject(Router);

  registros: RegistroTrabajadorLista[] = [];
  loading = false;
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
    const estatus = this.filters.estatus || undefined;
    const sub_grupo = this.filters.sub_grupo || undefined;
    const search = this.filters.search || undefined;
    this.service.getRegistros(1, 100, estatus, sub_grupo, search).subscribe({
      next: (res) => {
        this.registros = res.data;
        this.loading = false;
      },
      error: () => {
        this.registros = [];
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    const newEstatus = (filters['estatus'] as string) || '';
    const newSubGrupo = (filters['sub_grupo'] as string) || '';
    const newSearch = (filters['search'] as string) || '';

    const serverFilterChanged =
      newEstatus !== this.filters.estatus ||
      newSubGrupo !== this.filters.sub_grupo ||
      newSearch !== this.filters.search;

    this.filters.estatus = newEstatus;
    this.filters.sub_grupo = newSubGrupo;
    this.filters.search = newSearch;

    if (serverFilterChanged) {
      this.loadRegistros();
    }
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
