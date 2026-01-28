import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface OfflineDailyReport {
  id?: number;
  localId: string;
  fecha_parte: string;
  trabajador_id: string;
  equipo_id: string;
  proyecto_id?: string;
  hora_inicio: string;
  hora_fin: string;
  horometro_inicial: number;
  horometro_final: number;
  odometro_inicial?: number;
  odometro_final?: number;
  fuel_start?: number;
  fuel_end?: number;
  diesel_gallons?: number;
  gasoline_gallons?: number;
  location?: string;
  departure_location?: string;
  arrival_location?: string;
  work_description?: string;
  observations?: string;
  notes?: string;
  weather_conditions?: string;
  photos?: string[];
  status: 'draft' | 'submitted' | 'synced' | 'failed';
  synced: boolean;
  syncAttempts: number;
  lastSyncAttempt?: Date;
  syncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncQueue {
  id?: number;
  reportLocalId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  createdAt: Date;
  attempts: number;
  lastAttempt?: Date;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OfflineDBService extends Dexie {
  dailyReports!: Table<OfflineDailyReport, number>;
  syncQueue!: Table<SyncQueue, number>;

  constructor() {
    super('BitcorpERPOffline');

    this.version(1).stores({
      dailyReports:
        '++id, localId, fecha_parte, trabajador_id, equipo_id, status, synced, createdAt',
      syncQueue: '++id, reportLocalId, action, createdAt, attempts',
    });
  }

  // Daily Reports CRUD
  async saveDailyReport(report: Omit<OfflineDailyReport, 'id'>): Promise<number> {
    return await this.dailyReports.add(report as OfflineDailyReport);
  }

  async getDailyReport(id: number): Promise<OfflineDailyReport | undefined> {
    return await this.dailyReports.get(id);
  }

  async getDailyReportByLocalId(localId: string): Promise<OfflineDailyReport | undefined> {
    return await this.dailyReports.where('localId').equals(localId).first();
  }

  async getAllDailyReports(): Promise<OfflineDailyReport[]> {
    return await this.dailyReports.orderBy('fecha_parte').reverse().toArray();
  }

  async getPendingReports(): Promise<OfflineDailyReport[]> {
    return await this.dailyReports.where('synced').equals(0).toArray();
  }

  async getDraftReports(): Promise<OfflineDailyReport[]> {
    return await this.dailyReports.where('status').equals('draft').toArray();
  }

  async getReportsByDate(startDate: string, endDate: string): Promise<OfflineDailyReport[]> {
    return await this.dailyReports
      .where('fecha_parte')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async updateDailyReport(id: number, updates: Partial<OfflineDailyReport>): Promise<number> {
    return await this.dailyReports.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteDailyReport(id: number): Promise<void> {
    await this.dailyReports.delete(id);
  }

  async markAsSynced(localId: string, serverId: number): Promise<void> {
    const report = await this.getDailyReportByLocalId(localId);
    if (report && report.id) {
      await this.dailyReports.update(report.id, {
        id: serverId,
        synced: true,
        status: 'synced',
        updatedAt: new Date(),
      });
    }
  }

  async markSyncFailed(localId: string, error: string): Promise<void> {
    const report = await this.getDailyReportByLocalId(localId);
    if (report && report.id) {
      await this.dailyReports.update(report.id, {
        status: 'failed',
        syncAttempts: (report.syncAttempts || 0) + 1,
        lastSyncAttempt: new Date(),
        syncError: error,
        updatedAt: new Date(),
      });
    }
  }

  // Sync Queue Management
  async addToSyncQueue(
    reportLocalId: string,
    action: 'create' | 'update' | 'delete',
    data: any
  ): Promise<number> {
    return await this.syncQueue.add({
      reportLocalId,
      action,
      data,
      createdAt: new Date(),
      attempts: 0,
    });
  }

  async getSyncQueue(): Promise<SyncQueue[]> {
    return await this.syncQueue.orderBy('createdAt').toArray();
  }

  async removeSyncQueueItem(id: number): Promise<void> {
    await this.syncQueue.delete(id);
  }

  async updateSyncQueueAttempt(id: number, error?: string): Promise<void> {
    const item = await this.syncQueue.get(id);
    if (item) {
      await this.syncQueue.update(id, {
        attempts: (item.attempts || 0) + 1,
        lastAttempt: new Date(),
        error,
      });
    }
  }

  async clearSyncQueue(): Promise<void> {
    await this.syncQueue.clear();
  }

  // Statistics
  async getStatistics() {
    const all = await this.dailyReports.count();
    const pending = await this.dailyReports.where('synced').equals(0).count();
    const drafts = await this.dailyReports.where('status').equals('draft').count();
    const synced = await this.dailyReports.where('synced').equals(1).count();

    return {
      total: all,
      pending,
      drafts,
      synced,
      queueLength: await this.syncQueue.count(),
    };
  }

  // Cleanup
  async clearAllData(): Promise<void> {
    await this.dailyReports.clear();
    await this.syncQueue.clear();
  }

  async deleteOldSyncedReports(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await this.dailyReports
      .where('synced')
      .equals(1)
      .and((report) => report.updatedAt < cutoffDate)
      .delete();
  }
}
