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
    <div class="aero-card" (click)="onCardClick()">
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
        <h3 class="aero-card__title">{{ title }}</h3>
      </div>

      <!-- Body -->
      <div class="aero-card__body">
        <div class="aero-card__info-grid">
          <div *ngFor="let item of infoItems" class="aero-card__info-item">
            <i [class]="item.icon"></i>
            <span class="aero-card__info-label">{{ item.label }}</span>
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
        <span class="aero-card__timestamp" *ngIf="timestamp">
          <i class="fa-regular fa-clock"></i>
          {{ timestamp | date: 'dd/MM HH:mm' }}
        </span>
        <div class="aero-card__actions" (click)="$event.stopPropagation()">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .aero-card {
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        border: 1px solid #e8e8e8;
        cursor: pointer;
        transition: all 0.2s ease;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .aero-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border-color: #d0d0d0;
      }

      /* Header */
      .aero-card__header {
        padding: 1rem 1.25rem;
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        border-bottom: 1px solid #f0f0f0;
      }

      .aero-card__status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .aero-card__status {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      /* Standard status colors - can be extended via statusClass */
      .aero-card__status--draft,
      .aero-card__status--pending,
      .aero-card__status--BORRADOR {
        background: #f5f5f5;
        color: #666666;
      }
      .aero-card__status--submitted,
      .aero-card__status--assigned,
      .aero-card__status--PENDIENTE {
        background: #e3f2fd;
        color: #1565c0;
      }
      .aero-card__status--approved,
      .aero-card__status--completed,
      .aero-card__status--APROBADO {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .aero-card__status--rejected,
      .aero-card__status--cancelled,
      .aero-card__status--RECHAZADO {
        background: #ffebee;
        color: #c62828;
      }
      .aero-card__status--in_progress {
        background: #fff3e0;
        color: #e65100;
      }
      .aero-card__status--synced {
        background: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #c8e6c9;
      }

      .aero-card__date {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        color: #666666;
      }

      .aero-card__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #1a1a1a;
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Body */
      .aero-card__body {
        padding: 1rem 1.25rem;
        flex: 1;
      }

      .aero-card__info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.875rem;
      }

      .aero-card__info-item {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .aero-card__info-item i {
        font-size: 0.875rem;
        color: #9e9e9e;
        margin-bottom: 0.125rem;
      }

      .aero-card__info-label {
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #9e9e9e;
        font-weight: 500;
      }

      .aero-card__info-value {
        font-size: 0.875rem;
        color: #333333;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .aero-card__info-value--highlight {
        color: #1565c0;
        font-weight: 700;
      }

      .aero-card__observations {
        margin-top: 0.875rem;
        padding-top: 0.875rem;
        border-top: 1px dashed #e8e8e8;
      }

      .aero-card__observations p {
        margin: 0;
        font-size: 0.8125rem;
        color: #666666;
        line-height: 1.5;
      }

      /* Footer */
      .aero-card__footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        background: #ffffff;
        border-top: 1px solid #f0f0f0;
        min-height: 56px;
      }

      .aero-card__timestamp {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: #9e9e9e;
        font-weight: 500;
      }

      /* Footer Actions Layout */
      .aero-card__actions {
        display: flex;
        margin-left: auto;
        align-items: center;
        justify-content: flex-end;
      }

      /* 
     * Target the projected content wrapper to apply layout to buttons
     * This handles cases where buttons are wrapped in a div/ng-container
     */
      ::ng-deep .aero-card__actions > * {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        justify-content: flex-end;
      }

      /* 
     * Enforce Action Button Styles 
     * Using ::ng-deep to style projected content from parent components 
     */
      ::ng-deep .aero-card__actions button,
      ::ng-deep .aero-card__actions .card-action-btn,
      ::ng-deep .aero-card__actions .report-card__btn,
      ::ng-deep .aero-card__actions .btn-icon {
        width: 36px !important;
        height: 36px !important;
        min-width: 36px !important;
        padding: 0 !important;
        margin: 0 !important;
        border-radius: 8px !important;
        border: 1px solid transparent !important;
        background: #f5f5f5;
        color: #616161;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 0.95rem !important;
        line-height: 1 !important;
        box-shadow: none !important;

        &:hover {
          background: #e3f2fd !important;
          color: #1976d2 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
        }

        /* Variant: Primary / Approve */
        &.card-action-btn--primary,
        &.report-card__btn--approve {
          background: #e8f5e9;
          color: #2e7d32;
          &:hover {
            background: #c8e6c9 !important;
            color: #1b5e20 !important;
          }
        }

        /* Variant: Success */
        &.card-action-btn--success {
          background: #e8f5e9;
          color: #2e7d32;
          &:hover {
            background: #c8e6c9 !important;
          }
        }

        /* Variant: Info / Edit / View */
        &.card-action-btn--info,
        &.report-card__btn--edit,
        &.report-card__btn--view {
          background: #e3f2fd;
          color: #1565c0;
          &:hover {
            background: #bbdefb !important;
            color: #0d47a1 !important;
          }
        }

        /* Variant: Reject */
        &.report-card__btn--reject {
          background: #ffebee;
          color: #c62828;
          &:hover {
            background: #ffcdd2 !important;
            color: #b71c1c !important;
          }
        }

        /* Reset icon styles inside buttons */
        i,
        span,
        svg {
          font-size: 1rem;
          pointer-events: none;
        }
      }

      @media (max-width: 768px) {
        .aero-card__info-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AeroCardComponent {
  @Input() title: string = '';
  @Input() statusLabel: string = '';
  @Input() statusClass: string = '';
  @Input() statusIcon: string = 'fa-solid fa-circle';
  @Input() date?: string | Date;
  @Input() timestamp?: string | Date;
  @Input() infoItems: CardInfoItem[] = [];
  @Input() observations?: string;

  @Output() cardClick = new EventEmitter<void>();

  onCardClick() {
    this.cardClick.emit();
  }
}
