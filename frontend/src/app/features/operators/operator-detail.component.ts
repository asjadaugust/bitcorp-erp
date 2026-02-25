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
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  EntityDetailShellComponent,
  EntityDetailHeader,
  AuditInfo,
  NotFoundConfig,
} from '../../shared/components/entity-detail';
import { ButtonComponent } from '../../shared/components/button/button.component';
import {
  AeroBadgeComponent,
  BadgeVariant,
} from '../../core/design-system/badge/aero-badge.component';

@Component({
  selector: 'app-operator-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    EntityDetailShellComponent,
    ButtonComponent,
    AeroBadgeComponent,
  ],
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
                @if (disponibilidad?.estado) {
                  <aero-badge
                    [variant]="disponibilidad?.estado === 'DISPONIBLE' ? 'success' : 'info'"
                  >
                    {{ disponibilidad?.estado }}
                  </aero-badge>
                } @else {
                  <span class="text-muted">—</span>
                }
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
              <aero-badge variant="info">{{ h.nivel_habilidad }}</aero-badge>
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
              <aero-badge [variant]="getCertBadgeVariant(cert.estado)">
                {{ cert.estado }}
              </aero-badge>
            </div>
          </div>
        </section>
      </div>

      <!-- ── SIDEBAR ACTIONS ──────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <app-button
          variant="primary"
          icon="fa-pen"
          label="Editar"
          [fullWidth]="true"
          (clicked)="editOperator()"
        ></app-button>
        <app-button
          variant="secondary"
          icon="fa-bell"
          label="Notificar"
          [fullWidth]="true"
          (clicked)="sendNotification()"
        ></app-button>
        <app-button
          variant="secondary"
          icon="fa-clipboard-list"
          label="Ver Reportes"
          [fullWidth]="true"
          (clicked)="viewReports()"
        ></app-button>
        <app-button
          variant="ghost"
          icon="fa-arrow-left-long"
          label="Volver a Lista"
          [fullWidth]="true"
          (clicked)="navigateToList()"
        ></app-button>
      </ng-container>
    </app-entity-detail-shell>
  `,
  styles: [
    `
      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--s-32);
        padding: var(--s-24);
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
        .label {
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
          color: var(--grey-900);
          margin: 0;
          word-break: break-word;
        }
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
        background: var(--grey-100);
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
        background: var(--grey-50, var(--grey-100));
        border-radius: 8px;
      }

      .cert-info {
        font-size: 13px;
      }

      .text-muted {
        color: var(--grey-500);
        font-size: 12px;
      }
    `,
  ],
})
export class OperatorDetailComponent implements OnInit {
  private operatorService = inject(OperatorService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

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
    if (this.operator) {
      this.operatorService.notify(this.operator.id, 'Notificación del sistema').subscribe({
        next: () => {
          this.snackBar.open('Notificación enviada correctamente', 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Error al enviar la notificación', 'Cerrar', { duration: 3000 });
        },
      });
    }
  }

  navigateToList(): void {
    this.router.navigate(['/operators']);
  }

  getCertBadgeVariant(estado: string): BadgeVariant {
    switch (estado) {
      case 'VIGENTE':
        return 'success';
      case 'POR_VENCER':
        return 'warning';
      case 'VENCIDO':
        return 'error';
      default:
        return 'neutral';
    }
  }
}
