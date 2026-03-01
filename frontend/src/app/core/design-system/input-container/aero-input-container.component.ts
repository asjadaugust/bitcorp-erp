import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type InputContainerSize = 'small' | 'large';
export type InputContainerState = 'default' | 'hover' | 'active' | 'disabled';

@Component({
  selector: 'aero-input-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="aero-input-container"
      [ngClass]="[
        'aero-input-container--' + size,
        'aero-input-container--' + state,
        active ? 'aero-input-container--active' : '',
      ]"
      [class.aero-input-container--with-image]="showImage"
      (click)="!disabled && onContainerClick()"
    >
      <div *ngIf="showImage" class="aero-input-container__image">
        <ng-content select="[image]"></ng-content>
      </div>
      <div class="aero-input-container__content">
        <ng-content select="[leftSlot]"></ng-content>
        <ng-content select="[control]"></ng-content>
        <div class="aero-input-container__text">
          <span class="aero-input-container__label">{{ label }}</span>
          <span *ngIf="hint" class="aero-input-container__hint">{{ hint }}</span>
        </div>
        <ng-content select="[rightSlot]"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .aero-input-container {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        background-color: var(--grey-100);
        overflow: hidden;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .aero-input-container--large {
        gap: var(--s-12);
        padding: var(--s-16);
      }

      .aero-input-container--small {
        gap: var(--s-12);
        padding: var(--s-8);
      }

      /* States */
      .aero-input-container:hover:not(.aero-input-container--disabled):not(
          .aero-input-container--active
        ) {
        border-color: var(--primary-900);
        box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
      }

      .aero-input-container--active {
        background-color: var(--primary-100);
        border-color: var(--primary-500);
        border-width: 2px;
        box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
      }

      .aero-input-container--disabled {
        background-color: var(--grey-100);
        border-color: var(--grey-500);
        cursor: not-allowed;
        opacity: 0.8;
      }

      .aero-input-container__image {
        width: 100%;
        overflow: hidden;
      }

      .aero-input-container__image ::ng-deep img {
        width: 100%;
        height: auto;
        object-fit: cover;
      }

      .aero-input-container__content {
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .aero-input-container__text {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
      }

      .aero-input-container__label {
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        font-weight: 400;
        color: var(--primary-900);
      }

      .aero-input-container__hint {
        font-family: var(--font-text);
        font-size: var(--type-bodySmall-size);
        line-height: var(--type-bodySmall-line-height);
        font-weight: 400;
        color: var(--grey-700);
      }
    `,
  ],
})
export class AeroInputContainerComponent {
  @Input() label = '';
  @Input() hint = '';
  @Input() size: InputContainerSize = 'large';
  @Input() state: InputContainerState = 'default';
  @Input() active = false;
  @Input() disabled = false;
  @Input() showImage = false;

  onContainerClick(): void {
    // Parent handles toggle via click event binding
  }
}
