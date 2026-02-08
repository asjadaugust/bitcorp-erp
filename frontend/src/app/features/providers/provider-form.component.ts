import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProviderService } from '../../core/services/provider.service';
import { Provider } from '../../core/models/provider.model';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';

@Component({
  selector: 'app-provider-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ValidationErrorsComponent,
    AlertComponent,
  ],
  template: `
    <div class="form-container">
      <!-- Validation Errors and Alerts -->
      <app-validation-errors
        *ngIf="validationErrors.length > 0"
        [errors]="validationErrors"
        [fieldLabels]="fieldLabels"
      >
      </app-validation-errors>

      <app-alert *ngIf="errorMessage" type="error" [message]="errorMessage" [dismissible]="true">
      </app-alert>

      <app-alert
        *ngIf="successMessage"
        type="success"
        [message]="successMessage"
        [dismissible]="true"
        [autoDismiss]="true"
        [autoDismissDelay]="1500"
      >
      </app-alert>

      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fa-solid" [class.fa-plus]="!isEditMode" [class.fa-pen]="isEditMode"></i>
          </div>
          <div class="title-group">
            <h1>{{ isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información del proveedor'
                  : 'Registrar un nuevo proveedor en el sistema'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="onSubmit()"
            [disabled]="providerForm.invalid || loading"
          >
            <i *ngIf="loading" class="fa-solid fa-spinner fa-spin"></i>
            <i *ngIf="!loading" class="fa-solid fa-save"></i>
            {{ isEditMode ? 'Guardar Cambios' : 'Crear Proveedor' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="providerForm" class="form-grid">
          <!-- Section 1: Basic Information -->
          <div class="form-section full-width">
            <h3>Información Básica</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="ruc">RUC *</label>
                <input
                  id="ruc"
                  type="text"
                  formControlName="ruc"
                  class="form-control"
                  placeholder="ej. 20123456789"
                  maxlength="11"
                />
                <div class="error-msg" *ngIf="hasError('ruc')">RUC es requerido (11 dígitos)</div>
              </div>

              <div class="form-group">
                <label for="razon_social">Razón Social *</label>
                <input
                  id="razon_social"
                  type="text"
                  formControlName="razon_social"
                  class="form-control"
                  placeholder="ej. Servicios Generales S.A.C."
                />
                <div class="error-msg" *ngIf="hasError('razon_social')">
                  Razón Social es requerida
                </div>
              </div>

              <div class="form-group">
                <label for="tipo_proveedor">Tipo de Proveedor</label>
                <select id="tipo_proveedor" formControlName="tipo_proveedor" class="form-select">
                  <option value="">Seleccionar...</option>
                  <option value="equipment">Equipos</option>
                  <option value="services">Servicios</option>
                  <option value="supplies">Suministros</option>
                  <option value="fuel">Combustible</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div class="form-group">
                <label for="isActive">Estado</label>
                <select id="isActive" formControlName="isActive" class="form-select">
                  <option [ngValue]="true">Activo</option>
                  <option [ngValue]="false">Inactivo</option>
                </select>
              </div>

              <div class="form-group">
                <label for="direccion">Dirección</label>
                <input
                  id="direccion"
                  type="text"
                  formControlName="direccion"
                  class="form-control"
                  placeholder="ej. Av. Principal 123, Lima"
                />
              </div>
            </div>
          </div>

          <!-- Sections 2 & 3 removed as not supported by backend entity -->
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

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .section-header h3 {
        margin: 0;
        border: none;
        padding: 0;
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

      /* Data Table */
      .table-container {
        overflow-x: auto;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }

      .data-table th,
      .data-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--grey-200);
      }

      .data-table th {
        background: var(--grey-50);
        font-weight: 600;
        color: var(--grey-700);
        font-size: 12px;
        text-transform: uppercase;
      }

      .data-table td .form-control {
        padding: 0.5rem;
        font-size: 13px;
      }

      .empty-row {
        text-align: center;
        color: var(--grey-500);
        font-style: italic;
        padding: 1.5rem !important;
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

      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 12px;
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

      .btn-icon {
        padding: 0.5rem;
        min-width: auto;
      }

      .btn-danger {
        background: var(--semantic-red-50);
        color: var(--semantic-red-600);
        border: 1px solid var(--semantic-red-200);
      }
      .btn-danger:hover {
        background: var(--semantic-red-100);
      }

      @media (max-width: 768px) {
        .section-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ProviderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private providerService = inject(ProviderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(FormErrorHandlerService);

  providerForm: FormGroup;
  isEditMode = false;
  loading = false;
  providerId: string | null = null;
  validationErrors: ValidationError[] = [];
  errorMessage = '';
  successMessage = '';

  fieldLabels: Record<string, string> = {
    ruc: 'RUC',
    razon_social: 'Razón Social',
    tipo_proveedor: 'Tipo de Proveedor',
    isActive: 'Estado',
    direccion: 'Dirección',
    correo_electronico: 'Correo Electrónico',
    telefono: 'Teléfono',
    nombre_comercial: 'Nombre Comercial',
    sitio_web: 'Sitio Web',
  };

  constructor() {
    this.providerForm = this.fb.group({
      ruc: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      razon_social: ['', Validators.required],
      tipo_proveedor: [''],
      isActive: [true, Validators.required],
      direccion: [''],
      // bank_accounts: this.fb.array([]),
      // contacts: this.fb.array([]),
    });
  }

  get bankAccountsArray(): FormArray {
    return this.providerForm.get('bank_accounts') as FormArray;
  }

  get contactsArray(): FormArray {
    return this.providerForm.get('contacts') as FormArray;
  }

  addBankAccount(): void {
    const accountGroup = this.fb.group({
      bank_name: [''],
      account_number: [''],
      cci: [''],
      account_name: [''],
    });
    this.bankAccountsArray.push(accountGroup);
  }

  removeBankAccount(index: number): void {
    this.bankAccountsArray.removeAt(index);
  }

  addContact(): void {
    const contactGroup = this.fb.group({
      name: [''],
      position: [''],
      phone: [''],
      email: [''],
    });
    this.contactsArray.push(contactGroup);
  }

  removeContact(index: number): void {
    this.contactsArray.removeAt(index);
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id && id !== 'undefined' && id !== 'NaN') {
        this.isEditMode = true;
        this.providerId = id;
        this.loadProvider(id); // Use id directly instead of providerId
      } else if (id === 'undefined' || id === 'NaN') {
        this.router.navigate(['/providers']);
      }
    });
  }

  loadProvider(id: string | number): void {
    this.loading = true;
    this.providerService.getById(id).subscribe({
      next: (provider: any) => {
        this.providerForm.patchValue({
          ruc: provider.ruc,
          razon_social: provider.razon_social,
          tipo_proveedor: provider.tipo_proveedor || '',
          isActive: provider.is_active,
          direccion: provider.direccion || '',
        });

        // Bank accounts and contacts removed from form load as mapped to entity props not supported

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading provider', err);
        this.loading = false;
        this.router.navigate(['/providers']);
      },
    });
  }

  onSubmit(): void {
    if (this.providerForm.invalid) {
      this.providerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.validationErrors = [];
    this.errorMessage = '';
    this.successMessage = '';

    const providerData = this.providerForm.value;

    const request$ =
      this.isEditMode && this.providerId
        ? this.providerService.update(this.providerId, providerData)
        : this.providerService.create(providerData);

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.isEditMode
          ? 'Proveedor actualizado exitosamente'
          : 'Proveedor creado exitosamente';

        setTimeout(() => {
          this.router.navigate(['/providers']);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/providers']);
  }

  hasError(field: string): boolean {
    const control = this.providerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
