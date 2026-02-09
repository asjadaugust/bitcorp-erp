import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ValidationErrorsComponent,
    AlertComponent,
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fa-solid fa-user-plus"></i>
          </div>
          <div class="title-group">
            <h1>{{ isEditMode ? 'Editar Personal' : 'Nuevo Personal' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información del personal'
                  : 'Registrar un nuevo empleado en el sistema'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button
            type="submit"
            form="employeeForm"
            class="btn btn-primary"
            [disabled]="employeeForm.invalid || submitting"
          >
            <i class="fa-solid fa-save" *ngIf="!submitting"></i>
            <span class="spinner-sm" *ngIf="submitting"></span>
            {{ submitting ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>

      <div class="form-container">
        <!-- Error Handling -->
        <app-validation-errors
          *ngIf="validationErrors.length > 0"
          [errors]="validationErrors"
          class="mb-4"
        ></app-validation-errors>

        <app-alert
          *ngIf="errorMessage"
          type="error"
          [message]="errorMessage"
          [dismissible]="true"
          (dismiss)="errorMessage = null"
          class="mb-4"
        ></app-alert>

        <form id="employeeForm" [formGroup]="employeeForm" (ngSubmit)="onSubmit()">
          <!-- Personal Info -->
          <div class="form-section">
            <h2 class="section-title">Información Personal</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="dni">DNI / C.EXT <span class="required">*</span></label>
                <input
                  id="dni"
                  type="text"
                  formControlName="dni"
                  [class.error]="isFieldInvalid('dni')"
                  maxlength="12"
                  placeholder="DNI o Carnet de Extranjería"
                />
                <div class="error-message" *ngIf="isFieldInvalid('dni')">DNI es requerido</div>
              </div>
              <div class="form-group">
                <label for="nombres">Nombres <span class="required">*</span></label>
                <input
                  id="nombres"
                  type="text"
                  formControlName="nombres"
                  [class.error]="isFieldInvalid('nombres')"
                  placeholder="Nombres completos"
                />
                <div class="error-message" *ngIf="isFieldInvalid('nombres')">
                  Nombres son requeridos
                </div>
              </div>
              <div class="form-group">
                <label for="apellido_paterno"
                  >Apellido Paterno <span class="required">*</span></label
                >
                <input
                  id="apellido_paterno"
                  type="text"
                  formControlName="apellido_paterno"
                  [class.error]="isFieldInvalid('apellido_paterno')"
                  placeholder="Apellido Paterno"
                />
                <div class="error-message" *ngIf="isFieldInvalid('apellido_paterno')">
                  Apellido Paterno es requerido
                </div>
              </div>
              <div class="form-group">
                <label for="apellido_materno">Apellido Materno</label>
                <input
                  id="apellido_materno"
                  type="text"
                  formControlName="apellido_materno"
                  placeholder="Apellido Materno"
                />
              </div>
              <div class="form-group">
                <label for="fecha_nacimiento">Fecha Nacimiento</label>
                <input id="fecha_nacimiento" type="date" formControlName="fecha_nacimiento" />
              </div>
              <div class="form-group">
                <label for="cargo">Cargo</label>
                <input
                  id="cargo"
                  type="text"
                  formControlName="cargo"
                  placeholder="Ej. Operario, Supervisor"
                />
              </div>
            </div>
          </div>

          <!-- Contact Info -->
          <div class="form-section">
            <h2 class="section-title">Contacto</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="telefono">Teléfono / Celular</label>
                <input
                  id="telefono"
                  type="text"
                  formControlName="telefono"
                  placeholder="Número de contacto"
                />
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div class="form-group full-width">
                <label for="direccion">Dirección</label>
                <input
                  id="direccion"
                  type="text"
                  formControlName="direccion"
                  placeholder="Dirección de domicilio"
                />
              </div>
            </div>
          </div>

          <!-- Additional Info (Optional based on DTO) -->
          <div class="form-section">
            <h2 class="section-title">Información Laboral</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="fecha_ingreso">Fecha Ingreso</label>
                <input id="fecha_ingreso" type="date" formControlName="fecha_ingreso" />
              </div>
              <div class="form-group">
                <label for="especialidad">Especialidad</label>
                <input
                  id="especialidad"
                  type="text"
                  formControlName="especialidad"
                  placeholder="Especialidad técnica"
                />
              </div>
              <div class="form-group">
                <label for="tipo_contrato">Tipo Contrato</label>
                <input
                  id="tipo_contrato"
                  type="text"
                  formControlName="tipo_contrato"
                  placeholder="Ej. Indeterminado, Plazo Fijo"
                />
              </div>
              <div class="form-group">
                <label for="licencia_conducir">Licencia Conducir</label>
                <input
                  id="licencia_conducir"
                  type="text"
                  formControlName="licencia_conducir"
                  placeholder="Clase y Categoría"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .page-container {
        padding: var(--s-32);
        background: var(--grey-100);
        min-height: 100vh;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-24);
      }
      .header-content {
        display: flex;
        align-items: center;
        gap: var(--s-16);
      }
      .icon-wrapper {
        width: 48px;
        height: 48px;
        background: var(--primary-100);
        color: var(--primary-800);
        border-radius: var(--s-12);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }
      .title-group h1 {
        margin: 0;
        font-size: 24px;
        color: var(--grey-900);
      }
      .subtitle {
        margin: 0;
        color: var(--grey-500);
        font-size: 14px;
      }
      .header-actions {
        display: flex;
        gap: var(--s-12);
      }

      .form-container {
        max-width: 800px;
        margin: 0 auto;
      }
      .form-section {
        background: var(--neutral-0);
        border-radius: var(--s-8);
        box-shadow: var(--shadow-sm);
        padding: var(--s-24);
        margin-bottom: var(--s-24);
      }
      .section-title {
        font-size: var(--type-h4-size);
        color: var(--primary-900);
        margin-bottom: var(--s-16);
        padding-bottom: var(--s-8);
        border-bottom: 1px solid var(--grey-200);
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-16);
      }
      .full-width {
        grid-column: 1 / -1;
      }
      .form-group {
        margin-bottom: var(--s-16);
      }
      .form-group label {
        display: block;
        margin-bottom: var(--s-8);
        font-weight: 600;
        color: var(--grey-700);
      }
      .required {
        color: var(--semantic-error);
      }
      input,
      select,
      textarea {
        width: 100%;
        padding: var(--s-12);
        border: 1px solid var(--grey-300);
        border-radius: var(--s-4);
        font-size: var(--type-body-size);
        transition: border-color 0.2s;
      }
      input:focus,
      select:focus,
      textarea:focus {
        outline: none;
        border-color: var(--primary-500);
      }
      input.error,
      select.error {
        border-color: var(--semantic-error);
      }
      .error-message {
        color: var(--semantic-error);
        font-size: var(--type-label-size);
        margin-top: var(--s-4);
      }

      .btn {
        padding: var(--s-12) var(--s-24);
        border: none;
        border-radius: var(--s-4);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
      }
      .btn-primary {
        background: var(--primary-500);
        color: var(--neutral-0);
      }
      .btn-primary:disabled {
        background: var(--grey-300);
        cursor: not-allowed;
      }
      .btn-secondary {
        background: var(--neutral-0);
        border: 1px solid var(--grey-300);
        color: var(--grey-700);
      }
      .spinner-sm {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .mb-4 {
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class EmployeeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(FormErrorHandlerService);

  employeeForm: FormGroup;
  isEditMode = false;
  employeeDni: string | null = null;
  submitting = false;
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  constructor() {
    this.employeeForm = this.fb.group({
      dni: ['', [Validators.required, Validators.minLength(8)]],
      nombres: ['', Validators.required],
      apellido_paterno: ['', Validators.required],
      apellido_materno: [''],
      fecha_nacimiento: [''],
      cargo: [''],
      especialidad: [''],
      telefono: [''],
      email: ['', Validators.email],
      direccion: [''],
      fecha_ingreso: [''],
      tipo_contrato: [''],
      licencia_conducir: [''],
    });
  }

  ngOnInit(): void {
    this.employeeDni = this.route.snapshot.paramMap.get('id');
    if (this.employeeDni) {
      this.isEditMode = true;
      this.employeeForm.get('dni')?.disable(); // Cannot change DNI in edit mode
      this.loadEmployee(this.employeeDni);
    }
  }

  loadEmployee(dni: string): void {
    this.employeeService.getEmployeeByDni(dni).subscribe({
      next: (employee: Employee) => {
        this.employeeForm.patchValue(employee);
        // Handle dates if necessary (e.g. if backend returns ISO, input[type=date] needs YYYY-MM-DD)
        // Assuming backend DTO returns YYYY-MM-DD or Service doesn't parse it?
        // Service map was removed, so we get raw string.
        // If raw string is ISO datetime, it might not work in input date.
        if (employee.fecha_nacimiento) {
          this.employeeForm.patchValue({
            fecha_nacimiento: new Date(employee.fecha_nacimiento).toISOString().split('T')[0],
          });
        }
        if (employee.fecha_ingreso) {
          this.employeeForm.patchValue({
            fecha_ingreso: new Date(employee.fecha_ingreso).toISOString().split('T')[0],
          });
        }
      },
      error: (err) => {
        console.error('Error loading employee', err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.employeeForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.validationErrors = [];
    this.errorMessage = null;
    const employeeData = this.employeeForm.getRawValue();

    const request =
      this.isEditMode && this.employeeDni
        ? this.employeeService.updateEmployee(this.employeeDni, employeeData)
        : this.employeeService.createEmployee(employeeData);

    request.subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/rrhh/employees']);
      },
      error: (err) => {
        console.error('Error saving employee', err);
        this.submitting = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/rrhh/employees']);
  }
}
