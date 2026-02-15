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
import { FormContainerComponent } from '../../../../shared/components/form-container/form-container.component';

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
    FormContainerComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Personal' : 'Nuevo Personal'"
      [subtitle]="isEditMode ? 'Actualizar información del personal' : 'Registrar un nuevo empleado en el sistema'"
      [loading]="loading || submitting"
      [disableSubmit]="submitting || (employeeForm && employeeForm.invalid)"
      (onSubmit)="onSubmit()"
      (onCancel)="cancel()"
    >
      <!-- Error Handling -->
      <app-validation-errors
        *ngIf="validationErrors.length > 0"
        [errors]="validationErrors"
        [fieldLabels]="fieldLabels"
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

      <form id="standardForm" [formGroup]="employeeForm" (ngSubmit)="onSubmit()">
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

        <!-- Additional Info -->
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
    </app-form-container>
  `,
  styles: [],
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
  loading = false;
  submitting = false;
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  fieldLabels: Record<string, string> = {
    dni: 'DNI / C.EXT',
    nombres: 'Nombres',
    apellido_paterno: 'Apellido Paterno',
    apellido_materno: 'Apellido Materno',
    fecha_nacimiento: 'Fecha de Nacimiento',
    cargo: 'Cargo',
    especialidad: 'Especialidad',
    telefono: 'Teléfono',
    email: 'Email',
    direccion: 'Dirección',
    fecha_ingreso: 'Fecha de Ingreso',
    tipo_contrato: 'Tipo de Contrato',
    licencia_conducir: 'Licencia de Conducir',
  };

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
    this.loading = true;
    this.employeeService.getEmployeeByDni(dni).subscribe({
      next: (employee: Employee) => {
        this.employeeForm.patchValue(employee);
        // ... handled dates next
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading employee', err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        this.loading = false;
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
