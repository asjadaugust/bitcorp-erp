import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SigService, SigDocument, PaginatedResponse } from '../../services/sig.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../../core/design-system/data-grid/aero-data-grid.component';
import { Breadcrumb } from '../../../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../../shared/components/filter-bar/filter-bar.component';
import { AeroButtonComponent } from '../../../../core/design-system';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, AeroDataGridComponent, FilterBarComponent, AeroButtonComponent],
  template: `
    <div class="document-list-container">
      <div class="actions-bar">
        <aero-button variant="primary" iconLeft="fa-upload" (clicked)="uploadDocument()"
          >Subir Documento</aero-button
        >
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-data-grid
        [gridId]="'sig-document-list'"
        [columns]="columns"
        [data]="documents"
        [loading]="loading"
        [dense]="true"
        [showColumnChooser]="true"
        [serverSide]="true"
        [totalItems]="total"
        [actionsTemplate]="actionsTemplate"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)"
      >
      </aero-data-grid>

      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <a [href]="row.archivoUrl" target="_blank" class="btn-icon" title="Descargar">
            <i class="fa-solid fa-download"></i>
          </a>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .document-list-container {
        background: var(--neutral-0);
        border-radius: 8px;
        padding: var(--s-24);
        box-shadow: var(--shadow-sm);
      }
      .actions-bar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: var(--s-16);
      }
      .btn-icon {
        color: var(--primary-500);
        text-decoration: none;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        transition: all 0.2s;
      }

      .btn-icon:hover {
        background: var(--primary-100);
        border-radius: var(--s-4);
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ],
})
export class DocumentListComponent implements OnInit {
  private sigService = inject(SigService);
  private router = inject(Router);

  documents: SigDocument[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  loading = false;
  filters = { search: '', estado: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'SIG', url: '/sig' },
    { label: 'Documentos' },
  ];

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Buscar documentos...' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Vigente', value: 'VIGENTE' },
        { label: 'Obsoleto', value: 'OBSOLETO' },
        { label: 'En Revisión', value: 'EN_REVISION' },
        { label: 'Anulado', value: 'ANULADO' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'codigo', label: 'Código', type: 'text', sortable: true },
    { key: 'titulo', label: 'Título', type: 'text', sortable: true },
    { key: 'tipoDocumento', label: 'Tipo', type: 'text', sortable: true },
    { key: 'version', label: 'Versión', type: 'text' },
    {
      key: 'fechaEmision',
      label: 'Fecha Emisión',
      type: 'date',
      format: 'dd/MM/yyyy',
      sortable: true,
    },
    { key: 'responsable', label: 'Responsable', type: 'text', hidden: true },
    { key: 'area', label: 'Área', type: 'text', hidden: true },
    { key: 'observaciones', label: 'Observaciones', type: 'text', hidden: true },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        VIGENTE: { label: 'Vigente', class: 'badge quality' },
        OBSOLETO: { label: 'Obsoleto', class: 'badge environment' },
        EN_REVISION: { label: 'En Revisión', class: 'badge safety' },
        ANULADO: { label: 'Anulado', class: 'badge cancelled' },
      },
    },
  ];

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.loading = true;
    this.sigService
      .getDocumentsPaginated({
        page: this.page,
        limit: this.pageSize,
        estado: this.filters.estado || undefined,
      })
      .subscribe({
        next: (res: PaginatedResponse<SigDocument>) => {
          this.documents = res.data;
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: () => {
          this.documents = [];
          this.loading = false;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadDocuments();
  }
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadDocuments();
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.estado = (filters['estado'] as string) || '';
    this.page = 1;
    this.loadDocuments();
  }

  uploadDocument(): void {
    this.router.navigate(['/sig/documents/new']);
  }
}
