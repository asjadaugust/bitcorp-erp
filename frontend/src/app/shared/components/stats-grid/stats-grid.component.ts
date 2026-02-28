import { Component, Input, Output, EventEmitter } from '@angular/core';
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
        [class.clickable]="itemClicked.observed"
        [attr.data-testid]="item.testId || 'stat-card-' + i"
        (click)="itemClicked.emit(i)"
      >
        <div class="stat-icon" *ngIf="item.icon">
          <i class="fa-solid" [ngClass]="item.icon"></i>
        </div>
        <div class="stat-content">
          <span class="stat-label">{{ item.label }}</span>
          <span class="stat-value">{{ item.value }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-24);
        margin-bottom: var(--s-24);
      }

      .stat-card {
        background: white;
        border: 1px solid var(--grey-100);
        border-radius: var(--radius-md);
        padding: var(--s-20);
        display: flex;
        align-items: center;
        gap: var(--s-16);
        box-shadow: var(--shadow-sm);
        transition: all 0.2s ease;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--grey-200);
      }

      .stat-card.clickable {
        cursor: pointer;
      }

      .stat-icon {
        font-size: 24px;
        color: var(--primary-500);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-label {
        font-size: 11px;
        font-weight: 600;
        color: var(--grey-500);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-value {
        font-size: 20px;
        font-weight: 700;
        color: var(--primary-900);
        line-height: 1.2;
      }

      /* Color Overrides (Subtle) */
      .success .stat-icon {
        color: var(--semantic-green-600);
      }
      .warning .stat-icon {
        color: var(--semantic-yellow-600);
      }
      .danger .stat-icon {
        color: var(--semantic-red-600);
      }
      .info .stat-icon {
        color: var(--klm-blue);
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
  @Output() itemClicked = new EventEmitter<number>();
}
