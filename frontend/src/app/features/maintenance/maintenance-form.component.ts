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
                <select id="equipment" formControlName="equipment_id" class="form-select">
                  <option [ngValue]="null">Seleccionar Equipo</option>
                  <option *ngFor="let equip of equipmentList" [value]="equip.id">
                    {{ equip.code }} - {{ equip.brand }} {{ equip.model }}
                  </option>
                </select>
                <div class="error-msg" *ngIf="hasError('equipment_id')">Equipo es requerido</div>
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

      textarea.form-control {
        resize: vertical;
        min-height: 100px;
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
export class MaintenanceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private maintenanceService = inject(MaintenanceService);
  private equipmentService = inject(EquipmentService);
  private providerService = inject(ProviderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  maintenanceForm: FormGroup;
  isEditMode = false;
  loading = false;
  recordId: number | null = null;
  equipmentList: Equipment[] = [];
  providers: Provider[] = [];

  constructor() {
    this.maintenanceForm = this.fb.group({
      equipment_id: [null, Validators.required],
      maintenance_type: ['preventive', Validators.required],
      description: ['', Validators.required],
      start_date: [new Date().toISOString().split('T')[0], Validators.required],
      end_date: [''],
      cost: [0, [Validators.required, Validators.min(0)]],
      provider_id: [null],
      status: ['scheduled', Validators.required],
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
          // TODO: Fix property name mismatch - model uses fechaProgramada/fechaRealizada
          // start_date: formatDate(record.start_date),
          // end_date: record.end_date ? formatDate(record.end_date) : '',
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
        console.error('Error saving maintenance record', err);
        this.loading = false;
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
