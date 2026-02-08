import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Contact {
  id?: number;
  provider_id: string;
  contact_name: string;
  position?: string;
  primary_phone?: string;
  secondary_phone?: string;
  email?: string;
  secondary_email?: string;
  contact_type: string;
  is_primary: boolean;
  status: string;
  notes?: string;
}

@Component({
  selector: 'app-provider-contacts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
              <label for="contact_name">Nombre Contacto *</label>
              <input
                id="contact_name"
                type="text"
                formControlName="contact_name"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="position">Cargo</label>
              <input id="position" type="text" formControlName="position" class="form-control" />
            </div>

            <div class="form-group">
              <label for="primary_phone">Teléfono Principal</label>
              <input
                id="primary_phone"
                type="tel"
                formControlName="primary_phone"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" class="form-control" />
            </div>

            <div class="form-group">
              <label for="contact_type">Tipo Contacto</label>
              <select id="contact_type" formControlName="contact_type" class="form-select">
                <option value="general">General</option>
                <option value="commercial">Comercial</option>
                <option value="administrative">Administrativo</option>
                <option value="technical">Técnico</option>
                <option value="financial">Financiero</option>
              </select>
            </div>

            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" formControlName="is_primary" />
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
              <h4>{{ contact.contact_name }}</h4>
              <span class="position" *ngIf="contact.position">{{ contact.position }}</span>
            </div>
            <div class="badges">
              <span class="badge badge-primary" *ngIf="contact.is_primary">Principal</span>
              <span class="badge badge-type">{{ getContactTypeLabel(contact.contact_type) }}</span>
            </div>
          </div>
          <div class="card-body">
            <div class="contact-detail" *ngIf="contact.primary_phone">
              <i class="fa-solid fa-phone"></i>
              <span>{{ contact.primary_phone }}</span>
            </div>
            <div class="contact-detail" *ngIf="contact.email">
              <i class="fa-solid fa-envelope"></i>
              <span>{{ contact.email }}</span>
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
    .contacts-section { margin-top: var(--s-24); }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--s-16); }
    .section-header h3 { font-size: var(--type-h4-size); color: var(--grey-900); display: flex; align-items: center; gap: var(--s-8); }
    .contact-form { margin-bottom: var(--s-24); padding: var(--s-24); background: var(--neutral-0); border-radius: var(--s-8); }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--s-16); margin-bottom: var(--s-24); }
    .form-group { display: flex; flex-direction: column; }
    .form-control, .form-select { padding: var(--s-8) var(--s-12); border: 1px solid var(--grey-300); border-radius: var(--s-4); }
    .btn { padding: var(--s-8) var(--s-16); border: none; border-radius: var(--s-8); font-weight: 600; cursor: pointer; }
    .btn-primary { background: var(--primary-500); color: var(--neutral-0); }
    .btn-secondary { background: var(--grey-300); color: var(--grey-700); }
    .btn-sm { padding: var(--s-4) var(--s-12); font-size: var(--type-bodySmall-size); }
    .form-actions { display: flex; gap: var(--s-12); justify-content: flex-end); }
    .contacts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--s-16); }
    .contact-card { background: var(--neutral-0); border: 1px solid var(--grey-200); border-radius: var(--s-8); padding: var(--s-16); }
    .card-header { margin-bottom: var(--s-12); }
    .contact-info h4 { font-size: var(--type-body-size); font-weight: 600; margin-bottom: var(--s-4); }
    .position { color: var(--grey-600); font-size: var(--type-bodySmall-size); }
    .badges { display: flex; gap: var(--s-8); margin-top: var(--s-8); }
    .badge { padding: var(--s-4) var(--s-8); border-radius: var(--s-12); font-size: var(--type-label-size); font-weight: 600; }
    .badge-primary { background: var(--primary-100); color: var(--primary-700); }
    .badge-type { background: var(--grey-100); color: var(--grey-700); }
    .card-body { margin-bottom: var(--s-12); }
    .contact-detail { display: flex; align-items: center; gap: var(--s-8); padding: var(--s-8) 0; color: var(--grey-700); }
    .card-actions { display: flex; gap: var(--s-8); justify-content: flex-end; }
    .btn-icon { background: none; border: none; cursor: pointer; padding: var(--s-4); color: var(--grey-500); }
    .empty-state { text-align: center; padding: var(--s-48) var(--s-24); color: var(--grey-500); }
  `,
  ],
})
export class ProviderContactsComponent implements OnInit {
  @Input() providerId!: string;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  contactsList: Contact[] = [];
  contactForm!: FormGroup;
  showForm = false;
  loading = false;
  editingId: number | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadContacts();
  }

  initForm(): void {
    this.contactForm = this.fb.group({
      contact_name: ['', Validators.required],
      position: [''],
      primary_phone: [''],
      secondary_phone: [''],
      email: ['', Validators.email],
      secondary_email: [''],
      contact_type: ['general', Validators.required],
      is_primary: [false],
      notes: [''],
    });
  }

  loadContacts(): void {
    this.loading = true;
    this.http
      .get<Contact[]>(`${environment.apiUrl}/providers/${this.providerId}/contacts`)
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

  editContact(contact: Contact): void {
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
    this.contactForm.reset({ contact_type: 'general', is_primary: false });
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
