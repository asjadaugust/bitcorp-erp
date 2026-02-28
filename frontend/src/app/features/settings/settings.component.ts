import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { AeroTabsComponent } from '../../shared/components/aero-tabs/aero-tabs.component';
import { AeroInputComponent } from '../../core/design-system/input/aero-input.component';
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
    FormsModule,
    ReactiveFormsModule,
    PageLayoutComponent,
    PageCardComponent,
    AeroTabsComponent,
    AeroInputComponent,
    DropdownComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-layout title="Configuración" icon="fa-gear" [breadcrumbs]="breadcrumbs">
      <!-- Tab Navigation (static, not route-based) -->
      <app-aero-tabs
        [tabs]="tabs"
        [activeTabId]="activeTab"
        (tabChange)="setActiveTab($event)"
      ></app-aero-tabs>

      <!-- General Tab -->
      <app-page-card *ngIf="activeTab === 'general'">
        <div class="section-grid">
          <div class="form-group">
            <label class="form-label">Idioma</label>
            <app-dropdown
              [options]="languageOptions"
              [ngModel]="'es'"
              [ngModelOptions]="{ standalone: true }"
            ></app-dropdown>
            <span class="form-hint">El idioma se aplicará en toda la aplicación.</span>
          </div>

          <div class="form-group">
            <label class="form-label">Tema</label>
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

      <!-- Profile Tab -->
      <app-page-card *ngIf="activeTab === 'profile'" title="Información del Usuario">
        <div class="info-grid info-grid-2col" *ngIf="currentUser">
          <div class="info-item">
            <span class="label">Nombre de Usuario</span>
            <p>{{ currentUser.username }}</p>
          </div>
          <div class="info-item">
            <span class="label">Email Corporativo</span>
            <p>{{ currentUser.email }}</p>
          </div>
          <div class="info-item">
            <span class="label">Nombre</span>
            <p>{{ currentUser.first_name }}</p>
          </div>
          <div class="info-item">
            <span class="label">Apellido</span>
            <p>{{ currentUser.last_name }}</p>
          </div>
        </div>
      </app-page-card>

      <!-- Security Tab -->
      <app-page-card *ngIf="activeTab === 'security'">
        <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
          <div class="section-grid">
            <aero-input
              label="Contraseña Actual"
              type="password"
              formControlName="currentPassword"
              [required]="true"
              [error]="
                passwordForm.get('currentPassword')?.invalid &&
                passwordForm.get('currentPassword')?.touched
                  ? 'La contraseña actual es requerida'
                  : ''
              "
            ></aero-input>

            <aero-input
              label="Nueva Contraseña"
              type="password"
              formControlName="newPassword"
              [required]="true"
              [error]="
                passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched
                  ? 'Mínimo 6 caracteres'
                  : ''
              "
            ></aero-input>

            <aero-input
              label="Confirmar Nueva Contraseña"
              type="password"
              formControlName="confirmPassword"
              [required]="true"
              [error]="
                passwordForm.get('confirmPassword')?.invalid &&
                passwordForm.get('confirmPassword')?.touched
                  ? 'Las contraseñas no coinciden'
                  : ''
              "
            ></aero-input>
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
    </app-page-layout>
  `,
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  currentUser: User | null = null;
  activeTab = 'general';

  breadcrumbs: Breadcrumb[] = [{ label: 'Dashboard', url: '/app' }, { label: 'Configuración' }];

  tabs = [
    { id: 'general', label: 'General', icon: 'fa-sliders' },
    { id: 'profile', label: 'Perfil', icon: 'fa-user' },
    { id: 'security', label: 'Seguridad', icon: 'fa-shield-halved' },
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

  onChangePassword() {
    if (this.passwordForm.valid) {
      console.log('Password change requested', this.passwordForm.value);
      this.snackBar.open('Funcionalidad de cambio de contraseña en desarrollo', 'Cerrar', {
        duration: 3000,
      });
      this.passwordForm.reset();
    } else {
      this.passwordForm.markAllAsTouched();
    }
  }

  setActiveTab(tab: { id?: string }) {
    this.activeTab = tab.id || 'general';
  }
}
