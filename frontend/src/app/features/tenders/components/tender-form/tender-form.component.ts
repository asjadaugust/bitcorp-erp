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
  ],
  template: `
    <div class="form-container">
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

      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fa-solid" [class.fa-plus]="!isEditMode" [class.fa-pen]="isEditMode"></i>
          </div>
          <div class="title-group">
            <h1>{{ isEditMode ? 'Editar Licitación' : 'Nueva Licitación' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información de la licitación'
                  : 'Registrar una nueva licitación en el sistema'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="onCancel()">Cancelar</button>
          <button class="btn btn-primary" (click)="onSubmit()" [disabled]="form.invalid || loading">
            <i class="fa-solid fa-save"></i>
            {{ isEditMode ? 'Guardar Cambios' : 'Crear Licitación' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="form" class="form-grid">
          <!-- Section 1: Basic Information -->
          <div class="form-section full-width">
            <h3>Información Básica</h3>
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
                <div class="error-msg" *ngIf="hasError('monto_referencial')">
                  Monto es requerido
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Dates & Status -->
          <div class="form-section full-width">
            <h3>Fechas y Estado</h3>
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
                <div class="error-msg" *ngIf="hasError('fecha_presentacion')">
                  Fecha es requerida
                </div>
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
      .title-group .subtitle {
        margin: 0.25rem 0 0 0;
        font-size: 14px;
        color: var(--grey-600);
      }
      .header-actions {
        display: flex;
        gap: 0.75rem;
      }

      /* Card */
      .card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .form-card {
        padding: 2rem;
      }

      /* Form Layout */
      .form-section {
        margin-bottom: 2rem;
      }
      .form-section:last-child {
        margin-bottom: 0;
      }
      .form-section h3 {
        margin: 0 0 1.5rem 0;
        font-size: 18px;
        color: var(--grey-900);
        font-weight: 600;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--grey-200);
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
      }
      .form-group label {
        font-size: 14px;
        font-weight: 500;
        color: var(--grey-700);
        margin-bottom: 0.5rem;
      }
      .form-control,
      .form-select {
        padding: 0.625rem 0.75rem;
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.2s;
      }
      .form-control:focus,
      .form-select:focus {
        outline: none;
        border-color: var(--primary-500);
      }
      .form-control.ng-invalid.ng-touched,
      .form-select.ng-invalid.ng-touched {
        border-color: var(--error-500);
      }
      .error-msg {
        color: var(--error-500);
        font-size: 13px;
        margin-top: 0.25rem;
      }
      .info-msg {
        color: var(--primary-600);
        font-size: 13px;
        margin-top: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: var(--primary-50);
        border-radius: 4px;
      }
      .info-msg i {
        flex-shrink: 0;
      }
      textarea.form-control {
        resize: vertical;
        min-height: 80px;
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
