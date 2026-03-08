import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SstService, SstIncidente } from '../../services/sst.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../../core/design-system/data-grid/aero-data-grid.component';
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
import { AeroButtonComponent } from '../../../../core/design-system';
import { SST_TABS } from '../../sst-tabs';

@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [
    CommonModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ActionsContainerComponent,
    PageCardComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Seguridad y Salud en el Trabajo"
      icon="fa-triangle-exclamation"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="reportIncident()"
          >Reportar Incidente</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'incident-list'"
          [columns]="columns"
          [data]="incidents"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [serverSide]="true"
          [totalItems]="total"
          [pageSize]="pageSize"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
          (rowClick)="onRowClick($event)"
          (sortChange)="onSort($event)"
        >
        </aero-data-grid>
      </app-page-card>
    </app-page-layout>
  `,
})
export class IncidentListComponent implements OnInit {
  private readonly sstService = inject(SstService);
  private readonly router = inject(Router);

  tabs = SST_TABS;
  incidents: SstIncidente[] = [];
  loading = false;
  total = 0;
  pageSize = 50;
  page = 1;
  filters = { severidad: '', estado: '' };

  breadcrumbs: Breadcrumb[] = [{ label: 'Inicio', url: '/dashboard' }, { label: 'SST' }];

  filterConfig: FilterConfig[] = [
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

  columns: DataGridColumn[] = [
    {
      key: 'fecha_incidente',
      label: 'Fecha',
      type: 'date',
      format: 'dd/MM/yyyy HH:mm',
      sortable: true,
    },
    { key: 'tipo_incidente', label: 'Tipo', type: 'text', filterable: true },
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'ubicacion', label: 'Ubicación', type: 'text', filterable: true },
    {
      key: 'severidad',
      label: 'Severidad',
      type: 'badge',
      filterable: true,
      sortable: true,
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
      filterable: true,
      sortable: true,
      badgeConfig: {
        ABIERTO: { label: 'Abierto', class: 'badge warning' },
        EN_INVESTIGACION: { label: 'En Investigación', class: 'badge info' },
        CERRADO: { label: 'Cerrado', class: 'badge success' },
      },
    },
    // Hidden legacy columns — toggled via column chooser
    { key: 'gravedad', label: 'Gravedad', hidden: true, filterable: true },
    { key: 'area_trabajo', label: 'Área Trabajo', hidden: true },
    { key: 'turno', label: 'Turno', hidden: true },
    { key: 'trabajador_afectado', label: 'Trabajador Afectado', hidden: true },
    { key: 'cargo_trabajador', label: 'Cargo', hidden: true },
    { key: 'descripcion_evento', label: 'Descripción', hidden: true },
    { key: 'causa_inmediata', label: 'Causa Inmediata', hidden: true },
    { key: 'causa_basica', label: 'Causa Básica', hidden: true },
    { key: 'accion_correctiva', label: 'Acción Correctiva', hidden: true },
    { key: 'responsable_accion', label: 'Responsable', hidden: true },
    { key: 'fecha_cierre', label: 'Fecha Cierre', type: 'date', hidden: true },
    { key: 'dias_perdidos', label: 'Días Perdidos', type: 'number', format: '1.0-0', hidden: true },
    { key: 'costo_estimado', label: 'Costo Est.', type: 'currency', hidden: true },
    { key: 'testigos', label: 'Testigos', hidden: true },
    { key: 'observaciones', label: 'Observaciones', hidden: true },
    { key: 'fecha_registro', label: 'Fecha Registro', type: 'date', hidden: true, sortable: true },
    { key: 'usuario_registro', label: 'Registrado por', hidden: true },
    { key: 'tipo_incidente_detail', label: 'Tipo Incidente', hidden: true, filterable: true },
  ];

  ngOnInit() {
    this.loadIncidents();
  }

  loadIncidents() {
    this.loading = true;
    this.sstService
      .getIncidents({
        page: this.page,
        limit: this.pageSize,
        severidad: this.filters.severidad || undefined,
        estado: this.filters.estado || undefined,
      })
      .subscribe({
        next: (response) => {
          this.incidents = response.data;
          this.total = response.pagination.total;
          this.loading = false;
        },
        error: () => {
          this.incidents = [];
          this.loading = false;
        },
      });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.severidad = (filters['severidad'] as string) || '';
    this.filters.estado = (filters['estado'] as string) || '';
    this.page = 1;
    this.loadIncidents();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadIncidents();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadIncidents();
  }

  reportIncident(): void {
    this.router.navigate(['/sst/new']);
  }

  onRowClick(row: SstIncidente): void {
    this.router.navigate(['/sst', row.id, 'edit']);
  }

  onSort(_event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }
}
