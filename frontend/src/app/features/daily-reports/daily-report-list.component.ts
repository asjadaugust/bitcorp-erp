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
  AeroCardComponent,
  CardInfoItem,
} from '../../shared/components/aero-card/aero-card.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-daily-report-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
    AeroCardComponent,
  ],
  template: `
    <app-page-layout
      title="Partes Diarios"
      icon="fa-clipboard-list"
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

        <button
          type="button"
          class="btn btn-primary"
          (click)="createNewReport()"
          data-testid="btn-new-report"
        >
          <i class="fa-solid fa-file-pen"></i> Nuevo Informe Diario
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <div *ngIf="!loading && reports.length > 0" class="reports-grid" data-testid="reports-grid">
        <app-aero-card
          *ngFor="let report of reports"
          [title]="report.equipo_nombre || report.codigo_equipo || 'Sin Equipo'"
          [subtitle]="'Cod: #' + report.id"
          [icon]="'fa-solid fa-truck-front'"
          [statusLabel]="getStatusLabel(report.estado)"
          [statusClass]="report.estado"
          [statusIcon]="getStatusIcon(report.estado)"
          [date]="report.fecha_parte"
          [timestamp]="report.created_at"
          [infoItems]="getReportInfoItems(report)"
          [observations]="report.observaciones ? (report.observaciones | slice: 0 : 100) : ''"
          (cardClick)="viewReport(report)"
          [attr.data-testid]="'report-card-' + report.id"
        >
          <div actions>
            <button
              *ngIf="report.estado === 'PENDIENTE' || report.estado === 'BORRADOR'"
              type="button"
              class="report-card__btn report-card__btn--approve"
              (click)="approveReport($event, report)"
              title="Aprobar"
              data-testid="btn-approve"
            >
              <i class="fa-solid fa-check"></i>
            </button>
            <button
              *ngIf="report.estado === 'PENDIENTE' || report.estado === 'BORRADOR'"
              type="button"
              class="report-card__btn report-card__btn--reject"
              (click)="rejectReport($event, report)"
              title="Rechazar"
              data-testid="btn-reject"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
            <button
              *ngIf="puedeFirearResidente(report)"
              type="button"
              class="report-card__btn report-card__btn--sign"
              (click)="firmarResidente($event, report)"
              title="Firmar como Residente"
              data-testid="btn-firmar-residente"
            >
              <i class="fa-solid fa-signature"></i>
            </button>
            <button
              type="button"
              class="report-card__btn report-card__btn--edit"
              (click)="editReport($event, report)"
              title="Editar"
              data-testid="btn-edit"
            >
              <i class="fa-solid fa-pen"></i>
            </button>
            <button
              type="button"
              class="report-card__btn report-card__btn--view"
              (click)="viewReport(report)"
              title="Ver detalles"
              data-testid="btn-view"
            >
              <i class="fa-solid fa-eye"></i>
            </button>
            <button
              type="button"
              class="report-card__btn report-card__btn--pdf"
              (click)="descargarPdf($event, report)"
              [disabled]="downloadingPdfId === report.id"
              title="Descargar PDF"
              [attr.data-testid]="'btn-download-pdf-' + report.id"
            >
              <i
                class="fa-solid"
                [class.fa-file-pdf]="downloadingPdfId !== report.id"
                [class.fa-spinner]="downloadingPdfId === report.id"
                [class.fa-spin]="downloadingPdfId === report.id"
              ></i>
            </button>
          </div>
        </app-aero-card>
      </div>

      <div *ngIf="!loading && reports.length === 0" class="empty-state" data-testid="empty-state">
        <div class="empty-state__icon">
          <i class="fa-solid fa-clipboard-list"></i>
        </div>
        <h3 class="empty-state__title">No se encontraron partes diarios</h3>
        <p class="empty-state__description">
          Comience creando su primer parte diario para registrar el uso de equipos
        </p>
        <button type="button" class="btn btn-primary" (click)="createNewReport()">
          <i class="fa-solid fa-plus"></i> Crear Parte Diario
        </button>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      /* Grid Layout */
      .reports-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.25rem;
      }

      /* Report Card */
      .report-card {
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        border: 1px solid #e8e8e8;
        cursor: pointer;
        transition: all 0.2s ease;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .report-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border-color: #d0d0d0;
      }

      /* Card Header */
      .report-card__header {
        padding: 1rem 1.25rem;
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        border-bottom: 1px solid #f0f0f0;
      }

      .report-card__status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .report-card__status {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .report-card__status--draft {
        background: #f5f5f5;
        color: #666666;
      }

      .report-card__status--submitted {
        background: #e3f2fd;
        color: #1565c0;
      }

      .report-card__status--approved,
      .report-card__status--finance_approved {
        background: #e8f5e9;
        color: #2e7d32;
      }

      .report-card__status--rejected {
        background: #ffebee;
        color: #c62828;
      }

      .report-card__status--pending_supervisor,
      .report-card__status--pending_cost_engineer,
      .report-card__status--pending_finance {
        background: #fff3e0;
        color: #e65100;
      }

      .report-card__status--supervisor_approved {
        background: #e8f5e9;
        color: #388e3c;
      }

      .report-card__status--cost_reviewed {
        background: #e1f5fe;
        color: #0277bd;
      }

      .report-card__date {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        color: #666666;
      }

      .report-card__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #1a1a1a;
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Card Body */
      .report-card__body {
        padding: 1rem 1.25rem;
        flex: 1;
      }

      .report-card__info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.875rem;
      }

      .report-card__info-item {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .report-card__info-item i {
        font-size: 0.875rem;
        color: #9e9e9e;
        margin-bottom: 0.125rem;
      }

      .report-card__info-label {
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #9e9e9e;
        font-weight: 500;
      }

      .report-card__info-value {
        font-size: 0.875rem;
        color: #333333;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .report-card__info-value--highlight {
        color: #1565c0;
        font-weight: 700;
      }

      .report-card__observations {
        margin-top: 0.875rem;
        padding-top: 0.875rem;
        border-top: 1px dashed #e8e8e8;
      }

      .report-card__observations p {
        margin: 0;
        font-size: 0.8125rem;
        color: #666666;
        line-height: 1.5;
      }

      /* Card Footer */
      .report-card__footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.25rem;
        background: #fafafa;
        border-top: 1px solid #f0f0f0;
      }

      .report-card__timestamp {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.75rem;
        color: #9e9e9e;
      }

      .report-card__actions {
        display: flex;
        gap: 0.5rem;
      }

      .report-card__btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
        font-size: 0.875rem;
      }

      .report-card__btn--approve {
        background: #e8f5e9;
        color: #2e7d32;
      }

      .report-card__btn--approve:hover {
        background: #2e7d32;
        color: white;
      }

      .report-card__btn--reject {
        background: #ffebee;
        color: #c62828;
      }

      .report-card__btn--reject:hover {
        background: #c62828;
        color: white;
      }

      .report-card__btn--edit {
        background: #e3f2fd;
        color: #1565c0;
      }

      .report-card__btn--edit:hover {
        background: #1565c0;
        color: white;
      }

      .report-card__btn--view {
        background: #f5f5f5;
        color: #666666;
      }

      .report-card__btn--view:hover {
        background: #666666;
        color: white;
      }

      .report-card__btn--sign {
        background: #e8f5e9;
        color: #2e7d32;
      }

      .report-card__btn--sign:hover {
        background: #2e7d32;
        color: white;
      }

      .report-card__btn--pdf {
        background: #fff3e0;
        color: #e65100;
      }

      .report-card__btn--pdf:hover {
        background: #e65100;
        color: white;
      }

      .report-card__btn--pdf:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background: white;
        border-radius: 12px;
        border: 2px dashed #e0e0e0;
      }

      .empty-state__icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 1.5rem;
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .empty-state__icon i {
        font-size: 2rem;
        color: #1565c0;
      }

      .empty-state__title {
        margin: 0 0 0.5rem;
        font-size: 1.25rem;
        font-weight: 600;
        color: #333333;
      }

      .empty-state__description {
        margin: 0 0 1.5rem;
        font-size: 0.9375rem;
        color: #666666;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
      }

      /* Actions Container */
      .actions-container {
        display: flex;
        gap: var(--s-8);
        align-items: center;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .reports-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .report-card__info-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .report-card__actions {
          gap: 0.375rem;
        }

        .report-card__btn {
          width: 28px;
          height: 28px;
          font-size: 0.8125rem;
        }
      }
    `,
  ],
})
export class DailyReportListComponent implements OnInit {
  private dailyReportService = inject(DailyReportService);
  private router = inject(Router);
  authService = inject(AuthService);
  excelService = inject(ExcelExportService);

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

  currentFilters: any = { status: '', date: '' };

  ngOnInit(): void {
    this.loadReports();
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

  onFilterChange(filters: any) {
    this.currentFilters = { ...this.currentFilters, ...filters };
    this.loadReports();
  }

  getReportInfoItems(report: DailyReport): CardInfoItem[] {
    return [
      {
        icon: 'fa-solid fa-hard-hat',
        label: 'Operador',
        value: report.trabajador_nombre || 'Sin asignar',
      },
      {
        icon: 'fa-solid fa-clock',
        label: 'Horario',
        value: `${report.hora_inicio || '--:--'} - ${report.hora_fin || '--:--'}`,
      },
      {
        icon: 'fa-solid fa-gas-pump',
        label: 'Combustible',
        value: `${report.diesel_gln || 0} gal`,
      },
      {
        icon: 'fa-solid fa-gauge-high',
        label: 'Horas',
        value: `${report.horas_trabajadas || report.horometro_diferencia || 0}h`,
        highlight: true,
      },
    ];
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
    if (confirm(`¿Confirma su firma como Residente en el parte #${report.id}?`)) {
      this.dailyReportService.firmarResidente(report.id, nombreResidente).subscribe({
        next: () => this.loadReports(),
        error: (err) => {
          console.error('Error al firmar como residente', err);
          alert('Error al registrar la firma.');
        },
      });
    }
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
      alert('No hay partes diarios para exportar');
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
      alert('No hay partes diarios para exportar');
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
