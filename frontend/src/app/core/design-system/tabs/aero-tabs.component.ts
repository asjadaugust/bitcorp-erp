import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'aero-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="aero-tabs">
      <div
        *ngFor="let tab of tabs"
        class="aero-tab"
        [class.aero-tab--active]="activeTabId === tab.id"
        (click)="onTabClick(tab.id)"
        (keydown.enter)="onTabClick(tab.id)"
        tabindex="0"
        role="tab"
      >
        <i *ngIf="tab.icon" [class]="tab.icon"></i>
        {{ tab.label }}
      </div>
    </div>
  `,
  styles: [
    `
      .aero-tabs {
        display: flex;
        border-bottom: 1px solid var(--grey-300);
        margin-bottom: var(--s-24);
        gap: var(--s-24);
        overflow-x: auto;
        overflow-y: visible;
        min-height: 48px;

        /* Hide scrollbar but keep functionality */
        scrollbar-width: none;
        -ms-overflow-style: none;
        &::-webkit-scrollbar {
          display: none;
        }
      }

      .aero-tab {
        padding: var(--s-12) var(--s-4);
        cursor: pointer;
        font-family: var(--font-family-base);
        font-size: var(--type-bodySmall-size);
        font-weight: 500;
        color: var(--grey-700);
        border-bottom: 3px solid transparent;
        margin-bottom: -1px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: var(--s-8);
        white-space: nowrap;
        flex-shrink: 0;

        &:hover {
          color: var(--primary-500);
        }

        &.aero-tab--active {
          color: var(--primary-500);
          border-bottom-color: var(--primary-500);
        }
      }
    `,
  ],
})
export class AeroTabsComponent {
  @Input() tabs: Tab[] = [];
  @Input() activeTabId = '';
  @Output() activeTabIdChange = new EventEmitter<string>();

  onTabClick(id: string) {
    this.activeTabId = id;
    this.activeTabIdChange.emit(id);
  }
}
