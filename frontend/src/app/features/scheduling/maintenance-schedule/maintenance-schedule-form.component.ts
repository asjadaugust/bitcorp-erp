import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MaintenanceScheduleService } from '../../../core/services/maintenance-schedule.service';
import { EquipmentService } from '../../../core/services/equipment.service';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-maintenance-schedule-form',
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
            <h1>{{ isEditMode ? 'Editar Programación' : 'Nueva Programación' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información de la programación de mantenimiento'
                  : 'Registrar una nueva programación de mantenimiento'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button
            class="btn btn-primary"
            (click)="onSubmit()"
            [disabled]="scheduleForm.invalid || loading"
          >
            <i class="fa-solid fa-save"></i>
            {{ isEditMode ? 'Guardar Cambios' : 'Crear Programación' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="scheduleForm" class="form-grid">
          <!-- Section 1: Equipment & Project -->
          <div class="form-section full-width">
            <h3>Información General</h3>
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
                <label for="project">Proyecto</label>
                <select id="project" formControlName="proyecto_id" class="form-select">
                  <option [ngValue]="null">Sin Proyecto</option>
                  <option *ngFor="let pr of projects" [value]="pr.id">
                    {{ pr.nombre }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Section 2: Maintenance Details -->
          <div class="form-section full-width">
            <h3>Detalles del Mantenimiento</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="type">Tipo de Mantenimiento *</label>
                <select id="type" formControlName="maintenance_type" class="form-select">
                  <option value="preventive">Preventivo</option>
                  <option value="corrective">Correctivo</option>
                  <option value="predictive">Predictivo</option>
                </select>
                <div class="error-msg" *ngIf="hasError('maintenance_type')">Tipo es requerido</div>
              </div>

              <div class="form-group">
                <label for="status">Estado *</label>
                <select id="status" formControlName="status" class="form-select">
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
                <div class="error-msg" *ngIf="hasError('status')">Estado es requerido</div>
              </div>

              <div class="form-group full-width">
                <label for="description">Descripción *</label>
                <textarea
                  id="description"
                  formControlName="description"
                  class="form-control"
                  rows="3"
                  placeholder="Descripción del mantenimiento..."
                ></textarea>
                <div class="error-msg" *ngIf="hasError('description')">
                  Descripción es requerida
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Interval -->
          <div class="form-section full-width">
            <h3>Intervalo de Mantenimiento</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="intervalType">Tipo de Intervalo *</label>
                <select id="intervalType" formControlName="interval_type" class="form-select">
                  <option value="hours">Horas (Horómetro)</option>
                  <option value="days">Días</option>
                  <option value="date">Fecha Fija</option>
                </select>
                <div class="error-msg" *ngIf="hasError('interval_type')">
                  Tipo de intervalo es requerido
                </div>
              </div>

              <div class="form-group">
                <label for="intervalValue">Valor del Intervalo *</label>
                <input
                  type="number"
                  id="intervalValue"
                  formControlName="interval_value"
                  class="form-control"
                  placeholder="Ej: 250"
                />
                <small class="text-muted" style="font-size: 12px; color: #666; margin-top: 4px;">
                  Ej: 250 (horas), 30 (días)
                </small>
                <div class="error-msg" *ngIf="hasError('interval_value')">Valor es requerido</div>
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
export class MaintenanceScheduleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private scheduleService = inject(MaintenanceScheduleService);
  private equipmentService = inject(EquipmentService);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  scheduleForm: FormGroup;
  isEditMode = false;
  scheduleId: string | null = null;
  loading = false;
  equipmentList: any[] = [];
  projects: any[] = [];

  constructor() {
    this.scheduleForm = this.fb.group({
      equipmentId: [null, Validators.required],
      projectId: [null],
      maintenanceType: ['preventive', Validators.required],
      description: ['', Validators.required],
      intervalType: ['hours', Validators.required],
      intervalValue: [null, [Validators.required, Validators.min(1)]],
      status: ['active', Validators.required],
    });
  }

  ngOnInit() {
    this.loadDependencies();
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.scheduleId = params['id'];
        this.loadSchedule(this.scheduleId!);
      }
    });
  }

  loadDependencies() {
    this.equipmentService.getAll().subscribe((res: any) => (this.equipmentList = res.data));
    this.projectService.getAll().subscribe((res: any) => (this.projects = res));
  }

  loadSchedule(id: string) {
    this.loading = true;
    this.scheduleService.getById(id).subscribe({
      next: (res: any) => {
        this.scheduleForm.patchValue(res.data);
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.router.navigate(['/equipment/maintenance']);
      },
    });
  }

  onSubmit() {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const data = this.scheduleForm.value;

    const req =
      this.isEditMode && this.scheduleId
        ? this.scheduleService.update(this.scheduleId, data)
        : this.scheduleService.create(data);

    req.subscribe({
      next: () => this.router.navigate(['/equipment/maintenance']),
      error: (err: any) => {
        alert('Error: ' + (err.error?.error || err.message));
        this.loading = false;
      },
    });
  }

  cancel() {
    this.router.navigate(['/equipment/maintenance/schedule']);
  }

  hasError(field: string): boolean {
    const control = this.scheduleForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
