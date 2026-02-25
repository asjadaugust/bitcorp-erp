import { Injectable, inject } from '@angular/core';
import { SyncManager } from './sync-manager.service';

@Injectable({
  providedIn: 'root',
})
export class ServiceWorkerService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;
  private syncManager = inject(SyncManager);

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

    try {
      const pendingReports = await this.syncManager.getPendingReports();
      console.log(`[PWA] Syncing ${pendingReports.length} pending reports`);

      for (const report of pendingReports) {
        try {
          await this.syncReport(report);
          await this.syncManager.markAsSynced(report['id'] as number);
          console.log(`[PWA] Report ${report['id']} synced successfully`);
        } catch (error) {
          console.error(`[PWA] Failed to sync report ${report['id']}:`, error);
          await this.syncManager.incrementSyncAttempts(report['id'] as number);
        }
      }

      // Cleanup old synced reports
      await this.syncManager.clearSyncedReports();
      console.log('[PWA] Sync complete');
    } catch (error) {
      console.error('[PWA] Sync failed:', error);
    }
  }

  /**
   * Sync individual report
   */
  private async syncReport(report: Record<string, unknown>): Promise<void> {
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
