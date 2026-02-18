import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="detail-container">
      <div class="container">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando detalles del proyecto...</p>
        </div>

        <div *ngIf="!loading && project" class="detail-grid">
          <div class="detail-main card">
            <div class="detail-header">
              <div>
                <h1>{{ project.nombre }}</h1>
                <p class="text-subtitle">{{ project.codigo_proyecto }}</p>
              </div>
              <div class="detail-status">
                <span
                  class="status-badge"
                  [class.status-APROBADO]="
                    project.estado === 'ACTIVO' || project.estado === 'COMPLETADO'
                  "
                  [class.status-PENDIENTE]="project.estado === 'EN_PAUSA'"
                  [class.status-CANCELADO]="project.estado === 'CANCELADO'"
                >
                  {{ getStatusLabel(project.estado) }}
                </span>
              </div>
            </div>

            <div class="detail-sections">
              <section class="detail-section">
                <h2>Información General</h2>
                <div class="info-grid three-cols">
                  <div class="info-item">
                    <label>Cliente</label>
                    <p>{{ project.cliente || '-' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Ubicación</label>
                    <p>{{ project.ubicacion || '-' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Presupuesto Total</label>
                    <p class="highlight text-primary">
                      {{ project.presupuesto_total | currency: 'PEN' : 'S/ ' }}
                    </p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Fechas y Plazos</h2>
                <div class="info-grid three-cols">
                  <div class="info-item">
                    <label>Fecha de Inicio</label>
                    <p>{{ project.fecha_inicio | date: 'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Fecha Fin Estimada</label>
                    <p>{{ project.fecha_fin_estimada | date: 'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Fecha Fin Real</label>
                    <p>{{ (project.fecha_fin_real | date: 'dd/MM/yyyy') || '-' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section" *ngIf="project.descripcion">
                <h2>Descripción</h2>
                <p class="notes">{{ project.descripcion }}</p>
              </section>
            </div>
          </div>

          <div class="detail-sidebar">
            <div class="card">
              <h3 class="sidebar-card-title">Acciones</h3>
              <div class="quick-actions">
                <button type="button" class="btn btn-primary btn-block" (click)="editProject()">
                  <i class="fa-solid fa-pen"></i> Editar Proyecto
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-block"
                  (click)="navigateTo('/projects')"
                >
                  <i class="fa-solid fa-arrow-left"></i> Volver a Lista
                </button>
                <button type="button" class="btn btn-danger btn-block" (click)="deleteProject()">
                  <i class="fa-solid fa-trash"></i> Eliminar Proyecto
                </button>
              </div>
            </div>

            <div class="card">
              <h3 class="sidebar-card-title">Gestión</h3>
              <div class="quick-actions">
                <button
                  type="button"
                  class="btn btn-secondary btn-block"
                  (click)="assignResources()"
                >
                  <i class="fa-solid fa-users"></i> Asignar Recursos
                </button>
                <button type="button" class="btn btn-secondary btn-block" (click)="viewReports()">
                  <i class="fa-solid fa-file-alt"></i> Ver Reportes
                </button>
                <button type="button" class="btn btn-secondary btn-block" (click)="viewBudget()">
                  <i class="fa-solid fa-chart-line"></i> Ver Presupuesto
                </button>
              </div>
            </div>

            <div class="card">
              <h3 class="sidebar-card-title">Información del Sistema</h3>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-date">{{ project.updated_at | date: 'short' }}</div>
                  <div class="timeline-content">Última actualización</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-date">{{ project.created_at | date: 'short' }}</div>
                  <div class="timeline-content">Proyecto creado</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !project" class="empty-state-card mt-6">
          <i class="fa-solid fa-project-diagram"></i>
          <h3>Proyecto no encontrado</h3>
          <p>El proyecto que buscas no existe o ha sido eliminado.</p>
          <button type="button" class="btn btn-primary mt-4" (click)="navigateTo('/projects')">
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
            ¿Estás seguro de que deseas eliminar el proyecto <strong>{{ project?.nombre }}</strong
            >?
          </p>
          <p class="alert alert-warning">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="showDeleteModal = false">
            Cancelar
          </button>
          <button type="button" class="btn btn-danger" (click)="confirmDelete()">
            Eliminar Proyecto
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .text-subtitle {
        font-size: 16px;
        color: var(--grey-600);
        margin-top: -4px;
        font-family: monospace;
        background: var(--grey-100);
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      .highlight {
        font-weight: 700;
        font-size: 20px;
      }

      .text-primary {
        color: var(--primary-600);
      }
      .mt-4 {
        margin-top: 1rem;
      }
      .mt-6 {
        margin-top: 1.5rem;
      }

      .notes {
        background: var(--grey-50);
        padding: var(--s-16);
        border-radius: var(--radius-sm);
        border-left: 4px solid var(--primary-500);
        line-height: 1.6;
        margin: 0;
        color: var(--grey-700);
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
export class ProjectDetailComponent implements OnInit {
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  project: Project | null = null;
  loading = true;
  showDeleteModal = false;

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadProject(id);
  }

  loadProject(id: string): void {
    this.loading = true;
    this.projectService.getById(id).subscribe({
      next: (data) => {
        this.project = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  editProject(): void {
    if (this.project) {
      this.router.navigate(['/projects', this.project.id, 'edit']);
    }
  }

  deleteProject(): void {
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.project) {
      this.projectService.delete(String(this.project.id)).subscribe({
        next: () => {
          this.router.navigate(['/projects']);
        },
        error: (error) => {
          console.error('Failed to delete project:', error);
          this.showDeleteModal = false;
        },
      });
    }
  }

  assignResources(): void {
    alert('Asignar Recursos - ¡Próximamente!');
  }

  viewReports(): void {
    alert('Ver Reportes - ¡Próximamente!');
  }

  viewBudget(): void {
    alert('Ver Presupuesto - ¡Próximamente!');
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  getStatusClass(estado: string): string {
    const map: Record<string, string> = {
      ACTIVO: 'active',
      COMPLETADO: 'completed',
      EN_PAUSA: 'on-hold',
      CANCELADO: 'cancelled',
    };
    return map[estado] || 'active';
  }

  getStatusLabel(estado: string): string {
    const map: Record<string, string> = {
      ACTIVO: 'Activo',
      COMPLETADO: 'Completado',
      EN_PAUSA: 'En Pausa',
      CANCELADO: 'Cancelado',
    };
    return map[estado] || estado;
  }
}
