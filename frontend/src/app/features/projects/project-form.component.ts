import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';


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
                  : 'Registrar nuevo proyecto en el sistema'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()"> Cancelar
        </button>
          <button type="button" class="btn btn-primary" (click)="onSubmit()" [disabled]="projectForm.invalid || loading">
          <i *ngIf="loading" class="fa-solid fa-spinner fa-spin"></i>
          <i *ngIf="!loading" class="fa-solid fa-save"></i>
        </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="projectForm" class="form-grid">
          <!-- Section 1: Basic Information -->
          <div class="form-section full-width">
            <h3>Información Básica</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="codigo">Código del Proyecto *</label>
                <input
                  id="codigo"
                  type="text"
                  formControlName="codigo"
                  class="form-control"
                  placeholder="ej. PRJ-2025-001"
                />
                <div class="error-msg" *ngIf="hasError('codigo')">Código es requerido</div>
              </div>

              <div class="form-group">
                <label for="estado">Estado *</label>
                <select id="estado" formControlName="estado" class="form-select">
                  <option value="ACTIVO">Activo</option>
                  <option value="COMPLETADO">Completado</option>
                  <option value="PAUSADO">En Pausa</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>

              <div class="form-group full-width-inner">
                <label for="nombre">Nombre del Proyecto *</label>
                <input
                  id="nombre"
                  type="text"
                  formControlName="nombre"
                  class="form-control"
                  placeholder="ej. Construcción de Carretera Panamericana"
                />
                <div class="error-msg" *ngIf="hasError('nombre')">Nombre es requerido</div>
              </div>

              <div class="form-group full-width-inner">
                <label for="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  formControlName="descripcion"
                  class="form-control"
                  rows="3"
                  placeholder="Descripción detallada del proyecto..."
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Section 2: Location & Client -->
          <div class="form-section full-width">
            <h3>Ubicación y Cliente</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="cliente">Cliente</label>
                <input
                  id="cliente"
                  type="text"
                  formControlName="cliente"
                  class="form-control"
                  placeholder="ej. Ministerio de Transportes"
                />
              </div>

              <div class="form-group">
                <label for="ubicacion">Ubicación</label>
                <input
                  id="ubicacion"
                  type="text"
                  formControlName="ubicacion"
                  class="form-control"
                  placeholder="ej. Carretera Panamericana Km 125, Ancash"
                />
              </div>
            </div>
          </div>

          <!-- Section 3: Dates & Budget -->
          <div class="form-section full-width">
            <h3>Fechas y Presupuesto</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="fechaInicio">Fecha de Inicio</label>
                <input
                  id="fechaInicio"
                  type="date"
                  formControlName="fechaInicio"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="fechaFin">Fecha de Fin Estimada</label>
                <input
                  id="fechaFin"
                  type="date"
                  formControlName="fechaFin"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="presupuesto">Presupuesto Total (S/)</label>
                <input
                  id="presupuesto"
                  type="number"
                  formControlName="presupuesto"
                  class="form-control"
                  placeholder="0.00"
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

      .full-width-inner {
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

      textarea.form-control {
        resize: vertical;
        min-height: 80px;
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
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  projectForm: FormGroup;
  isEditMode = false;
  loading = false;
  projectId: string | null = null;

  constructor() {
    this.projectForm = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: [''],
      ubicacion: [''],
      fechaInicio: [''],
      fechaFin: [''],
      estado: ['ACTIVO', Validators.required],
      presupuesto: [null],
      cliente: [''],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.projectId = params['id'];
        if (this.projectId) {
          this.loadProject(this.projectId);
        }
      }
    });
  }

  loadProject(id: string): void {
    this.loading = true;
    this.projectService.getById(id).subscribe({
      next: (project) => {
        // Format dates
        const formatDate = (dateStr: string) => (dateStr ? dateStr.split('T')[0] : '');

        this.projectForm.patchValue({
          ...project,
          fechaInicio: project.fechaInicio ? formatDate(project.fechaInicio.toString()) : '',
          fechaFin: project.fechaFin ? formatDate(project.fechaFin.toString()) : '',
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading project', err);
        this.loading = false;
        this.router.navigate(['/projects']);
      },
    });
  }

  onSubmit(): void {
    if (this.projectForm.invalid) return;

    this.loading = true;
    const projectData = this.projectForm.value;

    const request$ =
      this.isEditMode && this.projectId
        ? this.projectService.update(this.projectId, projectData)
        : this.projectService.create(projectData);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        console.error('Error saving project', err);
        this.loading = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/projects']);
  }

  hasError(field: string): boolean {
    const control = this.projectForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
