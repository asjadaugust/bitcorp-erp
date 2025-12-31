import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TenderService } from '../../services/tender.service';

@Component({
  selector: 'app-tender-form',
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
            <h1>{{ isEditMode ? 'Editar Licitación' : 'Nueva Licitación' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información de la licitación'
                  : 'Registrar una nueva licitación en el sistema'
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
            <i class="fa-solid fa-save"></i> {{ isEditMode ? 'Guardar Cambios' : 'Crear Licitación' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="form" class="form-grid">
          <!-- Section 1: Basic Information -->
          <div class="form-section full-width">
            <h3>Información Básica</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="code">Código *</label>
                <input
                  id="code"
                  type="text"
                  formControlName="code"
                  class="form-control"
                  placeholder="Ej: LIC-2025-001"
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
                  placeholder="Nombre de la licitación"
                />
                <div class="error-msg" *ngIf="hasError('name')">Nombre es requerido</div>
              </div>

              <div class="form-group">
                <label for="entity">Entidad *</label>
                <input
                  id="entity"
                  type="text"
                  formControlName="entity"
                  class="form-control"
                  placeholder="Entidad contratante"
                />
                <div class="error-msg" *ngIf="hasError('entity')">Entidad es requerida</div>
              </div>

              <div class="form-group">
                <label for="type">Tipo *</label>
                <select id="type" formControlName="type" class="form-select">
                  <option value="">Seleccione...</option>
                  <option value="Pública">Pública</option>
                  <option value="Privada">Privada</option>
                  <option value="Concurso">Concurso</option>
                  <option value="Directa">Directa</option>
                </select>
                <div class="error-msg" *ngIf="hasError('type')">Tipo es requerido</div>
              </div>
            </div>
          </div>

          <!-- Section 2: Dates & Status -->
          <div class="form-section full-width">
            <h3>Fechas y Estado</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="publicationDate">Fecha Publicación *</label>
                <input
                  id="publicationDate"
                  type="date"
                  formControlName="publicationDate"
                  class="form-control"
                />
                <div class="error-msg" *ngIf="hasError('publicationDate')">Fecha es requerida</div>
              </div>

              <div class="form-group">
                <label for="submissionDeadline">Fecha Límite *</label>
                <input
                  id="submissionDeadline"
                  type="date"
                  formControlName="submissionDeadline"
                  class="form-control"
                />
                <div class="error-msg" *ngIf="hasError('submissionDeadline')">Fecha límite es requerida</div>
              </div>

              <div class="form-group">
                <label for="estimatedAmount">Valor Estimado *</label>
                <input
                  id="estimatedAmount"
                  type="number"
                  formControlName="estimatedAmount"
                  class="form-control"
                  step="0.01"
                  placeholder="0.00"
                />
                <div class="error-msg" *ngIf="hasError('estimatedAmount')">Valor es requerido</div>
              </div>

              <div class="form-group">
                <label for="status">Estado *</label>
                <select id="status" formControlName="status" class="form-select">
                  <option value="Abierta">Abierta</option>
                  <option value="En Evaluación">En Evaluación</option>
                  <option value="Adjudicada">Adjudicada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
                <div class="error-msg" *ngIf="hasError('status')">Estado es requerido</div>
              </div>

              <div class="form-group full-width">
                <label for="description">Descripción</label>
                <textarea
                  id="description"
                  formControlName="description"
                  class="form-control"
                  rows="3"
                  placeholder="Descripción adicional..."
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
export class TenderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tenderService = inject(TenderService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  tenderId?: string;

  ngOnInit() {
    this.tenderId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.tenderId;
    this.initForm();
    if (this.isEditMode) this.loadTender();
  }

  initForm() {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      entity: ['', Validators.required],
      type: ['', Validators.required],
      publicationDate: ['', Validators.required],
      submissionDeadline: ['', Validators.required],
      awardDate: [''],
      status: ['Abierta', Validators.required],
      estimatedAmount: ['', Validators.required],
      currency: ['PEN'],
      description: ['']
    });
  }

  loadTender() {
    if (!this.tenderId) return;
    this.loading = true;
    this.tenderService.getTender(this.tenderId).subscribe({
      next: (tender) => {
        this.form.patchValue(tender);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        console.error('Error loading tender');
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const req = this.isEditMode && this.tenderId
      ? this.tenderService.updateTender(this.tenderId, this.form.value)
      : this.tenderService.createTender(this.form.value);
    
    req.subscribe({
      next: () => {
        this.router.navigate(['/licitaciones']);
      },
      error: () => {
        this.loading = false;
        console.error('Error saving tender');
      }
    });
  }

  onCancel() {
    this.router.navigate(['/licitaciones']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
