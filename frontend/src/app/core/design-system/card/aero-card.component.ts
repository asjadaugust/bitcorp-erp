import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'aero-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="aero-card" [class.aero-card--outlined]="variant === 'outlined'">
      <div *ngIf="title" class="aero-card__header">
        <h3 class="aero-card__title">{{ title }}</h3>
        <div class="aero-card__actions">
          <ng-content select="[header-actions]"></ng-content>
        </div>
      </div>

      <div class="aero-card__content">
        <ng-content></ng-content>
      </div>

      <div class="aero-card__footer" *ngIf="hasFooter">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .aero-card {
        background: var(--neutral-0);
        border-radius: var(--s-8);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        margin-bottom: var(--s-24);
        display: flex;
        flex-direction: column;
        overflow: hidden;

        &--outlined {
          box-shadow: none;
          border: 1px solid var(--grey-300);
        }

        &__header {
          padding: var(--s-16) var(--s-24);
          border-bottom: 1px solid var(--grey-200);
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 64px;
        }

        &__title {
          margin: 0;
          font-family: var(--font-family-display);
          font-size: var(--type-h4-size);
          color: var(--primary-900);
          font-weight: 500;
        }

        &__content {
          padding: var(--s-24);
          flex: 1;
        }

        &__footer {
          padding: var(--s-16) var(--s-24);
          background-color: var(--grey-100);
          border-top: 1px solid var(--grey-200);
          display: flex;
          justify-content: flex-end;
          gap: var(--s-8);
        }
      }
    `,
  ],
})
export class AeroCardComponent {
  @Input() title?: string;
  @Input() variant: 'default' | 'outlined' = 'default';
  @Input() hasFooter = false;
}
