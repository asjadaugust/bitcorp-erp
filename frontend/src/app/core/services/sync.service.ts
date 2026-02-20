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
      fecha: report.fecha_parte,
      trabajador_id: Number(report.trabajador_id),
      equipo_id: Number(report.equipo_id),
      proyecto_id: report.proyecto_id ? Number(report.proyecto_id) : null,
      hora_inicio: report.hora_inicio,
      hora_fin: report.hora_fin,
      horometro_inicial: Number(report.horometro_inicial),
      horometro_final: Number(report.horometro_final),
      odometro_inicial: report.odometro_inicial ? Number(report.odometro_inicial) : null,
      odometro_final: report.odometro_final ? Number(report.odometro_final) : null,
      combustible_inicial: Number(report.fuel_start || report.combustible_inicial || 0),
      // Map PWA names to backend names
      lugar_salida: report.location || report.lugar_salida || 'Obra',
      observaciones: report.work_description || report.observaciones || 'Sin observaciones',
      estado: report.status === 'BORRADOR' ? 'BORRADOR' : 'PENDIENTE',
      gps_latitude: report.gps_latitude ? Number(report.gps_latitude) : null,
      gps_longitude: report.gps_longitude ? Number(report.gps_longitude) : null,
      weather_conditions: report.weather_conditions || null,
    };

    return new Promise((resolve, reject) => {
      this.dailyReportService.create(reportData as any).subscribe({
        next: async (response) => {
          // Check for success property or data property as common in this project's API responses
          const res = response as any;
          if (res && (res.id || (res.data && res.data.id))) {
            const serverId = res.id || res.data.id;
            await this.offlineDB.markAsSynced(report.localId, serverId);
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
