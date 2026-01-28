import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ScheduledTaskService } from '../../../core/services/scheduled-task.service';
import { EquipmentService } from '../../../core/services/equipment.service';
import { OperatorService } from '../../../core/services/operator.service';

@Component({
  selector: 'app-scheduled-task-form',
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
            <h1>{{ isEditMode ? 'Editar Tarea' : 'Nueva Tarea' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información de la tarea programada'
                  : 'Registrar una nueva tarea en el calendario'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button
            class="btn btn-primary"
            (click)="onSubmit()"
            [disabled]="taskForm.invalid || loading"
          >
            <i class="fa-solid fa-save"></i> {{ isEditMode ? 'Guardar Cambios' : 'Crear Tarea' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="taskForm" class="form-grid">
          <!-- Section 1: Assignment -->
          <div class="form-section full-width">
            <h3>Asignación</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="equipment">Equipo *</label>
                <select id="equipment" formControlName="equipo_id" class="form-select">
                  <option [ngValue]="null">Seleccionar Equipo</option>
                  <option *ngFor="let eq of equipmentList" [value]="eq.id">
                    {{ eq.code }} - {{ eq.brand }} {{ eq.model }}
                  </option>
                </select>
                <div class="error-msg" *ngIf="hasError('equipo_id')">Equipo es requerido</div>
              </div>

              <div class="form-group">
                <label for="operator">Operador</label>
                <select id="operator" formControlName="trabajador_id" class="form-select">
                  <option [ngValue]="null">Sin Asignar</option>
                  <option *ngFor="let op of operators" [value]="op.id">
                    {{ op.C05000_Nombre }} {{ op.C05000_Apellido }}
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
                <input type="date" id="date" formControlName="start_date" class="form-control" />
                <div class="error-msg" *ngIf="hasError('start_date')">Fecha es requerida</div>
              </div>

              <div class="form-group">
                <label for="type">Tipo de Tarea *</label>
                <select id="type" formControlName="task_type" class="form-select">
                  <option value="maintenance">Mantenimiento</option>
                  <option value="inspection">Inspección</option>
                  <option value="repair">Reparación</option>
                  <option value="transport">Transporte</option>
                </select>
                <div class="error-msg" *ngIf="hasError('task_type')">Tipo es requerido</div>
              </div>

              <div class="form-group full-width">
                <label for="description">Descripción *</label>
                <textarea
                  id="description"
                  formControlName="description"
                  class="form-control"
                  rows="3"
                  placeholder="Descripción detallada de la tarea..."
                ></textarea>
                <div class="error-msg" *ngIf="hasError('description')">
                  Descripción es requerida
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Status & Priority -->
          <div class="form-section full-width">
            <h3>Estado y Prioridad</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="priority">Prioridad *</label>
                <select id="priority" formControlName="priority" class="form-select">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
                <div class="error-msg" *ngIf="hasError('priority')">Prioridad es requerida</div>
              </div>

              <div class="form-group">
                <label for="status">Estado *</label>
                <select id="status" formControlName="status" class="form-select">
                  <option value="pending">Pendiente</option>
                  <option value="assigned">Asignado</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
                <div class="error-msg" *ngIf="hasError('status')">Estado es requerido</div>
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
export class ScheduledTaskFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(ScheduledTaskService);
  private equipmentService = inject(EquipmentService);
  private operatorService = inject(OperatorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  taskForm: FormGroup;
  isEditMode = false;
  taskId: number | null = null;
  loading = false;
  equipmentList: any[] = [];
  operators: any[] = [];

  constructor() {
    this.taskForm = this.fb.group({
      title: [''],
      equipo_id: [null, Validators.required],
      trabajador_id: [null],
      start_date: ['', Validators.required],
      task_type: ['maintenance', Validators.required],
      description: ['', Validators.required],
      priority: ['medium', Validators.required],
      status: ['pending', Validators.required],
    });
  }

  ngOnInit() {
    this.loadDependencies();

    this.route.queryParams.subscribe((params) => {
      if (params['date']) {
        this.taskForm.patchValue({ start_date: params['date'] });
      }
    });

    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id && id !== 'undefined' && id !== 'NaN') {
        this.isEditMode = true;
        this.taskId = +id;
        if (isNaN(this.taskId)) {
          console.error('Invalid task ID:', id);
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
        // Handle both wrapped and unwrapped responses
        const data = res.data || res;
        if (!data || !data.id) {
          console.error('Failed to get task: Invalid response', res);
          alert('Failed to get task');
          this.router.navigate(['/operaciones/scheduling/tasks']);
          return;
        }
        // Format date for input - handle both old and new field names
        if (data.scheduled_date) {
          data.start_date = data.scheduled_date.split('T')[0];
        } else if (data.start_date) {
          data.start_date = data.start_date.split('T')[0];
        }
        this.taskForm.patchValue(data);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to get task:', err);
        alert('Failed to get task: ' + (err.error?.error || err.message));
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
    const data = this.taskForm.value;

    const req =
      this.isEditMode && this.taskId
        ? this.taskService.update(this.taskId, data)
        : this.taskService.create(data);

    req.subscribe({
      next: () => this.router.navigate(['/scheduling/tasks']),
      error: (err: any) => {
        alert('Error: ' + (err.error?.error || err.message));
        this.loading = false;
      },
    });
  }

  cancel() {
    this.router.navigate(['/operaciones/scheduling/tasks']);
  }

  hasError(field: string): boolean {
    const control = this.taskForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
