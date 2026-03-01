import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NavItem {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'aero-nav-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="aero-nav-bar" role="navigation">
      <button
        *ngFor="let item of items"
        type="button"
        class="aero-nav-bar__item"
        [class.aero-nav-bar__item--active]="item.value === activeValue"
        [disabled]="item.disabled"
        (click)="selectItem(item)"
      >
        <i *ngIf="item.icon" class="aero-nav-bar__icon" [ngClass]="item.icon"></i>
        <span>{{ item.label }}</span>
      </button>
    </nav>
  `,
  styles: [
    `
      .aero-nav-bar {
        display: flex;
        align-items: stretch;
        height: 48px;
        border-bottom: 1px solid var(--grey-200);
        background-color: var(--grey-100);
        gap: 0;
      }

      .aero-nav-bar__item {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        padding: 0 var(--s-16);
        border: none;
        background: none;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        font-weight: 500;
        color: var(--grey-700);
        cursor: pointer;
        position: relative;
        transition: color 0.15s ease;
        white-space: nowrap;
      }

      .aero-nav-bar__item::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        background-color: transparent;
        border-radius: 3px 3px 0 0;
        transition: background-color 0.15s ease;
      }

      .aero-nav-bar__item:hover:not(:disabled):not(.aero-nav-bar__item--active) {
        color: var(--primary-900);
      }

      .aero-nav-bar__item--active {
        color: var(--primary-500);
      }

      .aero-nav-bar__item--active::after {
        background-color: var(--primary-500);
      }

      .aero-nav-bar__item:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .aero-nav-bar__icon {
        font-size: 16px;
      }
    `,
  ],
})
export class AeroNavBarComponent {
  @Input() items: NavItem[] = [];
  @Input() activeValue = '';

  @Output() activeValueChange = new EventEmitter<string>();
  @Output() navigate = new EventEmitter<NavItem>();

  selectItem(item: NavItem): void {
    if (item.disabled) return;
    this.activeValue = item.value;
    this.activeValueChange.emit(item.value);
    this.navigate.emit(item);
  }
}
