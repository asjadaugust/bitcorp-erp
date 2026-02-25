import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OperatorService } from '../../core/services/operator.service';
import {
  Operator,
  OperatorCertification,
  OperatorSkill,
  OperatorDisponibilidad,
  OperatorRendimiento,
} from '../../core/models/operator.model';

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
    <app-entity-detail-shell
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

        <!-- Availability + Performance -->
        <section class="detail-section" data-testid="section-performance">
          <h2>Desempeño (30 días)</h2>
          <div class="info-grid">
            <div class="info-item" data-testid="badge-disponibilidad">
              <span class="label">Estado Hoy</span>
              <p>
                <span
                  class="badge"
                  [class.badge-success]="disponibilidad?.estado === 'DISPONIBLE'"
                  [class.badge-info]="disponibilidad?.estado === 'ASIGNADO'"
                >
                  {{ disponibilidad?.estado ?? '—' }}
                </span>
              </p>
            </div>
            <div class="info-item" data-testid="stat-partes">
              <span class="label">Partes (30d)</span>
              <p>{{ rendimiento?.total_partes ?? '—' }}</p>
            </div>
            <div class="info-item" data-testid="stat-horas">
              <span class="label">Horas (30d)</span>
              <p>{{ rendimiento?.horas_totales ?? '—' }}</p>
            </div>
            <div class="info-item" data-testid="stat-eficiencia">
              <span class="label">Eficiencia</span>
              <p>{{ rendimiento ? (rendimiento.eficiencia | number: '1.0-0') + '%' : '—' }}</p>
            </div>
          </div>
        </section>

        <!-- Skills -->
        <section
          class="detail-section"
          *ngIf="habilidades.length > 0"
          data-testid="section-habilidades"
        >
          <h2>Habilidades y Equipos</h2>
          <div class="skills-list">
            <div *ngFor="let h of habilidades" class="skill-tag" data-testid="skill-item">
              <strong>{{ h.tipo_equipo }}</strong>
              <span class="badge badge-info">{{ h.nivel_habilidad }}</span>
              <span class="text-muted">{{ h.anios_experiencia }}a exp.</span>
            </div>
          </div>
        </section>

        <!-- Certifications -->
        <section
          class="detail-section"
          *ngIf="certificaciones.length > 0"
          data-testid="section-certificaciones"
        >
          <h2>Certificaciones</h2>
          <div class="cert-list">
            <div *ngFor="let cert of certificaciones" class="cert-item" data-testid="cert-item">
              <div class="cert-info">
                <strong data-testid="cert-nombre">{{ cert.nombre_certificacion }}</strong>
                <span *ngIf="cert.numero_certificacion" class="text-muted">
                  · {{ cert.numero_certificacion }}
                </span>
                <span *ngIf="cert.fecha_vencimiento" class="text-muted">
                  · Vence: {{ cert.fecha_vencimiento }}
                </span>
              </div>
              <span
                class="badge"
                [class.badge-success]="cert.estado === 'VIGENTE'"
                [class.badge-warning]="cert.estado === 'POR_VENCER'"
                [class.badge-danger]="cert.estado === 'VENCIDO'"
              >
                {{ cert.estado }}
              </span>
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
    </app-entity-detail-shell>
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

      /* Performance, Skills, and Certifications */
      .badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
      .badge-success {
        background: #d1fae5;
        color: #059669;
      }
      .badge-info {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .badge-warning {
        background: #fef3c7;
        color: #d97706;
      }
      .badge-danger {
        background: #fee2e2;
        color: #dc2626;
      }
      .skills-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .skill-tag {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: #f3f4f6;
        border-radius: 8px;
        font-size: 13px;
      }
      .cert-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .cert-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: #f9fafb;
        border-radius: 8px;
      }
      .cert-info {
        font-size: 13px;
      }
      .text-muted {
        color: #6b7280;
        font-size: 12px;
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

  disponibilidad: OperatorDisponibilidad | null = null;
  rendimiento: OperatorRendimiento | null = null;
  certificaciones: OperatorCertification[] = [];
  habilidades: OperatorSkill[] = [];

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
        this.loadExtraData(id);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadExtraData(id: number): void {
    forkJoin({
      disponibilidad: this.operatorService.getAvailability(id).pipe(catchError(() => of(null))),
      rendimiento: this.operatorService.getPerformance(id, 30).pipe(catchError(() => of(null))),
      certs: this.operatorService.getCertifications(id).pipe(catchError(() => of([]))),
      skills: this.operatorService.getSkills(id).pipe(catchError(() => of([]))),
    }).subscribe(({ disponibilidad, rendimiento, certs, skills }) => {
      this.disponibilidad = disponibilidad as OperatorDisponibilidad | null;
      this.rendimiento = rendimiento as OperatorRendimiento | null;
      this.certificaciones = (certs as OperatorCertification[]) ?? [];
      this.habilidades = (skills as OperatorSkill[]) ?? [];
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
