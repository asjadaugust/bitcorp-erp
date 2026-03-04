import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BankCashService, FlujoCajaBanco } from './bank-cash.service';
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
  selector: 'app-bank-cash-list',
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
      title="Caja y Banco"
      icon="fa-building-columns"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <aero-button variant="secondary" iconLeft="fa-wallet" (clicked)="navigateToCuentas()">
          Cuentas Bancarias
        </aero-button>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToNew()">
          Nuevo Movimiento
        </aero-button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [columns]="columns"
          [data]="filteredFlujos"
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
export class BankCashListComponent implements OnInit {
  private readonly bankCashService = inject(BankCashService);
  private readonly router = inject(Router);

  flujos: FlujoCajaBanco[] = [];
  filteredFlujos: FlujoCajaBanco[] = [];
  loading = false;
  filters = { search: '', tipo_movimiento: '', moneda: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Administraci\u00f3n', url: '/administracion' },
    { label: 'Caja y Banco' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por concepto o cuenta...',
    },
    {
      key: 'tipo_movimiento',
      label: 'Tipo',
      type: 'select',
      options: [
        { label: 'Salida', value: 'SALIDA' },
        { label: 'Ingreso', value: 'INGRESO' },
      ],
    },
    {
      key: 'moneda',
      label: 'Moneda',
      type: 'select',
      options: [
        { label: 'Soles', value: 'SOLES' },
        { label: 'D\u00f3lares', value: 'DOLARES' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    {
      key: 'tipo_movimiento',
      label: 'Tipo',
      type: 'badge',
      sortable: true,
      badgeConfig: {
        SALIDA: { label: 'Salida', class: 'badge error' },
        INGRESO: { label: 'Ingreso', class: 'badge success' },
      },
    },
    {
      key: 'fecha_movimiento',
      label: 'Fecha',
      type: 'date',
      sortable: true,
    },
    {
      key: 'cuenta_origen',
      label: 'Cuenta Origen',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      key: 'concepto',
      label: 'Concepto',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      key: 'moneda',
      label: 'Moneda',
      type: 'text',
      sortable: true,
    },
    {
      key: 'total',
      label: 'Total',
      type: 'number',
      sortable: true,
      align: 'right',
    },
    {
      key: 'voucher',
      label: 'Voucher',
      type: 'text',
      sortable: true,
    },
  ];

  ngOnInit(): void {
    this.loadFlujos();
  }

  loadFlujos(): void {
    this.loading = true;
    this.bankCashService
      .getFlujos({
        page: 1,
        limit: 100,
        tipo_movimiento: this.filters.tipo_movimiento || undefined,
        moneda: this.filters.moneda || undefined,
      })
      .subscribe({
        next: (flujos: FlujoCajaBanco[]) => {
          this.flujos = flujos;
          this.filteredFlujos = flujos;
          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.flujos = [];
          this.filteredFlujos = [];
          this.loading = false;
        },
      });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    const prevTipo = this.filters.tipo_movimiento;
    const prevMoneda = this.filters.moneda;

    this.filters.search = (filters['search'] as string) || '';
    this.filters.tipo_movimiento = (filters['tipo_movimiento'] as string) || '';
    this.filters.moneda = (filters['moneda'] as string) || '';

    // Re-fetch from server if tipo_movimiento or moneda changed
    if (prevTipo !== this.filters.tipo_movimiento || prevMoneda !== this.filters.moneda) {
      this.loadFlujos();
    } else {
      this.applyFilters();
    }
  }

  applyFilters(): void {
    this.filteredFlujos = this.flujos.filter((flujo) => {
      const matchesSearch =
        !this.filters.search ||
        flujo.concepto?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        flujo.cuenta_origen?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        flujo.voucher?.toLowerCase().includes(this.filters.search.toLowerCase());

      return matchesSearch;
    });
  }

  onRowClick(row: FlujoCajaBanco): void {
    this.router.navigate(['/administracion/bank-cash', row.id]);
  }

  onSort(_event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }

  navigateToNew(): void {
    this.router.navigate(['/administracion/bank-cash/new']);
  }

  navigateToCuentas(): void {
    this.router.navigate(['/administracion/bank-cash/cuentas']);
  }
}
