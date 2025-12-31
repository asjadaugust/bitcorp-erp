import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FuelService } from '../../core/services/fuel.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { ProviderService } from '../../core/services/provider.service';
import { FuelRecord } from '../../core/models/fuel-record.model';
import { Equipment } from '../../core/models/equipment.model';
import { Provider } from '../../core/models/provider.model';

@Component({
  selector: 'app-fuel-form',
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
                <label for="date">Fecha *</label>
                <input
                  id="date"
                  type="date"
                  formControlName="date"
                  class="form-control"
                />
                <div class="error-msg" *ngIf="hasError('date')">Fecha es requerida</div>
              </div>

              <div class="form-group">
                <label for="equipment">Equipo *</label>
                <select id="equipment" formControlName="equipment_id" class="form-select">
                  <option [ngValue]="null">Seleccionar Equipo</option>
                  <option *ngFor="let equip of equipmentList" [value]="equip.id">
                    {{ equip.code }} - {{ equip.brand }} {{ equip.model }}
                  </option>
                </select>
                <div class="error-msg" *ngIf="hasError('equipment_id')">Equipo es requerido</div>
              </div>

              <div class="form-group">
                <label for="provider">Proveedor</label>
                <select id="provider" formControlName="provider_id" class="form-select">
                  <option [ngValue]="null">Seleccionar Proveedor</option>
                  <option *ngFor="let provider of providers" [value]="provider.id">
                    {{ provider.business_name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Section 2: Consumption & Cost -->
          <div class="form-section full-width">
            <h3>Consumo y Costos</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="gallons">Galones *</label>
                <input
                  id="gallons"
                  type="number"
                  formControlName="gallons"
                  class="form-control"
                  placeholder="0.00"
                  (input)="calculateTotal()"
                />
                <div class="error-msg" *ngIf="hasError('gallons')">Cantidad es requerida</div>
              </div>

              <div class="form-group">
                <label for="cost_per_gallon">Costo por Galón (S/) *</label>
                <input
                  id="cost_per_gallon"
                  type="number"
                  formControlName="cost_per_gallon"
                  class="form-control"
                  placeholder="0.00"
                  (input)="calculateTotal()"
                />
                <div class="error-msg" *ngIf="hasError('cost_per_gallon')">Costo unitario es requerido</div>
              </div>

              <div class="form-group">
                <label for="total_cost">Costo Total (S/) *</label>
                <input
                  id="total_cost"
                  type="number"
                  formControlName="total_cost"
                  class="form-control"
                  placeholder="0.00"
                  readonly
                />
              </div>
            </div>
          </div>

          <!-- Section 3: Readings -->
          <div class="form-section full-width">
            <h3>Lecturas</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="hourmeter">Horómetro</label>
                <input
                  id="hourmeter"
                  type="number"
                  formControlName="hourmeter"
                  class="form-control"
                  placeholder="0.00"
                />
              </div>

              <div class="form-group">
                <label for="odometer">Odómetro (km)</label>
                <input
                  id="odometer"
                  type="number"
                  formControlName="odometer"
                  class="form-control"
                  placeholder="0.00"
                />
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
  private equipmentService = inject(EquipmentService);
  private providerService = inject(ProviderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  fuelForm: FormGroup;
  isEditMode = false;
  loading = false;
  recordId: number | null = null;
  equipmentList: Equipment[] = [];
  providers: Provider[] = [];

  constructor() {
    this.fuelForm = this.fb.group({
      equipment_id: [null, Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      gallons: [null, [Validators.required, Validators.min(0.01)]],
      cost_per_gallon: [null, [Validators.required, Validators.min(0.01)]],
      total_cost: [0, Validators.required],
      provider_id: [null],
      hourmeter: [null],
      odometer: [null],
    });
  }

  ngOnInit(): void {
    this.loadDependencies();

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.recordId = +params['id'];
        this.loadRecord(this.recordId);
      }
    });
  }

  loadDependencies(): void {
    this.equipmentService.getAll().subscribe((data) => (this.equipmentList = data));
    this.providerService.getAll().subscribe((data) => (this.providers = data));
  }

  loadRecord(id: number): void {
    this.loading = true;
    this.fuelService.getById(id).subscribe({
      next: (record) => {
        // Format date
        const formatDate = (dateStr: string) => (dateStr ? dateStr.split('T')[0] : '');

        this.fuelForm.patchValue({
          ...record,
          date: formatDate(record.date),
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
    const gallons = this.fuelForm.get('gallons')?.value || 0;
    const cost = this.fuelForm.get('cost_per_gallon')?.value || 0;
    const total = gallons * cost;
    this.fuelForm.patchValue({ total_cost: parseFloat(total.toFixed(2)) }, { emitEvent: false });
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
