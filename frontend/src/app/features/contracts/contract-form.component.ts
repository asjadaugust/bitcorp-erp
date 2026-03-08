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
import { FormSectionComponent } from '../../shared/components/form-section/form-section.component';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { AeroButtonComponent, AeroBadgeComponent } from '../../core/design-system';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    FormContainerComponent,
    FormSectionComponent,
    ValidationErrorsComponent,
    AlertComponent,
    DropdownComponent,
    AeroButtonComponent,
    AeroBadgeComponent,
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
      (submitted)="onSubmit()"
      (cancelled)="cancel()"
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
        <app-form-section title="Información del Contrato" icon="fa-file-contract">
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
            <div class="modalidad-badges" *ngIf="contractForm.get('modalidad')?.value">
              <aero-badge [variant]="isOperadorIncluido() ? 'success' : 'neutral'">
                {{ isOperadorIncluido() ? 'Incluye Operador' : 'Sin Operador' }}
              </aero-badge>
              <aero-badge [variant]="isMotorIncluido() ? 'success' : 'neutral'">
                {{ isMotorIncluido() ? 'Incluye Combustible' : 'Sin Combustible' }}
              </aero-badge>
            </div>
          </div>

          <div class="form-group">
            <label for="estado">Estado *</label>
            <app-dropdown
              formControlName="estado"
              [options]="estadoOptions"
              [placeholder]="'Seleccionar Estado'"
            ></app-dropdown>
          </div>
        </app-form-section>

        <!-- Section 2: Financial & Dates -->
        <app-form-section title="Detalles Financieros y Fechas" icon="fa-dollar-sign">
          <div class="form-group">
            <label for="fecha_inicio">Fecha de Inicio *</label>
            <input
              id="fecha_inicio"
              type="date"
              formControlName="fecha_inicio"
              class="form-control"
            />
            <div class="error-msg" *ngIf="hasError('fecha_inicio')">Fecha de inicio requerida</div>
          </div>

          <div class="form-group">
            <label for="fecha_fin">Fecha de Fin *</label>
            <input id="fecha_fin" type="date" formControlName="fecha_fin" class="form-control" />
            <div class="error-msg" *ngIf="hasError('fecha_fin')">Fecha de fin requerida</div>
            <div
              class="error-msg"
              *ngIf="
                contractForm.hasError('dateRangeInvalid') && contractForm.get('fecha_fin')?.touched
              "
            >
              La fecha de fin debe ser posterior a la fecha de inicio
            </div>
          </div>

          <div
            class="form-group"
            *ngIf="
              contractForm.get('fecha_inicio')?.value &&
              contractForm.get('fecha_fin')?.value &&
              !contractForm.hasError('dateRangeInvalid')
            "
          >
            <label>Plazo</label>
            <span class="plazo-calculated">{{ calcularPlazo() }}</span>
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
            <label for="minimo_por">Mínimo Por</label>
            <app-dropdown
              formControlName="minimo_por"
              [options]="minimoPorOptions"
              [placeholder]="'Seleccionar...'"
            ></app-dropdown>
          </div>

          <div
            class="form-group"
            *ngIf="
              contractForm.get('minimo_por')?.value &&
              contractForm.get('minimo_por')?.value !== 'NINGUNO'
            "
          >
            <label for="cantidad_minima">Cantidad Mínima</label>
            <input
              id="cantidad_minima"
              type="number"
              formControlName="cantidad_minima"
              class="form-control"
              placeholder="0"
            />
          </div>

          <div class="form-group" *ngIf="isCostoMotorVisible()">
            <label for="costo_adicional_motor">Costo Adicional Motor</label>
            <input
              id="costo_adicional_motor"
              type="number"
              formControlName="costo_adicional_motor"
              class="form-control"
              placeholder="0.00"
            />
          </div>
        </app-form-section>

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
              <aero-button
                variant="ghost"
                size="small"
                iconCenter="fa-trash"
                title="Eliminar"
                (clicked)="removeAnnexItem('A', i)"
              ></aero-button>
            </div>
            <div class="annex-actions-row">
              <aero-button
                variant="secondary"
                size="small"
                iconLeft="fa-plus"
                (clicked)="addAnnexItem('A')"
                >Agregar ítem</aero-button
              >
              <aero-button
                variant="primary"
                size="small"
                iconLeft="fa-save"
                [disabled]="savingAnnexA"
                (clicked)="saveAnnex('A')"
                >Guardar Anexo A</aero-button
              >
            </div>
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
              <aero-button
                variant="ghost"
                size="small"
                iconCenter="fa-trash"
                title="Eliminar"
                (clicked)="removeAnnexItem('B', i)"
              ></aero-button>
            </div>
            <div class="annex-actions-row">
              <aero-button
                variant="secondary"
                size="small"
                iconLeft="fa-plus"
                (clicked)="addAnnexItem('B')"
                >Agregar ítem</aero-button
              >
              <aero-button
                variant="primary"
                size="small"
                iconLeft="fa-save"
                [disabled]="savingAnnexB"
                (clicked)="saveAnnex('B')"
                >Guardar Anexo B</aero-button
              >
            </div>
          </div>
        </div>

        <!-- Section 3: Document Attachment -->
        <app-form-section title="Documento del Contrato" icon="fa-paperclip" [columns]="1">
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
        </app-form-section>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout';

      /* Annex Editor (contract-specific) */
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

      .annex-actions-row {
        display: flex;
        gap: var(--s-8);
        margin-top: var(--s-8);
      }

      .modalidad-badges {
        display: flex;
        gap: var(--s-8);
        margin-top: var(--s-4);
      }

      .plazo-calculated {
        display: block;
        padding: var(--s-8);
        background: var(--grey-50);
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-md);
        font-size: 14px;
        color: var(--primary-900);
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
    { label: 'Máquina Seca Operada', value: 'MAQUINA_SECA_OPERADA' },
    { label: 'Máquina Seca No Operada', value: 'MAQUINA_SECA_NO_OPERADA' },
    { label: 'Máquina Servida Operada', value: 'MAQUINA_SERVIDA_OPERADA' },
    { label: 'Máquina Servida No Operada', value: 'MAQUINA_SERVIDA_NO_OPERADA' },
  ];

  estadoOptions = [
    { label: 'Sin Contrato', value: 'SIN_CONTRATO' },
    { label: 'En Proceso', value: 'EN_PROCESO' },
    { label: 'Vigente', value: 'VIGENTE' },
    { label: 'Vencido', value: 'VENCIDO' },
    { label: 'Cancelado', value: 'CANCELADO' },
  ];

  monedaOptions = [
    { label: 'Soles (PEN)', value: 'PEN' },
    { label: 'Dólares (USD)', value: 'USD' },
  ];

  tipoTarifaOptions = [
    { label: 'Hora-Máquina (H-M)', value: 'HORA' },
    { label: 'Día', value: 'DIA' },
    { label: 'Mes', value: 'MES' },
  ];

  minimoPorOptions = [
    { label: 'Ninguno', value: 'NINGUNO' },
    { label: 'Día', value: 'DIA' },
    { label: 'Semana', value: 'SEMANA' },
    { label: 'Mes', value: 'MES' },
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
    costo_adicional_motor: 'Costo Adicional Motor',
    condiciones_especiales: 'Condiciones Especiales',
    estado: 'Estado',
    minimo_por: 'Mínimo Por',
    cantidad_minima: 'Cantidad Mínima',
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
        tipo_tarifa: ['HORA', Validators.required],
        tarifa: [null, [Validators.required, Validators.min(0)]],
        costo_adicional_motor: [0, Validators.min(0)],
        condiciones_especiales: [''],
        estado: ['EN_PROCESO', Validators.required],
        minimo_por: ['NINGUNO'],
        cantidad_minima: [null, Validators.min(0)],
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
          proveedor_id: contract.proveedor_id ? contract.proveedor_id.toString() : '',
          equipo_id: contract.equipo_id ? contract.equipo_id.toString() : '',
          tarifa: contract.tarifa,
          costo_adicional_motor: contract.costo_adicional_motor,
        });
        this.loading = false;
        this.loadAnnexes();
      },
      error: (err) => {
        console.error('Error loading contract', err);
        this.loading = false;
        this.router.navigate(['/equipment/operaciones/contratos']);
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
        this.router.navigate(['/equipment/operaciones/contratos']);
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/equipment/operaciones/contratos']);
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

  // ─── Modalidad Derivation ───

  isOperadorIncluido(): boolean {
    const m = this.contractForm.get('modalidad')?.value;
    return m?.includes('OPERADA') && !m?.includes('NO_OPERADA');
  }

  isMotorIncluido(): boolean {
    return this.contractForm.get('modalidad')?.value?.includes('SERVIDA') ?? false;
  }

  isCostoMotorVisible(): boolean {
    const m = this.contractForm.get('modalidad')?.value;
    return m?.includes('SECA') ?? false;
  }

  calcularPlazo(): string {
    const inicio = this.contractForm.get('fecha_inicio')?.value;
    const fin = this.contractForm.get('fecha_fin')?.value;
    if (!inicio || !fin) return '';
    const d1 = new Date(inicio);
    const d2 = new Date(fin);
    if (d2 <= d1) return '';

    let years = d2.getFullYear() - d1.getFullYear();
    let months = d2.getMonth() - d1.getMonth();
    let days = d2.getDate() - d1.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(d2.getFullYear(), d2.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const parts: string[] = [];
    if (years) parts.push(`${years} año${years > 1 ? 's' : ''}`);
    if (months) parts.push(`${months} mes${months > 1 ? 'es' : ''}`);
    if (days) parts.push(`${days} día${days > 1 ? 's' : ''}`);
    return parts.join(', ') || '0 días';
  }

  // ─── Annex Methods ───

  loadAnnexes(): void {
    if (!this.contractId) return;
    this.contractService.getAnnexes(this.contractId, 'A').subscribe({
      next: (items) => {
        this.annexA = items.map(
          (i: { concepto?: string; incluido?: boolean; observaciones?: string }) => ({
            concepto: i.concepto || '',
            incluido: i.incluido || false,
            observaciones: i.observaciones || '',
          })
        );
      },
    });
    this.contractService.getAnnexes(this.contractId, 'B').subscribe({
      next: (items) => {
        this.annexB = items.map(
          (i: { concepto?: string; incluido?: boolean; observaciones?: string }) => ({
            concepto: i.concepto || '',
            incluido: i.incluido || false,
            observaciones: i.observaciones || '',
          })
        );
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
