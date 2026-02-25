import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectService } from '../../../../core/services/project.service';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../../shared/components/dropdown/dropdown.component';
import { FormContainerComponent } from '../../../../shared/components/form-container/form-container.component';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DropdownComponent,
    FormContainerComponent,
  ],
  template: `
    <app-form-container
      [icon]="isEditMode ? 'fa-pen' : 'fa-diagram-project'"
      [title]="isEditMode ? 'Editar Proyecto' : 'Nuevo Proyecto'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del proyecto'
          : 'Registrar un nuevo proyecto en el sistema'
      "
      submitLabel="Guardar Proyecto"
      submitIcon="fa-save"
      [loading]="loading"
      [disableSubmit]="form.invalid || loading"
      (onSubmit)="onSubmit()"
      (onCancel)="onCancel()"
    >
      <form [formGroup]="form" class="form-grid">
        <!-- Section 1: Basic Information -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fa-solid fa-diagram-project"></i> Información General
          </h3>
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
              <app-dropdown formControlName="status" [options]="statusOptions"></app-dropdown>
              <div class="error-msg" *ngIf="hasError('status')">Estado es requerido</div>
            </div>
          </div>
        </div>

        <!-- Section 2: Dates & Location -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fa-solid fa-calendar-days"></i> Fechas y Ubicación
          </h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="startDate">Fecha Inicio *</label>
              <input id="startDate" type="date" formControlName="startDate" class="form-control" />
              <div class="error-msg" *ngIf="hasError('startDate')">Fecha inicio es requerida</div>
            </div>

            <div class="form-group">
              <label for="endDate">Fecha Fin Estimada *</label>
              <input id="endDate" type="date" formControlName="endDate" class="form-control" />
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
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-dollar-sign"></i> Presupuesto</h3>
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
              <app-dropdown formControlName="currency" [options]="currencyOptions"></app-dropdown>
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
    </app-form-container>
  `,
  styles: [],
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
      status: ['PLANIFICACION', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      location: ['', Validators.required],
      budget: ['', Validators.required],
      currency: ['PEN', Validators.required],
      description: [''],
    });
  }

  statusOptions: DropdownOption[] = [
    { label: 'Planificación', value: 'PLANIFICACION' },
    { label: 'En Ejecución', value: 'ACTIVO' },
    { label: 'Suspendido', value: 'PAUSADO' },
    { label: 'Finalizado', value: 'COMPLETADO' },
  ];

  currencyOptions: DropdownOption[] = [
    { label: 'Soles (PEN)', value: 'PEN' },
    { label: 'Dólares (USD)', value: 'USD' },
  ];

  loadProject() {
    if (!this.projectId) return;
    this.loading = true;
    this.projectService.getById(this.projectId).subscribe({
      next: (project: unknown) => {
        this.form.patchValue(project as Record<string, unknown>);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        console.error('Error loading project');
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
      this.isEditMode && this.projectId
        ? this.projectService.update(this.projectId, this.form.value)
        : this.projectService.create(this.form.value);

    req.subscribe({
      next: () => {
        this.router.navigate(['/operaciones/projects']);
      },
      error: () => {
        this.loading = false;
        console.error('Error saving project');
      },
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
