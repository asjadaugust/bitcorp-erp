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
  imports: [CommonModule, RouterModule, FormsModule, DropdownComponent],
  template: `
    <div class="history-container">
      <header class="history-header">
        <h1>Historial de Partes Diarios</h1>
        <p class="subtitle">Registro histórico de trabajos realizados</p>
      </header>

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
              <span
                class="status-badge"
                [class]="'badge-' + report.status"
                data-testid="report-status"
              >
                {{ getStatusLabel(report.status) }}
              </span>
            </div>
          </div>

          <div class="report-actions">
            <button
              *ngIf="report.status === 'BORRADOR'"
              class="action-btn edit"
              [attr.data-testid]="'btn-edit-' + report.id"
              (click)="editReport(report)"
            >
              <i class="fa-solid fa-pen-to-square"></i> Editar
            </button>
            <button
              class="action-btn view"
              [attr.data-testid]="'btn-view-' + report.id"
              (click)="viewReport(report)"
            >
              <i class="fa-solid fa-eye"></i> Ver
            </button>
            <button
              class="action-btn download"
              [attr.data-testid]="'btn-download-' + report.id"
              (click)="downloadPdf(report)"
            >
              <i class="fa-solid fa-file-pdf"></i> PDF
            </button>
            <button
              *ngIf="report.status === 'BORRADOR'"
              class="action-btn delete"
              [attr.data-testid]="'btn-delete-' + report.id"
              (click)="deleteReport(report)"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div *ngIf="filteredReports.length === 0" class="empty-state" data-testid="empty-state">
          <i class="fa-solid fa-clipboard-list empty-icon"></i>
          <p>No se encontraron partes diarios</p>
          <a routerLink="/operator/daily-report" class="btn-link">Crear nuevo parte</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .history-container {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .history-header {
        margin-bottom: 24px;
      }

      .history-header h1 {
        font-size: 28px;
        font-weight: 600;
        color: var(--primary-900);
        margin: 0 0 8px 0;
      }

      .subtitle {
        font-size: 16px;
        color: var(--grey-700);
        margin: 0;
      }

      .filters-bar {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        padding: 16px;
        background: var(--neutral-0);
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .filter-group .label {
        font-size: 14px;
        font-weight: 500;
        color: var(--grey-800);
      }

      .summary-stats {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        padding: 16px;
        background: var(--neutral-0);
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
        background: var(--neutral-0);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.2s;
      }

      .report-card.clickable:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
        background: var(--semantic-yellow-100);
        color: var(--semantic-yellow-500);
      }

      .report-icon.status-ENVIADO {
        background: var(--primary-100);
        color: var(--primary-500);
      }

      .report-icon.status-APROBADO {
        background: var(--semantic-green-100);
        color: var(--semantic-green-500);
      }

      .report-icon.status-RECHAZADO {
        background: var(--semantic-red-100);
        color: var(--semantic-red-500);
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

      .status-badge {
        padding: 6px 14px;
        border-radius: 14px;
        font-size: 13px;
        font-weight: 600;
      }

      .badge-BORRADOR {
        background: var(--semantic-yellow-100);
        color: var(--semantic-yellow-700);
      }

      .badge-ENVIADO {
        background: var(--semantic-blue-100);
        color: var(--primary-500);
      }

      .badge-APROBADO {
        background: var(--semantic-green-100);
        color: var(--semantic-green-500);
      }

      .badge-RECHAZADO {
        background: var(--semantic-red-100);
        color: var(--semantic-red-500);
      }

      .report-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .action-btn {
        padding: 8px 16px;
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        background: var(--neutral-0);
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .action-btn:hover {
        background: var(--grey-100);
      }

      .action-btn.edit {
        border-color: var(--primary-500);
        color: var(--primary-500);
      }

      .action-btn.edit:hover {
        background: var(--primary-100);
      }

      .action-btn.delete {
        border-color: var(--semantic-red-500);
        color: var(--semantic-red-500);
      }

      .action-btn.delete:hover {
        background: var(--semantic-red-100);
      }

      .empty-state {
        text-align: center;
        padding: 64px 24px;
        background: var(--neutral-0);
        border-radius: 12px;
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

      .btn-link {
        display: inline-block;
        padding: 12px 24px;
        background: var(--primary-500);
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .btn-link:hover {
        background: var(--primary-800);
      }

      @media (max-width: 768px) {
        .history-container {
          padding: 16px;
        }

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
    if (confirm('¿Está seguro de eliminar este borrador?')) {
      this.dailyReportService.delete(report.id).subscribe({
        next: () => {
          this.allReports = this.allReports.filter((r) => r.id !== report.id);
          this.filterReports();
        },
        error: (err) => {
          console.error('Error al eliminar el parte diario:', err);
          alert('Error al eliminar el parte diario. Inténtelo de nuevo.');
        },
      });
    }
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
        alert('Error al descargar el PDF');
      },
    });
  }
}
