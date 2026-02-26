import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { MainNavComponent } from '../../shared/components/main-nav.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MainNavComponent,
    PageCardComponent,
    DropdownComponent,
    ButtonComponent,
  ],
  template: `
    <app-main-nav></app-main-nav>
    <div class="settings-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-title">
          <div class="page-icon">
            <i class="fa-solid fa-gear"></i>
          </div>
          <div>
            <h1>Configuración</h1>
            <div class="breadcrumb">
              <a routerLink="/dashboard"><i class="fa-solid fa-home"></i> Dashboard</a>
              <span class="separator">›</span>
              <span>Configuración</span>
              <span class="separator" *ngIf="getActiveTabLabel()">›</span>
              <span *ngIf="getActiveTabLabel()">{{ getActiveTabLabel() }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-layout">
        <!-- Sidebar Navigation -->
        <div class="settings-sidebar">
          <div class="user-mini-profile">
            <div class="avatar-circle">
              {{ getInitials(currentUser?.full_name) }}
            </div>
            <div class="user-info">
              <h3>{{ currentUser?.full_name }}</h3>
              <span class="role-badge">{{ getRoleDisplay(currentUser?.roles) }}</span>
            </div>
          </div>

          <nav class="settings-nav">
            <button
              *ngFor="let tab of tabs"
              (click)="setActiveTab(tab.id)"
              [class.active]="activeTab === tab.id"
              class="nav-item"
            >
              <i [class]="tab.icon"></i>
              <span>{{ tab.label }}</span>
              <i class="fa-solid fa-chevron-right arrow-icon"></i>
            </button>
          </nav>
        </div>

        <!-- Content Area -->
        <div class="settings-content">
          <!-- General Settings -->
          <app-page-card *ngIf="activeTab === 'general'" class="fade-in">
            <div class="form-grid">
              <div class="form-group">
                <span class="label">Idioma</span>
                <app-dropdown
                  [options]="languageOptions"
                  [ngModel]="'es'"
                  [ngModelOptions]="{ standalone: true }"
                ></app-dropdown>
                <span class="help-text">El idioma se aplicará en toda la aplicación.</span>
              </div>

              <div class="form-group">
                <span class="label">Tema</span>
                <div class="theme-selector">
                  <label class="theme-option">
                    <input type="radio" name="theme" value="light" checked />
                    <span class="theme-preview light"></span>
                    <span>Claro</span>
                  </label>
                  <label class="theme-option">
                    <input type="radio" name="theme" value="dark" />
                    <span class="theme-preview dark"></span>
                    <span>Oscuro</span>
                  </label>
                  <label class="theme-option">
                    <input type="radio" name="theme" value="system" />
                    <span class="theme-preview system"></span>
                    <span>Sistema</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <app-button variant="primary" label="Guardar Preferencias"></app-button>
            </div>
          </app-page-card>

          <!-- Profile Settings -->
          <app-page-card *ngIf="activeTab === 'profile'" class="fade-in">
            <div *ngIf="currentUser">
              <div class="form-grid">
                <div class="form-group">
                  <span class="label">Nombre de Usuario</span>
                  <input
                    type="text"
                    [value]="currentUser.username"
                    readonly
                    class="form-control readonly"
                  />
                </div>

                <div class="form-group">
                  <span class="label">Email Corporativo</span>
                  <input
                    type="email"
                    [value]="currentUser.email"
                    readonly
                    class="form-control readonly"
                  />
                </div>

                <div class="form-group">
                  <span class="label">Nombre</span>
                  <input
                    type="text"
                    [value]="currentUser.first_name"
                    readonly
                    class="form-control readonly"
                  />
                </div>

                <div class="form-group">
                  <span class="label">Apellido</span>
                  <input
                    type="text"
                    [value]="currentUser.last_name"
                    readonly
                    class="form-control readonly"
                  />
                </div>
              </div>
            </div>
          </app-page-card>

          <!-- Security Settings -->
          <app-page-card *ngIf="activeTab === 'security'" class="fade-in">
            <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
              <div class="form-group">
                <span class="label">Contraseña Actual</span>
                <input
                  type="password"
                  formControlName="currentPassword"
                  class="form-control"
                  [class.is-invalid]="
                    passwordForm.get('currentPassword')?.invalid &&
                    passwordForm.get('currentPassword')?.touched
                  "
                />
                <div
                  class="error-message"
                  *ngIf="
                    passwordForm.get('currentPassword')?.invalid &&
                    passwordForm.get('currentPassword')?.touched
                  "
                >
                  La contraseña actual es requerida
                </div>
              </div>

              <div class="form-group">
                <span class="label">Nueva Contraseña</span>
                <input
                  type="password"
                  formControlName="newPassword"
                  class="form-control"
                  [class.is-invalid]="
                    passwordForm.get('newPassword')?.invalid &&
                    passwordForm.get('newPassword')?.touched
                  "
                />
                <div
                  class="error-message"
                  *ngIf="
                    passwordForm.get('newPassword')?.invalid &&
                    passwordForm.get('newPassword')?.touched
                  "
                >
                  Mínimo 6 caracteres
                </div>
              </div>

              <div class="form-group">
                <span class="label">Confirmar Nueva Contraseña</span>
                <input
                  type="password"
                  formControlName="confirmPassword"
                  class="form-control"
                  [class.is-invalid]="
                    passwordForm.get('confirmPassword')?.invalid &&
                    passwordForm.get('confirmPassword')?.touched
                  "
                />
                <div
                  class="error-message"
                  *ngIf="
                    passwordForm.get('confirmPassword')?.invalid &&
                    passwordForm.get('confirmPassword')?.touched
                  "
                >
                  Las contraseñas no coinciden
                </div>
              </div>

              <div class="form-actions">
                <app-button
                  variant="primary"
                  label="Actualizar Contraseña"
                  [disabled]="passwordForm.invalid"
                  (clicked)="onChangePassword()"
                ></app-button>
              </div>
            </form>
          </app-page-card>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .settings-page {
        min-height: 100vh;
        background: var(--grey-100);
        padding: 2rem;
      }

      /* Page Header */
      .page-header {
        margin-bottom: 2rem;
      }
      .page-title {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .page-icon {
        width: 48px;
        height: 48px;
        background: var(--primary-100);
        color: var(--primary-800);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }
      .page-title h1 {
        margin: 0 0 0.25rem 0;
        font-size: 24px;
        font-weight: 700;
        color: var(--primary-900);
      }
      .breadcrumb {
        color: var(--grey-500);
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .breadcrumb a {
        color: var(--primary-500);
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        transition: color 0.2s;
      }
      .breadcrumb a:hover {
        color: var(--primary-800);
      }
      .breadcrumb .separator {
        color: var(--grey-400);
      }

      /* Layout */
      .settings-layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      /* Sidebar */
      .settings-sidebar {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .user-mini-profile {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        text-align: center;
        box-shadow: var(--shadow-sm);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .avatar-circle {
        width: 80px;
        height: 80px;
        background: var(--primary-100);
        color: var(--primary-800);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: 600;
      }

      .user-info h3 {
        margin: 0 0 0.5rem 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--primary-900);
      }

      .role-badge {
        background: var(--primary-100);
        color: var(--primary-800);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .settings-nav {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: var(--shadow-sm);
      }

      .nav-item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.5rem;
        border: none;
        background: transparent;
        color: var(--grey-700);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        border-left: 3px solid transparent;
      }

      .nav-item:hover {
        background: var(--grey-50);
        color: var(--primary-800);
      }

      .nav-item.active {
        background: var(--primary-100);
        color: var(--primary-800);
        border-left-color: var(--primary-500);
      }

      .nav-item i:first-child {
        width: 20px;
        text-align: center;
      }

      .arrow-icon {
        margin-left: auto;
        font-size: 12px;
        opacity: 0.5;
      }

      /* Forms */
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-700);
      }

      .form-control {
        width: 100%;
        padding: 0.625rem 1rem;
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        font-size: 14px;
        color: var(--primary-900);
        transition: all 0.2s;
      }

      .form-control:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px var(--primary-100);
      }

      .form-control.readonly {
        background: var(--grey-50);
        color: var(--grey-700);
        cursor: not-allowed;
      }

      .form-control.is-invalid {
        border-color: var(--semantic-red-500);
      }

      .error-message {
        color: var(--semantic-red-500);
        font-size: 12px;
        margin-top: 0.25rem;
      }

      .help-text {
        display: block;
        margin-top: 0.5rem;
        font-size: 12px;
        color: var(--grey-500);
      }

      /* Theme Selector */
      .theme-selector {
        display: flex;
        gap: 1rem;
      }

      .theme-option {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .theme-option input {
        display: none;
      }

      .theme-preview {
        width: 80px;
        height: 50px;
        border-radius: 8px;
        border: 2px solid var(--grey-200);
        transition: all 0.2s;
      }

      .theme-preview.light {
        background: var(--neutral-0);
      }
      .theme-preview.dark {
        background: var(--grey-900);
      }
      .theme-preview.system {
        background: linear-gradient(135deg, var(--neutral-0) 50%, var(--grey-900) 50%);
      }

      .theme-option input:checked + .theme-preview {
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px var(--primary-100);
      }

      /* Actions */
      .form-actions {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--grey-200);
        display: flex;
        justify-content: flex-end;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .settings-layout {
          grid-template-columns: 1fr;
        }

        .settings-page {
          padding: 1rem;
        }
      }

      /* Animation */
      .fade-in {
        animation: fadeIn 0.3s ease-in-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class SettingsComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  currentUser: User | null = null;
  activeTab = 'general';

  tabs = [
    { id: 'general', label: 'General', icon: 'fa-solid fa-sliders' },
    { id: 'profile', label: 'Perfil', icon: 'fa-solid fa-user' },
    { id: 'security', label: 'Seguridad', icon: 'fa-solid fa-shield-halved' },
  ];

  languageOptions: DropdownOption[] = [
    { label: 'Español (Perú)', value: 'es' },
    { label: 'English (US)', value: 'en' },
  ];

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  constructor() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  getRoleDisplay(roles?: string[]): string {
    if (!roles || roles.length === 0) return 'Usuario';
    return roles[0].charAt(0).toUpperCase() + roles[0].slice(1);
  }

  onChangePassword() {
    if (this.passwordForm.valid) {
      console.log('Password change requested', this.passwordForm.value);
      alert('Funcionalidad de cambio de contraseña en desarrollo');
      this.passwordForm.reset();
    } else {
      this.passwordForm.markAllAsTouched();
    }
  }

  setActiveTab(tabId: string) {
    this.activeTab = tabId;
  }

  getActiveTabLabel(): string {
    const tab = this.tabs.find((t) => t.id === this.activeTab);
    return tab ? tab.label : '';
  }
}
