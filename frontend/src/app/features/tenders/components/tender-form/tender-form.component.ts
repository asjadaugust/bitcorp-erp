import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TenderService } from '../../services/tender.service';
import {
  EstadoStateMachineService,
  EstadoLicitacion,
  EstadoOption,
} from '../../../../core/services/estado-state-machine.service';

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
  selector: 'app-tender-form',
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
      [icon]="isEditMode ? 'fa-pen' : 'fa-gavel'"
      [title]="isEditMode ? 'Editar Licitación' : 'Nueva Licitación'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información de la licitación'
          : 'Registrar una nueva licitación en el sistema'
      "
      submitLabel="Guardar Licitación"
      submitIcon="fa-save"
      [loading]="loading"
      [disableSubmit]="form.invalid || loading"
      (onSubmit)="onSubmit()"
      (onCancel)="onCancel()"
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
        <!-- Section 1: Basic Information -->
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-gavel"></i> Información Básica</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="codigo">Código *</label>
              <input
                id="codigo"
                type="text"
                formControlName="codigo"
                class="form-control"
                placeholder="Ej: LIC-2025-001"
              />
              <div class="error-msg" *ngIf="hasError('codigo')">Código es requerido</div>
            </div>

            <div class="form-group">
              <label for="nombre">Nombre *</label>
              <input
                id="nombre"
                type="text"
                formControlName="nombre"
                class="form-control"
                placeholder="Nombre de la licitación"
              />
              <div class="error-msg" *ngIf="hasError('nombre')">Nombre es requerido</div>
            </div>

            <div class="form-group">
              <label for="entidad_convocante">Entidad Convocante *</label>
              <input
                id="entidad_convocante"
                type="text"
                formControlName="entidad_convocante"
                class="form-control"
                placeholder="Entidad contratante"
              />
              <div class="error-msg" *ngIf="hasError('entidad_convocante')">
                Entidad es requerida
              </div>
            </div>

            <div class="form-group">
              <label for="monto_referencial">Monto Referencial *</label>
              <input
                id="monto_referencial"
                type="number"
                formControlName="monto_referencial"
                class="form-control"
                step="0.01"
                placeholder="0.00"
              />
              <div class="error-msg" *ngIf="hasError('monto_referencial')">Monto es requerido</div>
            </div>
          </div>
        </div>

        <!-- Section 2: Dates & Status -->
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-calendar-days"></i> Fechas y Estado</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="fecha_convocatoria">Fecha Convocatoria</label>
              <input
                id="fecha_convocatoria"
                type="date"
                formControlName="fecha_convocatoria"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="fecha_presentacion">Fecha Presentación *</label>
              <input
                id="fecha_presentacion"
                type="date"
                formControlName="fecha_presentacion"
                class="form-control"
              />
              <div class="error-msg" *ngIf="hasError('fecha_presentacion')">Fecha es requerida</div>
            </div>

            <div class="form-group">
              <label for="estado">Estado *</label>
              <app-dropdown
                formControlName="estado"
                [options]="availableEstados"
                [disabled]="isEstadoDisabled"
                [error]="hasError('estado')"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('estado')">Estado es requerido</div>
              <div class="info-msg" *ngIf="terminalStateMessage">
                <i class="fa-solid fa-info-circle"></i>
                {{ terminalStateMessage }}
              </div>
              <div class="info-msg" *ngIf="isEditMode && !isTerminalState">
                <i class="fa-solid fa-arrow-right"></i>
                Transiciones válidas: {{ validTransitionsText }}
              </div>
            </div>

            <div class="form-group full-width">
              <label for="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                formControlName="observaciones"
                class="form-control"
                rows="3"
                placeholder="Observaciones adicionales..."
              ></textarea>
            </div>
          </div>
        </div>
      </form>
    </app-form-container>
  `,
  styles: [],
})
export class TenderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tenderService = inject(TenderService);
  private estadoStateMachine = inject(EstadoStateMachineService);
  private errorHandler = inject(FormErrorHandlerService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  tenderId?: string;
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  // Estado state machine properties
  currentEstado?: EstadoLicitacion;
  availableEstados: EstadoOption[] = [];
  isEstadoDisabled = false;
  estadoTooltip = '';
  terminalStateMessage = '';
  validTransitionsText = '';
  isTerminalState = false;

  ngOnInit() {
    this.tenderId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.tenderId;
    this.initForm();
    this.updateAvailableEstados(); // Set initial estados for create mode
    if (this.isEditMode) this.loadTender();
  }

  initForm() {
    this.form = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      entidad_convocante: ['', Validators.required],
      monto_referencial: ['', Validators.required],
      fecha_convocatoria: [''],
      fecha_presentacion: ['', Validators.required],
      estado: ['PUBLICADO', Validators.required],
      observaciones: [''],
    });
  }

  loadTender() {
    if (!this.tenderId) return;
    this.loading = true;
    this.tenderService.getTender(this.tenderId).subscribe({
      next: (tender) => {
        // Store current estado before patching form
        this.currentEstado = tender.estado as EstadoLicitacion;

        this.form.patchValue({
          codigo: tender.codigo,
          nombre: tender.nombre,
          entidad_convocante: tender.entidad_convocante,
          monto_referencial: tender.monto_referencial,
          fecha_convocatoria: tender.fecha_convocatoria,
          fecha_presentacion: tender.fecha_presentacion,
          estado: tender.estado,
          observaciones: tender.observaciones,
        });

        // Update available estados based on current estado
        this.updateAvailableEstados();

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        console.error('Error loading tender', err);
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
      this.isEditMode && this.tenderId
        ? this.tenderService.updateTender(this.tenderId, this.form.value)
        : this.tenderService.createTender(this.form.value);

    req.subscribe({
      next: () => {
        this.router.navigate(['/licitaciones']);
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        console.error('Error saving tender', err);
      },
    });
  }

  onCancel() {
    this.router.navigate(['/licitaciones']);
  }

  hasError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Update available estados based on current estado and edit mode
   */
  private updateAvailableEstados() {
    this.availableEstados = this.estadoStateMachine.getAvailableEstados(
      this.currentEstado,
      this.isEditMode
    );

    // Check if current estado is terminal
    if (this.currentEstado) {
      this.isTerminalState = this.estadoStateMachine.isTerminalState(this.currentEstado);
      this.isEstadoDisabled = this.isTerminalState;
      this.terminalStateMessage = this.isTerminalState
        ? this.estadoStateMachine.getTerminalStateMessage(this.currentEstado)
        : '';

      // Disable/enable the form control programmatically
      if (this.isTerminalState) {
        this.form.get('estado')?.disable();
      } else {
        this.form.get('estado')?.enable();
      }

      // Build valid transitions text
      const validTransitions = this.estadoStateMachine.getValidTransitions(this.currentEstado);
      this.validTransitionsText =
        validTransitions.length > 0
          ? validTransitions.map((e) => this.estadoStateMachine.getEstadoLabel(e)).join(', ')
          : 'ninguna (estado final)';

      this.estadoTooltip = this.isTerminalState
        ? 'No se puede cambiar el estado porque es un estado final'
        : 'Selecciona un nuevo estado';
    } else {
      // Create mode: all estados available
      this.isEstadoDisabled = false;
      this.form.get('estado')?.enable();
      this.estadoTooltip = 'Selecciona el estado inicial de la licitación';
      this.terminalStateMessage = '';
      this.validTransitionsText = '';
      this.isTerminalState = false;
    }
  }
}
