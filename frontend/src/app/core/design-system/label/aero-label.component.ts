import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LabelSize = 'small' | 'medium' | 'large';
export type LabelPriority =
  | 'default'
  | 'information'
  | 'positive'
  | 'warning'
  | 'service'
  | 'negative';

@Component({
  selector: 'aero-label',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="aero-label" [ngClass]="['aero-label--' + size, 'aero-label--' + priority]">
      <i *ngIf="showIcon" class="aero-label__icon fa-solid" [ngClass]="iconClass"></i>
      <span class="aero-label__text"><ng-content></ng-content></span>
    </span>
  `,
  styles: [
    `
      .aero-label {
        display: inline-flex;
        align-items: center;
        border: 1px solid;
        border-radius: var(--radius-full);
        background-color: var(--neutral-0);
        font-family: var(--font-text);
        font-weight: 500;
        white-space: nowrap;
      }

      /* Sizes */
      .aero-label--small {
        height: 22px;
        padding: 0 var(--s-8);
        gap: var(--s-4);
        font-size: var(--type-bodySmall-size);
        line-height: var(--type-bodySmall-line-height);
      }

      .aero-label--small .aero-label__icon {
        font-size: 12px;
      }

      .aero-label--medium {
        height: 32px;
        padding: 0 var(--s-12);
        gap: var(--s-6);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
      }

      .aero-label--medium .aero-label__icon {
        font-size: 16px;
      }

      .aero-label--large {
        height: 44px;
        padding: 0 var(--s-16);
        gap: var(--s-8);
        font-size: var(--type-bodyLarge-size);
        line-height: var(--type-bodyLarge-line-height);
      }

      .aero-label--large .aero-label__icon {
        font-size: 20px;
      }

      /* Priorities */
      .aero-label--default {
        border-color: var(--primary-900);
        color: var(--primary-900);
      }

      .aero-label--information {
        border-color: var(--semantic-blue-500);
        color: var(--semantic-blue-500);
      }

      .aero-label--positive {
        border-color: var(--semantic-green-500);
        color: var(--semantic-green-500);
      }

      .aero-label--warning {
        border-color: var(--semantic-yellow-500);
        color: var(--semantic-yellow-700);
      }

      .aero-label--service {
        border-color: var(--grey-700);
        color: var(--grey-700);
      }

      .aero-label--negative {
        border-color: var(--semantic-red-500);
        color: var(--semantic-red-500);
      }

      .aero-label__icon {
        flex-shrink: 0;
      }

      .aero-label__text {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ],
})
export class AeroLabelComponent {
  @Input() size: LabelSize = 'medium';
  @Input() priority: LabelPriority = 'default';
  @Input() showIcon = true;

  get iconClass(): string {
    switch (this.priority) {
      case 'default':
        return 'fa-check-circle';
      case 'information':
        return 'fa-info-circle';
      case 'positive':
        return 'fa-check-circle';
      case 'warning':
        return 'fa-exclamation-triangle';
      case 'service':
        return 'fa-exclamation-circle';
      case 'negative':
        return 'fa-times-circle';
    }
  }
}
