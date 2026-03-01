import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Role, getRoleName } from '../../core/types/roles';
import { DashboardApiService, DocumentAlertsSummary } from '../../core/services/dashboard.service';

interface Module {
  id: string;
  name: string;
  icon: string;
  route: string;
  level: number;
  requiredRoles: Role[];
  description: string;
  isActive: boolean;
}

interface ModuleCategory {
  name: string;
  level: number;
  modules: Module[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-content">
        <!-- Document Alerts -->
        <div class="alerts-panel" *ngIf="documentAlerts && documentAlerts.total_alerts > 0">
          <h3 class="alerts-title">
            <i class="fa-solid fa-triangle-exclamation"></i>
            Alertas de Documentos
            <span class="alert-count">{{ documentAlerts.total_alerts }}</span>
          </h3>
          <div class="alerts-grid">
            <div
              class="alert-card"
              *ngIf="getAlertTotal(documentAlerts.equipment) > 0"
              (click)="navigateTo('/equipment')"
              (keydown.enter)="navigateTo('/equipment')"
              tabindex="0"
              role="button"
            >
              <div class="alert-icon"><i class="fa-solid fa-tractor"></i></div>
              <div class="alert-info">
                <span class="alert-label">Equipos</span>
                <div class="alert-badges">
                  <span class="badge badge-red" *ngIf="documentAlerts.equipment.expired > 0">
                    {{ documentAlerts.equipment.expired }} vencidos
                  </span>
                  <span class="badge badge-orange" *ngIf="documentAlerts.equipment.critical > 0">
                    {{ documentAlerts.equipment.critical }} criticos
                  </span>
                  <span class="badge badge-yellow" *ngIf="documentAlerts.equipment.warning > 0">
                    {{ documentAlerts.equipment.warning }} por vencer
                  </span>
                </div>
              </div>
            </div>
            <div
              class="alert-card"
              *ngIf="getAlertTotal(documentAlerts.operators) > 0"
              (click)="navigateTo('/operators')"
              (keydown.enter)="navigateTo('/operators')"
              tabindex="0"
              role="button"
            >
              <div class="alert-icon"><i class="fa-solid fa-id-card"></i></div>
              <div class="alert-info">
                <span class="alert-label">Operadores</span>
                <div class="alert-badges">
                  <span class="badge badge-red" *ngIf="documentAlerts.operators.expired > 0">
                    {{ documentAlerts.operators.expired }} vencidos
                  </span>
                  <span class="badge badge-orange" *ngIf="documentAlerts.operators.critical > 0">
                    {{ documentAlerts.operators.critical }} criticos
                  </span>
                  <span class="badge badge-yellow" *ngIf="documentAlerts.operators.warning > 0">
                    {{ documentAlerts.operators.warning }} por vencer
                  </span>
                </div>
              </div>
            </div>
            <div
              class="alert-card"
              *ngIf="getAlertTotal(documentAlerts.contracts) > 0"
              (click)="navigateTo('/equipment/operaciones/contratos')"
              (keydown.enter)="navigateTo('/equipment/operaciones/contratos')"
              tabindex="0"
              role="button"
            >
              <div class="alert-icon"><i class="fa-solid fa-file-contract"></i></div>
              <div class="alert-info">
                <span class="alert-label">Contratos</span>
                <div class="alert-badges">
                  <span class="badge badge-red" *ngIf="documentAlerts.contracts.expired > 0">
                    {{ documentAlerts.contracts.expired }} vencidos
                  </span>
                  <span class="badge badge-orange" *ngIf="documentAlerts.contracts.critical > 0">
                    {{ documentAlerts.contracts.critical }} criticos
                  </span>
                  <span class="badge badge-yellow" *ngIf="documentAlerts.contracts.warning > 0">
                    {{ documentAlerts.contracts.warning }} por vencer
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Control Panel / Module Grid -->
        <div class="control-panel">
          <h2 class="panel-title">Panel de Control</h2>

          <div class="module-category" *ngFor="let category of moduleCategories">
            <h3 class="category-title" *ngIf="category.level !== 1">
              <span class="level-badge">Nivel {{ category.level }}</span>
              {{ category.name }}
            </h3>

            <!-- For Nivel 1, just show the single SIG module without category header -->
            <div class="module-grid" [class.nivel-1-grid]="category.level === 1">
              <div
                *ngFor="let module of category.modules"
                class="module-card"
                [class.module-disabled]="!canAccessModule(module)"
                [class.module-active]="canAccessModule(module)"
                [class.nivel-1-card]="category.level === 1"
                (click)="navigateToModule(module)"
                (keydown.enter)="navigateToModule(module)"
                tabindex="0"
                role="button"
              >
                <div class="module-icon"><i [ngClass]="module.icon"></i></div>
                <div class="module-info">
                  <h4 class="module-name">{{ module.name }}</h4>
                  <p class="module-description">{{ module.description }}</p>
                </div>
                <div class="module-status" *ngIf="!canAccessModule(module)">
                  <span class="lock-icon">🔒</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        min-height: 100vh;
        background: var(--grey-100);
      }

      .dashboard-content {
        padding: var(--s-32);
        max-width: 1400px;
        margin: 0 auto;
      }

      /* Alerts Panel */
      .alerts-panel {
        background: var(--grey-100);
        padding: var(--s-24);
        border-radius: var(--s-8);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        margin-bottom: var(--s-24);
        border-left: 4px solid var(--accent-500);
      }

      .alerts-title {
        font-size: var(--type-bodyLarge-size);
        font-weight: 600;
        color: var(--grey-900);
        margin-bottom: var(--s-16);
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .alert-count {
        background: var(--accent-500);
        color: var(--grey-100);
        border-radius: 999px;
        padding: 2px 10px;
        font-size: var(--type-label-size);
        font-weight: 700;
      }

      .alerts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: var(--s-16);
      }

      .alert-card {
        display: flex;
        align-items: flex-start;
        gap: var(--s-12);
        padding: var(--s-16);
        border: 1px solid var(--grey-200);
        border-radius: var(--s-8);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .alert-card:hover {
        border-color: var(--primary-500);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .alert-icon {
        font-size: 24px;
        color: var(--grey-500);
      }

      .alert-info {
        flex: 1;
      }

      .alert-label {
        font-weight: 600;
        font-size: var(--type-body-size);
        color: var(--grey-900);
        display: block;
        margin-bottom: var(--s-8);
      }

      .alert-badges {
        display: flex;
        flex-wrap: wrap;
        gap: var(--s-4);
      }

      .badge {
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
      }

      .badge-red {
        background: var(--grey-100);
        color: var(--grey-900);
      }

      .badge-orange {
        background: var(--grey-100);
        color: var(--grey-900);
      }

      .badge-yellow {
        background: var(--grey-100);
        color: var(--grey-900);
      }

      /* Control Panel */
      .control-panel {
        background: var(--grey-100);
        padding: var(--s-48);
        border-radius: var(--s-8);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }

      .panel-title {
        font-family: var(--font-family-display);
        font-size: var(--type-h3-size);
        font-weight: 700;
        color: var(--primary-900);
        margin-bottom: var(--s-48);
        text-align: center;
        padding-bottom: var(--s-16);
        border-bottom: 3px solid var(--primary-500);
      }

      /* Module Categories */
      .module-category {
        margin-bottom: var(--s-48);
      }

      .category-title {
        font-size: var(--type-bodyLarge-size);
        font-weight: 600;
        color: var(--primary-900);
        margin-bottom: var(--s-24);
        display: flex;
        align-items: center;
        gap: var(--s-16);
      }

      .level-badge {
        background: var(--primary-500);
        color: var(--grey-100);
        padding: 4px 12px;
        border-radius: 999px;
        font-size: var(--type-label-size);
        font-weight: 700;
      }

      /* Module Grid */
      .module-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--s-24);
      }

      /* Nivel 1 special grid - center single item */
      .nivel-1-grid {
        display: flex;
        justify-content: center;
        margin-bottom: var(--s-48);
      }

      .nivel-1-card {
        max-width: 350px;
        border: 3px solid var(--primary-500);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      /* Module Cards */
      .module-card {
        background: var(--grey-100);
        border: 2px solid var(--grey-200);
        border-radius: var(--s-8);
        padding: var(--s-24);
        transition: all 0.3s ease;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
        position: relative;
        min-height: 140px;
      }

      .module-card.module-active {
        border-color: var(--primary-500);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          border-color: var(--primary-900);
        }
      }

      .module-card.module-disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: var(--grey-100);

        &:hover {
          transform: none;
        }
      }

      .module-icon {
        font-size: 48px;
        text-align: center;
        margin-bottom: var(--s-8);
        color: var(--primary-500);
      }

      .module-icon i {
        display: inline-block;
      }

      .module-info {
        flex: 1;
      }

      .module-name {
        font-size: var(--type-body-size);
        font-weight: 600;
        color: var(--primary-900);
        margin: 0 0 var(--s-4) 0;
      }

      .module-description {
        font-size: var(--type-bodySmall-size);
        color: var(--grey-500);
        margin: 0;
        line-height: 1.4;
      }

      .module-status {
        position: absolute;
        top: var(--spacing-sm);
        right: var(--spacing-sm);

        .lock-icon {
          font-size: 24px;
          opacity: 0.5;
        }
      }

      @media (max-width: 768px) {
        .dashboard-content {
          padding: var(--spacing-md);
        }

        .module-grid {
          grid-template-columns: 1fr;
        }

        .panel-title {
          font-size: 20px;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private dashboardApi = inject(DashboardApiService);

  currentUser: Record<string, unknown> | null = null;
  documentAlerts: DocumentAlertsSummary | null = null;
  userProjects: string[] = ['Proyecto Carretera Norte', 'Proyecto Puente Sur'];
  activeProject: string = this.userProjects[0];

  moduleCategories: ModuleCategory[] = [
    {
      name: '', // No name for Nivel 1 - just the SIG icon
      level: 1,
      modules: [
        {
          id: 'sig',
          name: 'SIG',
          icon: 'fa-solid fa-chart-pie',
          route: '/sig',
          level: 1,
          requiredRoles: ['ADMIN', 'DIRECTOR', 'JEFE_EQUIPO'],
          description: 'Sistema Integrado de Gestión (ISO 9001, 14001, 45001)',
          isActive: true,
        },
      ],
    },
    {
      name: 'Módulos Operacionales',
      level: 2,
      modules: [
        {
          id: 'licitaciones',
          name: 'Licitaciones',
          icon: 'fa-solid fa-file-signature',
          route: '/licitaciones',
          level: 2,
          requiredRoles: ['ADMIN', 'DIRECTOR', 'JEFE_EQUIPO'],
          description: 'Gestión de Licitaciones y Propuestas',
          isActive: true,
        },
        {
          id: 'operaciones',
          name: 'Operaciones',
          icon: 'fa-solid fa-helmet-safety',
          route: '/operaciones',
          level: 2,
          requiredRoles: ['ADMIN', 'DIRECTOR', 'JEFE_EQUIPO'],
          description: 'Control Operacional de Proyectos',
          isActive: true,
        },
      ],
    },
    {
      name: 'Módulos Departamentales',
      level: 3,
      modules: [
        {
          id: 'sst',
          name: 'SST',
          icon: 'fa-solid fa-user-shield',
          route: '/sst',
          level: 3,
          requiredRoles: ['ADMIN', 'DIRECTOR', 'JEFE_EQUIPO'],
          description: 'Seguridad y Salud en el Trabajo',
          isActive: true,
        },
        {
          id: 'administracion',
          name: 'Administración',
          icon: 'fa-solid fa-briefcase',
          route: '/administracion',
          level: 3,
          requiredRoles: ['ADMIN', 'DIRECTOR'],
          description: 'Gestión Administrativa',
          isActive: true,
        },
        {
          id: 'rrhh',
          name: 'RRHH',
          icon: 'fa-solid fa-users',
          route: '/rrhh',
          level: 3,
          requiredRoles: ['ADMIN', 'DIRECTOR'],
          description: 'Recursos Humanos',
          isActive: true,
        },
        {
          id: 'logistica',
          name: 'Logística',
          icon: 'fa-solid fa-truck-fast',
          route: '/logistics',
          level: 3,
          requiredRoles: ['ADMIN', 'DIRECTOR', 'JEFE_EQUIPO'],
          description: 'Gestión Logística',
          isActive: true,
        },
        {
          id: 'proveedores',
          name: 'Proveedores',
          icon: 'fa-solid fa-handshake',
          route: '/providers',
          level: 3,
          requiredRoles: ['ADMIN', 'DIRECTOR', 'JEFE_EQUIPO'],
          description: 'Gestión de Proveedores',
          isActive: true,
        },
        {
          id: 'equipo-mecanico',
          name: 'Gestión de Equipo Mecánico',
          icon: 'fa-solid fa-tractor',
          route: '/equipment',
          level: 3,
          requiredRoles: ['ADMIN', 'DIRECTOR', 'JEFE_EQUIPO', 'OPERADOR'],
          description: 'Gestión de Equipos y Maquinaria',
          isActive: true,
        },

        {
          id: 'operators',
          name: 'Gestión de Operadores',
          icon: 'fa-solid fa-id-card',
          route: '/operators',
          level: 3,
          requiredRoles: ['ADMIN', 'DIRECTOR', 'JEFE_EQUIPO'],
          description: 'Gestión de Operadores y Certificaciones',
          isActive: true,
        },
      ],
    },
    {
      name: 'Sistema',
      level: 4,
      modules: [
        {
          id: 'users',
          name: 'Usuarios',
          icon: 'fa-solid fa-user-lock',
          route: '/users',
          level: 4,
          requiredRoles: ['ADMIN'],
          description: 'Gestión de Usuarios y Permisos',
          isActive: true,
        },
        {
          id: 'settings',
          name: 'Configuración',
          icon: 'fa-solid fa-gear',
          route: '/settings',
          level: 4,
          requiredRoles: ['ADMIN'],
          description: 'Configuración General del Sistema',
          isActive: true,
        },
      ],
    },
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user as unknown as Record<string, unknown>;
    });
    this.loadDocumentAlerts();
  }

  loadDocumentAlerts(): void {
    this.dashboardApi.getDocumentAlerts().subscribe({
      next: (alerts) => {
        this.documentAlerts = alerts;
      },
      error: (err) => {
        console.error('Error loading document alerts:', err);
      },
    });
  }

  getAlertTotal(category: { expired: number; critical: number; warning: number }): number {
    return category.expired + category.critical + category.warning;
  }

  canAccessModule(module: Module): boolean {
    if (!this.currentUser) return false;
    if (!module.isActive) return false;

    // Check if user has any of the required roles (case-insensitive)
    const userRolesLower =
      (this.currentUser['roles'] as string[] | undefined)?.map((r: string) => r.toLowerCase()) ||
      [];
    const requiredRolesLower = module.requiredRoles.map((r: string) => r.toLowerCase());
    return requiredRolesLower.some((role: string) => userRolesLower.includes(role));
  }

  navigateToModule(module: Module): void {
    if (!this.canAccessModule(module)) return;
    this.router.navigate([module.route]);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getRoleDisplay(roles?: string[]): string {
    if (!roles || roles.length === 0) return '';

    // Use the typed getRoleName function from roles.ts
    const firstRole = roles[0].toUpperCase() as Role;
    return getRoleName(firstRole);
  }
}
