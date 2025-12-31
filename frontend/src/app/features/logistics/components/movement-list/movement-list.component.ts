import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InventoryService, Movement } from '../../services/inventory.service';
import { AeroTableComponent, TableColumn } from '../../../../core/design-system/table/aero-table.component';
import { PageLayoutComponent, TabItem } from '../../../../shared/components/page-layout/page-layout.component';
import { FilterBarComponent, FilterConfig } from '../../../../shared/components/filter-bar/filter-bar.component';
import { ExportDropdownComponent, ExportFormat } from '../../../../shared/components/export-dropdown/export-dropdown.component';
import { ExcelExportService } from '../../../../core/services/excel-export.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { ActionsContainerComponent } from '../../../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-movement-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent
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
        <button class="btn btn-primary" (click)="registerMovement('IN')">
          <i class="fa-solid fa-arrow-right-to-bracket"></i> Registrar Ingreso
        </button>
        <button class="btn btn-danger" (click)="registerMovement('OUT')">
          <i class="fa-solid fa-arrow-right-from-bracket"></i> Registrar Salida
        </button>
        <app-export-dropdown 
          (export)="handleExport($event)"
          [disabled]="loading || movements.length === 0">
        </app-export-dropdown>
      </app-actions-container>

      <!-- Statistics Bar -->
      <div class="stats-bar">
        <div class="stat-card">
          <span class="stat-label">Total Movimientos</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
        <div class="stat-card stat-in">
          <span class="stat-label">Ingresos (Mes)</span>
          <span class="stat-value">{{ stats.inCount }}</span>
        </div>
        <div class="stat-card stat-out">
          <span class="stat-label">Salidas (Mes)</span>
          <span class="stat-value">{{ stats.outCount }}</span>
        </div>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="filteredMovements"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          'date': dateTemplate,
          'type': typeTemplate,
          'document': documentTemplate,
          'entity': entityTemplate,
          'items': itemsTemplate
        }"
      >
      </aero-table>

      <!-- Custom Templates -->
      <ng-template #dateTemplate let-row>
        <strong class="equipment-code">{{ row.fecha | date: 'dd/MM/yyyy HH:mm' }}</strong>
      </ng-template>

      <ng-template #typeTemplate let-row>
        <span
          [class]="
            row.tipo_movimiento === 'IN'
              ? 'badge badge-status-in'
              : 'badge badge-status-out'
          "
        >
          {{ row.tipo_movimiento === 'IN' ? 'INGRESO' : 'SALIDA' }}
        </span>
      </ng-template>

      <ng-template #documentTemplate let-row>
        <span class="font-semibold">{{ row.tipo_documento }}</span>
        {{ row.numero_documento }}
      </ng-template>

      <ng-template #entityTemplate let-row>
        {{
          row.project_id
            ? 'Proyecto: ' + row.project_id
            : row.provider_id
              ? 'Proveedor: ' + row.provider_id
              : '-'
        }}
      </ng-template>

      <ng-template #itemsTemplate let-row>
        <span class="badge badge-items">{{ row.details?.length || 0 }} items</span>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button class="btn-icon" (click)="viewDetails(row)" title="Ver Detalles">
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .btn {
        padding: var(--s-8) var(--s-16);
        border: none;
        border-radius: var(--s-8);
        font-size: var(--type-bodySmall-size);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        transition: all 0.2s ease;
      }
      .btn-primary {
        background: var(--primary-500);
        color: var(--neutral-0);
      }
      .btn-primary:hover {
        background: var(--primary-800);
      }
      .btn-danger {
        background: var(--semantic-red-500);
        color: var(--neutral-0);
      }
      .btn-danger:hover {
        background: var(--semantic-red-900);
      }
      .btn-secondary {
        background: var(--grey-200);
        color: var(--primary-900);
      }
      .btn-secondary:hover {
        background: var(--grey-300);
      }

      /* Stats */
      .stats-bar {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--s-16);
        margin-bottom: var(--s-24);
      }
      .stat-card {
        padding: var(--s-16);
        background: var(--neutral-0);
        border-radius: var(--s-8);
        border-left: 4px solid var(--primary-500);
        box-shadow: var(--shadow-sm);
      }
      .stat-card.stat-in {
        border-left-color: var(--semantic-success);
      }
      .stat-card.stat-out {
        border-left-color: var(--semantic-error);
      }
      .stat-label {
        display: block;
        font-size: var(--type-label-size);
        color: var(--grey-700);
        margin-bottom: var(--s-4);
      }
      .stat-value {
        display: block;
        font-size: var(--type-h3-size);
        font-weight: 700;
        color: var(--grey-900);
      }

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
        background: #d1fae5;
        color: var(--semantic-success);
      }
      .badge-status-out {
        background: #fee2e2;
        color: var(--semantic-error);
      }

      .btn-icon {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        padding: var(--s-4) var(--s-8);
        color: var(--grey-500);
      }
      .btn-icon:hover {
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: var(--s-4);
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
    `
    .actions-container {
      display: flex;
      gap: var(--s-8);
      align-items: center;
    }
  `,
  ],
})
export class MovementListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);

  movements: Movement[] = [];
  filteredMovements: Movement[] = [];
  loading = false;

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
    { label: 'Dashboard', url: '/app' },
    { label: 'Logística', url: '/logistics' },
    { label: 'Movimientos' }
  ];

  tabs: TabItem[] = [
    { label: 'Productos', route: '/logistics/products', icon: 'fa-boxes-stacked' },
    { label: 'Movimientos', route: '/logistics/movements', icon: 'fa-dolly' },
    { label: 'Combustible', route: '/logistics/fuel', icon: 'fa-gas-pump' }
  ];

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Documento, observaciones...' },
    {
      key: 'type',
      label: 'Tipo de Movimiento',
      type: 'select',
      options: [
        { label: 'Ingreso', value: 'IN' },
        { label: 'Salida', value: 'OUT' }
      ]
    },
    { key: 'startDate', label: 'Fecha', type: 'date' }
  ];

  columns: TableColumn[] = [
    { key: 'date', label: 'Fecha', type: 'template' },
    { key: 'type', label: 'Tipo', type: 'template' },
    { key: 'document', label: 'Documento', type: 'template' },
    { key: 'entity', label: 'Proyecto/Proveedor', type: 'template' },
    { key: 'items', label: 'Items', type: 'template' },
    { key: 'observaciones', label: 'Observaciones', type: 'text' }
  ];

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading = true;
    this.inventoryService.getMovements().subscribe({
      next: (data) => {
        this.movements = data;
        this.calculateStats();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading movements', error);
        this.loading = false;
      },
    });
  }

  calculateStats(): void {
    this.stats.total = this.movements.length;
    this.stats.inCount = this.movements.filter((m) => m.tipo_movimiento === 'IN').length;
    this.stats.outCount = this.movements.filter((m) => m.tipo_movimiento === 'OUT').length;
  }

  onFilterChange(filters: Record<string, any>): void {
    this.filters.search = filters['search'] || '';
    this.filters.type = filters['type'] || '';
    this.filters.startDate = filters['startDate'] || '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredMovements = this.movements.filter((movement) => {
      const matchesSearch =
        !this.filters.search ||
        (movement.numero_documento &&
          movement.numero_documento.toLowerCase().includes(this.filters.search.toLowerCase())) ||
        (movement.observaciones &&
          movement.observaciones.toLowerCase().includes(this.filters.search.toLowerCase()));

      const matchesType = !this.filters.type || movement.tipo_movimiento === this.filters.type;

      const matchesDate =
        !this.filters.startDate ||
        new Date(movement.fecha).toISOString().split('T')[0] === this.filters.startDate;

      return matchesSearch && matchesType && matchesDate;
    });
  }

  registerMovement(type: 'IN' | 'OUT'): void {
    this.router.navigate(['/logistics/movements/new'], { queryParams: { type } });
  }

  viewDetails(movement: Movement): void {
    this.router.navigate(['/logistics/movements', movement.id]);
  }

  handleExport(format: ExportFormat): void {
    if (this.movements.length === 0) {
      alert('No hay movimientos para exportar');
      return;
    }

    const exportData = this.movements.map(movement => ({
      'ID': movement.id || '',
      'Fecha': movement.fecha ? new Date(movement.fecha).toLocaleDateString('es-PE') : '',
      'Tipo': movement.tipo_movimiento === 'IN' ? 'Ingreso' : 'Salida',
      'Tipo Documento': movement.tipo_documento || '',
      'Número Documento': movement.numero_documento || '',
      'Observaciones': movement.observaciones || '',
      'Proveedor ID': movement.provider_id || '',
      'Proyecto ID': movement.project_id || ''
    }));

    if (format === 'excel') {
      this.excelService.exportToExcel(exportData, {
        filename: 'movimientos_inventario',
        sheetName: 'Movimientos',
        includeTimestamp: true
      });
    } else {
      this.csvService.exportToCsv(exportData, {
        filename: 'movimientos_inventario',
        includeTimestamp: true
      });
    }
  }

  private excelService = inject(ExcelExportService);
  private csvService = inject(CsvExportService);
}
