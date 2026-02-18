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
    <div class="detail-container">
      <div class="container">
        <div class="breadcrumb">
          <a routerLink="/equipment" class="breadcrumb-link">← Volver a la Lista de Equipos</a>
        </div>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Cargando detalles del equipo...</p>
        </div>

        <div *ngIf="!loading && equipment" class="detail-grid">
          <div class="detail-main">
            <!-- Header Card -->
            <div class="card detail-header-card">
              <div class="detail-header">
                <div>
                  <h1>{{ equipment.marca }} {{ equipment.modelo }}</h1>
                  <span class="code-badge">{{ equipment.codigo_equipo }}</span>
                </div>
                <!-- Status moved to header right side or distinct line -->
                <div class="detail-status">
                  <span [class]="'status-badge status-' + equipment.estado">
                    {{ equipment.estado | uppercase }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Detail Sections -->
            <div class="detail-sections">
              <!-- Basic Info -->
              <div class="card">
                <div class="detail-section">
                  <h2>Información Básica</h2>
                  <div class="info-grid intro-grid-2col">
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
                      <p>{{ equipment.numero_serie_equipo || 'N/A' }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tech Info -->
              <div class="card">
                <div class="detail-section">
                  <h2>Información Técnica</h2>
                  <div class="info-grid">
                    <div class="info-item">
                      <label>Placa</label>
                      <p>{{ equipment.placa || 'N/A' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Número de Chasis</label>
                      <p>{{ equipment.numero_chasis || 'N/A' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Serie Motor</label>
                      <p>{{ equipment.numero_serie_motor || 'N/A' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Año de Fabricación</label>
                      <p>{{ equipment.anio_fabricacion || 'N/A' }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Operational Data -->
              <div class="card">
                <div class="detail-section">
                  <h2>Datos Operativos</h2>
                  <div class="info-grid">
                    <div class="info-item">
                      <label>Tipo de Medidor</label>
                      <p class="highlight">{{ equipment.medidor_uso || 'N/A' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Tipo de Motor</label>
                      <p>{{ equipment.tipo_motor || 'N/A' }}</p>
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
                </div>
              </div>
            </div>
          </div>

          <div class="detail-sidebar">
            <div class="card">
              <h3 class="sidebar-card-title">Acciones Rápidas</h3>
              <div class="quick-actions">
                <button class="btn btn-primary btn-block" (click)="editEquipment()">
                  <i class="fa-solid fa-pen"></i> Editar Equipo
                </button>
                <button class="btn btn-secondary btn-block" (click)="assignToProject()">
                  <i class="fa-solid fa-location-dot"></i> Asignar a Proyecto
                </button>
                <button class="btn btn-secondary btn-block" (click)="scheduleMaintenance()">
                  <i class="fa-solid fa-wrench"></i> Programar Mantenimiento
                </button>
                <button class="btn btn-secondary btn-block" (click)="viewHistory()">
                  <i class="fa-solid fa-clock-rotate-left"></i> Ver Historial
                </button>
                <button class="btn btn-danger btn-block" (click)="deleteEquipment()">
                  <i class="fa-solid fa-trash"></i> Eliminar
                </button>
              </div>
            </div>

            <div class="card">
              <h3 class="sidebar-card-title">Línea de Tiempo</h3>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-date">
                    {{ equipment.updated_at | date: 'short' }}
                  </div>
                  <div class="timeline-content">Última Actualización</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-date">
                    {{ equipment.created_at | date: 'short' }}
                  </div>
                  <div class="timeline-content">Equipo Agregado</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !equipment" class="empty-state card">
          <i class="fa-solid fa-truck-front"></i>
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
          <button type="button" class="btn btn-icon" (click)="showDeleteModal = false">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            ¿Estás seguro de que quieres eliminar
            <strong>{{ equipment?.name }}</strong
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
