import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../shared/components/form-section/form-section.component';
import { FormErrorHandlerService } from '../../core/services/form-error-handler.service';

import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-maintenance-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormContainerComponent,
    FormSectionComponent,
    DropdownComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del mantenimiento'
          : 'Registrar nuevo mantenimiento preventivo o correctivo'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-plus'"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Mantenimiento'"
      [disableSubmit]="maintenanceForm.invalid || loading"
      [loading]="loading"
      [loadingText]="'Guardando...'"
      [showFooter]="true"
      (onSubmit)="onSubmit()"
      (onCancel)="cancel()"
    >
      <!-- Error Feedback -->
      <div *ngIf="errorMessage" class="alert alert-error mb-4">
        <i class="fa-solid fa-circle-exclamation"></i>
        {{ errorMessage }}
      </div>

      <form [formGroup]="maintenanceForm" class="form-grid">
        <!-- Section 1: Basic Information -->
        <app-form-section title="Detalles del Mantenimiento" icon="fa-wrench">
          <div class="form-group">
            <label for="equipment">Equipo *</label>
            <app-dropdown
              formControlName="equipoId"
              [options]="equipmentOptions"
              [placeholder]="'Seleccionar Equipo'"
              [searchable]="true"
            ></app-dropdown>
            <div class="error-msg" *ngIf="hasError('equipoId')">Equipo es requerido</div>
          </div>

          <div class="form-group">
            <label for="maintenance_type">Tipo de Mantenimiento *</label>
            <app-dropdown
              formControlName="tipoMantenimiento"
              [options]="[
                { label: 'Preventivo', value: 'PREVENTIVO' },
                { label: 'Correctivo', value: 'CORRECTIVO' },
                { label: 'Predictivo', value: 'PREDICTIVO' },
              ]"
              [placeholder]="'Seleccionar Tipo'"
            ></app-dropdown>
            <div class="error-msg" *ngIf="hasError('tipoMantenimiento')">Tipo es requerido</div>
          </div>

          <div class="form-group full-width">
            <label for="description">Descripción *</label>
            <textarea
              id="description"
              formControlName="descripcion"
              class="form-control"
              rows="3"
              placeholder="Describa el trabajo realizado o a realizar..."
            ></textarea>
            <div class="error-msg" *ngIf="hasError('descripcion')">Descripción es requerida</div>
          </div>
        </app-form-section>

        <!-- Section 2: Execution & Cost -->
        <app-form-section title="Ejecución y Costos" icon="fa-coins">
          <div class="form-group">
            <label for="start_date">Fecha Programada *</label>
            <input
              id="start_date"
              type="date"
              formControlName="fechaProgramada"
              class="form-control"
            />
            <div class="error-msg" *ngIf="hasError('fechaProgramada')">
              Fecha programada requerida
            </div>
          </div>

          <div class="form-group">
            <label for="end_date">Fecha Realizada</label>
            <input
              id="end_date"
              type="date"
              formControlName="fechaRealizada"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="cost">Costo Estimado (S/) *</label>
            <input
              id="cost"
              type="number"
              formControlName="costoEstimado"
              class="form-control"
              placeholder="0.00"
            />
            <div class="error-msg" *ngIf="hasError('costoEstimado')">Costo es requerido</div>
          </div>

          <div class="form-group">
            <label for="technician">Técnico Responsable</label>
            <input
              id="technician"
              type="text"
              formControlName="tecnicoResponsable"
              class="form-control"
              placeholder="Nombre del técnico"
            />
          </div>

          <div class="form-group">
            <label for="status">Estado *</label>
            <app-dropdown
              formControlName="estado"
              [options]="[
                { label: 'Programado', value: 'PROGRAMADO' },
                { label: 'En Proceso', value: 'EN_PROCESO' },
                { label: 'Completado', value: 'COMPLETADO' },
                { label: 'Cancelado', value: 'CANCELADO' },
              ]"
              [placeholder]="'Seleccionar Estado'"
            ></app-dropdown>
            <div class="error-msg" *ngIf="hasError('estado')">Estado es requerido</div>
          </div>
        </app-form-section>

        <app-form-section title="Observaciones" icon="fa-clipboard" [columns]="1">
          <div class="form-group">
            <textarea
              id="observaciones"
              formControlName="observaciones"
              class="form-control"
              rows="2"
              placeholder="Observaciones adicionales..."
            ></textarea>
          </div>
        </app-form-section>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout';

      .alert {
        padding: 1rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 14px;
      }

      .alert-error {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
        border: 1px solid var(--semantic-red-200);
      }
    `,
  ],
})
export class MaintenanceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private maintenanceService = inject(MaintenanceService);
  private equipmentService = inject(EquipmentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(FormErrorHandlerService);

  maintenanceForm!: FormGroup;
  isEditMode = false;
  loading = false;
  recordId: number | null = null;
  equipmentList: Record<string, unknown>[] = [];
  equipmentOptions: { label: string; value: string | number | null }[] = [];
  errorMessage = '';

  constructor() {
    this.initForm();
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

  private initForm() {
    this.maintenanceForm = this.fb.group({
      equipoId: [null, Validators.required],
      tipoMantenimiento: ['PREVENTIVO', Validators.required],
      descripcion: ['', Validators.required],
      fechaProgramada: [new Date().toISOString().split('T')[0], Validators.required],
      fechaRealizada: [''],
      costoEstimado: [0, [Validators.required, Validators.min(0)]],
      tecnicoResponsable: [''],
      estado: ['PROGRAMADO', Validators.required],
      observaciones: [''],
    });
  }

  loadDependencies(): void {
    this.equipmentService.getAll().subscribe({
      next: (response: unknown) => {
        const responseData = response as Record<string, unknown>;
        this.equipmentList = Array.isArray(response)
          ? (response as Record<string, unknown>[])
          : (responseData?.['data'] as Record<string, unknown>[]) || [];
        this.equipmentOptions = this.equipmentList.map((eq) => ({
          label: `${eq['codigo_equipo']} - ${eq['marca']} ${eq['modelo']}`,
          value: eq['id'] as number,
        }));
      },
      error: (err) => console.error('Error loading equipment', err),
    });
  }

  loadRecord(id: number): void {
    this.loading = true;
    this.maintenanceService.getById(id).subscribe({
      next: (record) => {
        // Format dates
        const formatDate = (dateStr: string | Date | undefined) => {
          if (!dateStr) return '';
          const d = new Date(dateStr);
          return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
        };

        this.maintenanceForm.patchValue({
          ...record,
          fechaProgramada: formatDate(record.fechaProgramada),
          fechaRealizada: formatDate(record.fechaRealizada),
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading maintenance record', err);
        this.loading = false;
        this.router.navigate(['/equipment/maintenance']);
      },
    });
  }

  onSubmit(): void {
    if (this.maintenanceForm.invalid) {
      this.maintenanceForm.markAllAsTouched();
      return;
    }

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
