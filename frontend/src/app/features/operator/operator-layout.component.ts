import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-operator-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="operator-layout">
      <!-- Sidebar Navigation -->
      <aside class="operator-sidebar">
        <div class="sidebar-header">
          <img src="assets/logo.svg" alt="Bitcorp" class="logo" />
          <h2>Operador</h2>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/operator/dashboard" routerLinkActive="active" class="nav-item">
            <i class="fa-solid fa-chart-line nav-icon"></i>
            <span class="label">Panel</span>
          </a>
          <a routerLink="/operator/daily-report" routerLinkActive="active" class="nav-item">
            <i class="fa-solid fa-file-pen nav-icon"></i>
            <span class="label">Parte Diario</span>
          </a>
          <a routerLink="/operator/history" routerLinkActive="active" class="nav-item">
            <i class="fa-solid fa-clipboard-list nav-icon"></i>
            <span class="label">Historial</span>
          </a>
          <a routerLink="/operator/profile" routerLinkActive="active" class="nav-item">
            <i class="fa-solid fa-user nav-icon"></i>
            <span class="label">Perfil</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button (click)="logout()" class="logout-btn">
            <i class="fa-solid fa-right-from-bracket nav-icon"></i>
            <span class="label">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="operator-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .operator-layout {
        display: flex;
        height: 100vh;
        background: var(--grey-100);
      }

      .operator-sidebar {
        width: 260px;
        background: linear-gradient(180deg, var(--primary-900) 0%, var(--primary-500) 100%);
        color: white;
        display: flex;
        flex-direction: column;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
      }

      .sidebar-header {
        padding: 24px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .logo {
        height: 40px;
        margin-bottom: 12px;
      }

      .sidebar-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: white;
      }

      .sidebar-nav {
        flex: 1;
        padding: 20px 0;
      }

      .nav-item {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        transition: all 0.2s;
        cursor: pointer;
        border-left: 3px solid transparent;
      }

      .nav-item:hover {
        background: var(--state-white-hover);
        color: white;
      }

      .nav-item.active {
        background: var(--state-white-active);
        color: white;
        border-left-color: var(--accent-500);
      }

      .nav-icon {
        font-size: 18px;
        margin-right: 12px;
        width: 32px;
        text-align: center;
      }

      .nav-item .label {
        font-size: 16px;
        font-weight: 500;
      }

      .sidebar-footer {
        padding: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .logout-btn {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 12px 16px;
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.4);
        border-radius: 6px;
        color: white;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
      }

      .logout-btn:hover {
        background: rgba(239, 68, 68, 0.3);
      }

      .logout-btn .nav-icon {
        margin-right: 8px;
        font-size: 16px;
      }

      .operator-main {
        flex: 1;
        overflow-y: auto;
        background: var(--grey-100);
      }

      /* Mobile-first for 412x915 and similar */
      @media (max-width: 768px) {
        .operator-layout {
          flex-direction: column;
        }

        .operator-sidebar {
          width: 100%;
          height: auto;
          flex-direction: row;
          padding: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .sidebar-header {
          display: none;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: row;
          padding: 0;
          overflow-x: auto;
        }

        .nav-item {
          flex: 1;
          min-width: 70px;
          flex-direction: column;
          padding: 12px 8px;
          text-align: center;
          border-left: none;
          border-bottom: 3px solid transparent;
        }

        .nav-item.active {
          border-left-color: transparent;
          border-bottom-color: var(--accent-500);
        }

        .nav-icon {
          margin-right: 0;
          margin-bottom: 4px;
          font-size: 18px;
        }

        .nav-item .label {
          font-size: 11px;
          font-weight: 500;
        }

        .sidebar-footer {
          padding: 12px;
          border-top: none;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logout-btn {
          flex-direction: column;
          padding: 8px;
          min-width: 60px;
        }

        .logout-btn .nav-icon {
          margin-right: 0;
          margin-bottom: 2px;
          font-size: 18px;
        }

        .logout-btn .label {
          font-size: 10px;
        }

        .operator-main {
          height: calc(100vh - 80px);
        }
      }
    `,
  ],
})
export class OperatorLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    // Redirect if not operator
    const userRole = this.authService.getCurrentUserRole();
    if (userRole !== 'operator') {
      this.router.navigate(['/dashboard']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
