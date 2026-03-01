import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'aero-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="open" class="aero-modal__overlay" (click)="onOverlayClick()">
      <div
        class="aero-modal__dialog"
        [class.aero-modal__dialog--scrollable]="scrollable"
        role="dialog"
        aria-modal="true"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="aero-modal__header">
          <div class="aero-modal__header-text">
            <h2 class="aero-modal__title">{{ title }}</h2>
            <p *ngIf="subtitle" class="aero-modal__subtitle">{{ subtitle }}</p>
          </div>
          <button
            *ngIf="dismissable"
            type="button"
            class="aero-modal__dismiss"
            (click)="onClose()"
            tabindex="-1"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="aero-modal__content" [class.aero-modal__content--scrollable]="scrollable">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div *ngIf="showFooter" class="aero-modal__footer">
          <ng-content select="[footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .aero-modal__overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(7, 43, 69, 0.9);
        animation: aero-modal-fade-in 0.2s ease;
      }

      @keyframes aero-modal-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .aero-modal__dialog {
        display: flex;
        flex-direction: column;
        background-color: var(--grey-100);
        border-radius: var(--radius-md);
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.16);
        width: 100%;
        max-width: 560px;
        max-height: 90vh;
        animation: aero-modal-slide-up 0.2s ease;
      }

      @keyframes aero-modal-slide-up {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Header */
      .aero-modal__header {
        display: flex;
        align-items: flex-start;
        gap: var(--s-16);
        padding: var(--s-24);
        flex-shrink: 0;
      }

      .aero-modal__header-text {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
        flex: 1;
        min-width: 0;
      }

      .aero-modal__title {
        margin: 0;
        font-family: var(--font-display);
        font-size: 24px;
        line-height: 32px;
        font-weight: 500;
        color: var(--primary-900);
      }

      .aero-modal__subtitle {
        margin: 0;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--grey-700);
      }

      .aero-modal__dismiss {
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

      .aero-modal__dismiss:hover {
        background-color: var(--grey-100);
        color: var(--primary-900);
      }

      /* Content */
      .aero-modal__content {
        padding: 0 var(--s-24) var(--s-24);
        flex: 1;
      }

      .aero-modal__content--scrollable {
        overflow-y: auto;
        border-top: 1px solid var(--grey-200);
        border-bottom: 1px solid var(--grey-200);
        padding: var(--s-24);
      }

      /* Footer */
      .aero-modal__footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--s-8);
        padding: var(--s-16) var(--s-24);
        flex-shrink: 0;
      }
    `,
  ],
})
export class AeroModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() dismissable = true;
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
