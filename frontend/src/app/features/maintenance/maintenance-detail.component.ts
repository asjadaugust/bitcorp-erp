import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { MaintenanceRecord } from '../../core/models/maintenance-record.model';
import {
  EntityDetailShellComponent,
  EntityDetailHeader,
  AuditInfo,
  NotFoundConfig,
} from '../../shared/components/entity-detail';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-maintenance-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, EntityDetailShellComponent],
  template: `
    <entity-detail-shell
      [loading]="loading"
      [entity]="record"
      [header]="header"
      [auditInfo]="auditInfo"
      [notFound]="notFoundConfig"
      loadingText="Cargando detalles del mantenimiento..."
    >
      <!-- ── MAIN CONTENT ─────────────────────────────────────── -->
      <div entity-main-content class="detail-sections">
        <section class="detail-section">
          <h2>Detalles del Trabajo</h2>
          <div class="info-grid three-cols">
            <div class="info-item">
              <label>Tipo de Mantenimiento</label>
              <p>{{ record?.tipoMantenimiento }}</p>
            </div>
            <div class="info-item">
              <label>Técnico Responsable</label>
              <p>{{ record?.tecnicoResponsable || 'No asignado' }}</p>
            </div>
            <div class="info-item">
              <label>Costo</label>
              <p class="font-medium">
                {{ record?.costoReal || record?.costoEstimado | currency: 'USD' }}
              </p>
            </div>
            <div class="info-item">
              <label>Fecha Programada</label>
              <p>{{ record?.fechaProgramada | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="info-item">
              <label>Fecha Realización</label>
              <p>
                {{ record?.fechaRealizada ? (record!.fechaRealizada | date: 'dd/MM/yyyy') : '-' }}
              </p>
            </div>
          </div>

          <div class="notes-block">
            <label class="notes-label">Descripción / Observaciones</label>
            <div class="notes-content">
              {{ record?.descripcion || record?.observaciones || 'Sin observaciones registradas.' }}
            </div>
          </div>
        </section>

        <section class="detail-section">
          <h2>Repuestos y Servicios</h2>
          <div class="empty-state-section">
            <i class="fa-solid fa-box-open"></i>
            <p>No hay detalles de items disponibles.</p>
          </div>
        </section>
      </div>

      <!-- ── SIDEBAR ACTIONS ──────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <button class="btn btn-primary btn-block" (click)="editMaintenance()">
          <i class="fa-solid fa-pen"></i> Editar
        </button>
        @if (record?.estado !== 'COMPLETADO' && record?.estado !== 'CANCELADO') {
          <button class="btn btn-success btn-block" (click)="completeMaintenance()">
            <i class="fa-solid fa-check"></i> Marcar Completado
          </button>
        }
        <button class="btn btn-ghost btn-block" (click)="goBack()">
          <i class="fa-solid fa-arrow-left"></i> Volver a Equipo
        </button>
      </ng-container>
    </entity-detail-shell>
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--s-32);
        margin-top: var(--s-8);
      }

      .link-primary {
        color: var(--primary-600);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }

      .font-medium {
        font-weight: 500;
      }

      .notes-block {
        margin-top: var(--s-16);
      }

      .notes-label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: var(--grey-700);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: var(--s-8);
      }

      .notes-content {
        background: var(--grey-50);
        padding: var(--s-16);
        border-radius: var(--radius-md);
        color: var(--grey-800);
        font-size: 14px;
        white-space: pre-wrap;
        line-height: 1.6;
      }

      .empty-state-section {
        text-align: center;
        padding: var(--s-32);
        color: var(--grey-500);
        background: var(--grey-50);
        border-radius: var(--radius-md);

        i {
          font-size: 32px;
          margin-bottom: var(--s-12);
          color: var(--grey-300);
          display: block;
        }

        p {
          margin: 0;
          font-size: 14px;
        }
      }
    `,
  ],
})
export class MaintenanceDetailComponent implements OnInit {
  private maintenanceService = inject(MaintenanceService);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);
  router = inject(Router);

  record: MaintenanceRecord | null = null;
  loading = true;

  get header(): EntityDetailHeader {
    return {
      icon: 'fa-solid fa-screwdriver-wrench',
      title: this.record?.tipoMantenimiento ?? 'Mantenimiento',
      subtitle: this.record?.equipo
        ? `${this.record.equipo.codigo_equipo} - ${this.record.equipo.marca} ${this.record.equipo.modelo}`
        : undefined,
      statusLabel: this.getStatusLabel(this.record?.estado ?? ''),
      statusClass: this.getStatusClass(this.record?.estado ?? ''),
    };
  }

  get auditInfo(): AuditInfo {
    return {
      entries: [
        { date: this.record?.fechaRealizada, label: 'Fecha de finalización' },
        { date: this.record?.fechaProgramada, label: 'Fecha programada' },
      ],
    };
  }

  notFoundConfig: NotFoundConfig = {
    icon: 'fa-solid fa-wrench',
    title: 'Registro no encontrado',
    message: 'El registro que buscas no existe o ha sido eliminado.',
    backLabel: 'Volver a la lista',
    backRoute: '/equipment/maintenance',
  };

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

  editMaintenance(): void {
    if (this.record) {
      this.router.navigate(['edit'], { relativeTo: this.route });
    }
  }

  completeMaintenance(): void {
    // Placeholder — implement status transition when backend supports it
    alert('Marcar como completado — próximamente');
  }

  goBack(): void {
    if (this.record?.equipoId) {
      this.router.navigate(['/equipment', this.record.equipoId]);
    } else {
      this.router.navigate(['/equipment/maintenance']);
    }
  }

  deleteRecord(): void {
    this.confirmSvc.confirmDelete('este registro de mantenimiento').subscribe((confirmed) => {
      if (confirmed && this.record) {
        this.maintenanceService.delete(this.record.id).subscribe({
          next: () => {
            this.router.navigate(['../../'], { relativeTo: this.route });
          },
          error: (error) => {
            console.error('Failed to delete record:', error);
          },
        });
      }
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PROGRAMADO: 'Programado',
      EN_PROCESO: 'En Proceso',
      COMPLETO: 'Completado',
      COMPLETADO: 'Completado',
      CANCELADO: 'Cancelado',
      PENDIENTE: 'Pendiente',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETO':
      case 'COMPLETADO':
        return 'status-APROBADO';
      case 'PENDIENTE':
      case 'EN_PROCESO':
      case 'PROGRAMADO':
        return 'status-PENDIENTE';
      case 'CANCELADO':
        return 'status-CANCELADO';
      default:
        return 'status-BORRADOR';
    }
  }
}
