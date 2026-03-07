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
        gap: 4px;
        padding: 0 8px;
        border-radius: 9999px;
        font-size: 14px;
        font-weight: 500;
        line-height: 22px;
        white-space: nowrap;
        border: 1px solid transparent;

        i {
          color: inherit;
        }

        &.aero-badge--success {
          background-color: var(--semantic-green-100);
          border-color: var(--semantic-green-300);
          color: var(--semantic-green-500);
        }

        &.aero-badge--warning {
          background-color: var(--semantic-yellow-100);
          border-color: var(--semantic-yellow-300);
          color: var(--semantic-yellow-900);
        }

        &.aero-badge--error {
          background-color: var(--semantic-red-100);
          border-color: var(--semantic-red-300);
          color: var(--semantic-red-900);
        }

        &.aero-badge--info {
          background-color: var(--semantic-blue-100);
          border-color: var(--semantic-blue-300);
          color: var(--primary-900);
        }

        &.aero-badge--neutral {
          background-color: var(--grey-100);
          border-color: var(--grey-300);
          color: var(--primary-900);
        }

        &.aero-badge--primary {
          background-color: var(--semantic-yellow-100);
          border-color: var(--semantic-yellow-300);
          color: var(--semantic-yellow-900);
        }
      }
    `,
  ],
})
export class AeroBadgeComponent {
  @Input() variant: BadgeVariant = 'neutral';
}
