import { Component, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/types/roles';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: Role[];
  children?: NavItem[];
  expanded?: boolean;
  exact?: boolean;
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
            <div
              class="nav-link-wrapper"
              [class.has-children]="item.children && item.children.length > 0"
              [class.active]="isParentActive(item)"
            >
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: item.children ? true : false }"
                class="nav-link"
                *ngIf="hasAccess(item)"
                [title]="collapsed ? item.label : ''"
                (click)="onMobileLinkClick()"
              >
                <i [class]="item.icon"></i>
                <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
              </a>
              <button
                *ngIf="item.children && item.children.length > 0 && !collapsed"
                class="expand-btn"
                (click)="toggleExpand(item, $event)"
              >
                <i
                  class="fa-solid"
                  [class.fa-chevron-down]="!item.expanded"
                  [class.fa-chevron-up]="item.expanded"
                ></i>
              </button>
            </div>

            <!-- Children List -->
            <ul
              *ngIf="item.children && (item.expanded || isParentActive(item)) && !collapsed"
              class="children-list"
            >
              <li *ngFor="let child of item.children" class="child-item">
                <a
                  [routerLink]="child.route"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: child.exact ?? false }"
                  class="child-link"
                  *ngIf="hasAccess(child)"
                  (click)="onMobileLinkClick()"
                >
                  <i [class]="child.icon"></i>
                  <span>{{ child.label }}</span>
                </a>
              </li>
            </ul>
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
    <div
      class="sidebar-overlay"
      *ngIf="!collapsed"
      (click)="toggleCollapse()"
      (keydown.enter)="toggleCollapse()"
      tabindex="0"
      role="button"
    ></div>
  `,
  styles: [
    `
      .sidebar {
        width: 260px;
        background: var(--grey-100);
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

        /* Custom Slim Scrollbar for Windows Chrome */
        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background: var(--grey-300);
          border-radius: 10px;

          &:hover {
            background: var(--grey-400);
          }
        }

        /* Firefox Support */
        scrollbar-width: thin;
        scrollbar-color: var(--grey-300) transparent;
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
          min-width: 20px;
          width: 20px;
          text-align: center;
          font-size: 18px;
        }
      }

      .nav-link-wrapper {
        display: flex;
        align-items: center;
        width: 100%;

        &.active {
          background: var(--primary-50);
        }
      }

      .expand-btn {
        background: none;
        border: none;
        color: var(--grey-500);
        padding: 0 var(--s-16);
        cursor: pointer;
        height: 100%;
        display: flex;
        align-items: center;

        &:hover {
          color: var(--primary-700);
        }
      }

      .children-list {
        list-style: none;
        padding: 0;
        margin: 0;
        background: var(--grey-50);
      }

      .child-link {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        padding: var(--s-8) var(--s-24) var(--s-8) calc(var(--s-24) + 32px);
        color: var(--grey-600);
        text-decoration: none;
        font-size: 13px;
        transition: all 0.2s;

        &:hover {
          color: var(--primary-700);
          background: var(--grey-100);
        }

        &.active {
          color: var(--primary-700);
          font-weight: 600;
        }

        i {
          font-size: 12px;
          width: 14px;
          text-align: center;
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
export class SidebarComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  currentUser$ = this.authService.currentUser$;
  currentUrl = this.router.url;

  ngOnInit() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.currentUrl = (e as NavigationEnd).urlAfterRedirects;
    });
  }

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
    {
      label: 'SST',
      route: '/sst',
      icon: 'fa-solid fa-user-shield',
      children: [
        {
          label: 'Incidentes',
          route: '/sst',
          icon: 'fa-solid fa-triangle-exclamation',
          exact: true,
        },
        { label: 'Inspecciones', route: '/sst/inspecciones', icon: 'fa-solid fa-magnifying-glass' },
        { label: 'Reportes A/C', route: '/sst/reportes-acto', icon: 'fa-solid fa-file-lines' },
      ],
    },
    {
      label: 'Administración',
      route: '/administracion',
      icon: 'fa-solid fa-briefcase',
      children: [
        {
          label: 'Centros de Costo',
          route: '/administracion/cost-centers',
          icon: 'fa-solid fa-building-columns',
        },
        {
          label: 'Cuentas por Pagar',
          route: '/administracion/accounts-payable',
          icon: 'fa-solid fa-file-invoice-dollar',
        },
        {
          label: 'Cronograma',
          route: '/administracion/payment-schedules',
          icon: 'fa-solid fa-calendar-check',
        },
        {
          label: 'Caja Chica',
          route: '/administracion/petty-cash',
          icon: 'fa-solid fa-cash-register',
        },
        {
          label: 'Caja y Banco',
          route: '/administracion/bank-cash',
          icon: 'fa-solid fa-building-columns',
        },
      ],
    },
    {
      label: 'RRHH',
      route: '/rrhh',
      icon: 'fa-solid fa-users-gear',
      children: [
        { label: 'Dashboard', route: '/rrhh', icon: 'fa-solid fa-chart-pie', exact: true },
        { label: 'Personal', route: '/rrhh/employees', icon: 'fa-solid fa-users' },
        { label: 'Registro', route: '/rrhh/worker-registry', icon: 'fa-solid fa-id-card' },
      ],
    },
    {
      label: 'Logística',
      route: '/logistics',
      icon: 'fa-solid fa-boxes-stacked',
      children: [
        { label: 'Productos', route: '/logistics/products', icon: 'fa-solid fa-box' },
        { label: 'Movimientos', route: '/logistics/movements', icon: 'fa-solid fa-dolly' },
        {
          label: 'Solicitudes',
          route: '/logistics/material-requests',
          icon: 'fa-solid fa-file-lines',
        },
        {
          label: 'Requerimientos',
          route: '/logistics/requirements',
          icon: 'fa-solid fa-clipboard-list',
        },
        { label: 'Categorías', route: '/logistics/categories', icon: 'fa-solid fa-tags' },
      ],
    },
    {
      label: 'Proveedores',
      route: '/providers',
      icon: 'fa-solid fa-handshake',
      children: [
        { label: 'Lista', route: '/providers', icon: 'fa-solid fa-list', exact: true },
        {
          label: 'Evaluaciones',
          route: '/providers/evaluaciones',
          icon: 'fa-solid fa-clipboard-check',
        },
      ],
    },
    {
      label: 'Equipo Mecánico',
      route: '/equipment',
      icon: 'fa-solid fa-tractor',
    },
    { label: 'Operadores', route: '/operators', icon: 'fa-solid fa-id-card' },
    {
      label: 'Presupuestos',
      route: '/presupuestos',
      icon: 'fa-solid fa-calculator',
      children: [
        {
          label: 'Presupuestos',
          route: '/presupuestos',
          icon: 'fa-solid fa-file-invoice-dollar',
          exact: true,
        },
        { label: 'APUs', route: '/presupuestos/apus', icon: 'fa-solid fa-calculator' },
        { label: 'Insumos', route: '/presupuestos/insumos', icon: 'fa-solid fa-boxes-stacked' },
      ],
    },
    { label: 'Checklists', route: '/checklists', icon: 'fa-solid fa-clipboard-check' },
    {
      label: 'Analítica',
      route: '/analytics',
      icon: 'fa-solid fa-chart-line',
      roles: ['ADMIN', 'DIRECTOR', 'JEFE_EQUIPO'],
    },
    // Note: Daily Reports, Contracts, and Valuations are accessed via tabs in Equipment module
  ];

  // Settings items (bottom of sidebar)
  settingsNavItems: NavItem[] = [
    {
      label: 'Aprobaciones',
      route: '/approvals/dashboard',
      icon: 'fa-solid fa-check-double',
    },
    {
      label: 'Notificaciones',
      route: '/notificaciones',
      icon: 'fa-solid fa-bell',
    },
    {
      label: 'Usuarios',
      route: '/users',
      icon: 'fa-solid fa-user-lock',
      roles: ['ADMIN'],
    },
    {
      label: 'Configuración',
      route: '/settings',
      icon: 'fa-solid fa-gear',
      roles: ['ADMIN'],
    },
  ];

  toggleExpand(item: NavItem, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    item.expanded = !item.expanded;
  }

  isParentActive(item: NavItem): boolean {
    if (!item.children) return false;
    return item.children.some((child) => this.currentUrl.startsWith(child.route));
  }

  hasAccess(item: NavItem): boolean {
    if (!item.roles) return true;
    const userRole = this.authService.getCurrentUserRole();
    if (!userRole) return false;
    // Case-insensitive comparison and trim to handle potential whitespace
    return item.roles.some((role) => role.trim().toUpperCase() === userRole.trim().toUpperCase());
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);

    // Dispatch event to notify layout
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
