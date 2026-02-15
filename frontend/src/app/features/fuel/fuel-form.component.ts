import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';
import { FuelService } from '../../core/services/fuel.service';
import { FuelRecord } from '../../core/models/fuel-record.model';

@Component({
  selector: 'app-fuel-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DropdownComponent],
  template: `
    <div class="form-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fa-solid" [class.fa-plus]="!isEditMode" [class.fa-pen]="isEditMode"></i>
          </div>
          <div class="title-group">
            <h1>{{ isEditMode ? 'Editar Registro' : 'Nuevo Registro de Combustible' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información del registro'
                  : 'Registrar nuevo abastecimiento de combustible'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button
            class="btn btn-primary"
            (click)="onSubmit()"
            [disabled]="fuelForm.invalid || loading"
          >
            <i class="fa-solid fa-save"></i> {{ isEditMode ? 'Guardar Cambios' : 'Crear Registro' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="fuelForm" class="form-grid">
          <!-- Section 1: Basic Information -->
          <div class="form-section full-width">
            <h3>Detalles del Abastecimiento</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="fecha">Fecha *</label>
                <input id="fecha" type="date" formControlName="fecha" class="form-control" />
                <div class="error-msg" *ngIf="hasError('fecha')">Fecha es requerida</div>
              </div>

              <div class="form-group">
                <label for="valorizacion_id">Valorización ID *</label>
                <input
                  id="valorizacion_id"
                  type="number"
                  formControlName="valorizacion_id"
                  class="form-control"
                  placeholder="ID de valorización"
                />
                <div class="error-msg" *ngIf="hasError('valorizacion_id')">
                  Valorización es requerida
                </div>
              </div>

              <div class="form-group">
                <label for="proveedor">Proveedor</label>
                <input
                  id="proveedor"
                  type="text"
                  formControlName="proveedor"
                  class="form-control"
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div class="form-group">
                <label for="tipo_combustible">Tipo de Combustible</label>
                <app-dropdown
                  formControlName="tipo_combustible"
                  [options]="fuelTypeOptions"
                  [placeholder]="'Seleccionar Tipo'"
                ></app-dropdown>
              </div>
            </div>
          </div>

          <!-- Section 2: Consumption & Cost -->
          <div class="form-section full-width">
            <h3>Consumo y Costos</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="cantidad">Cantidad *</label>
                <input
                  id="cantidad"
                  type="number"
                  formControlName="cantidad"
                  class="form-control"
                  placeholder="0.00"
                  step="0.01"
                  (input)="calculateTotal()"
                />
                <div class="error-msg" *ngIf="hasError('cantidad')">Cantidad es requerida</div>
              </div>

              <div class="form-group">
                <label for="precio_unitario">Precio Unitario (S/) *</label>
                <input
                  id="precio_unitario"
                  type="number"
                  formControlName="precio_unitario"
                  class="form-control"
                  placeholder="0.00"
                  step="0.01"
                  (input)="calculateTotal()"
                />
                <div class="error-msg" *ngIf="hasError('precio_unitario')">
                  Precio unitario es requerido
                </div>
              </div>

              <div class="form-group">
                <label for="monto_total">Monto Total (S/) *</label>
                <input
                  id="monto_total"
                  type="number"
                  formControlName="monto_total"
                  class="form-control"
                  placeholder="0.00"
                  readonly
                />
              </div>
            </div>
          </div>

          <!-- Section 3: Document Info -->
          <div class="form-section full-width">
            <h3>Información del Documento</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="numero_documento">Número de Documento</label>
                <input
                  id="numero_documento"
                  type="text"
                  formControlName="numero_documento"
                  class="form-control"
                  placeholder="Ej: F001-00001234"
                />
              </div>

              <div class="form-group full-width">
                <label for="observaciones">Observaciones</label>
                <textarea
                  id="observaciones"
                  formControlName="observaciones"
                  class="form-control"
                  rows="3"
                  placeholder="Notas adicionales..."
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
    `,
  ],
})
export class FuelFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private fuelService = inject(FuelService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  fuelForm: FormGroup;
  isEditMode = false;
  loading = false;
  recordId: number | null = null;

  fuelTypeOptions: DropdownOption[] = [
    { label: 'Diesel', value: 'DIESEL' },
    { label: 'Gasolina 84', value: 'GASOLINA_84' },
    { label: 'Gasolina 90', value: 'GASOLINA_90' },
    { label: 'Gasolina 95', value: 'GASOLINA_95' },
    { label: 'Gasolina 97', value: 'GASOLINA_97' },
    { label: 'GLP', value: 'GLP' },
    { label: 'GNV', value: 'GNV' },
  ];

  constructor() {
    this.fuelForm = this.fb.group({
      valorizacion_id: [null, Validators.required],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      cantidad: [null, [Validators.required, Validators.min(0.01)]],
      precio_unitario: [null, [Validators.required, Validators.min(0.01)]],
      monto_total: [0, Validators.required],
      tipo_combustible: [null],
      proveedor: [null],
      numero_documento: [null],
      observaciones: [null],
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.recordId = +params['id'];
        this.loadRecord(this.recordId);
      }
    });
  }

  loadRecord(id: number): void {
    this.loading = true;
    this.fuelService.getById(id).subscribe({
      next: (record) => {
        // Format date
        const formatDate = (dateStr: string) => (dateStr ? dateStr.split('T')[0] : '');

        this.fuelForm.patchValue({
          ...record,
          fecha: record.fecha ? formatDate(record.fecha as string) : '',
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading fuel record', err);
        this.loading = false;
        this.router.navigate(['/logistics/fuel']);
      },
    });
  }

  calculateTotal(): void {
    const cantidad = this.fuelForm.get('cantidad')?.value || 0;
    const precioUnitario = this.fuelForm.get('precio_unitario')?.value || 0;
    const total = cantidad * precioUnitario;
    this.fuelForm.patchValue({ monto_total: parseFloat(total.toFixed(2)) }, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.fuelForm.invalid) return;

    this.loading = true;
    const recordData = this.fuelForm.value;

    const request$ =
      this.isEditMode && this.recordId
        ? this.fuelService.update(this.recordId, recordData)
        : this.fuelService.create(recordData);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/logistics/fuel']);
      },
      error: (err) => {
        console.error('Error saving fuel record', err);
        this.loading = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/logistics/fuel']);
  }

  hasError(field: string): boolean {
    const control = this.fuelForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
