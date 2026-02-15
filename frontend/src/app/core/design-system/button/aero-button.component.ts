import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'aero-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button [type]="type" [class]="classes" [disabled]="disabled" (click)="onClick($event)">
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .aero-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--s-8);
        border: none;
        border-radius: var(--s-4);
        cursor: pointer;
        font-family: var(--font-family-base);
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }

        /* Sizes */
        &.aero-btn--small {
          padding: var(--s-4) var(--s-12);
          font-size: var(--type-label-size);
          height: 32px;
        }

        &.aero-btn--medium {
          padding: var(--s-8) var(--s-16);
          font-size: var(--type-bodySmall-size);
          height: 40px;
        }

        &.aero-btn--large {
          padding: var(--s-12) var(--s-24);
          font-size: var(--type-body-size);
          height: 48px;
        }

        /* Variants */
        &.aero-btn--primary {
          background-color: var(--primary-500);
          color: var(--neutral-0);

          &:hover:not(:disabled) {
            background-color: var(--primary-800);
          }

          &:active:not(:disabled) {
            background-color: var(--primary-900);
          }
        }

        &.aero-btn--secondary {
          background-color: transparent;
          border: 1px solid var(--primary-500);
          color: var(--primary-500);

          &:hover:not(:disabled) {
            background-color: var(--primary-100);
          }

          &:active:not(:disabled) {
            background-color: var(--primary-300);
          }
        }

        &.aero-btn--tertiary {
          background-color: transparent;
          color: var(--primary-500);
          padding-left: var(--s-8);
          padding-right: var(--s-8);

          &:hover:not(:disabled) {
            background-color: var(--primary-100);
          }
        }

        &.aero-btn--danger {
          background-color: var(--semantic-red-500);
          color: var(--neutral-0);

          &:hover:not(:disabled) {
            background-color: var(--semantic-red-900);
          }
        }

        &.aero-btn--success {
          background-color: var(--semantic-green-500);
          color: var(--neutral-0);

          &:hover:not(:disabled) {
            background-color: var(--semantic-green-900);
          }
        }
      }
    `,
  ],
})
export class AeroButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'medium';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() fullWidth = false;

  get classes(): string {
    return [
      'aero-btn',
      `aero-btn--${this.variant}`,
      `aero-btn--${this.size}`,
      this.fullWidth ? 'aero-btn--full-width' : '',
    ].join(' ');
  }

  onClick(event: MouseEvent) {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
