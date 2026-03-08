import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PettyCashService, CajaChica } from './petty-cash.service';
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
import { ADMINISTRACION_TABS } from '../administracion-tabs';

@Component({
  selector: 'app-petty-cash-list',
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
      title="Caja Chica"
      icon="fa-cash-register"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToNew()">
          Nueva Caja
        </aero-button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'petty-cash-list'"
          [columns]="columns"
          [data]="filteredCajas"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [serverSide]="true"
          [totalItems]="filteredCajas.length"
          (rowClick)="onRowClick($event)"
          (sortChange)="onSort($event)"
        >
        </aero-data-grid>
      </app-page-card>
    </app-page-layout>
  `,
})
export class PettyCashListComponent implements OnInit {
  private readonly pettyCashService = inject(PettyCashService);
  private readonly router = inject(Router);

  tabs = ADMINISTRACION_TABS;
  cajas: CajaChica[] = [];
  filteredCajas: CajaChica[] = [];
  loading = false;
  filters = { search: '', estatus: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/dashboard' },
    { label: 'Administraci\u00f3n', url: '/administracion' },
    { label: 'Caja Chica' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por n\u00famero de caja...',
    },
    {
      key: 'estatus',
      label: 'Estatus',
      type: 'select',
      options: [
        { label: 'Abierta', value: 'ABIERTA' },
        { label: 'Cerrada', value: 'CERRADA' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'numero_caja', label: 'N\u00b0 Caja', type: 'text', sortable: true, filterable: true },
    {
      key: 'saldo_inicial',
      label: 'Saldo Inicial',
      type: 'number',
      sortable: true,
      align: 'right',
    },
    {
      key: 'ingreso_total',
      label: 'Ingreso Total',
      type: 'number',
      sortable: true,
      align: 'right',
    },
    {
      key: 'salida_total',
      label: 'Salida Total',
      type: 'number',
      sortable: true,
      align: 'right',
    },
    {
      key: 'saldo_final',
      label: 'Saldo Final',
      type: 'number',
      sortable: true,
      align: 'right',
    },
    {
      key: 'estatus',
      label: 'Estatus',
      type: 'badge',
      sortable: true,
      badgeConfig: {
        ABIERTA: { label: 'Abierta', class: 'badge success' },
        CERRADA: { label: 'Cerrada', class: 'badge info' },
      },
    },
  ];

  ngOnInit(): void {
    this.loadCajas();
  }

  loadCajas(): void {
    this.loading = true;
    this.pettyCashService.getCajas().subscribe({
      next: (cajas) => {
        this.cajas = cajas;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.cajas = [];
        this.filteredCajas = [];
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.estatus = (filters['estatus'] as string) || '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredCajas = this.cajas.filter((caja) => {
      const matchesSearch =
        !this.filters.search ||
        caja.numero_caja?.toLowerCase().includes(this.filters.search.toLowerCase());

      const matchesEstatus = !this.filters.estatus || caja.estatus === this.filters.estatus;

      return matchesSearch && matchesEstatus;
    });
  }

  onRowClick(row: CajaChica): void {
    this.router.navigate(['/administracion/petty-cash', row.id]);
  }

  onSort(_event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }

  navigateToNew(): void {
    this.router.navigate(['/administracion/petty-cash/new']);
  }
}
