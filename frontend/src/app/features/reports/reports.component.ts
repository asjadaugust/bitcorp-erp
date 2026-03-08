import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportingService } from '../../core/services/reporting.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import { DropdownOption } from '../../shared/components/dropdown/dropdown.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { AeroButtonComponent, AeroBadgeComponent } from '../../core/design-system';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    AeroDataGridComponent,
    FilterBarComponent,
    PageLayoutComponent,
    AeroButtonComponent,
    AeroBadgeComponent,
  ],
  template: `
    <app-page-layout title="Reportes y Analítica" icon="fa-chart-bar">
      <app-filter-bar [config]="filterConfig" (filterChange)="onFilterChange($event)">
        <div actions>
          <aero-button
            variant="primary"
            iconLeft="fa-table"
            [loading]="loading"
            (clicked)="generateReport()"
            >Ver Datos</aero-button
          >
          <aero-button
            variant="primary"
            iconLeft="fa-file-excel"
            [loading]="loading"
            (clicked)="exportExcel()"
            >Excel</aero-button
          >
        </div>
      </app-filter-bar>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <!-- Utilization Report Table -->
      <div
        *ngIf="!loading && reportData && selectedReport === 'utilization'"
        class="report-result card"
      >
        <h3>Reporte de Utilización</h3>
        <aero-data-grid
          [gridId]="'report-utilization'"
          [columns]="columnsUtilization"
          [data]="reportData"
          [dense]="true"
        ></aero-data-grid>
      </div>

      <!-- Maintenance Report Table -->
      <div
        *ngIf="!loading && reportData && selectedReport === 'maintenance'"
        class="report-result card"
      >
        <h3>Historial de Mantenimiento</h3>
        <aero-data-grid
          [gridId]="'report-maintenance'"
          [columns]="columnsMaintenance"
          [data]="reportData"
          [dense]="true"
          [templates]="{
            maintenance_type: maintenanceTypeTemplate,
            status: statusTemplate,
          }"
        ></aero-data-grid>

        <ng-template #maintenanceTypeTemplate let-row>
          {{ row.maintenance_type | titlecase }}
        </ng-template>

        <ng-template #statusTemplate let-row>
          {{ row.status | titlecase }}
        </ng-template>
      </div>

      <!-- Inventory Report Table -->
      <div
        *ngIf="!loading && reportData && selectedReport === 'inventory'"
        class="report-result card"
      >
        <h3>Movimientos de Inventario</h3>
        <aero-data-grid
          [gridId]="'report-inventory'"
          [columns]="columnsInventory"
          [data]="reportData"
          [dense]="true"
          [templates]="{
            tipo_movimiento: movementTypeTemplate,
          }"
        ></aero-data-grid>

        <ng-template #movementTypeTemplate let-row>
          <aero-badge [variant]="row.tipo_movimiento === 'IN' ? 'info' : 'neutral'">
            {{ row.tipo_movimiento }}
          </aero-badge>
        </ng-template>
      </div>

      <!-- Operator Timesheet Table -->
      <div
        *ngIf="!loading && reportData && selectedReport === 'timesheet'"
        class="report-result card"
      >
        <h3>Timesheet de Operadores</h3>
        <aero-data-grid
          [gridId]="'report-timesheet'"
          [columns]="columnsTimesheet"
          [data]="reportData"
          [dense]="true"
        ></aero-data-grid>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .report-result {
        margin-top: var(--s-16);
      }

      .report-result h3 {
        font-size: 18px;
        color: var(--primary-900);
        margin: 0 0 var(--s-16);
      }

      .card {
        background: var(--neutral-0);
        padding: var(--s-24);
        border-radius: var(--s-12);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--grey-200);
      }

      .loading {
        display: flex;
        justify-content: center;
        padding: 48px;
      }
    `,
  ],
})
export class ReportsComponent {
  reportingService = inject(ReportingService);

  selectedReport = 'utilization';
  startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];
  endDate = new Date().toISOString().split('T')[0];

  loading = false;
  reportData: Record<string, unknown>[] | null = null;

  reportOptions: DropdownOption[] = [
    { label: 'Utilización de Equipos', value: 'utilization' },
    { label: 'Historial de Mantenimiento', value: 'maintenance' },
    { label: 'Movimientos de Inventario', value: 'inventory' },
    { label: 'Timesheet de Operadores', value: 'timesheet' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'reportType',
      label: 'Tipo de Reporte',
      type: 'select',
      value: 'utilization',
      options: this.reportOptions,
    },
    { key: 'startDate', label: 'Fecha Inicio', type: 'date', value: this.startDate },
    { key: 'endDate', label: 'Fecha Fin', type: 'date', value: this.endDate },
  ];

  columnsUtilization: DataGridColumn[] = [
    { key: 'codigo_equipo', label: 'Equipo', type: 'text', sortable: true },
    { key: 'date', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy', sortable: true },
    { key: 'trabajador_nombre', label: 'Operador', type: 'text', sortable: true },
    { key: 'proyecto_nombre', label: 'Proyecto', type: 'text', sortable: true },
    { key: 'total_hours', label: 'Horas Totales', type: 'text', sortable: true },
    { key: 'avg_daily_hours', label: 'Promedio Diario', type: 'text' },
    { key: 'total_fuel', label: 'Combustible (Gal)', type: 'text' },
  ];

  columnsMaintenance: DataGridColumn[] = [
    { key: 'start_date', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy', sortable: true },
    { key: 'equipo_nombre', label: 'Equipo', type: 'text', sortable: true },
    { key: 'provider_name', label: 'Proveedor', type: 'text', sortable: true },
    { key: 'maintenance_type', label: 'Tipo', type: 'template' },
    { key: 'status', label: 'Estado', type: 'template' },
    { key: 'cost', label: 'Costo', type: 'currency', format: 'PEN', sortable: true },
    { key: 'description', label: 'Descripción', type: 'text' },
  ];

  columnsInventory: DataGridColumn[] = [
    { key: 'fecha', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy HH:mm', sortable: true },
    { key: 'tipo_movimiento', label: 'Tipo', type: 'template' },
    { key: 'tipo_documento', label: 'Documento', type: 'text' },
    { key: 'numero_documento', label: 'Número', type: 'text', sortable: true },
    { key: 'proyecto_nombre', label: 'Proyecto', type: 'text', sortable: true },
    { key: 'provider_name', label: 'Proveedor', type: 'text' },
    { key: 'items_count', label: 'Items', type: 'text' },
    { key: 'total_amount', label: 'Total', type: 'currency', format: 'PEN', sortable: true },
  ];

  columnsTimesheet: DataGridColumn[] = [
    { key: 'trabajador_nombre', label: 'Operador', type: 'text', sortable: true },
    { key: 'equipment_count', label: 'Equipos Operados', type: 'text' },
    { key: 'proyecto_nombre', label: 'Proyecto Principal', type: 'text', sortable: true },
    { key: 'total_hours', label: 'Horas Totales', type: 'text', sortable: true },
    { key: 'overtime_hours', label: 'Horas Extras', type: 'text' },
  ];

  onFilterChange(filters: Record<string, unknown>) {
    this.selectedReport = (filters['reportType'] as string) || 'utilization';
    this.startDate = (filters['startDate'] as string) || '';
    this.endDate = (filters['endDate'] as string) || '';
  }

  generateReport() {
    if (!this.startDate || !this.endDate) return;

    this.loading = true;
    this.reportData = null;

    let request;
    switch (this.selectedReport) {
      case 'utilization':
        request = this.reportingService.getEquipmentUtilization(this.startDate, this.endDate);
        break;
      case 'maintenance':
        request = this.reportingService.getMaintenanceHistory(this.startDate, this.endDate);
        break;
      case 'inventory':
        request = this.reportingService.getInventoryMovements(this.startDate, this.endDate);
        break;
      case 'timesheet':
        request = this.reportingService.getOperatorTimesheet(this.startDate, this.endDate);
        break;
      default:
        this.loading = false;
        return;
    }

    request.subscribe({
      next: (res) => {
        this.reportData = (res as any).data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  exportExcel() {
    if (!this.startDate || !this.endDate) return;

    this.loading = true;

    let request;
    const filename = `reporte-${this.selectedReport}-${this.startDate}.xlsx`;

    switch (this.selectedReport) {
      case 'utilization':
        request = this.reportingService.getEquipmentUtilization(
          this.startDate,
          this.endDate,
          'excel'
        );
        break;
      case 'maintenance':
        request = this.reportingService.getMaintenanceHistory(
          this.startDate,
          this.endDate,
          'excel'
        );
        break;
      case 'inventory':
        request = this.reportingService.getInventoryMovements(
          this.startDate,
          this.endDate,
          'excel'
        );
        break;
      case 'timesheet':
        request = this.reportingService.getOperatorTimesheet(this.startDate, this.endDate, 'excel');
        break;
      default:
        this.loading = false;
        return;
    }

    request.subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }
}
