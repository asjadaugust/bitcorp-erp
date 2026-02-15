import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { ProviderService } from '../../core/services/provider.service';
import { MaintenanceRecord } from '../../core/models/maintenance-record.model';
import { Equipment } from '../../core/models/equipment.model';
import { Provider } from '../../core/models/provider.model';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';

@Component({
  selector: 'app-maintenance-form',
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
            <h1>{{ isEditMode ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información del mantenimiento'
                  : 'Registrar nuevo mantenimiento preventivo o correctivo'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button
            class="btn btn-primary"
            (click)="onSubmit()"
            [disabled]="maintenanceForm.invalid || loading"
          >
            <i class="fa-solid fa-save"></i>
            {{ isEditMode ? 'Guardar Cambios' : 'Crear Mantenimiento' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="maintenanceForm" class="form-grid">
          <!-- Section 1: Basic Information -->
          <div class="form-section full-width">
            <h3>Detalles del Mantenimiento</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="equipment">Equipo *</label>
                <select id="equipment" formControlName="equipo_id" class="form-select">
                  <option [ngValue]="null">Seleccionar Equipo</option>
                  <option *ngFor="let equip of equipmentList" [value]="equip.id">
                    {{ equip.code }} - {{ equip.brand }} {{ equip.model }}
                  </option>
                </select>
                <div class="error-msg" *ngIf="hasError('equipo_id')">Equipo es requerido</div>
              </div>

              <div class="form-group">
                <label for="maintenance_type">Tipo de Mantenimiento *</label>
                <select
                  id="maintenance_type"
                  formControlName="maintenance_type"
                  class="form-select"
                >
                  <option value="preventive">Preventivo</option>
                  <option value="corrective">Correctivo</option>
                  <option value="predictive">Predictivo</option>
                </select>
                <div class="error-msg" *ngIf="hasError('maintenance_type')">Tipo es requerido</div>
              </div>

              <div class="form-group full-width">
                <label for="description">Descripción *</label>
                <textarea
                  id="description"
                  formControlName="description"
                  class="form-control"
                  rows="3"
                  placeholder="Describa el trabajo realizado o a realizar..."
                ></textarea>
                <div class="error-msg" *ngIf="hasError('description')">
                  Descripción es requerida
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Execution & Cost -->
          <div class="form-section full-width">
            <h3>Ejecución y Costos</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="start_date">Fecha de Inicio *</label>
                <input
                  id="start_date"
                  type="date"
                  formControlName="start_date"
                  class="form-control"
                />
                <div class="error-msg" *ngIf="hasError('start_date')">
                  Fecha de inicio requerida
                </div>
              </div>

              <div class="form-group">
                <label for="end_date">Fecha de Fin</label>
                <input id="end_date" type="date" formControlName="end_date" class="form-control" />
              </div>

              <div class="form-group">
                <label for="cost">Costo Total (S/) *</label>
                <input
                  id="cost"
                  type="number"
                  formControlName="cost"
                  class="form-control"
                  placeholder="0.00"
                />
                <div class="error-msg" *ngIf="hasError('cost')">Costo es requerido</div>
              </div>

              <div class="form-group">
                <label for="provider">Proveedor</label>
                <select id="provider" formControlName="provider_id" class="form-select">
                  <option [ngValue]="null">Seleccionar Proveedor</option>
                  <option *ngFor="let provider of providers" [value]="provider.id">
                    {{ provider.business_name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="status">Estado *</label>
                <select id="status" formControlName="status" class="form-select">
                  <option value="scheduled">Programado</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
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
        min-height: 100px;
      }

      .error-msg {
        color: var(--semantic-red-600);
        font-size: 12px;
      }

      @media (max-width: 768px) {
        .section-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class MaintenanceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private maintenanceService = inject(MaintenanceService);
  private equipmentService = inject(EquipmentService);
  private providerService = inject(ProviderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(FormErrorHandlerService);

  maintenanceForm: FormGroup;
  isEditMode = false;
  loading = false;
  recordId: number | null = null;
  equipmentList: Equipment[] = [];
  providers: Provider[] = [];
  validationErrors: ValidationError[] = [];
  errorMessage = '';

  fieldLabels: Record<string, string> = {
    equipoId: 'Equipo',
    tipoMantenimiento: 'Tipo de Mantenimiento',
    descripcion: 'Descripción',
    fechaProgramada: 'Fecha Programada',
    fechaRealizada: 'Fecha Realizada',
    costoReal: 'Costo Real',
    tecnicoResponsable: 'Técnico Responsable',
    estado: 'Estado',
    observaciones: 'Observaciones',
  };

  constructor() {
    this.maintenanceForm = this.fb.group({
      equipoId: [null, Validators.required],
      tipoMantenimiento: ['PREVENTIVO', Validators.required],
      descripcion: ['', Validators.required],
      fechaProgramada: [new Date().toISOString().split('T')[0], Validators.required],
      fechaRealizada: [''],
      costoReal: [0, [Validators.required, Validators.min(0)]],
      tecnicoResponsable: [''],
      estado: ['PROGRAMADO', Validators.required],
      observaciones: [''],
    });
  }

  ngOnInit(): void {
    this.loadDependencies();

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.recordId = +params['id'];
        this.loadRecord(this.recordId);
      }
    });
  }

  loadDependencies(): void {
    this.equipmentService.getAll().subscribe((response) => (this.equipmentList = response.data));
    this.providerService.getAll().subscribe((data) => (this.providers = data));
  }

  loadRecord(id: number): void {
    this.loading = true;
    this.maintenanceService.getById(id).subscribe({
      next: (record) => {
        // Format dates
        const formatDate = (dateStr: string) => (dateStr ? dateStr.split('T')[0] : '');

        this.maintenanceForm.patchValue({
          ...record,
          fechaProgramada: formatDate(record.fechaProgramada as string),
          fechaRealizada: record.fechaRealizada ? formatDate(record.fechaRealizada as string) : '',
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading maintenance record', err);
        this.loading = false;
        this.router.navigate(['/maintenance']);
      },
    });
  }

  onSubmit(): void {
    if (this.maintenanceForm.invalid) return;

    this.loading = true;
    const recordData = this.maintenanceForm.value;

    const request$ =
      this.isEditMode && this.recordId
        ? this.maintenanceService.update(this.recordId, recordData)
        : this.maintenanceService.create(recordData);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/equipment/maintenance']);
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/equipment/maintenance']);
  }

  hasError(field: string): boolean {
    const control = this.maintenanceForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
