import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SideMenuItem {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
  children?: SideMenuItem[];
}

@Component({
  selector: 'aero-side-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="aero-side-menu" role="navigation">
      <ng-container *ngFor="let item of items">
        <div
          class="aero-side-menu__group"
          [class.aero-side-menu__group--expanded]="isExpanded(item.value)"
        >
          <button
            type="button"
            class="aero-side-menu__item"
            [class.aero-side-menu__item--active]="item.value === activeValue"
            [class.aero-side-menu__item--parent]="item.children && item.children.length > 0"
            [disabled]="item.disabled"
            (click)="onItemClick(item)"
          >
            <i *ngIf="item.icon" class="aero-side-menu__icon" [ngClass]="item.icon"></i>
            <span class="aero-side-menu__label">{{ item.label }}</span>
            <i
              *ngIf="item.children && item.children.length > 0"
              class="fa-solid fa-chevron-down aero-side-menu__expand"
              [class.aero-side-menu__expand--open]="isExpanded(item.value)"
            ></i>
          </button>

          <div
            *ngIf="item.children && item.children.length > 0 && isExpanded(item.value)"
            class="aero-side-menu__children"
          >
            <button
              *ngFor="let child of item.children"
              type="button"
              class="aero-side-menu__item aero-side-menu__item--child"
              [class.aero-side-menu__item--active]="child.value === activeValue"
              [disabled]="child.disabled"
              (click)="selectItem(child)"
            >
              <i *ngIf="child.icon" class="aero-side-menu__icon" [ngClass]="child.icon"></i>
              <span class="aero-side-menu__label">{{ child.label }}</span>
            </button>
          </div>
        </div>
      </ng-container>
    </nav>
  `,
  styles: [
    `
      .aero-side-menu {
        display: flex;
        flex-direction: column;
        width: 100%;
        background-color: var(--grey-100);
      }

      .aero-side-menu__item {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        padding: var(--s-10) var(--s-16);
        border: none;
        background: none;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        font-weight: 400;
        color: var(--primary-900);
        cursor: pointer;
        width: 100%;
        text-align: left;
        transition: background-color 0.1s ease;
        outline: none;
        position: relative;
      }

      .aero-side-menu__item:hover:not(:disabled):not(.aero-side-menu__item--active) {
        background-color: var(--grey-100);
      }

      .aero-side-menu__item--active {
        background-color: var(--primary-100);
        color: var(--primary-500);
        font-weight: 500;
      }

      .aero-side-menu__item--active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background-color: var(--primary-500);
        border-radius: 0 3px 3px 0;
      }

      .aero-side-menu__item:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .aero-side-menu__item--child {
        padding-left: var(--s-32);
        font-size: var(--type-bodySmall-size);
      }

      .aero-side-menu__icon {
        font-size: 16px;
        width: 20px;
        text-align: center;
        flex-shrink: 0;
      }

      .aero-side-menu__label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .aero-side-menu__expand {
        font-size: 10px;
        color: var(--grey-600);
        flex-shrink: 0;
        transition: transform 0.2s ease;
      }

      .aero-side-menu__expand--open {
        transform: rotate(180deg);
      }

      .aero-side-menu__children {
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class AeroSideMenuComponent {
  @Input() items: SideMenuItem[] = [];
  @Input() activeValue = '';

  @Output() activeValueChange = new EventEmitter<string>();
  @Output() navigate = new EventEmitter<SideMenuItem>();

  expandedGroups = new Set<string>();

  isExpanded(value: string): boolean {
    return this.expandedGroups.has(value);
  }

  onItemClick(item: SideMenuItem): void {
    if (item.disabled) return;
    if (item.children && item.children.length > 0) {
      this.toggleGroup(item.value);
    } else {
      this.selectItem(item);
    }
  }

  selectItem(item: SideMenuItem): void {
    if (item.disabled) return;
    this.activeValue = item.value;
    this.activeValueChange.emit(item.value);
    this.navigate.emit(item);
  }

  private toggleGroup(value: string): void {
    if (this.expandedGroups.has(value)) {
      this.expandedGroups.delete(value);
    } else {
      this.expandedGroups.add(value);
    }
  }
}
