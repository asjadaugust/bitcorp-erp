import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notificacion } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notification-dropdown" data-testid="notification-dropdown">
      <!-- Encabezado -->
      <div class="dropdown-header">
        <h3>Notificaciones</h3>
        <button
          class="mark-all-btn"
          (click)="marcarTodasLeidas()"
          [disabled]="svc.totalNoLeidas() === 0"
          data-testid="btn-marcar-todas-leidas"
        >
          Marcar todo como leído
        </button>
      </div>

      <!-- Lista de notificaciones -->
      <div class="notification-list" data-testid="notification-list">
        <div
          *ngIf="svc.notificaciones().length === 0"
          class="empty-state"
          data-testid="empty-state"
        >
          <i class="fa-regular fa-bell-slash"></i>
          <p>No tienes notificaciones nuevas</p>
        </div>

        <div
          *ngFor="let n of svc.notificaciones().slice(0, 8)"
          class="notification-item"
          [class.unread]="!n.leido"
          (click)="onClickItem(n)"
          (keydown.enter)="onClickItem(n)"
          tabindex="0"
          role="button"
          [attr.data-testid]="'notif-item-' + n.id"
        >
          <div class="icon-wrapper" [ngClass]="getIconClass(n.tipo)">
            <i class="fa-solid" [ngClass]="getIcono(n.tipo)"></i>
          </div>
          <div class="content">
            <h4 class="titulo">{{ n.titulo }}</h4>
            <p class="mensaje">{{ n.mensaje }}</p>
            <span class="tiempo">{{ n.created_at | date: 'dd/MM/yy HH:mm' }}</span>
          </div>
          <div class="dot-no-leida" *ngIf="!n.leido" data-testid="dot-no-leida"></div>
          <button
            class="btn-eliminar"
            title="Eliminar notificación"
            (click)="eliminar($event, n.id)"
            [attr.data-testid]="'btn-eliminar-' + n.id"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- Pie -->
      <div class="dropdown-footer">
        <a routerLink="/notificaciones" class="link-ver-todas" data-testid="link-ver-todas">
          Ver todas las notificaciones
        </a>
      </div>
    </div>
  `,
  styles: [
    `
      .notification-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        width: 380px;
        background: white;
        border-radius: var(--radius-md);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        border: 1px solid var(--grey-200);
        z-index: 1000;
        overflow: hidden;
        margin-top: 8px;
      }
      .dropdown-header {
        padding: 14px 16px;
        border-bottom: 1px solid var(--grey-200);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--grey-50);
      }
      .dropdown-header h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--grey-900);
      }
      .mark-all-btn {
        background: none;
        border: none;
        color: var(--primary-700);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: var(--radius-sm);
      }
      .mark-all-btn:hover {
        background: var(--primary-100);
      }
      .mark-all-btn:disabled {
        color: var(--grey-400);
        cursor: not-allowed;
      }

      .notification-list {
        max-height: 380px;
        overflow-y: auto;
      }
      .empty-state {
        padding: 32px;
        text-align: center;
        color: var(--grey-500);
      }
      .empty-state i {
        font-size: 24px;
        margin-bottom: 8px;
        display: block;
      }
      .empty-state p {
        margin: 0;
        font-size: 14px;
      }

      .notification-item {
        padding: 12px 16px;
        display: flex;
        gap: 12px;
        align-items: flex-start;
        border-bottom: 1px solid var(--grey-100);
        cursor: pointer;
        transition: background 0.15s;
        position: relative;
      }
      .notification-item:hover {
        background: var(--grey-50);
      }
      .notification-item.unread {
        background: #eff6ff;
      }

      .icon-wrapper {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .icon-wrapper.warning {
        background: #fef3c7;
        color: #d97706;
      }
      .icon-wrapper.error {
        background: #fee2e2;
        color: #dc2626;
      }
      .icon-wrapper.success {
        background: #dcfce7;
        color: #16a34a;
      }
      .icon-wrapper.info {
        background: #dbeafe;
        color: #2563eb;
      }
      .icon-wrapper.approval_required {
        background: #ede9fe;
        color: #7c3aed;
      }
      .icon-wrapper.approval_completed {
        background: #dcfce7;
        color: #15803d;
      }
      .icon-wrapper.contract_expiry {
        background: #fee2e2;
        color: #dc2626;
      }
      .icon-wrapper.maintenance_due {
        background: #fef3c7;
        color: #d97706;
      }
      .icon-wrapper.system {
        background: var(--grey-100);
        color: var(--grey-600);
      }

      .content {
        flex: 1;
        min-width: 0;
      }
      .titulo {
        margin: 0 0 2px;
        font-size: 13px;
        font-weight: 600;
        color: var(--grey-900);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mensaje {
        margin: 0 0 4px;
        font-size: 12px;
        color: var(--grey-600);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .tiempo {
        font-size: 11px;
        color: var(--grey-400);
      }

      .dot-no-leida {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--primary-600);
        flex-shrink: 0;
        margin-top: 6px;
      }
      .btn-eliminar {
        background: none;
        border: none;
        color: var(--grey-400);
        cursor: pointer;
        padding: 2px 4px;
        border-radius: var(--radius-sm);
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.15s;
      }
      .notification-item:hover .btn-eliminar {
        opacity: 1;
      }
      .btn-eliminar:hover {
        color: var(--accent-500);
        background: var(--grey-100);
      }

      .dropdown-footer {
        padding: 10px 16px;
        border-top: 1px solid var(--grey-200);
        background: var(--grey-50);
        text-align: center;
      }
      .link-ver-todas {
        font-size: 13px;
        color: var(--primary-700);
        text-decoration: none;
        font-weight: 500;
      }
      .link-ver-todas:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class NotificationDropdownComponent {
  svc = inject(NotificationService);

  /** Emite cuando se cierra el dropdown */
  cerrar = output<void>();

  getIcono(tipo: string): string {
    const mapa: Record<string, string> = {
      warning: 'fa-triangle-exclamation',
      error: 'fa-circle-xmark',
      success: 'fa-circle-check',
      info: 'fa-circle-info',
      approval_required: 'fa-clock',
      approval_completed: 'fa-check-circle',
      CONTRACT_EXPIRY: 'fa-file-contract',
      MAINTENANCE_DUE: 'fa-screwdriver-wrench',
      SCHEDULE_ASSIGNMENT: 'fa-calendar-check',
      SYSTEM: 'fa-gear',
    };
    return mapa[tipo] ?? 'fa-bell';
  }

  getIconClass(tipo: string): string {
    return tipo.toLowerCase().replace('_', '_');
  }

  onClickItem(n: Notificacion) {
    if (!n.leido) {
      this.svc.marcarLeida(n.id).subscribe();
    }
    if (n.url) {
      // navegación manejada externamente via routerLink en la página completa
    }
  }

  marcarTodasLeidas() {
    this.svc.marcarTodasLeidas().subscribe();
  }

  eliminar(event: Event, id: number) {
    event.stopPropagation();
    this.svc.eliminar(id).subscribe();
  }
}
