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

@Component({
  selector: 'app-equipment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  template: `
    <div class="form-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fa-solid" [class.fa-plus]="!isEditMode" [class.fa-pen]="isEditMode"></i>
          </div>
          <div class="title-group">
            <h1>{{ isEditMode ? 'Editar Equipo' : 'Nuevo Equipo' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información del equipo'
                  : 'Registrar un nuevo equipo en el sistema'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button
            class="btn btn-primary"
            (click)="onSubmit()"
            [disabled]="equipmentForm.invalid || loading"
          >
            <i class="fa-solid fa-save"></i> {{ isEditMode ? 'Guardar Cambios' : 'Crear Equipo' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
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
                <select id="categoria" formControlName="categoria" class="form-select">
                  <option value="">Seleccionar Categoría</option>
                  <option value="Excavadora">Excavadora</option>
                  <option value="Tractor de Oruga">Tractor de Oruga</option>
                  <option value="Cargador Frontal">Cargador Frontal</option>
                  <option value="Camión Volquete">Camión Volquete</option>
                  <option value="Motoniveladora">Motoniveladora</option>
                  <option value="Rodillo Compactador">Rodillo Compactador</option>
                  <option value="Camioneta">Camioneta</option>
                </select>
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

              <!-- equipment_type removed -->

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
                <select id="estado" formControlName="estado" class="form-select">
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="EN_USO">En Uso</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="RETIRADO">Retirado</option>
                </select>
              </div>

              <!-- Location removed -->

              <div class="form-group">
                <label for="medidor_uso">Tipo de Medidor</label>
                <select id="medidor_uso" formControlName="medidor_uso" class="form-select">
                  <option [ngValue]="null">Seleccionar Tipo</option>
                  <option value="HOROMETRO">Horómetro</option>
                  <option value="ODOMETRO">Odómetro</option>
                  <option value="AMBOS">Ambos</option>
                </select>
              </div>

              <div class="form-group">
                <label for="proveedor_id">Proveedor</label>
                <select id="proveedor_id" formControlName="proveedor_id" class="form-select">
                  <option [ngValue]="null">Seleccionar Proveedor</option>
                  <option *ngFor="let provider of providers" [value]="provider.id">
                    {{ provider.razon_social }}
                  </option>
                </select>
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
                      <select
                        [(ngModel)]="doc.document_type"
                        [ngModelOptions]="{ standalone: true }"
                        class="form-select"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="poliza">Póliza de Seguro</option>
                        <option value="soat">SOAT</option>
                        <option value="citv">Revisión Técnica (CITV)</option>
                        <option value="garantia">Garantía</option>
                        <option value="tarjeta_propiedad">Tarjeta de Propiedad</option>
                        <option value="otro">Otro</option>
                      </select>
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
                      <span
                        [class]="'status-badge status-' + getDocumentStatus(doc.expiration_date)"
                      >
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

          <div class="form-section full-width">
            <div class="form-group">
              <label for="notes">Notas Adicionales</label>
              <textarea
                id="notes"
                formControlName="notes"
                class="form-control"
                rows="3"
                placeholder="Observaciones o detalles adicionales..."
              ></textarea>
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

      /* Section Header */
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .section-header h3 {
        margin: 0;
        border: none;
        padding: 0;
      }

      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 12px;
      }

      /* Data Table */
      .table-container {
        overflow-x: auto;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }

      .data-table th,
      .data-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--grey-200);
      }

      .data-table th {
        background: var(--grey-50);
        font-weight: 600;
        color: var(--grey-700);
        font-size: 12px;
        text-transform: uppercase;
      }

      .data-table td .form-control,
      .data-table td .form-select {
        padding: 0.5rem;
        font-size: 13px;
      }

      .empty-row {
        text-align: center;
        color: var(--grey-500);
        font-style: italic;
        padding: 1.5rem !important;
      }

      .btn-icon {
        padding: 0.5rem;
        min-width: auto;
      }

      .btn-danger {
        background: var(--semantic-red-50);
        color: var(--semantic-red-600);
        border: 1px solid var(--semantic-red-200);
      }
      .btn-danger:hover {
        background: var(--semantic-red-100);
      }

      .file-input-wrapper {
        position: relative;
      }

      .file-input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
      }

      .file-input-wrapper label {
        display: inline-flex;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 150px;
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

  equipmentForm: FormGroup;
  isEditMode = false;
  loading = false;
  equipmentId: string | null = null;
  providers: Provider[] = [];
  operators: Operator[] = [];
  equipmentDocuments: any[] = [];

  constructor() {
    this.equipmentForm = this.fb.group({
      codigo_equipo: ['', Validators.required],
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      estado: ['DISPONIBLE', Validators.required],
      categoria: ['', Validators.required],
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

      // notes: [''], // Not in entity
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
        this.equipmentForm.patchValue({
          codigo_equipo: equipment.codigo_equipo,
          marca: equipment.marca,
          modelo: equipment.modelo,
          estado: equipment.estado,
          categoria: equipment.categoria,
          proveedor_id: equipment.proveedor_id,
          anio_fabricacion: equipment.manufacture_year,
          placa: equipment.placa,
          medidor_uso: equipment.meter_type,
          potencia_neta: equipment.net_power,
          tipo_motor: equipment.engine_type,
          numero_serie_equipo: equipment.serial_number,
          numero_chasis: equipment.chassis_number,
          numero_serie_motor: equipment.engine_serial_number,
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading equipment', err);
        this.loading = false;
        this.router.navigate(['/equipment']);
      },
    });
  }

  onSubmit(): void {
    if (this.equipmentForm.invalid) return;

    this.loading = true;
    const equipmentData = this.equipmentForm.value;

    const request$ =
      this.isEditMode && this.equipmentId
        ? this.equipmentService.update(this.equipmentId, equipmentData)
        : this.equipmentService.create(equipmentData);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/equipment']);
      },
      error: (err) => {
        console.error('Error saving equipment', err);
        this.loading = false;
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
