import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ChecklistService } from '../../../core/services/checklist.service';
import { ChecklistTemplate } from '../../../core/models/checklist.model';
import {
  AeroTableComponent,
  TableColumn,
} from '../../../core/design-system/table/aero-table.component';
import {
  PageLayoutComponent,
  TabItem,
} from '../../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../shared/components/filter-bar/filter-bar.component';
import { ActionsContainerComponent } from '../../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ActionsContainerComponent,
  ],
  template: `
    <app-page-layout
      title="Plantillas de Checklist"
      icon="fa-clipboard-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <button class="btn btn-primary" (click)="createTemplate()">
          <i class="fa-solid fa-plus"></i> Nueva Plantilla
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="templates"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          itemCount: itemCountTemplate,
          frecuencia: frecuenciaTemplate,
        }"
        (rowClick)="viewTemplate($event)"
      >
      </aero-table>

      <!-- Custom Templates -->
      <ng-template #itemCountTemplate let-row>
        <span class="item-count">
          <i class="fa-solid fa-list-check"></i>
          {{ row.items?.length || 0 }} items
        </span>
      </ng-template>

      <ng-template #frecuenciaTemplate let-row>
        <span class="badge badge-frecuencia" [ngClass]="getFrecuenciaClass(row.frecuencia)">
          {{ getFrecuenciaLabel(row.frecuencia) }}
        </span>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button
            class="btn-icon"
            (click)="viewTemplate(row); $event.stopPropagation()"
            title="Ver Detalles"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
          <button
            class="btn-icon"
            (click)="editTemplate(row); $event.stopPropagation()"
            title="Editar"
          >
            <i class="fa-solid fa-pen"></i>
          </button>
          <button
            class="btn-icon"
            (click)="duplicateTemplate(row); $event.stopPropagation()"
            title="Duplicar"
          >
            <i class="fa-solid fa-copy"></i>
          </button>
          <button
            class="btn-icon btn-danger"
            (click)="deleteTemplate(row); $event.stopPropagation()"
            title="Eliminar"
            *ngIf="!row.activo"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </ng-template>
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

      .item-count {
        display: inline-flex;
        align-items: center;
        gap: var(--s-4);
        font-weight: 600;
        color: var(--primary-800);
      }

      .badge-frecuencia {
        background: var(--primary-100);
        color: var(--primary-800);
      }

      .frecuencia-diario {
        background: var(--error-100);
        color: var(--error-800);
      }

      .frecuencia-semanal {
        background: var(--warning-100);
        color: var(--warning-800);
      }

      .frecuencia-mensual {
        background: var(--info-100);
        color: var(--info-800);
      }

      .frecuencia-antes-uso {
        background: var(--success-100);
        color: var(--success-800);
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        color: var(--grey-500);
        transition: all 0.2s;
      }

      .btn-icon:hover {
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: var(--s-4);
      }

      .btn-icon.btn-danger:hover {
        background: var(--error-100);
        color: var(--error-500);
      }
    `,
  ],
})
export class TemplateListComponent implements OnInit {
  checklistService = inject(ChecklistService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  templates: ChecklistTemplate[] = [];
  loading = false;
  filters = { activo: undefined as boolean | undefined, tipoEquipo: '', search: '' };

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Checklists', url: '/checklists' },
    { label: 'Plantillas' },
  ];

  tabs: TabItem[] = [
    { label: 'Plantillas', route: '/checklists/templates', icon: 'fa-clipboard-list' },
    { label: 'Inspecciones', route: '/checklists/inspections', icon: 'fa-clipboard-check' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por código o nombre...',
    },
    {
      key: 'tipoEquipo',
      label: 'Tipo Equipo',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        { value: 'EXCAVADORA', label: 'Excavadora' },
        { value: 'CARGADOR_FRONTAL', label: 'Cargador Frontal' },
        { value: 'VOLQUETE', label: 'Volquete' },
        { value: 'RETROEXCAVADORA', label: 'Retroexcavadora' },
        { value: 'MOTONIVELADORA', label: 'Motoniveladora' },
        { value: 'RODILLO', label: 'Rodillo' },
        { value: 'CISTERNA', label: 'Cisterna' },
      ],
    },
    {
      key: 'activo',
      label: 'Estado',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        { value: 'true', label: 'Activos' },
        { value: 'false', label: 'Inactivos' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'codigo', label: 'Código', type: 'text' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'tipoEquipo', label: 'Tipo Equipo', type: 'text' },
    { key: 'frecuencia', label: 'Frecuencia', type: 'template' },
    { key: 'itemCount', label: 'Items', type: 'template' },
    {
      key: 'activo',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        true: {
          label: 'Activo',
          class: 'status-badge status-active',
          icon: 'fa-solid fa-check',
        },
        false: {
          label: 'Inactivo',
          class: 'status-badge status-inactive',
          icon: 'fa-solid fa-ban',
        },
      },
    },
  ];

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;
    this.checklistService.getAllTemplates(this.filters).subscribe({
      next: (data) => {
        this.templates = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading templates:', error);
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.filters.search = filters['search'] || '';
    this.filters.tipoEquipo = filters['tipoEquipo'] || '';

    // Convert string to boolean or undefined
    if (filters['activo'] === 'true') {
      this.filters.activo = true;
    } else if (filters['activo'] === 'false') {
      this.filters.activo = false;
    } else {
      this.filters.activo = undefined;
    }

    this.loadTemplates();
  }

  getFrecuenciaLabel(frecuencia: string): string {
    const labels: Record<string, string> = {
      DIARIO: 'Diario',
      SEMANAL: 'Semanal',
      MENSUAL: 'Mensual',
      ANTES_USO: 'Antes de Uso',
    };
    return labels[frecuencia] || frecuencia;
  }

  getFrecuenciaClass(frecuencia: string): string {
    const classes: Record<string, string> = {
      DIARIO: 'frecuencia-diario',
      SEMANAL: 'frecuencia-semanal',
      MENSUAL: 'frecuencia-mensual',
      ANTES_USO: 'frecuencia-antes-uso',
    };
    return classes[frecuencia] || '';
  }

  viewTemplate(template: ChecklistTemplate): void {
    this.router.navigate([template.id], { relativeTo: this.route });
  }

  editTemplate(template: ChecklistTemplate): void {
    this.router.navigate([template.id, 'edit'], { relativeTo: this.route });
  }

  createTemplate(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  duplicateTemplate(template: ChecklistTemplate): void {
    if (confirm(`¿Desea duplicar la plantilla "${template.nombre}"?`)) {
      // Remove id and set new codigo
      const newTemplate = {
        ...template,
        id: undefined,
        codigo: `${template.codigo}-COPY`,
        nombre: `${template.nombre} (Copia)`,
        activo: false,
      };

      this.checklistService.createTemplate(newTemplate).subscribe({
        next: () => {
          this.loadTemplates();
        },
        error: (error) => {
          console.error('Error duplicating template:', error);
          alert('Error al duplicar la plantilla');
        },
      });
    }
  }

  deleteTemplate(template: ChecklistTemplate): void {
    if (confirm(`¿Está seguro de eliminar la plantilla "${template.nombre}"?`)) {
      this.checklistService.deleteTemplate(template.id).subscribe({
        next: () => {
          this.loadTemplates();
        },
        error: (error) => {
          console.error('Error deleting template:', error);
          alert('Error al eliminar la plantilla');
        },
      });
    }
  }
}
