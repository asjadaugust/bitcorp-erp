import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SyncManager } from '../../../core/services/sync-manager.service';
import { ServiceWorkerService } from '../../../core/services/service-worker.service';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AeroBadgeComponent } from '../../../core/design-system/badge/aero-badge.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../../shared/components/stats-grid/stats-grid.component';

interface PendingReport {
  id: number;
  fecha_parte: string;
  equipo_id: number;
  horometro_inicial: number;
  horometro_final: number;
  observaciones: string;
  timestamp: number;
  syncAttempts: number;
  lastSyncAttempt: number | null;
  deadLetter: number;
  deadLetteredAt: number | null;
}

@Component({
  selector: 'app-operator-pending-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageLayoutComponent,
    ButtonComponent,
    AeroBadgeComponent,
    StatsGridComponent,
  ],
  template: `
    <app-page-layout title="Reportes Pendientes" icon="fa-clock-rotate-left">
      <p class="subtitle">Gestionar reportes guardados sin conexion</p>

      <app-stats-grid [items]="statItems()" testId="pending-stats"></app-stats-grid>

      <!-- Pending Reports Section -->
      @if (pendingReports().length > 0) {
        <div class="section">
          <div class="section-header">
            <h3><i class="fa-solid fa-clock"></i> En cola de sincronizacion</h3>
            <app-button
              variant="primary"
              icon="fa-rotate"
              label="Sincronizar todo"
              [disabled]="isSyncing() || !isOnline()"
              (clicked)="syncAll()"
            ></app-button>
          </div>

          <div class="report-cards">
            @for (report of pendingReports(); track report.id) {
              <div class="report-card pending" [attr.data-testid]="'pending-report-' + report.id">
                <div class="card-header">
                  <span class="card-date">
                    <i class="fa-solid fa-calendar"></i>
                    {{ report.fecha_parte || 'Sin fecha' }}
                  </span>
                  <aero-badge variant="warning">Pendiente</aero-badge>
                </div>
                <div class="card-body">
                  <div class="card-detail">
                    <i class="fa-solid fa-truck"></i>
                    Equipo #{{ report.equipo_id }}
                  </div>
                  @if (report.horometro_inicial) {
                    <div class="card-detail">
                      <i class="fa-solid fa-gauge"></i>
                      Horometro: {{ report.horometro_inicial }} → {{ report.horometro_final }}
                    </div>
                  }
                  <div class="card-meta">
                    Guardado: {{ formatTimeAgo(report.timestamp) }} · Intentos:
                    {{ report.syncAttempts }}/5
                  </div>
                </div>
                <div class="card-actions">
                  <app-button
                    variant="danger"
                    size="sm"
                    icon="fa-trash"
                    label="Eliminar"
                    (clicked)="deleteReport(report)"
                  ></app-button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Dead Letters Section -->
      @if (deadLetters().length > 0) {
        <div class="section">
          <div class="section-header">
            <h3><i class="fa-solid fa-triangle-exclamation"></i> Fallidos (requieren atencion)</h3>
            <app-button
              variant="secondary"
              icon="fa-rotate"
              label="Reintentar todos"
              [disabled]="isSyncing() || !isOnline()"
              (clicked)="retryAll()"
            ></app-button>
          </div>

          <div class="report-cards">
            @for (report of deadLetters(); track report.id) {
              <div class="report-card dead-letter" [attr.data-testid]="'dead-letter-' + report.id">
                <div class="card-header">
                  <span class="card-date">
                    <i class="fa-solid fa-calendar"></i>
                    {{ report.fecha_parte || 'Sin fecha' }}
                  </span>
                  <aero-badge variant="error">Fallido</aero-badge>
                </div>
                <div class="card-body">
                  <div class="card-detail">
                    <i class="fa-solid fa-truck"></i>
                    Equipo #{{ report.equipo_id }}
                  </div>
                  @if (report.horometro_inicial) {
                    <div class="card-detail">
                      <i class="fa-solid fa-gauge"></i>
                      Horometro: {{ report.horometro_inicial }} → {{ report.horometro_final }}
                    </div>
                  }
                  <div class="card-meta">
                    Fallo: {{ formatTimeAgo(report.deadLetteredAt) }} ·
                    {{ report.syncAttempts }} intentos agotados
                  </div>
                </div>
                <div class="card-actions">
                  <app-button
                    variant="primary"
                    size="sm"
                    icon="fa-rotate"
                    label="Reintentar"
                    [disabled]="isSyncing() || !isOnline()"
                    (clicked)="retryOne(report)"
                  ></app-button>
                  <app-button
                    variant="danger"
                    size="sm"
                    icon="fa-trash"
                    label="Eliminar"
                    (clicked)="deleteReport(report)"
                  ></app-button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (pendingReports().length === 0 && deadLetters().length === 0) {
        <div class="empty-state" data-testid="empty-state">
          <i class="fa-solid fa-circle-check empty-icon"></i>
          <h3>Todo sincronizado</h3>
          <p>No hay reportes pendientes. Todos los datos estan al dia.</p>
          <app-button
            variant="primary"
            icon="fa-plus"
            label="Nuevo Parte Diario"
            routerLink="/operator/daily-report"
          ></app-button>
        </div>
      }

      <!-- Syncing overlay -->
      @if (isSyncing()) {
        <div class="syncing-overlay">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <span>Sincronizando...</span>
        </div>
      }
    </app-page-layout>
  `,
  styles: [
    `
      .subtitle {
        color: var(--grey-500);
        margin: 0 0 24px 0;
      }

      .section {
        margin-top: 24px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--grey-700);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .report-cards {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .report-card {
        background: var(--neutral-0);
        border-radius: var(--radius-md);
        border: 1px solid var(--grey-200);
        padding: 16px;
        transition: box-shadow 0.2s;
      }

      .report-card:hover {
        box-shadow: var(--shadow-sm);
      }

      .report-card.pending {
        border-left: 4px solid var(--semantic-yellow-500, #f59e0b);
      }

      .report-card.dead-letter {
        border-left: 4px solid var(--semantic-red-500, #ef4444);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .card-date {
        font-weight: 600;
        color: var(--grey-700);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .card-body {
        margin-bottom: 12px;
      }

      .card-detail {
        color: var(--grey-600);
        font-size: 14px;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .card-detail i {
        width: 16px;
        text-align: center;
        color: var(--grey-400);
      }

      .card-meta {
        font-size: 13px;
        color: var(--grey-400);
        margin-top: 8px;
      }

      .card-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid var(--grey-100);
      }

      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--grey-500);
      }

      .empty-icon {
        font-size: 48px;
        color: var(--semantic-green-500, #22c55e);
        margin-bottom: 16px;
      }

      .empty-state h3 {
        margin: 0 0 8px 0;
        color: var(--grey-700);
      }

      .empty-state p {
        margin: 0 0 24px 0;
      }

      .syncing-overlay {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        background: var(--primary-50, #eff6ff);
        border-radius: var(--radius-md);
        color: var(--primary-700, #1d4ed8);
        font-weight: 500;
        margin-top: 16px;
      }
    `,
  ],
})
export class OperatorPendingReportsComponent implements OnInit, OnDestroy {
  private syncManager = inject(SyncManager);
  private swService = inject(ServiceWorkerService);

  pendingReports = signal<PendingReport[]>([]);
  deadLetters = signal<PendingReport[]>([]);
  isSyncing = signal(false);
  isOnline = signal(navigator.onLine);

  statItems = computed<StatItem[]>(() => [
    {
      label: 'Pendientes',
      value: this.pendingReports().length,
      icon: 'fa-clock',
      color: 'warning',
    },
    {
      label: 'Fallidos',
      value: this.deadLetters().length,
      icon: 'fa-triangle-exclamation',
      color: 'danger',
    },
    {
      label: 'Total en cola',
      value: this.pendingReports().length + this.deadLetters().length,
      icon: 'fa-layer-group',
      color: 'info',
    },
  ]);

  private checkInterval: ReturnType<typeof setInterval> | undefined;
  private onlineHandler = () => this.isOnline.set(true);
  private offlineHandler = () => this.isOnline.set(false);

  ngOnInit() {
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    this.loadReports();
    this.checkInterval = setInterval(() => this.loadReports(), 5000);
  }

  ngOnDestroy() {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
    if (this.checkInterval) clearInterval(this.checkInterval);
  }

  async loadReports() {
    try {
      const allPending = await this.syncManager.getPendingReports();
      // Filter: pending reports exclude dead letters
      this.pendingReports.set(
        allPending.filter((r) => r['deadLetter'] !== 1).map((r) => r as unknown as PendingReport)
      );

      const dead = await this.syncManager.getDeadLetters();
      this.deadLetters.set(dead.map((r) => r as unknown as PendingReport));
    } catch {
      // IndexedDB may not be initialized
    }
  }

  async syncAll() {
    if (!this.isOnline() || this.isSyncing()) return;
    this.isSyncing.set(true);
    try {
      await this.swService.syncPendingReports();
      await this.loadReports();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      this.isSyncing.set(false);
    }
  }

  async retryOne(report: PendingReport) {
    if (!this.isOnline() || this.isSyncing()) return;
    this.isSyncing.set(true);
    try {
      await this.syncManager.retryDeadLetter(report.id);
      await this.swService.syncPendingReports();
      await this.loadReports();
    } catch (e) {
      console.error('Retry failed:', e);
    } finally {
      this.isSyncing.set(false);
    }
  }

  async retryAll() {
    if (!this.isOnline() || this.isSyncing()) return;
    this.isSyncing.set(true);
    try {
      const deadLetters = await this.syncManager.getDeadLetters();
      for (const dl of deadLetters) {
        await this.syncManager.retryDeadLetter(dl['id'] as number);
      }
      await this.swService.syncPendingReports();
      await this.loadReports();
    } catch (e) {
      console.error('Retry all failed:', e);
    } finally {
      this.isSyncing.set(false);
    }
  }

  async deleteReport(report: PendingReport) {
    if (!confirm('¿Eliminar este reporte? Esta acción no se puede deshacer.')) return;
    try {
      await this.syncManager.deleteSyncedReport(report.id);
      await this.syncManager.deletePhotosForReport(report.id);
      await this.loadReports();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  }

  formatTimeAgo(timestamp: number | null): string {
    if (!timestamp) return 'desconocido';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'hace unos segundos';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  }
}
