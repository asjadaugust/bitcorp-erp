import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentListComponent } from './components/document-list/document-list.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';

@Component({
  selector: 'app-sig-dashboard',
  standalone: true,
  imports: [CommonModule, DocumentListComponent, PageLayoutComponent, StatsGridComponent],
  template: `
    <app-page-layout
      title="Sistema Integrado de Gestión (SIG)"
      icon="fa-file-shield"
      [breadcrumbs]="breadcrumbs"
    >
      <app-stats-grid [items]="statItems" testId="sig-dashboard-stats"></app-stats-grid>

      <app-document-list></app-document-list>
    </app-page-layout>
  `,
  styles: [``],
})
export class SigDashboardComponent {
  breadcrumbs = [{ label: 'Inicio', url: '/dashboard' }, { label: 'SIG' }];

  statItems: StatItem[] = [
    {
      label: 'Calidad',
      value: 'ISO 9001',
      icon: 'fa-award',
      color: 'primary',
      testId: 'quality-stat',
    },
    {
      label: 'Medio Ambiente',
      value: 'ISO 14001',
      icon: 'fa-leaf',
      color: 'success',
      testId: 'env-stat',
    },
    {
      label: 'Seguridad',
      value: 'ISO 45001',
      icon: 'fa-shield-halved',
      color: 'warning',
      testId: 'safety-stat',
    },
  ];
}
