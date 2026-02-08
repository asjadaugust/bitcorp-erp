import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [class]="getClasses()"
      [disabled]="disabled || loading"
      (click)="handleClick($event)"
    >
      <i *ngIf="loading" class="fa-solid fa-spinner fa-spin"></i>
      <i *ngIf="!loading && icon" [class]="'fa-solid ' + icon"></i>
      <span *ngIf="label || (loading && loadingText)">{{
        loading && loadingText ? loadingText : label
      }}</span>
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        border-radius: 8px;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;
        line-height: 1.25;
        white-space: nowrap;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Variants */
      .btn-primary {
        background: var(--primary-500);
        color: white;
        border-color: var(--primary-500);
      }
      .btn-primary:hover:not(:disabled) {
        background: var(--primary-800);
        border-color: var(--primary-800);
      }

      .btn-secondary {
        background: white;
        border-color: var(--grey-300, #d1d5db);
        color: var(--grey-700, #374151);
      }
      .btn-secondary:hover:not(:disabled) {
        background: var(--grey-50, #f9fafb);
        border-color: var(--grey-400, #9ca3af);
      }

      .btn-danger {
        background: var(--semantic-red-500, #ef4444);
        color: white;
        border-color: var(--semantic-red-500, #ef4444);
      }
      .btn-danger:hover:not(:disabled) {
        background: var(--semantic-red-600, #dc2626);
        border-color: var(--semantic-red-600, #dc2626);
      }

      .btn-success {
        background: var(--semantic-green-500, #10b981);
        color: white;
        border-color: var(--semantic-green-500, #10b981);
      }
      .btn-success:hover:not(:disabled) {
        background: var(--semantic-green-600, #059669);
        border-color: var(--semantic-green-600, #059669);
      }

      .btn-outline-primary {
        background: transparent;
        border-color: var(--primary-500);
        color: var(--primary-500);
      }
      .btn-outline-primary:hover:not(:disabled) {
        background: var(--primary-100);
      }

      .btn-outline-danger {
        background: transparent;
        border-color: var(--semantic-red-500, #ef4444);
        color: var(--semantic-red-500, #ef4444);
      }
      .btn-outline-danger:hover:not(:disabled) {
        background: var(--semantic-red-50, #fef2f2);
      }

      .btn-ghost {
        background: transparent;
        border-color: transparent;
        color: var(--grey-700, #374151);
      }
      .btn-ghost:hover:not(:disabled) {
        background: var(--grey-100, #f3f4f6);
        border-color: var(--grey-200, #e5e7eb);
      }

      .btn-icon {
        padding: 0.5rem;
        width: 32px;
        height: 32px;
      }

      /* Sizes */
      .btn-sm {
        padding: 0.5rem 0.75rem;
        font-size: 12px;
      }

      .btn-lg {
        padding: 1rem 1.5rem;
        font-size: 16px;
      }

      .btn-full {
        width: 100%;
      }
    `,
  ],
})
export class ButtonComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() variant:
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'success'
    | 'outline-primary'
    | 'outline-danger'
    | 'ghost'
    | 'icon' = 'primary';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() loadingText = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() fullWidth = false;

  @Output() onClick = new EventEmitter<Event>();

  getClasses(): string {
    let classes = `btn btn-${this.variant}`;

    if (this.size !== 'md') {
      classes += ` btn-${this.size}`;
    }

    if (this.fullWidth) {
      classes += ' btn-full';
    }

    return classes;
  }

  handleClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.onClick.emit(event);
    }
  }
}
