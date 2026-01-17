import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/types/roles';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: Role[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed" [class.mobile-open]="!collapsed">
      <div class="sidebar-content">
        <ul class="nav-list">
          <li *ngFor="let item of mainNavItems" class="nav-item">
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              class="nav-link"
              *ngIf="hasAccess(item)"
              [title]="collapsed ? item.label : ''"
              (click)="onMobileLinkClick()"
            >
              <i [class]="item.icon"></i>
              <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
            </a>
          </li>
        </ul>

        <!-- Separator and Settings -->
        <div *ngIf="settingsNavItems.length > 0" class="nav-separator"></div>
        <ul class="nav-list">
          <li *ngFor="let item of settingsNavItems" class="nav-item">
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              class="nav-link"
              *ngIf="hasAccess(item)"
              [title]="collapsed ? item.label : ''"
              (click)="onMobileLinkClick()"
            >
              <i [class]="item.icon"></i>
              <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
            </a>
          </li>
        </ul>
      </div>

      <div class="sidebar-footer">
        <div class="version-info" *ngIf="!collapsed">
          <span>v0.0.362 | {{ authService.getCurrentUserRole() }}</span>
        </div>
        <button class="collapse-btn" (click)="toggleCollapse()">
          <i
            class="fa-solid"
            [class.fa-chevron-left]="!collapsed"
            [class.fa-chevron-right]="collapsed"
          ></i>
        </button>
      </div>
    </aside>
    <div class="sidebar-overlay" *ngIf="!collapsed" (click)="toggleCollapse()"></div>
  `,
  styles: [
    `
      .sidebar {
        width: 260px;
        background: var(--neutral-0);
        border-right: 1px solid var(--grey-200);
        height: calc(100vh - 72px); /* Subtract header height */
        position: fixed;
        top: 72px;
        left: 0;
        display: flex;
        flex-direction: column;
        transition: all 0.3s ease;
        z-index: 90;
      }

      .sidebar.collapsed {
        width: 64px;
      }

      .sidebar-content {
        flex: 1;
        padding: var(--s-16) 0;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .nav-label {
      }

      .nav-separator {
        height: 1px;
        background: var(--grey-200);
        margin: var(--s-16) var(--s-24);
      }

      .sidebar.collapsed .nav-separator {
        margin: var(--s-16) var(--s-12);
      }

      .nav-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .nav-item {
        margin-bottom: 4px;
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        padding: var(--s-12) var(--s-24);
        color: var(--grey-700);
        text-decoration: none;
        font-weight: 500;
        font-size: var(--type-body-size);
        transition: all 0.2s ease;
        border-left: 3px solid transparent;
        white-space: nowrap;
        overflow: hidden;

        &:hover {
          background: var(--grey-100);
          color: var(--primary-900);
        }

        &.active {
          background: var(--primary-100);
          color: var(--primary-800);
          border-left-color: var(--primary-500);
          font-weight: 600;
        }

        i {
          min-width: 20px; /* Ensure icon doesn't shrink */
          width: 20px;
          text-align: center;
          font-size: 18px;
        }
      }

      .sidebar.collapsed .nav-link {
        padding: var(--s-12);
        justify-content: center;
      }

      .sidebar-footer {
        padding: var(--s-16) var(--s-24);
        border-top: 1px solid var(--grey-200);
        display: flex;
        align-items: center;
        justify-content: space-between;

        .version-info {
          font-size: var(--type-label-size);
          color: var(--grey-500);
          white-space: nowrap;
        }
      }

      .sidebar.collapsed .sidebar-footer {
        padding: var(--s-16) var(--s-12);
        justify-content: center;
      }

      .collapse-btn {
        background: none;
        border: none;
        color: var(--grey-500);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;

        &:hover {
          background: var(--grey-100);
          color: var(--primary-800);
        }
      }

      .sidebar-overlay {
        display: none;
      }

      @media (max-width: 768px) {
        .sidebar {
          position: fixed;
          left: -260px;
          z-index: 90;
          height: calc(100vh - 72px);
          top: 72px;
          box-shadow: 4px 0 16px rgba(0, 0, 0, 0.1);
          width: 260px !important; /* Always full width on mobile when open */
        }

        .sidebar.mobile-open {
          left: 0;
        }

        .sidebar.collapsed {
          /* When collapsed on mobile, it is hidden (left: -260px) */
          /* The .collapsed class sets width to 64px, but we override it with !important above or just rely on left */
          /* Actually, if collapsed is true, we want it hidden. */
          /* If collapsed is false, we want it shown (mobile-open). */
        }

        .sidebar-overlay {
          display: block;
          position: fixed;
          top: 72px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 80;
        }

        .collapse-btn {
          display: none; /* Hide collapse button on mobile, use overlay or menu button */
        }
      }
    `,
  ],
})
export class SidebarComponent {
  public authService = inject(AuthService);
  currentUser$ = this.authService.currentUser$;

  @Input() collapsed = true;
  @Output() collapsedChange = new EventEmitter<boolean>();

  // Main navigation items (existing routes)
  mainNavItems: NavItem[] = [
    // Nivel 1
    { label: 'SIG', route: '/sig', icon: 'fa-solid fa-chart-pie' },

    // Nivel 2
    { label: 'Licitaciones', route: '/licitaciones', icon: 'fa-solid fa-file-signature' },
    { label: 'Operaciones', route: '/operaciones', icon: 'fa-solid fa-helmet-safety' },

    // Nivel 3
    { label: 'SST', route: '/sst', icon: 'fa-solid fa-user-shield' },
    { label: 'Administración', route: '/administracion', icon: 'fa-solid fa-briefcase' },
    { label: 'RRHH', route: '/rrhh', icon: 'fa-solid fa-users-gear' },
    { label: 'Logística', route: '/logistics', icon: 'fa-solid fa-boxes-stacked' },
    { label: 'Proveedores', route: '/providers', icon: 'fa-solid fa-handshake' },
    { label: 'Equipo Mecánico', route: '/equipment', icon: 'fa-solid fa-tractor' },
    { label: 'Operadores', route: '/operators', icon: 'fa-solid fa-id-card' },
    { label: 'Checklists', route: '/checklists', icon: 'fa-solid fa-clipboard-check' },
    // Note: Daily Reports, Contracts, and Valuations are accessed via tabs in Equipment module
  ];

  // Settings items (bottom of sidebar)
  settingsNavItems: NavItem[] = [
    {
      label: 'Configuración',
      route: '/settings',
      icon: 'fa-solid fa-gear',
      roles: ['ADMIN'],
    },
  ];

  hasAccess(item: NavItem): boolean {
    if (!item.roles) return true;
    const userRole = this.authService.getCurrentUserRole();
    if (!userRole) return false;
    // Case-insensitive comparison for backward compatibility
    return item.roles.some((role) => role.toLowerCase() === userRole.toLowerCase());
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);

    // Dispatch event to notify layout (legacy support if needed, but we are moving to Input/Output)
    window.dispatchEvent(
      new CustomEvent('sidebar-toggle', { detail: { collapsed: this.collapsed } })
    );
  }

  onMobileLinkClick() {
    if (window.innerWidth <= 768) {
      this.collapsed = true;
      this.collapsedChange.emit(this.collapsed);
    }
  }
}
