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
import { FormContainerComponent } from '../../../../shared/components/form-container/form-container.component';

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
    FormContainerComponent,
  ],
  template: `
    <app-form-container
      [icon]="isEditMode ? 'fa-pen' : 'fa-file-circle-plus'"
      [title]="isEditMode ? 'Editar Documento' : 'Nuevo Documento'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del documento'
          : 'Registrar un nuevo documento en el sistema'
      "
      submitLabel="Guardar Documento"
      submitIcon="fa-save"
      [loading]="loading"
      [disableSubmit]="form.invalid || loading"
      (submitted)="onSubmit()"
      (cancelled)="onCancel()"
    >
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

      <form [formGroup]="form" class="form-grid">
        <!-- Section 1: Document Information -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fa-solid fa-file-lines"></i> Información del Documento
          </h3>
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
    </app-form-container>
  `,
  styles: [],
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
