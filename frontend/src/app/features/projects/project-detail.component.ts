import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import {
  EntityDetailShellComponent,
  EntityDetailHeader,
  AuditInfo,
  TabConfig,
} from '../../shared/components/entity-detail';
import { ConfirmService } from '../../core/services/confirm.service';
import { AeroTabsComponent } from '../../shared/components/aero-tabs/aero-tabs.component';
import { AeroButtonComponent, BreadcrumbItem } from '../../core/design-system';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    EntityDetailShellComponent,
    AeroTabsComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-entity-detail-shell
      [loading]="loading"
      [entity]="project"
      [header]="header"
      [auditInfo]="auditInfo"
      [backUrl]="'/projects'"
      [breadcrumbs]="breadcrumbs"
      loadingText="Cargando detalles del proyecto..."
    >
      <div entity-header-below>
        <app-aero-tabs
          [tabs]="tabConfigs"
          [activeTabId]="activeTab"
          (tabChange)="activeTab = $event.id || 'general'"
        ></app-aero-tabs>
      </div>

      <!-- ── MAIN CONTENT ─────────────────────────────────────── -->
      <div entity-main-content class="detail-sections">
        @if (project) {
          @if (activeTab === 'general') {
            <section class="detail-section card">
              <div class="section-header">
                <h3>Información del Proyecto</h3>
              </div>
              <div class="info-grid">
                <div class="info-item" *ngIf="project?.ubicacion">
                  <span class="label">Ubicación</span>
                  <p class="value">{{ project?.ubicacion }}</p>
                </div>
                <div class="info-item" *ngIf="project?.cliente">
                  <span class="label">Cliente</span>
                  <p class="value">{{ project?.cliente }}</p>
                </div>
                <div class="info-item" *ngIf="project?.fechaInicio">
                  <span class="label">Fecha Inicio</span>
                  <p class="value">{{ project?.fechaInicio | date: 'dd/MM/yyyy' }}</p>
                </div>
                <div class="info-item" *ngIf="project?.fechaFin">
                  <span class="label">Fecha Fin</span>
                  <p class="value">{{ project?.fechaFin | date: 'dd/MM/yyyy' }}</p>
                </div>
                <div class="info-item" *ngIf="project?.presupuesto">
                  <span class="label">Presupuesto</span>
                  <p class="value highlight project-link">
                    {{ project?.presupuesto | currency: 'PEN' }}
                  </p>
                </div>
              </div>
            </section>

            <section class="detail-section card" *ngIf="project?.descripcion">
              <div class="section-header">
                <h3>Descripción</h3>
              </div>
              <p class="notes">{{ project?.descripcion }}</p>
            </section>
          }

          @if (activeTab === 'recursos') {
            <section class="detail-section card">
              <div class="section-header">
                <h3>Recursos Asignados</h3>
                <aero-button
                  variant="primary"
                  size="small"
                  iconLeft="fa-plus"
                  (clicked)="assignResources()"
                  >Asignar</aero-button
                >
              </div>
              <div class="empty-state-placeholder">
                <i class="fa-solid fa-users fa-3x"></i>
                <p>No se han asignado recursos específicos a este proyecto todavía.</p>
              </div>
            </section>
          }

          @if (activeTab === 'reportes') {
            <section class="detail-section card">
              <div class="section-header">
                <h3>Partes Diarios</h3>
              </div>
              <div class="empty-state-placeholder">
                <i class="fa-solid fa-file-alt fa-3x"></i>
                <p>No hay partes diarios registrados para este proyecto.</p>
              </div>
            </section>
          }

          @if (activeTab === 'presupuesto') {
            <section class="detail-section card">
              <div class="section-header">
                <h3>Estado de Presupuesto</h3>
              </div>
              <div class="empty-state-placeholder">
                <i class="fa-solid fa-chart-line fa-3x"></i>
                <p>La gestión detallada de presupuesto estará disponible próximamente.</p>
              </div>
            </section>
          }
        }
      </div>

      <!-- ── SIDEBAR ACTIONS ──────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <aero-button
          variant="primary"
          iconLeft="fa-pen"
          [fullWidth]="true"
          (clicked)="editProject()"
          >Editar Proyecto</aero-button
        >
        <aero-button
          variant="secondary"
          iconLeft="fa-users"
          [fullWidth]="true"
          (clicked)="assignResources()"
          >Asignar Recursos</aero-button
        >
        <div class="sidebar-divider"></div>
        <aero-button
          variant="danger"
          iconLeft="fa-trash"
          [fullWidth]="true"
          (clicked)="deleteProject()"
          >Eliminar Proyecto</aero-button
        >
      </ng-container>
    </app-entity-detail-shell>
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

      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);
      }

      .detail-section {
        padding: var(--s-24);
        border-radius: 16px;

        h3 {
          font-size: 0.75rem;
          margin: 0;
          color: var(--grey-600);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--s-20);

        h3 {
          font-size: 0.75rem;
          margin: 0;
          color: var(--grey-600);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px 40px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--grey-500);
          font-weight: 700;
          margin-bottom: 4px;
          display: block;
        }

        .value {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--grey-900);
          margin: 0;
          line-height: 1.4;

          &.highlight {
            color: var(--primary-700);
            font-weight: 700;
            font-size: 1.05rem;
          }
        }
      }

      .empty-state-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--s-48) var(--s-24);
        color: var(--grey-400);
        text-align: center;
        gap: var(--s-16);

        i {
          opacity: 0.5;
        }

        p {
          font-size: 14px;
          max-width: 300px;
          margin: 0;
        }
      }

      .sidebar-divider {
        height: 1px;
        background: var(--grey-100);
        margin: var(--s-16) 0;
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

      .alert-warning {
        background: var(--grey-100);
        color: var(--grey-900);
        border: 1px solid var(--grey-300);
      }
    `,
  ],
})
export class ProjectDetailComponent implements OnInit {
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  get breadcrumbs(): BreadcrumbItem[] {
    return [{ label: 'Proyectos', url: '/projects' }, { label: this.project?.nombre || 'Detalle' }];
  }

  project: Project | null = null;
  loading = true;
  activeTab = 'general';

  tabConfigs: TabConfig[] = [
    { id: 'general', label: 'General', icon: 'fa-solid fa-circle-info' },
    { id: 'recursos', label: 'Recursos', icon: 'fa-solid fa-users' },
    { id: 'reportes', label: 'Partes Diarios', icon: 'fa-solid fa-file-alt' },
    { id: 'presupuesto', label: 'Presupuesto', icon: 'fa-solid fa-chart-line' },
  ];

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
    if (!this.project) return;

    this.confirmSvc.confirmDelete(`el proyecto ${this.project.nombre}`).subscribe((confirmed) => {
      if (confirmed && this.project) {
        this.projectService.delete(String(this.project.id)).subscribe({
          next: () => {
            this.router.navigate(['/projects']);
          },
          error: (error) => {
            console.error('Failed to delete project:', error);
          },
        });
      }
    });
  }

  assignResources(): void {
    this.snackBar.open('Asignar Recursos — próximamente', 'Cerrar', { duration: 3000 });
  }

  viewReports(): void {
    this.snackBar.open('Ver Reportes — próximamente', 'Cerrar', { duration: 3000 });
  }

  viewBudget(): void {
    this.snackBar.open('Ver Presupuesto — próximamente', 'Cerrar', { duration: 3000 });
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
