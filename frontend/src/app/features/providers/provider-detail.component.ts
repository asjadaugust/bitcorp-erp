import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProviderService } from '../../core/services/provider.service';
import { Provider } from '../../core/models/provider.model';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ProviderFinancialInfoComponent } from './components/provider-financial-info.component';
import { ProviderContactsComponent } from './components/provider-contacts.component';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ProviderFinancialInfoComponent,
    ProviderContactsComponent,
  ],
  template: `
    <div class="detail-container">
      <div class="container">
        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Cargando detalles del proveedor...</p>
        </div>

        <div *ngIf="!loading && provider" class="detail-grid">
          <!-- Monolithic Main Card -->
          <div class="detail-main card">
            <!-- Header (Inside Main Card) -->
            <div class="detail-header">
              <div>
                <h1>{{ provider.razon_social }}</h1>
                <div class="flex items-center gap-3">
                  <span class="code-badge">{{ provider.ruc }}</span>
                  <span class="text-sm text-grey-600 border-l border-grey-300 pl-3">
                    <i class="fa-regular fa-building mr-1"></i>
                    {{ provider.nombre_comercial || 'Sin nombre comercial' }}
                  </span>
                </div>
              </div>
              <div class="detail-status">
                <span
                  class="status-badge"
                  [class.status-APROBADO]="provider.is_active"
                  [class.status-CANCELADO]="!provider.is_active"
                >
                  {{ provider.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </div>

            <!-- Tabs Header (Inside Main Card) -->
            <div class="tabs-header">
              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab === 'general'"
                (click)="activeTab = 'general'"
              >
                General
              </button>
              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab === 'contacts'"
                (click)="activeTab = 'contacts'"
              >
                Contactos
              </button>
              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab === 'documents'"
                (click)="activeTab = 'documents'"
              >
                Documentos
              </button>
              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab === 'history'"
                (click)="activeTab = 'history'"
              >
                Historial
              </button>
            </div>

            <!-- Tab Content (Inside Main Card) -->
            <div class="detail-sections mt-6">
              <!-- GENERAL TAB -->
              <div *ngIf="activeTab === 'general'">
                <section class="detail-section">
                  <h2>Información General</h2>
                  <div class="info-grid four-cols">
                    <div class="info-item">
                      <label>RUC / Tax ID</label>
                      <p>{{ provider.ruc }}</p>
                    </div>
                    <div class="info-item">
                      <label>Dirección</label>
                      <p>{{ provider.direccion || '-' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Teléfono</label>
                      <p>{{ provider.telefono || '-' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Email</label>
                      <p class="text-primary-600 font-medium">
                        {{ provider.correo_electronico || '-' }}
                      </p>
                    </div>
                  </div>
                </section>

                <!-- Financial Info (Read Only) -->
                <app-provider-financial-info
                  [providerId]="provider.id"
                  [readOnly]="true"
                ></app-provider-financial-info>
              </div>

              <!-- CONTACTS TAB -->
              <div *ngIf="activeTab === 'contacts'">
                <app-provider-contacts
                  [providerId]="provider.id"
                  [readOnly]="true"
                ></app-provider-contacts>
              </div>

              <!-- DOCUMENTS TAB (Placeholder) -->
              <div *ngIf="activeTab === 'documents'" class="empty-state-section">
                <i class="fa-regular fa-file-lines"></i>
                <h3>Gestión de Documentos</h3>
                <p>Próximamente disponible</p>
              </div>

              <!-- HISTORY TAB (Placeholder) -->
              <div *ngIf="activeTab === 'history'" class="empty-state-section">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <h3>Historial de Cambios</h3>
                <p>Próximamente disponible</p>
              </div>
            </div>
          </div>

          <div class="detail-sidebar">
            <div class="card">
              <h3 class="sidebar-card-title">Acciones</h3>
              <div class="quick-actions">
                <button type="button" class="btn btn-primary btn-block" (click)="editProvider()">
                  <i class="fa-solid fa-pen"></i> Editar Proveedor
                </button>
                <button type="button" class="btn btn-secondary btn-block" (click)="viewContracts()">
                  <i class="fa-solid fa-file-contract"></i> Ver Contratos
                </button>
                <button type="button" class="btn btn-secondary btn-block" (click)="viewEquipment()">
                  <i class="fa-solid fa-truck-front"></i> Ver Equipos
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-block"
                  (click)="navigateTo('/providers')"
                >
                  <i class="fa-solid fa-arrow-left"></i> Volver a Lista
                </button>
                <button type="button" class="btn btn-danger btn-block" (click)="deleteProvider()">
                  <i class="fa-solid fa-trash"></i> Eliminar
                </button>
              </div>
            </div>

            <div class="card">
              <h3 class="sidebar-card-title">Información del Sistema</h3>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-date">{{ provider.updated_at | date: 'short' }}</div>
                  <div class="timeline-content">Última actualización</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-date">{{ provider.created_at | date: 'short' }}</div>
                  <div class="timeline-content">Proveedor registrado</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !provider" class="empty-state-card">
          <i class="fa-solid fa-search"></i>
          <h3>Proveedor no encontrado</h3>
          <p>El proveedor que buscas no existe o ha sido eliminado.</p>
          <button type="button" class="btn btn-primary" (click)="navigateTo('/providers')">
            Volver a la lista
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Modal remains same -->
    <div *ngIf="showDeleteModal" class="modal" (click)="showDeleteModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Confirmar Eliminación</h2>
          <button type="button" class="close" (click)="showDeleteModal = false">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            ¿Estás seguro de que deseas eliminar el proveedor
            <strong>{{ provider?.razon_social }}</strong
            >?
          </p>
          <p class="alert-warning p-3 rounded">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="showDeleteModal = false">
            Cancelar
          </button>
          <button type="button" class="btn btn-danger" (click)="confirmDelete()">
            Eliminar Proveedor
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .detail-header {
        border-bottom: none;
        margin-bottom: var(--s-16);
      }

      .tabs-header {
        display: flex;
        gap: var(--s-24);
        border-bottom: 2px solid var(--grey-100);
        margin-top: var(--s-8);
      }

      .tab-btn {
        padding: var(--s-12) 0;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        font-size: 14px;
        font-weight: 600;
        color: var(--grey-500);
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          color: var(--primary-600);
        }

        &.active {
          color: var(--primary-600);
          border-bottom-color: var(--primary-600);
        }
      }

      .mt-6 {
        margin-top: var(--s-24);
      }

      .empty-state-section {
        text-align: center;
        padding: var(--s-48);
        color: var(--grey-500);

        i {
          font-size: 48px;
          margin-bottom: var(--s-16);
          color: var(--grey-300);
        }

        h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: var(--s-8);
          color: var(--grey-700);
        }
      }
    `,
  ],
})
export class ProviderDetailComponent implements OnInit {
  private providerService = inject(ProviderService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  provider: Provider | null = null;
  loading = true;
  showDeleteModal = false;
  errorMessage: string | null = null;
  activeTab: 'general' | 'contacts' | 'documents' | 'history' = 'general';

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (!id || id === 'undefined' || id === 'NaN') {
      this.router.navigate(['/providers']);
      return;
    }
    this.loadProvider(id);
  }

  loadProvider(id: string | number): void {
    this.loading = true;
    this.providerService.getById(id).subscribe({
      next: (data) => {
        this.provider = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/providers']);
      },
    });
  }

  editProvider(): void {
    if (this.provider) {
      this.router.navigate(['/providers', this.provider.id, 'edit']);
    }
  }

  deleteProvider(): void {
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.provider) {
      this.providerService.delete(this.provider.id).subscribe({
        next: () => {
          this.router.navigate(['/providers']);
        },
        error: (error) => {
          console.error('Failed to delete provider:', error);
          this.showDeleteModal = false;
        },
      });
    }
  }

  viewContracts(): void {
    alert('Ver Contratos - ¡Próximamente!');
  }

  viewEquipment(): void {
    alert('Ver Equipos - ¡Próximamente!');
  }
}
