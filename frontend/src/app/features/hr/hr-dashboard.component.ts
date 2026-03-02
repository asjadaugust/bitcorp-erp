import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { HR_TABS } from './hr-tabs';

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PageLayoutComponent],
  template: `
    <app-page-layout
      title="Recursos Humanos"
      icon="fa-users-gear"
      [breadcrumbs]="breadcrumbs"
      [tabs]="tabs"
    >
      <div class="module-grid">
        <!-- Personal Card -->
        <div
          class="module-card"
          (click)="navigateTo('employees')"
          (keydown.enter)="navigateTo('employees')"
          tabindex="0"
          role="button"
        >
          <div class="card-icon">
            <i class="fa-solid fa-users"></i>
          </div>
          <div class="card-content">
            <h3>Gestión de Personal</h3>
            <p>Administrar trabajadores, datos personales y contratos.</p>
          </div>
          <div class="card-action">
            <i class="fa-solid fa-arrow-right"></i>
          </div>
        </div>

        <!-- Attendance Card (Placeholder) -->
        <div class="module-card disabled">
          <div class="card-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="card-content">
            <h3>Asistencia</h3>
            <p>Control de asistencia y horarios (Próximamente).</p>
          </div>
        </div>

        <!-- Payroll Card (Placeholder) -->
        <div class="module-card disabled">
          <div class="card-icon">
            <i class="fa-solid fa-file-invoice-dollar"></i>
          </div>
          <div class="card-content">
            <h3>Planillas</h3>
            <p>Cálculo de pagos y beneficios (Próximamente).</p>
          </div>
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .module-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--s-24);
      }

      .module-card {
        background: var(--neutral-0);
        border-radius: var(--s-12);
        padding: var(--s-24);
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid var(--grey-200);
        box-shadow: var(--shadow-sm);
      }

      .module-card:hover:not(.disabled) {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
        border-color: var(--primary-200);
      }

      .module-card.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: var(--grey-50);
      }

      .card-icon {
        width: 48px;
        height: 48px;
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--type-h4-size);
      }

      .card-content h3 {
        margin: 0 0 var(--s-8) 0;
        font-size: var(--type-h4-size);
        color: var(--grey-900);
      }

      .card-content p {
        margin: 0;
        color: var(--grey-700);
        font-size: var(--type-bodySmall-size);
        line-height: 1.5;
      }

      .card-action {
        margin-top: auto;
        display: flex;
        justify-content: flex-end;
        color: var(--primary-500);
      }
    `,
  ],
})
export class HrDashboardComponent {
  private router = inject(Router);

  tabs = HR_TABS;
  breadcrumbs = [{ label: 'Inicio', url: '/app' }, { label: 'RRHH' }];

  navigateTo(path: string): void {
    this.router.navigate(['/rrhh', path]);
  }
}
