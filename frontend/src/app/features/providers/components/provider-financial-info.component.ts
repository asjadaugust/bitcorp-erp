import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';

interface InfoFinanciera {
  id?: number;
  id_proveedor: string;
  nombre_banco: string;
  numero_cuenta: string;
  cci?: string;
  nombre_titular?: string;
  tipo_cuenta?: string;
  moneda: string;
  es_principal: boolean;
  estado: string;
}

@Component({
  selector: 'app-provider-financial-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DropdownComponent],
  template: `
    <div class="financial-info-section">
      <div class="section-header">
        <h3><i class="fa-solid fa-building-columns"></i> Información Financiera</h3>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          (click)="showForm = !showForm"
          *ngIf="!showForm"
        >
          <i class="fa-solid fa-plus"></i> Agregar Cuenta
        </button>
      </div>

      <!-- Form -->
      <div class="financial-form card" *ngIf="showForm">
        <form [formGroup]="financialForm" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <div class="form-group">
              <label for="nombre_banco">Entidad Financiera *</label>
              <input
                id="nombre_banco"
                type="text"
                formControlName="nombre_banco"
                class="form-control"
                placeholder="ej. Banco de Crédito del Perú"
              />
            </div>

            <div class="form-group">
              <label for="numero_cuenta">N° Cuenta *</label>
              <input
                id="numero_cuenta"
                type="text"
                formControlName="numero_cuenta"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="cci">CCI</label>
              <input id="cci" type="text" formControlName="cci" class="form-control" />
            </div>

            <div class="form-group">
              <label for="nombre_titular">Nombre de la Cuenta</label>
              <input
                id="nombre_titular"
                type="text"
                formControlName="nombre_titular"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="moneda">Moneda *</label>
              <app-dropdown
                formControlName="moneda"
                [options]="currencyOptions"
                [placeholder]="'Seleccionar...'"
              ></app-dropdown>
            </div>

            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" formControlName="es_principal" />
                Cuenta Principal
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="cancelForm()">Cancelar</button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="financialForm.invalid || loading"
            >
              {{ editingId ? 'Actualizar' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>

      <!-- List -->
      <div class="financial-list" *ngIf="!loading && financialInfoList.length > 0">
        <div class="financial-card" *ngFor="let info of financialInfoList">
          <div class="card-header">
            <div class="bank-info">
              <h4>{{ info.nombre_banco }}</h4>
              <span class="badge badge-primary" *ngIf="info.es_principal">Principal</span>
              <span class="badge badge-currency">{{ info.moneda }}</span>
            </div>
            <div class="actions">
              <button type="button" class="btn-icon" (click)="editFinancialInfo(info)">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button
                type="button"
                class="btn-icon btn-danger"
                (click)="deleteFinancialInfo(info.id!)"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">N° Cuenta:</span>
              <span class="value">{{ info.numero_cuenta }}</span>
            </div>
            <div class="info-row" *ngIf="info.cci">
              <span class="label">CCI:</span>
              <span class="value">{{ info.cci }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading && financialInfoList.length === 0 && !showForm">
        <i class="fa-solid fa-building-columns"></i>
        <p>No hay información financiera registrada</p>
      </div>
    </div>
  `,
  styles: [
    `
      .financial-info-section {
        margin-top: var(--s-24);
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-16);
      }
      .section-header h3 {
        font-size: var(--type-h4-size);
        color: var(--grey-900);
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }
      .financial-form {
        margin-bottom: var(--s-24);
        padding: var(--s-24);
        background: var(--neutral-0);
        border-radius: var(--s-8);
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--s-16);
        margin-bottom: var(--s-24);
      }
      .form-group {
        display: flex;
        flex-direction: column;
      }
      .form-control,
      .form-select {
        padding: var(--s-8) var(--s-12);
        border: 1px solid var(--grey-300);
        border-radius: var(--s-4);
      }
      .btn {
        padding: var(--s-8) var(--s-16);
        border: none;
        border-radius: var(--s-8);
        font-weight: 600;
        cursor: pointer;
      }
      .btn-primary {
        background: var(--primary-500);
        color: var(--neutral-0);
      }
      .btn-secondary {
        background: var(--grey-300);
        color: var(--grey-700);
      }
      .btn-sm {
        padding: var(--s-4) var(--s-12);
        font-size: var(--type-bodySmall-size);
      }
      .form-actions {
        display: flex;
        gap: var(--s-12);
        justify-content: flex-end;
      }
      .financial-list {
        display: grid;
        gap: var(--s-16);
      }
      .financial-card {
        background: var(--neutral-0);
        border: 1px solid var(--grey-200);
        border-radius: var(--s-8);
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        padding: var(--s-16);
        background: var(--grey-50);
      }
      .bank-info {
        display: flex;
        align-items: center;
        gap: var(--s-12);
      }
      .badge {
        padding: var(--s-4) var(--s-8);
        border-radius: var(--s-12);
        font-size: var(--type-label-size);
        font-weight: 600;
      }
      .badge-primary {
        background: var(--primary-100);
        color: var(--primary-700);
      }
      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: var(--s-4);
        color: var(--grey-500);
      }
      .card-body {
        padding: var(--s-16);
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        padding: var(--s-8) 0;
      }
      .empty-state {
        text-align: center;
        padding: var(--s-48) var(--s-24);
        color: var(--grey-500);
      }
    `,
  ],
})
export class ProviderFinancialInfoComponent implements OnInit {
  @Input() providerId!: string;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  financialInfoList: InfoFinanciera[] = [];
  financialForm!: FormGroup;
  showForm = false;
  loading = false;
  editingId: number | null = null;

  currencyOptions: DropdownOption[] = [
    { label: 'Soles (PEN)', value: 'PEN' },
    { label: 'Dólares (USD)', value: 'USD' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadFinancialInfo();
  }

  initForm(): void {
    this.financialForm = this.fb.group({
      nombre_banco: ['', Validators.required],
      numero_cuenta: ['', Validators.required],
      cci: [''],
      nombre_titular: [''],
      moneda: ['PEN', Validators.required],
      es_principal: [false],
    });
  }

  loadFinancialInfo(): void {
    this.loading = true;
    this.http
      .get<InfoFinanciera[]>(`${environment.apiUrl}/providers/${this.providerId}/financial-info`)
      .subscribe({
        next: (data) => {
          this.financialInfoList = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onSubmit(): void {
    if (this.financialForm.invalid) return;

    const request = this.editingId
      ? this.http.put(
          `${environment.apiUrl}/providers/financial-info/${this.editingId}`,
          this.financialForm.value
        )
      : this.http.post(
          `${environment.apiUrl}/providers/${this.providerId}/financial-info`,
          this.financialForm.value
        );

    request.subscribe({
      next: () => {
        this.loadFinancialInfo();
        this.cancelForm();
      },
    });
  }

  editFinancialInfo(info: InfoFinanciera): void {
    this.editingId = info.id!;
    this.financialForm.patchValue(info);
    this.showForm = true;
  }

  deleteFinancialInfo(id: number): void {
    if (!confirm('¿Eliminar esta cuenta?')) return;

    this.http
      .delete(`${environment.apiUrl}/providers/financial-info/${id}`)
      .subscribe(() => this.loadFinancialInfo());
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.financialForm.reset({ moneda: 'PEN', es_principal: false });
  }
}
