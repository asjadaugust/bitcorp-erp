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

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fa-solid" [class.fa-plus]="!isEditMode" [class.fa-pen]="isEditMode"></i>
          </div>
          <div class="title-group">
            <h1>{{ isEditMode ? 'Editar Contrato' : 'Nuevo Contrato' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información del contrato'
                  : 'Registrar un nuevo contrato en el sistema'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button
            class="btn btn-primary"
            (click)="onSubmit()"
            [disabled]="contractForm.invalid || loading"
          >
            <i class="fa-solid fa-save"></i> {{ isEditMode ? 'Guardar Cambios' : 'Crear Contrato' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
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
                <label for="provider_id">Proveedor *</label>
                <select id="provider_id" formControlName="provider_id" class="form-select">
                  <option value="">Seleccione un proveedor</option>
                  <option *ngFor="let prov of providerList" [value]="prov.id">
                    {{ prov.business_name }} ({{ prov.tax_id }})
                  </option>
                </select>
                <div class="error-msg" *ngIf="hasError('provider_id')">Proveedor es requerido</div>
              </div>

              <div class="form-group">
                <label for="equipment_id">Equipo (Modelo / Placa) *</label>
                <select id="equipment_id" formControlName="equipment_id" class="form-select">
                  <option value="">Seleccione un equipo</option>
                  <option *ngFor="let eq of equipmentList" [value]="eq.id">
                    {{ eq.model }} / {{ eq.placa || 'Sin Placa' }} ({{ eq.code }})
                  </option>
                </select>
                <div class="error-msg" *ngIf="hasError('equipment_id')">Equipo es requerido</div>
              </div>

              <div class="form-group">
                <label for="modalidad">Modalidad *</label>
                <select id="modalidad" formControlName="modalidad" class="form-select">
                  <option value="">Seleccionar...</option>
                  <option value="alquiler_seco">Alquiler Seco</option>
                  <option value="alquiler_con_operador">Alquiler con Operador</option>
                  <option value="alquiler_todo_costo">Alquiler Todo Costo</option>
                  <option value="servicio">Servicio</option>
                </select>
                <div class="error-msg" *ngIf="hasError('modalidad')">Modalidad es requerida</div>
              </div>

              <div class="form-group">
                <label for="estado">Estado *</label>
                <select id="estado" formControlName="estado" class="form-select">
                  <option value="active">Activo</option>
                  <option value="draft">Borrador</option>
                  <option value="expired">Vencido</option>
                  <option value="extended">Extendido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
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
                <div class="error-msg" *ngIf="hasError('fecha_inicio')">Fecha de inicio requerida</div>
              </div>

              <div class="form-group">
                <label for="fecha_fin">Fecha de Fin *</label>
                <input
                  id="fecha_fin"
                  type="date"
                  formControlName="fecha_fin"
                  class="form-control"
                />
                <div class="error-msg" *ngIf="hasError('fecha_fin')">Fecha de fin requerida</div>
                <div class="error-msg" *ngIf="contractForm.hasError('dateRangeInvalid') && contractForm.get('fecha_fin')?.touched">
                  La fecha de fin debe ser posterior a la fecha de inicio
                </div>
              </div>

              <div class="form-group">
                <label for="moneda">Moneda *</label>
                <select id="moneda" formControlName="moneda" class="form-select">
                  <option value="PEN">Soles (PEN)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>

              <div class="form-group">
                <label for="tipo_tarifa">Tipo de Tarifa *</label>
                <select id="tipo_tarifa" formControlName="tipo_tarifa" class="form-select">
                  <option value="hourly">Por Hora</option>
                  <option value="daily">Por Día</option>
                  <option value="monthly">Mensual</option>
                  <option value="fixed">Fijo</option>
                </select>
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
                <label for="horas_minimas">Horas Mínimas</label>
                <input
                  id="horas_minimas"
                  type="number"
                  formControlName="horas_minimas"
                  class="form-control"
                  placeholder="0"
                />
              </div>

              <div class="form-group">
                <label for="penalidad_exceso">Penalidad por Exceso</label>
                <input
                  id="penalidad_exceso"
                  type="number"
                  formControlName="penalidad_exceso"
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
                    <span *ngIf="!contractFileName">Haga clic para seleccionar archivo o arrastre aquí</span>
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
      .subtitle {
        margin: 0;
        color: var(--grey-500);
        font-size: 14px;
      }
      .header-actions {
        display: flex;
        gap: 1rem;
      }

      /* Form Card */
      .form-card {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

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
        flex-direction: row;
        align-items: center;
        padding-top: 1.5rem;
      }

      .checkbox-group label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
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

  contractForm: FormGroup;
  isEditMode = false;
  loading = false;
  contractId: string | null = null;
  equipmentList: Equipment[] = [];
  providerList: Provider[] = [];
  contractFileName: string = '';
  contractFile: File | null = null;

  constructor() {
    this.contractForm = this.fb.group({
      numero_contrato: ['', Validators.required],
      fecha_contrato: [new Date().toISOString().split('T')[0], Validators.required],
      equipment_id: ['', Validators.required],
      provider_id: ['', Validators.required],
      modalidad: ['', Validators.required],
      fecha_inicio: ['', Validators.required],
      fecha_fin: ['', Validators.required],
      moneda: ['PEN', Validators.required],
      tipo_tarifa: ['hourly', Validators.required],
      tarifa: [0, [Validators.required, Validators.min(0)]],
      horas_minimas: [0],
      penalidad_exceso: [0],
      condiciones_especiales: [''],
      estado: ['active', Validators.required],
    }, { validators: this.dateRangeValidator });
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
      next: (data) => (this.equipmentList = data),
      error: (err) => console.error('Error loading equipment', err),
    });
  }

  loadProviders(): void {
    this.providerService.getAll().subscribe({
      next: (data) => (this.providerList = data),
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
        console.error('Error saving contract', err);
        this.loading = false;
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
