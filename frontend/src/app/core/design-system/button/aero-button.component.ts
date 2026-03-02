import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonType =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'text'
  | 'danger'
  | 'outline-danger'
  | 'ghost';
export type ButtonSize = 'large' | 'regular' | 'small';

@Component({
  selector: 'aero-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="aero-btn"
      [ngClass]="[
        'aero-btn--' + variant,
        'aero-btn--' + size,
        iconCenter ? 'aero-btn--icon-only' : '',
        fullWidth ? 'aero-btn--full' : '',
        loading ? 'aero-btn--loading' : '',
      ]"
      [type]="type"
      [disabled]="disabled || loading"
      (click)="onClick($event)"
    >
      <i *ngIf="loading" class="aero-btn__spinner fa-solid fa-spinner fa-spin"></i>
      <ng-container *ngIf="!loading">
        <i *ngIf="iconLeft" class="aero-btn__icon fa-solid" [ngClass]="iconLeft"></i>
        <i *ngIf="iconCenter" class="aero-btn__icon fa-solid" [ngClass]="iconCenter"></i>
        <span *ngIf="!iconCenter" class="aero-btn__label"><ng-content></ng-content></span>
        <i *ngIf="iconRight" class="aero-btn__icon fa-solid" [ngClass]="iconRight"></i>
      </ng-container>
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
        border-radius: var(--radius-sm);
        font-family: var(--font-text);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
        outline: none;
        text-decoration: none;
      }

      /* Sizes */
      .aero-btn--large {
        height: 44px;
        padding: 0 var(--s-24);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
      }

      .aero-btn--regular {
        height: 40px;
        padding: 0 var(--s-20);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
      }

      .aero-btn--small {
        height: 32px;
        padding: 0 var(--s-16);
        font-size: var(--type-bodySmall-size);
        line-height: var(--type-bodySmall-line-height);
      }

      /* Icon-only sizing */
      .aero-btn--icon-only.aero-btn--large {
        width: 48px;
        padding: 0;
      }

      .aero-btn--icon-only.aero-btn--regular {
        width: 44px;
        padding: 0;
      }

      .aero-btn--icon-only.aero-btn--small {
        width: 32px;
        padding: 0;
      }

      /* Full width */
      .aero-btn--full {
        width: 100%;
      }

      /* Primary */
      .aero-btn--primary {
        background-color: var(--primary-500);
        color: var(--grey-100);
      }

      .aero-btn--primary:hover:not(:disabled) {
        background-color: var(--primary-800);
      }

      .aero-btn--primary:active:not(:disabled) {
        background-color: var(--primary-900);
      }

      /* Secondary */
      .aero-btn--secondary {
        background-color: transparent;
        color: var(--primary-900);
        border: 1px solid var(--primary-900);
      }

      .aero-btn--secondary:hover:not(:disabled) {
        background-color: var(--state-primary-hover);
      }

      .aero-btn--secondary:active:not(:disabled) {
        background-color: var(--state-primary-active);
      }

      /* Tertiary */
      .aero-btn--tertiary {
        background-color: transparent;
        color: var(--primary-900);
        padding-left: var(--s-4);
        padding-right: var(--s-4);
      }

      .aero-btn--tertiary .aero-btn__label {
        text-decoration: underline;
      }

      .aero-btn--tertiary:hover:not(:disabled) {
        color: var(--primary-500);
      }

      .aero-btn--tertiary:active:not(:disabled) {
        color: var(--primary-800);
      }

      /* Text */
      .aero-btn--text {
        background-color: transparent;
        color: var(--primary-900);
        padding-left: var(--s-4);
        padding-right: var(--s-4);
      }

      .aero-btn--text:hover:not(:disabled) {
        color: var(--primary-500);
      }

      .aero-btn--text:active:not(:disabled) {
        color: var(--primary-800);
      }

      /* Danger */
      .aero-btn--danger {
        background-color: var(--semantic-red-500);
        color: white;
      }

      .aero-btn--danger:hover:not(:disabled) {
        background-color: var(--semantic-red-700);
      }

      .aero-btn--danger:active:not(:disabled) {
        background-color: var(--semantic-red-800);
      }

      /* Outline Danger */
      .aero-btn--outline-danger {
        background-color: transparent;
        color: var(--semantic-red-500);
        border: 1px solid var(--semantic-red-500);
      }

      .aero-btn--outline-danger:hover:not(:disabled) {
        background-color: var(--semantic-red-50, rgba(239, 68, 68, 0.05));
      }

      .aero-btn--outline-danger:active:not(:disabled) {
        background-color: var(--semantic-red-100, rgba(239, 68, 68, 0.1));
      }

      /* Ghost */
      .aero-btn--ghost {
        background-color: transparent;
        color: var(--grey-700);
      }

      .aero-btn--ghost:hover:not(:disabled) {
        background-color: var(--grey-100);
      }

      .aero-btn--ghost:active:not(:disabled) {
        background-color: var(--grey-200);
      }

      /* Disabled */
      .aero-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* Loading */
      .aero-btn--loading {
        cursor: wait;
      }

      .aero-btn__spinner {
        font-size: 16px;
      }

      .aero-btn__icon {
        font-size: 16px;
        flex-shrink: 0;
      }

      .aero-btn--small .aero-btn__icon {
        font-size: 14px;
      }
    `,
  ],
})
export class AeroButtonComponent {
  @Input() variant: ButtonType = 'primary';
  @Input() size: ButtonSize = 'regular';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() iconLeft = '';
  @Input() iconRight = '';
  @Input() iconCenter = '';

  @Output() clicked = new EventEmitter<Event>();

  onClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
