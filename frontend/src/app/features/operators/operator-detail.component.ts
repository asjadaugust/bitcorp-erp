import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OperatorService } from '../../core/services/operator.service';
import { Operator } from '../../core/models/operator.model';

import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';

@Component({
  selector: 'app-operator-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageLayoutComponent],
  template: `
    <app-page-layout
      [title]="
        operator ? operator.nombres + ' ' + operator.apellido_paterno : 'Detalles del Operador'
      "
      icon="fa-user"
      [breadcrumbs]="[
        { label: 'Dashboard', url: '/app' },
        { label: 'Operadores', url: '/operators' },
        {
          label: operator ? operator.nombres + ' ' + operator.apellido_paterno : 'Detalles',
        },
      ]"
      [loading]="loading"
    >
      <div actions class="actions-container" *ngIf="operator">
        <button class="btn btn-secondary" (click)="editOperator()">
          <i class="fa-solid fa-pen"></i> Editar
        </button>
        <button class="btn btn-primary" (click)="sendNotification()">
          <i class="fa-solid fa-bell"></i> Notificar
        </button>
      </div>

      <div *ngIf="operator" class="detail-grid">
        <div class="detail-main">
          <!-- Profile Card -->
          <div class="card profile-card">
            <div class="profile-header">
              <div class="avatar-large">
                {{ operator.nombres.charAt(0) }}{{ operator.apellido_paterno.charAt(0) }}
              </div>
              <div class="profile-info">
                <h2>{{ operator.nombres }} {{ operator.apellido_paterno }}</h2>
                <p class="email">
                  <i class="fa-regular fa-envelope"></i> {{ operator.correo_electronico }}
                </p>
                <div class="badges">
                  <span [class]="'badge status-' + getEstadoClass()">
                    {{ getEstadoLabel() }}
                  </span>
                  <span class="badge role-badge">Operador</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Info Sections -->
          <div class="card">
            <h3><i class="fa-solid fa-address-card"></i> Información de Contacto</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Teléfono</label>
                <p>{{ operator.telefono }}</p>
              </div>
              <div class="info-item">
                <label>Email</label>
                <p>{{ operator.correo_electronico }}</p>
              </div>
            </div>
          </div>

          <div class="card">
            <h3><i class="fa-solid fa-briefcase"></i> Información Laboral</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Fecha de Ingreso</label>
                <p>{{ operator.fecha_ingreso | date: 'mediumDate' }}</p>
              </div>

              <!-- Hourly rate removed -->

              <div class="info-item" *ngIf="operator.licencia_conducir">
                <label>Número de Licencia</label>
                <p>{{ operator.licencia_conducir }}</p>
              </div>
              <div class="info-item" *ngIf="operator.vencimiento_licencia">
                <label>Vencimiento Licencia</label>
                <p>{{ operator.vencimiento_licencia | date: 'mediumDate' }}</p>
              </div>
            </div>
          </div>

          <!-- Skills, Notes, Performance removed -->
        </div>
      </div>

      <div *ngIf="!loading && !operator" class="empty-state">
        <i class="fa-solid fa-user-slash"></i>
        <h3>Operador no encontrado</h3>
        <button class="btn btn-primary" (click)="navigateTo('/operators')">
          Volver a la lista
        </button>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: var(--s-24);
        margin-top: var(--s-24);
      }

      .card {
        background: white;
        padding: var(--s-24);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--grey-200);
        margin-bottom: var(--s-24);
      }

      .card h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--grey-900);
        margin-bottom: var(--s-16);
        padding-bottom: var(--s-12);
        border-bottom: 1px solid var(--grey-100);
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .card h3 i {
        color: var(--primary-500);
      }

      /* Profile Header */
      .profile-header {
        display: flex;
        gap: var(--s-24);
        align-items: center;
      }

      .avatar-large {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: var(--primary-100);
        color: var(--primary-700);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        font-weight: 600;
        border: 4px solid white;
        box-shadow: var(--shadow-sm);
      }

      .profile-info h2 {
        margin: 0 0 var(--s-8) 0;
        font-size: 24px;
        color: var(--grey-900);
      }

      .email {
        color: var(--grey-500);
        margin-bottom: var(--s-12);
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .badges {
        display: flex;
        gap: var(--s-8);
      }

      /* Info Grid */
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-16);
      }

      .info-item label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: var(--grey-500);
        margin-bottom: var(--s-4);
        text-transform: uppercase;
      }

      .info-item p {
        font-size: 15px;
        color: var(--grey-900);
        font-weight: 500;
      }

      .highlight {
        color: var(--primary-600) !important;
        font-size: 18px !important;
        font-weight: 600 !important;
      }

      /* Skills */
      .skills-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: var(--s-16);
      }

      .skill-card {
        background: var(--grey-50);
        padding: var(--s-12);
        border-radius: var(--radius-sm);
        border-left: 3px solid var(--primary-400);
      }

      .skill-card h4 {
        margin: 0 0 var(--s-4) 0;
        font-size: 14px;
        color: var(--grey-900);
      }

      .skill-level {
        font-size: 12px;
        color: var(--primary-600);
        font-weight: 600;
        margin-bottom: var(--s-4);
      }

      .experience {
        font-size: 11px;
        color: var(--grey-500);
      }

      /* Sidebar */
      .quick-actions {
        display: flex;
        flex-direction: column;
        gap: var(--s-12);
      }

      .btn-outline {
        background: white;
        border: 1px solid var(--grey-300);
        color: var(--grey-700);
        padding: var(--s-12);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        gap: var(--s-12);
        transition: all 0.2s;
        cursor: pointer;
        width: 100%;
        justify-content: flex-start;
      }

      .btn-outline:hover {
        background: var(--grey-50);
        border-color: var(--primary-500);
        color: var(--primary-600);
      }

      /* Performance */
      .performance {
        text-align: center;
        padding: var(--s-16) 0;
      }

      .rating-circle {
        display: flex;
        align-items: baseline;
        justify-content: center;
        margin-bottom: var(--s-8);
      }

      .rating-value {
        font-size: 48px;
        font-weight: 700;
        color: var(--primary-600);
        line-height: 1;
      }

      .rating-max {
        font-size: 16px;
        color: var(--grey-400);
      }

      .stars {
        color: var(--grey-300);
        font-size: 18px;
      }

      .stars .active {
        color: var(--semantic-yellow-500);
      }

      .header-actions {
        display: flex;
        gap: var(--s-12);
      }

      .btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
      }

      .btn-primary {
        background: var(--primary-500);
        color: white;
      }

      .btn-secondary {
        background: white;
        border: 1px solid var(--grey-300);
        color: var(--grey-700);
      }

      @media (max-width: 1024px) {
        .detail-grid {
          grid-template-columns: 1fr;
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

  getEstadoClass(): string {
    return this.operator?.is_active ? 'activo' : 'inactivo';
  }

  getEstadoLabel(): string {
    return this.operator?.is_active ? 'Activo' : 'Inactivo';
  }

  editOperator(): void {
    if (this.operator) {
      this.router.navigate(['/operators', this.operator.id, 'edit']);
    }
  }

  viewSchedule(): void {
    alert('View Schedule - Feature coming soon!');
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

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
