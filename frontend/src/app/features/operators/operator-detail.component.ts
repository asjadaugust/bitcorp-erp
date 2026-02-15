import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OperatorService } from '../../core/services/operator.service';
import { Operator } from '../../core/models/operator.model';

@Component({
  selector: 'app-operator-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="detail-container">
      <div class="container">
        <div class="breadcrumb">
          <a routerLink="/operators" class="breadcrumb-link">← Volver a Operadores</a>
        </div>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Cargando detalles del operador...</p>
        </div>

        <div *ngIf="!loading && operator" class="detail-grid">
          <div class="detail-main card">
            <div class="detail-header">
              <div class="profile-intro">
                <div class="avatar-large">
                  {{ operator.nombres.charAt(0) }}{{ operator.apellido_paterno.charAt(0) }}
                </div>
                <div>
                  <h1>{{ operator.nombres }} {{ operator.apellido_paterno }}</h1>
                  <p class="code-badge">DNI: {{ operator.dni }}</p>
                </div>
              </div>
            </div>

            <div class="detail-status">
              <span [class]="'status-badge status-' + (operator.is_active ? 'active' : 'inactive')">
                {{ operator.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </div>

            <div class="detail-sections">
              <section class="detail-section">
                <h2>Información de Contacto</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Email</label>
                    <p>{{ operator.correo_electronico }}</p>
                  </div>
                  <div class="info-item">
                    <label>Teléfono</label>
                    <p>{{ operator.telefono || '-' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Información Laboral</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Cargo</label>
                    <p>{{ operator.cargo || 'No especificado' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Fecha Ingreso</label>
                    <p>
                      {{
                        operator.fecha_ingreso ? (operator.fecha_ingreso | date: 'dd/MM/yyyy') : '-'
                      }}
                    </p>
                  </div>
                </div>
              </section>

              <section class="detail-section" *ngIf="operator.licencia_conducir">
                <h2>Licencia de Conducir</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Nro. Licencia</label>
                    <p>{{ operator.licencia_conducir }}</p>
                  </div>
                  <div class="info-item">
                    <label>Vencimiento</label>
                    <p>
                      {{
                        operator.vencimiento_licencia
                          ? (operator.vencimiento_licencia | date: 'dd/MM/yyyy')
                          : '-'
                      }}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div class="detail-sidebar">
            <!-- Quick Actions -->
            <div class="card">
              <h3>Acciones Rápidas</h3>
              <div class="quick-actions">
                <button class="btn btn-secondary btn-block" (click)="editOperator()">
                  <i class="fa-solid fa-pen"></i> Editar
                </button>
                <button class="btn btn-primary btn-block" (click)="sendNotification()">
                  <i class="fa-solid fa-bell"></i> Notificar
                </button>
                <button class="btn btn-secondary btn-block" (click)="viewReports()">
                  <i class="fa-solid fa-clipboard-list"></i> Ver Reportes
                </button>
              </div>
            </div>

            <!-- System Info -->
            <div class="card">
              <h3>Información del Sistema</h3>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-date">{{ operator.created_at | date: 'short' }}</div>
                  <div class="timeline-content">Registro creado</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-date">{{ operator.updated_at | date: 'short' }}</div>
                  <div class="timeline-content">Última actualización</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !operator" class="empty-state card">
          <h3>Operador no encontrado</h3>
          <p>El operador que buscas no existe o ha sido eliminado.</p>
          <button class="btn btn-primary" routerLink="/operators">Volver a la lista</button>
        </div>
      </div>
    </div>
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
