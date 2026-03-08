import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdministrationService, Provider } from '../../services/administration.service';
import { FormContainerComponent } from '../../../../shared/components/form-container/form-container.component';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../../shared/components/dropdown/dropdown.component';
import { AeroDatePickerComponent } from '../../../../core/design-system';

@Component({
  selector: 'app-accounts-payable-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormContainerComponent,
    ValidationErrorsComponent,
    AlertComponent,
    DropdownComponent,
    AeroDatePickerComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Cuenta por Pagar' : 'Nueva Cuenta por Pagar'"
      [subtitle]="
        isEditMode ? 'Modificar detalles del documento' : 'Registrar nuevo documento por pagar'
      "
      icon="fa-file-invoice-dollar"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [disableSubmit]="apForm.invalid || loading"
      (submitted)="onSubmit()"
      (cancelled)="cancel()"
    >
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

      <form [formGroup]="apForm" (ngSubmit)="onSubmit()">
        <div class="form-section">
          <h2 class="section-title">Información del Documento</h2>

          <div class="form-grid">
            <div class="form-group">
              <label for="proveedor_id">Proveedor <span class="required">*</span></label>
              <app-dropdown
                formControlName="proveedor_id"
                [options]="providerOptions"
                [placeholder]="'Seleccione un proveedor'"
                [searchable]="true"
              ></app-dropdown>
              <div class="error-message" *ngIf="isFieldInvalid('proveedor_id')">
                El proveedor es requerido
              </div>
            </div>

            <div class="form-group">
              <label for="numero_factura">N° Documento <span class="required">*</span></label>
              <input
                id="numero_factura"
                type="text"
                formControlName="numero_factura"
                class="form-control"
                [class.error]="isFieldInvalid('numero_factura')"
                placeholder="Ej: F001-00123"
              />
              <div class="error-message" *ngIf="isFieldInvalid('numero_factura')">
                El número de documento es requerido
              </div>
            </div>

            <div class="form-group">
              <aero-date-picker
                [mode]="'single'"
                formControlName="fecha_emision"
                label="Fecha de Emisión"
                [required]="true"
                [state]="isFieldInvalid('fecha_emision') ? 'error' : 'default'"
                [error]="isFieldInvalid('fecha_emision') ? 'La fecha de emisión es requerida' : ''"
              ></aero-date-picker>
            </div>

            <div class="form-group">
              <aero-date-picker
                [mode]="'single'"
                formControlName="fecha_vencimiento"
                label="Fecha de Vencimiento"
                [required]="true"
                [state]="isFieldInvalid('fecha_vencimiento') ? 'error' : 'default'"
                [error]="
                  isFieldInvalid('fecha_vencimiento') ? 'La fecha de vencimiento es requerida' : ''
                "
              ></aero-date-picker>
            </div>

            <div class="form-group">
              <label for="monto_total">Monto <span class="required">*</span></label>
              <input
                id="monto_total"
                type="number"
                formControlName="monto_total"
                class="form-control"
                step="0.01"
                min="0"
                [class.error]="isFieldInvalid('monto_total')"
                placeholder="0.00"
              />
              <div class="error-message" *ngIf="isFieldInvalid('monto_total')">
                El monto es requerido
              </div>
            </div>

            <div class="form-group">
              <label for="moneda">Moneda <span class="required">*</span></label>
              <app-dropdown
                formControlName="moneda"
                [options]="currencyOptions"
                [placeholder]="'Seleccionar Moneda'"
              ></app-dropdown>
              <div class="error-message" *ngIf="isFieldInvalid('moneda')">
                La moneda es requerida
              </div>
            </div>
          </div>

          <div class="form-group full-width mt-4">
            <label for="observaciones">Descripción</label>
            <textarea
              id="observaciones"
              formControlName="observaciones"
              class="form-control"
              rows="3"
              placeholder="Ingrese una descripción opcional..."
            ></textarea>
          </div>
        </div>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      .mt-4 {
        margin-top: 1rem;
      }
      .error-message {
        color: var(--error-500);
        font-size: var(--type-tiny-size);
        margin-top: var(--s-4);
      }
      .form-control.error {
        border-color: var(--error-500);
      }
    `,
  ],
})
export class AccountsPayableFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdministrationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(FormErrorHandlerService);

  apForm: FormGroup;
  providers: Provider[] = [];
  loading = false;
  isEditMode = false;
  recordId?: number;
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  providerOptions: DropdownOption[] = [];
  currencyOptions: DropdownOption[] = [
    { label: 'Soles (PEN)', value: 'PEN' },
    { label: 'Dólares (USD)', value: 'USD' },
  ];

  breadcrumbs = [
    { label: 'Inicio', url: '/dashboard' },
    { label: 'Administración', url: '/administracion' },
    { label: 'Cuentas por Pagar', url: '/administracion/accounts-payable' },
    { label: 'Formulario' },
  ];

  constructor() {
    this.apForm = this.fb.group({
      proveedor_id: ['', Validators.required],
      numero_factura: ['', Validators.required],
      fecha_emision: ['', Validators.required],
      fecha_vencimiento: ['', Validators.required],
      monto_total: [0, [Validators.required, Validators.min(0.01)]],
      moneda: ['PEN', Validators.required],
      observaciones: [''],
    });
  }

  ngOnInit() {
    this.loadProviders();
    this.recordId = Number(this.route.snapshot.paramMap.get('id'));

    if (this.recordId) {
      this.isEditMode = true;
      this.loadRecord();
    }
  }

  loadProviders() {
    this.adminService.getProviders().subscribe({
      next: (providers) => {
        this.providers = providers;
        this.providerOptions = providers.map((p) => ({
          label: `${p.razonSocial} - ${p.ruc}`,
          value: p.id,
        }));
      },
      error: (err) => {
        console.error('Error loading providers:', err);
        this.errorMessage = 'Error al cargar proveedores';
      },
    });
  }

  loadRecord() {
    if (!this.recordId) return;

    this.loading = true;
    this.adminService.getAccountsPayableById(this.recordId).subscribe({
      next: (record) => {
        this.apForm.patchValue({
          proveedor_id: record.proveedor_id,
          numero_factura: record.numero_factura,
          fecha_emision: record.fecha_emision
            ? new Date(record.fecha_emision).toISOString().split('T')[0]
            : '',
          fecha_vencimiento: record.fecha_vencimiento
            ? new Date(record.fecha_vencimiento).toISOString().split('T')[0]
            : '',
          monto_total: record.monto_total,
          moneda: record.moneda,
          observaciones: record.observaciones,
        });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.apForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.apForm.invalid) {
      this.apForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    const formValue = this.apForm.getRawValue();

    // Convert numeric strings to numbers if needed
    const data = {
      ...formValue,
      proveedor_id: Number(formValue.proveedor_id),
      monto_total: Number(formValue.monto_total),
    };

    const operation =
      this.isEditMode && this.recordId
        ? this.adminService.updateAccountsPayable(this.recordId, data)
        : this.adminService.createAccountsPayable(data);

    operation.subscribe({
      next: () => {
        this.router.navigate(['/administracion/accounts-payable']);
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  cancel() {
    this.router.navigate(['/administracion/accounts-payable']);
  }
}
