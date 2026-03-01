import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ChipSize = 'small' | 'medium' | 'large' | 'xl';

@Component({
  selector: 'aero-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="aero-chip"
      [ngClass]="['aero-chip--' + size, active ? 'aero-chip--active' : 'aero-chip--inactive']"
      [class.aero-chip--disabled]="disabled"
      (click)="onChipClick()"
      [attr.tabindex]="disabled ? -1 : 0"
      role="button"
      (keydown.enter)="onChipClick()"
      (keydown.space)="onChipClick(); $event.preventDefault()"
    >
      <i *ngIf="icon" class="aero-chip__icon" [ngClass]="icon"></i>
      <span class="aero-chip__label">{{ label }}</span>
      <button
        *ngIf="removable && active"
        type="button"
        class="aero-chip__remove"
        (click)="onRemove($event)"
        tabindex="-1"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </span>
  `,
  styles: [
    `
      .aero-chip {
        display: inline-flex;
        align-items: center;
        border-radius: 9999px;
        font-family: var(--font-text);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
        user-select: none;
        outline: none;
      }

      /* Sizes */
      .aero-chip--small {
        height: 24px;
        padding: 0 var(--s-8);
        gap: var(--s-4);
        font-size: 12px;
        line-height: 24px;
      }

      .aero-chip--medium {
        height: 32px;
        padding: 0 var(--s-12);
        gap: var(--s-4);
        font-size: var(--type-bodySmall-size);
        line-height: 32px;
      }

      .aero-chip--large {
        height: 44px;
        padding: 0 var(--s-16);
        gap: var(--s-8);
        font-size: var(--type-body-size);
        line-height: 44px;
      }

      .aero-chip--xl {
        height: 52px;
        padding: 0 var(--s-16);
        gap: var(--s-8);
        font-size: var(--type-body-size);
        line-height: 52px;
      }

      /* Active state */
      .aero-chip--active {
        background-color: var(--primary-500);
        color: white;
        border: 1px solid var(--primary-500);
      }

      .aero-chip--active:hover:not(.aero-chip--disabled) {
        background-color: var(--primary-900);
        border-color: var(--primary-900);
      }

      /* Inactive state */
      .aero-chip--inactive {
        background-color: var(--grey-100);
        color: var(--primary-900);
        border: 1px solid var(--grey-500);
      }

      .aero-chip--inactive:hover:not(.aero-chip--disabled) {
        border-color: var(--primary-500);
        color: var(--primary-500);
      }

      /* Disabled */
      .aero-chip--disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* Icon */
      .aero-chip__icon {
        font-size: inherit;
        flex-shrink: 0;
      }

      .aero-chip--small .aero-chip__icon {
        font-size: 10px;
      }
      .aero-chip--medium .aero-chip__icon {
        font-size: 12px;
      }

      /* Remove button */
      .aero-chip__remove {
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: none;
        color: inherit;
        cursor: pointer;
        padding: 0;
        font-size: inherit;
        opacity: 0.8;
        flex-shrink: 0;
      }

      .aero-chip__remove:hover {
        opacity: 1;
      }
    `,
  ],
})
export class AeroChipComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() size: ChipSize = 'medium';
  @Input() active = false;
  @Input() removable = false;
  @Input() disabled = false;

  @Output() chipClick = new EventEmitter<void>();
  @Output() removed = new EventEmitter<void>();

  onChipClick(): void {
    if (!this.disabled) this.chipClick.emit();
  }

  onRemove(event: Event): void {
    event.stopPropagation();
    if (!this.disabled) this.removed.emit();
  }
}
