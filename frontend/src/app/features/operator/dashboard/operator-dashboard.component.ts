import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  StatsGridComponent,
  StatItem,
} from '../../../shared/components/stats-grid/stats-grid.component';

interface DashboardStats {
  todayReports: number;
  weekReports: number;
  monthReports: number;
  totalHours: number;
}

interface RecentReport {
  id: number;
  date: string;
  equipment: string;
  hours: number;
  status: 'BORRADOR' | 'ENVIADO' | 'APROBADO';
}

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatsGridComponent],
  template: `
    <div class="operator-dashboard">
      <header class="dashboard-header">
        <h1>Panel de Operador</h1>
        <p class="subtitle">Bienvenido, {{ operatorName }}</p>
      </header>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <a routerLink="/operator/daily-report" class="action-card primary">
          <i class="fa-solid fa-plus action-icon"></i>
          <div class="content">
            <h3>Nuevo Parte Diario</h3>
            <p>Registrar trabajo de hoy</p>
          </div>
        </a>

        <a routerLink="/operator/history" class="action-card">
          <i class="fa-solid fa-clipboard-list action-icon"></i>
          <div class="content">
            <h3>Ver Historial</h3>
            <p>Partes anteriores</p>
          </div>
        </a>
      </div>

      <app-stats-grid [items]="statItems" testId="operator-stats"></app-stats-grid>

      <!-- Recent Reports -->
      <div class="recent-section">
        <h2>Partes Recientes</h2>
        <div class="reports-list">
          <div *ngFor="let report of recentReports" class="report-item">
            <div class="report-icon" [class]="'status-' + report.status">
              <i *ngIf="report.status === 'BORRADOR'" class="fa-solid fa-file-pen"></i>
              <i *ngIf="report.status === 'ENVIADO'" class="fa-solid fa-clock"></i>
              <i *ngIf="report.status === 'APROBADO'" class="fa-solid fa-circle-check"></i>
            </div>
            <div class="report-info">
              <div class="report-title">{{ report.equipment }}</div>
              <div class="report-meta">{{ report.date }} &bull; {{ report.hours }}h</div>
            </div>
            <div class="report-status">
              <span class="status-badge" [class]="'badge-' + report.status">
                {{ getStatusLabel(report.status) }}
              </span>
            </div>
          </div>

          <div *ngIf="recentReports.length === 0" class="empty-state">
            <i class="fa-solid fa-file-pen empty-icon"></i>
            <p>No hay partes diarios registrados</p>
            <a routerLink="/operator/daily-report" class="btn-link">Crear primer parte</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .operator-dashboard {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .dashboard-header {
        margin-bottom: 32px;
      }

      .dashboard-header h1 {
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

      .quick-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }

      .action-card {
        display: flex;
        align-items: center;
        padding: 24px;
        background: var(--neutral-0);
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        text-decoration: none;
        transition: all 0.2s;
        border: 2px solid transparent;
      }

      .action-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }

      .action-card.primary {
        background: linear-gradient(135deg, var(--primary-500) 0%, var(--klm-blue) 100%);
        color: white;
      }

      .action-card.primary:hover {
        box-shadow: 0 4px 16px rgba(0, 119, 205, 0.4);
      }

      .action-icon {
        font-size: 32px;
        margin-right: 16px;
        width: 40px;
        text-align: center;
      }

      .action-card .content h3 {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .action-card .content p {
        margin: 0;
        font-size: 14px;
        opacity: 0.8;
      }

      .action-card:not(.primary) .content h3 {
        color: var(--primary-900);
      }

      .action-card:not(.primary) .content p {
        color: var(--grey-700);
      }

      .action-card:not(.primary) .action-icon {
        color: var(--primary-500);
      }

      .recent-section {
        background: var(--neutral-0);
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .recent-section h2 {
        margin: 0 0 20px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--primary-900);
      }

      .reports-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .report-item {
        display: flex;
        align-items: center;
        padding: 16px;
        background: var(--grey-100);
        border-radius: 8px;
        transition: all 0.2s;
      }

      .report-item:hover {
        background: var(--grey-200);
      }

      .report-icon {
        font-size: 20px;
        margin-right: 16px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
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

      .report-info {
        flex: 1;
      }

      .report-title {
        font-weight: 600;
        color: var(--primary-900);
        margin-bottom: 4px;
      }

      .report-meta {
        font-size: 13px;
        color: var(--grey-700);
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
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

      .empty-state {
        text-align: center;
        padding: 48px 24px;
      }

      .empty-icon {
        font-size: 48px;
        color: var(--grey-300);
        display: block;
        margin-bottom: 16px;
      }

      .empty-state p {
        color: var(--grey-700);
        margin-bottom: 16px;
      }

      .btn-link {
        display: inline-block;
        padding: 10px 20px;
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
        .operator-dashboard {
          padding: 16px;
        }

        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class OperatorDashboardComponent implements OnInit {
  operatorName = 'Juan Pérez';
  statItems: StatItem[] = [];

  stats: DashboardStats = {
    todayReports: 1,
    weekReports: 5,
    monthReports: 22,
    totalHours: 176,
  };

  recentReports: RecentReport[] = [
    {
      id: 1,
      date: '08/11/2025',
      equipment: 'Excavadora CAT 320',
      hours: 8,
      status: 'APROBADO',
    },
    {
      id: 2,
      date: '07/11/2025',
      equipment: 'Retroexcavadora JCB 3CX',
      hours: 7.5,
      status: 'ENVIADO',
    },
    {
      id: 3,
      date: '06/11/2025',
      equipment: 'Excavadora CAT 320',
      hours: 8,
      status: 'APROBADO',
    },
  ];

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.statItems = [
      {
        label: 'Hoy',
        value: this.stats.todayReports,
        icon: 'fa-file-signature',
        color: 'primary',
        testId: 'today-reports',
      },
      {
        label: 'Esta Semana',
        value: this.stats.weekReports,
        icon: 'fa-chart-bar',
        color: 'info',
        testId: 'week-reports',
      },
      {
        label: 'Este Mes',
        value: this.stats.monthReports,
        icon: 'fa-chart-line',
        color: 'success',
        testId: 'month-reports',
      },
      {
        label: 'Horas Totales',
        value: `${this.stats.totalHours}h`,
        icon: 'fa-clock',
        color: 'warning',
        testId: 'total-hours',
      },
    ];
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      ENVIADO: 'Enviado',
      APROBADO: 'Aprobado',
    };
    return labels[status] || status;
  }
}
