import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InspeccionSsomaService, InspeccionSsomaLista } from './inspeccion-ssoma.service';
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
  selector: 'app-inspeccion-list',
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
      title="Inspecciones SSOMA"
      icon="fa-magnifying-glass"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToNew()">
          Nueva Inspección
        </aero-button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [columns]="columns"
          [data]="filteredInspecciones"
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
export class InspeccionListComponent implements OnInit {
  private readonly service = inject(InspeccionSsomaService);
  private readonly router = inject(Router);

  inspecciones: InspeccionSsomaLista[] = [];
  filteredInspecciones: InspeccionSsomaLista[] = [];
  loading = false;
  filters = { search: '', tipo_inspeccion: '', nivel_riesgo: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'SST', url: '/sst' },
    { label: 'Inspecciones' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por lugar...',
    },
    {
      key: 'tipo_inspeccion',
      label: 'Tipo',
      type: 'select',
      options: [
        { label: 'Planificado', value: 'Planificado' },
        { label: 'No Planificado', value: 'No Planificado' },
      ],
    },
    {
      key: 'nivel_riesgo',
      label: 'Nivel Riesgo',
      type: 'select',
      options: [
        { label: 'Alto', value: 'ALTO' },
        { label: 'Medio', value: 'MEDIO' },
        { label: 'Bajo', value: 'BAJO' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    {
      key: 'fecha_hallazgo',
      label: 'Fecha',
      type: 'date',
      sortable: true,
    },
    {
      key: 'lugar_hallazgo',
      label: 'Lugar',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      key: 'tipo_inspeccion',
      label: 'Tipo',
      type: 'text',
      sortable: true,
    },
    {
      key: 'nivel_riesgo',
      label: 'Nivel Riesgo',
      type: 'badge',
      sortable: true,
      badgeConfig: {
        ALTO: { label: 'Alto', class: 'badge error' },
        MEDIO: { label: 'Medio', class: 'badge warning' },
        BAJO: { label: 'Bajo', class: 'badge success' },
      },
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      sortable: true,
      badgeConfig: {
        ABIERTO: { label: 'Abierto', class: 'badge warning' },
        'EN PROCESO': { label: 'En Proceso', class: 'badge info' },
        CERRADO: { label: 'Cerrado', class: 'badge success' },
      },
    },
    {
      key: 'inspector',
      label: 'Inspector',
      type: 'text',
    },
  ];

  ngOnInit(): void {
    this.loadInspecciones();
  }

  loadInspecciones(): void {
    this.loading = true;
    const tipo = this.filters.tipo_inspeccion || undefined;
    const riesgo = this.filters.nivel_riesgo || undefined;
    this.service.getInspecciones(1, 100, tipo, riesgo).subscribe({
      next: (res) => {
        this.inspecciones = res.data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.inspecciones = [];
        this.filteredInspecciones = [];
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    const newTipo = (filters['tipo_inspeccion'] as string) || '';
    const newRiesgo = (filters['nivel_riesgo'] as string) || '';
    const serverFilterChanged =
      newTipo !== this.filters.tipo_inspeccion || newRiesgo !== this.filters.nivel_riesgo;

    this.filters.search = (filters['search'] as string) || '';
    this.filters.tipo_inspeccion = newTipo;
    this.filters.nivel_riesgo = newRiesgo;

    if (serverFilterChanged) {
      this.loadInspecciones();
    } else {
      this.applyFilters();
    }
  }

  applyFilters(): void {
    this.filteredInspecciones = this.inspecciones.filter((item) => {
      const matchesSearch =
        !this.filters.search ||
        item.lugar_hallazgo?.toLowerCase().includes(this.filters.search.toLowerCase());
      return matchesSearch;
    });
  }

  onRowClick(row: InspeccionSsomaLista): void {
    this.router.navigate(['/sst/inspecciones', row.id]);
  }

  onSort(_event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }

  navigateToNew(): void {
    this.router.navigate(['/sst/inspecciones/new']);
  }
}
