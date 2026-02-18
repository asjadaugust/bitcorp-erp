import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { MaintenanceRecord } from '../../core/models/maintenance-record.model';

@Component({
  selector: 'app-maintenance-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="detail-container">
      <div class="container">
        <div class="breadcrumb">
          <a routerLink="/equipment/maintenance" class="breadcrumb-link"
            >← Volver a Mantenimiento</a
          >
        </div>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Cargando detalles del mantenimiento...</p>
        </div>

        <div *ngIf="!loading && record" class="detail-grid">
          <div class="detail-main card">
            <div class="detail-header">
              <div>
                <h1>Mantenimiento {{ record.tipoMantenimiento }}</h1>
                <p class="code-badge">{{ record.fechaProgramada | date: 'dd/MM/yyyy' }}</p>
              </div>
            </div>

            <div class="detail-status">
              <span [class]="'status-badge status-' + record.estado">
                {{ getStatusLabel(record.estado) }}
              </span>
            </div>

            <div class="detail-sections">
              <section class="detail-section">
                <h2>Información del Equipo</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Equipo</label>
                    <p>
                      {{ record.equipo?.codigo_equipo || 'N/A' }} {{ record.equipo?.marca }}
                      {{ record.equipo?.modelo }}
                    </p>
                  </div>
                  <div class="info-item">
                    <label>Técnico Responsable</label>
                    <p>{{ record.tecnicoResponsable || 'N/A' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Detalles del Trabajo</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Tipo</label>
                    <p>{{ record.tipoMantenimiento }}</p>
                  </div>
                  <div class="info-item">
                    <label>Costo Total</label>
                    <p class="highlight">
                      {{ record.costoReal || record.costoEstimado | currency: 'PEN' : 'S/ ' }}
                    </p>
                  </div>
                </div>
                <div class="info-item full-width" *ngIf="record.descripcion">
                  <label>Descripción</label>
                  <p class="notes">{{ record.descripcion }}</p>
                </div>
              </section>

              <section class="detail-section">
                <h2>Fechas</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Fecha Programada</label>
                    <p>{{ record.fechaProgramada | date: 'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Fecha Realizada</label>
                    <p>{{ (record.fechaRealizada | date: 'dd/MM/yyyy') || '-' }}</p>
                  </div>
                </div>
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
                  (click)="router.navigate(['/equipment/maintenance'])"
                >
                  <i class="fa-solid fa-arrow-left"></i> Volver
                </button>
                <button type="button" class="btn btn-primary btn-block" (click)="editRecord()">
                  <i class="fa-solid fa-pen"></i> Editar
                </button>
                <button type="button" class="btn btn-danger btn-block" (click)="deleteRecord()">
                  <i class="fa-solid fa-trash"></i> Eliminar
                </button>
              </div>
            </div>

            <div class="card">
              <h3>Información del Sistema</h3>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-date">{{ record.updated_at | date: 'short' }}</div>
                  <div class="timeline-content">Última actualización</div>
                </div>
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
          <button type="button" class="btn btn-primary" routerLink="/equipment/maintenance">
            Volver a la lista
          </button>
        </div>
      </div>
    </div>

    <div *ngIf="showDeleteModal" class="modal" (click)="showDeleteModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Confirmar Eliminación</h2>
          <button type="button" class="close" (click)="showDeleteModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>¿Estás seguro de que deseas eliminar este registro de mantenimiento?</p>
          <p class="alert alert-warning">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="showDeleteModal = false">
            Cancelar
          </button>
          <button type="button" class="btn btn-danger" (click)="confirmDelete()">
            Eliminar Registro
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

      .full-width {
        grid-column: 1 / -1;
      }

      .notes {
        background: var(--grey-50);
        padding: var(--s-16);
        border-radius: var(--radius-sm);
        border-left: 4px solid var(--primary-500);
        line-height: 1.6;
        margin: 0;
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

      .status-PROGRAMADO {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }
      .status-PROGRAMADO::before {
        background: var(--semantic-blue-500);
      }

      .status-PENDIENTE {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
      }
      .status-PENDIENTE::before {
        background: var(--semantic-yellow-500);
      }

      .status-EN_PROCESO {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
      }
      .status-EN_PROCESO::before {
        background: var(--semantic-yellow-500);
      }

      .status-COMPLETADO {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .status-COMPLETADO::before {
        background: var(--semantic-green-500);
      }

      .status-CANCELADO {
        background: var(--grey-100);
        color: var(--grey-700);
      }
      .status-CANCELADO::before {
        background: var(--grey-400);
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
export class MaintenanceDetailComponent implements OnInit {
  private maintenanceService = inject(MaintenanceService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  record: MaintenanceRecord | null = null;
  loading = true;
  showDeleteModal = false;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadRecord(+id);
      }
    });
  }

  loadRecord(id: number): void {
    this.loading = true;
    this.maintenanceService.getById(id).subscribe({
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
      this.router.navigate(['edit'], { relativeTo: this.route });
    }
  }

  deleteRecord(): void {
    this.showDeleteModal = true;
  }

  getStatusLabel(estado: string): string {
    const map: Record<string, string> = {
      PROGRAMADO: 'Programado',
      EN_PROCESO: 'En Proceso',
      COMPLETADO: 'Completado',
      CANCELADO: 'Cancelado',
      PENDIENTE: 'Pendiente',
    };
    return map[estado] || estado;
  }

  confirmDelete(): void {
    if (this.record) {
      this.maintenanceService.delete(this.record.id).subscribe({
        next: () => {
          this.router.navigate(['../../'], { relativeTo: this.route });
        },
        error: (error) => {
          console.error('Failed to delete record:', error);
          this.showDeleteModal = false;
        },
      });
    }
  }
}
