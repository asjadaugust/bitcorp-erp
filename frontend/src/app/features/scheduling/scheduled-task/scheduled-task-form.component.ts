import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ScheduledTaskService } from '../../../core/services/scheduled-task.service';
import { EquipmentService } from '../../../core/services/equipment.service';
import { OperatorService } from '../../../core/services/operator.service';
import { FormContainerComponent } from '../../../shared/components/form-container/form-container.component';
import { ValidationErrorsComponent } from '../../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../../core/services/form-error-handler.service';

@Component({
  selector: 'app-scheduled-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormContainerComponent,
    ValidationErrorsComponent,
    AlertComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Tarea' : 'Nueva Tarea'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información de la tarea programada'
          : 'Registrar una nueva tarea en el calendario'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-plus'"
      [loading]="loading"
      [disableSubmit]="taskForm.invalid || loading"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Tarea'"
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
        [autoDismiss]="true"
        [autoDismissDelay]="1500"
      >
      </app-alert>

      <form [formGroup]="taskForm" class="form-grid">
        <!-- Section 1: Assignment -->
        <div class="form-section full-width">
          <h3>Asignación</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="equipment">Equipo *</label>
              <select id="equipment" formControlName="equipoId" class="form-select">
                <option [ngValue]="null">Seleccionar Equipo</option>
                <option *ngFor="let eq of equipmentList" [value]="eq.id">
                  {{ eq.codigo_equipo }} - {{ eq.marca }} {{ eq.modelo }}
                </option>
              </select>
              <div class="error-msg" *ngIf="hasError('equipoId')">Equipo es requerido</div>
            </div>

            <div class="form-group">
              <label for="operator">Operador</label>
              <select id="operator" formControlName="operadorId" class="form-select">
                <option [ngValue]="null">Sin Asignar</option>
                <option *ngFor="let op of operators" [value]="op.id">
                  {{ op.C05000_Nombre || op.nombres }} {{ op.C05000_Apellido || op.apellidos }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section 2: Task Details -->
        <div class="form-section full-width">
          <h3>Detalles de la Tarea</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="date">Fecha Programada *</label>
              <input type="date" id="date" formControlName="fechaInicio" class="form-control" />
              <div class="error-msg" *ngIf="hasError('fechaInicio')">Fecha es requerida</div>
            </div>

            <div class="form-group">
              <label for="type">Tipo de Tarea *</label>
              <select id="type" formControlName="tipoTarea" class="form-select">
                <option value="mantenimiento">Mantenimiento</option>
                <option value="inspeccion">Inspección</option>
                <option value="reparacion">Reparación</option>
                <option value="transporte">Transporte</option>
              </select>
              <div class="error-msg" *ngIf="hasError('tipoTarea')">Tipo es requerido</div>
            </div>

            <div class="form-group full-width">
              <label for="description">Descripción *</label>
              <textarea
                id="description"
                formControlName="descripcion"
                class="form-control"
                rows="3"
                placeholder="Descripción detallada de la tarea..."
              ></textarea>
              <div class="error-msg" *ngIf="hasError('descripcion')">Descripción es requerida</div>
            </div>
          </div>
        </div>

        <!-- Section 3: Status & Priority -->
        <div class="form-section full-width">
          <h3>Estado y Prioridad</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="priority">Prioridad *</label>
              <select id="priority" formControlName="prioridad" class="form-select">
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
              <div class="error-msg" *ngIf="hasError('prioridad')">Prioridad es requerida</div>
            </div>

            <div class="form-group">
              <label for="status">Estado *</label>
              <select id="status" formControlName="estado" class="form-select">
                <option value="PENDIENTE">Pendiente</option>
                <option value="ASIGNADO">Asignado</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="COMPLETADO">Completado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
              <div class="error-msg" *ngIf="hasError('estado')">Estado es requerido</div>
            </div>
          </div>
        </div>
      </form>
    </app-form-container>
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
export class ScheduledTaskFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(ScheduledTaskService);
  private equipmentService = inject(EquipmentService);
  private operatorService = inject(OperatorService);
  private errorHandler = inject(FormErrorHandlerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  taskForm: FormGroup;
  isEditMode = false;
  taskId: number | null = null;
  loading = false;
  equipmentList: any[] = [];
  operators: any[] = [];
  validationErrors: ValidationError[] = [];
  errorMessage = '';
  successMessage = '';

  fieldLabels: Record<string, string> = {
    equipoId: 'Equipo',
    operadorId: 'Operador',
    fechaInicio: 'Fecha Programada',
    tipoTarea: 'Tipo de Tarea',
    descripcion: 'Descripción',
    prioridad: 'Prioridad',
    estado: 'Estado',
    titulo: 'Título',
  };

  constructor() {
    this.taskForm = this.fb.group({
      titulo: [''],
      equipoId: [null, Validators.required],
      operadorId: [null],
      fechaInicio: ['', Validators.required],
      tipoTarea: ['mantenimiento', Validators.required],
      descripcion: ['', Validators.required],
      prioridad: ['MEDIA', Validators.required],
      estado: ['PENDIENTE', Validators.required],
    });
  }

  ngOnInit() {
    this.loadDependencies();

    this.route.queryParams.subscribe((params) => {
      if (params['date']) {
        this.taskForm.patchValue({ fechaInicio: params['date'] });
      }
    });

    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id && id !== 'undefined' && id !== 'NaN') {
        this.isEditMode = true;
        this.taskId = +id;
        if (isNaN(this.taskId)) {
          this.router.navigate(['/operaciones/scheduling/tasks']);
          return;
        }
        this.loadTask(this.taskId);
      } else if (id === 'undefined' || id === 'NaN') {
        this.router.navigate(['/operaciones/scheduling/tasks']);
      }
    });
  }

  loadDependencies() {
    this.equipmentService.getAll().subscribe((res: any) => (this.equipmentList = res.data));
    this.operatorService.getAll().subscribe((res: any) => (this.operators = res));
  }

  loadTask(id: number) {
    this.loading = true;
    this.taskService.getById(id).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        if (!data || !data.id) {
          this.router.navigate(['/operaciones/scheduling/tasks']);
          return;
        }
        if (data.fechaInicio) {
          data.fechaInicio = data.fechaInicio.split('T')[0];
        }
        this.taskForm.patchValue(data);
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = 'No se pudo cargar la tarea';
        this.router.navigate(['/operaciones/scheduling/tasks']);
      },
    });
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.validationErrors = [];
    this.errorMessage = '';
    this.successMessage = '';
    const data = this.taskForm.value;

    const req =
      this.isEditMode && this.taskId
        ? this.taskService.update(this.taskId, data)
        : this.taskService.create(data);

    req.subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.isEditMode
          ? 'Tarea actualizada exitosamente'
          : 'Tarea creada exitosamente';
        setTimeout(() => {
          this.router.navigate(['/operaciones/scheduling/tasks']);
        }, 1500);
      },
      error: (err: any) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/operaciones/scheduling/tasks']);
  }

  hasError(field: string): boolean {
    const control = this.taskForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
