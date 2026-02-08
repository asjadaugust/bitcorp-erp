import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ValuationService } from '../../core/services/valuation.service';
import { ContractService } from '../../core/services/contract.service';
import { Valuation } from '../../core/models/valuation.model';
import { Contract } from '../../core/models/contract.model';

@Component({
  selector: 'app-valuation-form',
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
            <h1>{{ isEditMode ? 'Editar Valorización' : 'Nueva Valorización' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información de la valorización'
                  : 'Registrar nueva valorización de proyecto'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button
            class="btn btn-primary"
            (click)="onSubmit()"
            [disabled]="valuationForm.invalid || loading"
          >
            <i class="fa-solid fa-save"></i>
            {{ isEditMode ? 'Guardar Cambios' : 'Crear Valorización' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="valuationForm" class="form-grid">
          <!-- Section 1: Contract Information -->
          <div class="form-section full-width">
            <h3>Información del Contrato</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="contract">Contrato *</label>
                <select id="contract" formControlName="contract_id" class="form-select">
                  <option [ngValue]="null">Seleccionar Contrato</option>
                  <option *ngFor="let contract of contracts" [value]="contract.id">
                    {{ contract.code }} - {{ contract.project_name }} ({{ contract.client_name }})
                  </option>
                </select>
                <div class="error-msg" *ngIf="hasError('contract_id')">Contrato es requerido</div>
              </div>

              <div class="form-group">
                <label for="status">Estado *</label>
                <select id="status" formControlName="status" class="form-select">
                  <option value="pending">Pendiente</option>
                  <option value="under_review">En Revisión</option>
                  <option value="approved">Aprobado</option>
                  <option value="paid">Pagado</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Section 2: Period & Financial Details -->
          <div class="form-section full-width">
            <h3>Periodo y Detalles Financieros</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="period_start">Fecha Inicio del Periodo *</label>
                <input
                  id="period_start"
                  type="date"
                  formControlName="period_start"
                  class="form-control"
                />
                <div class="error-msg" *ngIf="hasError('period_start')">
                  Fecha de inicio requerida
                </div>
              </div>

              <div class="form-group">
                <label for="period_end">Fecha Fin del Periodo *</label>
                <input
                  id="period_end"
                  type="date"
                  formControlName="period_end"
                  class="form-control"
                />
                <div class="error-msg" *ngIf="hasError('period_end')">Fecha de fin requerida</div>
              </div>

              <div class="form-group">
                <label for="amount">Monto Total (S/) *</label>
                <div class="input-group">
                  <input
                    id="amount"
                    type="number"
                    formControlName="amount"
                    class="form-control"
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    class="btn btn-secondary"
                    (click)="calculateValuation()"
                    [disabled]="loading"
                    title="Calcular automáticamente"
                  >
                    <i class="fa-solid fa-calculator"></i>
                  </button>
                </div>
                <div class="error-msg" *ngIf="hasError('amount')">Monto es requerido</div>
              </div>

              <div class="form-group">
                <label for="invoice_number">Número de Factura</label>
                <input
                  id="invoice_number"
                  type="text"
                  formControlName="invoice_number"
                  class="form-control"
                  placeholder="ej. F001-12345"
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

      .input-group {
        display: flex;
        gap: 0.5rem;
      }
      .input-group .form-control {
        flex: 1;
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
export class ValuationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private valuationService = inject(ValuationService);
  private contractService = inject(ContractService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  valuationForm: FormGroup;
  isEditMode = false;
  loading = false;
  valuationId: string | null = null;
  contracts: Contract[] = [];

  constructor() {
    this.valuationForm = this.fb.group({
      contract_id: [null, Validators.required],
      period_start: ['', Validators.required],
      period_end: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      status: ['pending', Validators.required],
      invoice_number: [''],
    });
  }

  ngOnInit(): void {
    this.loadContracts();

    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id && id !== 'undefined' && id !== 'NaN') {
        this.isEditMode = true;
        this.valuationId = id;
        this.loadValuation(id); // Use id directly instead of valuationId
      } else if (id === 'undefined' || id === 'NaN') {
        this.router.navigate(['/equipment/valuations']);
      }
    });
  }

  loadContracts(): void {
    this.contractService.getAll().subscribe((data) => (this.contracts = data));
  }

  loadValuation(id: string | number): void {
    this.loading = true;
    this.valuationService.getById(id).subscribe({
      next: (valuation) => {
        // Format dates
        const formatDate = (dateStr: string) => (dateStr ? dateStr.split('T')[0] : '');

        this.valuationForm.patchValue({
          ...valuation,
          period_start: formatDate(valuation.period_start),
          period_end: formatDate(valuation.period_end),
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
    if (this.valuationForm.invalid) return;

    this.loading = true;
    const valuationData = this.valuationForm.value;

    const request$ =
      this.isEditMode && this.valuationId
        ? this.valuationService.update(this.valuationId, valuationData)
        : this.valuationService.create(valuationData);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/equipment/valuations']);
      },
      error: (err) => {
        console.error('Error saving valuation', err);
        this.loading = false;
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
    const contractId = this.valuationForm.get('contract_id')?.value;
    const periodStart = this.valuationForm.get('period_start')?.value;

    if (!contractId || !periodStart) {
      alert('Seleccione un contrato y fecha de inicio para calcular');
      return;
    }

    const date = new Date(periodStart);
    // Adjust for timezone if needed, but usually date input returns YYYY-MM-DD
    // We want the month of the start date
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    this.loading = true;
    this.valuationService.calculate({ contract_id: contractId, month, year }).subscribe({
      next: (response) => {
        if (response.success) {
          this.valuationForm.patchValue({
            amount: response.data.total_estimated,
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
