import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SigService, SigDocument } from '../../services/sig.service';
import { AeroTableComponent, TableColumn } from '../../../../core/design-system/table/aero-table.component';
import { PageLayoutComponent, Breadcrumb } from '../../../../shared/components/page-layout/page-layout.component';
import { FilterBarComponent, FilterConfig } from '../../../../shared/components/filter-bar/filter-bar.component';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule, 
    AeroTableComponent,
    FilterBarComponent
  ],
  template: `
    <div class="document-list-container">
      <div class="actions-bar">
        <button class="btn btn-primary" (click)="uploadDocument()">
          <i class="fa-solid fa-upload"></i> Subir Documento
        </button>
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
          <a [href]="row.fileUrl" target="_blank" class="btn-icon" title="Descargar">
            <i class="fa-solid fa-download"></i>
          </a>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .document-list-container {
      background: white;
      border-radius: 8px;
      padding: var(--s-24);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .actions-bar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: var(--s-16);
    }
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
  `]
})
export class DocumentListComponent implements OnInit {
  private sigService = inject(SigService);
  private router = inject(Router);
  
  documents: SigDocument[] = [];
  filteredDocuments: SigDocument[] = [];
  loading = false;
  filters = { search: '', category: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', url: '/app' },
    { label: 'SIG', url: '/sig' },
    { label: 'Documentos' }
  ];

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Buscar documentos...' },
    { 
      key: 'category', 
      label: 'Categoría', 
      type: 'select', 
      options: [
        { label: 'Calidad', value: 'Quality' },
        { label: 'Medio Ambiente', value: 'Environment' },
        { label: 'Seguridad', value: 'Safety' }
      ]
    }
  ];

  columns: TableColumn[] = [
    { key: 'code', label: 'Código', type: 'text' },
    { key: 'title', label: 'Título', type: 'text' },
    { 
      key: 'category', 
      label: 'Categoría', 
      type: 'badge',
      badgeConfig: {
        'Quality': { label: 'Calidad', class: 'badge quality' },
        'Environment': { label: 'Medio Ambiente', class: 'badge environment' },
        'Safety': { label: 'Seguridad', class: 'badge safety' }
      }
    },
    { key: 'version', label: 'Versión', type: 'text' }
  ];

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.loading = true;
    this.sigService.getDocuments().subscribe({
      next: (docs) => {
        this.documents = docs;
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
    this.filters.category = filters['category'] || '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredDocuments = this.documents.filter(doc => {
      const matchesSearch = !this.filters.search || 
        doc.title?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        doc.code?.toLowerCase().includes(this.filters.search.toLowerCase());
      
      const matchesCategory = !this.filters.category || doc.category === this.filters.category;
      
      return matchesSearch && matchesCategory;
    });
  }

  uploadDocument(): void {
    this.router.navigate(['/sig/documents/new']);
  }
}
