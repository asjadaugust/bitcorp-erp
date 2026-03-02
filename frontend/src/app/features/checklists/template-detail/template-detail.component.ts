import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ChecklistService } from '../../../core/services/checklist.service';
import { ChecklistTemplate } from '../../../core/models/checklist.model';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../../shared/components/stats-grid/stats-grid.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import {
  AeroBadgeComponent,
  BadgeVariant,
} from '../../../core/design-system/badge/aero-badge.component';
import { ConfirmService } from '../../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AeroButtonComponent } from '../../../core/design-system';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageLayoutComponent,
    StatsGridComponent,
    AeroButtonComponent,
    PageCardComponent,
    AeroBadgeComponent,
  ],
  template: `
    <app-page-layout
      [title]="'Plantilla: ' + (template?.nombre || '')"
      icon="fa-clipboard-list"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      backUrl="/checklists/templates"
    >
      <div actions class="action-buttons-header" *ngIf="template">
        <aero-button variant="primary" iconLeft="fa-pen" (clicked)="editTemplate()"
          >Editar</aero-button
        >
        <aero-button variant="secondary" iconLeft="fa-copy" (clicked)="duplicateTemplate()"
          >Duplicar</aero-button
        >
        <aero-button
          variant="secondary"
          iconLeft="fa-trash"
          (clicked)="deleteTemplate()"
          *ngIf="!template.activo"
          >Eliminar</aero-button
        >
      </div>

      <div class="template-content" *ngIf="template">
        <!-- Header Card -->
        <app-page-card title="Información General">
          <div header-actions>
            <aero-badge [variant]="template.activo ? 'success' : 'neutral'">
              {{ template.activo ? 'Activo' : 'Inactivo' }}
            </aero-badge>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="label">Código</span>
              <span class="value">{{ template.codigo }}</span>
            </div>
            <div class="info-item">
              <span class="label">Nombre</span>
              <span class="value">{{ template.nombre }}</span>
            </div>
            <div class="info-item">
              <span class="label">Tipo Equipo</span>
              <span class="value">{{ template.tipoEquipo || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Frecuencia</span>
              <aero-badge [variant]="getFrecuenciaBadgeVariant(template.frecuencia)">
                {{ getFrecuenciaLabel(template.frecuencia) }}
              </aero-badge>
            </div>
            <div class="info-item full-width" *ngIf="template.descripcion">
              <span class="label">Descripción</span>
              <span class="value">{{ template.descripcion }}</span>
            </div>
          </div>
        </app-page-card>

        <!-- Statistics Section -->
        <div class="stats-section" *ngIf="template">
          <h2>Estadísticas</h2>
          <app-stats-grid [items]="statItems" testId="template-stats"></app-stats-grid>
        </div>

        <!-- Items Card -->
        <app-page-card
          title="Items de Checklist"
          [subtitle]="(template.items?.length || 0) + ' items'"
        >
          <div class="items-list" *ngIf="template.items && template.items.length > 0">
            <div
              class="item-row"
              *ngFor="let item of getGroupedItems()"
              [class.category-row]="item.isCategory"
            >
              <!-- Category Header -->
              <div class="category-header" *ngIf="item.isCategory">
                <i class="fa-solid fa-folder"></i>
                <span class="category-name">{{ item.categoria }}</span>
              </div>

              <!-- Item Details -->
              <div class="item-details" *ngIf="!item.isCategory">
                <div class="item-header">
                  <span class="item-orden">#{{ item.orden }}</span>
                  <span class="item-descripcion">{{ item.descripcion }}</span>
                  <div class="item-badges">
                    <aero-badge variant="primary">
                      <i [class]="getTipoIcon(item.tipoVerificacion)"></i>
                      {{ getTipoLabel(item.tipoVerificacion) }}
                    </aero-badge>
                    <aero-badge variant="error" *ngIf="item.esCritico"> Crítico </aero-badge>
                    <aero-badge variant="info" *ngIf="item.requiereFoto"> Foto </aero-badge>
                  </div>
                </div>
                <div class="item-body" *ngIf="item.valorEsperado || item.instrucciones">
                  <div class="item-info" *ngIf="item.valorEsperado">
                    <strong>Valor Esperado:</strong> {{ item.valorEsperado }}
                  </div>
                  <div class="item-info" *ngIf="item.instrucciones">
                    <strong>Instrucciones:</strong> {{ item.instrucciones }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="empty-state" *ngIf="!template.items || template.items.length === 0">
            <i class="fa-solid fa-inbox"></i>
            <p>No hay items configurados en esta plantilla</p>
          </div>
        </app-page-card>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .action-buttons-header {
        display: flex;
        gap: var(--s-12);
        align-items: center;
      }

      .template-content {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--s-16);
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
      }

      .info-item.full-width {
        grid-column: 1 / -1;
      }

      .info-item .label {
        font-size: 12px;
        color: var(--grey-600);
        font-weight: 600;
        text-transform: uppercase;
      }

      .info-item .value {
        font-size: 16px;
        color: var(--grey-900);
      }

      .stats-section h2 {
        margin-bottom: var(--s-16);
        font-size: var(--type-h3-size);
        font-weight: 700;
        color: var(--grey-900);
      }

      .items-list {
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
      }

      .item-row {
        border-radius: var(--s-8);
      }

      .category-row {
        background: var(--grey-100);
        padding: var(--s-12);
      }

      .category-header {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        font-weight: 700;
        color: var(--grey-900);
        font-size: var(--type-body-size);
      }

      .category-name {
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .item-details {
        padding: var(--s-12);
        border: 1px solid var(--grey-200);
        border-radius: var(--s-8);
        background: var(--grey-100);
      }

      .item-header {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        margin-bottom: var(--s-8);
      }

      .item-orden {
        font-weight: 700;
        color: var(--primary-500);
        font-size: var(--type-bodySmall-size);
        min-width: 30px;
      }

      .item-descripcion {
        flex: 1;
        font-weight: 600;
        color: var(--grey-900);
      }

      .item-badges {
        display: flex;
        gap: var(--s-4);
        flex-wrap: wrap;
      }

      .item-body {
        padding-left: 42px;
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
      }

      .item-info {
        font-size: var(--type-bodySmall-size);
        color: var(--grey-700);
      }

      .item-info strong {
        color: var(--grey-900);
      }

      .empty-state {
        text-align: center;
        padding: var(--s-48) var(--s-24);
        color: var(--grey-500);
      }

      .empty-state i {
        font-size: 48px;
        margin-bottom: var(--s-16);
        opacity: 0.5;
      }

      .empty-state p {
        margin: 0;
        font-size: var(--type-body-size);
      }
    `,
  ],
})
export class TemplateDetailComponent implements OnInit {
  private checklistService = inject(ChecklistService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  template: ChecklistTemplate | null = null;
  loading = false;
  statItems: StatItem[] = [];

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Checklists', url: '/checklists' },
    { label: 'Plantillas', url: '/checklists/templates' },
    { label: 'Detalle' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTemplate(+id);
    }
  }

  loadTemplate(id: number): void {
    this.loading = true;
    this.checklistService.getTemplateById(id).subscribe({
      next: (data) => {
        this.template = data;
        this.calculateStatItems();
        this.loading = false;
        this.breadcrumbs[this.breadcrumbs.length - 1].label = data.nombre;
      },
      error: (error) => {
        console.error('Error loading template:', error);
        this.loading = false;
        this.snackBar.open('Error al cargar la plantilla', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/checklists/templates']);
      },
    });
  }

  calculateStatItems(): void {
    if (!this.template) return;

    this.statItems = [
      {
        label: 'Total Items',
        value: this.template.items?.length || 0,
        icon: 'fa-list-check',
        color: 'primary',
        testId: 'total-items',
      },
      {
        label: 'Items Críticos',
        value: this.getCriticalCount(),
        icon: 'fa-triangle-exclamation',
        color: 'danger',
        testId: 'critical-items',
      },
      {
        label: 'Requieren Foto',
        value: this.getPhotoRequiredCount(),
        icon: 'fa-camera',
        color: 'info',
        testId: 'photo-items',
      },
    ];
  }

  getFrecuenciaLabel(frecuencia?: string): string {
    if (!frecuencia) return '-';
    const labels: Record<string, string> = {
      DIARIO: 'Diario',
      SEMANAL: 'Semanal',
      MENSUAL: 'Mensual',
      ANTES_USO: 'Antes de Uso',
    };
    return labels[frecuencia] || frecuencia;
  }

  getFrecuenciaBadgeVariant(frecuencia?: string): BadgeVariant {
    if (!frecuencia) return 'neutral';
    const variants: Record<string, BadgeVariant> = {
      DIARIO: 'error',
      SEMANAL: 'warning',
      MENSUAL: 'info',
      ANTES_USO: 'success',
    };
    return variants[frecuencia] || 'neutral';
  }

  getCriticalCount(): number {
    return this.template?.items?.filter((item) => item.esCritico).length || 0;
  }

  getPhotoRequiredCount(): number {
    return this.template?.items?.filter((item) => item.requiereFoto).length || 0;
  }

  getGroupedItems(): Record<string, unknown>[] {
    if (!this.template?.items) return [];

    const grouped: Record<string, unknown>[] = [];
    let currentCategory = '';

    this.template.items
      .sort((a, b) => a.orden - b.orden)
      .forEach((item) => {
        if (item.categoria && item.categoria !== currentCategory) {
          currentCategory = item.categoria;
          grouped.push({
            isCategory: true,
            categoria: currentCategory,
          });
        }
        grouped.push({
          ...item,
          isCategory: false,
        });
      });

    return grouped;
  }

  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      VISUAL: 'Visual',
      MEDICION: 'Medición',
      FUNCIONAL: 'Funcional',
      AUDITIVO: 'Auditivo',
    };
    return labels[tipo] || tipo;
  }

  getTipoIcon(tipo: string): string {
    const icons: Record<string, string> = {
      VISUAL: 'fa-solid fa-eye',
      MEDICION: 'fa-solid fa-ruler',
      FUNCIONAL: 'fa-solid fa-gear',
      AUDITIVO: 'fa-solid fa-ear-listen',
    };
    return icons[tipo] || 'fa-solid fa-check';
  }

  editTemplate(): void {
    if (this.template) {
      this.router.navigate(['edit'], { relativeTo: this.route });
    }
  }

  duplicateTemplate(): void {
    if (!this.template) return;

    this.confirmSvc
      .confirmDelete(`duplicar la plantilla "${this.template.nombre}"`)
      .subscribe((confirmed) => {
        if (confirmed) {
          const newTemplate = {
            ...this.template!,
            id: undefined as unknown,
            codigo: `${this.template!.codigo}-COPY`,
            nombre: `${this.template!.nombre} (Copia)`,
            activo: false,
          };

          this.checklistService.createTemplate(newTemplate as any).subscribe({
            next: () => {
              this.snackBar.open('Plantilla duplicada correctamente', 'Cerrar', {
                duration: 3000,
              });
              this.router.navigate(['/checklists/templates']);
            },
            error: (error) => {
              console.error('Error duplicating template:', error);
              this.snackBar.open('Error al duplicar la plantilla', 'Cerrar', { duration: 3000 });
            },
          });
        }
      });
  }

  deleteTemplate(): void {
    if (!this.template) return;

    this.confirmSvc
      .confirmDelete(`la plantilla "${this.template.nombre}"`)
      .subscribe((confirmed) => {
        if (confirmed) {
          this.checklistService.deleteTemplate(this.template!.id).subscribe({
            next: () => {
              this.snackBar.open('Plantilla eliminada correctamente', 'Cerrar', {
                duration: 3000,
              });
              this.router.navigate(['/checklists/templates']);
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
