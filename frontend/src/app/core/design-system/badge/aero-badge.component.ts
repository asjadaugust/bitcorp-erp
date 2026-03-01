import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

@Component({
  selector: 'aero-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="aero-badge" [ngClass]="'aero-badge--' + variant">
      <ng-content></ng-content>
    </span>
  `,
  styles: [
    `
      .aero-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 10px;
        border-radius: 9999px;
        font-size: var(--type-label-size);
        font-weight: 500;
        line-height: 1.5;
        white-space: nowrap;

        &.aero-badge--success {
          background-color: var(--semantic-blue-100);
          color: var(--primary-900);
        }

        &.aero-badge--warning {
          background-color: var(--grey-100);
          color: var(--grey-900);
        }

        &.aero-badge--error {
          background-color: var(--grey-100);
          color: var(--grey-900);
        }

        &.aero-badge--info {
          background-color: var(--semantic-blue-100);
          color: var(--primary-900);
        }

        &.aero-badge--neutral {
          background-color: var(--grey-200);
          color: var(--grey-900);
        }

        &.aero-badge--primary {
          background-color: var(--primary-100);
          color: var(--primary-900);
        }
      }
    `,
  ],
})
export class AeroBadgeComponent {
  @Input() variant: BadgeVariant = 'neutral';
}
