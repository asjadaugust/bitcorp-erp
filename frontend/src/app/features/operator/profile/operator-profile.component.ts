import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OperatorService } from '../../../core/services/operator.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Operator,
  OperatorCertification,
  OperatorSkill,
  OperatorDisponibilidad,
  OperatorRendimiento,
} from '../../../core/models/operator.model';

interface ProfileData {
  operator: Operator;
  certifications: OperatorCertification[];
  skills: OperatorSkill[];
  disponibilidad: OperatorDisponibilidad;
  rendimiento: OperatorRendimiento;
}

@Component({
  selector: 'app-operator-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container">
      <header class="profile-header">
        <h1>Mi Perfil</h1>
        <p class="subtitle">Información personal y profesional</p>
      </header>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-overlay" data-testid="loading-spinner">
        <div class="spinner"></div>
        <p>Cargando perfil...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading && error" class="error-state" data-testid="error-state">
        <div class="error-icon">!</div>
        <h3>No se pudo cargar el perfil</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" (click)="retry()">Reintentar</button>
      </div>

      <!-- Profile Content -->
      <div *ngIf="!loading && !error && profile" class="profile-content">
        <!-- Profile Card -->
        <div class="profile-card">
          <div class="profile-avatar">
            <span class="avatar-icon">&#128100;</span>
          </div>
          <h2 data-testid="profile-name">
            {{
              profile.operator.nombre_completo ||
                profile.operator.nombres + ' ' + profile.operator.apellido_paterno
            }}
          </h2>
          <p class="profile-id" data-testid="profile-id">DNI: {{ profile.operator.dni }}</p>

          <!-- Availability Badge -->
          <div class="availability-wrapper">
            <span
              class="availability-badge"
              [class.disponible]="profile.disponibilidad.estado === 'DISPONIBLE'"
              [class.asignado]="profile.disponibilidad.estado === 'ASIGNADO'"
              data-testid="availability-badge"
            >
              {{ profile.disponibilidad.estado === 'DISPONIBLE' ? 'Disponible' : 'Asignado' }}
            </span>
          </div>

          <!-- Stats -->
          <div class="profile-stats">
            <div class="stat" data-testid="stat-rating">
              <div class="stat-value">{{ profile.rendimiento.eficiencia | number: '1.0-0' }}%</div>
              <div class="stat-label">Eficiencia</div>
            </div>
            <div class="stat" data-testid="stat-skills">
              <div class="stat-value">{{ profile.skills.length }}</div>
              <div class="stat-label">Habilidades</div>
            </div>
            <div class="stat" data-testid="stat-certifications">
              <div class="stat-value">{{ profile.certifications.length }}</div>
              <div class="stat-label">Certificaciones</div>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="info-section">
          <h3>Información de Contacto</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-icon">&#128231;</span>
              <div class="info-content">
                <div class="info-label">Email</div>
                <div class="info-value">
                  {{ profile.operator.correo_electronico || 'No especificado' }}
                </div>
              </div>
            </div>
            <div class="info-item">
              <span class="info-icon">&#128241;</span>
              <div class="info-content">
                <div class="info-label">Teléfono</div>
                <div class="info-value">{{ profile.operator.telefono || 'No especificado' }}</div>
              </div>
            </div>
            <div class="info-item">
              <span class="info-icon">&#128197;</span>
              <div class="info-content">
                <div class="info-label">Fecha de Ingreso</div>
                <div class="info-value">{{ formatDate(profile.operator.fecha_ingreso || '') }}</div>
              </div>
            </div>
            <div class="info-item" *ngIf="profile.operator.cargo">
              <span class="info-icon">&#127970;</span>
              <div class="info-content">
                <div class="info-label">Cargo</div>
                <div class="info-value">{{ profile.operator.cargo }}</div>
              </div>
            </div>
            <div class="info-item" *ngIf="profile.operator.especialidad">
              <span class="info-icon">&#9881;</span>
              <div class="info-content">
                <div class="info-label">Especialidad</div>
                <div class="info-value">{{ profile.operator.especialidad }}</div>
              </div>
            </div>
            <div class="info-item" *ngIf="profile.operator.licencia_conducir">
              <span class="info-icon">&#128203;</span>
              <div class="info-content">
                <div class="info-label">Licencia</div>
                <div class="info-value">{{ profile.operator.licencia_conducir }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Section -->
        <div class="info-section">
          <h3>Rendimiento (Últimos {{ profile.rendimiento.periodo_dias }} días)</h3>
          <div class="performance-grid">
            <div class="perf-stat">
              <div class="perf-value">{{ profile.rendimiento.total_partes }}</div>
              <div class="perf-label">Partes Totales</div>
            </div>
            <div class="perf-stat">
              <div class="perf-value">
                {{ profile.rendimiento.horas_totales | number: '1.0-1' }}
              </div>
              <div class="perf-label">Horas Totales</div>
            </div>
            <div class="perf-stat success">
              <div class="perf-value">{{ profile.rendimiento.partes_aprobados }}</div>
              <div class="perf-label">Aprobados</div>
            </div>
            <div class="perf-stat warning">
              <div class="perf-value">{{ profile.rendimiento.partes_pendientes }}</div>
              <div class="perf-label">Pendientes</div>
            </div>
            <div class="perf-stat danger">
              <div class="perf-value">{{ profile.rendimiento.partes_rechazados }}</div>
              <div class="perf-label">Rechazados</div>
            </div>
          </div>
          <div class="efficiency-section">
            <div class="efficiency-header">
              <span class="efficiency-label">Eficiencia</span>
              <span class="efficiency-value"
                >{{ profile.rendimiento.eficiencia | number: '1.0-1' }}%</span
              >
            </div>
            <div class="performance-bar-track">
              <div
                class="performance-bar"
                [style.width.%]="profile.rendimiento.eficiencia"
                [class.bar-high]="profile.rendimiento.eficiencia >= 80"
                [class.bar-mid]="
                  profile.rendimiento.eficiencia >= 50 && profile.rendimiento.eficiencia < 80
                "
                [class.bar-low]="profile.rendimiento.eficiencia < 50"
              ></div>
            </div>
          </div>
        </div>

        <!-- Skills -->
        <div class="info-section">
          <h3>Habilidades y Equipos</h3>
          <div class="skills-list" *ngIf="profile.skills.length > 0; else noSkills">
            <span
              *ngFor="let skill of profile.skills"
              class="skill-tag"
              data-testid="skill-tag"
              [title]="skill.anios_experiencia + ' años de experiencia'"
            >
              {{ skill.tipo_equipo }}
              <span class="skill-level" [class]="'level-' + skill.nivel_habilidad.toLowerCase()">{{
                skill.nivel_habilidad
              }}</span>
            </span>
          </div>
          <ng-template #noSkills>
            <p class="empty-text">No se han registrado habilidades.</p>
          </ng-template>
        </div>

        <!-- Certifications -->
        <div class="info-section">
          <h3>Certificaciones</h3>
          <div class="certifications-list" *ngIf="profile.certifications.length > 0; else noCerts">
            <div
              *ngFor="let cert of profile.certifications; let i = index"
              class="cert-item"
              [attr.data-testid]="'cert-item-' + i"
            >
              <div class="cert-icon">&#128220;</div>
              <div class="cert-info">
                <div class="cert-name">{{ cert.nombre_certificacion }}</div>
                <div class="cert-meta" *ngIf="cert.entidad_emisora">{{ cert.entidad_emisora }}</div>
                <div
                  class="cert-expiry"
                  [class.expired]="cert.estado === 'VENCIDO'"
                  [class.por-vencer]="cert.estado === 'POR_VENCER'"
                >
                  <ng-container *ngIf="cert.fecha_vencimiento">
                    Vence: {{ formatDate(cert.fecha_vencimiento) }}
                  </ng-container>
                </div>
              </div>
              <div
                class="cert-status"
                [class.valid]="cert.estado === 'VIGENTE'"
                [class.expired]="cert.estado === 'VENCIDO'"
                [class.warning]="cert.estado === 'POR_VENCER'"
              >
                <ng-container [ngSwitch]="cert.estado">
                  <span *ngSwitchCase="'VIGENTE'">Vigente</span>
                  <span *ngSwitchCase="'VENCIDO'">Expirada</span>
                  <span *ngSwitchCase="'POR_VENCER'">Por Vencer</span>
                </ng-container>
              </div>
            </div>
          </div>
          <ng-template #noCerts>
            <p class="empty-text">No se han registrado certificaciones.</p>
          </ng-template>
        </div>

        <!-- Actions -->
        <div class="profile-actions">
          <button class="btn btn-secondary">Editar Perfil</button>
          <button class="btn btn-secondary">Cambiar Contrasena</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-container {
        padding: 24px;
        max-width: 900px;
        margin: 0 auto;
      }

      .profile-header {
        margin-bottom: 32px;
      }

      .profile-header h1 {
        font-size: 28px;
        font-weight: 600;
        color: #072b45;
        margin: 0 0 8px 0;
      }

      .subtitle {
        font-size: 16px;
        color: #6b7280;
        margin: 0;
      }

      /* Loading */
      .loading-overlay {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 24px;
        gap: 16px;
        color: #6b7280;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top-color: #0077cd;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Error State */
      .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 80px 24px;
        gap: 12px;
        text-align: center;
      }

      .error-icon {
        width: 64px;
        height: 64px;
        background: #fee2e2;
        color: #dc2626;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: 700;
      }

      .error-state h3 {
        font-size: 20px;
        color: #072b45;
        margin: 0;
      }

      .error-state p {
        color: #6b7280;
        margin: 0;
      }

      /* Profile Content */
      .profile-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .profile-card {
        background: linear-gradient(135deg, #0077cd 0%, #00a1de 100%);
        color: white;
        border-radius: 16px;
        padding: 40px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 119, 205, 0.3);
      }

      .profile-avatar {
        width: 100px;
        height: 100px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        border: 4px solid rgba(255, 255, 255, 0.3);
      }

      .avatar-icon {
        font-size: 48px;
      }

      .profile-card h2 {
        margin: 0 0 8px 0;
        font-size: 28px;
        font-weight: 600;
      }

      .profile-id {
        margin: 0 0 16px 0;
        opacity: 0.9;
        font-size: 14px;
      }

      /* Availability Badge */
      .availability-wrapper {
        display: flex;
        justify-content: center;
        margin-bottom: 24px;
      }

      .availability-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.3px;
      }

      .availability-badge.disponible {
        background: #d1fae5;
        color: #065f46;
      }

      .availability-badge.asignado {
        background: #fff3cd;
        color: #92400e;
      }

      .profile-stats {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin-top: 16px;
      }

      .stat {
        text-align: center;
      }

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        line-height: 1;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 13px;
        opacity: 0.9;
      }

      /* Info Sections */
      .info-section {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .info-section h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
        color: #072b45;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
      }

      .info-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
      }

      .info-icon {
        font-size: 28px;
      }

      .info-label {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }

      .info-value {
        font-size: 15px;
        font-weight: 600;
        color: #072b45;
      }

      /* Performance Section */
      .performance-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 20px;
      }

      .perf-stat {
        flex: 1;
        min-width: 100px;
        text-align: center;
        padding: 16px 12px;
        background: #f9fafb;
        border-radius: 8px;
      }

      .perf-stat.success {
        background: #d1fae5;
      }
      .perf-stat.warning {
        background: #fff3cd;
      }
      .perf-stat.danger {
        background: #fee2e2;
      }

      .perf-value {
        font-size: 28px;
        font-weight: 700;
        color: #072b45;
        line-height: 1;
        margin-bottom: 6px;
      }

      .perf-label {
        font-size: 12px;
        color: #6b7280;
      }

      /* Progress Bar */
      .efficiency-section {
        margin-top: 8px;
      }

      .efficiency-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .efficiency-label {
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
      }

      .efficiency-value {
        font-size: 16px;
        font-weight: 700;
        color: #072b45;
      }

      .performance-bar-track {
        width: 100%;
        height: 12px;
        background: #e5e7eb;
        border-radius: 6px;
        overflow: hidden;
      }

      .performance-bar {
        height: 100%;
        border-radius: 6px;
        transition: width 0.6s ease;
      }

      .performance-bar.bar-high {
        background: #059669;
      }
      .performance-bar.bar-mid {
        background: #d97706;
      }
      .performance-bar.bar-low {
        background: #dc2626;
      }

      /* Skills */
      .skills-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .skill-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: #e6f2ff;
        color: #0077cd;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
      }

      .skill-level {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .level-principiante {
        background: #d1fae5;
        color: #065f46;
      }
      .level-intermedio {
        background: #dbeafe;
        color: #1e40af;
      }
      .level-avanzado {
        background: #fef3c7;
        color: #92400e;
      }
      .level-experto {
        background: #ede9fe;
        color: #5b21b6;
      }

      /* Certifications */
      .certifications-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .cert-item {
        display: flex;
        align-items: center;
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
      }

      .cert-icon {
        font-size: 28px;
        margin-right: 16px;
      }

      .cert-info {
        flex: 1;
      }

      .cert-name {
        font-weight: 600;
        color: #072b45;
        margin-bottom: 2px;
      }

      .cert-meta {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 2px;
      }

      .cert-expiry {
        font-size: 13px;
        color: #6b7280;
      }

      .cert-expiry.expired {
        color: #dc2626;
        font-weight: 600;
      }

      .cert-expiry.por-vencer {
        color: #d97706;
        font-weight: 600;
      }

      .cert-status {
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 600;
      }

      .cert-status.valid {
        background: #d1fae5;
        color: #059669;
      }
      .cert-status.expired {
        background: #fee2e2;
        color: #dc2626;
      }
      .cert-status.warning {
        background: #fff3cd;
        color: #d97706;
      }

      /* Empty state */
      .empty-text {
        color: #9ca3af;
        font-size: 14px;
        text-align: center;
        padding: 16px 0;
        margin: 0;
      }

      /* Actions */
      .profile-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .btn-primary {
        background: #0077cd;
        color: white;
      }

      .btn-primary:hover {
        background: #005fa3;
      }

      .btn-secondary {
        background: #f3f4f6;
        color: #374151;
      }

      .btn-secondary:hover {
        background: #e5e7eb;
      }

      @media (max-width: 768px) {
        .profile-container {
          padding: 16px;
        }

        .profile-card {
          padding: 24px;
        }

        .profile-stats {
          gap: 20px;
        }

        .profile-actions {
          flex-direction: column;
        }

        .btn {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
})
export class OperatorProfileComponent implements OnInit {
  private operatorService = inject(OperatorService);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  loading = true;
  error: string | null = null;
  profile: ProfileData | null = null;

  private currentOperatorId: number | null = null;

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const routeId = params['id'] ? parseInt(params['id'], 10) : null;
      if (routeId && !isNaN(routeId)) {
        this.currentOperatorId = routeId;
        this.loadProfile(routeId);
      } else {
        // Fallback: use the current user's operador_id; show error if not found
        const user = this.authService.currentUser;
        const fallbackId = (user as unknown as Record<string, unknown>)?.['operador_id'] as
          | number
          | undefined;
        if (!fallbackId) {
          this.loading = false;
          this.error = 'No se encontró un perfil de operador asociado a este usuario.';
          return;
        }
        this.currentOperatorId = fallbackId;
        this.loadProfile(fallbackId);
      }
    });
  }

  loadProfile(id: number) {
    this.loading = true;
    this.error = null;

    const emptyRendimiento: OperatorRendimiento = {
      operador_id: id,
      periodo_dias: 30,
      total_partes: 0,
      horas_totales: 0,
      partes_aprobados: 0,
      partes_rechazados: 0,
      partes_pendientes: 0,
      eficiencia: 0,
    };

    const emptyDisponibilidad: OperatorDisponibilidad = {
      operador_id: id,
      estado: 'DISPONIBLE',
      parte_diario_hoy: null,
    };

    forkJoin({
      operator: this.operatorService.getById(id),
      certifications: this.operatorService
        .getCertifications(id)
        .pipe(catchError(() => of([] as OperatorCertification[]))),
      skills: this.operatorService.getSkills(id).pipe(catchError(() => of([] as OperatorSkill[]))),
      disponibilidad: this.operatorService
        .getAvailability(id)
        .pipe(catchError(() => of(emptyDisponibilidad))),
      rendimiento: this.operatorService
        .getPerformance(id, 30)
        .pipe(catchError(() => of(emptyRendimiento))),
    }).subscribe({
      next: (data) => {
        this.profile = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading operator profile', err);
        this.error =
          'No se pudo cargar la información del operador. Verifique su conexión e intente de nuevo.';
        this.loading = false;
      },
    });
  }

  retry() {
    if (this.currentOperatorId) {
      this.loadProfile(this.currentOperatorId);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES');
    } catch {
      return dateStr;
    }
  }
}
