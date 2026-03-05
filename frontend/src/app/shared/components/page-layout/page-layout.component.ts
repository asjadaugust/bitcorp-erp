import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BackButtonComponent } from '../back-button/back-button.component';
import { AeroTabsComponent } from '../aero-tabs/aero-tabs.component';

export interface TabItem {
  label: string;
  route?: string;
  icon?: string;
  animate?: boolean;
  exact?: boolean;
}

export interface Breadcrumb {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, BackButtonComponent, AeroTabsComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-main">
          <div class="page-title-wrapper">
            <app-back-button *ngIf="backUrl" [url]="backUrl" class="mr-4"></app-back-button>
            <div *ngIf="icon && !backUrl" class="icon-wrapper">
              <i [class]="'fa-solid ' + icon"></i>
            </div>
            <div class="title-content">
              <h1>{{ title }}</h1>
              <div class="breadcrumb" *ngIf="breadcrumbs.length">
                <ng-container *ngFor="let item of breadcrumbs; let last = last">
                  <ng-container *ngIf="!last">
                    <a [routerLink]="item.url" class="breadcrumb-link">{{ item.label }}</a>
                    <span class="separator">›</span>
                  </ng-container>
                  <span *ngIf="last" class="breadcrumb-current">{{ item.label }}</span>
                </ng-container>
              </div>
            </div>
          </div>

          <div class="header-actions">
            <ng-content select="[actions]"></ng-content>
          </div>
        </div>
      </div>

      <!-- Tab Navigation (Optional) -->
      <div class="nav-container" *ngIf="tabs && tabs.length > 0">
        <app-aero-tabs [tabs]="tabs"></app-aero-tabs>
      </div>

      <!-- Sub-Tab Navigation (Optional — pill button group) -->
      <div class="subtab-container" *ngIf="subtabs && subtabs.length > 0">
        <nav class="subtab-bar">
          <ng-container *ngFor="let tab of subtabs">
            <a
              *ngIf="tab.route"
              [routerLink]="tab.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="tab.exact ? { exact: true } : { exact: false }"
              class="subtab-item"
            >
              {{ tab.label }}
            </a>
          </ng-container>
        </nav>
      </div>

      <!-- Content Area -->
      <div class="content-wrapper">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .page-container {
        background: var(--grey-100);
        min-height: calc(100vh - 72px);
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
        padding: var(--s-24) var(--s-32);
      }

      .nav-container {
        padding: 0 54px;
        background: transparent;
      }

      .subtab-container {
        padding: 0 54px;
      }

      .subtab-bar {
        display: flex;
        gap: 0;
        border-bottom: 2px solid var(--grey-200);
      }

      .subtab-item {
        padding: var(--s-8) var(--s-16);
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-700);
        text-decoration: none;
        border-bottom: 3px solid transparent;
        margin-bottom: -2px;
        transition: all 0.15s;
        white-space: nowrap;
        border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      }

      .subtab-item:hover {
        color: var(--primary-800);
        background: var(--primary-100);
      }

      .subtab-item.active {
        color: var(--primary-800);
        border-bottom-color: var(--primary-500);
        font-weight: 600;
      }

      /* Header */
      .page-header {
        background: transparent;
        margin-bottom: 0;
      }

      .header-main {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--s-24);
        flex-wrap: wrap;
      }

      .page-title-wrapper {
        display: flex;
        align-items: center;
        gap: var(--s-16);
      }

      .icon-wrapper {
        width: 48px;
        height: 48px;
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: var(--s-12);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: var(--shadow-sm);
      }

      .title-content {
        display: flex;
        flex-direction: column;
      }

      h1 {
        margin: 0;
        font-size: var(--type-h2-size);
        font-weight: 700;
        color: var(--grey-900);
        font-family: var(--font-family-display);
        line-height: 1.2;
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        font-size: var(--type-bodySmall-size);
        color: var(--grey-700);
      }

      .breadcrumb-link {
        color: var(--grey-700);
        text-decoration: none;
        transition: color 0.2s;
      }

      .breadcrumb-link:hover {
        color: var(--primary-500);
      }

      .separator {
        color: var(--grey-400);
        font-weight: bold;
      }

      .breadcrumb-current {
        color: var(--primary-500);
        font-weight: 500;
      }

      .header-actions {
        display: flex;
        gap: var(--s-12);
        align-items: center;
      }

      /* Tab Navigation */
      .tab-navigation {
        display: flex;
        gap: 0;
        border-bottom: 2px solid var(--grey-200);
        margin-bottom: var(--s-8);
        overflow-x: auto;
        overflow-y: clip; /* Changed from visible to clip */
        min-height: 48px;
        height: fit-content;
        flex-wrap: nowrap;
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE/Edge */
        margin-top: var(--s-8);
        padding: 0;
      }

      .tab-navigation::-webkit-scrollbar {
        display: none; /* Chrome/Safari/Opera */
      }

      .tab-item {
        padding: var(--s-12) var(--s-20);
        color: var(--grey-700);
        text-decoration: none;
        font-weight: 500;
        font-size: 14px;
        border-bottom: 3px solid transparent;
        margin-bottom: -2px; /* Pulled down to show border over container border */
        transition: all 0.2s;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: var(--s-8);
        min-height: 46px;
        position: relative;
        z-index: 1; /* Ensure active border shows on top */
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
        z-index: 2; /* Ensure active tab border is always visible */
      }

      .tab-item i {
        font-size: 14px;
      }

      /* Content */
      .content-wrapper {
        position: relative;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
      }

      @media (max-width: 768px) {
        .page-container {
          min-height: calc(100vh - 64px); /* Adjust for smaller mobile nav */
        }

        .header-main {
          flex-direction: column;
          align-items: stretch;
        }

        .header-actions {
          justify-content: flex-start;
          width: 100%;
        }

        .page-container:has(.nav-container) {
          padding-top: 0;
        }

        .nav-container {
          padding: 0 var(--s-16);
        }

        .subtab-container {
          padding: 0 var(--s-16);
        }

        .subtab-bar {
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .subtab-bar::-webkit-scrollbar {
          display: none;
        }

        .tab-navigation {
          gap: var(--s-2);
          margin-top: var(--s-4);
        }

        .tab-item {
          padding: var(--s-10) var(--s-12);
          font-size: 13px;
        }
      }
    `,
  ],
})
export class PageLayoutComponent {
  @Input() title = '';
  @Input() icon = '';
  @Input() breadcrumbs: Breadcrumb[] = [];
  @Input() loading = false;
  @Input() tabs?: TabItem[];
  @Input() subtabs?: TabItem[];
  @Input() backUrl?: string;
}
