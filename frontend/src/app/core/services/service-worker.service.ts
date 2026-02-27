import { Injectable, inject, signal } from '@angular/core';
import { SyncManager } from './sync-manager.service';

@Injectable({
  providedIn: 'root',
})
export class ServiceWorkerService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;
  private syncManager = inject(SyncManager);

  /** Observable sync status for UI components */
  syncStatus = signal<'idle' | 'syncing' | 'done' | 'error'>('idle');

  /** Retry constants */
  private static readonly MAX_SYNC_ATTEMPTS = 5;
  private static readonly BASE_BACKOFF_MS = 5000;

  constructor() {
    this.init();
    this.setupEventListeners();
  }

  /**
   * Initialize service worker
   */
  private async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });

        console.log('[PWA] Service worker registered:', this.swRegistration);

        // Check for updates
        this.swRegistration.addEventListener('updatefound', () => {
          console.log('[PWA] Service worker update found');
          const newWorker = this.swRegistration!.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New service worker installed, ready to activate');
                // Notify user about update
                this.notifyUpdate();
              }
            });
          }
        });

        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

        // Initialize sync manager
        await this.syncManager.init();
        console.log('[PWA] Sync manager initialized');
      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
      }
    } else {
      console.warn('[PWA] Service workers not supported');
    }
  }

  /**
   * Setup online/offline event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('[PWA] Back online');
      this.isOnline = true;
      this.syncPendingReports();
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Gone offline');
      this.isOnline = false;
    });
  }

  /**
   * Handle messages from service worker
   */
  private async handleServiceWorkerMessage(data: Record<string, unknown>): Promise<void> {
    console.log('[PWA] Message from service worker:', data);

    switch (data['type']) {
      case 'STORE_OFFLINE_REQUEST':
        await this.storeOfflineRequest(data['data'] as Record<string, unknown>);
        break;

      case 'SYNC_PENDING_REPORTS':
        await this.syncPendingReports();
        break;
    }
  }

  /**
   * Store offline request in IndexedDB
   */
  private async storeOfflineRequest(requestData: Record<string, unknown>): Promise<void> {
    try {
      const reportData = JSON.parse(requestData['body'] as string);
      await this.syncManager.storePendingReport(reportData);
      console.log('[PWA] Report stored offline');
    } catch (error) {
      console.error('[PWA] Failed to store offline request:', error);
    }
  }

  /**
   * Sync all pending reports
   */
  async syncPendingReports(): Promise<void> {
    if (!this.isOnline) {
      console.log('[PWA] Cannot sync - offline');
      return;
    }

    this.syncStatus.set('syncing');

    try {
      const pendingReports = await this.syncManager.getPendingReports();
      console.log(`[PWA] Syncing ${pendingReports.length} pending reports`);

      for (const report of pendingReports) {
        const localId = report['id'] as number;
        const attempts = (report['syncAttempts'] as number) || 0;
        const lastAttempt = (report['lastSyncAttempt'] as number) || 0;

        // Skip dead-lettered reports
        if (report['deadLetter'] === 1) continue;

        // Move to dead letter if max attempts exceeded
        if (attempts >= ServiceWorkerService.MAX_SYNC_ATTEMPTS) {
          console.warn(`[PWA] Report ${localId} exceeded max attempts, moving to dead letter`);
          await this.syncManager.moveToDeadLetter(localId);
          continue;
        }

        // Exponential backoff: skip if too soon since last attempt
        if (attempts > 0 && lastAttempt > 0) {
          const backoffMs = ServiceWorkerService.BASE_BACKOFF_MS * Math.pow(2, attempts - 1);
          if (Date.now() - lastAttempt < backoffMs) {
            console.log(
              `[PWA] Report ${localId} backing off (attempt ${attempts}, wait ${backoffMs}ms)`
            );
            continue;
          }
        }

        try {
          const serverResponse = await this.syncReport(report);
          await this.syncManager.markAsSynced(localId);
          console.log(`[PWA] Report ${localId} synced successfully`);

          // Upload associated photos if any
          await this.syncPhotosForReport(localId, serverResponse);
        } catch (error) {
          console.error(`[PWA] Failed to sync report ${localId}:`, error);
          await this.syncManager.incrementSyncAttempts(localId);
        }
      }

      // Cleanup old synced reports
      await this.syncManager.clearSyncedReports();
      console.log('[PWA] Sync complete');
      this.syncStatus.set('done');
    } catch (error) {
      console.error('[PWA] Sync failed:', error);
      this.syncStatus.set('error');
    }
  }

  /**
   * Sync individual report
   */
  private async syncReport(report: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Upload photos stored in IndexedDB for a synced report
   */
  private async syncPhotosForReport(
    localReportId: number,
    serverResponse: Record<string, unknown>
  ): Promise<void> {
    const photos = await this.syncManager.getPhotosForReport(localReportId);
    if (photos.length === 0) return;

    const data = serverResponse['data'] as Record<string, unknown> | undefined;
    const serverId = (serverResponse['id'] ?? data?.['id']) as number | undefined;
    if (!serverId) {
      console.warn('[PWA] No server report ID, skipping photo upload');
      return;
    }

    console.log(`[PWA] Uploading ${photos.length} photos for report ${serverId}`);

    const formData = new FormData();
    for (const photo of photos) {
      formData.append('photos', photo.blob, photo.filename);
    }

    const uploadResponse = await fetch(`/api/reports/${serverId}/photos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (uploadResponse.ok) {
      await this.syncManager.deletePhotosForReport(localReportId);
      console.log(`[PWA] Photos uploaded and cleaned up for report ${serverId}`);
    } else {
      console.error(`[PWA] Photo upload failed: ${uploadResponse.status}`);
    }
  }

  /**
   * Get pending report count
   */
  async getPendingCount(): Promise<number> {
    return this.syncManager.getPendingCount();
  }

  /**
   * Check if online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Notify user about service worker update
   */
  private notifyUpdate(): void {
    // Could show a snackbar or notification here
    console.log('[PWA] App update available - reload to update');
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (this.swRegistration?.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return 'denied';
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      console.error('[PWA] Service worker not registered');
      return null;
    }

    try {
      const permission = await this.requestNotificationPermission();

      if (permission !== 'granted') {
        console.log('[PWA] Notification permission denied');
        return null;
      }

      // You would need to get the VAPID public key from your backend
      // const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY';
      // const subscription = await this.swRegistration.pushManager.subscribe({
      //   userVisibleOnly: true,
      //   applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      // });

      // return subscription;
      return null;
    } catch (error) {
      console.error('[PWA] Push notification subscription failed:', error);
      return null;
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}
