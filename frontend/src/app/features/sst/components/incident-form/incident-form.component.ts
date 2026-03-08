import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SstService, SstIncidenteCreate } from '../../services/sst.service';
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
import { FormSectionComponent } from '../../../../shared/components/form-section/form-section.component';
import { AeroDatePickerComponent } from '../../../../core/design-system';

@Component({
  selector: 'app-incident-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ValidationErrorsComponent,
    AlertComponent,
    DropdownComponent,
    FormContainerComponent,
    FormSectionComponent,
    AeroDatePickerComponent,
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
      backUrl="/sst"
      [loading]="loading"
      [disableSubmit]="form.invalid || loading"
      (submitted)="onSubmit()"
      (cancelled)="onCancel()"
    >
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
        <app-form-section title="Información del Incidente" icon="fa-triangle-exclamation">
          <div class="form-group">
            <aero-date-picker
              [mode]="'single'"
              formControlName="fecha_incidente"
              label="Fecha *"
              [state]="hasError('fecha_incidente') ? 'error' : 'default'"
              [error]="hasError('fecha_incidente') ? 'Fecha es requerida' : ''"
            ></aero-date-picker>
          </div>

          <div class="form-group">
            <label class="form-label required">Hora</label>
            <input type="time" formControlName="hora" class="form-control" />
            <div class="error-msg" *ngIf="hasError('hora')">Hora es requerida</div>
          </div>

          <div class="form-group">
            <label class="form-label required">Tipo</label>
            <app-dropdown
              formControlName="tipo_incidente"
              [options]="incidentTypeOptions"
              [placeholder]="'Seleccione...'"
              [error]="hasError('tipo_incidente')"
            ></app-dropdown>
            <div class="error-msg" *ngIf="hasError('tipo_incidente')">Tipo es requerido</div>
          </div>

          <div class="form-group">
            <label class="form-label required">Severidad</label>
            <app-dropdown
              formControlName="severidad"
              [options]="severityOptions"
              [error]="hasError('severidad')"
            ></app-dropdown>
            <div class="error-msg" *ngIf="hasError('severidad')">Severidad es requerida</div>
          </div>

          <div class="form-group full-width">
            <label class="form-label required">Ubicación</label>
            <input
              type="text"
              formControlName="ubicacion"
              class="form-control"
              placeholder="Lugar exacto del incidente"
            />
            <div class="error-msg" *ngIf="hasError('ubicacion')">Ubicación es requerida</div>
          </div>

          <div class="form-group full-width">
            <label class="form-label required">Descripción</label>
            <textarea
              formControlName="descripcion"
              class="form-control"
              rows="4"
              placeholder="Describa detalladamente qué sucedió..."
            ></textarea>
            <div class="error-msg" *ngIf="hasError('descripcion')">Descripción es requerida</div>
          </div>
        </app-form-section>

        <app-form-section title="Información Adicional" icon="fa-clipboard-list">
          <div class="form-group full-width">
            <label class="form-label">Personas Involucradas</label>
            <textarea
              formControlName="personas_involucradas"
              class="form-control"
              rows="2"
              placeholder="Nombres de las personas involucradas (opcional)"
            ></textarea>
          </div>

          <div class="form-group full-width">
            <label class="form-label">Acciones Correctivas</label>
            <textarea
              formControlName="acciones_correctivas"
              class="form-control"
              rows="3"
              placeholder="Acciones tomadas o sugeridas (opcional)"
            ></textarea>
          </div>
        </app-form-section>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout';
    `,
  ],
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
  incidentId?: number;
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  incidentTypeOptions: DropdownOption[] = [
    { label: 'Caída de persona a diferente nivel', value: 'Caída de persona a diferente nivel' },
    { label: 'Incidente con equipo pesado', value: 'Incidente con equipo pesado' },
    { label: 'Cuasi accidente - Near miss', value: 'Cuasi accidente - Near miss' },
    { label: 'Exposición a sustancia peligrosa', value: 'Exposición a sustancia peligrosa' },
    { label: 'Condición insegura identificada', value: 'Condición insegura identificada' },
    { label: 'Sobreesfuerzo físico', value: 'Sobreesfuerzo físico' },
    { label: 'Acto inseguro observado', value: 'Acto inseguro observado' },
    { label: 'Emergencia médica', value: 'Emergencia médica' },
  ];

  severityOptions: DropdownOption[] = [
    { label: 'Leve', value: 'LEVE' },
    { label: 'Moderado', value: 'MODERADO' },
    { label: 'Grave', value: 'GRAVE' },
    { label: 'Muy Grave / Fatal', value: 'MUY_GRAVE' },
  ];

  ngOnInit() {
    const idParam = this.route.snapshot.params['id'];
    this.incidentId = idParam ? parseInt(idParam, 10) : undefined;
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
        const fecha = incident.fecha_incidente ? new Date(incident.fecha_incidente) : null;
        this.form.patchValue({
          fecha_incidente: fecha ? fecha.toISOString().split('T')[0] : '',
          hora: fecha ? fecha.toTimeString().slice(0, 5) : '',
          tipo_incidente: incident.tipo_incidente ?? '',
          severidad: incident.severidad ?? 'LEVE',
          ubicacion: incident.ubicacion ?? '',
          descripcion: incident.descripcion ?? '',
          acciones_correctivas: incident.acciones_tomadas ?? '',
        });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.errorHandler.getErrorMessage(err);
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

    const formValue = this.form.value;
    const payload: SstIncidenteCreate = {
      fecha_incidente: `${formValue.fecha_incidente}T${formValue.hora || '00:00'}:00`,
      tipo_incidente: formValue.tipo_incidente,
      severidad: formValue.severidad,
      ubicacion: formValue.ubicacion,
      descripcion: formValue.descripcion,
      acciones_tomadas: formValue.acciones_correctivas || undefined,
      estado: 'ABIERTO',
    };

    const req =
      this.isEditMode && this.incidentId
        ? this.sstService.updateIncident(this.incidentId, payload)
        : this.sstService.createIncident(payload);

    req.subscribe({
      next: () => {
        this.router.navigate(['/sst']);
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
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
