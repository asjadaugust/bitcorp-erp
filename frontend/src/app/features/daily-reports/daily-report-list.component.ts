import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DailyReportService } from '../../core/services/daily-report.service';
import { AuthService } from '../../core/services/auth.service';
import { DailyReport } from '../../core/models/daily-report.model';
import { ExcelExportService } from '../../core/services/excel-export.service';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../shared/components/export-dropdown/export-dropdown.component';
import {
  AeroDataGridComponent,
  DataGridColumn,
  DataGridSortEvent,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import {
  PageLayoutComponent,
  TabItem,
} from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { AeroButtonComponent } from '../../core/design-system';
import { ConfirmService } from '../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EQUIPMENT_TABS } from '../equipment/equipment-tabs';

@Component({
  selector: 'app-daily-report-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    PageCardComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
    AeroDataGridComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Partes Diarios"
      icon="fa-clipboard-list"
      [tabs]="tabs"
      [subtabs]="subtabs"
      [breadcrumbs]="[
        { label: 'Inicio', url: '/app' },
        { label: 'Equipos', url: '/equipment' },
        { label: 'Partes Diarios' },
      ]"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-export-dropdown [disabled]="reports.length === 0" (export)="handleExport($event)">
        </app-export-dropdown>

        <aero-button
          variant="primary"
          iconLeft="fa-file-pen"
          (clicked)="createNewReport()"
          data-testid="btn-new-report"
          >Nuevo Informe Diario</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'daily-report-list'"
          [columns]="columns"
          [data]="reports"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            estado: statusTemplate,
          }"
          (rowClick)="viewReport($event)"
          (sortChange)="onSortChange($event)"
        >
        </aero-data-grid>
      </app-page-card>

      <!-- Status Badge Template -->
      <ng-template #statusTemplate let-row>
        <span class="status-badge status-{{ row.estado?.toLowerCase() }}">
          <i class="fa-solid" [ngClass]="getStatusIcon(row.estado)"></i>
          {{ getStatusLabel(row.estado) }}
        </span>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons" (click)="$event.stopPropagation()">
          <aero-button
            *ngIf="row.estado === 'PENDIENTE' || row.estado === 'BORRADOR'"
            variant="ghost"
            size="small"
            iconCenter="fa-check"
            title="Aprobar"
            (clicked)="approveReport($event, row)"
          ></aero-button>
          <aero-button
            *ngIf="row.estado === 'PENDIENTE' || row.estado === 'BORRADOR'"
            variant="ghost"
            size="small"
            iconCenter="fa-xmark"
            title="Rechazar"
            (clicked)="rejectReport($event, row)"
          ></aero-button>
          <aero-button
            *ngIf="puedeFirearResidente(row)"
            variant="ghost"
            size="small"
            iconCenter="fa-signature"
            title="Firmar como Residente"
            (clicked)="firmarResidente($event, row)"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-pen"
            title="Editar"
            (clicked)="editReport($event, row)"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-eye"
            title="Ver detalles"
            (clicked)="viewReport(row)"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            [iconCenter]="downloadingPdfId === row.id ? 'fa-spinner fa-spin' : 'fa-file-pdf'"
            title="Descargar PDF"
            [disabled]="downloadingPdfId === row.id"
            (clicked)="descargarPdf($event, row)"
          ></aero-button>
        </div>
      </ng-template>

      <div *ngIf="!loading && reports.length === 0" class="empty-state" data-testid="empty-state">
        <div class="empty-state__icon">
          <i class="fa-solid fa-clipboard-list"></i>
        </div>
        <h3 class="empty-state__title">No se encontraron partes diarios</h3>
        <p class="empty-state__description">
          Comience creando su primer parte diario para registrar el uso de equipos
        </p>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="createNewReport()"
          >Crear Parte Diario</aero-button
        >
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.2rem 0.625rem;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        white-space: nowrap;
      }

      .status-borrador {
        background: var(--grey-100);
        color: var(--grey-500);
      }

      .status-pendiente {
        background: var(--primary-100);
        color: var(--primary-500);
      }

      .status-aprobado,
      .status-aprobado_finanzas {
        background: var(--semantic-blue-100);
        color: var(--semantic-blue-500);
      }

      .status-rechazado {
        background: var(--grey-100);
        color: var(--accent-500);
      }

      .status-aprobado_supervisor {
        background: var(--semantic-blue-100);
        color: var(--semantic-blue-500);
      }

      .status-revisado_costos {
        background: var(--primary-100);
        color: var(--primary-500);
      }

      .action-buttons {
        display: flex;
        gap: var(--s-4);
        align-items: center;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background: var(--grey-100);
        border-radius: var(--radius-lg);
        border: 2px dashed var(--grey-300);
      }

      .empty-state__icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 1.5rem;
        background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .empty-state__icon i {
        font-size: 2rem;
        color: var(--primary-500);
      }

      .empty-state__title {
        margin: 0 0 0.5rem;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--grey-900);
      }

      .empty-state__description {
        margin: 0 0 1.5rem;
        font-size: 0.9375rem;
        color: var(--grey-500);
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
      }
    `,
  ],
})
export class DailyReportListComponent implements OnInit {
  tabs = EQUIPMENT_TABS;
  subtabs: TabItem[] = [
    { label: 'Lista', route: '/equipment/daily-reports', exact: true },
    { label: 'Recepción', route: '/equipment/daily-reports/reception', exact: true },
  ];
  private dailyReportService = inject(DailyReportService);
  private router = inject(Router);
  authService = inject(AuthService);
  excelService = inject(ExcelExportService);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  reports: DailyReport[] = [];
  loading = false;
  downloadingPdfId: number | null = null;

  filters = {
    status: '',
    date: '',
    equipment: '',
    project: '',
  };

  filterConfig: FilterConfig[] = [
    {
      key: 'equipment',
      label: 'Equipo',
      type: 'text',
      placeholder: 'Buscar por código o nombre de equipo...',
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Borrador', value: 'BORRADOR' },
        { label: 'Pendiente', value: 'PENDIENTE' },
        { label: 'Aprobado', value: 'APROBADO' },
        { label: 'Rechazado', value: 'RECHAZADO' },
      ],
    },
    {
      key: 'date',
      label: 'Fecha',
      type: 'date',
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'codigo_equipo', label: 'Equipo', type: 'text', sortable: true, filterable: true },
    {
      key: 'equipo_nombre',
      label: 'Nombre Equipo',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    { key: 'fecha_parte', label: 'Fecha', type: 'date', sortable: true, filterable: true },
    { key: 'trabajador_nombre', label: 'Operador', type: 'text', sortable: true, filterable: true },
    { key: 'hora_inicio', label: 'Hora Inicio', type: 'text', sortable: true, filterable: true },
    { key: 'hora_fin', label: 'Hora Fin', type: 'text', sortable: true, filterable: true },
    {
      key: 'diesel_gln',
      label: 'Combustible (gal)',
      type: 'number',
      sortable: true,
      filterable: true,
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'template',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Borrador', value: 'BORRADOR' },
        { label: 'Pendiente', value: 'PENDIENTE' },
        { label: 'Aprobado', value: 'APROBADO' },
        { label: 'Rechazado', value: 'RECHAZADO' },
      ],
    },

    // --- Legacy columns (hidden by default, visible via column chooser) ---
    { key: 'turno', label: 'Turno', type: 'text', hidden: true, sortable: true },
    {
      key: 'horometro_inicio',
      label: 'Hor\u00F3m. Inicio',
      type: 'number',
      hidden: true,
      sortable: true,
    },
    {
      key: 'horometro_fin',
      label: 'Hor\u00F3m. Fin',
      type: 'number',
      hidden: true,
      sortable: true,
    },
    {
      key: 'horas_trabajadas',
      label: 'Hrs. Trabajadas',
      type: 'number',
      hidden: true,
      sortable: true,
    },
    {
      key: 'horas_disponibles',
      label: 'Hrs. Disponibles',
      type: 'number',
      hidden: true,
      sortable: true,
    },
    {
      key: 'horas_mantenimiento',
      label: 'Hrs. Mant.',
      type: 'number',
      hidden: true,
      sortable: true,
    },
    { key: 'kilometraje_inicio', label: 'Km Inicio', type: 'number', hidden: true, sortable: true },
    { key: 'kilometraje_fin', label: 'Km Fin', type: 'number', hidden: true, sortable: true },
    {
      key: 'combustible_cantidad',
      label: 'Combustible Cant.',
      type: 'number',
      hidden: true,
      sortable: true,
    },
    {
      key: 'combustible_tipo',
      label: 'Tipo Combustible',
      type: 'text',
      hidden: true,
      sortable: true,
    },
    {
      key: 'ubicacion_trabajo',
      label: 'Ubicaci\u00F3n Trabajo',
      type: 'text',
      hidden: true,
      sortable: true,
    },
    { key: 'actividad_realizada', label: 'Actividad', type: 'text', hidden: true, sortable: true },
    { key: 'observaciones', label: 'Observaciones', type: 'text', hidden: true, sortable: true },
    { key: 'fecha_registro', label: 'Fecha Registro', type: 'date', hidden: true, sortable: true },
    {
      key: 'usuario_registro',
      label: 'Registrado por',
      type: 'text',
      hidden: true,
      sortable: true,
    },
  ];

  currentFilters: Record<string, string> = { status: '', date: '' };

  ngOnInit(): void {
    this.loadReports();
  }

  onSortChange(event: DataGridSortEvent): void {
    console.log('Sort changed:', event.column, event.direction);
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      BORRADOR: 'fa-solid fa-file',
      PENDIENTE: 'fa-solid fa-paper-plane',
      APROBADO: 'fa-solid fa-check-circle',
      RECHAZADO: 'fa-solid fa-times-circle',
      APROBADO_SUPERVISOR: 'fa-solid fa-user-clock',
      REVISADO_COSTOS: 'fa-solid fa-calculator',
      PENDIENTE_FINANZAS: 'fa-solid fa-coins',
      APROBADO_FINANZAS: 'fa-solid fa-file-invoice-dollar',
    };
    return icons[status] || 'fa-solid fa-file';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      PENDIENTE: 'Pendiente',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado',
      APROBADO_SUPERVISOR: 'Aprob. Supervisor',
      REVISADO_COSTOS: 'Rev. Costos',
      APROBADO_FINANZAS: 'Aprob. Finanzas',
    };
    return labels[status] || status;
  }

  onFilterChange(filters: Record<string, unknown>) {
    const typedFilters: Record<string, string> = {};
    for (const key of Object.keys(filters)) {
      typedFilters[key] = (filters[key] as string) || '';
    }
    this.currentFilters = { ...this.currentFilters, ...typedFilters };
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.dailyReportService.getAll(this.currentFilters).subscribe({
      next: (data) => {
        this.reports = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  viewReport(report: DailyReport): void {
    this.router.navigate(['/equipment/daily-reports', report.id]);
  }

  approveReport(event: Event, report: DailyReport): void {
    event.stopPropagation();
    this.dailyReportService.approve(report.id).subscribe({
      next: () => {
        this.loadReports();
      },
    });
  }

  rejectReport(event: Event, report: DailyReport): void {
    event.stopPropagation();
    const reason = prompt('Razón del rechazo:');
    if (reason) {
      this.dailyReportService.reject(report.id, reason).subscribe({
        next: () => {
          this.loadReports();
        },
      });
    }
  }

  puedeFirearResidente(report: DailyReport): boolean {
    const userRole = this.authService.getCurrentUserRole();
    if (!userRole) return false;

    // Admin, Director, or Residente can sign
    const hasPermission =
      userRole === 'ADMIN' ||
      userRole === 'DIRECTOR' ||
      userRole === 'RESIDENTE' ||
      userRole === 'SUPERVISOR';

    // Valid states: Sent by operator, partially approved, or fully approved but missing signature
    const validState = ['ENVIADO', 'APROBADO_SUPERVISOR', 'REVISADO_COSTOS', 'APROBADO'].includes(
      report.estado
    );
    const missingSignature = !report.firma_residente;

    return hasPermission && validState && missingSignature;
  }

  firmarResidente(event: Event, report: DailyReport): void {
    event.stopPropagation();
    const user = this.authService.currentUser;
    const nombreResidente = user
      ? user.nombre_completo ||
        `${user.nombres || ''} ${user.apellidos || ''}`.trim() ||
        'Residente'
      : 'Residente';
    this.confirmSvc
      .confirm({
        title: 'Confirmar Firma',
        message: `¿Confirma su firma como Residente en el parte #${report.id}?`,
        icon: 'fa-signature',
        confirmLabel: 'Firmar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.dailyReportService.firmarResidente(report.id, nombreResidente).subscribe({
            next: () => this.loadReports(),
            error: (err) => {
              console.error('Error al firmar como residente', err);
              this.snackBar.open('Error al registrar la firma.', 'Cerrar', { duration: 3000 });
            },
          });
        }
      });
  }

  editReport(event: Event, report: DailyReport): void {
    event.stopPropagation();
    this.router.navigate(['/equipment/daily-reports', report.id, 'edit']);
  }

  descargarPdf(event: Event, report: DailyReport): void {
    event.stopPropagation();
    if (this.downloadingPdfId !== null) return;
    this.downloadingPdfId = report.id;
    this.dailyReportService.downloadPdf(report.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `parte-diario-${report.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloadingPdfId = null;
      },
      error: (err) => {
        console.error('Error al descargar PDF:', err);
        this.downloadingPdfId = null;
      },
    });
  }

  createNewReport(): void {
    this.router.navigate(['/equipment/daily-reports/new']);
  }

  handleExport(format: ExportFormat): void {
    if (format === 'excel') {
      this.exportToExcel();
    } else if (format === 'csv') {
      this.exportToCSV();
    }
  }

  exportToExcel(): void {
    if (this.reports.length === 0) {
      this.snackBar.open('No hay partes diarios para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.reports.map((report) => {
      const startTime = new Date(`1970-01-01T${report.hora_inicio}`);
      const endTime = new Date(`1970-01-01T${report.hora_fin}`);
      const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      return {
        ID: report.id || '',
        Equipo: report.codigo_equipo || '',
        Operador: report.trabajador_nombre || '',
        Fecha: report.fecha_parte ? new Date(report.fecha_parte).toLocaleDateString('es-PE') : '',
        'Hora Inicio': report.hora_inicio || '',
        'Hora Fin': report.hora_fin || '',
        'Horas Trabajadas': hoursWorked.toFixed(2),
        'Horómetro Inicial': report.horometro_inicial || 0,
        'Horómetro Final': report.horometro_final || 0,
        'Combustible (gal)': report.diesel_gln || 0,
        Estado: report.estado || '',
        Observaciones: report.observaciones || '',
        Creado: report.created_at ? new Date(report.created_at).toLocaleDateString('es-PE') : '',
      };
    });

    this.excelService.exportToExcel(exportData, {
      filename: 'partes_diarios',
      sheetName: 'Partes Diarios',
    });
  }

  exportToCSV(): void {
    if (this.reports.length === 0) {
      this.snackBar.open('No hay partes diarios para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.reports.map((report) => {
      const startTime = new Date(`1970-01-01T${report.hora_inicio}`);
      const endTime = new Date(`1970-01-01T${report.hora_fin}`);
      const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      return {
        ID: report.id || '',
        Equipo: report.codigo_equipo || '',
        Operador: report.trabajador_nombre || '',
        Fecha: report.fecha_parte ? new Date(report.fecha_parte).toLocaleDateString('es-PE') : '',
        'Hora Inicio': report.hora_inicio || '',
        'Hora Fin': report.hora_fin || '',
        'Horas Trabajadas': hoursWorked.toFixed(2),
        'Horómetro Inicial': report.horometro_inicial || 0,
        'Horómetro Final': report.horometro_final || 0,
        'Combustible (gal)': report.diesel_gln || 0,
        Estado: report.estado || '',
        Observaciones: report.observaciones || '',
        Creado: report.created_at ? new Date(report.created_at).toLocaleDateString('es-PE') : '',
      };
    });

    this.excelService.exportToCSV(exportData, 'partes_diarios');
  }
}
