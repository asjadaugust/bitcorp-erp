import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserManagementService } from '../../services/user-management.service';
// RoleOption removed (unused)
import { FormContainerComponent } from '../../../../shared/components/form-container/form-container.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../../shared/components/dropdown/dropdown.component';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormContainerComponent,
    DropdownComponent,
    AlertComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del usuario'
          : 'Registrar un nuevo usuario en el sistema'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-user-plus'"
      [loading]="saving"
      [disableSubmit]="userForm.invalid || saving"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Usuario'"
      (onSubmit)="onSubmit()"
      (onCancel)="cancel()"
    >
      <app-alert
        *ngIf="errorMessage"
        type="error"
        [message]="errorMessage"
        [dismissible]="true"
      ></app-alert>

      <app-alert
        *ngIf="successMessage"
        type="success"
        [message]="successMessage"
        [dismissible]="true"
        [autoDismiss]="true"
        [autoDismissDelay]="1500"
      ></app-alert>

      <form [formGroup]="userForm" class="form-grid">
        <!-- Account Information -->
        <div class="form-section full-width">
          <h3>Información de Cuenta</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="username">Usuario *</label>
              <input
                id="username"
                type="text"
                formControlName="username"
                class="form-control"
                placeholder="ej. jperez"
              />
              <div class="error-msg" *ngIf="hasError('username')">
                <span *ngIf="userForm.get('username')?.hasError('required')">
                  El usuario es requerido
                </span>
                <span *ngIf="userForm.get('username')?.hasError('minlength')">
                  Mínimo 3 caracteres
                </span>
              </div>
            </div>

            <div class="form-group">
              <label for="email">Correo Electrónico *</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-control"
                placeholder="ej. jperez&#64;empresa.com"
              />
              <div class="error-msg" *ngIf="hasError('email')">
                <span *ngIf="userForm.get('email')?.hasError('required')">
                  El correo es requerido
                </span>
                <span *ngIf="userForm.get('email')?.hasError('email')">
                  Correo electrónico inválido
                </span>
              </div>
            </div>

            <div class="form-group">
              <label for="password"> Contraseña {{ isEditMode ? '' : '*' }} </label>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="form-control"
                [placeholder]="
                  isEditMode ? 'Dejar vacío para mantener actual' : 'Mínimo 8 caracteres'
                "
              />
              <div class="error-msg" *ngIf="hasError('password')">
                <span *ngIf="userForm.get('password')?.hasError('required')">
                  La contraseña es requerida
                </span>
                <span *ngIf="userForm.get('password')?.hasError('minlength')">
                  Mínimo 8 caracteres
                </span>
              </div>
            </div>

            <div class="form-group">
              <label for="rol_id">Rol *</label>
              <app-dropdown
                formControlName="rol_id"
                [options]="roleOptions"
                [placeholder]="'Seleccionar rol...'"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('rol_id')">El rol es requerido</div>
            </div>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="form-section full-width">
          <h3>Información Personal</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="first_name">Nombres</label>
              <input
                id="first_name"
                type="text"
                formControlName="first_name"
                class="form-control"
                placeholder="ej. Juan Carlos"
              />
            </div>

            <div class="form-group">
              <label for="last_name">Apellidos</label>
              <input
                id="last_name"
                type="text"
                formControlName="last_name"
                class="form-control"
                placeholder="ej. Pérez García"
              />
            </div>

            <div class="form-group">
              <label for="dni">DNI</label>
              <input
                id="dni"
                type="text"
                formControlName="dni"
                class="form-control"
                placeholder="ej. 12345678"
                maxlength="20"
              />
            </div>

            <div class="form-group">
              <label for="phone">Teléfono</label>
              <input
                id="phone"
                type="text"
                formControlName="phone"
                class="form-control"
                placeholder="ej. 987654321"
              />
            </div>
          </div>
        </div>

        <!-- Status -->
        <div class="form-section full-width">
          <h3>Estado</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="is_active">Estado del Usuario</label>
              <app-dropdown
                formControlName="is_active"
                [options]="statusOptions"
                [placeholder]="'Seleccionar...'"
              ></app-dropdown>
            </div>
          </div>
        </div>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      .form-grid {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);
      }

      .form-section {
        h3 {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--grey-800);
          margin: 0 0 var(--s-16) 0;
          padding-bottom: var(--s-8);
          border-bottom: 1px solid var(--grey-200);
        }
      }

      .section-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--s-16);
      }

      @media (max-width: 640px) {
        .section-grid {
          grid-template-columns: 1fr;
        }
      }

      .form-group {
        label {
          display: block;
          margin-bottom: var(--s-4);
          font-weight: 500;
          font-size: var(--type-label-size);
          color: var(--grey-700);
        }
      }

      .form-control {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--grey-300);
        border-radius: 8px;
        font-size: var(--type-body-size);
        box-sizing: border-box;
        transition: border-color 0.15s ease;

        &:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px var(--primary-100);
        }
      }

      .error-msg {
        color: var(--red-600, #dc2626);
        font-size: var(--type-label-size);
        margin-top: 4px;
      }
    `,
  ],
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserManagementService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);

  userForm: FormGroup;
  isEditMode = false;
  saving = false;
  loadingUser = false;
  userId: number | null = null;
  errorMessage = '';
  successMessage = '';

  roleOptions: DropdownOption[] = [];
  statusOptions: DropdownOption[] = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  constructor() {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      email: ['', [Validators.required, Validators.email]],
      first_name: [''],
      last_name: [''],
      dni: [''],
      phone: [''],
      rol_id: [null, Validators.required],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.loadRoles();

    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id && id !== 'undefined' && id !== 'NaN') {
        this.isEditMode = true;
        this.userId = parseInt(id);
        // In edit mode, password is optional
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.setValidators(Validators.minLength(8));
        this.userForm.get('password')?.updateValueAndValidity();
        this.loadUser(this.userId);
      }
    });
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (roles) => {
        this.roleOptions = roles.map((r) => ({
          label: r.name,
          value: r.id,
        }));
      },
    });
  }

  loadUser(id: number): void {
    this.loadingUser = true;
    this.userService.getById(id).subscribe({
      next: (user) => {
        this.userForm.patchValue({
          username: user.username,
          email: user.email,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          dni: user.dni || '',
          phone: user.phone || '',
          rol_id: user.rol_id || user.rol?.id || null,
          is_active: user.is_active,
        });
        this.loadingUser = false;
      },
      error: () => {
        this.loadingUser = false;
        this.router.navigate(['/users']);
      },
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = { ...this.userForm.value };

    // Remove empty password for update
    if (this.isEditMode && !formData.password) {
      delete formData.password;
    }

    const request$ =
      this.isEditMode && this.userId
        ? this.userService.update(this.userId, formData)
        : this.userService.create(formData);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = this.isEditMode
          ? 'Usuario actualizado exitosamente'
          : 'Usuario creado exitosamente';

        setTimeout(() => {
          this.router.navigate(['/users']);
        }, 1500);
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.error?.message || 'Error al guardar el usuario';
      },
    });
  }

  cancel(): void {
    if (this.userForm.dirty) {
      this.confirmSvc
        .confirm({
          title: 'Confirmar Cancelación',
          message: '¿Está seguro de cancelar? Los cambios no guardados se perderán.',
          icon: 'fa-triangle-exclamation',
          confirmLabel: 'Salir sin guardar',
          isDanger: true,
        })
        .subscribe((confirmed) => {
          if (confirmed) {
            this.router.navigate(['/users']);
          }
        });
    } else {
      this.router.navigate(['/users']);
    }
  }

  hasError(field: string): boolean {
    const control = this.userForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
