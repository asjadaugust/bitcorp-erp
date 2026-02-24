import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs';

export interface Notificacion {
  id: number;
  usuario_id: number;
  tipo:
    | 'info'
    | 'warning'
    | 'error'
    | 'success'
    | 'approval_required'
    | 'approval_completed'
    | 'CONTRACT_EXPIRY'
    | 'MAINTENANCE_DUE'
    | 'SCHEDULE_ASSIGNMENT'
    | 'SYSTEM';
  titulo: string;
  mensaje: string;
  url: string | null;
  leido: boolean;
  leido_at: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface NotificacionesResponse {
  notificaciones: Notificacion[];
  total_no_leidas: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;

  /** Lista reactiva de notificaciones (Signal) */
  notificaciones = signal<Notificacion[]>([]);
  /** Cantidad de notificaciones no leídas (Signal) */
  totalNoLeidas = signal<number>(0);

  // Alias para compatibilidad con main-nav existente
  get unreadCount() {
    return this.totalNoLeidas;
  }
  get notifications() {
    return this.notificaciones;
  }

  constructor() {
    this.iniciarPolling();
  }

  private iniciarPolling() {
    this.obtenerNotificaciones();
    setInterval(() => this.obtenerNotificaciones(), 60_000);
  }

  obtenerNotificaciones() {
    this.http.get<NotificacionesResponse>(this.apiUrl).subscribe({
      next: (res) => {
        if (res) {
          this.notificaciones.set(res.notificaciones ?? []);
          this.totalNoLeidas.set(res.total_no_leidas ?? 0);
        }
      },
      error: (err) => console.error('Error al obtener notificaciones:', err),
    });
  }

  // Alias para compatibilidad con componentes existentes
  fetchNotifications() {
    this.obtenerNotificaciones();
  }

  marcarLeida(id: number) {
    return this.http.patch(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        this.notificaciones.update((lista) =>
          lista.map((n) => (n.id === id ? { ...n, leido: true } : n))
        );
        this.totalNoLeidas.update((count) => Math.max(0, count - 1));
      })
    );
  }

  // Alias para compatibilidad con componentes existentes
  markAsRead(id: number) {
    return this.marcarLeida(id);
  }

  marcarTodasLeidas() {
    return this.http.patch(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.notificaciones.update((lista) => lista.map((n) => ({ ...n, leido: true })));
        this.totalNoLeidas.set(0);
      })
    );
  }

  // Alias para compatibilidad con componentes existentes
  markAllAsRead() {
    return this.marcarTodasLeidas();
  }

  eliminar(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const notif = this.notificaciones().find((n) => n.id === id);
        this.notificaciones.update((lista) => lista.filter((n) => n.id !== id));
        if (notif && !notif.leido) {
          this.totalNoLeidas.update((count) => Math.max(0, count - 1));
        }
      })
    );
  }
}
