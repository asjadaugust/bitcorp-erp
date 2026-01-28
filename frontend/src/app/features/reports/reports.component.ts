import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportingService } from '../../core/services/reporting.service';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, AeroTableComponent],
  template: `
    <div class="reports-container">
      <div class="header">
        <h1>Reportes y Analítica</h1>
        <p>Generación de reportes operativos y financieros</p>
      </div>

      <div class="card filter-card">
        <div class="filter-grid">
          <div class="form-group">
            <label>Tipo de Reporte</label>
            <select [(ngModel)]="selectedReport" class="form-select">
              <option value="utilization">Utilización de Equipos</option>
              <option value="maintenance">Historial de Mantenimiento</option>
              <option value="inventory">Movimientos de Inventario</option>
              <option value="timesheet">Timesheet de Operadores</option>
            </select>
          </div>

          <div class="form-group">
            <label>Fecha Inicio</label>
            <input type="date" [(ngModel)]="startDate" class="form-control" />
          </div>

          <div class="form-group">
            <label>Fecha Fin</label>
            <input type="date" [(ngModel)]="endDate" class="form-control" />
          </div>

          <div class="actions">
            <button
              type="button"
              class="btn btn-primary"
              (click)="generateReport()"
              [disabled]="loading"
            >
              <i class="fa-solid fa-table"></i> Ver Datos
            </button>
            <button
              type="button"
              class="btn btn-success"
              (click)="exportExcel()"
              [disabled]="loading"
            >
              <i class="fa-solid fa-file-excel"></i> Exportar Excel
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <!-- Utilization Report Table -->
      <div
        *ngIf="!loading && reportData && selectedReport === 'utilization'"
        class="report-result card"
      >
        <h3>Reporte de Utilización</h3>
        <aero-table [columns]="columnsUtilization" [data]="reportData"></aero-table>
      </div>

      <!-- Maintenance Report Table -->
      <div
        *ngIf="!loading && reportData && selectedReport === 'maintenance'"
        class="report-result card"
      >
        <h3>Historial de Mantenimiento</h3>
        <aero-table
          [columns]="columnsMaintenance"
          [data]="reportData"
          [templates]="{
            maintenance_type: maintenanceTypeTemplate,
            status: statusTemplate,
          }"
        ></aero-table>

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
        <aero-table
          [columns]="columnsInventory"
          [data]="reportData"
          [templates]="{
            tipo_movimiento: movementTypeTemplate,
          }"
        ></aero-table>

        <ng-template #movementTypeTemplate let-row>
          <span
            [class]="'badge ' + (row.tipo_movimiento === 'IN' ? 'badge-success' : 'badge-warning')"
          >
            {{ row.tipo_movimiento }}
          </span>
        </ng-template>
      </div>

      <!-- Operator Timesheet Table -->
      <div
        *ngIf="!loading && reportData && selectedReport === 'timesheet'"
        class="report-result card"
      >
        <h3>Timesheet de Operadores</h3>
        <aero-table [columns]="columnsTimesheet" [data]="reportData"></aero-table>
      </div>
    </div>
  `,
  styles: [
    `
      .reports-container {
        padding: 0;
      }
      .header {
        margin-bottom: 24px;
      }
      .header h1 {
        font-size: 24px;
        color: var(--primary-900);
        margin: 0;
      }
      .header p {
        color: var(--grey-500);
        margin: 4px 0 0;
      }

      .filter-card {
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: var(--shadow-sm);
        margin-bottom: 24px;
      }

      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        align-items: end;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      label {
        font-size: 14px;
        font-weight: 500;
        color: var(--grey-700);
      }

      .form-control,
      .form-select {
        padding: 10px;
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        width: 100%;
      }

      .actions {
        display: flex;
        gap: 12px;
      }

      .btn {
        padding: 10px 16px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        color: white;
      }
      .btn-primary {
        background: var(--primary-500);
      }
      .btn-success {
        background: var(--semantic-green-600);
      }
      .btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .report-result {
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: var(--shadow-sm);
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
      }
      .data-table th,
      .data-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid var(--grey-200);
      }
      .data-table th {
        background: var(--grey-50);
        font-weight: 600;
        color: var(--grey-700);
      }

      .loading {
        display: flex;
        justify-content: center;
        padding: 48px;
      }

      .badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
      }
      .badge-success {
        background: #c6f6d5;
        color: #22543d;
      }
      .badge-warning {
        background: #feebc8;
        color: #744210;
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
  reportData: any[] | null = null;

  columnsUtilization: TableColumn[] = [
    { key: 'codigo_equipo', label: 'Equipo', type: 'text' },
    { key: 'date', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy' },
    { key: 'trabajador_nombre', label: 'Operador', type: 'text' },
    { key: 'proyecto_nombre', label: 'Proyecto', type: 'text' },
    { key: 'total_hours', label: 'Horas Totales', type: 'text' },
    { key: 'avg_daily_hours', label: 'Promedio Diario', type: 'text' },
    { key: 'total_fuel', label: 'Combustible (Gal)', type: 'text' },
  ];

  columnsMaintenance: TableColumn[] = [
    { key: 'start_date', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy' },
    { key: 'equipo_nombre', label: 'Equipo', type: 'text' },
    { key: 'provider_name', label: 'Proveedor', type: 'text' },
    { key: 'maintenance_type', label: 'Tipo', type: 'template' },
    { key: 'status', label: 'Estado', type: 'template' },
    { key: 'cost', label: 'Costo', type: 'currency', format: 'PEN' },
    { key: 'description', label: 'Descripción', type: 'text' },
  ];

  columnsInventory: TableColumn[] = [
    { key: 'fecha', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy HH:mm' },
    { key: 'tipo_movimiento', label: 'Tipo', type: 'template' },
    { key: 'tipo_documento', label: 'Documento', type: 'text' },
    { key: 'numero_documento', label: 'Número', type: 'text' },
    { key: 'proyecto_nombre', label: 'Proyecto', type: 'text' },
    { key: 'provider_name', label: 'Proveedor', type: 'text' },
    { key: 'items_count', label: 'Items', type: 'text' },
    { key: 'total_amount', label: 'Total', type: 'currency', format: 'PEN' },
  ];

  columnsTimesheet: TableColumn[] = [
    { key: 'trabajador_nombre', label: 'Operador', type: 'text' },
    { key: 'equipment_count', label: 'Equipos Operados', type: 'text' },
    { key: 'proyecto_nombre', label: 'Proyecto Principal', type: 'text' },
    { key: 'total_hours', label: 'Horas Totales', type: 'text' },
    { key: 'overtime_hours', label: 'Horas Extras', type: 'text' },
  ];

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
        this.reportData = res.data;
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
