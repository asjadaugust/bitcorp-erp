import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectService } from '../../../../core/services/project.service';
import { OperatorService } from '../../../../core/services/operator.service';
import { TimesheetService } from '../../../../core/services/timesheet.service';
import { FormContainerComponent } from '../../../../shared/components/form-container/form-container.component';
import { ValidationErrorsComponent } from '../../../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../../../core/services/form-error-handler.service';

@Component({
  selector: 'app-timesheet-form',
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
      [title]="isEditMode ? 'Editar Parte de Horas' : 'Nuevo Parte de Horas'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del parte de horas'
          : 'Registrar un nuevo parte de horas semanal'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-plus'"
      [loading]="loading"
      [disableSubmit]="form.invalid || loading"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Parte'"
      (onSubmit)="onSubmit()"
      (onCancel)="onCancel()"
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

      <form [formGroup]="form" class="form-grid">
        <!-- Section 1: General Info -->
        <div class="form-section full-width">
          <h3>Información General</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="project">Proyecto *</label>
              <select id="project" formControlName="proyecto_id" class="form-select">
                <option [ngValue]="null">Seleccionar Proyecto</option>
                <option *ngFor="let project of projects" [value]="project.id">
                  {{ project.nombre }}
                </option>
              </select>
              <div class="error-msg" *ngIf="hasError('proyecto_id')">Proyecto es requerido</div>
            </div>

            <div class="form-group">
              <label for="operator">Operador *</label>
              <select id="operator" formControlName="trabajador_id" class="form-select">
                <option [ngValue]="null">Seleccionar Operador</option>
                <option *ngFor="let op of operators" [value]="op.id">
                  {{ op.nombres }} {{ op.apellidos }}
                </option>
              </select>
              <div class="error-msg" *ngIf="hasError('trabajador_id')">Operador es requerido</div>
            </div>

            <div class="form-group">
              <label for="weekStart">Inicio de Semana *</label>
              <input id="weekStart" type="date" formControlName="week_start" class="form-control" />
              <div class="error-msg" *ngIf="hasError('week_start')">Fecha inicio es requerida</div>
            </div>

            <div class="form-group">
              <label for="status">Estado *</label>
              <select id="status" formControlName="estado" class="form-select">
                <option value="BORRADOR">Borrador</option>
                <option value="ENVIADO">Enviado</option>
                <option value="APROBADO">Aprobado</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>
              <div class="error-msg" *ngIf="hasError('estado')">Estado es requerido</div>
            </div>
          </div>
        </div>

        <!-- Section 2: Daily Entries -->
        <div class="form-section full-width">
          <h3>Registro Diario</h3>
          <div class="entries-container" formArrayName="entries">
            <div
              *ngFor="let entry of entries.controls; let i = index"
              [formGroupName]="i"
              class="entry-row"
            >
              <div class="entry-header">
                <span class="day-label">Día {{ i + 1 }}</span>
              </div>
              <div class="entry-fields">
                <div class="form-group">
                  <label>Fecha</label>
                  <input type="date" formControlName="date" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Horas Regulares</label>
                  <input
                    type="number"
                    formControlName="regular_hours"
                    class="form-control"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div class="form-group">
                  <label>Horas Extra</label>
                  <input
                    type="number"
                    formControlName="overtime_hours"
                    class="form-control"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div class="form-group full-width-mobile">
                  <label>Descripción</label>
                  <input
                    type="text"
                    formControlName="description"
                    class="form-control"
                    placeholder="Actividad..."
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="total-summary">
            <strong>Total Horas: {{ calculateTotalHours() }}</strong>
          </div>
        </div>

        <!-- Section 3: Notes -->
        <div class="form-section full-width">
          <h3>Observaciones</h3>
          <div class="section-grid">
            <div class="form-group full-width">
              <label for="notes">Notas Adicionales</label>
              <textarea
                id="notes"
                formControlName="notes"
                class="form-control"
                rows="3"
                placeholder="Comentarios adicionales..."
              ></textarea>
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

      /* Entries specific styles */
      .entries-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .entry-row {
        background: var(--grey-50);
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid var(--grey-200);
      }

      .entry-header {
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--primary-700);
      }

      .entry-fields {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
      }

      .total-summary {
        margin-top: 1rem;
        padding: 1rem;
        background: var(--primary-50);
        border-radius: 8px;
        text-align: right;
        font-size: 16px;
        color: var(--primary-900);
      }

      @media (max-width: 768px) {
        .section-grid {
          grid-template-columns: 1fr;
        }
        .entry-fields {
          grid-template-columns: 1fr 1fr;
        }
        .full-width-mobile {
          grid-column: 1 / -1;
        }
      }
    `,
  ],
})
export class TimesheetFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private operatorService = inject(OperatorService);
  private timesheetService = inject(TimesheetService);
  private errorHandler = inject(FormErrorHandlerService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  timesheetId?: string;
  projects: any[] = [];
  operators: any[] = [];
  validationErrors: ValidationError[] = [];
  errorMessage = '';
  successMessage = '';

  fieldLabels: Record<string, string> = {
    proyecto_id: 'Proyecto',
    trabajador_id: 'Operador',
    week_start: 'Inicio de Semana',
    estado: 'Estado',
    notes: 'Notas',
    entries: 'Registros Diarios',
  };

  ngOnInit() {
    this.timesheetId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.timesheetId;
    this.initForm();
    this.loadDependencies();
    if (this.isEditMode) this.loadTimesheet();
  }

  initForm() {
    this.form = this.fb.group({
      proyecto_id: [null, Validators.required],
      trabajador_id: [null, Validators.required],
      week_start: ['', Validators.required],
      estado: ['BORRADOR', Validators.required],
      notes: [''],
      entries: this.fb.array([]),
    });

    this.initDays();
  }

  initDays() {
    const entries = this.form.get('entries') as FormArray;
    for (let i = 0; i < 7; i++) {
      entries.push(this.createEntry());
    }
  }

  createEntry(): FormGroup {
    return this.fb.group({
      date: [''],
      regular_hours: [0],
      overtime_hours: [0],
      description: [''],
    });
  }

  get entries() {
    return this.form.get('entries') as FormArray;
  }

  loadDependencies() {
    this.projectService.getAll().subscribe((res: any) => (this.projects = res.data || res));
    this.operatorService.getAll().subscribe((res: any) => (this.operators = res.data || res));
  }

  loadTimesheet() {
    if (!this.timesheetId) return;
    this.loading = true;
    this.timesheetService.getById(this.timesheetId).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.form.patchValue(data);
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = 'No se pudo cargar el parte de horas';
      },
    });
  }

  calculateTotalHours(): number {
    let total = 0;
    this.entries.controls.forEach((control) => {
      const regular = control.get('regular_hours')?.value || 0;
      const overtime = control.get('overtime_hours')?.value || 0;
      total += Number(regular) + Number(overtime);
    });
    return total;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.validationErrors = [];
    this.errorMessage = '';
    this.successMessage = '';

    const req =
      this.isEditMode && this.timesheetId
        ? this.timesheetService.update(this.timesheetId, this.form.value)
        : this.timesheetService.create(this.form.value);

    req.subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.isEditMode
          ? 'Parte de horas actualizado exitosamente'
          : 'Parte de horas creado exitosamente';
        setTimeout(() => {
          this.router.navigate(['/operaciones/timesheets']);
        }, 1500);
      },
      error: (err: any) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  onCancel() {
    this.router.navigate(['/operaciones/timesheets']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
