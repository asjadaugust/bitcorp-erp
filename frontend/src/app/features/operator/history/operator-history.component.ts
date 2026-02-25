import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DailyReportService } from '../../../core/services/daily-report.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';

interface HistoryReport {
  id: number;
  date: string;
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
        <div class="stat-item">
          <span class="stat-label">Total Partes:</span>
          <span class="stat-value">{{ filteredReports.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Horas Totales:</span>
          <span class="stat-value">{{ calculateTotalHours() }}h</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Aprobados:</span>
          <span class="stat-value">{{ countByStatus('APROBADO') }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <span class="loading-icon">⏳</span>
        <p>Cargando historial...</p>
      </div>

      <!-- Reports List -->
      <div class="reports-list" *ngIf="!loading">
        <div
          *ngFor="let report of filteredReports"
          class="report-card"
          [class.clickable]="report.status === 'BORRADOR'"
        >
          <div class="report-main">
            <div class="report-icon" [class]="'status-' + report.status">
              <span *ngIf="report.status === 'BORRADOR'">📝</span>
              <span *ngIf="report.status === 'ENVIADO'">⏳</span>
              <span *ngIf="report.status === 'APROBADO'">✅</span>
              <span *ngIf="report.status === 'RECHAZADO'">❌</span>
            </div>

            <div class="report-info">
              <div class="report-title">{{ report.equipment }}</div>
              <div class="report-meta">
                <span class="meta-item">📅 {{ report.date }}</span>
                <span class="meta-item">🏗️ {{ report.project }}</span>
                <span class="meta-item">⏱️ {{ report.hours }}h</span>
              </div>
            </div>

            <div class="report-status">
              <span class="status-badge" [class]="'badge-' + report.status">
                {{ getStatusLabel(report.status) }}
              </span>
            </div>
          </div>

          <div class="report-actions">
            <button
              *ngIf="report.status === 'BORRADOR'"
              class="action-btn edit"
              (click)="editReport(report)"
            >
              ✏️ Editar
            </button>
            <button class="action-btn view" (click)="viewReport(report)">👁️ Ver</button>
            <button class="action-btn download" (click)="downloadPdf(report)">📥 PDF</button>
            <button
              *ngIf="report.status === 'BORRADOR'"
              class="action-btn delete"
              (click)="deleteReport(report)"
            >
              🗑️
            </button>
          </div>
        </div>

        <div *ngIf="filteredReports.length === 0" class="empty-state">
          <span class="empty-icon">📋</span>
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
        color: #072b45;
        margin: 0 0 8px 0;
      }

      .subtitle {
        font-size: 16px;
        color: #6b7280;
        margin: 0;
      }

      .filters-bar {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        padding: 16px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .filter-group label {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }

      .filter-select {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
      }

      .summary-stats {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        padding: 16px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .stat-item {
        flex: 1;
        display: flex;
        justify-content: space-between;
        padding: 12px;
        background: #f9fafb;
        border-radius: 6px;
      }

      .stat-label {
        font-size: 14px;
        color: #6b7280;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 700;
        color: #0077cd;
      }

      .reports-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .report-card {
        background: white;
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
        font-size: 32px;
        margin-right: 16px;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
      }

      .report-icon.status-BORRADOR {
        background: rgba(255, 158, 24, 0.1);
      }

      .report-icon.status-ENVIADO {
        background: rgba(0, 119, 205, 0.1);
      }

      .report-icon.status-APROBADO {
        background: rgba(0, 168, 98, 0.1);
      }

      .report-icon.status-RECHAZADO {
        background: rgba(229, 25, 55, 0.1);
      }

      .report-info {
        flex: 1;
      }

      .report-title {
        font-size: 16px;
        font-weight: 600;
        color: #072b45;
        margin-bottom: 8px;
      }

      .report-meta {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }

      .meta-item {
        font-size: 13px;
        color: #6b7280;
      }

      .status-badge {
        padding: 6px 14px;
        border-radius: 14px;
        font-size: 13px;
        font-weight: 600;
      }

      .badge-BORRADOR {
        background: #fff4e6;
        color: #f59e0b;
      }

      .badge-ENVIADO {
        background: #e6f2ff;
        color: #0077cd;
      }

      .badge-APROBADO {
        background: #d1fae5;
        color: #059669;
      }

      .badge-RECHAZADO {
        background: #fee2e2;
        color: #dc2626;
      }

      .report-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .action-btn {
        padding: 8px 16px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-btn:hover {
        background: #f3f4f6;
      }

      .action-btn.edit {
        border-color: #0077cd;
        color: #0077cd;
      }

      .action-btn.edit:hover {
        background: #e6f2ff;
      }

      .action-btn.delete {
        border-color: #e51937;
        color: #e51937;
      }

      .action-btn.delete:hover {
        background: #fee2e2;
      }

      .empty-state {
        text-align: center;
        padding: 64px 24px;
        background: white;
        border-radius: 12px;
      }

      .empty-icon {
        font-size: 80px;
        display: block;
        margin-bottom: 16px;
      }

      .empty-state p {
        color: #6b7280;
        margin-bottom: 20px;
        font-size: 16px;
      }

      .btn-link {
        display: inline-block;
        padding: 12px 24px;
        background: #0077cd;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .btn-link:hover {
        background: #005fa3;
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
      next: (reports) => {
        // Map API response to local interface
        this.allReports = reports.map((report: Record<string, unknown>) => ({
          id: report.id,
          date: new Date((report['fecha_parte'] as string) || (report['reportDate'] as string)).toLocaleDateString('es-PE'),
          project: (report['location'] as string) || 'Sin ubicación',
          equipment:
            (report['equipment_name'] as string) || (report['equipment_code'] as string) || `Equipo #${report['equipo_id']}`,
          hours:
            (report['worked_hours'] as number) ||
            ((report['horometro_final'] as number) || 0) - ((report['horometro_inicial'] as number) || 0) ||
            0,
          status: report['estado'] as 'BORRADOR' | 'ENVIADO' | 'APROBADO' | 'RECHAZADO',
        }));
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

    // TODO: Filter by period

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
    // For now, show alert with report details
    // TODO: Create a view-only report detail component
    alert(
      `Parte Diario #${report.id}\nFecha: ${report.date}\nEquipo: ${report.equipment}\nHoras: ${report.hours}h\nEstado: ${this.getStatusLabel(report.status)}`
    );
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
      // TODO: Call API to delete
      this.allReports = this.allReports.filter((r) => r.id !== report.id);
      this.filterReports();
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
