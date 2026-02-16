import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceSchedule } from '../../../core/models/maintenance-schedule.model';

@Component({
  selector: 'app-maintenance-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="maintenance-card" [class.hoverable]="clickable" (click)="onCardClick()">
      <div class="card-header">
        <div class="status-row">
          <span [class]="getStatusClass(schedule.estado)">
            <i [class]="getStatusIcon(schedule.estado)"></i>
            {{ getEstadoLabel(schedule.estado) }}
          </span>
          <span class="header-date">
            <i class="fa-regular fa-calendar"></i>
            {{ schedule.fechaProgramada | date: 'dd/MM/yyyy' }}
          </span>
        </div>
        <h3 class="equipment-title">{{ schedule.equipo?.codigo_equipo || 'Equipo Sin Código' }}</h3>
        <span class="internal-code">Cod: #{{ schedule.equipoId }}</span>
      </div>

      <div class="card-body">
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">
              <i class="fa-solid fa-screwdriver-wrench"></i>
              TIPO
            </div>
            <div class="detail-value">{{ getTipoLabel(schedule.tipoMantenimiento) }}</div>
          </div>

          <div class="detail-item">
            <div class="detail-label">
              <i class="fa-solid fa-user-gear"></i>
              RESPONSABLE
            </div>
            <div class="detail-value">{{ schedule.tecnicoResponsable || 'No asignado' }}</div>
          </div>

          <div class="detail-item" *ngIf="schedule.costoEstimado">
            <div class="detail-label">
              <i class="fa-solid fa-coins"></i>
              PRESUPUESTO
            </div>
            <div class="detail-value highlight">
              {{ schedule.costoEstimado | currency: 'S/ ' }}
            </div>
          </div>

          <div class="detail-item">
            <div class="detail-label">
              <i class="fa-solid fa-clock"></i>
              REGISTRO
            </div>
            <div class="detail-value">{{ schedule.createdAt | date: 'dd/MM/yy' }}</div>
          </div>
        </div>

        <div class="description-box" *ngIf="schedule.descripcion">
          <p class="description-text">{{ schedule.descripcion }}</p>
        </div>
      </div>

      <div class="card-footer">
        <div class="meta-info">
          <span
            >Actualizado:
            {{ schedule.updatedAt || schedule.createdAt | date: 'dd/MM/yy HH:mm' }}</span
          >
        </div>
        <div class="actions">
          <button class="action-btn edit" (click)="onEdit($event)" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="action-btn delete" (click)="onDelete($event)" title="Eliminar">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .maintenance-card {
        background: #ffffff;
        border: 1px solid #e8e8e8;
        border-radius: 12px;
        padding: 1.25rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.06);
        transition: all 0.2s ease-in-out;
        position: relative;
      }

      .maintenance-card.hoverable:hover {
        box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.1);
        border-color: #d1d1d1;
        cursor: pointer;
      }

      /* Header */
      .card-header {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .header-date {
        font-size: 11px;
        color: #757575;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-weight: 600;
      }

      .equipment-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
        letter-spacing: -0.01em;
      }

      .internal-code {
        font-size: 12px;
        color: #9e9e9e;
        font-weight: 500;
      }

      /* Body/Grid */
      .card-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px dotted #eeeeee;
      }

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .detail-label {
        font-size: 10px;
        font-weight: 700;
        color: #5f6d7a;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .detail-label i {
        font-size: 10px;
      }

      .detail-value {
        font-size: 13px;
        font-weight: 600;
        color: #072b45;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .detail-value.highlight {
        color: #1976d2;
      }

      .description-box {
        background: #fcfcfc;
        padding: 0.75rem;
        border-radius: 8px;
        border: 1px solid #f0f0f0;
      }

      .description-text {
        margin: 0;
        font-size: 12px;
        line-height: 1.5;
        color: #616161;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      /* Footer */
      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
        padding-top: 0.75rem;
        border-top: 1px solid #f5f5f5;
      }

      .meta-info {
        font-size: 11px;
        color: #bdbdbd;
        font-weight: 500;
      }

      .actions {
        display: flex;
        gap: 0.5rem;
      }

      .action-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: #f5f5f5;
        color: #757575;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 12px;
      }

      .action-btn:hover {
        background: #eeeeee;
        color: #1a1a1a;
        transform: scale(1.1);
      }

      .action-btn.edit:hover {
        color: #1976d2;
      }
      .action-btn.delete:hover {
        color: #d32f2f;
      }
    `,
  ],
})
export class MaintenanceCardComponent {
  @Input({ required: true }) schedule!: MaintenanceSchedule;
  @Input() clickable = true;

  @Output() edit = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();
  @Output() click = new EventEmitter<MaintenanceSchedule>();

  onEdit(event: Event) {
    event.stopPropagation();
    if (this.schedule.id) this.edit.emit(this.schedule.id);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    if (this.schedule.id) this.delete.emit(this.schedule.id);
  }

  onCardClick() {
    if (this.clickable) this.click.emit(this.schedule);
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      PROGRAMADO: 'Programado',
      EN_PROCESO: 'En Proceso',
      COMPLETADO: 'Completado',
      CANCELADO: 'Cancelado',
      PENDIENTE: 'Pendiente',
    };
    return labels[estado] || estado;
  }

  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      PREVENTIVO: 'Preventivo',
      CORRECTIVO: 'Correctivo',
      PREDICTIVO: 'Predictivo',
    };
    return labels[tipo] || tipo;
  }

  getStatusClass(estado: string): string {
    const classes: Record<string, string> = {
      PROGRAMADO: 'status-badge status-scheduled',
      EN_PROCESO: 'status-badge status-in-progress',
      COMPLETADO: 'status-badge status-completed',
      CANCELADO: 'status-badge status-cancelled',
      PENDIENTE: 'status-badge status-pending',
    };
    return classes[estado] || 'status-badge status-pending';
  }

  getStatusIcon(estado: string): string {
    const icons: Record<string, string> = {
      PROGRAMADO: 'fa-regular fa-calendar',
      EN_PROCESO: 'fa-solid fa-spinner',
      COMPLETADO: 'fa-solid fa-check',
      CANCELADO: 'fa-solid fa-ban',
      PENDIENTE: 'fa-regular fa-clock',
    };
    return icons[estado] || 'fa-regular fa-circle';
  }
}
