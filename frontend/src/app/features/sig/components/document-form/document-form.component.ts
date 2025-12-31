import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { SigService } from '../../services/sig.service';

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-container">
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
          <button
            class="btn btn-primary"
            (click)="onSubmit()"
            [disabled]="form.invalid || loading"
          >
            <i class="fa-solid fa-save"></i> {{ isEditMode ? 'Guardar Cambios' : 'Crear Documento' }}
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
                <label for="code">Código *</label>
                <input
                  id="code"
                  type="text"
                  formControlName="code"
                  class="form-control"
                  placeholder="ej. SIG-PROC-001"
                />
                <div class="error-msg" *ngIf="hasError('code')">Código es requerido</div>
              </div>

              <div class="form-group">
                <label for="name">Nombre *</label>
                <input
                  id="name"
                  type="text"
                  formControlName="name"
                  class="form-control"
                  placeholder="Nombre del documento"
                />
                <div class="error-msg" *ngIf="hasError('name')">Nombre es requerido</div>
              </div>

              <div class="form-group">
                <label for="type">Tipo *</label>
                <select id="type" formControlName="type" class="form-select">
                  <option value="">Seleccione...</option>
                  <option value="Procedimiento">Procedimiento</option>
                  <option value="Instructivo">Instructivo</option>
                  <option value="Formato">Formato</option>
                  <option value="Política">Política</option>
                  <option value="Manual">Manual</option>
                </select>
                <div class="error-msg" *ngIf="hasError('type')">Tipo es requerido</div>
              </div>

              <div class="form-group">
                <label for="isoStandard">Norma ISO *</label>
                <select id="isoStandard" formControlName="isoStandard" class="form-select">
                  <option value="">Seleccione...</option>
                  <option value="ISO 9001">ISO 9001 - Calidad</option>
                  <option value="ISO 14001">ISO 14001 - Ambiental</option>
                  <option value="ISO 45001">ISO 45001 - SST</option>
                </select>
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
                <label for="effectiveDate">Fecha Vigencia *</label>
                <input
                  id="effectiveDate"
                  type="date"
                  formControlName="effectiveDate"
                  class="form-control"
                />
                <div class="error-msg" *ngIf="hasError('effectiveDate')">Fecha es requerida</div>
              </div>

              <div class="form-group full-width">
                <label for="description">Descripción</label>
                <textarea
                  id="description"
                  formControlName="description"
                  class="form-control"
                  rows="3"
                  placeholder="Descripción breve del documento..."
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
export class DocumentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sigService = inject(SigService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  documentId?: string;

  ngOnInit() {
    this.documentId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.documentId;
    this.initForm();
    if (this.isEditMode) this.loadDocument();
  }

  initForm() {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      type: ['', Validators.required],
      isoStandard: ['', Validators.required],
      version: ['1.0', Validators.required],
      effectiveDate: ['', Validators.required],
      description: ['']
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
      error: () => {
        this.loading = false;
        // In a real app, show a toast
        console.error('Error loading document');
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const req = this.isEditMode && this.documentId
      ? this.sigService.updateDocument(this.documentId, this.form.value)
      : this.sigService.createDocument(this.form.value);
    
    req.subscribe({
      next: () => {
        this.router.navigate(['/sig']);
      },
      error: () => {
        this.loading = false;
        console.error('Error saving document');
      }
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
