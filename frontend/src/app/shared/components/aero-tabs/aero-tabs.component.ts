import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TabItem } from '../page-layout/page-layout.component';

@Component({
  selector: 'app-aero-tabs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="tabs-wrapper" #container>
      <nav class="tab-navigation" #nav>
        <!-- Regular Tabs -->
        <ng-container *ngFor="let tab of visibleTabs">
          <a
            *ngIf="tab.route; else staticTab"
            [routerLink]="tab.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="tab.exact ? { exact: true } : { exact: false }"
            class="tab-item"
          >
            <i *ngIf="tab.icon" [class]="'fa-solid ' + tab.icon"></i>
            <span>{{ tab.label }}</span>
          </a>
          <ng-template #staticTab>
            <button
              class="tab-item"
              [class.active]="activeTabId === tab.id"
              (click)="selectTab(tab)"
            >
              <i *ngIf="tab.icon" [class]="'fa-solid ' + tab.icon"></i>
              <span>{{ tab.label }}</span>
            </button>
          </ng-template>
        </ng-container>

        <!-- More Dropdown -->
        <div class="more-dropdown" *ngIf="hiddenTabs.length > 0" #moreDropdown>
          <button class="tab-item more-trigger" [class.active]="isAnyHiddenActive" (click)="toggleDropdown($event)">
            <span>Más</span>
            <i class="fa-solid fa-chevron-down" [class.open]="dropdownOpen"></i>
          </button>
          
          <div class="dropdown-menu" *ngIf="dropdownOpen">
            <ng-container *ngFor="let tab of hiddenTabs">
              <a
                *ngIf="tab.route; else staticHiddenTab"
                [routerLink]="tab.route"
                routerLinkActive="active"
                [routerLinkActiveOptions]="tab.exact ? { exact: true } : { exact: false }"
                class="dropdown-item"
                (click)="dropdownOpen = false"
              >
                <i *ngIf="tab.icon" [class]="'fa-solid ' + tab.icon"></i>
                <span>{{ tab.label }}</span>
              </a>
              <ng-template #staticHiddenTab>
                <button
                  class="dropdown-item"
                  [class.active]="activeTabId === tab.id"
                  (click)="selectTab(tab); dropdownOpen = false"
                >
                  <i *ngIf="tab.icon" [class]="'fa-solid ' + tab.icon"></i>
                  <span>{{ tab.label }}</span>
                </button>
              </ng-template>
            </ng-container>
          </div>
        </div>
      </nav>
    </div>
  `,
  styles: [`
    .tabs-wrapper {
      position: relative;
      width: 100%;
    }

    .tab-navigation {
      display: flex;
      gap: 0;
      border-bottom: 2px solid var(--grey-200);
      min-height: 48px;
      height: fit-content;
      position: relative;
    }

    .tab-item {
      padding: var(--s-12) var(--s-20);
      color: var(--grey-700);
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      border: none;
      background: transparent;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      transition: all 0.2s;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: var(--s-8);
      min-height: 46px;
      cursor: pointer;
      font-family: inherit;
    }

    .tab-item:hover {
      color: var(--primary-800);
      background: var(--primary-100);
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    }

    .tab-item.active {
      color: var(--primary-800);
      border-bottom-color: var(--primary-500);
      font-weight: 600;
    }

    .more-trigger {
      position: relative;
    }

    .more-trigger i {
      font-size: 10px;
      transition: transform 0.2s;
    }

    .more-trigger i.open {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid var(--grey-200);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 100;
      min-width: 200px;
      padding: var(--s-8) 0;
      margin-top: var(--s-4);
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: var(--s-12);
      padding: var(--s-10) var(--s-16);
      color: var(--grey-700);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      width: 100%;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
    }

    .dropdown-item:hover {
      background: var(--grey-50);
      color: var(--primary-600);
    }

    .dropdown-item.active {
      color: var(--primary-600);
      background: var(--primary-50);
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .tab-item {
        padding: var(--s-10) var(--s-12);
        font-size: 13px;
      }
    }
  `]
})
export class AeroTabsComponent implements AfterViewInit {
  @Input() tabs: (TabItem & { id?: string })[] = [];
  @Input() activeTabId?: string;
  @Output() tabChange = new EventEmitter<TabItem & { id?: string }>();

  @ViewChild('container') container!: ElementRef;
  @ViewChild('nav') nav!: ElementRef;

  visibleTabs: (TabItem & { id?: string })[] = [];
  hiddenTabs: (TabItem & { id?: string })[] = [];
  dropdownOpen = false;

  constructor() {
    // noop
  }

  ngAfterViewInit() {
    this.calculateLayout();
  }

  // HostListener handles cleanup automatically

  @HostListener('window:resize')
  onResize() {
    this.calculateLayout();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.dropdownOpen && !this.container.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  calculateLayout() {
    if (!this.nav) return;

    // For now, let's implement a simple threshold-based disclosure
    // or we could do actual width measurement.
    // Let's try 5 tabs as a reasonable threshold for desktop.

    const containerWidth = this.container.nativeElement.offsetWidth;
    // Typical tab width is ~150px
    const maxTabs = Math.floor(containerWidth / 150);

    // Always show at least 2 tabs + More if needed
    const showCount = Math.max(2, maxTabs - 1);

    if (this.tabs.length > showCount && containerWidth < 800) {
      this.visibleTabs = this.tabs.slice(0, showCount);
      this.hiddenTabs = this.tabs.slice(showCount);
    } else {
      this.visibleTabs = this.tabs;
      this.hiddenTabs = [];
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectTab(tab: TabItem & { id?: string }) {
    this.activeTabId = tab.id;
    this.tabChange.emit(tab);
  }

  get isAnyHiddenActive(): boolean {
    // This is tricky for routerLinks. For now, check ID if static.
    return this.hiddenTabs.some(t => t.id === this.activeTabId);
  }
}
