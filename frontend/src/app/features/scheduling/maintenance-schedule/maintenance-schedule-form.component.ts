import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MaintenanceScheduleService } from '../../../core/services/maintenance-schedule.service';
import { EquipmentService } from '../../../core/services/equipment.service';
import { Equipment } from '../../../core/models/equipment.model';
import { FormContainerComponent } from '../../../shared/components/form-container/form-container.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-maintenance-schedule-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormContainerComponent,
    DropdownComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Programación' : 'Nueva Programación'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información de la programación de mantenimiento'
          : 'Registrar una nueva programación de mantenimiento'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-plus'"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Programación'"
      [disableSubmit]="scheduleForm.invalid || loading"
      [loading]="loading"
      [loadingText]="'Guardando...'"
      [showFooter]="true"
      (submitted)="onSubmit()"
      (cancelled)="cancel()"
    >
      <!-- Success Message -->
      <div *ngIf="successMessage" class="alert alert-success">
        <i class="fa-solid fa-check-circle"></i>
        {{ successMessage }}
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage" class="alert alert-error">
        <i class="fa-solid fa-exclamation-circle"></i>
        {{ errorMessage }}
      </div>

      <form [formGroup]="scheduleForm" class="form-grid">
        <!-- Section 1: Equipment -->
        <div class="form-section full-width">
          <h3>Información General</h3>
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
              <label for="tecnicoResponsable">Técnico Responsable</label>
              <input
                id="tecnicoResponsable"
                type="text"
                formControlName="tecnicoResponsable"
                class="form-control"
                placeholder="Nombre del técnico..."
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Maintenance Details -->
        <div class="form-section full-width">
          <h3>Detalles del Mantenimiento</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="type">Tipo de Mantenimiento *</label>
              <app-dropdown
                formControlName="tipoMantenimiento"
                [options]="maintenanceTypeOptions"
                [error]="hasError('tipoMantenimiento')"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('tipoMantenimiento')">Tipo es requerido</div>
            </div>

            <div class="form-group">
              <label for="estado">Estado *</label>
              <app-dropdown
                formControlName="estado"
                [options]="statusOptions"
                [error]="hasError('estado')"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('estado')">Estado es requerido</div>
            </div>

            <div class="form-group full-width">
              <label for="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                formControlName="descripcion"
                class="form-control"
                rows="3"
                placeholder="Descripción del mantenimiento..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Section 3: Dates & Costs -->
        <div class="form-section full-width">
          <h3>Fechas y Costos</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="fechaProgramada">Fecha Programada</label>
              <input
                id="fechaProgramada"
                type="date"
                formControlName="fechaProgramada"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="fechaRealizada">Fecha Realizada</label>
              <input
                id="fechaRealizada"
                type="date"
                formControlName="fechaRealizada"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="costoEstimado">Costo Estimado (S/)</label>
              <input
                id="costoEstimado"
                type="number"
                formControlName="costoEstimado"
                class="form-control"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="costoReal">Costo Real (S/)</label>
              <input
                id="costoReal"
                type="number"
                formControlName="costoReal"
                class="form-control"
                placeholder="0.00"
              />
            </div>

            <div class="form-group full-width">
              <label for="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                formControlName="observaciones"
                class="form-control"
                rows="2"
                placeholder="Observaciones adicionales..."
              ></textarea>
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
        color: var(--grey-900);
        font-size: 12px;
        margin-top: 0.25rem;
      }

      .alert {
        padding: 1rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 14px;
        margin-bottom: 1.5rem;
      }

      .alert-success {
        background: var(--semantic-green-50);
        color: var(--primary-900);
        border: 1px solid var(--semantic-green-200);
      }

      .alert-error {
        background: var(--semantic-red-50);
        color: var(--grey-900);
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
export class MaintenanceScheduleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private scheduleService = inject(MaintenanceScheduleService);
  private equipmentService = inject(EquipmentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  scheduleForm!: FormGroup;
  isEditMode = false;
  scheduleId: string | null = null;
  loading = false;
  equipmentList: Equipment[] = [];
  successMessage = '';
  errorMessage = '';

  equipmentOptions: DropdownOption[] = [];
  maintenanceTypeOptions: DropdownOption[] = [
    { label: 'Preventivo', value: 'PREVENTIVO' },
    { label: 'Correctivo', value: 'CORRECTIVO' },
    { label: 'Predictivo', value: 'PREDICTIVO' },
  ];
  statusOptions: DropdownOption[] = [
    { label: 'Programado', value: 'PROGRAMADO' },
    { label: 'En Proceso', value: 'EN_PROCESO' },
    { label: 'Completado', value: 'COMPLETADO' },
    { label: 'Cancelado', value: 'CANCELADO' },
    { label: 'Pendiente', value: 'PENDIENTE' },
  ];

  constructor() {
    this.initForm();
  }

  ngOnInit() {
    this.loadEquipment();
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.scheduleId = params['id'];
        this.loadSchedule(this.scheduleId!);
      }
    });
  }

  private initForm() {
    this.scheduleForm = this.fb.group({
      equipoId: [null, [Validators.required]],
      tipoMantenimiento: ['PREVENTIVO', [Validators.required]],
      descripcion: [''],
      fechaProgramada: [null],
      fechaRealizada: [null],
      costoEstimado: [null],
      costoReal: [null],
      tecnicoResponsable: [''],
      estado: ['PROGRAMADO', [Validators.required]],
      observaciones: [''],
    });
  }

  loadEquipment() {
    this.equipmentService.getAll().subscribe({
      next: (res: unknown) => {
        // Handle standard array response or wrapped response
        this.equipmentList = Array.isArray(res) ? res : ((res as any)?.data as Equipment[]) || [];
        this.equipmentOptions = this.equipmentList.map((eq) => ({
          label: `${eq.codigo_equipo} - ${eq.marca} ${eq.modelo}`,
          value: eq.id,
        }));
      },
      error: (err: unknown) => console.error('Error cargando equipos:', err),
    });
  }

  loadSchedule(id: string) {
    this.loading = true;
    this.scheduleService.getById(id).subscribe({
      next: (schedule) => {
        // Patch form with data, handling potential date formatting if needed
        this.scheduleForm.patchValue({
          ...schedule,
          fechaProgramada: schedule.fechaProgramada
            ? new Date(schedule.fechaProgramada).toISOString().split('T')[0]
            : null,
          fechaRealizada: schedule.fechaRealizada
            ? new Date(schedule.fechaRealizada).toISOString().split('T')[0]
            : null,
        });
        this.loading = false;
      },
      error: (_err: unknown) => {
        this.errorMessage = 'Error al cargar la programación';
        this.loading = false;
      },
    });
  }

  onSubmit() {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    const data = this.scheduleForm.value;

    const req =
      this.isEditMode && this.scheduleId
        ? this.scheduleService.update(this.scheduleId, data)
        : this.scheduleService.create(data);

    req.subscribe({
      next: () => {
        this.successMessage = this.isEditMode
          ? 'Programación actualizada exitosamente'
          : 'Programación creada exitosamente';
        setTimeout(() => this.router.navigate(['/equipment/maintenance/schedule']), 1500);
      },
      error: (err: unknown) => {
        const errorObj = err as any;
        this.errorMessage =
          errorObj.error?.error || errorObj.error?.message || 'Error al guardar la programación';
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
