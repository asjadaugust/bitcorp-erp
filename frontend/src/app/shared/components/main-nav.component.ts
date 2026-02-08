import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationDropdownComponent } from './notification-dropdown.component';
import { ClickOutsideDirective } from '../directives/click-outside.directive';

@Component({
  selector: 'app-main-nav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NotificationDropdownComponent,
    ClickOutsideDirective,
  ],
  template: `
    <nav class="main-nav">
      <div class="nav-left">
        <button class="mobile-menu-btn" (click)="toggleSidebar()">
          <i class="fa-solid fa-bars"></i>
        </button>
        <a routerLink="/dashboard" class="nav-brand">
          <img src="assets/logo.svg" alt="Bitcorp Logo" class="nav-logo" />
          <h1>Bitcorp ERP</h1>
        </a>
      </div>

      <div class="nav-user">
        <!-- Notification Bell -->
        <div class="notification-wrapper" (clickOutside)="closeNotifications()">
          <button class="btn-icon" (click)="toggleNotifications()">
            <i class="fa-regular fa-bell"></i>
            <span class="badge" *ngIf="notificationService.unreadCount() > 0">
              {{ notificationService.unreadCount() }}
            </span>
          </button>

          <app-notification-dropdown *ngIf="showNotifications"></app-notification-dropdown>
        </div>

        <span class="user-name">{{ (authService.currentUser$ | async)?.full_name || 'User' }}</span>
        <a routerLink="/settings" class="btn-icon" title="Configuración">
          <i class="fa-solid fa-gear"></i>
        </a>
        <button class="btn-logout" (click)="logout()">Cerrar Sesión</button>
      </div>
    </nav>
  `,
  styles: [
    `
      .main-nav {
        background: var(--neutral-0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: var(--s-16) var(--s-32);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--s-24);
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        height: 72px; /* Explicit height for layout calculations */
        box-sizing: border-box;
      }

      .nav-left {
        display: flex;
        align-items: center;
        gap: var(--s-16);
      }

      .mobile-menu-btn {
        display: none;
        background: none;
        border: none;
        font-size: 24px;
        color: var(--primary-900);
        cursor: pointer;
        padding: 0;
        margin-right: 0.5rem;
      }

      .nav-brand {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        text-decoration: none;
        cursor: pointer;
        transition: opacity 0.2s;

        &:hover {
          opacity: 0.8;
        }

        .nav-logo {
          height: 32px;
          width: 32px;
        }

        h1 {
          font-family: var(--font-family-display);
          font-size: var(--type-h4-size);
          color: var(--primary-900);
          margin: 0;
          white-space: nowrap;
        }
      }

      .nav-center {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .project-selector {
        display: flex;
        align-items: center;
        gap: var(--s-8);

        label {
          font-weight: 500;
          color: var(--primary-900);
          font-size: var(--type-bodySmall-size);
          white-space: nowrap;
        }
      }

      .project-dropdown {
        padding: 10px 16px;
        border: 2px solid var(--primary-500);
        border-radius: var(--s-4);
        font-size: var(--type-bodySmall-size);
        font-weight: 500;
        color: var(--primary-900);
        background: var(--neutral-0);
        cursor: pointer;
        min-width: 250px;
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--primary-900);
        }

        &:focus {
          outline: none;
          border-color: var(--primary-900);
          box-shadow: 0 0 0 3px var(--state-primary-hover);
        }
      }

      .nav-user {
        display: flex;
        align-items: center;
        gap: var(--s-16);

        .user-name {
          font-weight: 500;
          color: var(--primary-900);
          white-space: nowrap;
        }
      }

      .btn-logout {
        padding: 8px 16px;
        border: 1px solid var(--grey-300);
        border-radius: var(--s-4);
        background: transparent;
        color: var(--grey-700);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: var(--type-bodySmall-size);

        &:hover {
          background: var(--grey-100);
          color: var(--semantic-red-500);
          border-color: var(--semantic-red-300);
        }
      }

      /* Notification Styles */
      .notification-wrapper {
        position: relative;
      }

      .btn-icon {
        background: none;
        border: none;
        font-size: 20px;
        color: var(--grey-700);
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        position: relative;
        transition: background 0.2s;
      }
      .btn-icon:hover {
        background: var(--grey-100);
        color: var(--primary-500);
      }

      .badge {
        position: absolute;
        top: 0;
        right: 0;
        background: var(--semantic-red-500);
        color: white;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 5px;
        border-radius: 10px;
        min-width: 16px;
        text-align: center;
        border: 2px solid white;
      }

      @media (max-width: 768px) {
        .main-nav {
          height: auto;
          padding: var(--s-16);
          flex-direction: column;
          gap: var(--s-16);
        }

        .mobile-menu-btn {
          display: block;
        }

        .nav-center {
          width: 100%;
          order: 3;
        }

        .project-dropdown {
          width: 100%;
          min-width: unset;
        }

        .nav-user {
          width: 100%;
          justify-content: space-between;
          order: 2;
          border-top: 1px solid var(--grey-200);
          padding-top: var(--s-16);
        }
      }
    `,
  ],
})
export class MainNavComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  private router = inject(Router);

  showNotifications = false;

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  closeNotifications() {
    this.showNotifications = false;
  }

  toggleSidebar(): void {
    window.dispatchEvent(new CustomEvent('sidebar-toggle-mobile'));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
