import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DailyReportService } from '../../core/services/daily-report.service';
import { DailyReport } from '../../core/models/daily-report.model';
import { MainNavComponent } from '../../shared/components/main-nav.component';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import { ExcelExportService } from '../../core/services/excel-export.service';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-daily-report-list-enhanced',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MainNavComponent,
    AeroTableComponent,
    DropdownComponent,
  ],
  template: `
    <app-main-nav></app-main-nav>
    <div class="reports-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="page-title">
          <div class="page-icon">
            <i class="fa-solid fa-clipboard-list"></i>
          </div>
          <div>
            <h1>Partes Diarios</h1>
            <div class="breadcrumb">
              <a routerLink="/dashboard"><i class="fa-solid fa-home"></i> Dashboard</a>
              <span class="separator">›</span>
              <span>Partes Diarios</span>
            </div>
          </div>
        </div>
        <div class="actions-container">
          <button
            class="btn btn-secondary"
            (click)="exportToExcel()"
            [disabled]="reports.length === 0"
          >
            <i class="fa-solid fa-file-excel"></i> Exportar Excel
          </button>
          <button class="btn btn-primary" (click)="createReport()">
            <i class="fa-solid fa-plus"></i> Nuevo Parte
          </button>
        </div>
      </div>

      <!-- Filters & Actions Bar -->
      <div class="table-controls">
        <div class="search-box">
          <i class="fa-solid fa-search"></i>
          <input
            type="text"
            placeholder="Buscar por código, equipo u operador..."
            [(ngModel)]="filters.search"
            (input)="applyFilters()"
          />
        </div>

        <div class="filter-group">
          <input
            type="date"
            [(ngModel)]="filters.startDate"
            (change)="applyFilters()"
            class="form-control"
            placeholder="Fecha Inicio"
          />
          <span class="separator">-</span>
          <input
            type="date"
            [(ngModel)]="filters.endDate"
            (change)="applyFilters()"
            class="form-control"
            placeholder="Fecha Fin"
          />
        </div>

        <div class="filter-group">
          <app-dropdown
            [(ngModel)]="filters.status"
            [options]="statusOptions"
            (ngModelChange)="applyFilters()"
            [placeholder]="'Todos los Estados'"
          ></app-dropdown>
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-container">
        <div class="loading-overlay" *ngIf="loading">
          <div class="spinner"></div>
        </div>

        <aero-table
          [columns]="columns"
          [data]="reports"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            equipment: equipmentTemplate,
            operator: operatorTemplate,
            meter: meterTemplate,
            fuel: fuelTemplate,
          }"
          (rowClick)="viewReport($event)"
        >
        </aero-table>

        <!-- Custom Templates -->
        <ng-template #dateTemplate let-row>
          <div class="date-cell">
            <span class="date-day">{{ row.date | date: 'dd' }}</span>
            <div class="date-meta">
              <span class="date-month">{{ row.date | date: 'MMM' }}</span>
              <span class="date-year">{{ row.date | date: 'yyyy' }}</span>
            </div>
          </div>
        </ng-template>

        <ng-template #equipmentTemplate let-row>
          <div class="equipment-info">
            <span class="eq-code">{{ row.equipment?.code }}</span>
            <span class="eq-name">{{ row.equipment?.name }}</span>
          </div>
        </ng-template>

        <ng-template #operatorTemplate let-row>
          <div class="operator-info">
            <div class="avatar-small">{{ getInitials(row.operator) }}</div>
            <span>{{ row.operator?.first_name }} {{ row.operator?.last_name }}</span>
          </div>
        </ng-template>

        <ng-template #meterTemplate let-row>
          <div class="meter-info">
            <span class="meter-value"
              >{{ row.end_hour - row.start_hour | number: '1.1-1' }} hrs</span
            >
            <span class="meter-range text-muted">{{ row.start_hour }} - {{ row.end_hour }}</span>
          </div>
        </ng-template>

        <ng-template #fuelTemplate let-row>
          <span class="fuel-badge" *ngIf="row.fuel_gallons > 0">
            <i class="fa-solid fa-gas-pump"></i> {{ row.fuel_gallons }} gl
          </span>
          <span class="text-muted" *ngIf="!row.fuel_gallons">-</span>
        </ng-template>

        <!-- Actions Template -->
        <ng-template #actionsTemplate let-row>
          <div class="action-buttons">
            <button
              class="btn-icon"
              (click)="viewReport(row); $event.stopPropagation()"
              title="Ver Detalles"
            >
              <i class="fa-solid fa-eye"></i>
            </button>
            <button
              class="btn-icon"
              (click)="editReport(row); $event.stopPropagation()"
              title="Editar"
            >
              <i class="fa-solid fa-pen"></i>
            </button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `
      .reports-container {
        padding: 2rem;
        max-width: 100%;
        background: var(--grey-100);
        min-height: 100vh;
      }

      /* Header Styles */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .page-icon {
        width: 48px;
        height: 48px;
        background: var(--primary-100);
        color: var(--primary-800);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }

      .page-title h1 {
        margin: 0 0 0.25rem 0;
        font-size: 24px;
        font-weight: 700;
        color: var(--primary-900);
      }

      .breadcrumb {
        color: var(--grey-500);
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .breadcrumb a {
        color: var(--primary-500);
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        transition: color 0.2s;
      }

      .breadcrumb a:hover {
        color: var(--primary-800);
      }

      .breadcrumb .separator {
        color: var(--grey-400);
      }

      /* Controls & Filters */
      .table-controls {
        display: flex;
        gap: var(--s-16);
        margin-bottom: var(--s-16);
        flex-wrap: wrap;
        align-items: center;
      }

      .search-box {
        flex: 1;
        min-width: 250px;
        position: relative;
      }

      .search-box i {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--grey-400);
      }

      .search-box input {
        width: 100%;
        padding: 10px 12px 10px 36px;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        font-size: 14px;
        transition: all 0.2s;
      }

      .search-box input:focus {
        border-color: var(--primary-500);
        outline: none;
        box-shadow: 0 0 0 3px var(--primary-100);
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .form-control {
        padding: 10px 12px;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        font-size: 14px;
        color: var(--grey-700);
      }

      .form-select {
        padding: 10px 32px 10px 12px;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        font-size: 14px;
        color: var(--grey-700);
        background-color: var(--neutral-0);
        cursor: pointer;
        min-width: 160px;
      }

      .separator {
        color: var(--grey-400);
        font-weight: 500;
      }

      /* Data Table */
      .table-container {
        background: var(--neutral-0);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        overflow-x: auto;
        position: relative;
        border: 1px solid var(--grey-200);
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        white-space: nowrap;
      }

      .data-table th {
        background: var(--grey-50);
        padding: 12px 16px;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        color: var(--grey-700);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--grey-200);
      }

      .data-table td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--grey-100);
        color: var(--grey-700);
        font-size: 14px;
        vertical-align: middle;
      }

      .hover-row:hover td {
        background-color: var(--primary-100);
      }

      /* Cell Components */
      .date-cell {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .date-day {
        font-size: 18px;
        font-weight: 700;
        color: var(--grey-900);
      }

      .date-meta {
        display: flex;
        flex-direction: column;
        font-size: 11px;
        color: var(--grey-500);
        line-height: 1.1;
      }

      .code-badge {
        font-family: monospace;
        background: var(--grey-100);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        color: var(--grey-700);
      }

      .equipment-info {
        display: flex;
        flex-direction: column;
      }

      .eq-code {
        font-weight: 600;
        color: var(--primary-800);
        font-size: 13px;
      }

      .eq-name {
        font-size: 12px;
        color: var(--grey-500);
      }

      .operator-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .avatar-small {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--primary-100);
        color: var(--primary-800);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 600;
      }

      .meter-info {
        display: flex;
        flex-direction: column;
      }

      .meter-value {
        font-weight: 600;
        color: var(--grey-900);
      }

      .meter-range {
        font-size: 11px;
      }

      .fuel-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: var(--semantic-orange-50);
        color: var(--semantic-orange-700);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }

      /* Status Badges */
      .status-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .status-badge::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .status-draft {
        background: var(--grey-100);
        color: var(--grey-700);
      }
      .status-draft::before {
        background: var(--grey-400);
      }

      .status-submitted {
        background: var(--primary-100);
        color: var(--primary-800);
      }
      .status-submitted::before {
        background: var(--primary-500);
      }

      .status-approved {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .status-approved::before {
        background: var(--semantic-green-500);
      }

      .status-rejected {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
      }
      .status-rejected::before {
        background: var(--semantic-red-500);
      }

      /* Actions */
      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .btn-icon {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--grey-500);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .btn-icon:hover {
        background: var(--grey-100);
        color: var(--primary-500);
      }

      /* Button Styles */
      .btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
        font-size: 14px;
      }

      .btn-primary {
        background: var(--primary-500);
        color: white;
      }

      .btn-primary:hover {
        background: var(--primary-800);
      }

      .btn-secondary {
        background: var(--grey-700);
        color: white;
      }

      .btn-secondary:hover {
        background: var(--grey-700);
      }

      .btn-secondary:disabled {
        background: var(--grey-300);
        cursor: not-allowed;
        opacity: 0.6;
      }

      .actions-container {
        display: flex;
        gap: 0.75rem;
      }

      .text-right {
        text-align: right;
      }
      .text-muted {
        color: var(--grey-400);
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 48px 0;
      }

      .empty-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .empty-content i {
        font-size: 48px;
        color: var(--grey-300);
      }

      .empty-content h3 {
        margin: 0;
        color: var(--grey-900);
      }

      .empty-content p {
        margin: 0;
        color: var(--grey-500);
      }

      /* Loading */
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
      }
    `,
  ],
})
export class DailyReportListEnhancedComponent implements OnInit {
  dailyReportService = inject(DailyReportService);
  private excelService = inject(ExcelExportService);
  private router = inject(Router);

  reports: DailyReport[] = [];
  loading = false;
  filters = {
    status: '',
    search: '',
    startDate: '',
    endDate: '',
  };

  statusOptions: DropdownOption[] = [
    { label: 'Borrador', value: 'BORRADOR' },
    { label: 'Enviado', value: 'ENVIADO' },
    { label: 'Aprobado', value: 'APROBADO' },
    { label: 'Rechazados', value: 'RECHAZADO' },
  ];

  columns: TableColumn[] = [
    { key: 'date', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy' },
    { key: 'code', label: 'Código', type: 'text' },
    { key: 'equipment', label: 'Equipo', type: 'template' },
    { key: 'operator', label: 'Operador', type: 'template' },
    { key: 'meter', label: 'Horómetro', type: 'template' },
    { key: 'fuel', label: 'Combustible', type: 'template' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        BORRADOR: { label: 'Borrador', class: 'status-badge status-draft', icon: 'fa-file-pen' },
        ENVIADO: {
          label: 'Enviado',
          class: 'status-badge status-submitted',
          icon: 'fa-paper-plane',
        },
        APROBADO: {
          label: 'Aprobado',
          class: 'status-badge status-approved',
          icon: 'fa-check-circle',
        },
        RECHAZADO: {
          label: 'Rechazado',
          class: 'status-badge status-rejected',
          icon: 'fa-circle-xmark',
        },
      },
    },
  ];

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.dailyReportService.getAll(this.filters).subscribe({
      next: (data) => {
        this.reports = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.loadReports();
  }

  getInitials(operator: Record<string, string> | null): string {
    if (!operator) return '??';
    const first = operator.first_name?.charAt(0) || '';
    const last = operator.last_name?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'BORRADOR':
        return 'Borrador';
      case 'PENDIENTE':
        return 'Enviado';
      case 'APROBADO':
        return 'Aprobado';
      case 'RECHAZADO':
        return 'Rechazado';
      default:
        return status || 'Desconocido';
    }
  }

  viewReport(report: DailyReport): void {
    this.router.navigate(['/daily-reports', report.id]);
  }

  editReport(report: DailyReport): void {
    this.router.navigate(['/daily-reports', report.id, 'edit']);
  }

  createReport(): void {
    this.router.navigate(['/equipment/daily-reports/new']);
  }

  exportToExcel(): void {
    if (this.reports.length === 0) {
      alert('No hay partes diarios para exportar');
      return;
    }

    const exportData = this.reports.map((report: DailyReport) => {
      const hoursDiff =
        report.horometro_final && report.horometro_inicial
          ? report.horometro_final - report.horometro_inicial
          : 0;
      const kmDiff =
        report.odometro_final && report.odometro_inicial
          ? report.odometro_final - report.odometro_inicial
          : 0;

      return {
        Fecha: report.fecha_parte ? new Date(report.fecha_parte).toLocaleDateString('es-PE') : '',
        'Equipo Código': report.codigo_equipo || '',
        'Equipo Nombre': report.equipo_nombre || '',
        Operador: report.trabajador_nombre || '',
        Proyecto: report.proyecto_nombre || '',
        'Hora Inicio': report.hora_inicio || '',
        'Hora Fin': report.hora_fin || '',
        'Horómetro Inicial': report.horometro_inicial || 0,
        'Horómetro Final': report.horometro_final || 0,
        'Horómetro Horas': hoursDiff,
        'Odómetro Inicial': report.odometro_inicial || 0,
        'Odómetro Final': report.odometro_final || 0,
        'Odómetro KM': kmDiff,
        'Combustible (gal)': report.diesel_gln || 0,
        Estado: this.getStatusLabel(report.estado),
        Descripción: report.observaciones || '',
        Ubicación: report.lugar_salida || report.lugar_llegada || '',
        Creado: report.created_at ? new Date(report.created_at).toLocaleDateString('es-PE') : '',
      };
    });

    this.excelService.exportToExcel(exportData, {
      filename: 'partes_diarios',
      sheetName: 'Reportes Diarios',
      includeTimestamp: true,
    });
  }
}
