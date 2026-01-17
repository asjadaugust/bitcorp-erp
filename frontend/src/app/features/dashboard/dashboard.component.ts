import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MainNavComponent } from '../../shared/components/main-nav.component';
import { Role, ROLES, getRoleName } from '../../core/types/roles';

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

      /* Control Panel */
      .control-panel {
        background: var(--neutral-0);
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
        color: var(--neutral-0);
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
        background: var(--neutral-0);
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

  currentUser: any = null;
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
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  canAccessModule(module: Module): boolean {
    if (!this.currentUser) return false;
    if (!module.isActive) return false;

    // Check if user has any of the required roles (case-insensitive)
    const userRolesLower = this.currentUser.roles?.map((r: string) => r.toLowerCase()) || [];
    const requiredRolesLower = module.requiredRoles.map((r: string) => r.toLowerCase());
    return requiredRolesLower.some((role: string) => userRolesLower.includes(role));
  }

  navigateToModule(module: Module): void {
    if (!this.canAccessModule(module)) return;
    this.router.navigate([module.route]);
  }

  getRoleDisplay(roles?: string[]): string {
    if (!roles || roles.length === 0) return '';

    // Use the typed getRoleName function from roles.ts
    const firstRole = roles[0].toUpperCase() as Role;
    return getRoleName(firstRole);
  }
}
