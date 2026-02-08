import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-card">
      <div class="page-card-header" *ngIf="title || subtitle">
        <div class="header-content">
          <h2 *ngIf="title" class="page-card-title">{{ title }}</h2>
          <p *ngIf="subtitle" class="page-card-subtitle">{{ subtitle }}</p>
        </div>
        <div class="header-actions">
          <ng-content select="[header-actions]"></ng-content>
        </div>
      </div>

      <div class="page-card-body" [class.no-padding]="noPadding">
        <ng-content></ng-content>
      </div>

      <div class="page-card-footer">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .page-card {
        background: #ffffff;
        border-radius: var(--radius-md, 8px);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        margin-bottom: var(--s-24, 24px);
      }

      .page-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: var(--s-24, 24px);
        border-bottom: 1px solid var(--grey-200, #e5e7eb);
        gap: var(--s-16, 16px);
      }

      .header-content {
        flex: 1;
      }

      .page-card-title {
        font-size: 20px;
        font-weight: 600;
        color: var(--primary-900, #1a1a1a);
        margin: 0 0 var(--s-4, 4px) 0;
        line-height: 1.3;
      }

      .page-card-subtitle {
        font-size: 14px;
        color: var(--grey-700);
        margin: 0;
        line-height: 1.5;
      }

      .header-actions {
        display: flex;
        gap: var(--s-8, 8px);
        flex-shrink: 0;
      }

      .header-actions:empty {
        display: none;
      }

      .page-card-body {
        padding: var(--s-24, 24px);
      }

      .page-card-body.no-padding {
        padding: 0;
      }

      .page-card-footer {
        padding: var(--s-16, 16px) var(--s-24, 24px);
        background: var(--grey-50, #f9fafb);
        border-top: 1px solid var(--grey-200, #e5e7eb);
      }

      .page-card-footer:empty {
        display: none;
      }

      /* Compact variant */
      :host-context(.compact) .page-card-header {
        padding: var(--s-16, 16px) var(--s-24, 24px);
      }

      :host-context(.compact) .page-card-body {
        padding: var(--s-16, 16px) var(--s-24, 24px);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .page-card-header {
          flex-direction: column;
        }

        .header-actions {
          width: 100%;
          justify-content: flex-start;
        }
      }
    `,
  ],
})
export class PageCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() noPadding = false;
}
