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
import { EquipmentService } from '../../core/services/equipment.service';
import { ProviderService } from '../../core/services/provider.service';
import { OperatorService } from '../../core/services/operator.service';
import { Equipment } from '../../core/models/equipment.model';
import { Provider } from '../../core/models/provider.model';
import { Operator } from '../../core/models/operator.model';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-equipment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    ValidationErrorsComponent,
    AlertComponent,
    FormContainerComponent,
    DropdownComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Equipo' : 'Nuevo Equipo'"
      [subtitle]="
        isEditMode ? 'Actualizar información del equipo' : 'Registrar un nuevo equipo en el sistema'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-plus'"
      [loading]="loading"
      [disableSubmit]="equipmentForm.invalid || loading"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Equipo'"
      [backUrl]="'/equipment'"
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

      <app-alert
        *ngIf="successMessage"
        type="success"
        [message]="successMessage"
        [dismissible]="true"
        [autoDismiss]="true"
        [autoDismissDelay]="1500"
      >
      </app-alert>

      <form [formGroup]="equipmentForm" class="form-grid">
        <!-- Section 1: Basic Information -->
        <div class="form-section full-width">
          <h3>Información Básica</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="codigo_equipo">Código Interno *</label>
              <input
                id="codigo_equipo"
                type="text"
                formControlName="codigo_equipo"
                class="form-control"
                placeholder="ej. EXC-001"
              />
              <div class="error-msg" *ngIf="hasError('codigo_equipo')">Código es requerido</div>
            </div>

            <!-- Name removed -->

            <div class="form-group">
              <label for="categoria">Categoría *</label>
              <app-dropdown
                formControlName="categoria"
                [options]="[
                  { label: 'Excavadora', value: 'Excavadora' },
                  { label: 'Tractor de Oruga', value: 'Tractor de Oruga' },
                  { label: 'Cargador Frontal', value: 'Cargador Frontal' },
                  { label: 'Camión Volquete', value: 'Camión Volquete' },
                  { label: 'Motoniveladora', value: 'Motoniveladora' },
                  { label: 'Rodillo Compactador', value: 'Rodillo Compactador' },
                  { label: 'Camioneta', value: 'Camioneta' },
                ]"
                [placeholder]="'Seleccionar Categoría'"
                [searchable]="true"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('categoria')">Categoría es requerida</div>
            </div>

            <div class="form-group">
              <label for="marca">Marca *</label>
              <input
                id="marca"
                type="text"
                formControlName="marca"
                class="form-control"
                placeholder="ej. Caterpillar"
              />
              <div class="error-msg" *ngIf="hasError('marca')">Marca es requerida</div>
            </div>

            <div class="form-group">
              <label for="modelo">Modelo *</label>
              <input
                id="modelo"
                type="text"
                formControlName="modelo"
                class="form-control"
                placeholder="ej. 336D2 L"
              />
              <div class="error-msg" *ngIf="hasError('modelo')">Modelo es requerido</div>
            </div>

            <div class="form-group">
              <label for="anio_fabricacion">Año de Fabricación</label>
              <input
                id="anio_fabricacion"
                type="number"
                formControlName="anio_fabricacion"
                class="form-control"
                placeholder="ej. 2020"
              />
            </div>

            <div class="form-group">
              <label for="placa">Placa / Serie</label>
              <input
                id="placa"
                type="text"
                formControlName="placa"
                class="form-control"
                placeholder="ej. ABC-123"
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Operational Details -->
        <div class="form-section full-width">
          <h3>Detalles Operativos</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="estado">Estado *</label>
              <app-dropdown
                formControlName="estado"
                [options]="[
                  { label: 'Disponible', value: 'DISPONIBLE' },
                  { label: 'En Uso', value: 'EN_USO' },
                  { label: 'Mantenimiento', value: 'MANTENIMIENTO' },
                  { label: 'Retirado', value: 'RETIRADO' },
                ]"
                [placeholder]="'Seleccionar Estado'"
              ></app-dropdown>
            </div>

            <div class="form-group">
              <label for="medidor_uso">Tipo de Medidor</label>
              <app-dropdown
                formControlName="medidor_uso"
                [options]="[
                  { label: 'Horómetro', value: 'HOROMETRO' },
                  { label: 'Odómetro', value: 'ODOMETRO' },
                  { label: 'Ambos', value: 'AMBOS' },
                ]"
                [placeholder]="'Seleccionar Tipo'"
              ></app-dropdown>
            </div>

            <div class="form-group">
              <label for="tipo_proveedor">Tipo de Proveedor *</label>
              <app-dropdown
                formControlName="tipo_proveedor"
                [options]="[
                  { label: 'Propio', value: 'PROPIO' },
                  { label: 'Tercero (Alquilado)', value: 'TERCERO' },
                ]"
                [placeholder]="'Seleccionar Tipo'"
                (selectionChange)="onTipoProveedorChange()"
              ></app-dropdown>
            </div>

            <div class="form-group" *ngIf="showProviderSelect">
              <label for="proveedor_id">Proveedor *</label>
              <app-dropdown
                formControlName="proveedor_id"
                [options]="providerOptions"
                [placeholder]="'Seleccionar Proveedor'"
                [searchable]="true"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('proveedor_id')">
                Proveedor es requerido para equipos de terceros
              </div>
            </div>

            <!-- Operator Removed -->
          </div>
        </div>

        <!-- Section 3: Technical Specs -->
        <div class="form-section full-width">
          <h3>Especificaciones Técnicas</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="potencia_neta">Potencia (HP)</label>
              <input
                id="potencia_neta"
                type="text"
                formControlName="potencia_neta"
                class="form-control"
                placeholder="ej. 300 HP"
              />
            </div>

            <!-- Removed capacity/weight/fuel as not in entity -->

            <div class="form-group">
              <label for="tipo_motor">Tipo de Motor</label>
              <input
                id="tipo_motor"
                type="text"
                formControlName="tipo_motor"
                class="form-control"
                placeholder="ej. Diesel"
              />
            </div>
          </div>
        </div>

        <!-- Section 4: Documentation & Dates (Table Format) -->
        <div class="form-section full-width">
          <div class="section-header">
            <h3>Documentación y Fechas</h3>
            <button type="button" class="btn btn-sm btn-secondary" (click)="addDocument()">
              <i class="fa-solid fa-plus"></i> Agregar Documento
            </button>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Fecha Vencimiento</th>
                  <th>Estatus</th>
                  <th>Adjunto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let doc of equipmentDocuments; let i = index">
                  <td>
                    <app-dropdown
                      [(ngModel)]="doc.document_type"
                      [ngModelOptions]="{ standalone: true }"
                      [options]="documentTypeOptions"
                      [placeholder]="'Seleccionar...'"
                    ></app-dropdown>
                  </td>
                  <td>
                    <input
                      type="date"
                      [(ngModel)]="doc.expiration_date"
                      [ngModelOptions]="{ standalone: true }"
                      class="form-control"
                    />
                  </td>
                  <td>
                    <span [class]="'status-badge status-' + getDocumentStatus(doc.expiration_date)">
                      {{ getDocumentStatusLabel(doc.expiration_date) }}
                    </span>
                  </td>
                  <td>
                    <div class="file-input-wrapper">
                      <input
                        type="file"
                        [id]="'doc_file_' + i"
                        (change)="onDocFileSelected($event, i)"
                        class="file-input"
                      />
                      <label [for]="'doc_file_' + i" class="btn btn-sm btn-secondary">
                        <i class="fa-solid fa-upload"></i> {{ doc.file_name || 'Adjuntar' }}
                      </label>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      class="btn btn-icon btn-danger"
                      (click)="removeDocument(i)"
                    >
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="equipmentDocuments.length === 0">
                  <td colspan="5" class="empty-row">No hay documentos registrados</td>
                </tr>
              </tbody>
            </table>
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

      textarea.form-control {
        resize: vertical;
      }

      .error-msg {
        color: var(--semantic-red-600);
        font-size: 12px;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-vigente {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .status-por_vencer {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
      }
      .status-vencido {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
      }
      .status-sin_fecha {
        background: var(--grey-100);
        color: var(--grey-600);
      }

      /* Section Header */
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        border-bottom: 1px solid var(--grey-200);
        padding-bottom: 0.5rem;
      }

      .section-header h3 {
        margin: 0;
        border: none;
        padding: 0;
      }

      /* Table Styles */
      .table-container {
        border: 1px solid var(--grey-200);
        border-radius: 8px;
        overflow: hidden;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }

      .data-table th {
        background: var(--grey-50);
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 600;
        color: var(--grey-700);
        border-bottom: 1px solid var(--grey-200);
      }

      .data-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--grey-100);
        vertical-align: middle;
      }

      .data-table tr:last-child td {
        border-bottom: none;
      }

      .data-table tr:hover {
        background-color: var(--grey-25);
      }

      .empty-row {
        text-align: center;
        color: var(--grey-500);
        padding: 2rem !important;
        font-style: italic;
      }

      /* File Input */
      .file-input-wrapper {
        position: relative;
        display: inline-block;
      }

      .file-input {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
      }

      .btn-sm {
        padding: 0.25rem 0.75rem;
        font-size: 13px;
      }

      .btn-icon.btn-danger {
        color: var(--semantic-red-500);
        background: transparent;
        border: 1px solid transparent;
      }

      .btn-icon.btn-danger:hover {
        background: var(--semantic-red-50);
        border-color: var(--semantic-red-200);
      }
    `,
  ],
})
export class EquipmentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private equipmentService = inject(EquipmentService);
  private providerService = inject(ProviderService);
  private operatorService = inject(OperatorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(FormErrorHandlerService);

  equipmentForm: FormGroup;
  isEditMode = false;
  loading = false;
  equipmentId: string | null = null;

  providers: Provider[] = [];
  providerOptions: { label: string; value: any }[] = [];
  operators: Operator[] = [];
  equipmentDocuments: any[] = [];
  validationErrors: ValidationError[] = [];
  errorMessage = '';
  successMessage = '';

  documentTypeOptions = [
    { label: 'Póliza de Seguro', value: 'poliza' },
    { label: 'SOAT', value: 'soat' },
    { label: 'Revisión Técnica (CITV)', value: 'citv' },
    { label: 'Garantía', value: 'garantia' },
    { label: 'Tarjeta de Propiedad', value: 'tarjeta_propiedad' },
    { label: 'Otro', value: 'otro' },
  ];

  fieldLabels: Record<string, string> = {
    codigo_equipo: 'Código de Equipo',
    marca: 'Marca',
    modelo: 'Modelo',
    placa: 'Placa',
    categoria: 'Categoría',
    estado: 'Estado',
    tipo_proveedor: 'Tipo de Proveedor',
    proveedor_id: 'Proveedor',
    anio_fabricacion: 'Año de Fabricación',
    potencia_neta: 'Potencia Neta',
    tipo_motor: 'Tipo de Motor',
    medidor_uso: 'Tipo de Medidor',
    numero_serie_equipo: 'Número de Serie del Equipo',
    numero_chasis: 'Número de Chasis',
    numero_serie_motor: 'Número de Serie del Motor',
    notes: 'Notas',
  };

  get showProviderSelect(): boolean {
    return this.equipmentForm.get('tipo_proveedor')?.value === 'TERCERO';
  }

  constructor() {
    this.equipmentForm = this.fb.group({
      codigo_equipo: ['', Validators.required],
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      estado: ['DISPONIBLE', Validators.required],
      categoria: ['', Validators.required],
      tipo_proveedor: ['PROPIO', Validators.required],
      proveedor_id: [null],

      // Optional fields
      anio_fabricacion: [null],
      placa: [''],
      medidor_uso: [''],
      potencia_neta: [''],
      tipo_motor: [''],
      numero_serie_equipo: [''],
      numero_chasis: [''],
      numero_serie_motor: [''],
      notes: [''], // Optional notes field
    });
  }

  ngOnInit(): void {
    this.loadProviders();
    this.loadOperators();

    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id && id !== 'undefined' && id !== 'NaN') {
        this.isEditMode = true;
        this.equipmentId = id;
        this.loadEquipment(id); // Use id directly instead of equipmentId
      } else if (id === 'undefined' || id === 'NaN') {
        this.router.navigate(['/equipment']);
      }
    });
  }

  loadProviders(): void {
    this.providerService.getAll().subscribe((providers) => {
      this.providers = providers;
      this.providerOptions = this.providers.map((p) => ({
        label: p.razon_social,
        value: p.id,
      }));
    });
  }

  loadOperators(): void {
    this.operatorService.getAll().subscribe((operators) => {
      this.operators = operators;
    });
  }

  // Document handling methods
  addDocument(): void {
    this.equipmentDocuments.push({
      document_type: '',
      expiration_date: '',
      file_name: '',
      file: null,
    });
  }

  removeDocument(index: number): void {
    this.equipmentDocuments.splice(index, 1);
  }

  onDocFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.equipmentDocuments[index].file = file;
      this.equipmentDocuments[index].file_name = file.name;
    }
  }

  onTipoProveedorChange(): void {
    const tipo = this.equipmentForm.get('tipo_proveedor')?.value;
    const proveedorControl = this.equipmentForm.get('proveedor_id');

    if (tipo === 'TERCERO') {
      proveedorControl?.setValidators([Validators.required]);
    } else {
      proveedorControl?.clearValidators();
      proveedorControl?.setValue(null);
    }
    proveedorControl?.updateValueAndValidity();
  }

  getDocumentStatus(expirationDate: string): string {
    if (!expirationDate) return 'sin_fecha';
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) return 'vencido';
    if (daysUntilExpiry <= 30) return 'por_vencer';
    return 'vigente';
  }

  getDocumentStatusLabel(expirationDate: string): string {
    const status = this.getDocumentStatus(expirationDate);
    const labels: Record<string, string> = {
      vigente: 'Vigente',
      por_vencer: 'Por Vencer',
      vencido: 'Vencido',
      sin_fecha: 'Sin Fecha',
    };
    return labels[status] || status;
  }

  loadEquipment(id: string | number): void {
    this.loading = true;
    this.equipmentService.getById(id).subscribe({
      next: (equipment) => {
        // Map API response (Spanish snake_case) to form fields
        this.equipmentForm.patchValue(equipment);

        // Ensure validation rules are applied based on loaded data
        this.onTipoProveedorChange();

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading equipment', err);
        this.loading = false;
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        // this.router.navigate(['/equipment']); // Don't redirect immediately on error, show message
      },
    });
  }

  onSubmit(): void {
    if (this.equipmentForm.invalid) {
      this.equipmentForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.validationErrors = [];
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.equipmentForm.getRawValue();
    const equipmentData = { ...formValue };

    // Remove non-DTO fields
    if ('notes' in equipmentData) {
      delete equipmentData.notes;
    }

    // Convert numeric fields
    if (equipmentData.potencia_neta) {
      // Remove non-numeric characters if user types "300 HP"
      const potencia = String(equipmentData.potencia_neta).replace(/[^0-9.]/g, '');
      equipmentData.potencia_neta = potencia ? Number(potencia) : null;
    } else {
      equipmentData.potencia_neta = null;
    }

    if (equipmentData.anio_fabricacion) {
      equipmentData.anio_fabricacion = Number(equipmentData.anio_fabricacion);
    } else {
      equipmentData.anio_fabricacion = null;
    }

    // Convert status to uppercase just in case
    if (equipmentData.estado) {
      equipmentData.estado = String(equipmentData.estado).toUpperCase();
    }

    // Ensure nulls for empty strings on optional fields
    [
      'placa',
      'numero_serie_equipo',
      'numero_chasis',
      'numero_serie_motor',
      'tipo_motor',
      'medidor_uso',
    ].forEach((field) => {
      if (!equipmentData[field]) equipmentData[field] = null;
    });

    const request$ =
      this.isEditMode && this.equipmentId
        ? this.equipmentService.update(this.equipmentId, equipmentData)
        : this.equipmentService.create(equipmentData);

    request$.subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = this.isEditMode
          ? 'Equipo actualizado correctamente'
          : 'Equipo creado correctamente';
        setTimeout(() => {
          this.router.navigate(['/equipment']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error saving equipment', err);
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/equipment']);
  }

  hasError(field: string): boolean {
    const control = this.equipmentForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
