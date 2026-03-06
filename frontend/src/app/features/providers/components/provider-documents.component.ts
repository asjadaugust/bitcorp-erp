import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProviderService } from '../../../core/services/provider.service';
import { ProviderDocument } from '../../../core/models/provider-document.model';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';
import {
  AeroButtonComponent,
  AeroCardComponent,
  AeroBadgeComponent,
} from '../../../core/design-system';
import type { BadgeVariant } from '../../../core/design-system';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-provider-documents',
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
    <div class="documents-section">
      <div class="section-header">
        <h3><i class="fa-solid fa-file-invoice"></i> Documentos</h3>
        <aero-button
          *ngIf="!showForm"
          variant="primary"
          size="small"
          iconLeft="fa-plus"
          (clicked)="showForm = !showForm"
          >Agregar Documento</aero-button
        >
      </div>

      <!-- Form -->
      <div class="document-form card" *ngIf="showForm">
        <form [formGroup]="documentForm" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <div class="form-group">
              <label for="tipo_documento" class="form-label">Tipo de Documento *</label>
              <app-dropdown
                formControlName="tipo_documento"
                [options]="documentTypeOptions"
                [placeholder]="'Seleccionar...'"
              ></app-dropdown>
            </div>

            <div class="form-group">
              <label for="numero_documento" class="form-label">Número de Documento</label>
              <input
                id="numero_documento"
                type="text"
                formControlName="numero_documento"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="fecha_emision" class="form-label">Fecha de Emisión</label>
              <input
                id="fecha_emision"
                type="date"
                formControlName="fecha_emision"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="fecha_vencimiento" class="form-label">Fecha de Vencimiento</label>
              <input
                id="fecha_vencimiento"
                type="date"
                formControlName="fecha_vencimiento"
                class="form-control"
              />
            </div>

            <div class="form-group full-width">
              <span class="form-label">Documento *</span>

              <div *ngIf="!documentForm.get('archivo_url')?.value" class="upload-container">
                <app-file-uploader
                  [accept]="'.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx'"
                  (fileSelected)="onFileSelected($event)"
                  [label]="'Subir documento'"
                ></app-file-uploader>
                <div *ngIf="uploading" class="upload-progress">
                  <i class="fa-solid fa-spinner fa-spin"></i> Subiendo archivo...
                </div>
              </div>

              <div *ngIf="documentForm.get('archivo_url')?.value" class="file-preview">
                <div class="file-info">
                  <i class="fa-solid fa-file-check"></i>
                  <a
                    [href]="documentForm.get('archivo_url')?.value"
                    target="_blank"
                    class="file-link"
                    >Ver archivo actual</a
                  >
                </div>
                <aero-button
                  variant="secondary"
                  size="small"
                  iconLeft="fa-xmark"
                  (clicked)="removeFile()"
                  >Cambiar</aero-button
                >
              </div>

              <!-- Hidden input to store URL but keep validation working -->
              <input type="hidden" formControlName="archivo_url" />
            </div>

            <div class="form-group full-width">
              <label for="observaciones" class="form-label">Observaciones</label>
              <textarea
                id="observaciones"
                formControlName="observaciones"
                class="form-control"
                rows="2"
              ></textarea>
            </div>
          </div>

          <div class="form-actions">
            <aero-button variant="secondary" (clicked)="cancelForm()">Cancelar</aero-button>
            <aero-button
              variant="primary"
              [disabled]="documentForm.invalid || uploading"
              (clicked)="onSubmit()"
              >{{ editingId ? 'Actualizar' : 'Guardar' }}</aero-button
            >
          </div>
        </form>
      </div>

      <!-- List -->
      <div class="documents-grid" *ngIf="!loading && documentsList.length > 0">
        <aero-card
          [title]="getDocumentTypeLabel(doc.tipo_documento)"
          [subtitle]="doc.numero_documento ? '# ' + doc.numero_documento : ''"
          [hasHeaderActions]="true"
          appearance="bordered"
          *ngFor="let doc of documentsList"
        >
          <div header-actions>
            <aero-badge [variant]="getExpirationVariant(doc)">{{
              getExpirationText(doc.fecha_vencimiento)
            }}</aero-badge>
            <a
              [href]="doc.archivo_url"
              target="_blank"
              class="btn-icon"
              *ngIf="doc.archivo_url"
              title="Ver documento"
            >
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <aero-button
              variant="tertiary"
              size="small"
              iconCenter="fa-pen"
              title="Editar"
              (clicked)="editDocument(doc)"
            ></aero-button>
            <aero-button
              variant="tertiary"
              size="small"
              iconCenter="fa-trash"
              title="Eliminar"
              (clicked)="deleteDocument(doc.id)"
            ></aero-button>
          </div>
          <div class="doc-details">
            <div class="doc-detail" *ngIf="doc.fecha_emision">
              <span class="label">Emisión:</span>
              <span>{{ doc.fecha_emision | date: 'dd/MM/yyyy' }}</span>
            </div>
            <div class="doc-detail" *ngIf="doc.fecha_vencimiento">
              <span class="label">Vencimiento:</span>
              <span>{{ doc.fecha_vencimiento | date: 'dd/MM/yyyy' }}</span>
            </div>
            <div class="doc-notes" *ngIf="doc.observaciones">
              <p>{{ doc.observaciones }}</p>
            </div>
          </div>
        </aero-card>
      </div>

      <div class="empty-state" *ngIf="!loading && documentsList.length === 0 && !showForm">
        <i class="fa-solid fa-file-invoice"></i>
        <p>No hay documentos registrados</p>
      </div>
    </div>
  `,
  styles: [
    `
      .documents-section {
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
        margin: 0;
      }
      .document-form {
        margin-bottom: var(--s-24);
        padding: var(--s-24);
        background: var(--grey-100);
        border-radius: var(--s-8);
        border: 1px solid var(--grey-200);
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-16);
        margin-bottom: var(--s-24);
      }
      .form-group {
        display: flex;
        flex-direction: column;
      }
      .full-width {
        grid-column: 1 / -1;
      }
      .form-label {
        font-size: var(--type-label-size);
        font-weight: 600;
        color: var(--grey-700);
        margin-bottom: var(--s-4);
      }
      .form-control,
      .form-select {
        padding: var(--s-8) var(--s-12);
        border: 1px solid var(--grey-300);
        border-radius: var(--s-4);
        font-family: inherit;
      }
      .form-actions {
        display: flex;
        gap: var(--s-12);
        justify-content: flex-end;
      }
      .documents-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--s-16);
      }
      .btn-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        color: var(--grey-600);
        border-radius: var(--radius-sm);
        text-decoration: none;
        &:hover {
          background: var(--grey-100);
          color: var(--primary-700);
        }
      }
      .doc-details {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
      }
      .doc-detail {
        display: flex;
        gap: var(--s-8);
        font-size: var(--type-bodySmall-size);
        color: var(--grey-700);
      }
      .label {
        font-weight: 600;
        color: var(--grey-600);
        min-width: 80px;
      }
      .doc-notes {
        margin-top: var(--s-8);
        font-size: var(--type-bodySmall-size);
        color: var(--grey-600);
        font-style: italic;
        background: var(--grey-50);
        padding: var(--s-8);
        border-radius: var(--s-4);
      }
      .empty-state {
        text-align: center;
        padding: var(--s-48) var(--s-24);
        color: var(--grey-400);
        background: var(--grey-50);
        border-radius: var(--s-8);
        border: 2px dashed var(--grey-200);
      }
      .empty-state i {
        font-size: 3rem;
        margin-bottom: var(--s-16);
      }
    `,
  ],
})
export class ProviderDocumentsComponent implements OnInit {
  @Input() providerId!: string | number;

  private fb = inject(FormBuilder);
  private providerService = inject(ProviderService);
  private confirmSvc = inject(ConfirmService);

  documentsList: ProviderDocument[] = [];
  documentForm!: FormGroup;
  showForm = false;
  loading = false;
  editingId: number | null = null;

  documentTypeOptions: DropdownOption[] = [
    { label: 'Ficha RUC', value: 'RUC' },
    { label: 'Vigencia de Poder', value: 'VIGENCIA_PODER' },
    { label: 'DNI Representante Legal', value: 'DNI_REPRESENTANTE' },
    { label: 'Certificado Bancario', value: 'CERTIFICADO_BANCARIO' },
    { label: 'Brochure/Presentación', value: 'BROCHURE' },
    { label: 'Otro', value: 'OTRO' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadDocuments();
  }

  initForm(): void {
    this.documentForm = this.fb.group({
      tipo_documento: ['RUC', Validators.required],
      numero_documento: [''],
      fecha_emision: [''],
      fecha_vencimiento: [''],
      archivo_url: ['', [Validators.required, Validators.pattern('https?://.+')]],
      observaciones: [''],
    });
  }

  loadDocuments(): void {
    if (!this.providerId) return;
    this.loading = true;
    this.providerService.getDocuments(this.providerId).subscribe({
      next: (data) => {
        this.documentsList = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.documentForm.invalid) return;

    const data = this.documentForm.value;
    const request = this.editingId
      ? this.providerService.updateDocument(this.editingId, data)
      : this.providerService.createDocument(this.providerId, data);

    request.subscribe({
      next: () => {
        this.loadDocuments();
        this.cancelForm();
      },
    });
  }

  editDocument(doc: ProviderDocument): void {
    this.editingId = doc.id;
    this.documentForm.patchValue({
      tipo_documento: doc.tipo_documento,
      numero_documento: doc.numero_documento,
      fecha_emision: doc.fecha_emision
        ? new Date(doc.fecha_emision).toISOString().substring(0, 10)
        : '',
      fecha_vencimiento: doc.fecha_vencimiento
        ? new Date(doc.fecha_vencimiento).toISOString().substring(0, 10)
        : '',
      archivo_url: doc.archivo_url,
      observaciones: doc.observaciones,
    });
    this.showForm = true;
  }

  deleteDocument(id: number): void {
    this.confirmSvc.confirmDelete('este documento').subscribe((confirmed) => {
      if (confirmed) {
        this.providerService.deleteDocument(id).subscribe(() => this.loadDocuments());
      }
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.documentForm.reset({ tipo_documento: 'RUC' });
  }

  getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      RUC: 'Ficha RUC',
      VIGENCIA_PODER: 'Vigencia de Poder',
      DNI_REPRESENTANTE: 'DNI Representante Legal',
      CERTIFICADO_BANCARIO: 'Certificado Bancario',
      BROCHURE: 'Brochure/Presentación',
      OTRO: 'Otro',
    };
    return labels[type] || type;
  }

  getExpirationVariant(doc: ProviderDocument): BadgeVariant {
    if (!doc.fecha_vencimiento) return 'neutral';
    const expiry = new Date(doc.fecha_vencimiento);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'error';
    if (diffDays < 30) return 'warning';
    return 'success';
  }

  getExpirationText(date?: string | Date): string {
    if (!date) return 'Sin vencimiento';
    const expiry = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Vencido';
    if (diffDays === 0) return 'Vence hoy';
    if (diffDays < 30) return `Vence en ${diffDays} días`;
    return 'Vigente';
  }
}
