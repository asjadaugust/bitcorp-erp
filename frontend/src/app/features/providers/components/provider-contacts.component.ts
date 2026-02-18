import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';

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
  imports: [CommonModule, ReactiveFormsModule, DropdownComponent],
  template: `
    <div class="contacts-section">
      <div class="section-header">
        <h3><i class="fa-solid fa-address-book"></i> Contactos</h3>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          (click)="showForm = !showForm"
          *ngIf="!showForm"
        >
          <i class="fa-solid fa-plus"></i> Agregar Contacto
        </button>
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
            <button type="button" class="btn btn-secondary" (click)="cancelForm()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="contactForm.invalid">
              {{ editingId ? 'Actualizar' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>

      <!-- List -->
      <div class="contacts-grid" *ngIf="!loading && contactsList.length > 0">
        <div class="contact-card" *ngFor="let contact of contactsList">
          <div class="card-header">
            <div class="contact-info">
              <h4>{{ contact.nombre_contacto }}</h4>
              <span class="position" *ngIf="contact.cargo">{{ contact.cargo }}</span>
            </div>
            <div class="badges">
              <span class="badge badge-primary" *ngIf="contact.es_principal">Principal</span>
              <span class="badge badge-type">{{ getContactTypeLabel(contact.tipo_contacto) }}</span>
            </div>
          </div>
          <div class="card-body">
            <div class="contact-detail" *ngIf="contact.telefono_principal">
              <i class="fa-solid fa-phone"></i>
              <span>{{ contact.telefono_principal }}</span>
            </div>
            <div class="contact-detail" *ngIf="contact.correo">
              <i class="fa-solid fa-envelope"></i>
              <span>{{ contact.correo }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button type="button" class="btn-icon" (click)="editContact(contact)">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="btn-icon btn-danger" (click)="deleteContact(contact.id!)">
              <i class="fa-solid fa-trash"></i>
            </button>
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
      .contacts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--s-16);
      }
      .contact-card {
        background: var(--neutral-0);
        border: 1px solid var(--grey-200);
        border-radius: var(--s-8);
        padding: var(--s-16);
      }
      .card-header {
        margin-bottom: var(--s-12);
      }
      .contact-info h4 {
        font-size: var(--type-body-size);
        font-weight: 600;
        margin-bottom: var(--s-4);
      }
      .position {
        color: var(--grey-600);
        font-size: var(--type-bodySmall-size);
      }
      .badges {
        display: flex;
        gap: var(--s-8);
        margin-top: var(--s-8);
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
      .badge-type {
        background: var(--grey-100);
        color: var(--grey-700);
      }
      .card-body {
        margin-bottom: var(--s-12);
      }
      .contact-detail {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        padding: var(--s-8) 0;
        color: var(--grey-700);
      }
      .card-actions {
        display: flex;
        gap: var(--s-8);
        justify-content: flex-end;
      }
      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: var(--s-4);
        color: var(--grey-500);
      }
      .empty-state {
        text-align: center;
        padding: var(--s-48) var(--s-24);
        color: var(--grey-500);
      }
    `,
  ],
})
export class ProviderContactsComponent implements OnInit {
  @Input() providerId!: string;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

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

    const request = this.editingId
      ? this.http.put(
          `${environment.apiUrl}/providers/contacts/${this.editingId}`,
          this.contactForm.value
        )
      : this.http.post(
          `${environment.apiUrl}/providers/${this.providerId}/contacts`,
          this.contactForm.value
        );

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
    if (!confirm('¿Eliminar este contacto?')) return;

    this.http
      .delete(`${environment.apiUrl}/providers/contacts/${id}`)
      .subscribe(() => this.loadContacts());
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
