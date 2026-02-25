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

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageLayoutComponent, StatsGridComponent],
  template: `
    <app-page-layout
      [title]="'Plantilla: ' + (template?.nombre || '')"
      icon="fa-clipboard-list"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <div class="actions-bar" *ngIf="template">
        <button class="btn btn-secondary" (click)="goBack()">
          <i class="fa-solid fa-arrow-left"></i> Volver
        </button>
        <button class="btn btn-primary" (click)="editTemplate()">
          <i class="fa-solid fa-pen"></i> Editar
        </button>
        <button class="btn btn-info" (click)="duplicateTemplate()">
          <i class="fa-solid fa-copy"></i> Duplicar
        </button>
        <button class="btn btn-danger" (click)="deleteTemplate()" *ngIf="!template.activo">
          <i class="fa-solid fa-trash"></i> Eliminar
        </button>
      </div>

      <div class="template-content" *ngIf="template">
        <!-- Header Card -->
        <div class="info-card header-card">
          <div class="card-header">
            <h2>Información General</h2>
            <span
              class="badge"
              [class.badge-active]="template.activo"
              [class.badge-inactive]="!template.activo"
            >
              {{ template.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="label">Código:</span>
              <span class="value">{{ template.codigo }}</span>
            </div>
            <div class="info-item">
              <span class="label">Nombre:</span>
              <span class="value">{{ template.nombre }}</span>
            </div>
            <div class="info-item">
              <span class="label">Tipo Equipo:</span>
              <span class="value">{{ template.tipoEquipo || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Frecuencia:</span>
              <span
                class="badge badge-frecuencia"
                [ngClass]="getFrecuenciaClass(template.frecuencia)"
              >
                {{ getFrecuenciaLabel(template.frecuencia) }}
              </span>
            </div>
            <div class="info-item full-width" *ngIf="template.descripcion">
              <span class="label">Descripción:</span>
              <span class="value">{{ template.descripcion }}</span>
            </div>
          </div>
        </div>

        <!-- Statistics Section -->
        <div class="stats-section" *ngIf="template">
          <h2>Estadísticas</h2>
          <app-stats-grid [items]="statItems" testId="template-stats"></app-stats-grid>
        </div>

        <!-- Items Card -->
        <div class="info-card items-card">
          <div class="card-header">
            <h2>Items de Checklist</h2>
            <span class="item-count">{{ template.items?.length || 0 }} items</span>
          </div>

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
                    <span class="badge badge-tipo">
                      <i [class]="getTipoIcon(item.tipoVerificacion)"></i>
                      {{ getTipoLabel(item.tipoVerificacion) }}
                    </span>
                    <span class="badge badge-critical" *ngIf="item.esCritico">
                      <i class="fa-solid fa-exclamation-triangle"></i> Crítico
                    </span>
                    <span class="badge badge-photo" *ngIf="item.requiereFoto">
                      <i class="fa-solid fa-camera"></i> Foto
                    </span>
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
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .actions-bar {
        display: flex;
        gap: var(--s-8);
        margin-bottom: var(--s-16);
        flex-wrap: wrap;
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

      .btn-secondary {
        background: var(--grey-200);
        color: var(--grey-800);
      }
      .btn-secondary:hover {
        background: var(--grey-300);
      }

      .btn-info {
        background: var(--info-500);
        color: var(--neutral-0);
      }
      .btn-info:hover {
        background: var(--info-800);
      }

      .btn-danger {
        background: var(--error-500);
        color: var(--neutral-0);
      }
      .btn-danger:hover {
        background: var(--error-800);
      }

      .template-content {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);
      }

      .info-card {
        background: var(--neutral-0);
        border-radius: var(--s-12);
        padding: var(--s-24);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-16);
        padding-bottom: var(--s-16);
        border-bottom: 1px solid var(--grey-200);
      }

      .card-header h2 {
        margin: 0;
        font-size: var(--type-h3-size);
        font-weight: 700;
        color: var(--grey-900);
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
        font-size: var(--type-bodySmall-size);
        color: var(--grey-600);
        font-weight: 600;
      }

      .info-item .value {
        font-size: var(--type-body-size);
        color: var(--grey-900);
      }

      .badge {
        padding: var(--s-4) var(--s-8);
        border-radius: var(--s-4);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        display: inline-block;
      }

      .badge-active {
        background: var(--success-100);
        color: var(--success-800);
      }

      .badge-inactive {
        background: var(--grey-200);
        color: var(--grey-600);
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

      .stats-section h2 {
        margin-bottom: var(--s-16);
        font-size: var(--type-h3-size);
        font-weight: 700;
        color: var(--grey-900);
      }

      .item-count {
        font-size: var(--type-bodySmall-size);
        color: var(--grey-600);
        font-weight: 600;
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
        background: var(--neutral-0);
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

      .badge-tipo {
        background: var(--primary-100);
        color: var(--primary-800);
      }

      .badge-critical {
        background: var(--error-100);
        color: var(--error-800);
      }

      .badge-photo {
        background: var(--info-100);
        color: var(--info-800);
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
  checklistService = inject(ChecklistService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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
        alert('Error al cargar la plantilla');
        this.goBack();
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

  getFrecuenciaClass(frecuencia?: string): string {
    if (!frecuencia) return '';
    const classes: Record<string, string> = {
      DIARIO: 'frecuencia-diario',
      SEMANAL: 'frecuencia-semanal',
      MENSUAL: 'frecuencia-mensual',
      ANTES_USO: 'frecuencia-antes-uso',
    };
    return classes[frecuencia] || '';
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

  goBack(): void {
    this.router.navigate(['/checklists/templates']);
  }

  editTemplate(): void {
    if (this.template) {
      this.router.navigate(['edit'], { relativeTo: this.route });
    }
  }

  duplicateTemplate(): void {
    if (!this.template) return;

    if (confirm(`¿Desea duplicar la plantilla "${this.template.nombre}"?`)) {
      const newTemplate = {
        ...this.template,
        id: undefined as unknown,
        codigo: `${this.template.codigo}-COPY`,
        nombre: `${this.template.nombre} (Copia)`,
        activo: false,
      };

      this.checklistService.createTemplate(newTemplate).subscribe({
        next: () => {
          alert('Plantilla duplicada exitosamente');
          this.router.navigate(['/checklists/templates']);
        },
        error: (error) => {
          console.error('Error duplicating template:', error);
          alert('Error al duplicar la plantilla');
        },
      });
    }
  }

  deleteTemplate(): void {
    if (!this.template) return;

    if (confirm(`¿Está seguro de eliminar la plantilla "${this.template.nombre}"?`)) {
      this.checklistService.deleteTemplate(this.template.id).subscribe({
        next: () => {
          alert('Plantilla eliminada exitosamente');
          this.router.navigate(['/checklists/templates']);
        },
        error: (error) => {
          console.error('Error deleting template:', error);
          alert('Error al eliminar la plantilla');
        },
      });
    }
  }
}
