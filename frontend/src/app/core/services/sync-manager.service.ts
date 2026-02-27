/**
 * IndexedDB Sync Manager for Offline Daily Reports
 * Handles storing and syncing daily reports and photos when offline
 */

import { Injectable } from '@angular/core';

const DB_NAME = 'bitcorp-erp-offline';
const DB_VERSION = 2;
const STORE_NAME = 'pending-reports';
const PHOTO_STORE_NAME = 'pending-photos';

@Injectable({
  providedIn: 'root',
})
export class SyncManager {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for pending reports
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }

        // Create object store for pending photos (v2)
        if (!db.objectStoreNames.contains(PHOTO_STORE_NAME)) {
          const photoStore = db.createObjectStore(PHOTO_STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          photoStore.createIndex('reportLocalId', 'reportLocalId', { unique: false });
          photoStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Store a pending report offline
   */
  async storePendingReport(reportData: Record<string, unknown>): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const report = {
        ...reportData,
        timestamp: Date.now(),
        synced: 0, // 0 for false
        syncAttempts: 0,
      };

      const request = store.add(report);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending reports
   */
  async getPendingReports(): Promise<Record<string, unknown>[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(0)); // 0 for false

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Mark report as synced
   */
  async markAsSynced(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const report = request.result;
        if (report) {
          report.synced = 1; // 1 for true
          report.syncedAt = Date.now();
          const updateRequest = store.put(report);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete synced report
   */
  async deleteSyncedReport(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Increment sync attempt counter
   */
  async incrementSyncAttempts(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const report = request.result;
        if (report) {
          report.syncAttempts = (report.syncAttempts || 0) + 1;
          report.lastSyncAttempt = Date.now();
          const updateRequest = store.put(report);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get count of pending reports
   */
  async getPendingCount(): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      const request = index.count(IDBKeyRange.only(0)); // 0 for false

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all synced reports (cleanup)
   */
  async clearSyncedReports(): Promise<void> {
    if (!this.db) await this.init();

    const syncedReports = await this.getSyncedReports();
    const deletePromises = syncedReports.map((report) =>
      this.deleteSyncedReport((report as any)['id'])
    );
    await Promise.all(deletePromises);
  }

  /**
   * Get synced reports
   */
  private async getSyncedReports(): Promise<Record<string, unknown>[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(1)); // 1 for true

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ─── Photo Storage ───────────────────────────────────────────────

  /**
   * Store a photo blob for a pending report
   */
  async storePhoto(
    reportLocalId: number,
    blob: Blob,
    filename: string,
    mimeType: string,
    thumbnail: Blob
  ): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PHOTO_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(PHOTO_STORE_NAME);

      const photo = {
        reportLocalId,
        blob,
        filename,
        mimeType,
        thumbnail,
        createdAt: Date.now(),
      };

      const request = store.add(photo);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all photos for a given local report ID
   */
  async getPhotosForReport(
    reportLocalId: number
  ): Promise<
    {
      id: number;
      reportLocalId: number;
      blob: Blob;
      filename: string;
      mimeType: string;
      thumbnail: Blob;
      createdAt: number;
    }[]
  > {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PHOTO_STORE_NAME], 'readonly');
      const store = transaction.objectStore(PHOTO_STORE_NAME);
      const index = store.index('reportLocalId');
      const request = index.getAll(IDBKeyRange.only(reportLocalId));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete all photos for a given local report ID
   */
  async deletePhotosForReport(reportLocalId: number): Promise<void> {
    if (!this.db) await this.init();

    const photos = await this.getPhotosForReport(reportLocalId);
    if (photos.length === 0) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PHOTO_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(PHOTO_STORE_NAME);

      let completed = 0;
      for (const photo of photos) {
        const request = store.delete(photo.id);
        request.onsuccess = () => {
          completed++;
          if (completed === photos.length) resolve();
        };
        request.onerror = () => reject(request.error);
      }
    });
  }

  // ─── Dead Letter ──────────────────────────────────────────────────

  /**
   * Move a report to dead letter (flag it)
   */
  async moveToDeadLetter(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const report = request.result;
        if (report) {
          report.deadLetter = 1;
          report.deadLetteredAt = Date.now();
          const updateRequest = store.put(report);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all dead-letter reports
   */
  async getDeadLetters(): Promise<Record<string, unknown>[]> {
    if (!this.db) await this.init();

    // No dedicated index — scan unsynced reports and filter
    const pending = await this.getPendingReports();
    return pending.filter((r) => r['deadLetter'] === 1);
  }

  /**
   * Retry a dead-letter report (reset attempts and flag)
   */
  async retryDeadLetter(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const report = request.result;
        if (report) {
          report.deadLetter = 0;
          report.syncAttempts = 0;
          report.lastSyncAttempt = null;
          const updateRequest = store.put(report);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get count of dead-letter reports
   */
  async getDeadLetterCount(): Promise<number> {
    const deadLetters = await this.getDeadLetters();
    return deadLetters.length;
  }
}
