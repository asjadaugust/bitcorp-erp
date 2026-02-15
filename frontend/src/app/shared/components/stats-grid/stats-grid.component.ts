import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatItem {
  label: string;
  value: string | number;
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  testId?: string;
}

@Component({
  selector: 'app-stats-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-grid" [attr.data-testid]="testId || 'stats-grid'">
      <div
        *ngFor="let item of items; let i = index"
        class="stat-card"
        [class]="item.color || 'primary'"
        [attr.data-testid]="item.testId || 'stat-card-' + i"
      >
        <div class="stat-icon-wrapper" *ngIf="item.icon">
          <i class="fa-solid" [ngClass]="item.icon"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ item.value }}</span>
          <span class="stat-label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-16);
        margin-bottom: var(--s-24);
      }

      .stat-card {
        background: var(--neutral-0);
        border-radius: var(--s-12);
        padding: var(--s-20);
        display: flex;
        align-items: center;
        gap: var(--s-16);
        box-shadow: var(--shadow-sm);
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
        border: 1px solid var(--grey-200);
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .stat-icon-wrapper {
        width: var(--s-48);
        height: var(--s-48);
        border-radius: var(--s-12);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--s-24);
        flex-shrink: 0;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .stat-value {
        font-size: var(--type-h3-size);
        font-weight: 700;
        color: var(--grey-900);
        line-height: 1.2;
      }

      .stat-label {
        font-size: var(--type-label-size);
        color: var(--grey-600);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* Color Variations */
      .primary .stat-icon-wrapper {
        background: var(--primary-100);
        color: var(--primary-600);
      }
      .primary {
        border-left: 4px solid var(--primary-500);
      }

      .success .stat-icon-wrapper {
        background: rgba(var(--semantic-success-rgb, 0, 168, 98), 0.1);
        color: var(--semantic-success);
      }
      .success {
        border-left: 4px solid var(--semantic-success);
      }

      .warning .stat-icon-wrapper {
        background: rgba(var(--semantic-warning-rgb, 255, 158, 24), 0.1);
        color: var(--semantic-warning);
      }
      .warning {
        border-left: 4px solid var(--semantic-warning);
      }

      .danger .stat-icon-wrapper {
        background: rgba(var(--semantic-error-rgb, 212, 28, 59), 0.1);
        color: var(--semantic-error);
      }
      .danger {
        border-left: 4px solid var(--semantic-error);
      }

      .info .stat-icon-wrapper {
        background: var(--primary-50);
        color: var(--klm-blue);
      }
      .info {
        border-left: 4px solid var(--klm-blue);
      }

      @media (max-width: 640px) {
        .stats-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class StatsGridComponent {
  @Input() items: StatItem[] = [];
  @Input() testId?: string;
}
