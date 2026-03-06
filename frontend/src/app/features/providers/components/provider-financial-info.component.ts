import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';
import {
  AeroButtonComponent,
  AeroCardComponent,
  AeroBadgeComponent,
} from '../../../core/design-system';
import { ConfirmService } from '../../../core/services/confirm.service';

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
  imports: [
    AeroButtonComponent,
    AeroCardComponent,
    AeroBadgeComponent,
    CommonModule,
    ReactiveFormsModule,
    DropdownComponent,
  ],
  template: `
    <div class="financial-info-section">
      <div class="section-header">
        <h3><i class="fa-solid fa-building-columns"></i> Información Financiera</h3>
        <aero-button
          *ngIf="!showForm && !readOnly"
          variant="primary"
          size="small"
          iconLeft="fa-plus"
          (clicked)="showForm = !showForm"
          >Agregar Cuenta</aero-button
        >
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
            <aero-button variant="secondary" (clicked)="cancelForm()">Cancelar</aero-button>
            <aero-button
              variant="primary"
              [disabled]="financialForm.invalid || loading"
              (clicked)="onSubmit()"
              >{{ editingId ? 'Actualizar' : 'Guardar' }}</aero-button
            >
          </div>
        </form>
      </div>

      <!-- List -->
      <div class="financial-list" *ngIf="!loading && financialInfoList.length > 0">
        <aero-card
          [title]="info.nombre_banco"
          [hasHeaderActions]="true"
          appearance="bordered"
          *ngFor="let info of financialInfoList"
        >
          <div header-actions>
            <aero-badge variant="primary" *ngIf="info.es_principal">Principal</aero-badge>
            <aero-badge variant="neutral">{{ info.moneda }}</aero-badge>
            <ng-container *ngIf="!readOnly">
              <aero-button
                variant="tertiary"
                size="small"
                iconCenter="fa-pen"
                (clicked)="editFinancialInfo(info)"
              ></aero-button>
              <aero-button
                variant="tertiary"
                size="small"
                iconCenter="fa-trash"
                (clicked)="deleteFinancialInfo(info.id!)"
              ></aero-button>
            </ng-container>
          </div>
          <div class="account-rows">
            <div class="info-row">
              <i class="fa-solid fa-hashtag" title="Número de Cuenta"></i>
              <span class="value">{{ info.numero_cuenta }}</span>
            </div>
            <div class="info-row" *ngIf="info.cci">
              <i class="fa-solid fa-building" title="CCI"></i>
              <span class="value">{{ info.cci }}</span>
            </div>
            <div class="info-row" *ngIf="info.nombre_titular">
              <i class="fa-solid fa-user" title="Titular"></i>
              <span class="value">{{ info.nombre_titular }}</span>
            </div>
          </div>
        </aero-card>
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
        background: var(--grey-100);
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
      .form-actions {
        display: flex;
        gap: var(--s-12);
        justify-content: flex-end;
      }
      .financial-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--s-16);
      }
      .account-rows {
        display: flex;
        flex-direction: column;
        gap: var(--s-12);
      }
      .info-row {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        color: var(--grey-700);
        font-size: 14px;

        i {
          color: var(--grey-400);
          width: 16px;
          text-align: center;
        }
      }
      .value {
        font-family: monospace;
        font-size: 14px;
        font-weight: 500;
        color: var(--grey-900);
      }
      .empty-state {
        text-align: center;
        padding: var(--s-48) var(--s-24);
        color: var(--grey-500);
        background: var(--grey-50);
        border-radius: var(--s-8);
        border: 1px dashed var(--grey-300);
      }
    `,
  ],
})
export class ProviderFinancialInfoComponent implements OnInit {
  @Input() providerId!: string;
  @Input() readOnly = false;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private confirmSvc = inject(ConfirmService);

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
    this.confirmSvc.confirmDelete('esta cuenta').subscribe((confirmed) => {
      if (confirmed) {
        this.http
          .delete(`${environment.apiUrl}/providers/financial-info/${id}`)
          .subscribe(() => this.loadFinancialInfo());
      }
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.financialForm.reset({ moneda: 'PEN', es_principal: false });
  }
}
