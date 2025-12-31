import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FuelService } from '../../core/services/fuel.service';
import { FuelRecord } from '../../core/models/fuel-record.model';
import { ExcelExportService } from '../../core/services/excel-export.service';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import {
  PageLayoutComponent,
  TabItem,
} from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../shared/components/export-dropdown/export-dropdown.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-fuel-list',
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
      title="Gestión de Combustible"
      icon="fa-gas-pump"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <app-export-dropdown (export)="handleExport($event)"> </app-export-dropdown>
        <button class="btn btn-primary" (click)="createRecord()">
          <i class="fa-solid fa-plus"></i> Nuevo Registro
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="records"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          equipment: equipmentTemplate,
          gallons: gallonsTemplate,
          provider: providerTemplate,
        }"
        (rowClick)="viewRecord($event)"
      >
      </aero-table>

      <!-- Custom Templates -->
      <ng-template #equipmentTemplate let-row>
        <div class="equipment-info">
          <span class="equip-code">{{ row.equipment?.code || 'N/A' }}</span>
          <span class="equip-model">{{ row.equipment?.brand }} {{ row.equipment?.model }}</span>
        </div>
      </ng-template>

      <ng-template #gallonsTemplate let-row>
        <span class="gallons">{{ row.gallons | number: '1.2-2' }} gl</span>
      </ng-template>

      <ng-template #providerTemplate let-row>
        {{ row.provider?.business_name || '-' }}
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button
            class="btn-icon"
            (click)="viewRecord(row); $event.stopPropagation()"
            title="Ver Detalles"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
          <button
            class="btn-icon"
            (click)="editRecord(row); $event.stopPropagation()"
            title="Editar"
          >
            <i class="fa-solid fa-pen"></i>
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

      .equipment-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .equip-code {
        font-weight: 600;
        color: var(--primary-800);
        font-family: monospace;
      }

      .equip-model {
        font-size: 12px;
        color: var(--grey-500);
      }

      .gallons {
        font-weight: 600;
        color: var(--grey-900);
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        color: var(--grey-500);
        transition: color 0.2s;
      }

      .btn-icon:hover {
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: var(--s-4);
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
export class FuelListComponent implements OnInit {
  fuelService = inject(FuelService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private excelService = inject(ExcelExportService);

  records: FuelRecord[] = [];
  loading = false;
  filters = { equipment_id: '', start_date: '', end_date: '', search: '' };

  breadcrumbs = [
    { label: 'Dashboard', url: '/app' },
    { label: 'Logística', url: '/logistics' },
    { label: 'Combustible' },
  ];

  tabs: TabItem[] = [
    { label: 'Productos', route: '/logistics/products', icon: 'fa-boxes-stacked' },
    { label: 'Movimientos', route: '/logistics/movements', icon: 'fa-dolly' },
    { label: 'Combustible', route: '/logistics/fuel', icon: 'fa-gas-pump' },
  ];

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Buscar por equipo...' },
    { key: 'start_date', label: 'Fecha Inicio', type: 'date' },
  ];

  columns: TableColumn[] = [
    { key: 'date', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy' },
    { key: 'equipment', label: 'Equipo', type: 'template' },
    { key: 'gallons', label: 'Galones', type: 'template' },
    { key: 'cost_per_gallon', label: 'Costo/Gal', type: 'currency', format: 'PEN' },
    { key: 'total_cost', label: 'Total', type: 'currency', format: 'PEN' },
    { key: 'hourmeter', label: 'Horómetro', type: 'text' },
    { key: 'provider', label: 'Proveedor', type: 'template' },
  ];

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading = true;
    this.fuelService.getAll(this.filters).subscribe({
      next: (data) => {
        this.records = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.filters.search = filters['search'] || '';
    this.filters.start_date = filters['start_date'] || '';
    this.loadRecords();
  }

  viewRecord(record: FuelRecord): void {
    this.router.navigate([record.id], { relativeTo: this.route });
  }

  editRecord(record: FuelRecord): void {
    this.router.navigate([record.id, 'edit'], { relativeTo: this.route });
  }

  createRecord(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  handleExport(format: ExportFormat): void {
    if (format === 'excel') {
      this.exportToExcel();
    } else if (format === 'csv') {
      this.exportToCSV();
    }
  }

  exportToExcel(): void {
    if (this.records.length === 0) {
      alert('No hay registros de combustible para exportar');
      return;
    }

    const exportData = this.records.map((record) => ({
      Equipo: record.equipment?.code || 'N/A',
      Fecha: record.date ? new Date(record.date).toLocaleDateString('es-PE') : '',
      Galones: record.gallons || 0,
      'Precio por Galón': record.cost_per_gallon || 0,
      Total: record.total_cost || 0,
      Proveedor: record.provider?.business_name || '-',
      Odómetro: record.odometer || 0,
      Horómetro: record.hourmeter || 0,
      Creado: record.created_at ? new Date(record.created_at).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'combustible',
      sheetName: 'Registros de Combustible',
    });
  }

  exportToCSV(): void {
    if (this.records.length === 0) {
      alert('No hay registros de combustible para exportar');
      return;
    }

    const exportData = this.records.map((record) => ({
      Equipo: record.equipment?.code || 'N/A',
      Fecha: record.date ? new Date(record.date).toLocaleDateString('es-PE') : '',
      Galones: record.gallons || 0,
      'Precio por Galón': record.cost_per_gallon || 0,
      Total: record.total_cost || 0,
      Proveedor: record.provider?.business_name || '-',
      Odómetro: record.odometer || 0,
      Horómetro: record.hourmeter || 0,
      Creado: record.created_at ? new Date(record.created_at).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToCSV(exportData, 'combustible');
  }
}
