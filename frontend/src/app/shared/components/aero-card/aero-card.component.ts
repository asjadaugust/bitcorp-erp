import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CardInfoItem {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}

@Component({
  selector: 'app-aero-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="aero-card"
      (click)="onCardClick()"
      (keydown.enter)="onCardClick()"
      tabindex="0"
      role="button"
    >
      <!-- Header -->
      <div class="aero-card__header">
        <div class="aero-card__status-row">
          <span [class]="'aero-card__status aero-card__status--' + statusClass">
            <i [class]="statusIcon"></i>
            {{ statusLabel }}
          </span>
          <span class="aero-card__date" *ngIf="date">
            <i class="fa-regular fa-calendar"></i>
            {{ date | date: 'dd/MM/yyyy' }}
          </span>
        </div>
        <div class="aero-card__title-row">
          <h3 class="aero-card__title">
            <i *ngIf="icon" [class]="icon" class="aero-card__title-icon"></i>
            {{ title }}
          </h3>
        </div>
        <span *ngIf="subtitle" class="aero-card__subtitle">{{ subtitle }}</span>
      </div>

      <!-- Body -->
      <div class="aero-card__body">
        <div class="aero-card__info-grid">
          <div *ngFor="let item of infoItems" class="aero-card__info-item">
            <div class="aero-card__info-label">
              <i [class]="item.icon"></i>
              {{ item.label }}
            </div>
            <span
              class="aero-card__info-value"
              [class.aero-card__info-value--highlight]="item.highlight"
            >
              {{ item.value }}
            </span>
          </div>
        </div>

        <div *ngIf="observations" class="aero-card__observations">
          <p>{{ observations }}</p>
        </div>

        <ng-content select="[body-extra]"></ng-content>
      </div>

      <!-- Footer -->
      <div class="aero-card__footer">
        <div class="aero-card__meta">
          <span *ngIf="timestamp"> Actualizado: {{ timestamp | date: 'dd/MM/yy HH:mm' }} </span>
        </div>
        <div
          class="aero-card__actions"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="toolbar"
        >
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Base Card Style matching MaintenanceCard */
      .aero-card {
        background: #ffffff;
        border: 1px solid #e8e8e8;
        border-radius: 12px;
        padding: 1.25rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.06);
        transition: all 0.2s ease-in-out;
        position: relative;
        cursor: pointer;
        overflow: hidden;
      }

      .aero-card:hover {
        box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.1);
        border-color: #d1d1d1;
        transform: translateY(-2px);
      }

      /* Header */
      .aero-card__header {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .aero-card__status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .aero-card__status {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        line-height: normal;
      }

      /* Standard status colors */
      .aero-card__status--draft,
      .aero-card__status--pending,
      .aero-card__status--BORRADOR,
      .aero-card__status--PENDIENTE {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0; /* Optional border for consistency with old design if desired, but MaintenanceCard uses classes */
      }
      .aero-card__status--submitted,
      .aero-card__status--assigned,
      .aero-card__status--EN_PROCESO {
        background: #eff6ff;
        color: #2563eb;
      }
      .aero-card__status--approved,
      .aero-card__status--completed,
      .aero-card__status--APROBADO,
      .aero-card__status--COMPLETADO {
        background: #f0fdf4;
        color: #16a34a;
      }
      .aero-card__status--rejected,
      .aero-card__status--cancelled,
      .aero-card__status--RECHAZADO,
      .aero-card__status--CANCELADO {
        background: #fef2f2;
        color: #dc2626;
      }

      .aero-card__date {
        font-size: 11px;
        color: #757575;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-weight: 600;
      }

      .aero-card__title-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .aero-card__title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
        letter-spacing: -0.01em;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        line-height: 1.2;
      }

      .aero-card__title-icon {
        font-size: 1rem;
        color: #1a1a1a; /* Match title color */
      }

      .aero-card__subtitle {
        font-size: 12px;
        color: #9e9e9e;
        font-weight: 500;
      }

      /* Body */
      .aero-card__body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .aero-card__info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr; /* Fixed 2 columns like MaintenanceCard */
        gap: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px dotted #eeeeee;
      }

      .aero-card__info-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0; /* Critical for text-overflow to work in flex/grid children */
      }

      .aero-card__info-label {
        font-size: 10px;
        font-weight: 700;
        color: #5f6d7a;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        white-space: nowrap; /* Prevent label wrapping too */
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .aero-card__info-label i {
        font-size: 10px;
        flex-shrink: 0; /* Prevent icon from shrinking */
      }

      .aero-card__info-value {
        font-size: 13px;
        font-weight: 600;
        color: #072b45;

        /* Multi-line truncation logic */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: normal; /* Allow wrapping */
        word-break: break-word; /* Ensure long words break */
        line-height: 1.2; /* Tight line height for density */
        max-height: 2.4em; /* Height relevant to line-height * lines */
      }

      .aero-card__info-value--highlight {
        color: #1976d2;
      }

      .aero-card__observations {
        background: #fcfcfc;
        padding: 0.75rem;
        border-radius: 8px;
        border: 1px solid #f0f0f0;
      }

      .aero-card__observations p {
        margin: 0;
        font-size: 12px;
        line-height: 1.5;
        color: #616161;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      /* Footer */
      .aero-card__footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
        padding-top: 0.75rem;
        border-top: 1px solid #f5f5f5;
        min-height: auto; /* Allow auto height */
        background: transparent; /* Remove background */
        padding-bottom: 0; /* Align to bottom */
      }

      .aero-card__meta {
        font-size: 11px;
        color: #bdbdbd;
        font-weight: 500;
      }

      /* Footer Actions Layout */
      .aero-card__actions {
        display: flex;
        gap: 0.5rem;
      }

      /* 
       * Target the projected content wrapper to apply layout to buttons
       */
      ::ng-deep .aero-card__actions > * {
        display: flex;
        gap: 0.5rem;
      }

      /* 
       * Enforce Circular Action Button Styles matching MaintenanceCard
       */
      ::ng-deep .aero-card__actions button,
      ::ng-deep .aero-card__actions .card-action-btn,
      ::ng-deep .aero-card__actions .report-card__btn,
      ::ng-deep .aero-card__actions .btn-icon {
        width: 32px !important;
        height: 32px !important;
        border-radius: 50% !important; /* Circular */
        border: none !important;
        background: #f5f5f5 !important;
        color: #757575 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer;
        transition: all 0.2s !important;
        font-size: 12px !important;
        padding: 0 !important;
        box-shadow: none !important;

        &:hover {
          background: #eeeeee !important;
          color: #1a1a1a !important;
          transform: scale(1.1) !important;
        }

        /* Variant specific colors on hover if needed */
        &.card-action-btn--primary:hover,
        &.report-card__btn--approve:hover {
          color: #2e7d32 !important;
        }

        &.card-action-btn--info:hover,
        &.report-card__btn--edit:hover,
        &.report-card__btn--view:hover {
          color: #1976d2 !important;
        }

        &.report-card__btn--reject:hover {
          color: #d32f2f !important;
        }

        i,
        span,
        svg {
          font-size: 12px !important;
          pointer-events: none;
        }
      }

      @media (max-width: 768px) {
        .aero-card__info-grid {
          grid-template-columns: 1fr 1fr; /* Keep 2 cols on mobile if space allows, or 1fr if very narrow */
        }
      }
    `,
  ],
})
export class AeroCardComponent {
  @Input() title = '';
  @Input() icon?: string;
  @Input() subtitle?: string; // Added subtitle input
  @Input() statusLabel = '';
  @Input() statusClass = '';
  @Input() statusIcon = 'fa-solid fa-circle';
  @Input() date?: string | Date;
  @Input() timestamp?: string | Date;
  @Input() infoItems: CardInfoItem[] = [];
  @Input() observations?: string;

  @Output() cardClick = new EventEmitter<void>();

  onCardClick() {
    this.cardClick.emit();
  }
}
