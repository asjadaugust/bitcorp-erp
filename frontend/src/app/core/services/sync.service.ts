import { Injectable, inject, signal } from '@angular/core';
import { interval, fromEvent, merge } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { OfflineDBService, OfflineDailyReport } from './offline-db.service';
import { DailyReportService } from './daily-report.service';

export interface SyncStatus {
  isSyncing: boolean;
  isOnline: boolean;
  lastSync?: Date;
  pendingCount: number;
  failedCount: number;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  private offlineDB = inject(OfflineDBService);
  private dailyReportService = inject(DailyReportService);

  syncStatus = signal<SyncStatus>({
    isSyncing: false,
    isOnline: navigator.onLine,
    pendingCount: 0,
    failedCount: 0,
  });

  constructor() {
    this.initializeSync();
    this.monitorOnlineStatus();
  }

  private initializeSync(): void {
    // Auto-sync every 5 minutes when online
    interval(5 * 60 * 1000)
      .pipe(
        filter(() => navigator.onLine && !this.syncStatus().isSyncing),
        switchMap(() => this.syncPendingReports())
      )
      .subscribe();

    // Update pending count on startup
    this.updateSyncStatus();
  }

  private monitorOnlineStatus(): void {
    merge(fromEvent(window, 'online'), fromEvent(window, 'offline')).subscribe(() => {
      this.updateOnlineStatus();
      if (navigator.onLine) {
        // Attempt sync when coming online
        this.syncPendingReports();
      }
    });
  }

  private updateOnlineStatus(): void {
    this.syncStatus.update((status) => ({
      ...status,
      isOnline: navigator.onLine,
    }));
  }

  async syncPendingReports(): Promise<void> {
    if (!navigator.onLine || this.syncStatus().isSyncing) {
      return;
    }

    this.syncStatus.update((status) => ({
      ...status,
      isSyncing: true,
      error: undefined,
    }));

    try {
      const pendingReports = await this.offlineDB.getPendingReports();

      for (const report of pendingReports) {
        try {
          await this.syncSingleReport(report);
        } catch (error) {
          console.error('Failed to sync report:', report.localId, error);
          await this.offlineDB.markSyncFailed(
            report.localId,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }

      this.syncStatus.update((status) => ({
        ...status,
        lastSync: new Date(),
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      this.syncStatus.update((status) => ({
        ...status,
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
    } finally {
      this.syncStatus.update((status) => ({
        ...status,
        isSyncing: false,
      }));
      await this.updateSyncStatus();
    }
  }

  private async syncSingleReport(report: OfflineDailyReport): Promise<void> {
    const reportData = {
      fecha_parte: report.fecha_parte,
      trabajador_id: report.trabajador_id,
      equipo_id: report.equipo_id,
      proyecto_id: report.proyecto_id,
      hora_inicio: report.hora_inicio,
      hora_fin: report.hora_fin,
      horometro_inicial: report.horometro_inicial,
      horometro_final: report.horometro_final,
      odometro_inicial: report.odometro_inicial,
      odometro_final: report.odometro_final,
      diesel_gallons: report.fuel_start || report.diesel_gallons,
      gasoline_gallons: report.fuel_end || report.gasoline_gallons,
      departure_location: report.location || report.departure_location,
      observations: report.work_description || report.observations,
      estado: report.status === 'BORRADOR' ? 'BORRADOR' : 'ENVIADO',
    };

    return new Promise((resolve, reject) => {
      this.dailyReportService.create(reportData as any).subscribe({
        next: async (response) => {
          if ((response as any).success && (response as any).data) {
            await this.offlineDB.markAsSynced(report.localId, (response as any).data.id);
          }
          resolve();
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }

  async saveReportOffline(
    report: Omit<
      OfflineDailyReport,
      'id' | 'localId' | 'synced' | 'syncAttempts' | 'createdAt' | 'updatedAt'
    >
  ): Promise<string> {
    const localId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const offlineReport: Omit<OfflineDailyReport, 'id'> = {
      ...report,
      localId,
      synced: false,
      syncAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.offlineDB.saveDailyReport(offlineReport);
    await this.updateSyncStatus();

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncPendingReports();
    }

    return localId;
  }

  async updateReportOffline(localId: string, updates: Partial<OfflineDailyReport>): Promise<void> {
    const report = await this.offlineDB.getDailyReportByLocalId(localId);
    if (report && report.id) {
      await this.offlineDB.updateDailyReport(report.id, {
        ...updates,
        synced: false, // Mark as needs sync
      });
      await this.updateSyncStatus();

      // Try to sync if online
      if (navigator.onLine) {
        this.syncPendingReports();
      }
    }
  }

  async getOfflineReports(): Promise<OfflineDailyReport[]> {
    return await this.offlineDB.getAllDailyReports();
  }

  async getDraftReports(): Promise<OfflineDailyReport[]> {
    return await this.offlineDB.getDraftReports();
  }

  async deleteOfflineReport(localId: string): Promise<void> {
    const report = await this.offlineDB.getDailyReportByLocalId(localId);
    if (report && report.id) {
      await this.offlineDB.deleteDailyReport(report.id);
      await this.updateSyncStatus();
    }
  }

  private async updateSyncStatus(): Promise<void> {
    const stats = await this.offlineDB.getStatistics();

    this.syncStatus.update((status) => ({
      ...status,
      pendingCount: stats.pending,
      failedCount: 0, // Can enhance to track failed separately
    }));
  }

  async forceSyncNow(): Promise<void> {
    return this.syncPendingReports();
  }

  async clearOldSyncedData(daysOld = 30): Promise<number> {
    return await this.offlineDB.deleteOldSyncedReports(daysOld);
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  getPendingCount(): number {
    return this.syncStatus().pendingCount;
  }
}
