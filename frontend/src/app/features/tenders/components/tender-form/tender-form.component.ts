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
          <button class="btn btn-primary" (click)="onSubmit()" [disabled]="form.invalid || loading">
            <i class="fa-solid fa-save"></i>
            {{ isEditMode ? 'Guardar Cambios' : 'Crear Licitación' }}
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
                <label for="codigo">Código *</label>
                <input
                  id="codigo"
                  type="text"
                  formControlName="codigo"
                  class="form-control"
                  placeholder="Ej: LIC-2025-001"
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
                  placeholder="Nombre de la licitación"
                />
                <div class="error-msg" *ngIf="hasError('nombre')">Nombre es requerido</div>
              </div>

              <div class="form-group">
                <label for="entidadConvocante">Entidad Convocante *</label>
                <input
                  id="entidadConvocante"
                  type="text"
                  formControlName="entidadConvocante"
                  class="form-control"
                  placeholder="Entidad contratante"
                />
                <div class="error-msg" *ngIf="hasError('entidadConvocante')">
                  Entidad es requerida
                </div>
              </div>

              <div class="form-group">
                <label for="montoReferencial">Monto Referencial *</label>
                <input
                  id="montoReferencial"
                  type="number"
                  formControlName="montoReferencial"
                  class="form-control"
                  step="0.01"
                  placeholder="0.00"
                />
                <div class="error-msg" *ngIf="hasError('montoReferencial')">Monto es requerido</div>
              </div>
            </div>
          </div>

          <!-- Section 2: Dates & Status -->
          <div class="form-section full-width">
            <h3>Fechas y Estado</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="fechaConvocatoria">Fecha Convocatoria</label>
                <input
                  id="fechaConvocatoria"
                  type="date"
                  formControlName="fechaConvocatoria"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="fechaPresentacion">Fecha Presentación *</label>
                <input
                  id="fechaPresentacion"
                  type="date"
                  formControlName="fechaPresentacion"
                  class="form-control"
                />
                <div class="error-msg" *ngIf="hasError('fechaPresentacion')">
                  Fecha es requerida
                </div>
              </div>

              <div class="form-group">
                <label for="estado">Estado *</label>
                <select id="estado" formControlName="estado" class="form-select">
                  <option value="PUBLICADO">Publicado</option>
                  <option value="EVALUACION">En Evaluación</option>
                  <option value="ADJUDICADO">Adjudicado</option>
                  <option value="DESIERTO">Desierto</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
                <div class="error-msg" *ngIf="hasError('estado')">Estado es requerido</div>
              </div>

              <div class="form-group full-width">
                <label for="observaciones">Observaciones</label>
                <textarea
                  id="observaciones"
                  formControlName="observaciones"
                  class="form-control"
                  rows="3"
                  placeholder="Observaciones adicionales..."
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
      .title-group .subtitle {
        margin: 0.25rem 0 0 0;
        font-size: 14px;
        color: var(--grey-600);
      }
      .header-actions {
        display: flex;
        gap: 0.75rem;
      }

      /* Card */
      .card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .form-card {
        padding: 2rem;
      }

      /* Form Layout */
      .form-section {
        margin-bottom: 2rem;
      }
      .form-section:last-child {
        margin-bottom: 0;
      }
      .form-section h3 {
        margin: 0 0 1.5rem 0;
        font-size: 18px;
        color: var(--grey-900);
        font-weight: 600;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--grey-200);
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
      }
      .form-group label {
        font-size: 14px;
        font-weight: 500;
        color: var(--grey-700);
        margin-bottom: 0.5rem;
      }
      .form-control,
      .form-select {
        padding: 0.625rem 0.75rem;
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.2s;
      }
      .form-control:focus,
      .form-select:focus {
        outline: none;
        border-color: var(--primary-500);
      }
      .form-control.ng-invalid.ng-touched,
      .form-select.ng-invalid.ng-touched {
        border-color: var(--error-500);
      }
      .error-msg {
        color: var(--error-500);
        font-size: 13px;
        margin-top: 0.25rem;
      }
      textarea.form-control {
        resize: vertical;
        min-height: 80px;
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
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      entidadConvocante: ['', Validators.required],
      montoReferencial: ['', Validators.required],
      fechaConvocatoria: [''],
      fechaPresentacion: ['', Validators.required],
      estado: ['PUBLICADO', Validators.required],
      observaciones: [''],
    });
  }

  loadTender() {
    if (!this.tenderId) return;
    this.loading = true;
    this.tenderService.getTender(this.tenderId).subscribe({
      next: (tender) => {
        this.form.patchValue({
          codigo: tender.codigo,
          nombre: tender.nombre,
          entidadConvocante: tender.entidad_convocante,
          montoReferencial: tender.monto_referencial,
          fechaConvocatoria: tender.fecha_convocatoria,
          fechaPresentacion: tender.fecha_presentacion,
          estado: tender.estado,
          observaciones: tender.observaciones,
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        console.error('Error loading tender');
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const req =
      this.isEditMode && this.tenderId
        ? this.tenderService.updateTender(this.tenderId, this.form.value)
        : this.tenderService.createTender(this.form.value);

    req.subscribe({
      next: () => {
        this.router.navigate(['/licitaciones']);
      },
      error: () => {
        this.loading = false;
        console.error('Error saving tender');
      },
    });
  }

  onCancel() {
    this.router.navigate(['/licitaciones']);
  }

  hasError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
