import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DailyReportService } from '../../../core/services/daily-report.service';
import { DailyReport } from '../../../core/models/daily-report.model';
import { AuthService } from '../../../core/services/auth.service';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AeroBadgeComponent } from '../../../core/design-system/badge/aero-badge.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmService } from '../../../core/services/confirm.service';

interface HistoryReport {
  id: number;
  date: string;
  rawDate: Date;
  project: string;
  equipment: string;
  hours: number;
  status: 'BORRADOR' | 'ENVIADO' | 'APROBADO' | 'RECHAZADO';
}

@Component({
  selector: 'app-operator-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DropdownComponent,
    PageLayoutComponent,
    ButtonComponent,
    AeroBadgeComponent,
  ],
  template: `
    <app-page-layout title="Historial de Partes" icon="fa-history">
      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <span class="label">Período:</span>
          <app-dropdown
            [(ngModel)]="selectedPeriod"
            [options]="periodOptions"
            (ngModelChange)="filterReports()"
          ></app-dropdown>
        </div>

        <div class="filter-group">
          <span class="label">Estado:</span>
          <app-dropdown
            [(ngModel)]="selectedStatus"
            [options]="statusOptions"
            (ngModelChange)="filterReports()"
          ></app-dropdown>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="summary-stats">
        <div class="stat-item" data-testid="summary-total">
          <span class="stat-label">Total Partes:</span>
          <span class="stat-value">{{ filteredReports.length }}</span>
        </div>
        <div class="stat-item" data-testid="summary-hours">
          <span class="stat-label">Horas Totales:</span>
          <span class="stat-value">{{ calculateTotalHours() }}h</span>
        </div>
        <div class="stat-item" data-testid="summary-approved">
          <span class="stat-label">Aprobados:</span>
          <span class="stat-value">{{ countByStatus('APROBADO') }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state" data-testid="loading-state">
        <i class="fa-solid fa-spinner fa-spin loading-icon"></i>
        <p>Cargando historial...</p>
      </div>

      <!-- Reports List -->
      <div class="reports-list" *ngIf="!loading">
        <div
          *ngFor="let report of filteredReports"
          class="report-card"
          [class.clickable]="report.status === 'BORRADOR'"
          data-testid="report-card"
        >
          <div class="report-main">
            <div class="report-icon" [class]="'status-' + report.status">
              <i *ngIf="report.status === 'BORRADOR'" class="fa-solid fa-file-pen"></i>
              <i *ngIf="report.status === 'ENVIADO'" class="fa-solid fa-clock"></i>
              <i *ngIf="report.status === 'APROBADO'" class="fa-solid fa-circle-check"></i>
              <i *ngIf="report.status === 'RECHAZADO'" class="fa-solid fa-circle-xmark"></i>
            </div>

            <div class="report-info">
              <div class="report-title">{{ report.equipment }}</div>
              <div class="report-meta">
                <span class="meta-item"
                  ><i class="fa-regular fa-calendar"></i> {{ report.date }}</span
                >
                <span class="meta-item"
                  ><i class="fa-solid fa-hard-hat"></i> {{ report.project }}</span
                >
                <span class="meta-item"
                  ><i class="fa-regular fa-clock"></i> {{ report.hours }}h</span
                >
              </div>
            </div>

            <div class="report-status">
              <aero-badge [variant]="getBadgeVariant(report.status)" data-testid="report-status">
                {{ getStatusLabel(report.status) }}
              </aero-badge>
            </div>
          </div>

          <div class="report-actions">
            <app-button
              *ngIf="report.status === 'BORRADOR'"
              variant="outline-primary"
              icon="fa-pen-to-square"
              label="Editar"
              size="sm"
              [attr.data-testid]="'btn-edit-' + report.id"
              (clicked)="editReport(report)"
            ></app-button>
            <app-button
              variant="ghost"
              icon="fa-eye"
              label="Ver"
              size="sm"
              [attr.data-testid]="'btn-view-' + report.id"
              (clicked)="viewReport(report)"
            ></app-button>
            <app-button
              variant="ghost"
              icon="fa-file-pdf"
              label="PDF"
              size="sm"
              [attr.data-testid]="'btn-download-' + report.id"
              (clicked)="downloadPdf(report)"
            ></app-button>
            <app-button
              *ngIf="report.status === 'BORRADOR'"
              variant="outline-danger"
              icon="fa-trash"
              size="sm"
              [attr.data-testid]="'btn-delete-' + report.id"
              (clicked)="deleteReport(report)"
            ></app-button>
          </div>
        </div>

        <div *ngIf="filteredReports.length === 0" class="empty-state" data-testid="empty-state">
          <i class="fa-solid fa-clipboard-list empty-icon"></i>
          <p>No se encontraron partes diarios</p>
          <app-button
            label="Crear nuevo parte"
            icon="fa-plus"
            variant="primary"
            routerLink="/operator/daily-report"
          ></app-button>
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .filters-bar {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        padding: 16px;
        background: var(--grey-100);
        border-radius: 8px;
        box-shadow: var(--shadow-sm);
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .filter-group .label {
        font-size: 14px;
        font-weight: 500;
        color: var(--grey-900);
      }

      .summary-stats {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        padding: 16px;
        background: var(--grey-100);
        border-radius: 8px;
        box-shadow: var(--shadow-sm);
      }

      .stat-item {
        flex: 1;
        display: flex;
        justify-content: space-between;
        padding: 12px;
        background: var(--grey-100);
        border-radius: 6px;
      }

      .stat-label {
        font-size: 14px;
        color: var(--grey-700);
      }

      .stat-value {
        font-size: 18px;
        font-weight: 700;
        color: var(--primary-500);
      }

      .loading-state {
        text-align: center;
        padding: 64px 24px;
        color: var(--grey-700);
      }

      .loading-icon {
        font-size: 32px;
        color: var(--primary-500);
        display: block;
        margin-bottom: 16px;
      }

      .reports-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .report-card {
        background: var(--grey-100);
        border-radius: var(--radius-md, 12px);
        padding: 20px;
        box-shadow: var(--shadow-sm);
        transition: all 0.2s;
      }

      .report-card.clickable:hover {
        box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15));
      }

      .report-main {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
      }

      .report-icon {
        font-size: 20px;
        margin-right: 16px;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
      }

      .report-icon.status-BORRADOR {
        background: var(--grey-100);
        color: var(--accent-500);
      }

      .report-icon.status-ENVIADO {
        background: var(--primary-100);
        color: var(--primary-500);
      }

      .report-icon.status-APROBADO {
        background: var(--semantic-blue-100);
        color: var(--semantic-blue-500);
      }

      .report-icon.status-RECHAZADO {
        background: var(--grey-100);
        color: var(--accent-500);
      }

      .report-info {
        flex: 1;
      }

      .report-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--primary-900);
        margin-bottom: 8px;
      }

      .report-meta {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }

      .meta-item {
        font-size: 13px;
        color: var(--grey-700);
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .meta-item i {
        font-size: 12px;
      }

      .report-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .empty-state {
        text-align: center;
        padding: 64px 24px;
        background: var(--grey-100);
        border-radius: var(--radius-md, 12px);
      }

      .empty-icon {
        font-size: 48px;
        color: var(--grey-300);
        display: block;
        margin-bottom: 16px;
      }

      .empty-state p {
        color: var(--grey-700);
        margin-bottom: 20px;
        font-size: 16px;
      }

      @media (max-width: 768px) {
        .filters-bar {
          flex-direction: column;
        }

        .summary-stats {
          flex-direction: column;
        }

        .report-main {
          flex-wrap: wrap;
        }

        .report-status {
          width: 100%;
          margin-top: 12px;
        }
      }
    `,
  ],
})
export class OperatorHistoryComponent implements OnInit {
  private router = inject(Router);
  private dailyReportService = inject(DailyReportService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private confirmSvc = inject(ConfirmService);

  selectedPeriod = 'month';
  selectedStatus = 'all';
  loading = true;

  allReports: HistoryReport[] = [];
  filteredReports: HistoryReport[] = [];

  periodOptions: DropdownOption[] = [
    { label: 'Última Semana', value: 'week' },
    { label: 'Último Mes', value: 'month' },
    { label: 'Último Trimestre', value: 'quarter' },
    { label: 'Último Año', value: 'year' },
    { label: 'Todos', value: 'all' },
  ];

  statusOptions: DropdownOption[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Borradores', value: 'BORRADOR' },
    { label: 'Enviados', value: 'ENVIADO' },
    { label: 'Aprobados', value: 'APROBADO' },
    { label: 'Rechazados', value: 'RECHAZADO' },
  ];

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.loading = true;

    // Get current user's operator ID
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.loading = false;
      return;
    }

    // Fetch reports from API
    this.dailyReportService.getAll().subscribe({
      next: (reports: DailyReport[]) => {
        // Map API response to local interface
        this.allReports = reports.map((report: DailyReport) => {
          const rawDate = new Date(report.fecha_parte);
          return {
            id: report.id,
            date: rawDate.toLocaleDateString('es-PE'),
            rawDate,
            project: report.proyecto_nombre || report.lugar_salida || 'Sin ubicación',
            equipment:
              report.equipo_nombre || report.codigo_equipo || `Equipo #${report.equipo_id}`,
            hours:
              Number(report.horas_trabajadas) ||
              (Number(report.horometro_final) || 0) - (Number(report.horometro_inicial) || 0) ||
              0,
            status: (report.estado === 'PENDIENTE' ? 'ENVIADO' : report.estado) as
              | 'BORRADOR'
              | 'ENVIADO'
              | 'APROBADO'
              | 'RECHAZADO',
          };
        });
        this.filterReports();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.loading = false;
      },
    });
  }

  filterReports() {
    let filtered = [...this.allReports];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter((r) => r.status === this.selectedStatus);
    }

    // Filter by period
    if (this.selectedPeriod !== 'all') {
      const now = new Date();
      const periodDays: Record<string, number> = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365,
      };
      const days = periodDays[this.selectedPeriod];
      if (days) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((r) => r.rawDate >= cutoff);
      }
    }

    this.filteredReports = filtered;
  }

  calculateTotalHours(): number {
    return this.filteredReports.reduce((sum, report) => Number(sum) + Number(report.hours), 0);
  }

  countByStatus(status: string): number {
    return this.filteredReports.filter((r) => r.status === status).length;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      ENVIADO: 'Enviado',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado',
    };
    return labels[status] || status;
  }

  getBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
      BORRADOR: 'warning',
      ENVIADO: 'info',
      APROBADO: 'success',
      RECHAZADO: 'error',
    };
    return variants[status] || 'neutral';
  }

  viewReport(report: HistoryReport) {
    this.router.navigate(['/operator/daily-report', report.id]);
  }

  editReport(report: HistoryReport) {
    // Only allow editing drafts
    if (report.status === 'BORRADOR') {
      this.router.navigate(['/operator/daily-report'], {
        queryParams: { editId: report.id },
      });
    }
  }

  deleteReport(report: HistoryReport) {
    this.confirmSvc.confirmDelete('este borrador').subscribe((confirmed) => {
      if (confirmed) {
        this.dailyReportService.delete(report.id).subscribe({
          next: () => {
            this.allReports = this.allReports.filter((r) => r.id !== report.id);
            this.filterReports();
          },
          error: (err) => {
            console.error('Error al eliminar el parte diario:', err);
            this.snackBar.open('Error al eliminar el parte diario. Inténtelo de nuevo.', 'Cerrar', {
              duration: 5000,
            });
          },
        });
      }
    });
  }

  downloadPdf(report: HistoryReport) {
    this.dailyReportService.downloadPdf(report.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `parte_diario_${report.date}_${report.equipment}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading PDF:', err);
        this.snackBar.open('Error al descargar el PDF', 'Cerrar', { duration: 5000 });
      },
    });
  }
}
