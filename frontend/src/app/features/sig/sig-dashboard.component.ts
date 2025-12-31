import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentListComponent } from './components/document-list/document-list.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';

@Component({
  selector: 'app-sig-dashboard',
  standalone: true,
  imports: [CommonModule, DocumentListComponent, PageLayoutComponent],
  template: `
    <app-page-layout
      title="Sistema Integrado de Gestión (SIG)"
      icon="fa-file-shield"
      [breadcrumbs]="breadcrumbs"
    >
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Calidad</h3>
          <div class="value">ISO 9001</div>
        </div>
        <div class="stat-card">
          <h3>Medio Ambiente</h3>
          <div class="value">ISO 14001</div>
        </div>
        <div class="stat-card">
          <h3>Seguridad</h3>
          <div class="value">ISO 45001</div>
        </div>
      </div>

      <app-document-list></app-document-list>
    </app-page-layout>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--s-24);
      margin-bottom: var(--s-32);
    }
    .stat-card {
      background: white;
      padding: var(--s-24);
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border-left: 4px solid var(--primary-500);
    }
    .stat-card h3 {
      font-size: var(--type-body-size);
      color: var(--grey-700);
      margin-bottom: var(--s-8);
    }
    .stat-card .value {
      font-size: var(--type-h3-size);
      font-weight: 600;
      color: var(--grey-900);
    }
  `]
})
export class SigDashboardComponent {
  breadcrumbs = [
    { label: 'Dashboard', url: '/app' },
    { label: 'SIG' }
  ];
}
