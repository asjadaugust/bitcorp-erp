import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServiceWorkerService } from '../../../core/services/service-worker.service';
import { SyncManager } from '../../../core/services/sync-manager.service';

@Component({
  selector: 'app-offline-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="offline-indicator"
      [class.offline]="!isOnline()"
      [class.has-pending]="pendingCount() > 0"
    >
      <!-- Offline Banner -->
      <div class="offline-banner" *ngIf="!isOnline()">
        <span class="icon">📡</span>
        <span class="text">Sin conexión - Los datos se guardarán localmente</span>
      </div>

      <!-- Pending Sync Badge -->
      <div
        class="pending-badge"
        *ngIf="pendingCount() > 0"
        (click)="syncNow()"
        (keydown.enter)="syncNow()"
        tabindex="0"
        role="button"
      >
        <span class="icon">🔄</span>
        <span class="count">{{ pendingCount() }}</span>
        <span class="text" *ngIf="isOnline()">pendientes - toca para sincronizar</span>
        <span class="text" *ngIf="!isOnline()">guardados offline</span>
        <span class="details-link" (click)="goToDetails($event)">(ver detalles)</span>
      </div>

      <!-- Dead letter badge -->
      <div
        class="dead-letter-badge"
        *ngIf="deadLetterCount() > 0"
        (click)="retryDeadLetters()"
        (keydown.enter)="retryDeadLetters()"
        tabindex="0"
        role="button"
      >
        <span class="icon">⚠️</span>
        <span class="count">{{ deadLetterCount() }}</span>
        <span class="text">fallidos - toca para reintentar</span>
      </div>

      <!-- Sync in progress -->
      <div class="syncing-indicator" *ngIf="isSyncing()">
        <span class="spinner">⏳</span>
        <span class="text">Sincronizando...</span>
      </div>
    </div>
  `,
  styles: [
    `
      .offline-indicator {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        font-family: var(--font-family);
      }

      .offline-banner {
        background: linear-gradient(90deg, #ef4444, #dc2626);
        color: white;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        animation: slideDown 0.3s ease;

        .icon {
          font-size: 16px;
        }
      }

      .pending-badge {
        background: linear-gradient(90deg, #f59e0b, #d97706);
        color: white;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: linear-gradient(90deg, #d97706, #b45309);
        }

        .count {
          background: white;
          color: #d97706;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 700;
          min-width: 24px;
          text-align: center;
        }
      }

      .dead-letter-badge {
        background: linear-gradient(90deg, #ef4444, #dc2626);
        color: white;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: linear-gradient(90deg, #dc2626, #b91c1c);
        }

        .count {
          background: white;
          color: #dc2626;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 700;
          min-width: 24px;
          text-align: center;
        }
      }

      .syncing-indicator {
        background: linear-gradient(90deg, #3b82f6, #2563eb);
        color: white;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;

        .spinner {
          animation: spin 1s linear infinite;
        }
      }

      .details-link {
        text-decoration: underline;
        cursor: pointer;
        opacity: 0.8;
        font-size: 12px;
        margin-left: 4px;
      }

      .details-link:hover {
        opacity: 1;
      }

      @keyframes slideDown {
        from {
          transform: translateY(-100%);
        }
        to {
          transform: translateY(0);
        }
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {
  private swService = inject(ServiceWorkerService);
  private syncManager = inject(SyncManager);
  private router = inject(Router);

  isOnline = signal(navigator.onLine);
  pendingCount = signal(0);
  deadLetterCount = signal(0);
  isSyncing = signal(false);

  private onlineHandler = () => this.isOnline.set(true);
  private offlineHandler = () => this.isOnline.set(false);
  private checkInterval: ReturnType<typeof setInterval> | undefined;

  ngOnInit() {
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);

    // Check pending count periodically
    this.updatePendingCount();
    this.checkInterval = setInterval(() => this.updatePendingCount(), 5000);
  }

  ngOnDestroy() {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  async updatePendingCount() {
    try {
      const count = await this.syncManager.getPendingCount();
      this.pendingCount.set(count);
      const dlCount = await this.syncManager.getDeadLetterCount();
      this.deadLetterCount.set(dlCount);
    } catch {
      // IndexedDB may not be initialized yet
    }
  }

  async syncNow() {
    if (!this.isOnline() || this.isSyncing()) return;

    this.isSyncing.set(true);
    try {
      await this.swService.syncPendingReports();
      await this.updatePendingCount();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      this.isSyncing.set(false);
    }
  }

  goToDetails(event: Event) {
    event.stopPropagation();
    this.router.navigate(['/operator/pending-reports']);
  }

  async retryDeadLetters() {
    if (!this.isOnline() || this.isSyncing()) return;

    try {
      const deadLetters = await this.syncManager.getDeadLetters();
      for (const dl of deadLetters) {
        await this.syncManager.retryDeadLetter(dl['id'] as number);
      }
      // Trigger sync after resetting
      await this.syncNow();
    } catch (e) {
      console.error('Retry dead letters failed:', e);
    }
  }
}
