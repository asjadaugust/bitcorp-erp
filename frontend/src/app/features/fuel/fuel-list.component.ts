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
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../shared/components/export-dropdown/export-dropdown.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    ActionsContainerComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Gestión de Combustible"
      icon="fa-gas-pump"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-export-dropdown (export)="handleExport($event)"> </app-export-dropdown>
        <app-button
          variant="primary"
          icon="fa-plus"
          label="Nuevo Registro"
          (clicked)="createRecord()"
        ></app-button>
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
          <span class="equip-code">{{ row.valorizacion_equipment_id || 'N/A' }}</span>
          <span class="equip-model">Valorización: {{ row.valorizacion_periodo || 'N/A' }}</span>
        </div>
      </ng-template>

      <ng-template #gallonsTemplate let-row>
        <span class="gallons">{{ row.cantidad | number: '1.2-2' }} gl</span>
      </ng-template>

      <ng-template #providerTemplate let-row>
        {{ row.proveedor || '-' }}
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <app-button
            variant="icon"
            size="sm"
            icon="fa-eye"
            title="Ver Detalles"
            (clicked)="viewRecord(row); $event.stopPropagation()"
          ></app-button>
          <app-button
            variant="icon"
            size="sm"
            icon="fa-pen"
            title="Editar"
            (clicked)="editRecord(row); $event.stopPropagation()"
          ></app-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
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
  private snackBar = inject(MatSnackBar);

  records: FuelRecord[] = [];
  loading = false;
  filters = { valorizacionId: '', startDate: '', endDate: '', search: '' };

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Logística', url: '/logistics' },
    { label: 'Combustible' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por proveedor, documento...',
    },
    { key: 'startDate', label: 'Fecha Inicio', type: 'date' },
    { key: 'endDate', label: 'Fecha Fin', type: 'date' },
  ];

  columns: TableColumn[] = [
    { key: 'fecha', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy' },
    { key: 'equipment', label: 'Valorización', type: 'template' },
    { key: 'gallons', label: 'Cantidad (gl)', type: 'template' },
    { key: 'precio_unitario', label: 'Precio/gl', type: 'currency', format: 'PEN' },
    { key: 'monto_total', label: 'Total', type: 'currency', format: 'PEN' },
    { key: 'tipo_combustible', label: 'Tipo', type: 'text' },
    { key: 'numero_documento', label: 'N° Doc', type: 'text' },
    { key: 'provider', label: 'Proveedor', type: 'template' },
  ];

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading = true;
    this.fuelService.getAll(this.filters).subscribe({
      next: (response) => {
        this.records = response.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.startDate = (filters['startDate'] as string) || '';
    this.filters.endDate = (filters['endDate'] as string) || '';
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
      this.snackBar.open('No hay registros de combustible para exportar', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const exportData = this.records.map((record) => ({
      Fecha: record.fecha ? new Date(record.fecha).toLocaleDateString('es-PE') : '',
      Valorización: record.valorizacion_periodo || 'N/A',
      'Equipo ID': record.valorizacion_equipment_id || 'N/A',
      Cantidad: record.cantidad || 0,
      'Precio Unitario': record.precio_unitario || 0,
      'Monto Total': record.monto_total || 0,
      'Tipo Combustible': record.tipo_combustible || '-',
      Proveedor: record.proveedor || '-',
      'N° Documento': record.numero_documento || '-',
      Observaciones: record.observaciones || '-',
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'combustible',
      sheetName: 'Registros de Combustible',
    });
  }

  exportToCSV(): void {
    if (this.records.length === 0) {
      this.snackBar.open('No hay registros de combustible para exportar', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const exportData = this.records.map((record) => ({
      Fecha: record.fecha ? new Date(record.fecha).toLocaleDateString('es-PE') : '',
      Valorización: record.valorizacion_periodo || 'N/A',
      'Equipo ID': record.valorizacion_equipment_id || 'N/A',
      Cantidad: record.cantidad || 0,
      'Precio Unitario': record.precio_unitario || 0,
      'Monto Total': record.monto_total || 0,
      'Tipo Combustible': record.tipo_combustible || '-',
      Proveedor: record.proveedor || '-',
      'N° Documento': record.numero_documento || '-',
      Observaciones: record.observaciones || '-',
    }));

    this.excelService.exportToCSV(exportData, 'combustible');
  }
}
