import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProviderService } from '../../core/services/provider.service';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ProviderLogComponent } from './components/provider-log.component';
import { ProviderContactsComponent } from './components/provider-contacts.component';
import { ProviderFinancialInfoComponent } from './components/provider-financial-info.component';
import { ProviderDocumentsComponent } from './components/provider-documents.component';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-provider-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ValidationErrorsComponent,
    AlertComponent,
    ProviderLogComponent,
    ProviderContactsComponent,
    ProviderFinancialInfoComponent,
    ProviderDocumentsComponent,
    FormContainerComponent,
    DropdownComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del proveedor'
          : 'Registrar un nuevo proveedor en el sistema'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-building'"
      [loading]="loading"
      [disableSubmit]="providerForm.invalid || loading"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Proveedor'"
      (onSubmit)="onSubmit()"
      (onCancel)="cancel()"
    >
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

      <form [formGroup]="providerForm" class="form-grid">
        <!-- Section 1: Basic Information -->
        <div class="form-section full-width">
          <h3 class="section-title"><i class="fa-solid fa-building"></i> Información Básica</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="ruc">RUC *</label>
              <div class="input-with-button">
                <input
                  id="ruc"
                  type="text"
                  formControlName="ruc"
                  class="form-control"
                  placeholder="ej. 20123456789"
                  maxlength="11"
                />
                <button
                  type="button"
                  class="btn btn-secondary btn-icon"
                  (click)="lookupRuc()"
                  [disabled]="loading || providerForm.get('ruc')?.invalid"
                  title="Buscar RUC en SUNAT"
                >
                  <i class="fa-solid fa-magnifying-glass"></i>
                </button>
              </div>
              <div class="error-msg" *ngIf="hasError('ruc')">
                <span *ngIf="providerForm.get('ruc')?.hasError('required')">RUC es requerido</span>
                <span
                  *ngIf="
                    providerForm.get('ruc')?.hasError('minlength') ||
                    providerForm.get('ruc')?.hasError('maxlength')
                  "
                  >RUC debe tener 11 dígitos</span
                >
              </div>
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
              <app-dropdown
                formControlName="tipo_proveedor"
                [options]="providerTypeOptions"
                [placeholder]="'Seleccionar...'"
              ></app-dropdown>
            </div>

            <div class="form-group">
              <label for="is_active">Estado</label>
              <app-dropdown
                formControlName="is_active"
                [options]="statusOptions"
                [placeholder]="'Seleccionar...'"
              ></app-dropdown>
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

            <div class="form-group">
              <label for="nombre_comercial">Nombre Comercial</label>
              <input
                id="nombre_comercial"
                type="text"
                formControlName="nombre_comercial"
                class="form-control"
                placeholder="ej. Servicios ACME"
              />
            </div>

            <div class="form-group">
              <label for="telefono">Teléfono</label>
              <input
                id="telefono"
                type="text"
                formControlName="telefono"
                class="form-control"
                placeholder="ej. 987654321"
              />
            </div>

            <div class="form-group">
              <label for="correo_electronico">Correo Electrónico</label>
              <input
                id="correo_electronico"
                type="email"
                formControlName="correo_electronico"
                class="form-control"
                placeholder="ej. contacto@proveedor.com"
              />
            </div>

            <div class="form-group">
              <label for="estado_contribuyente">Estado del Contribuyente</label>
              <input
                id="estado_contribuyente"
                type="text"
                formControlName="estado_contribuyente"
                class="form-control"
                readonly
                placeholder="Autocompletado desde SUNAT"
              />
            </div>

            <div class="form-group">
              <label for="condicion_contribuyente">Condición del Contribuyente</label>
              <input
                id="condicion_contribuyente"
                type="text"
                formControlName="condicion_contribuyente"
                class="form-control"
                readonly
                placeholder="Autocompletado desde SUNAT"
              />
            </div>
          </div>
        </div>

        <!-- Additional Information Sections (BIT-12, Contacts, Financial) -->
        <div class="form-section full-width" *ngIf="isEditMode && providerId">
          <div class="tabs-container">
            <div class="tabs-header">
              <button
                type="button"
                class="tab-link"
                [class.active]="activeTab === 'contacts'"
                (click)="activeTab = 'contacts'"
              >
                <i class="fa-solid fa-address-book"></i> Contactos
              </button>
              <button
                type="button"
                class="tab-link"
                [class.active]="activeTab === 'financial'"
                (click)="activeTab = 'financial'"
              >
                <i class="fa-solid fa-building-columns"></i> Inf. Financiera
              </button>
              <button
                type="button"
                class="tab-link"
                [class.active]="activeTab === 'documents'"
                (click)="activeTab = 'documents'"
              >
                <i class="fa-solid fa-file-invoice"></i> Documentos
              </button>
              <button
                type="button"
                class="tab-link"
                [class.active]="activeTab === 'logs'"
                (click)="activeTab = 'logs'"
              >
                <i class="fa-solid fa-history"></i> Historial
              </button>
            </div>

            <div class="tab-pane">
              <app-provider-contacts
                *ngIf="activeTab === 'contacts'"
                [providerId]="providerId"
              ></app-provider-contacts>
              <app-provider-financial-info
                *ngIf="activeTab === 'financial'"
                [providerId]="providerId"
              ></app-provider-financial-info>
              <app-provider-documents
                *ngIf="activeTab === 'documents'"
                [providerId]="providerId"
              ></app-provider-documents>
              <app-provider-log
                *ngIf="activeTab === 'logs'"
                [providerId]="providerId"
              ></app-provider-log>
            </div>
          </div>
        </div>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      .input-with-button {
        display: flex;
        gap: 0.5rem;
      }
      .input-with-button .form-control {
        flex: 1;
      }

      /* Tabs */
      .tabs-container {
        margin-top: 1rem;
        border: 1px solid var(--grey-200);
        border-radius: 8px;
        overflow: hidden;
      }
      .tabs-header {
        display: flex;
        background: var(--grey-50);
        border-bottom: 1px solid var(--grey-200);
        overflow-x: auto;
      }
      .tab-link {
        padding: 1rem 1.5rem;
        border: none;
        background: none;
        font-size: 14px;
        font-weight: 500;
        color: var(--grey-600);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
      }
      .tab-link:hover {
        background: var(--grey-100);
        color: var(--primary-600);
      }
      .tab-link.active {
        color: var(--primary-600);
        border-bottom-color: var(--primary-600);
        background: white;
      }
      .tab-pane {
        padding: 1.5rem;
        background: white;
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
  activeTab: 'contacts' | 'financial' | 'documents' | 'logs' = 'contacts';

  providerTypeOptions: DropdownOption[] = [
    { label: 'Equipos', value: 'EQUIPOS' },
    { label: 'Servicios', value: 'SERVICIOS' },
    { label: 'Suministros / Combustible', value: 'MATERIALES' },
    { label: 'Mixto / Otro', value: 'MIXTO' },
  ];

  statusOptions: DropdownOption[] = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

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
    estado_contribuyente: 'Estado del Contribuyente',
    condicion_contribuyente: 'Condición del Contribuyente',
  };

  constructor() {
    this.providerForm = this.fb.group({
      ruc: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      razon_social: ['', Validators.required],
      tipo_proveedor: ['', Validators.required],
      is_active: [true, Validators.required],
      direccion: [''],
      nombre_comercial: [''],
      telefono: [''],
      correo_electronico: ['', Validators.email],
      estado_contribuyente: [''],
      condicion_contribuyente: [''],
    });
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
          ruc: provider['ruc'],
          razon_social: provider['razon_social'],
          tipo_proveedor: provider['tipo_proveedor'] || '',
          is_active: provider['is_active'],
          direccion: provider['direccion'] || '',
          nombre_comercial: provider['nombre_comercial'] || '',
          telefono: provider['telefono'] || '',
          correo_electronico: provider['correo_electronico'] || '',
          estado_contribuyente: provider['estado_contribuyente'] || '',
          condicion_contribuyente: provider['condicion_contribuyente'] || '',
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
      next: (_response: unknown) => {
        this.loading = false;
        this.successMessage = this.isEditMode
          ? 'Proveedor actualizado exitosamente'
          : 'Proveedor creado exitosamente';

        // If creating, the response should include the new ID
        // We could redirect to edit mode with the new ID, but for now just go back
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

  lookupRuc(): void {
    const ruc = this.providerForm.get('ruc')?.value;
    if (!ruc || ruc.length !== 11) return;

    this.loading = true;
    this.errorMessage = '';
    this.providerService.lookupRuc(ruc).subscribe({
      next: (data: any) => {
        this.loading = false;
        if (data) {
          this.providerForm.patchValue({
            razon_social: data['razon_social'],
            nombre_comercial: data['nombre_comercial'] || '',
            direccion: data['direccion'] || '',
            estado_contribuyente: data['estado_contribuyente'] || '',
            condicion_contribuyente: data['condicion_contribuyente'] || '',
          });
          this.successMessage = 'Datos del RUC recuperados exitosamente';
        }
      },
      error: (_err) => {
        this.loading = false;
        this.errorMessage = 'No se pudo encontrar información para el RUC proporcionado';
      },
    });
  }
}
