import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { FormSectionComponent } from '../../../../shared/components/form-section/form-section.component';
import { AeroInputComponent } from '../../../../core/design-system/input/aero-input.component';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ValidationErrorsComponent,
    AlertComponent,
    FormContainerComponent,
    FormSectionComponent,
    AeroInputComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Personal' : 'Nuevo Personal'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del personal'
          : 'Registrar nuevo personal en el sistema'
      "
      [icon]="isEditMode ? 'fa-user-pen' : 'fa-user-plus'"
      backUrl="/rrhh/employees"
      [loading]="loading || submitting"
      [disableSubmit]="submitting || (employeeForm && employeeForm.invalid)"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Personal'"
      (submitted)="onSubmit()"
      (cancelled)="cancel()"
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

      <form id="standardForm" [formGroup]="employeeForm">
        <!-- Section 1: Personal Information -->
        <app-form-section title="Información Personal" icon="fa-user" [columns]="2">
          <div class="form-group">
            <aero-input
              label="DNI / C.EXT"
              formControlName="dni"
              placeholder="DNI o Carnet de Extranjería"
              [required]="true"
              [error]="isFieldInvalid('dni') ? 'DNI es requerido (mín. 8 caracteres)' : ''"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Nombres"
              formControlName="nombres"
              placeholder="Nombres completos"
              [required]="true"
              [error]="isFieldInvalid('nombres') ? 'Nombres es requerido' : ''"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Apellido Paterno"
              formControlName="apellido_paterno"
              placeholder="Apellido Paterno"
              [required]="true"
              [error]="isFieldInvalid('apellido_paterno') ? 'Apellido Paterno es requerido' : ''"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Apellido Materno"
              formControlName="apellido_materno"
              placeholder="Apellido Materno"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Fecha Nacimiento"
              type="date"
              formControlName="fecha_nacimiento"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Cargo"
              formControlName="cargo"
              placeholder="Ej. Operario, Supervisor"
            ></aero-input>
          </div>
        </app-form-section>

        <!-- Section 2: Contact -->
        <app-form-section title="Contacto" icon="fa-address-book" [columns]="2">
          <div class="form-group">
            <aero-input
              label="Teléfono / Celular"
              formControlName="telefono"
              placeholder="Número de contacto"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Email"
              type="email"
              formControlName="email"
              placeholder="correo@ejemplo.com"
              [error]="isFieldInvalid('email') ? 'Email inválido' : ''"
            ></aero-input>
          </div>

          <div class="form-group full-width">
            <aero-input
              label="Dirección"
              formControlName="direccion"
              placeholder="Dirección de domicilio"
            ></aero-input>
          </div>
        </app-form-section>

        <!-- Section 3: Employment Details -->
        <app-form-section title="Información Laboral" icon="fa-briefcase" [columns]="2">
          <div class="form-group">
            <aero-input
              label="Fecha Ingreso"
              type="date"
              formControlName="fecha_ingreso"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Especialidad"
              formControlName="especialidad"
              placeholder="Especialidad técnica"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Tipo Contrato"
              formControlName="tipo_contrato"
              placeholder="Ej. Indeterminado, Plazo Fijo"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Licencia Conducir"
              formControlName="licencia_conducir"
              placeholder="Clase y Categoría"
            ></aero-input>
          </div>
        </app-form-section>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout';
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
      this.employeeForm.get('dni')?.disable();
      this.loadEmployee(this.employeeDni);
    }
  }

  loadEmployee(dni: string): void {
    this.loading = true;
    this.employeeService.getEmployeeByDni(dni).subscribe({
      next: (employee: Employee) => {
        this.employeeForm.patchValue(employee);
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
