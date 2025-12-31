import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectService } from '../../../../core/services/project.service';

@Component({
  selector: 'app-project-form',
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
            <h1>{{ isEditMode ? 'Editar Proyecto' : 'Nuevo Proyecto' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información del proyecto'
                  : 'Registrar un nuevo proyecto en el sistema'
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
            <i class="fa-solid fa-save"></i> {{ isEditMode ? 'Guardar Cambios' : 'Crear Proyecto' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="form" class="form-grid">
          <!-- Section 1: Basic Information -->
          <div class="form-section full-width">
            <h3>Información General</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="code">Código *</label>
                <input
                  id="code"
                  type="text"
                  formControlName="code"
                  class="form-control"
                  placeholder="Ej: PRJ-2025-001"
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
                  placeholder="Nombre del proyecto"
                />
                <div class="error-msg" *ngIf="hasError('name')">Nombre es requerido</div>
              </div>

              <div class="form-group">
                <label for="client">Cliente *</label>
                <input
                  id="client"
                  type="text"
                  formControlName="client"
                  class="form-control"
                  placeholder="Cliente"
                />
                <div class="error-msg" *ngIf="hasError('client')">Cliente es requerido</div>
              </div>

              <div class="form-group">
                <label for="status">Estado *</label>
                <select id="status" formControlName="status" class="form-select">
                  <option value="Planificación">Planificación</option>
                  <option value="En Ejecución">En Ejecución</option>
                  <option value="Suspendido">Suspendido</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
                <div class="error-msg" *ngIf="hasError('status')">Estado es requerido</div>
              </div>
            </div>
          </div>

          <!-- Section 2: Dates & Location -->
          <div class="form-section full-width">
            <h3>Fechas y Ubicación</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="startDate">Fecha Inicio *</label>
                <input
                  id="startDate"
                  type="date"
                  formControlName="startDate"
                  class="form-control"
                />
                <div class="error-msg" *ngIf="hasError('startDate')">Fecha inicio es requerida</div>
              </div>

              <div class="form-group">
                <label for="endDate">Fecha Fin Estimada *</label>
                <input
                  id="endDate"
                  type="date"
                  formControlName="endDate"
                  class="form-control"
                />
                <div class="error-msg" *ngIf="hasError('endDate')">Fecha fin es requerida</div>
              </div>

              <div class="form-group full-width">
                <label for="location">Ubicación *</label>
                <input
                  id="location"
                  type="text"
                  formControlName="location"
                  class="form-control"
                  placeholder="Dirección o ubicación del proyecto"
                />
                <div class="error-msg" *ngIf="hasError('location')">Ubicación es requerida</div>
              </div>
            </div>
          </div>

          <!-- Section 3: Budget -->
          <div class="form-section full-width">
            <h3>Presupuesto</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="budget">Presupuesto Total *</label>
                <input
                  id="budget"
                  type="number"
                  formControlName="budget"
                  class="form-control"
                  step="0.01"
                  placeholder="0.00"
                />
                <div class="error-msg" *ngIf="hasError('budget')">Presupuesto es requerido</div>
              </div>

              <div class="form-group">
                <label for="currency">Moneda *</label>
                <select id="currency" formControlName="currency" class="form-select">
                  <option value="PEN">Soles (PEN)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>

              <div class="form-group full-width">
                <label for="description">Descripción</label>
                <textarea
                  id="description"
                  formControlName="description"
                  class="form-control"
                  rows="3"
                  placeholder="Descripción del proyecto..."
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
export class ProjectFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  projectId?: string;

  ngOnInit() {
    this.projectId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.projectId;
    this.initForm();
    if (this.isEditMode) this.loadProject();
  }

  initForm() {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      client: ['', Validators.required],
      status: ['Planificación', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      location: ['', Validators.required],
      budget: ['', Validators.required],
      currency: ['PEN', Validators.required],
      description: ['']
    });
  }

  loadProject() {
    if (!this.projectId) return;
    this.loading = true;
    this.projectService.getById(this.projectId).subscribe({
      next: (project: any) => {
        this.form.patchValue(project);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        console.error('Error loading project');
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const req = this.isEditMode && this.projectId
      ? this.projectService.update(this.projectId, this.form.value)
      : this.projectService.create(this.form.value);
    
    req.subscribe({
      next: () => {
        this.router.navigate(['/operaciones/projects']);
      },
      error: () => {
        this.loading = false;
        console.error('Error saving project');
      }
    });
  }

  onCancel() {
    this.router.navigate(['/operaciones/projects']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
