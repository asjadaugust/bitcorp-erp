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
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import {
  AeroBadgeComponent,
  BadgeVariant,
} from '../../../core/design-system/badge/aero-badge.component';
import { ConfirmService } from '../../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ButtonComponent,
    PageCardComponent,
    AeroBadgeComponent,
  ],
  template: `
    <app-page-layout
      title="Plantillas de Checklist"
      icon="fa-clipboard-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <div actions>
        <app-button
          variant="primary"
          icon="fa-plus"
          label="Nueva Plantilla"
          (clicked)="createTemplate()"
        ></app-button>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
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
      </app-page-card>

      <!-- Custom Templates -->
      <ng-template #itemCountTemplate let-row>
        <span class="item-count">
          <i class="fa-solid fa-list-check"></i>
          {{ row.items?.length || 0 }} items
        </span>
      </ng-template>

      <ng-template #frecuenciaTemplate let-row>
        <aero-badge [variant]="getFrecuenciaBadgeVariant(row.frecuencia)">
          {{ getFrecuenciaLabel(row.frecuencia) }}
        </aero-badge>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <app-button
            variant="icon"
            size="sm"
            icon="fa-eye"
            (clicked)="viewTemplate(row); $event.stopPropagation()"
          ></app-button>
          <app-button
            variant="icon"
            size="sm"
            icon="fa-pen"
            (clicked)="editTemplate(row); $event.stopPropagation()"
          ></app-button>
          <app-button
            variant="icon"
            size="sm"
            icon="fa-copy"
            (clicked)="duplicateTemplate(row); $event.stopPropagation()"
          ></app-button>
          <app-button
            variant="icon"
            size="sm"
            icon="fa-trash"
            (clicked)="deleteTemplate(row); $event.stopPropagation()"
            *ngIf="!row.activo"
          ></app-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .item-count {
        display: inline-flex;
        align-items: center;
        gap: var(--s-4);
        font-weight: 600;
        color: var(--primary-800);
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ],
})
export class TemplateListComponent implements OnInit {
  private checklistService = inject(ChecklistService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

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

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.tipoEquipo = (filters['tipoEquipo'] as string) || '';

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

  getFrecuenciaBadgeVariant(frecuencia: string): BadgeVariant {
    const variants: Record<string, BadgeVariant> = {
      DIARIO: 'error',
      SEMANAL: 'warning',
      MENSUAL: 'info',
      ANTES_USO: 'success',
    };
    return variants[frecuencia] || 'neutral';
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
    this.confirmSvc
      .confirmDelete(`duplicar la plantilla "${template.nombre}"`)
      .subscribe((confirmed) => {
        if (confirmed) {
          const newTemplate = {
            ...template,
            id: undefined,
            codigo: `${template.codigo}-COPY`,
            nombre: `${template.nombre} (Copia)`,
            activo: false,
          };

          this.checklistService.createTemplate(newTemplate).subscribe({
            next: () => {
              this.snackBar.open('Plantilla duplicada correctamente', 'Cerrar', {
                duration: 3000,
              });
              this.loadTemplates();
            },
            error: (error) => {
              console.error('Error duplicating template:', error);
              this.snackBar.open('Error al duplicar la plantilla', 'Cerrar', { duration: 3000 });
            },
          });
        }
      });
  }

  deleteTemplate(template: ChecklistTemplate): void {
    this.confirmSvc.confirmDelete(`la plantilla "${template.nombre}"`).subscribe((confirmed) => {
      if (confirmed) {
        this.checklistService.deleteTemplate(template.id).subscribe({
          next: () => {
            this.snackBar.open('Plantilla eliminada correctamente', 'Cerrar', {
              duration: 3000,
            });
            this.loadTemplates();
          },
          error: (error) => {
            console.error('Error deleting template:', error);
            this.snackBar.open('Error al eliminar la plantilla', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }
}
