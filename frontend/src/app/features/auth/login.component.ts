import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card card">
        <h2>Bienvenido a</h2>
        <h1>Bitcorp ERP</h1>
        <h2 class="subtitle">tu copiloto para la gestión de proyecto viales</h2>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label for="username">Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              [(ngModel)]="credentials.username"
              required
              #username="ngModel"
            />
            <div *ngIf="username.invalid && username.touched" class="error">
              El usuario es requerido
            </div>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="credentials.password"
              required
              #password="ngModel"
            />
            <div *ngIf="password.invalid && password.touched" class="error">
              La contraseña es requerida
            </div>
          </div>

          <div *ngIf="errorMessage" class="alert alert-error">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn btn-primary" [disabled]="loginForm.invalid || loading">
            <i *ngIf="loading" class="fa-solid fa-spinner fa-spin"></i>
            {{ loading ? '...' : 'Iniciar Sesión' }}
          </button>
        </form>

        <!-- Registration disabled - Only admin can create users -->
        <p class="info-text">Contacte a su administrador para crear una nueva cuenta.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        min-height: 100vh;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, var(--primary-900) 0%, var(--primary-500) 100%);
        padding: var(--s-24);
      }

      .login-card {
        width: 100%;
        max-width: 450px;
        padding: var(--s-48);
        background: var(--neutral-0);
        border-radius: var(--s-16);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      h1 {
        font-family: var(--font-family-display);
        font-size: var(--type-h2-size);
        line-height: var(--type-h2-line-height);
        color: var(--primary-900);
        text-align: center;
        margin-bottom: var(--s-4);
      }

      h2 {
        font-size: var(--type-h4-size);
        color: var(--primary-700);
        text-align: center;
        margin-bottom: var(--s-8);
        font-weight: 400;
      }

      h2.subtitle {
        font-size: var(--type-body-size);
        color: var(--grey-500);
        margin-bottom: var(--s-48);
        font-weight: 400;
      }

      h3 {
        font-size: var(--type-h3-size);
        color: var(--primary-900);
        margin-bottom: var(--s-16);
        text-align: center;
      }

      form {
        margin-bottom: var(--s-24);
      }

      .form-group {
        margin-bottom: var(--s-24);
      }

      label {
        display: block;
        margin-bottom: var(--s-8);
        color: var(--primary-900);
        font-weight: 500;
        font-size: var(--type-bodySmall-size);
      }

      input {
        width: 100%;
        padding: var(--s-12);
        border: 1px solid var(--grey-300);
        border-radius: var(--s-4);
        font-family: var(--font-family-base);
        font-size: var(--type-body-size);
        transition: border-color 0.2s;
      }

      input:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px var(--state-primary-hover);
      }

      .btn {
        width: 100%;
        padding: var(--s-12) var(--s-24);
        border: none;
        border-radius: var(--s-24);
        font-family: var(--font-family-base);
        font-weight: 600;
        font-size: var(--type-body-size);
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .btn-primary {
        background-color: var(--primary-500);
        color: var(--neutral-0);
      }

      .btn-primary:hover {
        background-color: var(--primary-800);
      }

      .btn-primary:disabled {
        background-color: var(--grey-300);
        cursor: not-allowed;
      }

      .btn-block {
        width: 100%;
        justify-content: center;
        margin-top: var(--s-16);
      }

      .info-text {
        text-align: center;
        color: var(--grey-500);
        font-size: var(--type-bodySmall-size);
        margin-top: var(--s-24);
      }

      .error {
        color: var(--semantic-red-500);
        font-size: var(--type-label-size);
        margin-top: var(--s-4);
      }

      .alert {
        padding: var(--s-12);
        border-radius: var(--s-4);
        margin-bottom: var(--s-24);
        font-size: var(--type-bodySmall-size);
      }

      .alert-error {
        background-color: var(--semantic-red-100);
        color: var(--semantic-red-900);
        border: 1px solid var(--semantic-red-300);
      }

      @media (max-width: 768px) {
        .login-card {
          padding: var(--s-24);
        }

        h1 {
          font-size: var(--type-h3-size);
        }
      }
    `,
  ],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  credentials = { username: '', password: '' };
  errorMessage = '';
  loading = false;

  onSubmit(): void {
    console.log('🔐 Login form submitted', this.credentials);
    this.loading = true;
    this.errorMessage = '';

    console.log('📡 Calling authService.login...');
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('✅ Login successful!', response);
        this.loading = false;
        // Redirect based on user role
        const userRole = response.user.roles?.[0]?.toUpperCase();
        console.log('Login successful, user role:', userRole);

        // Navigate based on role
        if (userRole === 'OPERADOR') {
          console.log('Navigating to operator dashboard');
          this.router.navigate(['/operator/dashboard']);
        } else {
          console.log('Navigating to main app');
          this.router.navigate(['/app']);
        }
      },
      error: (error) => {
        console.error('❌ Login failed:', error);
        this.errorMessage =
          error.error?.error || 'Error de inicio de sesión. Por favor verifique sus credenciales.';
        this.loading = false;
      },
    });
  }
}
