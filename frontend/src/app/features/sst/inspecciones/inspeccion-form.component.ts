import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InspeccionSsomaService } from './inspeccion-ssoma.service';
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
  selector: 'app-inspeccion-form',
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
      [icon]="isEditMode ? 'fa-pen' : 'fa-magnifying-glass'"
      [title]="isEditMode ? 'Editar Inspección' : 'Nueva Inspección'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información de la inspección'
          : 'Registrar una nueva inspección SSOMA'
      "
      submitLabel="Guardar"
      submitIcon="fa-save"
      backUrl="/sst/inspecciones"
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
        <app-form-section title="Datos del Hallazgo" icon="fa-exclamation-triangle">
          <div class="form-group">
            <aero-date-picker
              [mode]="'single'"
              formControlName="fecha_hallazgo"
              label="Fecha Hallazgo"
            ></aero-date-picker>
          </div>

          <div class="form-group">
            <label class="form-label">Lugar del Hallazgo</label>
            <input
              type="text"
              formControlName="lugar_hallazgo"
              class="form-control"
              placeholder="Ubicación del hallazgo"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Tipo de Inspección</label>
            <select formControlName="tipo_inspeccion" class="form-control">
              <option value="">Seleccionar...</option>
              <option value="Planificado">Planificado</option>
              <option value="No Planificado">No Planificado</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">DNI Inspector</label>
            <input
              type="text"
              formControlName="inspector_dni"
              class="form-control"
              placeholder="DNI del inspector"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Inspector</label>
            <input
              type="text"
              formControlName="inspector"
              class="form-control"
              placeholder="Nombre del inspector"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Nivel de Riesgo</label>
            <select formControlName="nivel_riesgo" class="form-control">
              <option value="">Seleccionar...</option>
              <option value="ALTO">Alto</option>
              <option value="MEDIO">Medio</option>
              <option value="BAJO">Bajo</option>
            </select>
          </div>

          <div class="form-group full-width">
            <label class="form-label">Descripción del Hallazgo</label>
            <textarea
              formControlName="descripcion_hallazgo"
              class="form-control"
              rows="4"
              placeholder="Describa el hallazgo..."
            ></textarea>
          </div>

          <div class="form-group full-width">
            <label class="form-label">Causas del Hallazgo</label>
            <textarea
              formControlName="causas_hallazgo"
              class="form-control"
              rows="3"
              placeholder="Causas identificadas..."
            ></textarea>
          </div>
        </app-form-section>

        <app-form-section title="Subsanación" icon="fa-wrench">
          <div class="form-group">
            <label class="form-label">Responsable Subsanación</label>
            <input
              type="text"
              formControlName="responsable_subsanacion"
              class="form-control"
              placeholder="Nombre del responsable"
            />
          </div>

          <div class="form-group">
            <aero-date-picker
              [mode]="'single'"
              formControlName="fecha_subsanacion"
              label="Fecha Subsanación"
            ></aero-date-picker>
          </div>

          <div class="form-group">
            <label class="form-label">Estado</label>
            <select formControlName="estado" class="form-control">
              <option value="ABIERTO">Abierto</option>
              <option value="EN PROCESO">En Proceso</option>
              <option value="CERRADO">Cerrado</option>
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
export class InspeccionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(InspeccionSsomaService);
  private readonly errorHandler = inject(FormErrorHandlerService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  inspeccionId?: number;
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    this.inspeccionId = idParam ? parseInt(idParam, 10) : undefined;
    this.isEditMode = !!this.inspeccionId;
    this.initForm();
    if (this.isEditMode) this.loadInspeccion();
  }

  initForm(): void {
    this.form = this.fb.group({
      fecha_hallazgo: [''],
      lugar_hallazgo: [''],
      tipo_inspeccion: [''],
      inspector_dni: [''],
      inspector: [''],
      nivel_riesgo: [''],
      descripcion_hallazgo: [''],
      causas_hallazgo: [''],
      responsable_subsanacion: [''],
      fecha_subsanacion: [''],
      estado: ['ABIERTO'],
    });
  }

  loadInspeccion(): void {
    if (!this.inspeccionId) return;
    this.loading = true;
    this.service.getInspeccion(this.inspeccionId).subscribe({
      next: (inspeccion) => {
        this.form.patchValue({
          fecha_hallazgo: inspeccion.fecha_hallazgo ? inspeccion.fecha_hallazgo.split('T')[0] : '',
          lugar_hallazgo: inspeccion.lugar_hallazgo ?? '',
          tipo_inspeccion: inspeccion.tipo_inspeccion ?? '',
          inspector_dni: inspeccion.inspector_dni ?? '',
          inspector: inspeccion.inspector ?? '',
          nivel_riesgo: inspeccion.nivel_riesgo ?? '',
          descripcion_hallazgo: inspeccion.descripcion_hallazgo ?? '',
          causas_hallazgo: inspeccion.causas_hallazgo ?? '',
          responsable_subsanacion: inspeccion.responsable_subsanacion ?? '',
          fecha_subsanacion: inspeccion.fecha_subsanacion
            ? inspeccion.fecha_subsanacion.split('T')[0]
            : '',
          estado: inspeccion.estado ?? 'ABIERTO',
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
      this.isEditMode && this.inspeccionId
        ? this.service.updateInspeccion(this.inspeccionId, payload)
        : this.service.createInspeccion(payload);

    req.subscribe({
      next: (result) => {
        if (this.isEditMode && this.inspeccionId) {
          this.router.navigate(['/sst/inspecciones', this.inspeccionId]);
        } else {
          this.router.navigate(['/sst/inspecciones', result.id]);
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
    this.router.navigate(['/sst/inspecciones']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
