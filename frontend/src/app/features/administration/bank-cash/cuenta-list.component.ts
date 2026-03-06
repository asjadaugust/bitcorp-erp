import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BankCashService, CuentaCajaBanco } from './bank-cash.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../core/design-system/data-grid/aero-data-grid.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';
import { AeroButtonComponent } from '../../../core/design-system';
import { ADMINISTRACION_TABS } from '../administracion-tabs';

@Component({
  selector: 'app-cuenta-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    PageCardComponent,
    FormSectionComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Cuentas Bancarias"
      icon="fa-wallet"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
      backUrl="/administracion/bank-cash"
    >
      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'cuenta-list'"
          [columns]="columns"
          [data]="cuentas"
          [loading]="loading"
          [dense]="true"
          [serverSide]="true"
          [totalItems]="cuentas.length"
        >
        </aero-data-grid>
      </app-page-card>

      <!-- Add Account Form -->
      <app-page-card>
        <app-form-section title="Agregar Nueva Cuenta" icon="fa-plus" [columns]="1">
          <form [formGroup]="cuentaForm" class="add-cuenta-form" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <div class="form-group">
                <label for="numero_cuenta">N° Cuenta *</label>
                <input
                  id="numero_cuenta"
                  type="text"
                  formControlName="numero_cuenta"
                  class="form-control"
                  placeholder="ej. 001-123456"
                />
              </div>

              <div class="form-group">
                <label for="cuenta">Nombre de Cuenta *</label>
                <input
                  id="cuenta"
                  type="text"
                  formControlName="cuenta"
                  class="form-control"
                  placeholder="ej. BCP Corriente"
                />
              </div>

              <div class="form-group">
                <label for="estatus">Estatus</label>
                <select id="estatus" formControlName="estatus" class="form-control form-select">
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>

              <div class="form-group form-group--action">
                <aero-button
                  variant="primary"
                  size="small"
                  iconLeft="fa-plus"
                  [disabled]="cuentaForm.invalid || submitting"
                  [loading]="submitting"
                  (clicked)="onSubmit()"
                >
                  Agregar
                </aero-button>
              </div>
            </div>
          </form>
        </app-form-section>
      </app-page-card>
    </app-page-layout>
  `,
  styles: [
    `
      @use 'form-layout';

      .add-cuenta-form {
        width: 100%;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr 150px auto;
        gap: var(--s-16);
        align-items: flex-end;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      }

      .form-group--action {
        padding-bottom: 2px;
      }
    `,
  ],
})
export class CuentaListComponent implements OnInit {
  private readonly bankCashService = inject(BankCashService);
  private readonly fb = inject(FormBuilder);

  tabs = ADMINISTRACION_TABS;
  cuentas: CuentaCajaBanco[] = [];
  loading = false;
  submitting = false;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Administraci\u00f3n', url: '/administracion' },
    { label: 'Caja y Banco', url: '/administracion/bank-cash' },
    { label: 'Cuentas Bancarias' },
  ];

  columns: DataGridColumn[] = [
    {
      key: 'numero_cuenta',
      label: 'N\u00b0 Cuenta',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      key: 'cuenta',
      label: 'Cuenta',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      key: 'estatus',
      label: 'Estatus',
      type: 'badge',
      sortable: true,
      badgeConfig: {
        ACTIVO: { label: 'Activo', class: 'badge success' },
        INACTIVO: { label: 'Inactivo', class: 'badge warning' },
      },
    },
  ];

  cuentaForm: FormGroup;

  constructor() {
    this.cuentaForm = this.fb.group({
      numero_cuenta: ['', Validators.required],
      cuenta: ['', Validators.required],
      estatus: ['ACTIVO'],
    });
  }

  ngOnInit(): void {
    this.loadCuentas();
  }

  loadCuentas(): void {
    this.loading = true;
    this.bankCashService.getCuentas().subscribe({
      next: (cuentas) => {
        this.cuentas = cuentas;
        this.loading = false;
      },
      error: () => {
        this.cuentas = [];
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.cuentaForm.invalid) return;

    this.submitting = true;
    this.bankCashService.createCuenta(this.cuentaForm.value).subscribe({
      next: () => {
        this.cuentaForm.reset({ estatus: 'ACTIVO' });
        this.submitting = false;
        this.loadCuentas();
      },
      error: () => {
        this.submitting = false;
      },
    });
  }
}
