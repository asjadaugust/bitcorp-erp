import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-equipment-module-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="module-shell">
      <nav class="module-nav-bar">
        <div class="module-nav-scroll">
          <a routerLink="/equipment/dashboard" routerLinkActive="active" class="module-nav-tab">
            <i class="fa-solid fa-chart-line"></i>
            <span>Dashboard</span>
          </a>
          <a
            routerLink="/equipment"
            [routerLinkActiveOptions]="{ exact: true }"
            routerLinkActive="active"
            class="module-nav-tab"
          >
            <i class="fa-solid fa-list"></i>
            <span>Equipos</span>
          </a>
          <a routerLink="/equipment/solicitudes" routerLinkActive="active" class="module-nav-tab">
            <i class="fa-solid fa-file-invoice"></i>
            <span>Solicitudes</span>
          </a>
          <a
            routerLink="/equipment/ordenes-alquiler"
            routerLinkActive="active"
            class="module-nav-tab"
          >
            <i class="fa-solid fa-file-contract"></i>
            <span>Órdenes</span>
          </a>
          <a routerLink="/equipment/daily-reports" routerLinkActive="active" class="module-nav-tab">
            <i class="fa-solid fa-clipboard-list"></i>
            <span>Partes Diarios</span>
          </a>
          <a routerLink="/equipment/maintenance" routerLinkActive="active" class="module-nav-tab">
            <i class="fa-solid fa-wrench"></i>
            <span>Mantenimiento</span>
          </a>
          <a routerLink="/equipment/contracts" routerLinkActive="active" class="module-nav-tab">
            <i class="fa-solid fa-file-signature"></i>
            <span>Contratos</span>
          </a>
          <a routerLink="/equipment/valuations" routerLinkActive="active" class="module-nav-tab">
            <i class="fa-solid fa-dollar-sign"></i>
            <span>Valorizaciones</span>
          </a>
          <a
            routerLink="/equipment/actas-devolucion"
            routerLinkActive="active"
            class="module-nav-tab"
          >
            <i class="fa-solid fa-rotate-left"></i>
            <span>Devoluciones</span>
          </a>
          <a
            routerLink="/equipment/inoperatividad"
            routerLinkActive="active"
            class="module-nav-tab"
          >
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Inoperatividad</span>
          </a>
          <a
            *ngIf="isAdmin"
            routerLink="/equipment/precalentamiento-config"
            routerLinkActive="active"
            class="module-nav-tab"
          >
            <i class="fa-solid fa-fire-flame-curved"></i>
            <span>Precalentamiento</span>
          </a>
        </div>
      </nav>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .module-shell {
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 72px);
      }

      .module-nav-bar {
        background: var(--neutral-0);
        border-bottom: 2px solid var(--grey-200);
        overflow-x: auto;
        scrollbar-width: none;
        flex-shrink: 0;

        &::-webkit-scrollbar {
          display: none;
        }
      }

      .module-nav-scroll {
        display: flex;
        white-space: nowrap;
        padding: 0 var(--s-24);
        min-width: min-content;
      }

      .module-nav-tab {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: var(--s-12) var(--s-16);
        color: var(--grey-600);
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition:
          color 0.15s,
          border-color 0.15s;
        white-space: nowrap;

        i {
          font-size: 13px;
        }

        &:hover {
          color: var(--primary-800);
          background: var(--grey-50);
        }

        &.active {
          color: var(--primary-800);
          border-bottom-color: var(--primary-500);
          font-weight: 600;
        }
      }
    `,
  ],
})
export class EquipmentModuleLayoutComponent {
  private authService = inject(AuthService);

  get isAdmin(): boolean {
    const role = this.authService.getCurrentUserRole();
    return role?.toUpperCase() === 'ADMIN';
  }
}
