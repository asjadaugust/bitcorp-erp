import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'aero-list-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="aero-list-item"
      [class.aero-list-item--clickable]="clickable"
      [class.aero-list-item--active]="active"
      [class.aero-list-item--disabled]="disabled"
      (click)="onItemClick()"
      [attr.tabindex]="clickable && !disabled ? 0 : null"
      [attr.role]="clickable ? 'button' : null"
      (keydown.enter)="onItemClick()"
    >
      <div *ngIf="icon" class="aero-list-item__icon">
        <i [ngClass]="icon"></i>
      </div>

      <ng-content select="[leading]"></ng-content>

      <div class="aero-list-item__content">
        <span class="aero-list-item__label">{{ label }}</span>
        <span *ngIf="description" class="aero-list-item__description">{{ description }}</span>
      </div>

      <div class="aero-list-item__trailing">
        <ng-content select="[trailing]"></ng-content>
      </div>

      <ng-content select="[action]"></ng-content>
    </div>
  `,
  styles: [
    `
      .aero-list-item {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        padding: var(--s-12) var(--s-16);
        min-height: 48px;
        transition: background-color 0.1s ease;
      }

      .aero-list-item--clickable {
        cursor: pointer;
        outline: none;
      }

      .aero-list-item--clickable:hover:not(.aero-list-item--disabled) {
        background-color: var(--grey-100);
      }

      .aero-list-item--clickable:active:not(.aero-list-item--disabled) {
        background-color: var(--grey-200);
      }

      .aero-list-item--active {
        background-color: var(--primary-100);
      }

      .aero-list-item--active:hover:not(.aero-list-item--disabled) {
        background-color: var(--primary-100);
      }

      .aero-list-item--disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .aero-list-item__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        color: var(--primary-900);
        font-size: 16px;
        flex-shrink: 0;
      }

      .aero-list-item__content {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
        gap: 2px;
      }

      .aero-list-item__label {
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        font-weight: 400;
        color: var(--primary-900);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .aero-list-item__description {
        font-family: var(--font-text);
        font-size: var(--type-bodySmall-size);
        line-height: var(--type-bodySmall-line-height);
        color: var(--grey-700);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .aero-list-item__trailing {
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }
    `,
  ],
})
export class AeroListItemComponent {
  @Input() label = '';
  @Input() description = '';
  @Input() icon = '';
  @Input() active = false;
  @Input() clickable = false;
  @Input() disabled = false;

  @Output() itemClick = new EventEmitter<void>();

  onItemClick(): void {
    if (this.clickable && !this.disabled) {
      this.itemClick.emit();
    }
  }
}
