import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EvaluacionService, EvaluacionProveedorLista } from './evaluacion.service';
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
  selector: 'app-evaluacion-list',
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
      title="Evaluaciones de Proveedores"
      icon="fa-clipboard-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToNew()">
          Nueva Evaluación
        </aero-button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'evaluacion-proveedor-list'"
          [columns]="columns"
          [data]="filteredEvaluaciones"
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
export class EvaluacionListComponent implements OnInit {
  private readonly evaluacionService = inject(EvaluacionService);
  private readonly router = inject(Router);

  evaluaciones: EvaluacionProveedorLista[] = [];
  filteredEvaluaciones: EvaluacionProveedorLista[] = [];
  loading = false;
  filters = { search: '', resultado: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Proveedores', url: '/providers' },
    { label: 'Evaluaciones' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por RUC o raz\u00f3n social...',
    },
    {
      key: 'resultado',
      label: 'Resultado',
      type: 'select',
      options: [
        { label: 'P\u00e9simo', value: 'Pesimo' },
        { label: 'Regular', value: 'Regular' },
        { label: 'Bueno', value: 'Bueno' },
        { label: 'Muy Bueno', value: 'Muy Bueno' },
        { label: 'Excelente', value: 'Excelente' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'ruc', label: 'RUC', type: 'text', sortable: true, filterable: true },
    {
      key: 'razon_social',
      label: 'Raz\u00f3n Social',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      key: 'puntaje',
      label: 'Puntaje',
      type: 'number',
      sortable: true,
      align: 'right',
    },
    {
      key: 'resultado',
      label: 'Resultado',
      type: 'badge',
      sortable: true,
      badgeConfig: {
        Pesimo: { label: 'P\u00e9simo', class: 'badge error' },
        Regular: { label: 'Regular', class: 'badge warning' },
        Bueno: { label: 'Bueno', class: 'badge info' },
        'Muy Bueno': { label: 'Muy Bueno', class: 'badge success' },
        Excelente: { label: 'Excelente', class: 'badge success' },
      },
    },
    { key: 'fecha_evaluacion', label: 'Fecha Evaluaci\u00f3n', type: 'date', sortable: true },
  ];

  ngOnInit(): void {
    this.loadEvaluaciones();
  }

  loadEvaluaciones(): void {
    this.loading = true;
    const resultado = this.filters.resultado || undefined;
    this.evaluacionService.getEvaluaciones(1, 100, resultado).subscribe({
      next: (res) => {
        this.evaluaciones = res.data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.evaluaciones = [];
        this.filteredEvaluaciones = [];
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    const newResultado = (filters['resultado'] as string) || '';
    const resultadoChanged = newResultado !== this.filters.resultado;
    this.filters.search = (filters['search'] as string) || '';
    this.filters.resultado = newResultado;

    if (resultadoChanged) {
      this.loadEvaluaciones();
    } else {
      this.applyFilters();
    }
  }

  applyFilters(): void {
    this.filteredEvaluaciones = this.evaluaciones.filter((ev) => {
      const matchesSearch =
        !this.filters.search ||
        ev.ruc?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        ev.razon_social?.toLowerCase().includes(this.filters.search.toLowerCase());

      return matchesSearch;
    });
  }

  onRowClick(row: EvaluacionProveedorLista): void {
    this.router.navigate(['/providers/evaluaciones', row.id]);
  }

  onSort(_event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }

  navigateToNew(): void {
    this.router.navigate(['/providers/evaluaciones/new']);
  }
}
