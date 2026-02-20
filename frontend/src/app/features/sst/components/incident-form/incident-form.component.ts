import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { SstService } from '../../services/sst.service';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../../shared/components/dropdown/dropdown.component';
import { FormContainerComponent } from '../../../../shared/components/form-container/form-container.component';

@Component({
  selector: 'app-incident-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ValidationErrorsComponent,
    AlertComponent,
    DropdownComponent,
    FormContainerComponent,
  ],
  template: `
    <app-form-container
      [icon]="isEditMode ? 'fa-pen' : 'fa-triangle-exclamation'"
      [title]="isEditMode ? 'Editar Incidente' : 'Reportar Incidente'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del incidente'
          : 'Registrar un nuevo incidente o accidente en el sistema'
      "
      submitLabel="Guardar"
      submitIcon="fa-save"
      [loading]="loading"
      [disableSubmit]="form.invalid || loading"
      (onSubmit)="onSubmit()"
      (onCancel)="onCancel()"
    >
      <!-- Validation Errors and Alerts -->
      <app-validation-errors *ngIf="validationErrors.length > 0" [errors]="validationErrors">
      </app-validation-errors>
      <app-alert
        *ngIf="errorMessage"
        type="error"
        [message]="errorMessage"
        [dismissible]="true"
        (dismiss)="errorMessage = null"
      >
      </app-alert>

      <form [formGroup]="form" class="form-grid">
        <!-- Section 1: Incident Details -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fa-solid fa-triangle-exclamation"></i> Información del Incidente
          </h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="fecha_incidente">Fecha *</label>
              <input
                id="fecha_incidente"
                type="date"
                formControlName="fecha_incidente"
                class="form-control"
              />
              <div class="error-msg" *ngIf="hasError('fecha_incidente')">Fecha es requerida</div>
            </div>

            <div class="form-group">
              <label for="hora">Hora *</label>
              <input id="hora" type="time" formControlName="hora" class="form-control" />
              <div class="error-msg" *ngIf="hasError('hora')">Hora es requerida</div>
            </div>

            <div class="form-group">
              <label for="tipo_incidente">Tipo *</label>
              <app-dropdown
                formControlName="tipo_incidente"
                [options]="incidentTypeOptions"
                [placeholder]="'Seleccione...'"
                [error]="hasError('tipo_incidente')"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('tipo_incidente')">Tipo es requerido</div>
            </div>

            <div class="form-group">
              <label for="severidad">Severidad *</label>
              <app-dropdown
                formControlName="severidad"
                [options]="severityOptions"
                [error]="hasError('severidad')"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('severidad')">Severidad es requerida</div>
            </div>

            <div class="form-group full-width">
              <label for="ubicacion">Ubicación *</label>
              <input
                id="ubicacion"
                type="text"
                formControlName="ubicacion"
                class="form-control"
                placeholder="Lugar exacto del incidente"
              />
              <div class="error-msg" *ngIf="hasError('ubicacion')">Ubicación es requerida</div>
            </div>

            <div class="form-group full-width">
              <label for="descripcion">Descripción *</label>
              <textarea
                id="descripcion"
                formControlName="descripcion"
                class="form-control"
                rows="4"
                placeholder="Describa detalladamente qué sucedió..."
              ></textarea>
              <div class="error-msg" *ngIf="hasError('descripcion')">Descripción es requerida</div>
            </div>

            <div class="form-group full-width">
              <label for="personas_involucradas">Personas Involucradas</label>
              <textarea
                id="personas_involucradas"
                formControlName="personas_involucradas"
                class="form-control"
                rows="2"
                placeholder="Nombres de las personas involucradas (opcional)"
              ></textarea>
            </div>

            <div class="form-group full-width">
              <label for="acciones_correctivas">Acciones Correctivas</label>
              <textarea
                id="acciones_correctivas"
                formControlName="acciones_correctivas"
                class="form-control"
                rows="3"
                placeholder="Acciones tomadas o sugeridas (opcional)"
              ></textarea>
            </div>
          </div>
        </div>
      </form>
    </app-form-container>
  `,
  styles: [],
})
export class IncidentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sstService = inject(SstService);
  private errorHandler = inject(FormErrorHandlerService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  incidentId?: string;
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  incidentTypeOptions: DropdownOption[] = [
    { label: 'Accidente', value: 'Accidente' },
    { label: 'Incidente', value: 'Incidente' },
    { label: 'Casi Accidente', value: 'Casi Accidente' },
    { label: 'Condición Insegura', value: 'Condición Insegura' },
  ];

  severityOptions: DropdownOption[] = [
    { label: 'Leve', value: 'LEVE' },
    { label: 'Moderado', value: 'MODERADO' },
    { label: 'Grave', value: 'GRAVE' },
    { label: 'Muy Grave / Fatal', value: 'MUY_GRAVE' },
  ];

  ngOnInit() {
    this.incidentId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.incidentId;
    this.initForm();
    if (this.isEditMode) this.loadIncident();
  }

  initForm() {
    this.form = this.fb.group({
      fecha_incidente: ['', Validators.required],
      hora: ['', Validators.required],
      tipo_incidente: ['', Validators.required],
      severidad: ['LEVE', Validators.required],
      ubicacion: ['', Validators.required],
      descripcion: ['', Validators.required],
      personas_involucradas: [''],
      acciones_correctivas: [''],
    });
  }

  loadIncident() {
    if (!this.incidentId) return;
    this.loading = true;
    this.sstService.getIncident(this.incidentId).subscribe({
      next: (incident) => {
        this.form.patchValue(incident);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        console.error('Error loading incident', err);
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.validationErrors = [];
    this.errorMessage = null;

    const req =
      this.isEditMode && this.incidentId
        ? this.sstService.updateIncident(this.incidentId, this.form.value)
        : this.sstService.createIncident(this.form.value);

    req.subscribe({
      next: () => {
        this.router.navigate(['/sst']);
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        console.error('Error saving incident', err);
      },
    });
  }

  onCancel() {
    this.router.navigate(['/sst']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
