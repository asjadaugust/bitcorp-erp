import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type NotificationType = 'top-of-page' | 'toast' | 'inline' | 'snackbar';
export type NotificationPriority =
  | 'neutral-light'
  | 'neutral-dark'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

@Component({
  selector: 'aero-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="aero-notify"
      [ngClass]="['aero-notify--' + type, 'aero-notify--' + priority]"
      role="alert"
    >
      <i class="aero-notify__icon" [ngClass]="resolvedIcon"></i>

      <div class="aero-notify__body">
        <span *ngIf="title" class="aero-notify__title">{{ title }}</span>
        <span *ngIf="text" class="aero-notify__text">{{ text }}</span>
      </div>

      <div class="aero-notify__actions">
        <ng-content select="[actions]"></ng-content>
      </div>

      <button
        *ngIf="dismissable"
        type="button"
        class="aero-notify__dismiss"
        (click)="onDismiss()"
        tabindex="-1"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `,
  styles: [
    `
      .aero-notify {
        display: flex;
        align-items: flex-start;
        gap: var(--s-12);
        font-family: var(--font-text);
        border-radius: var(--radius-md);
        box-sizing: border-box;
      }

      /* Type: top-of-page */
      .aero-notify--top-of-page {
        padding: var(--s-12) var(--s-16);
        border-radius: 0;
        width: 100%;
      }

      /* Type: toast */
      .aero-notify--toast {
        padding: var(--s-16);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        min-width: 320px;
        max-width: 480px;
      }

      /* Type: inline */
      .aero-notify--inline {
        padding: var(--s-12) var(--s-16);
      }

      /* Type: snackbar */
      .aero-notify--snackbar {
        padding: var(--s-8) var(--s-16);
        align-items: center;
        border-radius: var(--radius-sm);
      }

      /* Priority colors */
      .aero-notify--neutral-light {
        background-color: var(--grey-100);
        color: var(--primary-900);
      }

      .aero-notify--neutral-dark {
        background-color: var(--primary-900);
        color: white;
      }

      .aero-notify--info {
        background-color: var(--semantic-blue-100, #e6f3fc);
        color: var(--primary-900, #0a3d6b);
      }

      .aero-notify--success {
        background-color: var(--semantic-blue-100, #e6f7ef);
        color: var(--primary-900, #0a4d2e);
      }

      .aero-notify--warning {
        background-color: var(--grey-100, #fef8e6);
        color: var(--grey-900, #6b4d0a);
      }

      .aero-notify--error {
        background-color: var(--grey-100, #fde6eb);
        color: var(--grey-900, #6b0a1d);
      }

      /* Icon */
      .aero-notify__icon {
        font-size: 18px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .aero-notify--snackbar .aero-notify__icon {
        margin-top: 0;
      }

      /* Body */
      .aero-notify__body {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
        flex: 1;
        min-width: 0;
      }

      .aero-notify--snackbar .aero-notify__body {
        flex-direction: row;
        gap: var(--s-8);
        align-items: center;
      }

      .aero-notify__title {
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
      }

      .aero-notify__text {
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        font-weight: 400;
      }

      .aero-notify--snackbar .aero-notify__title {
        font-size: var(--type-body-size);
        font-weight: 500;
      }

      /* Actions */
      .aero-notify__actions {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        flex-shrink: 0;
      }

      /* Dismiss */
      .aero-notify__dismiss {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border: none;
        background: none;
        color: inherit;
        cursor: pointer;
        opacity: 0.6;
        flex-shrink: 0;
        border-radius: var(--radius-sm);
        padding: 0;
      }

      .aero-notify__dismiss:hover {
        opacity: 1;
      }

      .aero-notify--neutral-dark .aero-notify__dismiss {
        color: white;
      }
    `,
  ],
})
export class AeroNotificationComponent {
  @Input() type: NotificationType = 'inline';
  @Input() priority: NotificationPriority = 'info';
  @Input() title = '';
  @Input() text = '';
  @Input() icon = '';
  @Input() dismissable = false;

  @Output() dismissed = new EventEmitter<void>();

  get resolvedIcon(): string {
    if (this.icon) return this.icon;
    switch (this.priority) {
      case 'info':
        return 'fa-solid fa-circle-info';
      case 'success':
        return 'fa-solid fa-circle-check';
      case 'warning':
        return 'fa-solid fa-triangle-exclamation';
      case 'error':
        return 'fa-solid fa-circle-exclamation';
      default:
        return 'fa-solid fa-circle-info';
    }
  }

  onDismiss(): void {
    this.dismissed.emit();
  }
}
