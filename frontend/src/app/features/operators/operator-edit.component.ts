import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OperatorService } from '../../core/services/operator.service';
import { Operator } from '../../core/models/operator.model';

@Component({
  selector: 'app-operator-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="form-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fa-solid" [class.fa-user-plus]="isNew" [class.fa-user-pen]="!isNew"></i>
          </div>
          <div class="title-group">
            <h1>{{ isNew ? 'Nuevo Operador' : 'Editar Operador' }}</h1>
            <p class="subtitle">
              {{ isNew ? 'Registrar un nuevo operador en el sistema' : 'Actualizar información del operador' }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button 
            type="submit" 
            form="operatorForm"
            class="btn btn-primary" 
            [disabled]="opForm.invalid || saving">
            <i *ngIf="saving" class="fa-solid fa-spinner fa-spin"></i>
            <i *ngIf="!saving" class="fa-solid fa-save"></i>
            {{ isNew ? 'Crear Operador' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form id="operatorForm" (ngSubmit)="saveOperator()" #opForm="ngForm" class="form-grid">
          <!-- Section 1: Personal Information -->
          <div class="form-section full-width">
            <h3>Información Personal</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="document_type">Tipo de Documento *</label>
                <select
                  id="document_type"
                  name="document_type"
                  [(ngModel)]="operator.document_type"
                  required
                  class="form-select"
                >
                  <option value="DNI">DNI</option>
                  <option value="CE">CE (Carné de Extranjería)</option>
                </select>
              </div>

              <div class="form-group">
                <label for="document_number">Número de Documento *</label>
                <input
                  type="text"
                  id="document_number"
                  name="document_number"
                  [(ngModel)]="operator.document_number"
                  required
                  class="form-control"
                  placeholder="Ej. 12345678"
                />
              </div>

              <div class="form-group">
                <label for="first_name">Nombre *</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  [(ngModel)]="operator.first_name"
                  required
                  class="form-control"
                  placeholder="Ej. Juan"
                />
              </div>

              <div class="form-group">
                <label for="last_name">Apellido *</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  [(ngModel)]="operator.last_name"
                  required
                  class="form-control"
                  placeholder="Ej. Pérez"
                />
              </div>

              <div class="form-group">
                <label for="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  [(ngModel)]="operator.email"
                  required
                  class="form-control"
                  placeholder="juan.perez@bitcorp.com"
                />
              </div>

              <div class="form-group">
                <label for="phone">Teléfono *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  [(ngModel)]="operator.phone"
                  required
                  class="form-control"
                  placeholder="+51 999 999 999"
                />
              </div>
            </div>
          </div>

          <!-- Section 2: Employment Details -->
          <div class="form-section full-width">
            <h3>Detalles Laborales</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="status">Estado *</label>
                <select 
                  id="status" 
                  name="status" 
                  [(ngModel)]="operator.status" 
                  required 
                  class="form-select">
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="on_leave">De Vacaciones</option>
                </select>
              </div>

              <div class="form-group">
                <label for="employment_start_date">Fecha de Inicio *</label>
                <input
                  type="date"
                  id="employment_start_date"
                  name="employment_start_date"
                  [(ngModel)]="operator.employment_start_date"
                  required
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="hourly_rate">Tarifa por Hora (USD) *</label>
                <input
                  type="number"
                  id="hourly_rate"
                  name="hourly_rate"
                  [(ngModel)]="operator.hourly_rate"
                  step="0.01"
                  min="0"
                  required
                  class="form-control"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <!-- Section 3: License Info -->
          <div class="form-section full-width">
            <h3>Información de Licencia</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="license_number">Número de Licencia</label>
                <input
                  type="text"
                  id="license_number"
                  name="license_number"
                  [(ngModel)]="operator.license_number"
                  class="form-control"
                  placeholder="A-12345678"
                />
              </div>

              <div class="form-group">
                <label for="license_expiry">Vencimiento</label>
                <input
                  type="date"
                  id="license_expiry"
                  name="license_expiry"
                  [(ngModel)]="operator.license_expiry"
                  class="form-control"
                />
              </div>
            </div>
          </div>

          <!-- Section 4: Legajo Personal (Personal File) -->
          <div class="form-section full-width">
            <div class="section-header">
              <h3>Legajo Personal</h3>
              <button type="button" class="btn btn-sm btn-secondary" (click)="addPersonalDocument()">
                <i class="fa-solid fa-plus"></i> Agregar Documento
              </button>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Fecha Registro</th>
                    <th>Tipo Documento</th>
                    <th>Descripción</th>
                    <th>Adjunto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let doc of personalDocuments; let i = index">
                    <td>
                      <input 
                        type="date" 
                        [(ngModel)]="doc.registration_date" 
                        [name]="'doc_date_' + i"
                        class="form-control" 
                      />
                    </td>
                    <td>
                      <select [(ngModel)]="doc.document_type" [name]="'doc_type_' + i" class="form-select">
                        <option value="">Seleccionar...</option>
                        <option value="119_Certificados">119_Certificados</option>
                        <option value="120_Otros">120_Otros</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        [(ngModel)]="doc.description" 
                        [name]="'doc_desc_' + i"
                        class="form-control" 
                        placeholder="Descripción del documento"
                      />
                    </td>
                    <td>
                      <div class="file-input-wrapper">
                        <input 
                          type="file" 
                          [id]="'file_' + i" 
                          (change)="onFileSelected($event, i)"
                          class="file-input"
                        />
                        <label [for]="'file_' + i" class="btn btn-sm btn-secondary">
                          <i class="fa-solid fa-upload"></i> {{ doc.file_name || 'Seleccionar' }}
                        </label>
                      </div>
                    </td>
                    <td>
                      <button type="button" class="btn btn-icon btn-danger" (click)="removePersonalDocument(i)">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="personalDocuments.length === 0">
                    <td colspan="5" class="empty-row">No hay documentos registrados</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Section 5: Notes -->
          <div class="form-section full-width">
            <h3>Notas Adicionales</h3>
            <div class="form-group">
              <textarea
                id="notes"
                name="notes"
                [(ngModel)]="operator.notes"
                rows="4"
                class="form-control"
                placeholder="Información adicional sobre el operador..."
              ></textarea>
            </div>
          </div>
        </form>
      </div>

      <!-- Error/Success Messages -->
      <div *ngIf="errorMessage" class="alert alert-error">
        <i class="fa-solid fa-circle-exclamation"></i> {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="alert alert-success">
        <i class="fa-solid fa-check-circle"></i> {{ successMessage }}
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

      /* Alerts */
      .alert {
        padding: 1rem;
        border-radius: 6px;
        margin-top: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 14px;
      }

      .alert-error {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
        border: 1px solid var(--semantic-red-200);
      }

      .alert-success {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
        border: 1px solid var(--semantic-green-200);
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
    `,
  ],
})
export class OperatorEditComponent implements OnInit {
  private operatorService = inject(OperatorService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  operator: any = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'active',
    employment_start_date: new Date().toISOString().split('T')[0],
    hourly_rate: 0,
    user_id: 1,
    document_type: 'DNI',
    document_number: '',
  };

  personalDocuments: any[] = [];

  loading = false;
  saving = false;
  isNew = true;
  errorMessage = '';
  successMessage = '';

  addPersonalDocument(): void {
    this.personalDocuments.push({
      registration_date: new Date().toISOString().split('T')[0],
      document_type: '',
      description: '',
      file_name: '',
      file: null,
    });
  }

  removePersonalDocument(index: number): void {
    this.personalDocuments.splice(index, 1);
  }

  onFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.personalDocuments[index].file = file;
      this.personalDocuments[index].file_name = file.name;
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isNew = false;
      this.loadOperator(id);
    } else {
      this.loading = false;
    }
  }

  loadOperator(id: number): void {
    this.loading = true;
    this.operatorService.getById(id).subscribe({
      next: (data) => {
        this.operator = {
          ...data,
          employment_start_date: new Date(data.employment_start_date).toISOString().split('T')[0],
          license_expiry: data.license_expiry
            ? new Date(data.license_expiry).toISOString().split('T')[0]
            : '',
          document_type: data.document_type || 'DNI',
          document_number: data.document_number || '',
        };
        // Load personal documents if available
        if (data.personal_documents && Array.isArray(data.personal_documents)) {
          this.personalDocuments = data.personal_documents;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load operator';
        this.loading = false;
      },
    });
  }

  saveOperator(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = this.isNew
      ? this.operatorService.create(this.operator)
      : this.operatorService.update(this.operator.id, this.operator);

    request$.subscribe({
      next: () => {
        this.successMessage = `Operator ${this.isNew ? 'created' : 'updated'} successfully!`;
        this.saving = false;
        setTimeout(() => {
          this.router.navigate(['/operators']);
        }, 1500);
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Failed to save operator';
        this.saving = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/operators']);
  }
}
