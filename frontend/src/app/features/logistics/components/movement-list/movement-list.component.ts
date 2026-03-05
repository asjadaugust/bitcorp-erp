import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InventoryService, Movement } from '../../services/inventory.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../../core/design-system/data-grid/aero-data-grid.component';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { LOGISTICS_TABS } from '../../logistics-tabs';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../../shared/components/filter-bar/filter-bar.component';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../../../shared/components/export-dropdown/export-dropdown.component';
import { ExcelExportService } from '../../../../core/services/excel-export.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { ActionsContainerComponent } from '../../../../shared/components/actions-container/actions-container.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../../../shared/components/stats-grid/stats-grid.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AeroButtonComponent } from '../../../../core/design-system';

@Component({
  selector: 'app-movement-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
    StatsGridComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Movimientos de Inventario"
      icon="fa-right-left"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <aero-button
          variant="primary"
          iconLeft="fa-arrow-right-to-bracket"
          (clicked)="registerMovement('entrada')"
          >Registrar Ingreso</aero-button
        >
        <aero-button
          variant="danger"
          iconLeft="fa-arrow-right-from-bracket"
          (clicked)="registerMovement('salida')"
          >Registrar Salida</aero-button
        >
        <app-export-dropdown
          (export)="handleExport($event)"
          [disabled]="loading || movements.length === 0"
        >
        </app-export-dropdown>
      </app-actions-container>

      <app-stats-grid [items]="statItems" testId="movement-stats"></app-stats-grid>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-data-grid
        [gridId]="'movement-list'"
        [columns]="columns"
        [data]="movements"
        [loading]="loading"
        [dense]="true"
        [showColumnChooser]="true"
        [serverSide]="true"
        [totalItems]="total"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          type: typeTemplate,
          document: documentTemplate,
          entity: entityTemplate,
          items: itemsTemplate,
        }"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)"
        (sortChange)="onSort($event)"
      >
      </aero-data-grid>

      <!-- Custom Templates -->
      <ng-template #dateTemplate let-row>
        <strong class="equipment-code">{{ row.fecha | date: 'dd/MM/yyyy' }}</strong>
      </ng-template>

      <ng-template #typeTemplate let-row>
        <span
          [class]="
            row.tipo_movimiento === 'entrada' ? 'badge badge-status-in' : 'badge badge-status-out'
          "
          [class.badge-primary]="row.tipo_movimiento === 'transferencia'"
        >
          {{ row.tipo_movimiento | uppercase }}
        </span>
      </ng-template>

      <ng-template #documentTemplate let-row>
        {{ row.numero_documento || 'N/A' }}
      </ng-template>

      <ng-template #entityTemplate let-row>
        {{ row.proyecto_nombre || '-' }}
      </ng-template>

      <ng-template #itemsTemplate let-row>
        <span class="badge badge-items">{{ row.items_count || 0 }} items</span>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-eye"
            title="Ver Detalles"
            (clicked)="viewDetails(row)"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      /* Utilities */
      .equipment-code {
        color: var(--primary-500);
        font-weight: 600;
      }
      .font-semibold {
        font-weight: 600;
      }
      .badge {
        padding: var(--s-4) var(--s-8);
        border-radius: var(--s-4);
        font-size: var(--type-label-size);
        font-weight: 500;
      }
      .badge-items {
        background: var(--grey-200);
        color: var(--grey-900);
      }
      .badge-status-in {
        background: var(--semantic-blue-100);
        color: var(--semantic-success);
      }
      .badge-status-out {
        background: var(--grey-100);
        color: var(--semantic-error);
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ],
})
export class MovementListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);

  tabs = LOGISTICS_TABS;
  movements: Movement[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  loading = false;
  statItems: StatItem[] = [];

  filters = {
    search: '',
    type: '',
    startDate: '',
  };

  stats = {
    total: 0,
    inCount: 0,
    outCount: 0,
  };

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Logística', url: '/logistics' },
    { label: 'Movimientos' },
  ];

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Documento, observaciones...' },
    {
      key: 'type',
      label: 'Tipo de Movimiento',
      type: 'select',
      options: [
        { label: 'Ingreso', value: 'entrada' },
        { label: 'Salida', value: 'salida' },
        { label: 'Transferencia', value: 'transferencia' },
        { label: 'Ajuste', value: 'ajuste' },
      ],
    },
    { key: 'startDate', label: 'Fecha', type: 'date' },
  ];

  columns: DataGridColumn[] = [
    { key: 'fecha', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy', sortable: true },
    { key: 'type', label: 'Tipo', type: 'template', sortable: true, filterable: true },
    { key: 'document', label: 'Documento', type: 'template' },
    { key: 'entity', label: 'Proyecto/Origen', type: 'template', filterable: true },
    { key: 'items', label: 'Items', type: 'template', sortable: true },
    { key: 'observaciones', label: 'Observaciones', type: 'text' },
    { key: 'numero_documento', label: 'N. Documento', hidden: true },
    { key: 'tipo_documento', label: 'Tipo Doc.', hidden: true },
    { key: 'almacen_origen', label: 'Almacen Origen', hidden: true },
    { key: 'almacen_destino', label: 'Almacen Destino', hidden: true },
    { key: 'solicitante', label: 'Solicitante', hidden: true },
    { key: 'centro_costo', label: 'Centro Costo', hidden: true },
    { key: 'proyecto', label: 'Proyecto', hidden: true },
    { key: 'observaciones_extra', label: 'Observaciones Extra', hidden: true },
    { key: 'fecha_registro', label: 'Fecha Registro', type: 'date', hidden: true },
    { key: 'usuario_registro', label: 'Registrado por', hidden: true },
  ];

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading = true;
    this.inventoryService
      .getMovementsPaginated({
        page: this.page,
        limit: this.pageSize,
        tipo: this.filters.type || undefined,
      })
      .subscribe({
        next: (res) => {
          this.movements = res.data;
          this.total = res.pagination.total;
          this.updateStats();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading movements', error);
          this.loading = false;
        },
      });
  }

  updateStats(): void {
    const inCount = this.movements.filter((m) => m.tipo_movimiento === 'entrada').length;
    const outCount = this.movements.filter((m) => m.tipo_movimiento === 'salida').length;

    this.statItems = [
      {
        label: 'Total Movimientos',
        value: this.total,
        icon: 'fa-right-left',
        color: 'primary',
        testId: 'total-movements',
      },
      {
        label: 'Ingresos (Mes)',
        value: inCount,
        icon: 'fa-arrow-down-to-bracket',
        color: 'success',
        testId: 'in-movements',
      },
      {
        label: 'Salidas (Mes)',
        value: outCount,
        icon: 'fa-arrow-up-from-bracket',
        color: 'danger',
        testId: 'out-movements',
      },
    ];
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadMovements();
  }
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadMovements();
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.type = (filters['type'] as string) || '';
    this.filters.startDate = (filters['startDate'] as string) || '';
    this.page = 1;
    this.loadMovements();
  }

  onSort(event: { column: string; direction: string | null }): void {
    // Sort handled server-side
  }

  registerMovement(type: 'entrada' | 'salida'): void {
    this.router.navigate(['/logistics/movements/new'], { queryParams: { type } });
  }

  viewDetails(movement: Movement): void {
    this.router.navigate(['/logistics/movements', movement.id]);
  }

  handleExport(format: ExportFormat): void {
    if (this.movements.length === 0) {
      this.snackBar.open('No hay movimientos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.movements.map((movement) => ({
      ID: movement.id || '',
      Fecha: movement.fecha ? new Date(movement.fecha).toLocaleDateString('es-PE') : '',
      Tipo: movement.tipo_movimiento.toUpperCase(),
      'Número Documento': movement.numero_documento || '',
      Observaciones: movement.observaciones || '',
      Proyecto: movement.proyecto_nombre || '',
      'Creado Por': movement.creado_por_nombre || '',
      'Total Items': movement.items_count || 0,
      'Monto Total': movement.monto_total || 0,
    }));

    if (format === 'excel') {
      this.excelService.exportToExcel(exportData, {
        filename: 'movimientos_inventario',
        sheetName: 'Movimientos',
        includeTimestamp: true,
      });
    } else {
      this.csvService.exportToCsv(exportData, {
        filename: 'movimientos_inventario',
        includeTimestamp: true,
      });
    }
  }

  private excelService = inject(ExcelExportService);
  private csvService = inject(CsvExportService);
  private snackBar = inject(MatSnackBar);
}
