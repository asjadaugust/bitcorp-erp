import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ConfirmService } from '../../../core/services/confirm.service';

interface Contacto {
  id?: number;
  id_proveedor: string;
  nombre_contacto: string;
  cargo?: string;
  telefono_principal?: string;
  telefono_secundario?: string;
  correo?: string;
  correo_secundario?: string;
  tipo_contacto: string;
  es_principal: boolean;
  estado: string;
  notas?: string;
}

@Component({
  selector: 'app-provider-contacts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DropdownComponent, ButtonComponent],
  template: `
    <div class="contacts-section">
      <div class="section-header">
        <h3><i class="fa-solid fa-address-book"></i> Contactos</h3>
        <app-button
          *ngIf="!showForm && !readOnly"
          variant="primary"
          size="sm"
          icon="fa-plus"
          label="Agregar Contacto"
          (clicked)="showForm = !showForm"
        ></app-button>
      </div>

      <!-- Form -->
      <div class="contact-form card" *ngIf="showForm">
        <form [formGroup]="contactForm" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <div class="form-group">
              <label for="nombre_contacto">Nombre Contacto *</label>
              <input
                id="nombre_contacto"
                type="text"
                formControlName="nombre_contacto"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="cargo">Cargo</label>
              <input id="cargo" type="text" formControlName="cargo" class="form-control" />
            </div>

            <div class="form-group">
              <label for="telefono_principal">Teléfono Principal</label>
              <input
                id="telefono_principal"
                type="tel"
                formControlName="telefono_principal"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="correo">Correo Electrónico</label>
              <input id="correo" type="email" formControlName="correo" class="form-control" />
            </div>

            <div class="form-group">
              <label for="tipo_contacto">Tipo Contacto</label>
              <app-dropdown
                formControlName="tipo_contacto"
                [options]="contactTypeOptions"
                [placeholder]="'Seleccionar...'"
              ></app-dropdown>
            </div>

            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" formControlName="es_principal" />
                Contacto Principal
              </label>
            </div>
          </div>

          <div class="form-actions">
            <app-button variant="secondary" label="Cancelar" (clicked)="cancelForm()"></app-button>
            <app-button
              variant="primary"
              [label]="editingId ? 'Actualizar' : 'Guardar'"
              [disabled]="contactForm.invalid"
              (clicked)="onSubmit()"
            ></app-button>
          </div>
        </form>
      </div>

      <!-- List -->
      <div class="contacts-grid" *ngIf="!loading && contactsList.length > 0">
        <div class="contact-card" *ngFor="let contact of contactsList">
          <div class="card-header">
            <div class="header-content">
              <div class="avatar-circle">
                {{ contact.nombre_contacto ? contact.nombre_contacto[0] : 'C' }}
              </div>
              <div class="contact-info">
                <h4>{{ contact.nombre_contacto }}</h4>
                <span class="position" *ngIf="contact.cargo">{{ contact.cargo }}</span>
                <div class="badges">
                  <span class="badge badge-primary" *ngIf="contact.es_principal">Principal</span>
                  <span class="badge badge-type">{{
                    getContactTypeLabel(contact.tipo_contacto)
                  }}</span>
                </div>
              </div>
            </div>
            <div class="card-actions" *ngIf="!readOnly">
              <app-button
                variant="icon"
                size="sm"
                icon="fa-pen"
                (clicked)="editContact(contact)"
              ></app-button>
              <app-button
                variant="icon"
                size="sm"
                icon="fa-trash"
                (clicked)="deleteContact(contact.id!)"
              ></app-button>
            </div>
          </div>

          <div class="card-body">
            <div class="contact-detail" *ngIf="contact.correo">
              <i class="fa-solid fa-envelope" title="Email"></i>
              <span>{{ contact.correo }}</span>
            </div>
            <div class="contact-detail" *ngIf="contact.telefono_principal">
              <i class="fa-solid fa-phone" title="Teléfono"></i>
              <span>{{ contact.telefono_principal }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading && contactsList.length === 0 && !showForm">
        <i class="fa-solid fa-address-book"></i>
        <p>No hay contactos registrados</p>
      </div>
    </div>
  `,
  styles: [
    `
      .contacts-section {
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
      .contact-form {
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
      .contacts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--s-16);
      }

      /* Card Styles */
      .contact-card {
        background: var(--grey-100);
        border: 1px solid var(--grey-200);
        border-radius: var(--s-12);
        transition: all 0.2s ease-in-out;
        display: flex;
        flex-direction: column;

        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary-200);
        }
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: var(--s-20);
        border-bottom: 1px solid var(--grey-100);
      }

      .header-content {
        display: flex;
        gap: var(--s-12);
        align-items: flex-start;
      }

      .avatar-circle {
        width: 40px;
        height: 40px;
        background: var(--primary-100);
        color: var(--primary-700);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        flex-shrink: 0;
      }

      .contact-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .contact-info h4 {
        font-size: 16px;
        font-weight: 700;
        color: var(--grey-900);
        margin: 0;
      }

      .position {
        color: var(--grey-500);
        font-size: 13px;
        font-weight: 500;
      }

      .badges {
        display: flex;
        gap: var(--s-8);
        margin-top: var(--s-8);
      }
      .badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .badge-primary {
        background: var(--primary-50);
        color: var(--primary-700);
        border: 1px solid var(--primary-100);
      }
      .badge-type {
        background: var(--grey-100);
        color: var(--grey-700);
        border: 1px solid var(--grey-200);
      }

      .card-body {
        padding: var(--s-20);
        display: flex;
        flex-direction: column;
        gap: var(--s-12);
      }

      .contact-detail {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        font-size: 14px;
        color: var(--grey-700);

        i {
          color: var(--grey-400);
          width: 16px;
          text-align: center;
        }
      }

      .card-actions {
        display: flex;
        gap: var(--s-8);
        justify-content: flex-end;
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
export class ProviderContactsComponent implements OnInit {
  @Input() providerId!: string;
  @Input() readOnly = false;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private confirmSvc = inject(ConfirmService);

  contactsList: Contacto[] = [];
  contactForm!: FormGroup;
  showForm = false;
  loading = false;
  editingId: number | null = null;

  contactTypeOptions: DropdownOption[] = [
    { label: 'General', value: 'general' },
    { label: 'Comercial', value: 'commercial' },
    { label: 'Administrativo', value: 'administrative' },
    { label: 'Técnico', value: 'technical' },
    { label: 'Financiero', value: 'financial' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadContacts();
  }

  initForm(): void {
    this.contactForm = this.fb.group({
      nombre_contacto: ['', Validators.required],
      cargo: [''],
      telefono_principal: [''],
      telefono_secundario: [''],
      correo: ['', Validators.email],
      correo_secundario: [''],
      tipo_contacto: ['general', Validators.required],
      es_principal: [false],
      notas: [''],
    });
  }

  loadContacts(): void {
    this.loading = true;
    this.http
      .get<Contacto[]>(`${environment.apiUrl}/providers/${this.providerId}/contacts`)
      .subscribe({
        next: (data) => {
          this.contactsList = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onSubmit(): void {
    if (this.contactForm.invalid) return;

    // Convert empty strings to null for optional fields to avoid backend validation errors
    const formValue = { ...this.contactForm.value };
    Object.keys(formValue).forEach((key) => {
      if (formValue[key] === '') {
        formValue[key] = null;
      }
    });

    const request = this.editingId
      ? this.http.put(`${environment.apiUrl}/providers/contacts/${this.editingId}`, formValue)
      : this.http.post(`${environment.apiUrl}/providers/${this.providerId}/contacts`, formValue);

    request.subscribe({
      next: () => {
        this.loadContacts();
        this.cancelForm();
      },
    });
  }

  editContact(contact: Contacto): void {
    this.editingId = contact.id!;
    this.contactForm.patchValue(contact);
    this.showForm = true;
  }

  deleteContact(id: number): void {
    this.confirmSvc.confirmDelete('este contacto').subscribe((confirmed) => {
      if (confirmed) {
        this.http
          .delete(`${environment.apiUrl}/providers/contacts/${id}`)
          .subscribe(() => this.loadContacts());
      }
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.contactForm.reset({ tipo_contacto: 'general', es_principal: false });
  }

  getContactTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      general: 'General',
      commercial: 'Comercial',
      administrative: 'Administrativo',
      technical: 'Técnico',
      financial: 'Financiero',
    };
    return labels[type] || type;
  }
}
