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
          [columns]="columns"
          [data]="filteredReportes"
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
export class ReporteListComponent implements OnInit {
  private readonly service = inject(InspeccionSsomaService);
  private readonly router = inject(Router);

  reportes: ReporteActoCondicionLista[] = [];
  filteredReportes: ReporteActoCondicionLista[] = [];
  loading = false;
  filters = { search: '', tipo_reporte: '', estado: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'SST', url: '/sst' },
    { label: 'Reportes A/C' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por lugar...',
    },
    {
      key: 'tipo_reporte',
      label: 'Tipo Reporte',
      type: 'select',
      options: [
        { label: 'Acto Inseguro', value: 'ACTO INSEGURO' },
        { label: 'Condici\u00f3n Insegura', value: 'CONDICION INSEGURA' },
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
        'CONDICION INSEGURA': { label: 'Condici\u00f3n Insegura', class: 'badge error' },
      },
    },
    {
      key: 'acto_condicion',
      label: 'Acto/Condici\u00f3n',
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
    const tipo = this.filters.tipo_reporte || undefined;
    const estado = this.filters.estado || undefined;
    this.service.getReportes(1, 100, tipo, estado).subscribe({
      next: (res) => {
        this.reportes = res.data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.reportes = [];
        this.filteredReportes = [];
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    const newTipo = (filters['tipo_reporte'] as string) || '';
    const newEstado = (filters['estado'] as string) || '';
    const serverFilterChanged =
      newTipo !== this.filters.tipo_reporte || newEstado !== this.filters.estado;

    this.filters.search = (filters['search'] as string) || '';
    this.filters.tipo_reporte = newTipo;
    this.filters.estado = newEstado;

    if (serverFilterChanged) {
      this.loadReportes();
    } else {
      this.applyFilters();
    }
  }

  applyFilters(): void {
    this.filteredReportes = this.reportes.filter((item) => {
      const matchesSearch =
        !this.filters.search ||
        item.lugar?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        item.acto_condicion?.toLowerCase().includes(this.filters.search.toLowerCase());
      return matchesSearch;
    });
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
