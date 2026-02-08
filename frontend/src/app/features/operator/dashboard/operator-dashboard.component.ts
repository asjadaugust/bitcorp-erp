import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
  status: 'draft' | 'submitted' | 'approved';
}

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="operator-dashboard">
      <header class="dashboard-header">
        <h1>Panel de Operador</h1>
        <p class="subtitle">Bienvenido, {{ operatorName }}</p>
      </header>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <a routerLink="/operator/daily-report" class="action-card primary">
          <span class="icon">➕</span>
          <div class="content">
            <h3>Nuevo Parte Diario</h3>
            <p>Registrar trabajo de hoy</p>
          </div>
        </a>

        <a routerLink="/operator/history" class="action-card">
          <span class="icon">📋</span>
          <div class="content">
            <h3>Ver Historial</h3>
            <p>Partes anteriores</p>
          </div>
        </a>
      </div>

      <!-- Statistics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.todayReports }}</div>
            <div class="stat-label">Hoy</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.weekReports }}</div>
            <div class="stat-label">Esta Semana</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.monthReports }}</div>
            <div class="stat-label">Este Mes</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalHours }}h</div>
            <div class="stat-label">Horas Totales</div>
          </div>
        </div>
      </div>

      <!-- Recent Reports -->
      <div class="recent-section">
        <h2>Partes Recientes</h2>
        <div class="reports-list">
          <div *ngFor="let report of recentReports" class="report-item">
            <div class="report-icon" [class]="'status-' + report.status">
              <span *ngIf="report.status === 'draft'">📝</span>
              <span *ngIf="report.status === 'submitted'">⏳</span>
              <span *ngIf="report.status === 'approved'">✅</span>
            </div>
            <div class="report-info">
              <div class="report-title">{{ report.equipment }}</div>
              <div class="report-meta">{{ report.date }} • {{ report.hours }}h</div>
            </div>
            <div class="report-status">
              <span class="status-badge" [class]="'badge-' + report.status">
                {{ getStatusLabel(report.status) }}
              </span>
            </div>
          </div>

          <div *ngIf="recentReports.length === 0" class="empty-state">
            <span class="empty-icon">📝</span>
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
        color: var(--grey-500);
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

      .action-card .icon {
        font-size: 40px;
        margin-right: 16px;
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
        color: var(--grey-500);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }

      .stat-card {
        background: var(--neutral-0);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        font-size: 36px;
        margin-right: 16px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--primary-500);
        line-height: 1;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 13px;
        color: var(--grey-500);
        font-weight: 500;
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
        font-size: 28px;
        margin-right: 16px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
      }

      .report-icon.status-draft {
        background: rgba(255, 158, 24, 0.1);
      }

      .report-icon.status-submitted {
        background: rgba(0, 119, 205, 0.1);
      }

      .report-icon.status-approved {
        background: rgba(0, 168, 98, 0.1);
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
        color: var(--grey-500);
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .badge-draft {
        background: #fff4e6;
        color: #f59e0b;
      }

      .badge-submitted {
        background: #e6f2ff;
        color: var(--primary-500);
      }

      .badge-approved {
        background: #d1fae5;
        color: #059669;
      }

      .empty-state {
        text-align: center;
        padding: 48px 24px;
      }

      .empty-icon {
        font-size: 64px;
        display: block;
        margin-bottom: 16px;
      }

      .empty-state p {
        color: var(--grey-500);
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
      status: 'approved',
    },
    {
      id: 2,
      date: '07/11/2025',
      equipment: 'Retroexcavadora JCB 3CX',
      hours: 7.5,
      status: 'submitted',
    },
    {
      id: 3,
      date: '06/11/2025',
      equipment: 'Excavadora CAT 320',
      hours: 8,
      status: 'approved',
    },
  ];

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // TODO: Load from API
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      submitted: 'Enviado',
      approved: 'Aprobado',
    };
    return labels[status] || status;
  }
}
