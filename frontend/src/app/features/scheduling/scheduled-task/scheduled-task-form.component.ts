import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ScheduledTaskService } from '../../../core/services/scheduled-task.service';
import { EquipmentService } from '../../../core/services/equipment.service';
import { OperatorService } from '../../../core/services/operator.service';
import { Equipment } from '../../../core/models/equipment.model';
import { Operator } from '../../../core/models/operator.model';
import { FormContainerComponent } from '../../../shared/components/form-container/form-container.component';
import { ValidationErrorsComponent } from '../../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../../core/services/form-error-handler.service';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';

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
    DropdownComponent,
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
      (submitted)="onSubmit()"
      (cancelled)="cancel()"
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
              <app-dropdown
                formControlName="equipoId"
                [options]="equipmentOptions"
                [placeholder]="'Seleccionar Equipo'"
                [searchable]="true"
                [error]="hasError('equipoId')"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('equipoId')">Equipo es requerido</div>
            </div>

            <div class="form-group">
              <label for="operator">Operador</label>
              <app-dropdown
                formControlName="operadorId"
                [options]="operatorOptions"
                [placeholder]="'Sin Asignar'"
                [searchable]="true"
              ></app-dropdown>
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
              <app-dropdown
                formControlName="tipoTarea"
                [options]="taskTypeOptions"
                [placeholder]="'Seleccionar Tipo'"
                [error]="hasError('tipoTarea')"
              ></app-dropdown>
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
              <app-dropdown
                formControlName="prioridad"
                [options]="priorityOptions"
                [placeholder]="'Seleccionar Prioridad'"
                [error]="hasError('prioridad')"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('prioridad')">Prioridad es requerida</div>
            </div>

            <div class="form-group">
              <label for="status">Estado *</label>
              <app-dropdown
                formControlName="estado"
                [options]="statusOptions"
                [placeholder]="'Seleccionar Estado'"
                [error]="hasError('estado')"
              ></app-dropdown>
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
        gap: var(--s-32);
      }

      .form-section {
        background: var(--grey-50);
        padding: var(--s-24);
        border-radius: var(--radius-lg);
        border: 1px solid var(--grey-100);

        h3 {
          font-size: 14px;
          color: var(--primary-800);
          border-bottom: 2px solid var(--primary-100);
          padding-bottom: var(--s-8);
          margin-bottom: var(--s-24);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      }

      .section-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--s-24);
      }

      .full-width {
        grid-column: 1 / -1;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--s-8);

        label {
          font-size: 11px;
          font-weight: 700;
          color: var(--grey-600);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      }

      .error-msg {
        color: var(--semantic-red-500);
        font-size: 12px;
        font-weight: 500;
        margin-top: 2px;
      }

      textarea.form-control {
        height: auto;
        padding: var(--s-12);
        line-height: 1.6;
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
  equipmentList: Equipment[] = [];
  operators: Operator[] = [];
  validationErrors: ValidationError[] = [];
  errorMessage = '';
  successMessage = '';

  equipmentOptions: DropdownOption[] = [];
  operatorOptions: DropdownOption[] = [];
  taskTypeOptions: DropdownOption[] = [
    { label: 'Mantenimiento', value: 'maintenance' },
    { label: 'Inspección', value: 'inspection' },
    { label: 'Asignación', value: 'assignment' },
  ];
  priorityOptions: DropdownOption[] = [
    { label: 'Baja', value: 'low' },
    { label: 'Media', value: 'medium' },
    { label: 'Alta', value: 'high' },
    { label: 'Urgente', value: 'urgent' },
  ];
  statusOptions: DropdownOption[] = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'Asignado', value: 'assigned' },
    { label: 'En Proceso', value: 'in_progress' },
    { label: 'Completado', value: 'completed' },
    { label: 'Cancelado', value: 'cancelled' },
  ];

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
      tipoTarea: ['maintenance', Validators.required],
      descripcion: ['', Validators.required],
      prioridad: ['medium', Validators.required],
      estado: ['pending', Validators.required],
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
    this.equipmentService.getAll().subscribe((res: unknown) => {
      const data = res as Record<string, unknown>;
      this.equipmentList = (data['data'] as Equipment[]) || (res as Equipment[]);
      this.equipmentOptions = this.equipmentList.map((eq) => ({
        label: `${eq.codigo_equipo} - ${eq.marca} ${eq.modelo}`,
        value: eq.id,
      }));
    });
    this.operatorService.getAll().subscribe((res: unknown) => {
      this.operators = res as Operator[];
      this.operatorOptions = this.operators.map((op: any) => ({
        label: `${op.C05000_Nombre || op.nombres || ''} ${op.C05000_Apellido || op.apellidos || ''}`,
        value: op.id,
      }));
    });
  }

  loadTask(id: number) {
    this.loading = true;
    this.taskService.getById(id).subscribe({
      next: (task) => {
        if (!task || !task.id) {
          this.router.navigate(['/operaciones/scheduling/tasks']);
          return;
        }
        if (task.fechaInicio) {
          task.fechaInicio = task.fechaInicio.split('T')[0];
        }
        this.taskForm.patchValue(task);
        this.loading = false;
      },
      error: (_err: unknown) => {
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
      error: (err: unknown) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err as any);
        this.errorMessage = this.errorHandler.getErrorMessage(err as any);
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
