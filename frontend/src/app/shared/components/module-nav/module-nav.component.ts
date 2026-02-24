import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TabItem } from '../page-layout/page-layout.component';

export { TabItem };

/**
 * ModuleNavComponent — persistent horizontal tab bar for multi-section modules.
 *
 * Usage:
 *   <app-module-nav [tabs]="tabs"></app-module-nav>
 *
 * Visual design matches PageLayoutComponent's tab-navigation / tab-item exactly.
 * This is the single source of truth for module-level navigation styling.
 */
@Component({
  selector: 'app-module-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="nav-container" *ngIf="tabs && tabs.length > 0">
      <nav class="tab-navigation">
        <a
          *ngFor="let tab of tabs"
          [routerLink]="tab.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="tab.exact ? { exact: true } : { exact: false }"
          class="tab-item"
        >
          <i *ngIf="tab.icon" [class]="'fa-solid ' + tab.icon"></i>
          <span>{{ tab.label }}</span>
        </a>
      </nav>
    </div>
  `,
  styles: [
    `
      .nav-container {
        padding: 0 54px;
        background: transparent;
      }

      /* Matches PageLayoutComponent (.tab-navigation, .tab-item) exactly */
      .tab-navigation {
        display: flex;
        gap: 0;
        border-bottom: 2px solid var(--grey-200);
        overflow-x: auto;
        overflow-y: clip;
        min-height: 48px;
        height: fit-content;
        flex-wrap: nowrap;
        scrollbar-width: none;
        -ms-overflow-style: none;
        margin-top: var(--s-8);
      }

      .tab-navigation::-webkit-scrollbar {
        display: none;
      }

      .tab-item {
        padding: var(--s-12) var(--s-20);
        color: var(--grey-700);
        text-decoration: none;
        font-weight: 500;
        font-size: 14px;
        border-bottom: 3px solid transparent;
        margin-bottom: -2px;
        transition: all 0.2s;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: var(--s-8);
        min-height: 46px;
        position: relative;
        z-index: 1;
      }

      .tab-item:hover {
        color: var(--primary-800);
        background: var(--primary-100);
        border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      }

      .tab-item.active {
        color: var(--primary-800);
        border-bottom-color: var(--primary-500);
        border-bottom-width: 3px;
        font-weight: 600;
        background: transparent;
        z-index: 2;
      }

      .tab-item i {
        font-size: 14px;
      }

      @media (max-width: 768px) {
        .nav-container {
          padding: 0 var(--s-16);
        }

        .tab-navigation {
          gap: var(--s-2);
        }

        .tab-item {
          padding: var(--s-10) var(--s-12);
          font-size: 13px;
        }
      }
    `,
  ],
})
export class ModuleNavComponent {
  @Input() tabs: TabItem[] = [];
}
