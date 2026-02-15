import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { ValidationErrorsComponent } from '../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../core/services/form-error-handler.service';

@Component({
  selector: 'app-project-form',
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
      [title]="isEditMode ? 'Editar Proyecto' : 'Nuevo Proyecto'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del proyecto'
          : 'Registrar nuevo proyecto en el sistema'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-plus'"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Proyecto'"
      [disableSubmit]="projectForm.invalid || loading"
      [loading]="loading"
      [loadingText]="'Guardando...'"
      [showFooter]="true"
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
      >
      </app-alert>

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
              <app-dropdown
                formControlName="estado"
                [options]="statusOptions"
                [placeholder]="'Seleccionar Estado'"
              ></app-dropdown>
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
              <input id="fechaFin" type="date" formControlName="fechaFin" class="form-control" />
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
    </app-form-container>
  `,
  styles: [
    `
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

      .alert {
        padding: 0.75rem 1rem;
        border-radius: 6px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .alert-success {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
        border: 1px solid var(--semantic-green-200);
      }

      .alert-error {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
        border: 1px solid var(--semantic-red-200);
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
  private errorHandler = inject(FormErrorHandlerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  projectForm: FormGroup;
  isEditMode = false;
  loading = false;
  projectId: string | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: ValidationError[] = [];

  statusOptions: DropdownOption[] = [
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Completado', value: 'COMPLETADO' },
    { label: 'En Pausa', value: 'PAUSADO' },
    { label: 'Cancelado', value: 'CANCELADO' },
  ];

  fieldLabels: Record<string, string> = {
    codigo: 'Código del Proyecto',
    nombre: 'Nombre del Proyecto',
    descripcion: 'Descripción',
    ubicacion: 'Ubicación',
    fechaInicio: 'Fecha de Inicio',
    fechaFin: 'Fecha de Fin Estimada',
    estado: 'Estado',
    presupuesto: 'Presupuesto Total',
    cliente: 'Cliente',
  };

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
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = null;
    this.errorMessage = null;
    this.validationErrors = [];
    const projectData = this.projectForm.value;

    const request$ =
      this.isEditMode && this.projectId
        ? this.projectService.update(this.projectId, projectData)
        : this.projectService.create(projectData);

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.isEditMode
          ? 'Proyecto actualizado exitosamente'
          : 'Proyecto creado exitosamente';
        setTimeout(() => {
          this.router.navigate(['/projects']);
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
    this.router.navigate(['/projects']);
  }

  hasError(field: string): boolean {
    const control = this.projectForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
