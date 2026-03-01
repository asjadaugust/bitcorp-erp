import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'aero-accordion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="aero-accordion"
      [class.aero-accordion--expanded]="expanded"
      [class.aero-accordion--show-line]="showLineBottom"
    >
      <button
        type="button"
        class="aero-accordion__header"
        (click)="toggle()"
        [attr.aria-expanded]="expanded"
      >
        <i *ngIf="icon" class="aero-accordion__icon" [ngClass]="icon"></i>
        <span class="aero-accordion__label">{{ label }}</span>
        <span *ngIf="counter !== undefined" class="aero-accordion__counter">{{ counter }}</span>
        <i class="fa-solid fa-chevron-down aero-accordion__chevron"></i>
      </button>

      <div *ngIf="expanded" class="aero-accordion__content">
        <div *ngIf="text" class="aero-accordion__text">{{ text }}</div>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .aero-accordion {
        display: flex;
        flex-direction: column;
      }

      .aero-accordion--show-line {
        border-bottom: 1px solid var(--grey-200);
      }

      .aero-accordion__header {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        padding: var(--s-12) var(--s-16);
        border: none;
        background: none;
        cursor: pointer;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--primary-900);
        text-align: left;
        width: 100%;
        transition: background-color 0.1s ease;
        outline: none;
      }

      .aero-accordion__header:hover {
        background-color: var(--grey-100);
      }

      .aero-accordion__header:active {
        background-color: var(--grey-200);
      }

      .aero-accordion__icon {
        font-size: 20px;
        flex-shrink: 0;
        color: var(--primary-900);
      }

      .aero-accordion__label {
        flex: 1;
        font-weight: 500;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .aero-accordion__counter {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        padding: 0 var(--s-8);
        border-radius: 9999px;
        background-color: var(--grey-200);
        font-size: var(--type-bodySmall-size);
        font-weight: 500;
        color: var(--primary-900);
        flex-shrink: 0;
      }

      .aero-accordion__chevron {
        font-size: 12px;
        flex-shrink: 0;
        color: var(--primary-900);
        transition: transform 0.2s ease;
      }

      .aero-accordion--expanded .aero-accordion__chevron {
        transform: rotate(180deg);
      }

      .aero-accordion__content {
        padding: 0 var(--s-16) var(--s-16);
      }

      .aero-accordion__text {
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        color: var(--grey-700);
      }
    `,
  ],
})
export class AeroAccordionComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() text = '';
  @Input() counter?: number;
  @Input() expanded = false;
  @Input() showLineBottom = true;

  toggle(): void {
    this.expanded = !this.expanded;
  }
}
