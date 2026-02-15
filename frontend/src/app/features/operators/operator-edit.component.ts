import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OperatorService } from '../../core/services/operator.service';
import { Operator } from '../../core/models/operator.model';
import { FormErrorHandlerService } from '../../core/services/form-error-handler.service';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { ValidationErrorsComponent } from '../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-operator-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormContainerComponent,
    ValidationErrorsComponent,
    AlertComponent,
    DropdownComponent,
  ],
  template: `
    <app-form-container
      [title]="isNew ? 'Nuevo Operador' : 'Editar Operador'"
      [subtitle]="
        isNew ? 'Registrar un nuevo operador en el sistema' : 'Actualizar información del operador'
      "
      [icon]="isNew ? 'fa-user-plus' : 'fa-user-pen'"
      [loading]="loading"
      [disableSubmit]="operatorForm.invalid || loading || saving"
      [submitLabel]="isNew ? 'Crear Operador' : 'Guardar Cambios'"
      (onSubmit)="saveOperator()"
      (onCancel)="cancel()"
    >
      <app-alert *ngIf="errorMessage" type="error" [message]="errorMessage"></app-alert>
      <app-alert *ngIf="successMessage" type="success" [message]="successMessage"></app-alert>

      <app-validation-errors
        *ngIf="validationErrors.length > 0"
        [errors]="validationErrors"
        [fieldLabels]="fieldLabels"
        class="mb-4"
      ></app-validation-errors>

      <form [formGroup]="operatorForm" class="form-grid">
        <!-- Section 1: Personal Information -->
        <div class="form-section">
          <h3>Información Personal</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="dni">DNI *</label>
              <input
                type="text"
                id="dni"
                formControlName="dni"
                class="form-control"
                placeholder="Ej. 12345678"
                maxlength="8"
              />
              <div class="error-msg" *ngIf="hasError('dni')">DNI es requerido (8 dígitos)</div>
            </div>

            <div class="form-group">
              <label for="nombres">Nombres *</label>
              <input
                type="text"
                id="nombres"
                formControlName="nombres"
                class="form-control"
                placeholder="Ej. Juan"
              />
              <div class="error-msg" *ngIf="hasError('nombres')">Nombres es requerido</div>
            </div>

            <div class="form-group">
              <label for="apellido_paterno">Apellido Paterno *</label>
              <input
                type="text"
                id="apellido_paterno"
                formControlName="apellido_paterno"
                class="form-control"
                placeholder="Ej. Pérez"
              />
              <div class="error-msg" *ngIf="hasError('apellido_paterno')">
                Apellido Paterno es requerido
              </div>
            </div>

            <div class="form-group">
              <label for="apellido_materno">Apellido Materno</label>
              <input
                type="text"
                id="apellido_materno"
                formControlName="apellido_materno"
                class="form-control"
                placeholder="Ej. Gomez"
              />
            </div>

            <div class="form-group">
              <label for="correo_electronico">Email</label>
              <input
                type="email"
                id="correo_electronico"
                formControlName="correo_electronico"
                class="form-control"
                placeholder="juan.perez@bitcorp.com"
              />
              <div class="error-msg" *ngIf="hasError('correo_electronico')">Email inválido</div>
            </div>

            <div class="form-group">
              <label for="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                formControlName="telefono"
                class="form-control"
                placeholder="+51 999 999 999"
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Employment Details -->
        <div class="form-section">
          <h3>Información Laboral</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="is_active">Estado *</label>
              <app-dropdown formControlName="is_active" [options]="statusOptions"></app-dropdown>
            </div>

            <div class="form-group">
              <label for="cargo">Cargo</label>
              <input
                type="text"
                id="cargo"
                formControlName="cargo"
                class="form-control"
                placeholder="Ej. Operador Maquinaria Pesada"
              />
            </div>

            <div class="form-group">
              <label for="fecha_ingreso">Fecha de Ingreso</label>
              <input
                type="date"
                id="fecha_ingreso"
                formControlName="fecha_ingreso"
                class="form-control"
              />
            </div>
          </div>
        </div>

        <!-- Section 3: Driving License -->
        <div class="form-section">
          <h3>Licencia de Conducir</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="licencia_conducir">Nro. de Licencia</label>
              <input
                type="text"
                id="licencia_conducir"
                formControlName="licencia_conducir"
                class="form-control"
                placeholder="A-12345678"
              />
            </div>

            <div class="form-group">
              <label for="vencimiento_licencia">Vencimiento</label>
              <input
                type="date"
                id="vencimiento_licencia"
                formControlName="vencimiento_licencia"
                class="form-control"
              />
            </div>
          </div>
        </div>
      </form>
    </app-form-container>
  `,
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
  validationErrors: any[] = [];

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
