import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonGroupType = 'primary' | 'secondary';
export type ButtonGroupSize = 'regular' | 'small';

export interface ButtonGroupItem {
  label?: string;
  icon?: string;
  value: unknown;
  disabled?: boolean;
}

@Component({
  selector: 'aero-button-group',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="aero-btn-group"
      [ngClass]="['aero-btn-group--' + type, 'aero-btn-group--' + size]"
      role="group"
    >
      <button
        *ngFor="let item of items"
        type="button"
        class="aero-btn-group__btn"
        [class.aero-btn-group__btn--active]="isActive(item)"
        [disabled]="item.disabled"
        (click)="selectItem(item)"
      >
        <i *ngIf="item.icon" class="aero-btn-group__icon" [ngClass]="item.icon"></i>
        <span *ngIf="item.label">{{ item.label }}</span>
      </button>
    </div>
  `,
  styles: [
    `
      .aero-btn-group {
        display: inline-flex;
      }

      .aero-btn-group__btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--s-8);
        border: 1px solid var(--grey-500);
        font-family: var(--font-text);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
        outline: none;
      }

      /* Remove double borders between buttons */
      .aero-btn-group__btn + .aero-btn-group__btn {
        margin-left: -1px;
      }

      .aero-btn-group__btn:first-child {
        border-radius: var(--radius-sm) 0 0 var(--radius-sm);
      }

      .aero-btn-group__btn:last-child {
        border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      }

      .aero-btn-group__btn:only-child {
        border-radius: var(--radius-sm);
      }

      /* Size: regular */
      .aero-btn-group--regular .aero-btn-group__btn {
        height: 44px;
        padding: 0 var(--s-16);
        font-size: var(--type-body-size);
      }

      /* Size: small */
      .aero-btn-group--small .aero-btn-group__btn {
        height: 32px;
        padding: 0 var(--s-12);
        font-size: var(--type-bodySmall-size);
      }

      /* Type: primary */
      .aero-btn-group--primary .aero-btn-group__btn {
        background-color: var(--neutral-0);
        color: var(--primary-900);
        border-color: var(--grey-500);
      }

      .aero-btn-group--primary
        .aero-btn-group__btn:hover:not(:disabled):not(.aero-btn-group__btn--active) {
        border-color: var(--primary-500);
        color: var(--primary-500);
        z-index: 1;
      }

      .aero-btn-group--primary .aero-btn-group__btn--active {
        background-color: var(--primary-500);
        border-color: var(--primary-500);
        color: white;
        z-index: 2;
      }

      /* Type: secondary */
      .aero-btn-group--secondary .aero-btn-group__btn {
        background-color: var(--neutral-0);
        color: var(--primary-900);
        border-color: var(--grey-300);
      }

      .aero-btn-group--secondary
        .aero-btn-group__btn:hover:not(:disabled):not(.aero-btn-group__btn--active) {
        background-color: var(--grey-100);
        z-index: 1;
      }

      .aero-btn-group--secondary .aero-btn-group__btn--active {
        background-color: var(--primary-100);
        border-color: var(--primary-500);
        color: var(--primary-900);
        z-index: 2;
      }

      .aero-btn-group__btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .aero-btn-group__icon {
        font-size: 14px;
      }
    `,
  ],
})
export class AeroButtonGroupComponent {
  @Input() items: ButtonGroupItem[] = [];
  @Input() type: ButtonGroupType = 'primary';
  @Input() size: ButtonGroupSize = 'regular';
  @Input() activeValue: unknown = null;

  @Output() activeValueChange = new EventEmitter<unknown>();

  isActive(item: ButtonGroupItem): boolean {
    return this.activeValue === item.value;
  }

  selectItem(item: ButtonGroupItem): void {
    if (item.disabled) return;
    this.activeValue = item.value;
    this.activeValueChange.emit(item.value);
  }
}
