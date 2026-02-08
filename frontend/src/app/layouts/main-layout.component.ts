import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MainNavComponent } from '../shared/components/main-nav.component';
import { SidebarComponent } from '../shared/components/sidebar.component';
import { ProjectSelectorComponent } from './components/project-selector/project-selector.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MainNavComponent,
    SidebarComponent,
    ProjectSelectorComponent,
  ],
  template: `
    <div class="app-layout">
      <app-main-nav></app-main-nav>
      <app-project-selector></app-project-selector>
      <div class="layout-body">
        <app-sidebar
          *ngIf="showSidebar"
          [collapsed]="sidebarCollapsed"
          (collapsedChange)="onSidebarCollapsedChange($event)"
        >
        </app-sidebar>
        <main
          class="content"
          [class.sidebar-collapsed]="sidebarCollapsed"
          [class.no-sidebar]="!showSidebar"
        >
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .app-layout {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: var(--grey-100);
        padding-top: 72px; /* Fixed header height */
      }

      .layout-body {
        display: flex;
        flex: 1;
      }

      .content {
        flex: 1;
        padding: var(--s-24);
        overflow-x: hidden;
        margin-left: 260px; /* Sidebar width */
        transition: margin-left 0.3s ease;
      }

      .content.sidebar-collapsed {
        margin-left: 64px; /* Collapsed sidebar width */
      }

      .content.no-sidebar {
        margin-left: 0; /* No sidebar */
      }

      @media (max-width: 768px) {
        .app-layout {
          padding-top: 200px; /* Accommodate taller mobile header */
        }

        .content {
          padding: var(--s-16);
          margin-left: 0;
        }

        .content.sidebar-collapsed {
          margin-left: 0;
        }
      }
    `,
  ],
})
export class MainLayoutComponent implements OnInit {
  private router = inject(Router);

  sidebarCollapsed = true; // Start collapsed by default to match sidebar
  showSidebar = true; // Show/hide sidebar based on route

  constructor() {
    // Listen for sidebar toggle events (legacy/desktop)
    if (typeof window !== 'undefined') {
      window.addEventListener('sidebar-toggle', (e: any) => {
        this.sidebarCollapsed = e.detail.collapsed;
      });

      // Listen for mobile toggle
      window.addEventListener('sidebar-toggle-mobile', () => {
        this.sidebarCollapsed = !this.sidebarCollapsed;
      });
    }
  }

  ngOnInit(): void {
    // Check initial route
    this.updateSidebarVisibility(this.router.url);

    // Listen to route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateSidebarVisibility(event.urlAfterRedirects);
      });
  }

  private updateSidebarVisibility(url: string): void {
    // Hide sidebar only on /app route (dashboard landing page)
    this.showSidebar = url !== '/app';
  }

  onSidebarCollapsedChange(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
  }
}
