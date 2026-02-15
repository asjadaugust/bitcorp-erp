import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AdministrationService } from '../../services/administration.service';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../../../core/services/form-error-handler.service';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../../shared/components/dropdown/dropdown.component';
import { ValidationErrorsComponent } from '../../../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-cost-center-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DropdownComponent,
    ValidationErrorsComponent,
    AlertComponent,
  ],
  template: `
    <div class="form-container">
      <!-- Validation Errors and Alerts -->
      <app-validation-errors *ngIf="validationErrors.length > 0" [errors]="validationErrors">
      </app-validation-errors>

      <app-alert
        *ngIf="errorMessage"
        type="error"
        [message]="errorMessage"
        [dismissible]="true"
        (dismiss)="errorMessage = null"
      >
      </app-alert>

      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fa-solid" [class.fa-plus]="!isEditMode" [class.fa-pen]="isEditMode"></i>
          </div>
          <div class="title-group">
            <h1>{{ isEditMode ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información del centro de costo'
                  : 'Registrar un nuevo centro de costo en el sistema'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="onCancel()">Cancelar</button>
          <button class="btn btn-primary" (click)="onSubmit()" [disabled]="form.invalid || loading">
            <i class="fa-solid fa-save"></i>
            {{ isEditMode ? 'Guardar Cambios' : 'Crear Centro de Costo' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="form" class="form-grid">
          <!-- Section 1: Cost Center Information -->
          <div class="form-section full-width">
            <h3>Información del Centro de Costo</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="codigo">Código *</label>
                <input
                  id="codigo"
                  type="text"
                  formControlName="codigo"
                  class="form-control"
                  placeholder="ej. CC-001"
                />
                <div class="error-msg" *ngIf="hasError('codigo')">Código es requerido</div>
              </div>

              <div class="form-group">
                <label for="nombre">Nombre *</label>
                <input
                  id="nombre"
                  type="text"
                  formControlName="nombre"
                  class="form-control"
                  placeholder="Nombre del centro de costo"
                />
                <div class="error-msg" *ngIf="hasError('nombre')">Nombre es requerido</div>
              </div>

              <div class="form-group">
                <label for="tipo">Tipo *</label>
                <app-dropdown
                  formControlName="tipo"
                  [options]="typeOptions"
                  [placeholder]="'Seleccione...'"
                ></app-dropdown>
                <div class="error-msg" *ngIf="hasError('tipo')">Tipo es requerido</div>
              </div>

              <div class="form-group">
                <label for="is_active">Estado *</label>
                <app-dropdown
                  formControlName="is_active"
                  [options]="statusOptions"
                  [placeholder]="'Seleccione...'"
                ></app-dropdown>
                <div class="error-msg" *ngIf="hasError('is_active')">Estado es requerido</div>
              </div>

              <div class="form-group full-width">
                <label for="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  formControlName="descripcion"
                  class="form-control"
                  rows="3"
                  placeholder="Descripción breve del centro de costo..."
                ></textarea>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .form-container {
        max-width: 1000px;
        margin: 0 auto;
        padding-bottom: 2rem;
      }

      /* Header */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }
      .header-content {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .icon-wrapper {
        width: 48px;
        height: 48px;
        background: var(--primary-100);
        color: var(--primary-800);
        border-radius: 12px;
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
        gap: 1rem;
      }

      /* Form Card */
      .form-card {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .form-grid {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .form-section h3 {
        font-size: 16px;
        color: var(--primary-800);
        border-bottom: 1px solid var(--grey-200);
        padding-bottom: 0.5rem;
        margin-bottom: 1.5rem;
        font-weight: 600;
      }

      .section-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
      }

      .full-width {
        grid-column: 1 / -1;
      }

      /* Form Controls */
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      label {
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-700);
      }

      .form-control,
      .form-select {
        padding: 0.625rem;
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s;
      }

      .form-control:focus,
      .form-select:focus {
        border-color: var(--primary-500);
        outline: none;
        box-shadow: 0 0 0 3px var(--primary-100);
      }

      .error-msg {
        color: var(--semantic-red-600);
        font-size: 12px;
      }

      /* Buttons */
      .btn {
        padding: 0.625rem 1.25rem;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
      }

      .btn-primary {
        background: var(--primary-500);
        color: white;
      }
      .btn-primary:hover {
        background: var(--primary-800);
      }
      .btn-primary:disabled {
        background: var(--grey-300);
        cursor: not-allowed;
      }

      .btn-secondary {
        background: white;
        border: 1px solid var(--grey-300);
        color: var(--grey-700);
      }
      .btn-secondary:hover {
        background: var(--grey-50);
      }

      @media (max-width: 768px) {
        .section-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CostCenterFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private adminService = inject(AdministrationService);
  private errorHandler = inject(FormErrorHandlerService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  costCenterId?: string;
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  typeOptions: DropdownOption[] = [
    { label: 'Proyecto', value: 'Proyecto' },
    { label: 'Departamento', value: 'Departamento' },
    { label: 'Área', value: 'Área' },
    { label: 'Otro', value: 'Otro' },
  ];

  statusOptions: DropdownOption[] = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id === 'undefined' || id === 'NaN') {
      this.router.navigate(['/administracion/cost-centers']);
      return;
    }
    this.costCenterId = id;
    this.isEditMode = !!this.costCenterId;
    this.initForm();
    if (this.isEditMode) this.loadCostCenter();
  }

  initForm() {
    this.form = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      tipo: ['', Validators.required],
      is_active: [true, Validators.required], // Changed from isActive
      descripcion: [''],
    });
  }

  loadCostCenter() {
    if (!this.costCenterId) return;
    this.loading = true;
    this.adminService.getCostCenter(this.costCenterId).subscribe({
      next: (cc) => {
        this.form.patchValue(cc);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        console.error('Error loading cost center', err);
        // Only redirect on 404/permission errors if desired, otherwise show error
        // this.router.navigate(['/administracion/cost-centers']);
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.validationErrors = [];
    this.errorMessage = null;

    const req =
      this.isEditMode && this.costCenterId
        ? this.adminService.updateCostCenter(this.costCenterId, this.form.value)
        : this.adminService.createCostCenter(this.form.value);

    req.subscribe({
      next: () => {
        this.router.navigate(['/administracion/cost-centers']);
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        console.error('Error saving cost center', err);
      },
    });
  }

  onCancel() {
    this.router.navigate(['/administracion/cost-centers']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
