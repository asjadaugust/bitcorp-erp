import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContractService } from '../../core/services/contract.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { ProviderService } from '../../core/services/provider.service';
import { Contract } from '../../core/models/contract.model';
import { Equipment } from '../../core/models/equipment.model';
import { Provider } from '../../core/models/provider.model';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';

@Component({
  selector: 'app-contract-form',
  standalone: true,
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
      [title]="isEditMode ? 'Editar Contrato' : 'Nuevo Contrato'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del contrato'
          : 'Registrar un nuevo contrato en el sistema'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-plus'"
      [loading]="loading"
      [disableSubmit]="contractForm.invalid || loading"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Contrato'"
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

      <div class="mb-3"></div>

      <app-alert *ngIf="errorMessage" type="error" [message]="errorMessage" [dismissible]="true">
      </app-alert>

      <form [formGroup]="contractForm" class="form-grid">
        <!-- Section 1: Basic Information -->
        <div class="form-section full-width">
          <h3>Información del Contrato</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="numero_contrato">Número de Contrato *</label>
              <input
                id="numero_contrato"
                type="text"
                formControlName="numero_contrato"
                class="form-control"
                placeholder="ej. CTR-2025-001"
              />
              <div class="error-msg" *ngIf="hasError('numero_contrato')">Número es requerido</div>
            </div>

            <div class="form-group">
              <label for="fecha_contrato">Fecha de Contrato *</label>
              <input
                id="fecha_contrato"
                type="date"
                formControlName="fecha_contrato"
                class="form-control"
              />
              <div class="error-msg" *ngIf="hasError('fecha_contrato')">Fecha es requerida</div>
            </div>

            <div class="form-group">
              <label for="proveedor_id">Proveedor *</label>
              <app-dropdown
                formControlName="proveedor_id"
                [options]="providerOptions"
                [placeholder]="'Seleccione un proveedor'"
                [searchable]="true"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('proveedor_id')">Proveedor es requerido</div>
            </div>

            <div class="form-group">
              <label for="equipo_id">Equipo (Marca / Modelo / Placa) *</label>
              <app-dropdown
                formControlName="equipo_id"
                [options]="equipmentOptions"
                [placeholder]="'Seleccione un equipo'"
                [searchable]="true"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('equipo_id')">Equipo es requerido</div>
            </div>

            <div class="form-group">
              <label for="modalidad">Modalidad *</label>
              <app-dropdown
                formControlName="modalidad"
                [options]="modalidadOptions"
                [placeholder]="'Seleccionar...'"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('modalidad')">Modalidad es requerida</div>
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

        <!-- Section 2: Financial & Dates -->
        <div class="form-section full-width">
          <h3>Detalles Financieros y Fechas</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="fecha_inicio">Fecha de Inicio *</label>
              <input
                id="fecha_inicio"
                type="date"
                formControlName="fecha_inicio"
                class="form-control"
              />
              <div class="error-msg" *ngIf="hasError('fecha_inicio')">
                Fecha de inicio requerida
              </div>
            </div>

            <div class="form-group">
              <label for="fecha_fin">Fecha de Fin *</label>
              <input id="fecha_fin" type="date" formControlName="fecha_fin" class="form-control" />
              <div class="error-msg" *ngIf="hasError('fecha_fin')">Fecha de fin requerida</div>
              <div
                class="error-msg"
                *ngIf="
                  contractForm.hasError('dateRangeInvalid') &&
                  contractForm.get('fecha_fin')?.touched
                "
              >
                La fecha de fin debe ser posterior a la fecha de inicio
              </div>
            </div>

            <div class="form-group">
              <label for="moneda">Moneda *</label>
              <app-dropdown
                formControlName="moneda"
                [options]="monedaOptions"
                [placeholder]="'Seleccionar Moneda'"
              ></app-dropdown>
            </div>

            <div class="form-group">
              <label for="tipo_tarifa">Tipo de Tarifa *</label>
              <app-dropdown
                formControlName="tipo_tarifa"
                [options]="tipoTarifaOptions"
                [placeholder]="'Seleccionar Tipo'"
              ></app-dropdown>
            </div>

            <div class="form-group">
              <label for="tarifa">Tarifa *</label>
              <input
                id="tarifa"
                type="number"
                formControlName="tarifa"
                class="form-control"
                placeholder="0.00"
              />
              <div class="error-msg" *ngIf="hasError('tarifa')">Tarifa es requerida</div>
            </div>

            <div class="form-group">
              <label for="horas_incluidas">Horas Incluidas</label>
              <input
                id="horas_incluidas"
                type="number"
                formControlName="horas_incluidas"
                class="form-control"
                placeholder="0"
              />
            </div>

            <div class="form-group">
              <label for="penalidad_exceso">Penalidad por Exceso (%)</label>
              <input
                id="penalidad_exceso"
                type="number"
                formControlName="penalidad_exceso"
                class="form-control"
                placeholder="0.00"
              />
            </div>

            <!-- New Fields: Service Inclusions -->
            <div class="form-group checkbox-group full-width">
              <label>
                <input type="checkbox" formControlName="incluye_motor" />
                Incluye Motor
              </label>
              <label>
                <input type="checkbox" formControlName="incluye_operador" />
                Incluye Operador
              </label>
            </div>

            <div class="form-group" *ngIf="contractForm.get('incluye_motor')?.value === false">
              <label for="costo_adicional_motor">Costo Adicional Motor</label>
              <input
                id="costo_adicional_motor"
                type="number"
                formControlName="costo_adicional_motor"
                class="form-control"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <!-- Section 3: Document Attachment -->
        <div class="form-section full-width">
          <h3>Documento del Contrato</h3>
          <div class="section-grid">
            <div class="form-group full-width">
              <label>Adjuntar Contrato Firmado</label>
              <div class="file-upload-area">
                <input
                  type="file"
                  id="contract_document"
                  (change)="onContractFileSelected($event)"
                  accept=".pdf,.doc,.docx"
                  class="file-input"
                />
                <label for="contract_document" class="file-upload-label">
                  <i class="fa-solid fa-cloud-upload"></i>
                  <span *ngIf="!contractFileName"
                    >Haga clic para seleccionar archivo o arrastre aquí</span
                  >
                  <span *ngIf="contractFileName" class="file-name">
                    <i class="fa-solid fa-file-pdf"></i> {{ contractFileName }}
                  </span>
                </label>
                <small class="file-hint">Formatos aceptados: PDF, DOC, DOCX (máx. 10MB)</small>
              </div>
            </div>

            <div class="form-group full-width">
              <label for="condiciones_especiales">Condiciones Especiales</label>
              <textarea
                id="condiciones_especiales"
                formControlName="condiciones_especiales"
                class="form-control"
                rows="4"
                placeholder="Términos, limitaciones, restricciones especiales del contrato..."
              ></textarea>
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

      .checkbox-group {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 2rem;
        padding-top: 0.5rem;
      }

      .checkbox-group label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 14px;
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

      @media (max-width: 768px) {
        .section-grid {
          grid-template-columns: 1fr;
        }
      }

      /* File Upload Styles */
      .file-upload-area {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .file-input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
      }

      .file-upload-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        border: 2px dashed var(--grey-300);
        border-radius: 8px;
        background: var(--grey-50);
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
        color: var(--grey-600);
      }

      .file-upload-label:hover {
        border-color: var(--primary-500);
        background: var(--primary-50);
      }

      .file-upload-label i {
        font-size: 32px;
        margin-bottom: 0.5rem;
        color: var(--primary-500);
      }

      .file-name {
        color: var(--primary-700);
        font-weight: 500;
      }

      .file-name i {
        font-size: 16px;
        margin-right: 0.5rem;
      }

      .file-hint {
        color: var(--grey-500);
        font-size: 12px;
      }
    `,
  ],
})
export class ContractFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contractService = inject(ContractService);
  private equipmentService = inject(EquipmentService);
  private providerService = inject(ProviderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(FormErrorHandlerService);

  contractForm: FormGroup;
  isEditMode = false;
  loading = false;
  contractId: string | null = null;
  equipmentList: Equipment[] = [];
  providerList: Provider[] = [];
  contractFileName: string = '';
  contractFile: File | null = null;
  validationErrors: ValidationError[] = [];
  errorMessage = '';

  // Dropdown Options
  equipmentOptions: { label: string; value: any }[] = [];
  providerOptions: { label: string; value: any }[] = [];

  modalidadOptions = [
    { label: 'Alquiler Seco', value: 'alquiler_seco' },
    { label: 'Alquiler con Operador', value: 'alquiler_con_operador' },
    { label: 'Alquiler Todo Costo', value: 'alquiler_todo_costo' },
    { label: 'Servicio', value: 'servicio' },
  ];

  estadoOptions = [
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Completado', value: 'COMPLETADO' },
    { label: 'Cancelado', value: 'CANCELADO' },
  ];

  monedaOptions = [
    { label: 'Soles (PEN)', value: 'PEN' },
    { label: 'Dólares (USD)', value: 'USD' },
  ];

  tipoTarifaOptions = [
    { label: 'Por Hora', value: 'POR_HORA' },
    { label: 'Por Día', value: 'POR_DIA' },
    { label: 'Fijo', value: 'FIJO' },
  ];

  fieldLabels: Record<string, string> = {
    numero_contrato: 'Número de Contrato',
    fecha_contrato: 'Fecha de Contrato',
    equipo_id: 'Equipo',
    proveedor_id: 'Proveedor',
    modalidad: 'Modalidad',
    fecha_inicio: 'Fecha de Inicio',
    fecha_fin: 'Fecha de Fin',
    moneda: 'Moneda',
    tipo_tarifa: 'Tipo de Tarifa',
    tarifa: 'Tarifa',
    horas_incluidas: 'Horas Incluidas',
    penalidad_exceso: 'Penalidad por Exceso',
    incluye_motor: 'Incluye Motor',
    incluye_operador: 'Incluye Operador',
    costo_adicional_motor: 'Costo Adicional Motor',
    condiciones_especiales: 'Condiciones Especiales',
    estado: 'Estado',
  };

  constructor() {
    this.contractForm = this.fb.group(
      {
        numero_contrato: ['', Validators.required],
        fecha_contrato: [new Date().toISOString().split('T')[0], Validators.required],
        equipo_id: ['', Validators.required],
        proveedor_id: ['', Validators.required],
        modalidad: ['', Validators.required],
        fecha_inicio: ['', Validators.required],
        fecha_fin: ['', Validators.required],
        moneda: ['PEN', Validators.required],
        tipo_tarifa: ['POR_HORA', Validators.required],
        tarifa: [null, [Validators.required, Validators.min(0)]],
        horas_incluidas: [0, Validators.min(0)],
        penalidad_exceso: [null, Validators.min(0)],
        incluye_motor: [false],
        incluye_operador: [false],
        costo_adicional_motor: [0, Validators.min(0)],
        condiciones_especiales: [''],
        estado: ['ACTIVO', Validators.required],
        tipo: ['CONTRATO'], // Default to CONTRATO
      },
      { validators: this.dateRangeValidator }
    );
  }

  onContractFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.contractFile = file;
      this.contractFileName = file.name;
    }
  }

  ngOnInit(): void {
    this.loadEquipment();
    this.loadProviders();

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.contractId = params['id'];
        this.loadContract(this.contractId!);
      }
    });
  }

  loadEquipment(): void {
    this.equipmentService.getAll().subscribe({
      next: (response) => {
        this.equipmentList = response.data;
        this.equipmentOptions = this.equipmentList.map((eq) => ({
          label: `${eq.marca} ${eq.modelo} / ${eq.placa || 'Sin Placa'} (${eq.codigo_equipo})`,
          value: eq.id,
        }));
      },
      error: (err) => console.error('Error loading equipment', err),
    });
  }

  loadProviders(): void {
    this.providerService.getAll().subscribe({
      next: (data) => {
        this.providerList = data;
        this.providerOptions = this.providerList.map((prov) => ({
          label: `${prov.razon_social} (${prov.ruc})`,
          value: prov.id,
        }));
      },
      error: (err) => console.error('Error loading providers', err),
    });
  }

  loadContract(id: string): void {
    this.loading = true;
    this.contractService.getById(id).subscribe({
      next: (contract) => {
        // Format dates for input[type="date"]
        const formatDate = (dateStr: string) => (dateStr ? dateStr.split('T')[0] : '');

        this.contractForm.patchValue({
          ...contract,
          fecha_contrato: formatDate(contract.fecha_contrato),
          fecha_inicio: formatDate(contract.fecha_inicio),
          fecha_fin: formatDate(contract.fecha_fin),
          proveedor_id: contract.proveedor_id ? contract.proveedor_id.toString() : '',
          equipo_id: contract.equipo_id ? contract.equipo_id.toString() : '',
          tarifa: contract.tarifa,
          horas_incluidas: contract.horas_incluidas,
          penalidad_exceso: contract.penalidad_exceso,
          costo_adicional_motor: contract.costo_adicional_motor,
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading contract', err);
        this.loading = false;
        this.router.navigate(['/equipment/contracts']);
      },
    });
  }

  onSubmit(): void {
    if (this.contractForm.invalid) return;

    this.loading = true;
    const contractData = this.contractForm.value;

    const request$ =
      this.isEditMode && this.contractId
        ? this.contractService.update(this.contractId, contractData)
        : this.contractService.create(contractData);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/equipment/contracts']);
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/equipment/contracts']);
  }

  hasError(field: string): boolean {
    const control = this.contractForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
    const start = group.get('fecha_inicio')?.value;
    const end = group.get('fecha_fin')?.value;

    if (start && end && new Date(start) > new Date(end)) {
      return { dateRangeInvalid: true };
    }
    return null;
  }
}
