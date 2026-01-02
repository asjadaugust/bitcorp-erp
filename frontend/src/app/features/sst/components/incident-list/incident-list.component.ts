import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SstService, SafetyIncident } from '../../services/sst.service';
import { AeroTableComponent, TableColumn } from '../../../../core/design-system/table/aero-table.component';
import { PageLayoutComponent, Breadcrumb } from '../../../../shared/components/page-layout/page-layout.component';
import { FilterBarComponent, FilterConfig } from '../../../../shared/components/filter-bar/filter-bar.component';
import { ActionsContainerComponent } from '../../../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [
    CommonModule, 
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ActionsContainerComponent,
  ],
  template: `
    <app-page-layout
      title="Seguridad y Salud en el Trabajo"
      icon="fa-triangle-exclamation"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <button class="btn btn-primary" (click)="reportIncident()">
          <i class="fa-solid fa-plus"></i> Reportar Incidente
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="filteredIncidents"
        [loading]="loading"
        [templates]="{
          'reportedBy': reportedByTemplate
        }"
      >
      </aero-table>

      <ng-template #reportedByTemplate let-row>
        {{ row.reportedBy?.firstName }} {{ row.reportedBy?.lastName }}
      </ng-template>
    </app-page-layout>
  `,
  styles: [`
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
    }
    .btn-primary {
      background: var(--primary-500);
      color: var(--neutral-0);
    }
    .btn-primary:hover {
      background: var(--primary-800);
    }
    .actions-container {
      display: flex;
      gap: var(--s-8);
      align-items: center;
    }
  `]
})
export class IncidentListComponent implements OnInit {
  private readonly sstService = inject(SstService);
  private readonly router = inject(Router);
  
  incidents: SafetyIncident[] = [];
  filteredIncidents: SafetyIncident[] = [];
  loading = false;
  filters = { search: '', severity: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', url: '/app' },
    { label: 'SST', url: '/sst' },
    { label: 'Incidentes' }
  ];

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Buscar incidentes...' },
    { 
      key: 'severity', 
      label: 'Severidad', 
      type: 'select', 
      options: [
        { label: 'Baja', value: 'Low' },
        { label: 'Media', value: 'Medium' },
        { label: 'Alta', value: 'High' },
        { label: 'Crítica', value: 'Critical' }
      ]
    }
  ];

  columns: TableColumn[] = [
    { key: 'fechaIncidente', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy HH:mm' },
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'ubicacion', label: 'Ubicación', type: 'text' },
    { 
      key: 'severidad', 
      label: 'Severidad', 
      type: 'badge',
      badgeConfig: {
        'LEVE': { label: 'Baja', class: 'badge low' },
        'MODERADO': { label: 'Media', class: 'badge medium' },
        'ALTA': { label: 'Alta', class: 'badge high' },
        'CRITICA': { label: 'Crítica', class: 'badge critical' }
      }
    },
    { key: 'reportadoPor', label: 'Reportado Por', type: 'text' }
  ];

  ngOnInit() {
    this.loadIncidents();
  }

  loadIncidents() {
    this.loading = true;
    this.sstService.getIncidents().subscribe({
      next: (incidents) => {
        this.incidents = incidents;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.filters.search = filters['search'] || '';
    this.filters.severity = filters['severity'] || '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredIncidents = this.incidents.filter(incident => {
      const matchesSearch = !this.filters.search || 
        incident.description?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        incident.location?.toLowerCase().includes(this.filters.search.toLowerCase());
      
      const matchesSeverity = !this.filters.severity || incident.severity === this.filters.severity;
      
      return matchesSearch && matchesSeverity;
    });
  }

  reportIncident(): void {
    this.router.navigate(['/sst/new']);
  }
}
