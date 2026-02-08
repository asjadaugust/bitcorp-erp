import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

export interface Notification {
  id: number;
  type:
    | 'CONTRACT_EXPIRY'
    | 'MAINTENANCE_DUE'
    | 'SCHEDULE_ASSIGNMENT'
    | 'SYSTEM'
    | 'CERTIFICATION_EXPIRY';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;

  // Signals for reactive state
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);

  constructor() {
    // Start polling
    this.startPolling();
  }

  private startPolling() {
    this.fetchNotifications();
    setInterval(() => {
      this.fetchNotifications();
    }, 60000); // Poll every 60 seconds
  }

  fetchNotifications() {
    this.http
      .get<{
        success: boolean;
        data: { notifications: Notification[]; unreadCount: number };
      }>(this.apiUrl)
      .subscribe({
        next: (res) => {
          if (res && res.data) {
            this.notifications.set(res.data.notifications || []);
            this.unreadCount.set(res.data.unreadCount || 0);
          }
        },
        error: (err) => console.error('Error fetching notifications:', err),
      });
  }

  markAsRead(id: number) {
    return this.http.patch(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        // Optimistic update
        this.notifications.update((list) =>
          list.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        this.unreadCount.update((count) => Math.max(0, count - 1));
      })
    );
  }

  markAllAsRead() {
    return this.http.patch(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        // Optimistic update
        this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
        this.unreadCount.set(0);
      })
    );
  }
}
