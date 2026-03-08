import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { WorkerRegistryService } from './worker-registry.service';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { FormContainerComponent } from '../../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';
import { AeroDatePickerComponent } from '../../../core/design-system';

@Component({
  selector: 'app-registro-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ValidationErrorsComponent,
    AlertComponent,
    FormContainerComponent,
    FormSectionComponent,
    AeroDatePickerComponent,
  ],
  template: `
    <app-form-container
      [icon]="isEditMode ? 'fa-pen' : 'fa-id-card'"
      [title]="isEditMode ? 'Editar Registro' : 'Nuevo Registro'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del registro de trabajador'
          : 'Registrar un nuevo trabajador'
      "
      submitLabel="Guardar"
      submitIcon="fa-save"
      backUrl="/rrhh/worker-registry"
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
        <app-form-section title="Datos del Trabajador" icon="fa-id-card">
          <div class="form-group">
            <label class="form-label">DNI Trabajador *</label>
            <input
              type="text"
              formControlName="trabajador_dni"
              class="form-control"
              placeholder="Ingrese DNI"
            />
          </div>

          <div class="form-group">
            <label class="form-label">RUC Proveedor</label>
            <input
              type="text"
              formControlName="proveedor_ruc"
              class="form-control"
              placeholder="RUC del proveedor"
            />
          </div>

          <div class="form-group">
            <aero-date-picker
              [mode]="'single'"
              formControlName="fecha_ingreso"
              [label]="'Fecha Ingreso *'"
            ></aero-date-picker>
          </div>

          <div class="form-group">
            <aero-date-picker
              [mode]="'single'"
              formControlName="fecha_cese"
              [label]="'Fecha Cese'"
            ></aero-date-picker>
          </div>

          <div class="form-group">
            <label class="form-label">Estado</label>
            <select formControlName="estatus" class="form-control">
              <option value="ACTIVO">Activo</option>
              <option value="CESADO">Cesado</option>
              <option value="SUSPENDIDO">Suspendido</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Sub Grupo</label>
            <select formControlName="sub_grupo" class="form-control">
              <option value="">Seleccionar...</option>
              <option value="OBRERO">Obrero</option>
              <option value="EMPLEADO">Empleado</option>
              <option value="PRACTICANTE">Practicante</option>
            </select>
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
export class RegistroFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(WorkerRegistryService);
  private readonly errorHandler = inject(FormErrorHandlerService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  registroId?: number;
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    this.registroId = idParam ? parseInt(idParam, 10) : undefined;
    this.isEditMode = !!this.registroId;
    this.initForm();
    if (this.isEditMode) this.loadRegistro();
  }

  initForm(): void {
    this.form = this.fb.group({
      trabajador_dni: [''],
      proveedor_ruc: [''],
      fecha_ingreso: [''],
      fecha_cese: [''],
      estatus: ['ACTIVO'],
      sub_grupo: [''],
    });
  }

  loadRegistro(): void {
    if (!this.registroId) return;
    this.loading = true;
    this.service.getRegistro(this.registroId).subscribe({
      next: (registro) => {
        this.form.patchValue({
          trabajador_dni: registro.trabajador_dni ?? '',
          proveedor_ruc: registro.proveedor_ruc ?? '',
          fecha_ingreso: registro.fecha_ingreso ? registro.fecha_ingreso.split('T')[0] : '',
          fecha_cese: registro.fecha_cese ? registro.fecha_cese.split('T')[0] : '',
          estatus: registro.estatus ?? 'ACTIVO',
          sub_grupo: registro.sub_grupo ?? '',
        });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.validationErrors = [];
    this.errorMessage = null;

    const payload = { ...this.form.value };
    // Clean empty strings to null
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') payload[key] = null;
    });

    const req =
      this.isEditMode && this.registroId
        ? this.service.updateRegistro(this.registroId, payload)
        : this.service.createRegistro(payload);

    req.subscribe({
      next: (result) => {
        if (this.isEditMode && this.registroId) {
          this.router.navigate(['/rrhh/worker-registry', this.registroId]);
        } else {
          this.router.navigate(['/rrhh/worker-registry', result.id]);
        }
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/rrhh/worker-registry']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
