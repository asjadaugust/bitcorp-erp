import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notification-dropdown">
      <div class="dropdown-header">
        <h3>Notificaciones</h3>
        <button class="mark-all-btn" (click)="markAllRead()">Marcar todo como leído</button>
      </div>

      <div class="notification-list">
        <div *ngIf="notifications().length === 0" class="empty-state">
          <i class="fa-regular fa-bell-slash"></i>
          <p>No tienes notificaciones nuevas</p>
        </div>

        <div
          *ngFor="let notification of notifications()"
          class="notification-item"
          [class.unread]="!notification.read"
          (click)="markRead(notification)"
        >
          <div class="icon-wrapper" [ngClass]="notification.type.toLowerCase()">
            <i class="fa-solid" [ngClass]="getIcon(notification.type)"></i>
          </div>
          <div class="content">
            <h4 class="title">{{ notification.title }}</h4>
            <p class="message">{{ notification.message }}</p>
            <span class="time">{{ notification.created_at | date: 'short' }}</span>
          </div>
          <div class="status-dot" *ngIf="!notification.read"></div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .notification-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        width: 360px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        border: 1px solid var(--grey-200);
        z-index: 1000;
        overflow: hidden;
        margin-top: 8px;
      }

      .dropdown-header {
        padding: 16px;
        border-bottom: 1px solid var(--grey-200);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--grey-50);
      }

      .dropdown-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--grey-900);
      }

      .mark-all-btn {
        background: none;
        border: none;
        color: var(--primary-500);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
      }
      .mark-all-btn:hover {
        background: var(--primary-100);
      }

      .notification-list {
        max-height: 400px;
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
      }
      .empty-state p {
        margin: 0;
        font-size: 14px;
      }

      .notification-item {
        padding: 16px;
        display: flex;
        gap: 12px;
        border-bottom: 1px solid var(--grey-100);
        cursor: pointer;
        transition: background 0.2s;
        position: relative;
      }
      .notification-item:hover {
        background: var(--grey-50);
      }
      .notification-item.unread {
        background: var(--primary-100);
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
      .icon-wrapper.contract_expiry {
        background: #fee2e2;
        color: #dc2626;
      }
      .icon-wrapper.maintenance_due {
        background: #fef3c7;
        color: #d97706;
      }
      .icon-wrapper.schedule_assignment {
        background: #dbeafe;
        color: #2563eb;
      }
      .icon-wrapper.certification_expiry {
        background: #fce7f3;
        color: #9d174d;
      }
      .icon-wrapper.system {
        background: #e5e7eb;
        color: #4b5563;
      }

      .content {
        flex: 1;
      }
      .title {
        margin: 0 0 4px;
        font-size: 14px;
        font-weight: 600;
        color: var(--grey-900);
      }
      .message {
        margin: 0 0 4px;
        font-size: 13px;
        color: var(--grey-700);
        line-height: 1.4;
      }
      .time {
        font-size: 11px;
        color: var(--grey-400);
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--primary-500);
        position: absolute;
        top: 16px;
        right: 16px;
      }
    `,
  ],
})
export class NotificationDropdownComponent {
  notificationService = inject(NotificationService);
  notifications = this.notificationService.notifications;

  getIcon(type: string): string {
    switch (type) {
      case 'CONTRACT_EXPIRY':
        return 'fa-file-contract';
      case 'MAINTENANCE_DUE':
        return 'fa-screwdriver-wrench';
      case 'SCHEDULE_ASSIGNMENT':
        return 'fa-calendar-check';
      case 'CERTIFICATION_EXPIRY':
        return 'fa-id-card';
      default:
        return 'fa-bell';
    }
  }

  markRead(notification: any) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
  }

  markAllRead() {
    this.notificationService.markAllAsRead().subscribe();
  }
}
