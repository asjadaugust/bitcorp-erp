import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardAppearance = 'elevated' | 'bordered' | 'boxed';
export type CardLevel = '1' | '2' | '3';

@Component({
  selector: 'aero-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="aero-card"
      [ngClass]="[
        'aero-card--' + appearance,
        'aero-card--level-' + level,
        spacious ? 'aero-card--spacious' : '',
      ]"
    >
      <div *ngIf="showImage" class="aero-card__image">
        <ng-content select="[card-image]"></ng-content>
      </div>

      <div *ngIf="title || hasHeaderActions" class="aero-card__header">
        <div class="aero-card__header-text">
          <h3 *ngIf="title" class="aero-card__title">{{ title }}</h3>
          <p *ngIf="subtitle" class="aero-card__subtitle">{{ subtitle }}</p>
        </div>
        <div class="aero-card__actions">
          <ng-content select="[header-actions]"></ng-content>
        </div>
      </div>

      <div class="aero-card__content" [class.aero-card__content--no-padding]="noPadding">
        <ng-content></ng-content>
      </div>

      <div *ngIf="hasFooter" class="aero-card__footer">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .aero-card {
        background: var(--grey-100);
        border-radius: var(--radius-md);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* Appearance: Elevated (default) */
      .aero-card--elevated {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
      }

      .aero-card--elevated.aero-card--level-2 {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .aero-card--elevated.aero-card--level-3 {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      /* Appearance: Bordered */
      .aero-card--bordered {
        box-shadow: none;
        border: 1px solid var(--grey-300);
      }

      /* Appearance: Boxed */
      .aero-card--boxed {
        box-shadow: none;
        border: 1px solid var(--grey-200);
        background-color: var(--grey-100);
      }

      /* Image */
      .aero-card__image {
        width: 100%;
        overflow: hidden;
      }

      .aero-card__image ::ng-deep img {
        width: 100%;
        height: auto;
        display: block;
        object-fit: cover;
      }

      /* Header */
      .aero-card__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--s-16) var(--s-24);
        border-bottom: 1px solid var(--grey-200);
        min-height: 64px;
        gap: var(--s-16);
      }

      .aero-card--spacious .aero-card__header {
        padding: var(--s-24) var(--s-32);
      }

      .aero-card__header-text {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
        min-width: 0;
        flex: 1;
      }

      .aero-card__title {
        margin: 0;
        font-family: var(--font-display);
        font-size: var(--type-h4-size);
        line-height: var(--type-h4-line-height);
        font-weight: 500;
        color: var(--primary-900);
      }

      .aero-card__subtitle {
        margin: 0;
        font-family: var(--font-text);
        font-size: var(--type-bodySmall-size);
        line-height: var(--type-bodySmall-line-height);
        color: var(--grey-700);
      }

      .aero-card__actions {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        flex-shrink: 0;
      }

      /* Content */
      .aero-card__content {
        padding: var(--s-24);
        flex: 1;
      }

      .aero-card--spacious .aero-card__content {
        padding: var(--s-32);
      }

      .aero-card__content--no-padding {
        padding: 0;
      }

      /* Footer */
      .aero-card__footer {
        padding: var(--s-16) var(--s-24);
        background-color: var(--grey-50);
        border-top: 1px solid var(--grey-200);
        display: flex;
        justify-content: flex-end;
        gap: var(--s-8);
      }

      .aero-card--spacious .aero-card__footer {
        padding: var(--s-16) var(--s-32);
      }
    `,
  ],
})
export class AeroCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() appearance: CardAppearance = 'elevated';
  @Input() level: CardLevel = '1';
  @Input() spacious = false;
  @Input() noPadding = false;
  @Input() showImage = false;
  @Input() hasFooter = false;
  @Input() hasHeaderActions = false;
}
