import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SyncManager } from '../../../core/services/sync-manager.service';
import {
  StatsGridComponent,
  StatItem,
} from '../../../shared/components/stats-grid/stats-grid.component';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import { AeroButtonComponent, AeroBadgeComponent } from '../../../core/design-system';

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
  imports: [
    CommonModule,
    RouterModule,
    StatsGridComponent,
    PageLayoutComponent,
    AeroButtonComponent,
    AeroBadgeComponent,
  ],
  template: `
    <app-page-layout title="Portal del Operador" icon="fa-hard-hat">
      <p class="subtitle">Bienvenido, {{ operatorName }}</p>

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

        @if (pendingCount() > 0) {
          <a routerLink="/operator/pending-reports" class="action-card warning">
            <i class="fa-solid fa-clock-rotate-left action-icon"></i>
            <div class="content">
              <h3>{{ pendingCount() }} Pendientes</h3>
              <p>Reportes sin sincronizar</p>
            </div>
          </a>
        }
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
              <aero-badge [variant]="getBadgeVariant(report.status)">
                {{ getStatusLabel(report.status) }}
              </aero-badge>
            </div>
          </div>

          <div *ngIf="recentReports.length === 0" class="empty-state">
            <i class="fa-solid fa-file-pen empty-icon"></i>
            <p>No hay partes diarios registrados</p>
            <aero-button iconLeft="fa-plus" variant="primary" routerLink="/operator/daily-report"
              >Crear primer parte</aero-button
            >
          </div>
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .subtitle {
        font-size: 16px;
        color: var(--grey-700);
        margin: 0 0 24px 0;
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
        background: var(--grey-100);
        border-radius: var(--radius-md, 12px);
        box-shadow: var(--shadow-sm);
        text-decoration: none;
        transition: all 0.2s;
        border: 2px solid transparent;
      }

      .action-card:hover {
        box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15));
        transform: translateY(-2px);
      }

      .action-card.primary {
        background: linear-gradient(135deg, var(--primary-500) 0%, var(--klm-blue) 100%);
        color: var(--grey-100);
      }

      .action-card.primary:hover {
        box-shadow: 0 4px 16px color-mix(in srgb, var(--primary-500) 40%, transparent);
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

      .action-card:not(.primary):not(.warning) .action-icon {
        color: var(--primary-500);
      }

      .action-card.warning {
        border-color: var(--accent-500, #f59e0b);
        background: linear-gradient(135deg, #fffbeb, #fef3c7);
      }

      .action-card.warning .action-icon {
        color: var(--grey-900, #d97706);
      }

      .action-card.warning .content h3 {
        color: var(--grey-900, #92400e);
      }

      .action-card.warning .content p {
        color: var(--grey-900, #a16207);
      }

      .recent-section {
        background: var(--grey-100);
        border-radius: var(--radius-md, 12px);
        padding: 24px;
        box-shadow: var(--shadow-sm);
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

      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class OperatorDashboardComponent implements OnInit {
  private syncManager = inject(SyncManager);
  operatorName = 'Juan Pérez';
  pendingCount = signal(0);
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
    this.syncManager.getPendingCount().then((c) => this.pendingCount.set(c));
    this.syncManager.getDeadLetterCount().then((c) => this.pendingCount.update((v) => v + c));
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

  getBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
      BORRADOR: 'warning',
      ENVIADO: 'info',
      APROBADO: 'success',
    };
    return variants[status] || 'neutral';
  }
}
