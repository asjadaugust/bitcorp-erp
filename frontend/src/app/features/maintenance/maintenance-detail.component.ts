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
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando detalles del mantenimiento...</p>
        </div>

        <div *ngIf="!loading && record" class="detail-grid">
          <div class="detail-main card">
            <!-- Header (Inside Main Card) -->
            <div class="detail-header">
              <div>
                <h1>{{ record.maintenanceType }}</h1>
                <p class="text-subtitle">
                  <i class="fa-solid fa-truck-front mr-1"></i>
                  {{ record.equipmentCode }} - {{ record.equipmentName }}
                </p>
              </div>
              <div class="detail-status">
                <span
                  class="status-badge"
                  [class.status-APROBADO]="record.status === 'COMPLETO'"
                  [class.status-PENDIENTE]="
                    record.status === 'PENDIENTE' || record.status === 'EN_PROCESO'
                  "
                  [class.status-CANCELADO]="record.status === 'CANCELADO'"
                >
                  {{ record.status }}
                </span>
              </div>
            </div>

            <div class="detail-sections mt-6">
              <!-- Work Details Section -->
              <section class="detail-section">
                <h2>Detalles del Trabajo</h2>
                <div class="info-grid three-cols">
                  <div class="info-item">
                    <label>Tipo de Mantenimiento</label>
                    <p>{{ record.maintenanceType }}</p>
                  </div>
                  <div class="info-item">
                    <label>Proveedor</label>
                    <p>
                      <a
                        [routerLink]="['/providers', record.providerId]"
                        class="text-primary-600 hover:underline"
                      >
                        {{ record.providerName || 'N/A' }}
                      </a>
                    </p>
                  </div>
                  <div class="info-item">
                    <label>Costo Total</label>
                    <p class="font-medium">
                      {{ record.cost | currency: 'USD' }}
                    </p>
                  </div>

                  <div class="info-item">
                    <label>Fecha Programada</label>
                    <p>{{ record.scheduledDate | date: 'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Fecha Realización</label>
                    <p>
                      {{
                        record.completionDate ? (record.completionDate | date: 'dd/MM/yyyy') : '-'
                      }}
                    </p>
                  </div>
                  <div class="info-item">
                    <label>Kilometraje / Horas</label>
                    <p>{{ record.usageReading || '-' }}</p>
                  </div>
                </div>

                <div class="mt-4">
                  <label class="block text-sm font-medium text-grey-700 mb-1"
                    >Descripción / Observaciones</label
                  >
                  <div class="bg-grey-50 p-4 rounded-md text-grey-800 text-sm whitespace-pre-wrap">
                    {{ record.notes || 'Sin observaciones registradas.' }}
                  </div>
                </div>
              </section>

              <!-- Spare Parts / Items Used (Placeholder for future) -->
              <section class="detail-section">
                <h2>Repuestos y Servicios</h2>
                <div class="empty-state-section">
                  <i class="fa-solid fa-box-open"></i>
                  <p>No hay detalles de items disponibles.</p>
                </div>
              </section>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="detail-sidebar">
            <div class="card">
              <h3 class="sidebar-card-title">Acciones</h3>
              <div class="quick-actions">
                <button class="btn btn-primary btn-block" (click)="editMaintenance()">
                  <i class="fa-solid fa-pen"></i> Editar
                </button>
                <button
                  *ngIf="record.status !== 'COMPLETO' && record.status !== 'CANCELADO'"
                  class="btn btn-success btn-block"
                  (click)="completeMaintenance()"
                >
                  <i class="fa-solid fa-check"></i> Marcar Completado
                </button>
                <button class="btn btn-ghost btn-block" (click)="goBack()">
                  <i class="fa-solid fa-arrow-left"></i> Volver a Equipo
                </button>
              </div>
            </div>

            <div class="card">
              <h3 class="sidebar-card-title">Información del Sistema</h3>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-date">{{ record.completionDate | date: 'short' }}</div>
                  <div class="timeline-content">Fecha de finalización</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-date">{{ record.scheduledDate | date: 'short' }}</div>
                  <div class="timeline-content">Fecha programada</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !record" class="empty-state-card mt-6">
          <i class="fa-solid fa-wrench"></i>
          <h3>Registro no encontrado</h3>
          <p>El registro que buscas no existe o ha sido eliminado.</p>
          <button type="button" class="btn btn-primary mt-4" routerLink="/equipment/maintenance">
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
      /* Local overrides */
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

      .detail-header-card {
        padding-bottom: var(--s-24);
      }

      .detail-header {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
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
