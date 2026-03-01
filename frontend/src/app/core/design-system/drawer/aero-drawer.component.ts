import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

@Component({
  selector: 'aero-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="open" class="aero-drawer__overlay" (click)="onOverlayClick()">
      <div
        class="aero-drawer__panel"
        [ngClass]="'aero-drawer__panel--' + position"
        [class.aero-drawer__panel--scrollable]="scrollable"
        (click)="$event.stopPropagation()"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="aero-drawer__header">
          <div class="aero-drawer__header-text">
            <h2 class="aero-drawer__title">{{ title }}</h2>
            <p *ngIf="subtitle" class="aero-drawer__subtitle">{{ subtitle }}</p>
          </div>
          <button type="button" class="aero-drawer__dismiss" (click)="onClose()" tabindex="-1">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Notification slot -->
        <div class="aero-drawer__notification">
          <ng-content select="[notification]"></ng-content>
        </div>

        <!-- Content -->
        <div class="aero-drawer__content" [class.aero-drawer__content--scrollable]="scrollable">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div *ngIf="showFooter" class="aero-drawer__footer">
          <ng-content select="[footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .aero-drawer__overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background-color: rgba(7, 43, 69, 0.9);
        animation: aero-drawer-fade 0.2s ease;
      }

      @keyframes aero-drawer-fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .aero-drawer__panel {
        position: fixed;
        display: flex;
        flex-direction: column;
        background-color: var(--grey-100);
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.16);
        z-index: 1001;
      }

      /* Position variants */
      .aero-drawer__panel--right {
        top: 0;
        right: 0;
        bottom: 0;
        width: 508px;
        max-width: 100vw;
        animation: aero-drawer-slide-right 0.25s ease;
      }

      @keyframes aero-drawer-slide-right {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      .aero-drawer__panel--left {
        top: 0;
        left: 0;
        bottom: 0;
        width: 508px;
        max-width: 100vw;
        animation: aero-drawer-slide-left 0.25s ease;
      }

      @keyframes aero-drawer-slide-left {
        from {
          transform: translateX(-100%);
        }
        to {
          transform: translateX(0);
        }
      }

      .aero-drawer__panel--top {
        top: 0;
        left: 0;
        right: 0;
        max-height: 80vh;
        animation: aero-drawer-slide-top 0.25s ease;
      }

      @keyframes aero-drawer-slide-top {
        from {
          transform: translateY(-100%);
        }
        to {
          transform: translateY(0);
        }
      }

      .aero-drawer__panel--bottom {
        bottom: 0;
        left: 0;
        right: 0;
        max-height: 80vh;
        animation: aero-drawer-slide-bottom 0.25s ease;
      }

      @keyframes aero-drawer-slide-bottom {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      /* Header */
      .aero-drawer__header {
        display: flex;
        align-items: flex-start;
        gap: var(--s-16);
        padding: var(--s-24);
        flex-shrink: 0;
      }

      .aero-drawer__header-text {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
        flex: 1;
        min-width: 0;
      }

      .aero-drawer__title {
        margin: 0;
        font-family: var(--font-display);
        font-size: 24px;
        line-height: 32px;
        font-weight: 500;
        color: var(--primary-900);
      }

      .aero-drawer__subtitle {
        margin: 0;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--grey-700);
      }

      .aero-drawer__dismiss {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        background: none;
        color: var(--grey-600);
        cursor: pointer;
        border-radius: var(--radius-sm);
        flex-shrink: 0;
        font-size: 16px;
      }

      .aero-drawer__dismiss:hover {
        background-color: var(--grey-100);
        color: var(--primary-900);
      }

      /* Notification */
      .aero-drawer__notification:empty {
        display: none;
      }

      .aero-drawer__notification {
        padding: 0 var(--s-24);
        flex-shrink: 0;
      }

      /* Content */
      .aero-drawer__content {
        flex: 1;
        padding: 0 var(--s-24) var(--s-24);
        overflow-y: auto;
      }

      .aero-drawer__content--scrollable {
        border-top: 1px solid var(--grey-200);
        border-bottom: 1px solid var(--grey-200);
        padding: var(--s-24);
      }

      /* Footer */
      .aero-drawer__footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--s-8);
        padding: var(--s-16) var(--s-24);
        flex-shrink: 0;
      }
    `,
  ],
})
export class AeroDrawerComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() position: DrawerPosition = 'right';
  @Input() scrollable = false;
  @Input() showFooter = true;
  @Input() closeOnOverlay = true;

  @Output() closed = new EventEmitter<void>();

  onOverlayClick(): void {
    if (this.closeOnOverlay) this.onClose();
  }

  onClose(): void {
    this.closed.emit();
  }
}
