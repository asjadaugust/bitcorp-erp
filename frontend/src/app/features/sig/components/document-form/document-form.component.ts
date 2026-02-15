import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { SigService } from '../../services/sig.service';
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

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ValidationErrorsComponent,
    AlertComponent,
    DropdownComponent,
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
            <h1>{{ isEditMode ? 'Editar Documento' : 'Nuevo Documento' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información del documento'
                  : 'Registrar un nuevo documento en el sistema'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="onCancel()">Cancelar</button>
          <button class="btn btn-primary" (click)="onSubmit()" [disabled]="form.invalid || loading">
            <i class="fa-solid fa-save"></i>
            {{ isEditMode ? 'Guardar Cambios' : 'Crear Documento' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="form" class="form-grid">
          <!-- Section 1: Document Information -->
          <div class="form-section full-width">
            <h3>Información del Documento</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="codigo">Código *</label>
                <input
                  id="codigo"
                  type="text"
                  formControlName="codigo"
                  class="form-control"
                  placeholder="ej. SIG-PROC-001"
                />
                <div class="error-msg" *ngIf="hasError('codigo')">Código es requerido</div>
              </div>

              <div class="form-group">
                <label for="titulo">Título *</label>
                <input
                  id="titulo"
                  type="text"
                  formControlName="titulo"
                  class="form-control"
                  placeholder="Título del documento"
                />
                <div class="error-msg" *ngIf="hasError('titulo')">Título es requerido</div>
              </div>

              <div class="form-group">
                <label for="tipoDocumento">Tipo *</label>
                <app-dropdown
                  formControlName="tipoDocumento"
                  [options]="documentTypeOptions"
                  [placeholder]="'Seleccione...'"
                  [error]="hasError('tipoDocumento')"
                ></app-dropdown>
                <div class="error-msg" *ngIf="hasError('tipoDocumento')">Tipo es requerido</div>
              </div>

              <div class="form-group">
                <label for="isoStandard">Norma ISO *</label>
                <app-dropdown
                  formControlName="isoStandard"
                  [options]="isoStandardOptions"
                  [placeholder]="'Seleccione...'"
                  [error]="hasError('isoStandard')"
                ></app-dropdown>
                <div class="error-msg" *ngIf="hasError('isoStandard')">Norma ISO es requerida</div>
              </div>

              <div class="form-group">
                <label for="version">Versión *</label>
                <input
                  id="version"
                  type="text"
                  formControlName="version"
                  class="form-control"
                  placeholder="1.0"
                />
                <div class="error-msg" *ngIf="hasError('version')">Versión es requerida</div>
              </div>

              <div class="form-group">
                <label for="fechaEmision">Fecha Emisión *</label>
                <input
                  id="fechaEmision"
                  type="date"
                  formControlName="fechaEmision"
                  class="form-control"
                />
                <div class="error-msg" *ngIf="hasError('fechaEmision')">Fecha es requerida</div>
              </div>

              <div class="form-group full-width">
                <label for="archivoUrl">URL del Archivo</label>
                <input
                  id="archivoUrl"
                  type="text"
                  formControlName="archivoUrl"
                  class="form-control"
                  placeholder="URL del documento..."
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
export class DocumentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sigService = inject(SigService);
  private errorHandler = inject(FormErrorHandlerService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  documentId?: string;
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  documentTypeOptions: DropdownOption[] = [
    { label: 'Procedimiento', value: 'Procedimiento' },
    { label: 'Instructivo', value: 'Instructivo' },
    { label: 'Formato', value: 'Formato' },
    { label: 'Política', value: 'Política' },
    { label: 'Manual', value: 'Manual' },
  ];

  isoStandardOptions: DropdownOption[] = [
    { label: 'ISO 9001 - Calidad', value: 'ISO 9001' },
    { label: 'ISO 14001 - Ambiental', value: 'ISO 14001' },
    { label: 'ISO 45001 - SST', value: 'ISO 45001' },
  ];

  ngOnInit() {
    this.documentId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.documentId;
    this.initForm();
    if (this.isEditMode) this.loadDocument();
  }

  initForm() {
    this.form = this.fb.group({
      codigo: ['', Validators.required],
      titulo: ['', Validators.required],
      tipoDocumento: ['', Validators.required],
      isoStandard: ['', Validators.required],
      version: ['1.0', Validators.required],
      fechaEmision: ['', Validators.required],
      archivoUrl: [''],
    });
  }

  loadDocument() {
    if (!this.documentId) return;
    this.loading = true;
    this.sigService.getDocument(this.documentId).subscribe({
      next: (doc) => {
        this.form.patchValue(doc);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        console.error('Error loading document', err);
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
      this.isEditMode && this.documentId
        ? this.sigService.updateDocument(this.documentId, this.form.value)
        : this.sigService.createDocument(this.form.value);

    req.subscribe({
      next: () => {
        this.router.navigate(['/sig']);
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        console.error('Error saving document', err);
      },
    });
  }

  onCancel() {
    this.router.navigate(['/sig']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
