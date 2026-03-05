import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TenderService, Tender, PaginatedResponse } from '../../services/tender.service';
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
import { AeroButtonComponent } from '../../../../core/design-system';

@Component({
  selector: 'app-tender-list',
  standalone: true,
  imports: [
    CommonModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ActionsContainerComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Licitaciones"
      icon="fa-gavel"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="createTender()"
          >Nueva Licitación</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-data-grid
        [gridId]="'tender-list'"
        [columns]="columns"
        [data]="tenders"
        [loading]="loading"
        [dense]="true"
        [showColumnChooser]="true"
        [serverSide]="true"
        [totalItems]="total"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)"
      >
      </aero-data-grid>
    </app-page-layout>
  `,
  styles: [],
})
export class TenderListComponent implements OnInit {
  private readonly tenderService = inject(TenderService);
  private readonly router = inject(Router);

  tenders: Tender[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  loading = false;
  filters = { search: '', status: '' };

  breadcrumbs: Breadcrumb[] = [{ label: 'Inicio', url: '/app' }, { label: 'Licitaciones' }];

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Buscar licitaciones...' },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Publicado', value: 'PUBLICADO' },
        { label: 'En Evaluación', value: 'EVALUACION' },
        { label: 'Adjudicado', value: 'ADJUDICADO' },
        { label: 'Desierto', value: 'DESIERTO' },
        { label: 'Cancelado', value: 'CANCELADO' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'codigo', label: 'Codigo', type: 'text', sortable: true },
    { key: 'nombre', label: 'Titulo', type: 'text', sortable: true },
    { key: 'entidad_convocante', label: 'Cliente', type: 'text', sortable: true },
    {
      key: 'fecha_presentacion',
      label: 'Fecha Limite',
      type: 'date',
      format: 'dd/MM/yyyy',
      sortable: true,
    },
    {
      key: 'monto_referencial',
      label: 'Presupuesto',
      type: 'currency',
      format: 'PEN',
      sortable: true,
    },
    { key: 'responsable', label: 'Responsable', type: 'text', hidden: true },
    { key: 'tipo_licitacion', label: 'Tipo', type: 'text', hidden: true },
    { key: 'observaciones', label: 'Observaciones', type: 'text', hidden: true },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        PUBLICADO: {
          label: 'Publicado',
          class: 'status-badge status-submitted',
          icon: 'fa-solid fa-earth-americas',
        },
        EVALUACION: {
          label: 'En Evaluación',
          class: 'status-badge status-in-progress',
          icon: 'fa-solid fa-magnifying-glass',
        },
        ADJUDICADO: {
          label: 'Adjudicado',
          class: 'status-badge status-approved',
          icon: 'fa-solid fa-trophy',
        },
        DESIERTO: {
          label: 'Desierto',
          class: 'status-badge status-rejected',
          icon: 'fa-solid fa-wind',
        },
        CANCELADO: {
          label: 'Cancelado',
          class: 'status-badge status-cancelled',
          icon: 'fa-solid fa-ban',
        },
      },
    },
  ];

  ngOnInit() {
    this.loadTenders();
  }

  loadTenders() {
    this.loading = true;
    this.tenderService
      .getTendersPaginated({
        page: this.page,
        limit: this.pageSize,
        estado: this.filters.status || undefined,
      })
      .subscribe({
        next: (res: PaginatedResponse<Tender>) => {
          this.tenders = res.data;
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadTenders();
  }
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadTenders();
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.status = (filters['status'] as string) || '';
    this.page = 1;
    this.loadTenders();
  }

  createTender(): void {
    this.router.navigate(['/licitaciones/new']);
  }
}
