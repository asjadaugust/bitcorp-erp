import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProviderService } from '../../core/services/provider.service';
import { Provider } from '../../core/models/provider.model';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { ProviderFinancialInfoComponent } from './components/provider-financial-info.component';
import { ProviderContactsComponent } from './components/provider-contacts.component';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageLayoutComponent,
    ProviderFinancialInfoComponent,
    ProviderContactsComponent,
  ],
  template: `
    <app-page-layout
      [title]="provider ? provider.razon_social : 'Detalle de Proveedor'"
      icon="fa-handshake"
      [breadcrumbs]="[
        { label: 'Inicio', url: '/app' },
        { label: 'Proveedores', url: '/providers' },
        { label: provider?.razon_social || 'Detalle' },
      ]"
      [loading]="loading"
      [backUrl]="'/providers'"
    >
      <div actions>
        <button type="button" class="btn btn-primary" (click)="editProvider()">
          <i class="fa-solid fa-pen"></i> Editar
        </button>
        <button type="button" class="btn btn-danger" (click)="deleteProvider()">
          <i class="fa-solid fa-trash"></i> Eliminar
        </button>
      </div>

      <div *ngIf="provider" class="detail-grid">
        <div class="detail-main">
          <div class="card p-6">
            <div class="detail-status mb-6">
              <span [class]="'badge ' + (provider.is_active ? 'status-active' : 'status-inactive')">
                {{ provider.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </div>

            <div class="detail-sections">
              <section class="detail-section">
                <h3 class="text-lg font-semibold mb-4 text-primary-900">Información General</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <label class="text-xs uppercase font-medium text-grey-500 tracking-wider"
                      >RUC / Tax ID</label
                    >
                    <p class="text-xl font-semibold text-primary-500">{{ provider.ruc }}</p>
                  </div>
                  <div class="info-item">
                    <label class="text-xs uppercase font-medium text-grey-500 tracking-wider"
                      >Dirección</label
                    >
                    <p class="text-base text-grey-900">{{ provider.direccion || '-' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section mt-8">
                <h3 class="text-lg font-semibold mb-4 text-primary-900">Información de Contacto</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <label class="text-xs uppercase font-medium text-grey-500 tracking-wider"
                      >Nombre Comercial</label
                    >
                    <p class="text-base text-grey-900">{{ provider.nombre_comercial || '-' }}</p>
                  </div>
                  <div class="info-item">
                    <label class="text-xs uppercase font-medium text-grey-500 tracking-wider"
                      >Email</label
                    >
                    <p class="text-base text-grey-900">{{ provider.correo_electronico || '-' }}</p>
                  </div>
                  <div class="info-item">
                    <label class="text-xs uppercase font-medium text-grey-500 tracking-wider"
                      >Teléfono</label
                    >
                    <p class="text-base text-grey-900">{{ provider.telefono || '-' }}</p>
                  </div>
                </div>
              </section>

              <!-- Financial Info Component -->
              <div class="mt-8">
                <app-provider-financial-info
                  [providerId]="provider.id"
                ></app-provider-financial-info>
              </div>

              <!-- Contacts Component -->
              <div class="mt-8">
                <app-provider-contacts [providerId]="provider.id"></app-provider-contacts>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-sidebar flex flex-col gap-6">
          <div class="card p-6">
            <h3 class="text-base font-semibold mb-4 text-primary-900">Acciones Rápidas</h3>
            <div class="flex flex-col gap-2">
              <button type="button" class="btn btn-secondary w-full" (click)="viewContracts()">
                <i class="fa-solid fa-file-contract"></i> Ver Contratos
              </button>
              <button type="button" class="btn btn-secondary w-full" (click)="viewEquipment()">
                <i class="fa-solid fa-truck-front"></i> Ver Equipos
              </button>
            </div>
          </div>

          <div class="card p-6">
            <h3 class="text-base font-semibold mb-4 text-primary-900">Información del Sistema</h3>
            <div class="flex flex-col gap-4">
              <div class="system-info-item">
                <div class="text-xs text-grey-500 mb-1">Última actualización</div>
                <div class="text-sm font-medium">{{ provider.updated_at | date: 'short' }}</div>
              </div>
              <div class="system-info-item">
                <div class="text-xs text-grey-500 mb-1">Proveedor registrado</div>
                <div class="text-sm font-medium">{{ provider.created_at | date: 'short' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        *ngIf="!loading && !provider"
        class="empty-state p-12 text-center bg-white rounded-lg shadow"
      >
        <h3 class="text-xl font-semibold mb-2">Proveedor no encontrado</h3>
        <p class="text-grey-500 mb-6">El proveedor que buscas no existe o ha sido eliminado.</p>
        <button type="button" class="btn btn-primary" (click)="navigateTo('/providers')">
          Volver a la lista
        </button>
      </div>
    </app-page-layout>

    <div *ngIf="showDeleteModal" class="modal" (click)="showDeleteModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Confirmar Eliminación</h2>
          <button type="button" class="btn btn-icon" (click)="showDeleteModal = false">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            ¿Estás seguro de que deseas eliminar el proveedor
            <strong>{{ provider?.razon_social }}</strong
            >?
          </p>
          <p class="alert alert-warning">Esta acción no se puede deshacer.</p>
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
      .detail-container {
        min-height: 100vh;
        background: #f5f5f5;
        padding: var(--s-24) 0;
      }

      .breadcrumb {
        margin-bottom: var(--s-24);
      }

      .breadcrumb-link {
        color: var(--primary-500);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }

      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: var(--s-24);

        @media (max-width: 968px) {
          grid-template-columns: 1fr;
        }
      }

      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--s-24);
        padding-bottom: var(--s-24);
        border-bottom: 2px solid #e0e0e0;

        h1 {
          font-size: 28px;
          color: var(--primary-900);
          margin-bottom: var(--s-4);
        }

        .code-badge {
          font-family: monospace;
          background: var(--grey-100);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 14px;
          color: var(--grey-700);
          font-weight: 600;
          display: inline-block;
        }

        @media (max-width: 768px) {
          flex-direction: column;
          gap: var(--s-16);
        }
      }

      .detail-actions {
        display: flex;
        gap: var(--s-8);

        @media (max-width: 768px) {
          width: 100%;

          .btn {
            flex: 1;
          }
        }
      }

      .detail-status {
        margin-bottom: var(--s-24);
      }

      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--s-32);
      }

      .detail-section {
        h2 {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary-900);
          margin-bottom: var(--s-16);
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-24);
      }

      .info-item {
        label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--grey-500);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: var(--s-4);
        }

        p {
          font-size: 16px;
          color: #333;
          margin: 0;

          &.highlight {
            font-size: 20px;
            font-weight: 600;
            color: var(--primary-500);
          }
        }
      }

      .detail-sidebar {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);

        h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--primary-900);
          margin-bottom: var(--s-16);
        }
      }

      .quick-actions {
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
      }

      .btn-block {
        width: 100%;
        justify-content: center;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .timeline {
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
      }

      .timeline-item {
        position: relative;
        padding-left: var(--s-24);

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 6px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary-500);
        }

        &::after {
          content: '';
          position: absolute;
          left: 3px;
          top: 14px;
          width: 2px;
          height: calc(100% + var(--s-16));
          background: #e0e0e0;
        }

        &:last-child::after {
          display: none;
        }
      }

      .timeline-date {
        font-size: 12px;
        color: var(--grey-500);
        margin-bottom: var(--s-4);
      }

      .timeline-content {
        font-size: 14px;
        color: #333;
      }

      /* Status Badges */
      .status-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .status-badge::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .status-active {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .status-active::before {
        background: var(--semantic-green-500);
      }

      .status-inactive {
        background: var(--grey-100);
        color: var(--grey-700);
      }
      .status-inactive::before {
        background: var(--grey-400);
      }

      .status-blacklisted {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
      }
      .status-blacklisted::before {
        background: var(--semantic-red-500);
      }

      /* Modal */
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .modal-content {
        background: white;
        padding: 0;
        border-radius: var(--radius-md);
        width: 90%;
        max-width: 500px;
        box-shadow: var(--shadow-lg);
      }

      .modal-header {
        padding: var(--s-16) var(--s-24);
        border-bottom: 1px solid var(--grey-200);
        display: flex;
        justify-content: space-between;
        align-items: center;

        h2 {
          margin: 0;
          font-size: 18px;
        }

        .close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--grey-500);
        }
      }

      .modal-body {
        padding: var(--s-24);

        p {
          margin-bottom: var(--s-16);

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .modal-footer {
        padding: var(--s-16) var(--s-24);
        border-top: 1px solid var(--grey-200);
        display: flex;
        justify-content: flex-end;
        gap: var(--s-8);
      }

      .alert {
        padding: var(--s-12);
        border-radius: var(--radius-sm);
        font-size: 14px;
      }

      .alert-warning {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
        border: 1px solid var(--semantic-yellow-200);
      }
    `,
  ],
})
export class ProviderDetailComponent implements OnInit {
  private providerService = inject(ProviderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  provider: Provider | null = null;
  loading = true;
  showDeleteModal = false;
  errorMessage: string | null = null;

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

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
