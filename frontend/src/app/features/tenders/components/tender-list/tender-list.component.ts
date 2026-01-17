import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TenderService, Tender } from '../../services/tender.service';
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

@Component({
  selector: 'app-tender-list',
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
      title="Licitaciones"
      icon="fa-gavel"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <button class="btn btn-primary" (click)="createTender()">
          <i class="fa-solid fa-plus"></i> Nueva Licitación
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table [columns]="columns" [data]="filteredTenders" [loading]="loading"> </aero-table>
    </app-page-layout>
  `,
  styles: [
    `
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
    `,
  ],
})
export class TenderListComponent implements OnInit {
  private readonly tenderService = inject(TenderService);
  private readonly router = inject(Router);

  tenders: Tender[] = [];
  filteredTenders: Tender[] = [];
  loading = false;
  filters = { search: '', status: '' };

  breadcrumbs: Breadcrumb[] = [{ label: 'Dashboard', url: '/app' }, { label: 'Licitaciones' }];

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

  columns: TableColumn[] = [
    { key: 'codigo', label: 'Código', type: 'text' },
    { key: 'nombre', label: 'Título', type: 'text' },
    { key: 'entidadConvocante', label: 'Cliente', type: 'text' },
    { key: 'fechaPresentacion', label: 'Fecha Límite', type: 'date', format: 'dd/MM/yyyy' },
    { key: 'montoReferencial', label: 'Presupuesto', type: 'currency', format: 'PEN' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        PUBLICADO: { label: 'Publicado', class: 'badge open' },
        EVALUACION: { label: 'En Evaluación', class: 'badge submitted' },
        ADJUDICADO: { label: 'Adjudicado', class: 'badge won' },
        DESIERTO: { label: 'Desierto', class: 'badge lost' },
        CANCELADO: { label: 'Cancelado', class: 'badge cancelled' },
      },
    },
  ];

  ngOnInit() {
    this.loadTenders();
  }

  loadTenders() {
    this.loading = true;
    this.tenderService.getTenders().subscribe({
      next: (tenders) => {
        this.tenders = tenders;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.filters.search = filters['search'] || '';
    this.filters.status = filters['status'] || '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredTenders = this.tenders.filter((tender) => {
      const matchesSearch =
        !this.filters.search ||
        tender.nombre?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        tender.entidadConvocante?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        tender.codigo?.toLowerCase().includes(this.filters.search.toLowerCase());

      const matchesStatus = !this.filters.status || tender.estado === this.filters.status;

      return matchesSearch && matchesStatus;
    });
  }

  createTender(): void {
    this.router.navigate(['/licitaciones/new']);
  }
}
