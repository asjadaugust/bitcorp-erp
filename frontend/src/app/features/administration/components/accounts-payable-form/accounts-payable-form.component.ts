import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  AdministrationService,
  AccountsPayable,
  Provider,
} from '../../services/administration.service';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../../shared/components/page-layout/page-layout.component';

@Component({
  selector: 'app-accounts-payable-form',
  standalone: true,
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  template: `
    <app-page-layout
      [title]="isEditMode ? 'Editar Cuenta por Pagar' : 'Nueva Cuenta por Pagar'"
      icon="fa-file-invoice-dollar"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <form (ngSubmit)="onSubmit()" #apForm="ngForm" class="form-container">
        <div class="form-grid">
          <div class="form-group">
            <label>Proveedor *</label>
            <select
              [(ngModel)]="formData.provider_id"
              name="provider_id"
              required
              class="form-control"
            >
              <option value="">Seleccione un proveedor</option>
              <option *ngFor="let provider of providers" [value]="provider.C07001_Id">
                {{ provider.C07001_RazonSocial }} - {{ provider.C07001_RUC }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Tipo de Documento *</label>
            <select
              [(ngModel)]="formData.document_type"
              name="document_type"
              required
              class="form-control"
            >
              <option value="invoice">Factura</option>
              <option value="receipt">Recibo</option>
              <option value="ticket">Boleta</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div class="form-group">
            <label>N° Documento *</label>
            <input
              type="text"
              [(ngModel)]="formData.document_number"
              name="document_number"
              required
              class="form-control"
              placeholder="Ej: F001-00123"
            />
          </div>

          <div class="form-group">
            <label>Fecha de Emisión *</label>
            <input
              type="date"
              [(ngModel)]="formData.issue_date"
              name="issue_date"
              required
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Fecha de Vencimiento *</label>
            <input
              type="date"
              [(ngModel)]="formData.due_date"
              name="due_date"
              required
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Monto *</label>
            <input
              type="number"
              [(ngModel)]="formData.amount"
              name="amount"
              required
              step="0.01"
              class="form-control"
              placeholder="0.00"
            />
          </div>

          <div class="form-group">
            <label>Moneda *</label>
            <select [(ngModel)]="formData.currency" name="currency" required class="form-control">
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </div>

          <div class="form-group full-width">
            <label>Descripción</label>
            <textarea
              [(ngModel)]="formData.description"
              name="description"
              class="form-control"
              rows="3"
              placeholder="Ingrese una descripción opcional..."
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="!apForm.form.valid || loading">
            <i
              class="fa-solid"
              [class.fa-save]="!loading"
              [class.fa-spinner]="loading"
              [class.fa-spin]="loading"
            ></i>
            {{ isEditMode ? 'Actualizar' : 'Crear' }}
          </button>
        </div>
      </form>
    </app-page-layout>
  `,
  styles: [
    `
      .form-container {
        max-width: 800px;
        margin: 0 auto;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--s-16);
        margin-bottom: var(--s-24);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
      }

      .form-group.full-width {
        grid-column: 1 / -1;
      }

      label {
        font-weight: 600;
        font-size: var(--type-bodySmall-size);
        color: var(--grey-700);
      }

      .form-control {
        padding: var(--s-8) var(--s-12);
        border: 1px solid var(--grey-300);
        border-radius: var(--s-8);
        font-size: var(--type-bodySmall-size);
      }

      .form-control:focus {
        outline: none;
        border-color: var(--primary-500);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--s-12);
      }

      .btn {
        padding: var(--s-10) var(--s-20);
        border: none;
        border-radius: var(--s-8);
        font-weight: 600;
        cursor: pointer;
      }

      .btn-primary {
        background: var(--primary-500);
        color: white;
      }

      .btn-secondary {
        background: var(--grey-200);
        color: var(--grey-800);
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class AccountsPayableFormComponent implements OnInit {
  private adminService = inject(AdministrationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  providers: Provider[] = [];
  formData: Partial<AccountsPayable> = {
    provider_id: undefined,
    document_type: 'invoice',
    document_number: '',
    issue_date: '',
    due_date: '',
    amount: 0,
    currency: 'PEN',
    description: '',
  };

  loading = false;
  isEditMode = false;
  recordId?: number;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Administración', url: '/administracion' },
    { label: 'Cuentas por Pagar', url: '/administracion/accounts-payable' },
    { label: 'Formulario' },
  ];

  ngOnInit() {
    this.loadProviders();
    this.recordId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.recordId;

    if (this.isEditMode) {
      this.loadRecord();
    }
  }

  loadProviders() {
    this.adminService.getProviders().subscribe({
      next: (providers) => {
        this.providers = providers;
      },
      error: (err) => console.error('Error loading providers:', err),
    });
  }

  loadRecord() {
    if (!this.recordId) return;

    this.loading = true;
    this.adminService.getAccountsPayableById(this.recordId).subscribe({
      next: (record) => {
        this.formData = { ...record };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onSubmit() {
    this.loading = true;
    const operation =
      this.isEditMode && this.recordId
        ? this.adminService.updateAccountsPayable(this.recordId, this.formData)
        : this.adminService.createAccountsPayable(this.formData);

    operation.subscribe({
      next: () => {
        this.router.navigate(['/administracion/accounts-payable']);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  cancel() {
    this.router.navigate(['/administracion/accounts-payable']);
  }
}
