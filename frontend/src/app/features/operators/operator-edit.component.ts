import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OperatorService } from '../../core/services/operator.service';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../core/services/form-error-handler.service';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../shared/components/form-section/form-section.component';
import { ValidationErrorsComponent } from '../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';
import { AeroInputComponent } from '../../core/design-system/input/aero-input.component';

@Component({
  selector: 'app-operator-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormContainerComponent,
    FormSectionComponent,
    ValidationErrorsComponent,
    AlertComponent,
    DropdownComponent,
    AeroInputComponent,
  ],
  template: `
    <app-form-container
      [title]="isNew ? 'Nuevo Operador' : 'Editar Operador'"
      [subtitle]="
        isNew ? 'Registrar un nuevo operador en el sistema' : 'Actualizar información del operador'
      "
      [icon]="isNew ? 'fa-user-plus' : 'fa-user-pen'"
      backUrl="/operators"
      [loading]="loading"
      [disableSubmit]="operatorForm.invalid || loading || saving"
      [submitLabel]="isNew ? 'Crear Operador' : 'Guardar Cambios'"
      (submitted)="saveOperator()"
      (cancelled)="cancel()"
    >
      <app-alert *ngIf="errorMessage" type="error" [message]="errorMessage"></app-alert>
      <app-alert *ngIf="successMessage" type="success" [message]="successMessage"></app-alert>

      <app-validation-errors
        *ngIf="validationErrors.length > 0"
        [errors]="validationErrors"
        [fieldLabels]="fieldLabels"
        class="mb-4"
      ></app-validation-errors>

      <form [formGroup]="operatorForm" class="form-grid" id="standardForm">
        <!-- Section 1: Personal Information -->
        <app-form-section title="Información Personal" icon="fa-user" [columns]="2">
          <div class="form-group">
            <aero-input
              label="DNI"
              formControlName="dni"
              placeholder="Ej. 12345678"
              [required]="true"
              [error]="hasError('dni') ? 'DNI es requerido (8 dígitos)' : ''"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Nombres"
              formControlName="nombres"
              placeholder="Ej. Juan"
              [required]="true"
              [error]="hasError('nombres') ? 'Nombres es requerido' : ''"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Apellido Paterno"
              formControlName="apellido_paterno"
              placeholder="Ej. Pérez"
              [required]="true"
              [error]="hasError('apellido_paterno') ? 'Apellido Paterno es requerido' : ''"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Apellido Materno"
              formControlName="apellido_materno"
              placeholder="Ej. Gomez"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Email"
              type="email"
              formControlName="correo_electronico"
              placeholder="juan.perez@bitcorp.com"
              [error]="hasError('correo_electronico') ? 'Email inválido' : ''"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Teléfono"
              formControlName="telefono"
              placeholder="+51 999 999 999"
            ></aero-input>
          </div>
        </app-form-section>

        <!-- Section 2: Employment Details -->
        <app-form-section title="Información Laboral" icon="fa-briefcase" [columns]="2">
          <div class="form-group">
            <label class="aero-label">Estado <span class="required">*</span></label>
            <app-dropdown formControlName="is_active" [options]="statusOptions"></app-dropdown>
          </div>

          <div class="form-group">
            <aero-input
              label="Cargo"
              formControlName="cargo"
              placeholder="Ej. Operador Maquinaria Pesada"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Fecha de Ingreso"
              type="date"
              formControlName="fecha_ingreso"
            ></aero-input>
          </div>
        </app-form-section>

        <!-- Section 3: Driving License -->
        <app-form-section title="Licencia de Conducir" icon="fa-id-card" [columns]="2">
          <div class="form-group">
            <aero-input
              label="Nro. de Licencia"
              formControlName="licencia_conducir"
              placeholder="A-12345678"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Vencimiento"
              type="date"
              formControlName="vencimiento_licencia"
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
export class OperatorEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private operatorService = inject(OperatorService);
  private errorHandler = inject(FormErrorHandlerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  operatorForm: FormGroup;
  loading = false;
  saving = false;
  isNew = true;
  operatorId: number | null = null;
  errorMessage = '';
  successMessage = '';
  validationErrors: ValidationError[] = [];

  fieldLabels: Record<string, string> = {
    dni: 'DNI',
    nombres: 'Nombres',
    apellido_paterno: 'Apellido Paterno',
    apellido_materno: 'Apellido Materno',
    correo_electronico: 'Email',
    telefono: 'Teléfono',
    is_active: 'Estado',
    fecha_ingreso: 'Fecha de Ingreso',
    licencia_conducir: 'Nro. de Licencia',
    vencimiento_licencia: 'Vencimiento de Licencia',
  };

  constructor() {
    this.operatorForm = this.fb.group({
      dni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellido_paterno: ['', [Validators.required, Validators.maxLength(100)]],
      apellido_materno: ['', [Validators.maxLength(100)]],
      correo_electronico: ['', [Validators.email, Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(20)]],
      is_active: [true, Validators.required],
      fecha_ingreso: [new Date().toISOString().split('T')[0]],
      cargo: ['', [Validators.maxLength(100)]],
      licencia_conducir: ['', [Validators.maxLength(50)]],
      vencimiento_licencia: [''],
    });
  }

  statusOptions: DropdownOption[] = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isNew = false;
      this.operatorId = +id;
      this.loadOperator(this.operatorId);
    }
  }

  loadOperator(id: number): void {
    this.loading = true;
    this.operatorService.getById(id).subscribe({
      next: (operator) => {
        this.operatorForm.patchValue(operator);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        this.loading = false;
      },
    });
  }

  hasError(field: string): boolean {
    const control = this.operatorForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  saveOperator(): void {
    if (this.operatorForm.invalid) {
      this.operatorForm.markAllAsTouched(); // Mark all fields as touched to show validation errors
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.validationErrors = [];

    const operatorData = this.operatorForm.value;

    // Ensure 'is_active' is boolean if it comes as string from select
    // (Though [ngValue] usually handles this correctly)

    const request$ = this.isNew
      ? this.operatorService.create(operatorData)
      : this.operatorService.update(this.operatorId!, operatorData);

    request$.subscribe({
      next: () => {
        this.successMessage = `Operador ${this.isNew ? 'creado' : 'actualizado'} correctamente`;
        this.saving = false;
        setTimeout(() => {
          this.router.navigate(['/operators']);
        }, 1500);
      },
      error: (err) => {
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        this.saving = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/operators']);
  }
}
