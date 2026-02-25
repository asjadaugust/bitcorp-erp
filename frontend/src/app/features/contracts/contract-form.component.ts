import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContractService } from '../../core/services/contract.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { ProviderService } from '../../core/services/provider.service';
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
    FormsModule,
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
          <h3 class="section-title">
            <i class="fa-solid fa-file-contract"></i> Información del Contrato
          </h3>
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

        <!-- Section: Ownership Proof & Jurisdiction -->
        <div class="form-section full-width">
          <h3 class="section-title">
            <i class="fa-solid fa-shield-halved"></i> Propiedad del Equipo y Jurisdicción
          </h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="documento_acredita">Documento que Acredita Propiedad</label>
              <input
                id="documento_acredita"
                type="text"
                formControlName="documento_acredita"
                class="form-control"
                placeholder="ej. Tarjeta de Propiedad, Factura"
              />
            </div>

            <div class="form-group">
              <label for="fecha_acreditada">Fecha del Documento</label>
              <input
                id="fecha_acreditada"
                type="date"
                formControlName="fecha_acreditada"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="jurisdiccion">Jurisdicción</label>
              <input
                id="jurisdiccion"
                type="text"
                formControlName="jurisdiccion"
                class="form-control"
                placeholder="ej. Lima, Cusco"
              />
            </div>

            <div class="form-group">
              <label for="plazo_texto">Plazo (texto)</label>
              <input
                id="plazo_texto"
                type="text"
                formControlName="plazo_texto"
                class="form-control"
                placeholder="ej. 6 meses"
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Financial & Dates -->
        <div class="form-section full-width">
          <h3 class="section-title">
            <i class="fa-solid fa-dollar-sign"></i> Detalles Financieros y Fechas
          </h3>
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

        <!-- Section: ANEXO A - Tariff Inclusions -->
        <div class="form-section full-width" *ngIf="isEditMode">
          <h3 class="section-title">
            <i class="fa-solid fa-list-check"></i> Anexo A — Inclusiones de Tarifa
          </h3>
          <div class="annex-editor">
            <div class="annex-row annex-header">
              <span class="annex-concept">Concepto</span>
              <span class="annex-included">Incluido</span>
              <span class="annex-obs">Observaciones</span>
              <span class="annex-actions"></span>
            </div>
            <div class="annex-row" *ngFor="let item of annexA; let i = index">
              <input
                class="form-control annex-concept"
                [(ngModel)]="item.concepto"
                [ngModelOptions]="{ standalone: true }"
                placeholder="ej. Combustible, Operador"
              />
              <label class="annex-included checkbox-inline">
                <input
                  type="checkbox"
                  [(ngModel)]="item.incluido"
                  [ngModelOptions]="{ standalone: true }"
                />
              </label>
              <input
                class="form-control annex-obs"
                [(ngModel)]="item.observaciones"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Notas..."
              />
              <button
                type="button"
                class="btn btn-icon btn-danger-ghost"
                (click)="removeAnnexItem('A', i)"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" (click)="addAnnexItem('A')">
              <i class="fa-solid fa-plus"></i> Agregar ítem
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              style="margin-left: 8px"
              (click)="saveAnnex('A')"
              [disabled]="savingAnnexA"
            >
              <i class="fa-solid fa-save"></i> Guardar Anexo A
            </button>
          </div>
        </div>

        <!-- Section: ANEXO B - Valuation Conditions -->
        <div class="form-section full-width" *ngIf="isEditMode">
          <h3 class="section-title">
            <i class="fa-solid fa-calculator"></i> Anexo B — Condiciones de Valorización
          </h3>
          <div class="annex-editor">
            <div class="annex-row annex-header">
              <span class="annex-concept">Concepto</span>
              <span class="annex-included">Incluido</span>
              <span class="annex-obs">Observaciones</span>
              <span class="annex-actions"></span>
            </div>
            <div class="annex-row" *ngFor="let item of annexB; let i = index">
              <input
                class="form-control annex-concept"
                [(ngModel)]="item.concepto"
                [ngModelOptions]="{ standalone: true }"
                placeholder="ej. Partes Diarios, Conformidad"
              />
              <label class="annex-included checkbox-inline">
                <input
                  type="checkbox"
                  [(ngModel)]="item.incluido"
                  [ngModelOptions]="{ standalone: true }"
                />
              </label>
              <input
                class="form-control annex-obs"
                [(ngModel)]="item.observaciones"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Notas..."
              />
              <button
                type="button"
                class="btn btn-icon btn-danger-ghost"
                (click)="removeAnnexItem('B', i)"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" (click)="addAnnexItem('B')">
              <i class="fa-solid fa-plus"></i> Agregar ítem
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              style="margin-left: 8px"
              (click)="saveAnnex('B')"
              [disabled]="savingAnnexB"
            >
              <i class="fa-solid fa-save"></i> Guardar Anexo B
            </button>
          </div>
        </div>

        <!-- Section 3: Document Attachment -->
        <div class="form-section full-width">
          <h3 class="section-title">
            <i class="fa-solid fa-paperclip"></i> Documento del Contrato
          </h3>
          <div class="section-grid">
            <div class="form-group full-width">
              <span class="label">Adjuntar Contrato Firmado</span>
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

      /* Annex Editor */
      .annex-editor {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .annex-row {
        display: grid;
        grid-template-columns: 1fr 60px 1fr 40px;
        gap: 0.75rem;
        align-items: center;
      }

      .annex-header {
        font-size: 12px;
        font-weight: 600;
        color: var(--grey-500);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding-bottom: 0.25rem;
        border-bottom: 1px solid var(--grey-200);
      }

      .checkbox-inline {
        display: flex;
        justify-content: center;
      }

      .btn-icon {
        width: 32px;
        height: 32px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--grey-500);
        border-radius: 4px;
      }

      .btn-icon:hover {
        background: var(--semantic-red-50);
        color: var(--semantic-red-600);
      }

      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 13px;
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
  contractFileName = '';
  contractFile: File | null = null;
  validationErrors: ValidationError[] = [];
  errorMessage = '';

  // Annex data
  annexA: { concepto: string; incluido: boolean; observaciones: string }[] = [];
  annexB: { concepto: string; incluido: boolean; observaciones: string }[] = [];
  savingAnnexA = false;
  savingAnnexB = false;

  // Dropdown Options
  equipmentOptions: { label: string; value: string | number | null }[] = [];
  providerOptions: { label: string; value: string | number | null }[] = [];

  modalidadOptions = [
    { label: 'Alquiler Seco', value: 'alquiler_seco' },
    { label: 'Alquiler con Operador', value: 'alquiler_con_operador' },
    { label: 'Alquiler Todo Costo', value: 'alquiler_todo_costo' },
    { label: 'Servicio', value: 'servicio' },
  ];

  estadoOptions = [
    { label: 'Borrador', value: 'BORRADOR' },
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Vencido', value: 'VENCIDO' },
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
        documento_acredita: [''],
        fecha_acreditada: [''],
        jurisdiccion: [''],
        plazo_texto: [''],
        estado: ['BORRADOR', Validators.required],
        tipo: ['CONTRATO'], // Default to CONTRATO
      },
      { validators: this.dateRangeValidator }
    );
  }

  onContractFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
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
          fecha_acreditada: formatDate(contract.fecha_acreditada || ''),
          proveedor_id: contract.proveedor_id ? contract.proveedor_id.toString() : '',
          equipo_id: contract.equipo_id ? contract.equipo_id.toString() : '',
          tarifa: contract.tarifa,
          horas_incluidas: contract.horas_incluidas,
          penalidad_exceso: contract.penalidad_exceso,
          costo_adicional_motor: contract.costo_adicional_motor,
        });
        this.loading = false;
        this.loadAnnexes();
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

  dateRangeValidator(group: FormGroup): { [key: string]: boolean } | null {
    const start = group.get('fecha_inicio')?.value;
    const end = group.get('fecha_fin')?.value;

    if (start && end && new Date(start) > new Date(end)) {
      return { dateRangeInvalid: true };
    }
    return null;
  }

  // ─── Annex Methods ───

  loadAnnexes(): void {
    if (!this.contractId) return;
    this.contractService.getAnnexes(this.contractId, 'A').subscribe({
      next: (items) => {
        this.annexA = items.map((i: { concepto?: string; incluido?: boolean; observaciones?: string }) => ({
          concepto: i.concepto || '',
          incluido: i.incluido || false,
          observaciones: i.observaciones || '',
        }));
      },
    });
    this.contractService.getAnnexes(this.contractId, 'B').subscribe({
      next: (items) => {
        this.annexB = items.map((i: { concepto?: string; incluido?: boolean; observaciones?: string }) => ({
          concepto: i.concepto || '',
          incluido: i.incluido || false,
          observaciones: i.observaciones || '',
        }));
      },
    });
  }

  addAnnexItem(tipo: 'A' | 'B'): void {
    const item = { concepto: '', incluido: false, observaciones: '' };
    if (tipo === 'A') this.annexA.push(item);
    else this.annexB.push(item);
  }

  removeAnnexItem(tipo: 'A' | 'B', index: number): void {
    if (tipo === 'A') this.annexA.splice(index, 1);
    else this.annexB.splice(index, 1);
  }

  saveAnnex(tipo: 'A' | 'B'): void {
    if (!this.contractId) return;
    const items = tipo === 'A' ? this.annexA : this.annexB;
    const validItems = items.filter((i) => i.concepto.trim());

    if (tipo === 'A') this.savingAnnexA = true;
    else this.savingAnnexB = true;

    this.contractService.saveAnnexes(this.contractId, tipo, validItems).subscribe({
      next: () => {
        if (tipo === 'A') this.savingAnnexA = false;
        else this.savingAnnexB = false;
      },
      error: () => {
        if (tipo === 'A') this.savingAnnexA = false;
        else this.savingAnnexB = false;
      },
    });
  }
}
