import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EquipmentService } from '../../core/services/equipment.service';
import { Equipment } from '../../core/models/equipment.model';

@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="equipment-detail-container">
      <div class="container">
        <div class="breadcrumb">
          <a routerLink="/equipment" class="breadcrumb-link">← Volver a la Lista de Equipos</a>
        </div>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Cargando detalles del equipo...</p>
        </div>

        <div *ngIf="!loading && equipment" class="detail-grid">
          <div class="detail-main card">
            <div class="detail-header">
              <div>
                <h1>{{ equipment.marca }} {{ equipment.modelo }}</h1>
                <p class="equipment-code">{{ equipment.codigo_equipo }}</p>
              </div>
              <div class="detail-actions">
                <button class="btn btn-primary" (click)="editEquipment()">✏️ Editar</button>
                <button class="btn btn-danger" (click)="deleteEquipment()">🗑️ Eliminar</button>
              </div>
            </div>

            <div class="detail-status">
              <span [class]="'badge badge-' + equipment.estado">
                {{ equipment.estado | uppercase }}
              </span>
            </div>

            <div class="detail-sections">
              <section class="detail-section">
                <h2>Información Básica</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Marca</label>
                    <p>{{ equipment.marca }}</p>
                  </div>
                  <div class="info-item">
                    <label>Modelo</label>
                    <p>{{ equipment.modelo }}</p>
                  </div>
                  <div class="info-item">
                    <label>Categoría</label>
                    <p>{{ equipment.categoria || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Número de Serie</label>
                    <p>{{ equipment.serial_number || 'N/A' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Información Técnica</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Placa</label>
                    <p>{{ equipment.placa || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Número de Chasis</label>
                    <p>{{ equipment.chassis_number || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Serie Motor</label>
                    <p>{{ equipment.engine_serial_number || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Año de Fabricación</label>
                    <p>{{ equipment.manufacture_year || 'N/A' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Datos Operativos</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Tipo de Medidor</label>
                    <p class="highlight">{{ equipment.meter_type || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Tipo de Motor</label>
                    <p>{{ equipment.engine_type || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Potencia Neta</label>
                    <p>{{ equipment.net_power || 'N/A' }} HP</p>
                  </div>
                  <div class="info-item">
                    <label>Proveedor</label>
                    <p>{{ equipment.provider_name || 'N/A' }}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div class="detail-sidebar">
            <div class="card">
              <h3>Acciones Rápidas</h3>
              <div class="quick-actions">
                <button class="btn btn-secondary btn-block" (click)="assignToProject()">
                  📍 Asignar a Proyecto
                </button>
                <button class="btn btn-secondary btn-block" (click)="scheduleMaintenance()">
                  🔧 Programar Mantenimiento
                </button>
                <button class="btn btn-secondary btn-block" (click)="viewHistory()">
                  📊 Ver Historial
                </button>
              </div>
            </div>

            <div class="card">
              <h3>Línea de Tiempo de Actividad</h3>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-date">{{ equipment.updated_at | date: 'short' }}</div>
                  <div class="timeline-content">Última Actualización</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-date">{{ equipment.created_at | date: 'short' }}</div>
                  <div class="timeline-content">Equipo Agregado</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !equipment" class="empty-state card">
          <h3>Equipo No Encontrado</h3>
          <p>El equipo que buscas no existe.</p>
          <button class="btn btn-primary" routerLink="/equipment">Volver a la Lista</button>
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
          <p>
            ¿Estás seguro de que quieres eliminar <strong>{{ equipment?.name }}</strong
            >?
          </p>
          <p class="alert alert-warning">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showDeleteModal = false">Cancelar</button>
          <button class="btn btn-danger" (click)="confirmDelete()">Eliminar Equipo</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .equipment-detail-container {
        min-height: 100vh;
        background: #f5f5f5;
        padding: var(--spacing-lg) 0;
      }

      .breadcrumb {
        margin-bottom: var(--spacing-lg);
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
        gap: var(--spacing-lg);

        @media (max-width: 968px) {
          grid-template-columns: 1fr;
        }
      }

      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-lg);
        border-bottom: 2px solid #e0e0e0;

        h1 {
          font-family: var(--font-family-display);
          font-size: 28px;
          color: var(--primary-900);
          margin-bottom: var(--spacing-xs);
        }

        .equipment-code {
          color: var(--grey-500);
          font-size: 14px;
        }

        @media (max-width: 768px) {
          flex-direction: column;
          gap: var(--spacing-md);
        }
      }

      .detail-actions {
        display: flex;
        gap: var(--spacing-sm);

        @media (max-width: 768px) {
          width: 100%;

          .btn {
            flex: 1;
          }
        }
      }

      .detail-status {
        margin-bottom: var(--spacing-lg);
      }

      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
      }

      .detail-section {
        h2 {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary-900);
          margin-bottom: var(--spacing-md);
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-lg);
      }

      .info-item {
        label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--grey-500);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: var(--spacing-xs);
        }

        p {
          font-size: 16px;
          color: #333;

          &.highlight {
            font-size: 20px;
            font-weight: 600;
            color: var(--primary-500);
          }
        }
      }

      .notes {
        background: #f8f9fa;
        padding: var(--spacing-md);
        border-radius: var(--radius-sm);
        border-left: 4px solid var(--primary-500);
        line-height: 1.6;
      }

      .detail-sidebar {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);

        h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--primary-900);
          margin-bottom: var(--spacing-md);
        }
      }

      .quick-actions {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .btn-block {
        width: 100%;
        justify-content: center;
      }

      .timeline {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .timeline-item {
        position: relative;
        padding-left: var(--spacing-lg);

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
          height: calc(100% + var(--spacing-md));
          background: #e0e0e0;
        }

        &:last-child::after {
          display: none;
        }
      }

      .timeline-date {
        font-size: 12px;
        color: var(--grey-500);
        margin-bottom: var(--spacing-xs);
      }

      .timeline-content {
        font-size: 14px;
        color: #333;
      }

      .modal-body {
        p {
          margin-bottom: var(--spacing-md);

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    `,
  ],
})
export class EquipmentDetailComponent implements OnInit {
  private equipmentService = inject(EquipmentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  equipment: Equipment | null = null;
  loading = true;
  showDeleteModal = false;

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (!id || id === 'undefined' || id === 'NaN') {
      this.router.navigate(['/equipment']);
      return;
    }
    this.loadEquipment(id);
  }

  loadEquipment(id: string | number): void {
    this.loading = true;
    this.equipmentService.getById(id).subscribe({
      next: (data) => {
        this.equipment = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/equipment']);
      },
    });
  }

  editEquipment(): void {
    if (this.equipment) {
      this.router.navigate(['/equipment', this.equipment.id, 'edit']);
    }
  }

  deleteEquipment(): void {
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.equipment) {
      this.equipmentService.delete(this.equipment.id).subscribe({
        next: () => {
          this.router.navigate(['/equipment']);
        },
        error: (error) => {
          console.error('Failed to delete equipment:', error);
          this.showDeleteModal = false;
        },
      });
    }
  }

  assignToProject(): void {
    alert('Asignar a Proyecto - ¡Próximamente!');
  }

  scheduleMaintenance(): void {
    alert('Programar Mantenimiento - ¡Próximamente!');
  }

  viewHistory(): void {
    alert('Ver Historial - ¡Próximamente!');
  }
}
