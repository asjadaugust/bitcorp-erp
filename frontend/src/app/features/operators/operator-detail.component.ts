import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OperatorService } from '../../core/services/operator.service';
import { Operator } from '../../core/models/operator.model';

import {
  EntityDetailShellComponent,
  EntityDetailHeader,
  AuditInfo,
  NotFoundConfig,
} from '../../shared/components/entity-detail';

@Component({
  selector: 'app-operator-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EntityDetailShellComponent],
  template: `
    <entity-detail-shell
      [loading]="loading"
      [entity]="operator"
      [header]="header"
      [auditInfo]="auditInfo"
      [notFound]="notFoundConfig"
      loadingText="Cargando detalles del operador..."
    >
      <!-- ── MAIN CONTENT ─────────────────────────────────────── -->
      <div entity-main-content class="detail-sections">
        <section class="detail-section">
          <h2>Información de Contacto</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Email</span>
              <p>{{ operator?.correo_electronico || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Teléfono</span>
              <p>{{ operator?.telefono || '-' }}</p>
            </div>
          </div>
        </section>

        <section class="detail-section">
          <h2>Información Laboral</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Cargo</span>
              <p>{{ operator?.cargo || 'No especificado' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Fecha Ingreso</span>
              <p>
                {{ operator?.fecha_ingreso ? (operator!.fecha_ingreso | date: 'dd/MM/yyyy') : '-' }}
              </p>
            </div>
          </div>
        </section>

        <section class="detail-section" *ngIf="operator?.licencia_conducir">
          <h2>Licencia de Conducir</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Nro. Licencia</span>
              <p>{{ operator?.licencia_conducir }}</p>
            </div>
            <div class="info-item">
              <span class="label">Vencimiento</span>
              <p>
                {{
                  operator?.vencimiento_licencia
                    ? (operator!.vencimiento_licencia | date: 'dd/MM/yyyy')
                    : '-'
                }}
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- ── SIDEBAR ACTIONS ──────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <button class="btn btn-secondary btn-block" (click)="editOperator()">
          <i class="fa-solid fa-pen"></i> Editar
        </button>
        <button class="btn btn-primary btn-block" (click)="sendNotification()">
          <i class="fa-solid fa-bell"></i> Notificar
        </button>
        <button class="btn btn-secondary btn-block" (click)="viewReports()">
          <i class="fa-solid fa-clipboard-list"></i> Ver Reportes
        </button>
        <button class="btn btn-ghost btn-block" routerLink="/operators">
          <i class="fa-solid fa-arrow-left"></i> Volver a Lista
        </button>
      </ng-container>
    </entity-detail-shell>
  `,
  styles: [
    `
      .detail-container {
        min-height: 100vh;
        background: #f5f5f5;
        padding: var(--s-24) 0;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 var(--s-24);
      }

      .breadcrumb {
        margin-bottom: var(--s-24);
      }

      .breadcrumb-link {
        color: var(--primary-500);
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;

        &:hover {
          text-decoration: underline;
          color: var(--primary-700);
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

      .card {
        background: white;
        padding: var(--s-24);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--grey-200);
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
          line-height: 1.2;
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
      }

      .profile-intro {
        display: flex;
        gap: var(--s-16);
        align-items: center;
      }

      .avatar-large {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--primary-100);
        color: var(--primary-700);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 600;
        border: 2px solid white;
        box-shadow: var(--shadow-sm);
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
          word-break: break-word;
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

      .quick-actions {
        display: flex;
        flex-direction: column;
        gap: var(--s-12);
      }

      .btn {
        padding: var(--s-8) var(--s-16);
        border: none;
        border-radius: var(--s-8);
        font-size: var(--type-bodySmall-size);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        transition: all 0.2s ease;
        text-decoration: none;
      }

      .btn-block {
        width: 100%;
        justify-content: center;
      }

      .btn-primary {
        background: var(--primary-500);
        color: var(--neutral-0);
      }
      .btn-primary:hover:not(:disabled) {
        background: var(--primary-800);
      }

      .btn-secondary {
        background: var(--grey-200);
        color: var(--grey-700);
      }
      .btn-secondary:hover:not(:disabled) {
        background: var(--grey-300);
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

      .status-active {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .status-active::before {
        background: var(--semantic-green-500);
      }

      .status-inactive {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
      }
      .status-inactive::before {
        background: var(--semantic-red-500);
      }

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: var(--grey-500);
        gap: 16px;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--grey-200);
        border-top-color: var(--primary-500);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .empty-state {
        text-align: center;
        padding: 40px;

        h3 {
          margin-bottom: 8px;
          color: var(--grey-900);
        }

        p {
          color: var(--grey-500);
          margin-bottom: 24px;
        }
      }
    `,
  ],
})
export class OperatorDetailComponent implements OnInit {
  private operatorService = inject(OperatorService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  operator: Operator | null = null;
  loading = true;

  get header(): EntityDetailHeader {
    return {
      icon: 'fa-solid fa-user-gear',
      title: `${this.operator?.nombres} ${this.operator?.apellido_paterno}`,
      codeBadge: `DNI: ${this.operator?.dni}`,
      subtitle: this.operator?.cargo || 'Sin cargo especificado',
      statusLabel: this.operator?.is_active ? 'ACTIVO' : 'INACTIVO',
      statusClass: this.operator?.is_active ? 'status-active' : 'status-inactive',
    };
  }

  get auditInfo(): AuditInfo {
    return {
      entries: [
        { date: this.operator?.updated_at, label: 'Última actualización' },
        { date: this.operator?.created_at, label: 'Registro creado' },
      ],
    };
  }

  notFoundConfig: NotFoundConfig = {
    icon: 'fa-solid fa-user-slash',
    title: 'Operador no encontrado',
    message: 'El operador que buscas no existe o ha sido eliminado.',
    backLabel: 'Volver a la lista',
    backRoute: '/operators',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadOperator(id);
  }

  loadOperator(id: number): void {
    this.loading = true;
    this.operatorService.getById(id).subscribe({
      next: (data) => {
        this.operator = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  editOperator(): void {
    if (this.operator) {
      this.router.navigate(['/operators', this.operator.id, 'edit']);
    }
  }

  viewReports(): void {
    this.router.navigate(['/daily-reports'], {
      queryParams: { trabajador_id: this.operator?.id },
    });
  }

  sendNotification(): void {
    const message = prompt('Enter notification message:');
    if (message && this.operator) {
      this.operatorService.notify(this.operator.id, message).subscribe({
        next: () => {
          alert('Notification sent successfully!');
        },
        error: () => {
          alert('Failed to send notification');
        },
      });
    }
  }
}
