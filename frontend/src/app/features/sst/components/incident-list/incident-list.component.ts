import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SstService, SstIncidente } from '../../services/sst.service';
import {
  AeroTableComponent,
  TableColumn,
} from '../../../../core/design-system/table/aero-table.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../../shared/components/filter-bar/filter-bar.component';
import { ActionsContainerComponent } from '../../../../shared/components/actions-container/actions-container.component';
import { PageCardComponent } from '../../../../shared/components/page-card/page-card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [
    CommonModule,
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ActionsContainerComponent,
    PageCardComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Seguridad y Salud en el Trabajo"
      icon="fa-triangle-exclamation"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-button
          variant="primary"
          icon="fa-plus"
          label="Reportar Incidente"
          (clicked)="reportIncident()"
        ></app-button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-table
          [columns]="columns"
          [data]="filteredIncidents"
          [loading]="loading"
          (rowClick)="onRowClick($event)"
        >
        </aero-table>
      </app-page-card>
    </app-page-layout>
  `,
})
export class IncidentListComponent implements OnInit {
  private readonly sstService = inject(SstService);
  private readonly router = inject(Router);

  incidents: SstIncidente[] = [];
  filteredIncidents: SstIncidente[] = [];
  loading = false;
  filters = { search: '', severidad: '', estado: '' };

  breadcrumbs: Breadcrumb[] = [{ label: 'Inicio', url: '/app' }, { label: 'SST' }];

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Buscar incidentes...' },
    {
      key: 'severidad',
      label: 'Severidad',
      type: 'select',
      options: [
        { label: 'Leve', value: 'LEVE' },
        { label: 'Moderado', value: 'MODERADO' },
        { label: 'Grave', value: 'GRAVE' },
        { label: 'Muy Grave', value: 'MUY_GRAVE' },
      ],
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Abierto', value: 'ABIERTO' },
        { label: 'En Investigación', value: 'EN_INVESTIGACION' },
        { label: 'Cerrado', value: 'CERRADO' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'fecha_incidente', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy HH:mm' },
    { key: 'tipo_incidente', label: 'Tipo', type: 'text' },
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'ubicacion', label: 'Ubicación', type: 'text' },
    {
      key: 'severidad',
      label: 'Severidad',
      type: 'badge',
      badgeConfig: {
        LEVE: { label: 'Leve', class: 'badge info' },
        MODERADO: { label: 'Moderado', class: 'badge warning' },
        GRAVE: { label: 'Grave', class: 'badge error' },
        MUY_GRAVE: { label: 'Muy Grave', class: 'badge critical' },
      },
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        ABIERTO: { label: 'Abierto', class: 'badge warning' },
        EN_INVESTIGACION: { label: 'En Investigación', class: 'badge info' },
        CERRADO: { label: 'Cerrado', class: 'badge success' },
      },
    },
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
        this.incidents = [];
        this.filteredIncidents = [];
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.severidad = (filters['severidad'] as string) || '';
    this.filters.estado = (filters['estado'] as string) || '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredIncidents = this.incidents.filter((incident) => {
      const matchesSearch =
        !this.filters.search ||
        incident.descripcion?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        incident.ubicacion?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        incident.tipo_incidente?.toLowerCase().includes(this.filters.search.toLowerCase());

      const matchesSeveridad =
        !this.filters.severidad || incident.severidad === this.filters.severidad;

      const matchesEstado = !this.filters.estado || incident.estado === this.filters.estado;

      return matchesSearch && matchesSeveridad && matchesEstado;
    });
  }

  reportIncident(): void {
    this.router.navigate(['/sst/new']);
  }

  onRowClick(row: SstIncidente): void {
    this.router.navigate(['/sst', row.id, 'edit']);
  }
}
