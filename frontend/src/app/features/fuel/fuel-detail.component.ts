import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FuelService } from '../../core/services/fuel.service';
import { FuelRecord } from '../../core/models/fuel-record.model';

@Component({
  selector: 'app-fuel-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="detail-container">
      <div class="container">
        <div class="breadcrumb">
          <a routerLink="/logistics/fuel" class="breadcrumb-link">← Volver a Combustible</a>
        </div>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Cargando detalles del registro...</p>
        </div>

        <div *ngIf="!loading && record" class="detail-grid">
          <div class="detail-main card">
            <div class="detail-header">
              <div>
                <h1>Registro de Combustible</h1>
                <p class="code-badge">{{ record.fecha | date: 'dd/MM/yyyy' }}</p>
              </div>
              <div class="detail-actions">
                <button class="btn btn-primary" (click)="editRecord()">
                  <i class="fa-solid fa-pen"></i> Editar
                </button>
                <button class="btn btn-danger" (click)="deleteRecord()">
                  <i class="fa-solid fa-trash"></i> Eliminar
                </button>
              </div>
            </div>

            <div class="detail-sections">
              <section class="detail-section">
                <h2>Información General</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Valorización ID</label>
                    <p>{{ record.valorizacion_id || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Periodo</label>
                    <p>{{ record.valorizacion_periodo || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Proveedor</label>
                    <p>{{ record.proveedor || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Tipo Combustible</label>
                    <p>{{ record.tipo_combustible || 'N/A' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Consumo y Costos</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Cantidad</label>
                    <p class="highlight">{{ record.cantidad | number: '1.2-2' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Precio Unitario</label>
                    <p>{{ record.precio_unitario | currency: 'PEN' : 'S/ ' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Monto Total</label>
                    <p class="highlight">{{ record.monto_total | currency: 'PEN' : 'S/ ' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Documento</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Número de Documento</label>
                    <p>{{ record.numero_documento || '-' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Observaciones</label>
                    <p>{{ record.observaciones || '-' }}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div class="detail-sidebar">
            <div class="card">
              <h3>Información del Sistema</h3>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-date">{{ record.created_at | date: 'short' }}</div>
                  <div class="timeline-content">Registro creado</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !record" class="empty-state card">
          <h3>Registro no encontrado</h3>
          <p>El registro que buscas no existe o ha sido eliminado.</p>
          <button class="btn btn-primary" routerLink="/logistics/fuel">Volver a la lista</button>
        </div>
      </div>
    </div>

    <div *ngIf="showDeleteModal" class="modal" (click)="showDeleteModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Confirmar Eliminación</h2>
          <button class="close" (click)="showDeleteModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>¿Estás seguro de que deseas eliminar este registro de combustible?</p>
          <p class="alert alert-warning">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showDeleteModal = false">Cancelar</button>
          <button class="btn btn-danger" (click)="confirmDelete()">Eliminar Registro</button>
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
export class FuelDetailComponent implements OnInit {
  private fuelService = inject(FuelService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  record: FuelRecord | null = null;
  loading = true;
  showDeleteModal = false;

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadRecord(id);
  }

  loadRecord(id: number): void {
    this.loading = true;
    this.fuelService.getById(id).subscribe({
      next: (data) => {
        this.record = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  editRecord(): void {
    if (this.record) {
      this.router.navigate(['/logistics/fuel', this.record.id, 'edit']);
    }
  }

  deleteRecord(): void {
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.record) {
      this.fuelService.delete(this.record.id).subscribe({
        next: () => {
          this.router.navigate(['/logistics/fuel']);
        },
        error: (error) => {
          console.error('Failed to delete record:', error);
          this.showDeleteModal = false;
        },
      });
    }
  }
}
