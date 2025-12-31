import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logistics-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="page-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fa-solid fa-boxes-stacked"></i>
          </div>
          <div class="title-group">
            <h1>Logística y Almacén</h1>
            <p class="subtitle">Gestión de inventario, entradas y salidas</p>
          </div>
        </div>
      </div>

      <div class="content-area">
        <div class="empty-state">
          <i class="fa-solid fa-boxes-stacked"></i>
          <h3>Módulo en Construcción</h3>
          <p>Próximamente podrás gestionar todo el inventario desde aquí.</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 0;
      }
      .page-header {
        margin-bottom: 24px;
      }
      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .icon-wrapper {
        width: 48px;
        height: 48px;
        background: var(--primary-100);
        color: var(--primary-800);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }
      .title-group h1 {
        font-size: var(--type-h3-size);
        color: var(--primary-900);
        margin: 0 0 4px 0;
      }
      .subtitle {
        color: var(--grey-500);
        margin: 0;
      }
      .content-area {
        background: var(--neutral-0);
        border-radius: var(--radius-md);
        padding: 48px;
        text-align: center;
        border: 1px solid var(--grey-200);
      }
      .empty-state i {
        font-size: 64px;
        color: var(--grey-300);
        margin-bottom: 16px;
      }
      .empty-state h3 {
        color: var(--grey-900);
        margin: 0 0 8px 0;
      }
      .empty-state p {
        color: var(--grey-500);
        margin: 0;
      }
    `,
  ],
})
export class LogisticsDashboardComponent {}
