import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import {
  PageLayoutComponent,
  TabItem,
} from '../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { AeroButtonComponent } from '../../core/design-system';
import { ConfirmService } from '../../core/services/confirm.service';
import { PresupuestoService, PresupuestoListItem } from '../../core/services/presupuesto.service';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';

const BUDGET_TABS: TabItem[] = [
  { label: 'Insumos', route: '/presupuestos/insumos', icon: 'fa-boxes-stacked' },
  { label: 'APUs', route: '/presupuestos/apus', icon: 'fa-calculator' },
  { label: 'Presupuestos', route: '/presupuestos', icon: 'fa-file-invoice-dollar' },
];

@Component({
  selector: 'app-presupuesto-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    PageCardComponent,
    AeroButtonComponent,
    FilterBarComponent,
  ],
  template: `
    <app-page-layout
      title="Presupuestos de Obra"
      icon="fa-file-invoice-dollar"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <div actions style="display:flex;gap:8px;align-items:center">
        <aero-button
          data-testid="presupuesto-create-btn"
          variant="primary"
          iconLeft="fa-plus"
          (clicked)="navigateToCreate()"
        >
          Nuevo Presupuesto
        </aero-button>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          data-testid="presupuesto-data-grid"
          [gridId]="'presupuesto-master-list'"
          [columns]="columns"
          [data]="items"
          [loading]="loading"
          [dense]="true"
          [serverSide]="true"
          [totalItems]="total"
          [actionsTemplate]="actionsRef"
          [templates]="{ codigo: codigoRef, total_presupuestado: totalRef }"
          emptyMessage="No hay presupuestos registrados"
          emptyIcon="fa-file-invoice-dollar"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
          (rowClick)="viewDetail($event)"
        ></aero-data-grid>

        <ng-template #codigoRef let-row>
          <span class="code-badge">{{ row.codigo }}</span>
        </ng-template>

        <ng-template #totalRef let-row>
          <span class="price-cell">S/ {{ row.total_presupuestado | number: '1.2-2' }}</span>
        </ng-template>

        <ng-template #actionsRef let-row>
          <div class="action-buttons" (click)="$event.stopPropagation()">
            <aero-button
              data-testid="presupuesto-view-btn"
              variant="ghost"
              size="small"
              iconCenter="fa-eye"
              title="Ver detalle"
              (clicked)="viewDetail(row)"
            ></aero-button>
            <aero-button
              data-testid="presupuesto-delete-btn"
              variant="ghost"
              size="small"
              iconCenter="fa-trash"
              title="Eliminar"
              (clicked)="deleteItem(row)"
            ></aero-button>
          </div>
        </ng-template>
      </app-page-card>
    </app-page-layout>
  `,
  styles: [
    `
      .code-badge {
        font-family: monospace;
        background: var(--grey-100);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        color: var(--grey-700);
        font-weight: 600;
      }
      .price-cell {
        font-family: monospace;
        font-weight: 600;
        color: var(--primary-900);
      }
      .action-buttons {
        display: flex;
        gap: var(--s-4);
        align-items: center;
      }
    `,
  ],
})
export class PresupuestoListComponent implements OnInit {
  private presupuestoService = inject(PresupuestoService);
  private snackBar = inject(MatSnackBar);
  private confirmSvc = inject(ConfirmService);
  private router = inject(Router);

  items: PresupuestoListItem[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  loading = false;
  filters = { search: '' };

  breadcrumbs = [{ label: 'Inicio', url: '/app' }, { label: 'Presupuestos' }];

  tabs = BUDGET_TABS;

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Buscar por código o nombre...' },
  ];

  columns: DataGridColumn[] = [
    { key: 'codigo', label: 'Código', type: 'template', width: '130px', sortable: true },
    { key: 'nombre', label: 'Nombre', type: 'text', sortable: true },
    { key: 'fecha', label: 'Fecha', type: 'date', width: '110px', sortable: true },
    { key: 'version', label: 'Ver.', type: 'number', width: '60px' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      width: '130px',
      badgeConfig: {
        BORRADOR: {
          label: 'Borrador',
          class: 'status-badge status-on-hold',
          icon: 'fa-compass-drafting',
        },
        APROBADO: { label: 'Aprobado', class: 'status-badge status-active', icon: 'fa-check' },
        VIGENTE: {
          label: 'Vigente',
          class: 'status-badge status-completed',
          icon: 'fa-circle-check',
        },
      },
    },
    {
      key: 'total_presupuestado',
      label: 'Total',
      type: 'template',
      width: '150px',
      sortable: true,
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.presupuestoService
      .getAllPaginated({
        page: this.page,
        limit: this.pageSize,
        search: this.filters.search || undefined,
      })
      .subscribe({
        next: (res) => {
          this.items = res.data;
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadData();
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.page = 1;
    this.loadData();
  }

  navigateToCreate(): void {
    this.router.navigate(['/presupuestos/new']);
  }

  viewDetail(row: PresupuestoListItem): void {
    this.router.navigate(['/presupuestos', row.id]);
  }

  deleteItem(row: PresupuestoListItem): void {
    this.confirmSvc.confirmDelete(`el presupuesto "${row.nombre}"`).subscribe((confirmed) => {
      if (confirmed) {
        this.loading = true;
        this.presupuestoService.delete(row.id).subscribe({
          next: () => {
            this.snackBar.open('Presupuesto eliminado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => {
            this.loading = false;
            this.snackBar.open('Error al eliminar presupuesto', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }
}
