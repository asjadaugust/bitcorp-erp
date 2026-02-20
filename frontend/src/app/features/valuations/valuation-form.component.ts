import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ValuationService } from '../../core/services/valuation.service';
import { ContractService } from '../../core/services/contract.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { Valuation } from '../../core/models/valuation.model';
import { Contract } from '../../core/models/contract.model';
import { Equipment } from '../../core/models/equipment.model';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-valuation-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormContainerComponent,
    ValidationErrorsComponent,
    AlertComponent,
    DropdownComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Valorización' : 'Nueva Valorización'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información de la valorización'
          : 'Registrar nueva valorización de proyecto'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-calculator'"
      [loading]="loading"
      [disableSubmit]="valuationForm.invalid || loading"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Valorización'"
      (onSubmit)="onSubmit()"
      (onCancel)="cancel()"
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

      <form [formGroup]="valuationForm" class="form-grid">
        <!-- Section 1: Contract & Equipment Information -->
        <div class="form-section full-width">
          <h3 class="section-title">
            <i class="fa-solid fa-file-invoice-dollar"></i> Información General
          </h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="contract">Contrato</label>
              <app-dropdown
                formControlName="contratoId"
                [options]="contractOptions"
                [placeholder]="'Seleccionar Contrato (Opcional)'"
                [searchable]="true"
              ></app-dropdown>
            </div>

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
              <label for="estado">Estado *</label>
              <app-dropdown
                formControlName="estado"
                [options]="estadoOptions"
                [placeholder]="'Seleccionar Estado'"
              ></app-dropdown>
            </div>
          </div>
        </div>

        <!-- Section 2: Period & Financial Details -->
        <div class="form-section full-width">
          <h3 class="section-title">
            <i class="fa-solid fa-calendar-days"></i> Periodo y Detalles Financieros
          </h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="periodo">Periodo *</label>
              <input id="periodo" type="month" formControlName="periodo" class="form-control" />
              <div class="error-msg" *ngIf="hasError('periodo')">Periodo es requerido</div>
            </div>

            <div class="form-group">
              <label for="fechaInicio">Fecha Inicio del Periodo *</label>
              <input
                id="fechaInicio"
                type="date"
                formControlName="fechaInicio"
                class="form-control"
              />
              <div class="error-msg" *ngIf="hasError('fechaInicio')">Fecha de inicio requerida</div>
            </div>

            <div class="form-group">
              <label for="fechaFin">Fecha Fin del Periodo *</label>
              <input id="fechaFin" type="date" formControlName="fechaFin" class="form-control" />
              <div class="error-msg" *ngIf="hasError('fechaFin')">Fecha de fin requerida</div>
            </div>

            <div class="form-group">
              <label for="totalValorizado">Total Valorizado (S/) *</label>
              <div class="input-group">
                <input
                  id="totalValorizado"
                  type="number"
                  formControlName="totalValorizado"
                  class="form-control"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  class="btn-sm btn-secondary"
                  (click)="calculateValuation()"
                  [disabled]="loading"
                  title="Calcular automáticamente"
                >
                  <i class="fa-solid fa-calculator"></i>
                </button>
              </div>
              <div class="error-msg" *ngIf="hasError('totalValorizado')">Monto es requerido</div>
            </div>

            <div class="form-group">
              <label for="cargosAdicionales">Cargos Adicionales (S/)</label>
              <input
                id="cargosAdicionales"
                type="number"
                formControlName="cargosAdicionales"
                class="form-control"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="importeManipuleo">Importe Manipuleo (S/)</label>
              <input
                id="importeManipuleo"
                type="number"
                formControlName="importeManipuleo"
                class="form-control"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="importeGastoObra">Gasto en Obra (S/)</label>
              <input
                id="importeGastoObra"
                type="number"
                formControlName="importeGastoObra"
                class="form-control"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="importeAdelanto">Amortización Adelanto (S/)</label>
              <input
                id="importeAdelanto"
                type="number"
                formControlName="importeAdelanto"
                class="form-control"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="importeExcesoCombustible">Exceso Combustible (S/)</label>
              <input
                id="importeExcesoCombustible"
                type="number"
                formControlName="importeExcesoCombustible"
                class="form-control"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="numeroValorizacion">N° Valorización</label>
              <input
                id="numeroValorizacion"
                type="text"
                formControlName="numeroValorizacion"
                class="form-control"
                placeholder="ej. VAL-001"
              />
            </div>
          </div>
        </div>
      </form>
    </app-form-container>
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

      .input-group {
        position: relative;
        display: flex;
        align-items: center;
      }
      .input-group .form-control {
        flex: 1;
        padding-right: 2.5rem;
      }

      .input-group button {
        position: absolute;
        right: 0.5rem;
        background: none;
        border: none;
        color: var(--grey-500);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        transition: color 0.2s;
      }

      .input-group button:hover:not(:disabled) {
        color: var(--primary-600);
      }

      .input-group button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .error-msg {
        color: var(--semantic-red-600);
        font-size: 12px;
        margin-top: 0.25rem;
      }

      @media (max-width: 768px) {
        .section-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ValuationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private valuationService = inject(ValuationService);
  private contractService = inject(ContractService);
  private equipmentService = inject(EquipmentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(FormErrorHandlerService);

  valuationForm: FormGroup;
  isEditMode = false;
  loading = false;
  valuationId: string | null = null;
  contracts: Contract[] = [];
  equipments: Equipment[] = [];
  validationErrors: ValidationError[] = [];
  errorMessage = '';

  // Dropdown Options
  contractOptions: { label: string; value: any }[] = [];
  equipmentOptions: { label: string; value: any }[] = [];

  estadoOptions = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'En Revisión', value: 'EN_REVISION' },
    { label: 'Aprobado', value: 'APROBADO' },
    { label: 'Rechazado', value: 'RECHAZADO' },
    { label: 'Pagado', value: 'PAGADO' },
    { label: 'Eliminado', value: 'ELIMINADO' },
  ];

  fieldLabels: Record<string, string> = {
    contratoId: 'Contrato',
    equipoId: 'Equipo',
    fechaInicio: 'Fecha Inicio',
    fechaFin: 'Fecha Fin',
    totalValorizado: 'Total Valorizado',
    estado: 'Estado',
    numeroValorizacion: 'N° Valorización',
    periodo: 'Periodo',
  };

  constructor() {
    this.valuationForm = this.fb.group({
      contratoId: [null],
      equipoId: [null, Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      periodo: ['', Validators.required],
      totalValorizado: [0, [Validators.required, Validators.min(0)]],
      cargosAdicionales: [0, [Validators.min(0)]],
      importeManipuleo: [0, [Validators.min(0)]],
      importeGastoObra: [0, [Validators.min(0)]],
      importeAdelanto: [0, [Validators.min(0)]],
      importeExcesoCombustible: [0, [Validators.min(0)]],
      estado: ['PENDIENTE', Validators.required],
      numeroValorizacion: [''],
    });

    // Auto-set period when start date changes if period is empty
    this.valuationForm.get('fechaInicio')?.valueChanges.subscribe((date) => {
      const currentPeriod = this.valuationForm.get('periodo')?.value;
      if (date && !currentPeriod) {
        // date is typically YYYY-MM-DD
        const period = date.substring(0, 7); // YYYY-MM
        this.valuationForm.patchValue({ periodo: period });
      }
    });
  }

  ngOnInit(): void {
    this.loadContracts();
    this.loadEquipments();

    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id && id !== 'undefined' && id !== 'NaN') {
        this.isEditMode = true;
        this.valuationId = id;
        this.loadValuation(id);
      } else if (id === 'undefined' || id === 'NaN') {
        this.router.navigate(['/equipment/valuations']);
      }
    });
  }

  loadContracts(): void {
    this.contractService.getAll().subscribe((data) => {
      this.contracts = data;
      this.contractOptions = this.contracts.map((c) => ({
        label: `${c.numero_contrato} - ${c.proveedor_razon_social || 'Sin Proveedor'}`,
        value: c.id,
      }));
    });
  }

  loadEquipments(): void {
    this.equipmentService.getAll().subscribe((response) => {
      if (response && response.data) {
        this.equipments = response.data;
      } else if (Array.isArray(response)) {
        this.equipments = response;
      } else {
        this.equipments = [];
      }

      this.equipmentOptions = this.equipments.map((eq) => ({
        label: `${eq.codigo_equipo} - ${eq.marca} ${eq.modelo}`,
        value: eq.id,
      }));
    });
  }

  loadValuation(id: string | number): void {
    this.loading = true;
    this.valuationService.getById(id).subscribe({
      next: (valuation) => {
        // Format dates
        const formatDate = (dateStr: string) => (dateStr ? dateStr.split('T')[0] : '');

        this.valuationForm.patchValue({
          ...valuation,
          contratoId: valuation.contratoId,
          equipoId: valuation.equipoId,
          fechaInicio: formatDate(valuation.fechaInicio),
          fechaFin: formatDate(valuation.fechaFin),
          periodo: valuation.periodo,
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading valuation', err);
        this.loading = false;
        this.router.navigate(['/equipment/valuations']);
      },
    });
  }

  onSubmit(): void {
    if (this.valuationForm.invalid) {
      console.warn('Form is invalid, but continuing for debug...');
    }

    this.loading = true;
    const rawValue = this.valuationForm.getRawValue();
    // Exclude 'id' from the form value to prevent backend validation errors
    const { id, ...formValue } = rawValue;

    // Prepare data with correct types
    const valuationData: Partial<Valuation> = {
      ...formValue,
      contratoId: formValue.contratoId ? Number(formValue.contratoId) : null,
      equipoId: Number(formValue.equipoId),
      totalValorizado: Number(formValue.totalValorizado),
      cargosAdicionales: Number(formValue.cargosAdicionales || 0),
      importeManipuleo: Number(formValue.importeManipuleo || 0),
      importeGastoObra: Number(formValue.importeGastoObra || 0),
      importeAdelanto: Number(formValue.importeAdelanto || 0),
      importeExcesoCombustible: Number(formValue.importeExcesoCombustible || 0),
      // Ensure periodo is set
      periodo: formValue.periodo || formValue.fechaInicio.substring(0, 7),
    };

    const request$ =
      this.isEditMode && this.valuationId
        ? this.valuationService.update(this.valuationId, valuationData)
        : this.valuationService.create(valuationData);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/equipment/valuations']);
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/equipment/valuations']);
  }

  hasError(field: string): boolean {
    const control = this.valuationForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  calculateValuation(): void {
    const contractId = this.valuationForm.get('contratoId')?.value;
    const fechaInicio = this.valuationForm.get('fechaInicio')?.value;

    if (!contractId || !fechaInicio) {
      alert('Seleccione un contrato y fecha de inicio para calcular');
      return;
    }

    const date = new Date(fechaInicio);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    this.loading = true;
    this.valuationService.calculate({ contrato_id: contractId, month, year }).subscribe({
      next: (response) => {
        if (response.success) {
          this.valuationForm.patchValue({
            totalValorizado: response.data.total_estimated,
          });
          alert(
            `Cálculo completado:\n` +
              `Horas: ${response.data.total_hours}\n` +
              `Días: ${response.data.total_days}\n` +
              `Combustible: ${response.data.total_fuel}\n` +
              `Costo Base: ${response.data.base_cost}\n` +
              `Exceso: ${response.data.excess_cost}`
          );
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error calculating', err);
        alert(
          'Error al calcular valorización. Verifique que existan partes diarios aprobados para este periodo.'
        );
        this.loading = false;
      },
    });
  }
}
