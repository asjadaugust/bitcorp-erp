import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProviderService } from '../../core/services/provider.service';
import { Provider } from '../../core/models/provider.model';
import { ProviderFinancialInfoComponent } from './components/provider-financial-info.component';
import { ProviderContactsComponent } from './components/provider-contacts.component';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ProviderFinancialInfoComponent, ProviderContactsComponent],
  template: `
    <div class="detail-container">
      <div class="container">
        <div class="breadcrumb">
          <a routerLink="/providers" class="breadcrumb-link">← Volver a Proveedores</a>
        </div>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Cargando detalles del proveedor...</p>
        </div>

        <div *ngIf="!loading && provider" class="detail-grid">
          <div class="detail-main card">
            <div class="detail-header">
              <div>
                <h1>{{ provider.razon_social }}</h1>
                <p class="code-badge">{{ provider.ruc }}</p>
              </div>
            </div>

            <div class="detail-status">
              <span [class]="'status-badge status-' + (provider.is_active ? 'ACTIVO' : 'INACTIVO')">
                {{ provider.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </div>

            <div class="detail-sections">
              <section class="detail-section">
                <h2>Información General</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>RUC</label>
                    <p class="highlight">{{ provider.ruc }}</p>
                  </div>
                  <div class="info-item">
                    <label>Nombre Comercial</label>
                    <p>{{ provider.nombre_comercial || '-' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Dirección</label>
                    <p>{{ provider.direccion || '-' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Información de Contacto</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Correo Electrónico</label>
                    <p>{{ provider.correo_electronico || '-' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Teléfono</label>
                    <p>{{ provider.telefono || '-' }}</p>
                  </div>
                </div>
              </section>

              <!-- Financial Info Component -->
              <section class="detail-section">
                <app-provider-financial-info
                  [providerId]="provider.id"
                ></app-provider-financial-info>
              </section>

              <!-- Contacts Component -->
              <section class="detail-section">
                <app-provider-contacts [providerId]="provider.id"></app-provider-contacts>
              </section>
            </div>
          </div>

          <div class="detail-sidebar">
            <div class="card">
              <h3>Acciones</h3>
              <div class="quick-actions">
                <button
                  type="button"
                  class="btn btn-secondary btn-block"
                  (click)="router.navigate(['/providers'])"
                >
                  <i class="fa-solid fa-arrow-left"></i> Volver
                </button>
                <button type="button" class="btn btn-primary btn-block" (click)="editProvider()">
                  <i class="fa-solid fa-pen"></i> Editar
                </button>
                <button type="button" class="btn btn-secondary btn-block" (click)="viewContracts()">
                  <i class="fa-solid fa-file-contract"></i> Ver Contratos
                </button>
                <button type="button" class="btn btn-secondary btn-block" (click)="viewEquipment()">
                  <i class="fa-solid fa-truck-front"></i> Ver Equipos
                </button>
                <button type="button" class="btn btn-danger btn-block" (click)="deleteProvider()">
                  <i class="fa-solid fa-trash"></i> Eliminar
                </button>
              </div>
            </div>

            <div class="card">
              <h3>Información del Sistema</h3>
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

        <div *ngIf="!loading && !provider" class="empty-state card">
          <h3>Proveedor no encontrado</h3>
          <p>El proveedor que buscas no existe o ha sido eliminado.</p>
          <button type="button" class="btn btn-primary" (click)="router.navigate(['/providers'])">
            Volver a la lista
          </button>
        </div>
      </div>
    </div>

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
        border-bottom: 2px solid var(--grey-200);

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
          background: var(--grey-200);
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

      .status-ACTIVO {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .status-ACTIVO::before {
        background: var(--semantic-green-500);
      }

      .status-INACTIVO {
        background: var(--grey-100);
        color: var(--grey-700);
      }
      .status-INACTIVO::before {
        background: var(--grey-400);
      }

      .status-LISTA_NEGRA {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
      }
      .status-LISTA_NEGRA::before {
        background: var(--semantic-red-500);
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: var(--s-48) var(--s-24);
      }

      .empty-state h3 {
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-900);
        margin-bottom: var(--s-8);
      }

      .empty-state p {
        color: var(--grey-500);
        margin-bottom: var(--s-24);
      }

      /* Loading */
      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--s-48) var(--s-24);
        gap: var(--s-16);
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--grey-200);
        border-top-color: var(--primary-500);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
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
  router = inject(Router);

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
}
