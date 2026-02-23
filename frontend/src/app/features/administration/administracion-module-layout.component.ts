import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-administracion-module-layout',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="module-shell">
      <nav class="module-nav-bar">
        <div class="module-nav-scroll">
          <a
            routerLink="/administracion/cost-centers"
            routerLinkActive="active"
            class="module-nav-tab"
          >
            <i class="fa-solid fa-building-columns"></i>
            <span>Centros de Costo</span>
          </a>
          <a
            routerLink="/administracion/accounts-payable"
            routerLinkActive="active"
            class="module-nav-tab"
          >
            <i class="fa-solid fa-file-invoice-dollar"></i>
            <span>Cuentas por Pagar</span>
          </a>
          <a
            routerLink="/administracion/payment-schedules"
            routerLinkActive="active"
            class="module-nav-tab"
          >
            <i class="fa-solid fa-calendar-check"></i>
            <span>Cronograma de Pagos</span>
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
export class AdministracionModuleLayoutComponent {}
