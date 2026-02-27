import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SigService, SigDocument } from '../../services/sig.service';
import {
  AeroTableComponent,
  TableColumn,
} from '../../../../core/design-system/table/aero-table.component';
import { Breadcrumb } from '../../../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../../shared/components/filter-bar/filter-bar.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, AeroTableComponent, FilterBarComponent, ButtonComponent],
  template: `
    <div class="document-list-container">
      <div class="actions-bar">
        <app-button
          variant="primary"
          label="Subir Documento"
          icon="fa-upload"
          (clicked)="uploadDocument()"
        ></app-button>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="filteredDocuments"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
      >
      </aero-table>

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
  filteredDocuments: SigDocument[] = [];
  loading = false;
  filters = { search: '', category: '' };

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

  columns: TableColumn[] = [
    { key: 'codigo', label: 'Código', type: 'text' },
    { key: 'titulo', label: 'Título', type: 'text' },
    { key: 'tipoDocumento', label: 'Tipo', type: 'text' },
    { key: 'version', label: 'Versión', type: 'text' },
    { key: 'fechaEmision', label: 'Fecha Emisión', type: 'date', format: 'dd/MM/yyyy' },
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
    this.sigService.getDocuments().subscribe({
      next: (response: unknown) => {
        // Handle paginated response { success, data, meta/pagination } or direct array
        if (response && typeof response === 'object' && 'data' in response) {
          this.documents = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          this.documents = response;
        } else {
          this.documents = [];
        }
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.documents = [];
        this.filteredDocuments = [];
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.category = (filters['category'] as string) || '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredDocuments = this.documents.filter((doc) => {
      const matchesSearch =
        !this.filters.search ||
        doc.titulo?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        doc.codigo?.toLowerCase().includes(this.filters.search.toLowerCase());

      const matchesCategory = !this.filters.category || doc.estado === this.filters.category;

      return matchesSearch && matchesCategory;
    });
  }

  uploadDocument(): void {
    this.router.navigate(['/sig/documents/new']);
  }
}
