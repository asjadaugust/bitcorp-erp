import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import {
  EntityDetailShellComponent,
  EntityDetailHeader,
  AuditInfo,
} from '../../shared/components/entity-detail';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, EntityDetailShellComponent],
  template: `
    <entity-detail-shell
      [loading]="loading"
      [entity]="project"
      [header]="header"
      [auditInfo]="auditInfo"
      loadingText="Cargando detalles del proyecto..."
    >
      <!-- ── MAIN CONTENT ─────────────────────────────────────── -->
      <div entity-main-content class="tab-content">
        <section class="detail-section">
          <h2>Información del Proyecto</h2>
          <div class="info-grid">
            <div class="info-item" *ngIf="project?.ubicacion">
              <label>Ubicación</label>
              <p>{{ project?.ubicacion }}</p>
            </div>
            <div class="info-item" *ngIf="project?.cliente">
              <label>Cliente</label>
              <p>{{ project?.cliente }}</p>
            </div>
            <div class="info-item" *ngIf="project?.fechaInicio">
              <label>Fecha Inicio</label>
              <p>{{ project?.fechaInicio | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="info-item" *ngIf="project?.fechaFin">
              <label>Fecha Fin</label>
              <p>{{ project?.fechaFin | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="info-item" *ngIf="project?.presupuesto">
              <label>Presupuesto</label>
              <p>{{ project?.presupuesto | currency: 'PEN' }}</p>
            </div>
          </div>
        </section>

        <section class="detail-section" *ngIf="project?.descripcion">
          <h2>Descripción</h2>
          <p class="notes">{{ project?.descripcion }}</p>
        </section>
      </div>

      <!-- ── SIDEBAR ACTIONS ──────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <button type="button" class="btn btn-primary btn-block" (click)="editProject()">
          <i class="fa-solid fa-pen"></i>
          Editar Proyecto
        </button>
        <button type="button" class="btn btn-secondary btn-block" (click)="assignResources()">
          <i class="fa-solid fa-users"></i>
          Asignar Recursos
        </button>
        <button type="button" class="btn btn-secondary btn-block" (click)="viewReports()">
          <i class="fa-solid fa-file-alt"></i>
          Ver Reportes
        </button>
        <button type="button" class="btn btn-secondary btn-block" (click)="viewBudget()">
          <i class="fa-solid fa-chart-line"></i>
          Ver Presupuesto
        </button>
        <button type="button" class="btn btn-ghost btn-block" (click)="navigateTo('/projects')">
          <i class="fa-solid fa-arrow-left"></i>
          Volver a Lista
        </button>
        <button type="button" class="btn btn-danger btn-block" (click)="deleteProject()">
          <i class="fa-solid fa-trash"></i>
          Eliminar Proyecto
        </button>
      </ng-container>
    </entity-detail-shell>

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

  get header(): EntityDetailHeader {
    return {
      icon: 'fa-solid fa-folder-open',
      title: this.project?.nombre || 'Proyecto',
      subtitle: this.project?.codigo || 'Detalle de Proyecto',
      statusLabel: this.getStatusLabel(this.project?.estado || ''),
      statusClass: `status-${this.getStatusClass(this.project?.estado || '')}`,
    };
  }

  get auditInfo(): AuditInfo {
    return {
      entries: [
        { date: this.project?.updatedAt, label: 'Última actualización' },
        { date: this.project?.createdAt, label: 'Proyecto creado' },
      ],
    };
  }

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
