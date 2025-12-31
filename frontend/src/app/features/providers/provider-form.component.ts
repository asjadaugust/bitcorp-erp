import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProviderService } from '../../core/services/provider.service';
import { Provider } from '../../core/models/provider.model';


@Component({
  selector: 'app-provider-form',
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
            <h1>{{ isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información del proveedor'
                  : 'Registrar un nuevo proveedor en el sistema'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button type="button" class="btn btn-primary" (click)="onSubmit()" [disabled]="providerForm.invalid || loading">
            <i *ngIf="loading" class="fa-solid fa-spinner fa-spin"></i>
            <i *ngIf="!loading" class="fa-solid fa-save"></i>
            {{ isEditMode ? 'Guardar Cambios' : 'Crear Proveedor' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="providerForm" class="form-grid">
          <!-- Section 1: Basic Information -->
          <div class="form-section full-width">
            <h3>Información Básica</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="tax_id">RUC *</label>
                <input
                  id="tax_id"
                  type="text"
                  formControlName="tax_id"
                  class="form-control"
                  placeholder="ej. 20123456789"
                  maxlength="11"
                />
                <div class="error-msg" *ngIf="hasError('tax_id')">RUC es requerido (11 dígitos)</div>
              </div>

              <div class="form-group">
                <label for="business_name">Razón Social *</label>
                <input
                  id="business_name"
                  type="text"
                  formControlName="business_name"
                  class="form-control"
                  placeholder="ej. Servicios Generales S.A.C."
                />
                <div class="error-msg" *ngIf="hasError('business_name')">Razón Social es requerida</div>
              </div>

              <div class="form-group">
                <label for="provider_type">Tipo de Proveedor</label>
                <select id="provider_type" formControlName="provider_type" class="form-select">
                  <option value="">Seleccionar...</option>
                  <option value="rental">Alquiler</option>
                  <option value="owned">Propio</option>
                  <option value="service">Servicio</option>
                  <option value="material">Materiales</option>
                </select>
              </div>

              <div class="form-group">
                <label for="status">Estado</label>
                <select id="status" formControlName="status" class="form-select">
                  <option value="">Seleccionar...</option>
                  <option value="lista_proveedor">Lista Proveedor</option>
                  <option value="lista_otros_proveedores">Lista de Otros proveedores</option>
                  <option value="lista_negra">Lista Negra</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div class="form-group">
                <label for="address">Dirección</label>
                <input
                  id="address"
                  type="text"
                  formControlName="address"
                  class="form-control"
                  placeholder="ej. Av. Principal 123, Lima"
                />
              </div>
            </div>
          </div>

          <!-- Section 2: Financial Information (Table) -->
          <div class="form-section full-width">
            <div class="section-header">
              <h3>Información Financiera</h3>
              <button type="button" class="btn btn-sm btn-secondary" (click)="addBankAccount()">
                <i class="fa-solid fa-plus"></i> Agregar Cuenta
              </button>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Entidad Financiera</th>
                    <th>N° Cuenta</th>
                    <th>CCI</th>
                    <th>Nombre de la Cuenta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody formArrayName="bank_accounts">
                  <tr *ngFor="let account of bankAccountsArray.controls; let i = index" [formGroupName]="i">
                    <td>
                      <input type="text" formControlName="bank_name" class="form-control" placeholder="Ej. BCP" />
                    </td>
                    <td>
                      <input type="text" formControlName="account_number" class="form-control" placeholder="N° Cuenta" />
                    </td>
                    <td>
                      <input type="text" formControlName="cci" class="form-control" placeholder="CCI" />
                    </td>
                    <td>
                      <input type="text" formControlName="account_name" class="form-control" placeholder="Titular" />
                    </td>
                    <td>
                      <button type="button" class="btn btn-icon btn-danger" (click)="removeBankAccount(i)">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="bankAccountsArray.length === 0">
                    <td colspan="5" class="empty-row">No hay cuentas bancarias registradas</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Section 3: Contact Information (Table) -->
          <div class="form-section full-width">
            <div class="section-header">
              <h3>Información de Contacto</h3>
              <button type="button" class="btn btn-sm btn-secondary" (click)="addContact()">
                <i class="fa-solid fa-plus"></i> Agregar Contacto
              </button>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cargo</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody formArrayName="contacts">
                  <tr *ngFor="let contact of contactsArray.controls; let i = index" [formGroupName]="i">
                    <td>
                      <input type="text" formControlName="name" class="form-control" placeholder="Nombre completo" />
                    </td>
                    <td>
                      <input type="text" formControlName="position" class="form-control" placeholder="Cargo" />
                    </td>
                    <td>
                      <input type="text" formControlName="phone" class="form-control" placeholder="Teléfono" />
                    </td>
                    <td>
                      <input type="email" formControlName="email" class="form-control" placeholder="Email" />
                    </td>
                    <td>
                      <button type="button" class="btn btn-icon btn-danger" (click)="removeContact(i)">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="contactsArray.length === 0">
                    <td colspan="5" class="empty-row">No hay contactos registrados</td>
                  </tr>
                </tbody>
              </table>
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

      .data-table td .form-control {
        padding: 0.5rem;
        font-size: 13px;
      }

      .empty-row {
        text-align: center;
        color: var(--grey-500);
        font-style: italic;
        padding: 1.5rem !important;
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

      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 12px;
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

      @media (max-width: 768px) {
        .section-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ProviderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private providerService = inject(ProviderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  providerForm: FormGroup;
  isEditMode = false;
  loading = false;
  providerId: string | null = null;

  constructor() {
    this.providerForm = this.fb.group({
      tax_id: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      business_name: ['', Validators.required],
      provider_type: [''],
      status: ['lista_proveedor', Validators.required],
      address: [''],
      bank_accounts: this.fb.array([]),
      contacts: this.fb.array([]),
    });
  }

  get bankAccountsArray(): FormArray {
    return this.providerForm.get('bank_accounts') as FormArray;
  }

  get contactsArray(): FormArray {
    return this.providerForm.get('contacts') as FormArray;
  }

  addBankAccount(): void {
    const accountGroup = this.fb.group({
      bank_name: [''],
      account_number: [''],
      cci: [''],
      account_name: [''],
    });
    this.bankAccountsArray.push(accountGroup);
  }

  removeBankAccount(index: number): void {
    this.bankAccountsArray.removeAt(index);
  }

  addContact(): void {
    const contactGroup = this.fb.group({
      name: [''],
      position: [''],
      phone: [''],
      email: [''],
    });
    this.contactsArray.push(contactGroup);
  }

  removeContact(index: number): void {
    this.contactsArray.removeAt(index);
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id && id !== 'undefined' && id !== 'NaN') {
        this.isEditMode = true;
        this.providerId = id;
        this.loadProvider(id); // Use id directly instead of providerId
      } else if (id === 'undefined' || id === 'NaN') {
        this.router.navigate(['/providers']);
      }
    });
  }

  loadProvider(id: string | number): void {
    this.loading = true;
    this.providerService.getById(id).subscribe({
      next: (provider: any) => {
        this.providerForm.patchValue({
          tax_id: provider.tax_id,
          business_name: provider.business_name,
          provider_type: provider.provider_type || '',
          status: provider.status || 'lista_proveedor',
          address: provider.address || '',
        });

        // Load bank accounts if available
        if (provider.bank_accounts && Array.isArray(provider.bank_accounts)) {
          provider.bank_accounts.forEach((account: any) => {
            const accountGroup = this.fb.group({
              bank_name: [account.bank_name || ''],
              account_number: [account.account_number || ''],
              cci: [account.cci || ''],
              account_name: [account.account_name || ''],
            });
            this.bankAccountsArray.push(accountGroup);
          });
        }

        // Load contacts if available
        if (provider.contacts && Array.isArray(provider.contacts)) {
          provider.contacts.forEach((contact: any) => {
            const contactGroup = this.fb.group({
              name: [contact.name || ''],
              position: [contact.position || ''],
              phone: [contact.phone || ''],
              email: [contact.email || ''],
            });
            this.contactsArray.push(contactGroup);
          });
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading provider', err);
        this.loading = false;
        this.router.navigate(['/providers']);
      },
    });
  }

  onSubmit(): void {
    if (this.providerForm.invalid) return;

    this.loading = true;
    const providerData = this.providerForm.value;

    const request$ =
      this.isEditMode && this.providerId
        ? this.providerService.update(this.providerId, providerData)
        : this.providerService.create(providerData);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/providers']);
      },
      error: (err) => {
        console.error('Error saving provider', err);
        this.loading = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/providers']);
  }

  hasError(field: string): boolean {
    const control = this.providerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
