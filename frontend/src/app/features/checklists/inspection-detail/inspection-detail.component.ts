import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ChecklistService } from '../../../core/services/checklist.service';
import { InspectionWithResults } from '../../../core/models/checklist.model';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../../shared/components/stats-grid/stats-grid.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import {
  AeroBadgeComponent,
  BadgeVariant,
} from '../../../core/design-system/badge/aero-badge.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-inspection-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageLayoutComponent,
    StatsGridComponent,
    ButtonComponent,
    PageCardComponent,
    AeroBadgeComponent,
  ],
  template: `
    <app-page-layout
      [title]="'Inspección ' + (inspection?.codigo || '')"
      icon="fa-clipboard-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      backUrl="/checklists/inspections"
    >
      <div actions class="action-buttons-header" *ngIf="inspection">
        <app-button
          variant="primary"
          icon="fa-file-pdf"
          label="Exportar PDF"
          (clicked)="exportPDF()"
          *ngIf="inspection.estado === 'COMPLETADO'"
        ></app-button>
        <app-button
          variant="secondary"
          icon="fa-wrench"
          label="Enviar a Mantenimiento"
          (clicked)="sendToMaintenance()"
          *ngIf="inspection.requiereMantenimiento && inspection.estado === 'COMPLETADO'"
        ></app-button>
      </div>

      <div class="inspection-content" *ngIf="inspection">
        <!-- Header Card -->
        <app-page-card title="Información General">
          <div header-actions class="header-badges">
            <aero-badge [variant]="getEstadoBadgeVariant(inspection.estado)">
              {{ getEstadoLabel(inspection.estado) }}
            </aero-badge>
            <aero-badge
              [variant]="getResultadoBadgeVariant(inspection.resultadoGeneral)"
              *ngIf="inspection.resultadoGeneral"
            >
              {{ getResultadoLabel(inspection.resultadoGeneral) }}
            </aero-badge>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="label">Código</span>
              <span class="value">{{ inspection.codigo }}</span>
            </div>
            <div class="info-item">
              <span class="label">Fecha</span>
              <span class="value">{{ inspection.fechaInspeccion | date: 'dd/MM/yyyy' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Equipo</span>
              <span class="value">{{ inspection.equipo?.codigo || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Inspector</span>
              <span class="value">
                {{ inspection.trabajador?.nombre }} {{ inspection.trabajador?.apellido }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Ubicación</span>
              <span class="value">{{ inspection.ubicacion || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Hora Inicio</span>
              <span class="value">{{ inspection.horaInicio || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Hora Fin</span>
              <span class="value">{{ inspection.horaFin || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Horómetro</span>
              <span class="value">{{ inspection.horometroInicial || '-' }}</span>
            </div>
          </div>
        </app-page-card>

        <!-- Statistics Section -->
        <div class="stats-section" *ngIf="inspection">
          <h2>Estadísticas</h2>
          <app-stats-grid [items]="statItems" testId="inspection-stats"></app-stats-grid>
        </div>

        <!-- Warnings -->
        <div class="warning-card critical" *ngIf="!inspection.equipoOperativo">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <div>
            <strong>EQUIPO NO OPERATIVO</strong>
            <p>
              Se detectaron fallas en items críticos. El equipo no debe ser utilizado hasta su
              reparación.
            </p>
          </div>
        </div>

        <div class="warning-card maintenance" *ngIf="inspection.requiereMantenimiento">
          <i class="fa-solid fa-wrench"></i>
          <div>
            <strong>REQUIERE MANTENIMIENTO</strong>
            <p>Este equipo requiere mantenimiento preventivo o correctivo.</p>
          </div>
        </div>

        <!-- Results by Category -->
        <app-page-card title="Resultados por Categoría">
          <div *ngFor="let category of getCategories()" class="category-section">
            <div class="category-header">
              <h3>{{ category }}</h3>
              <aero-badge variant="info">
                {{ getResultsByCategory(category).length }} items
              </aero-badge>
            </div>

            <table class="results-table">
              <thead>
                <tr>
                  <th class="col-description">Descripción</th>
                  <th class="col-status">Estado</th>
                  <th class="col-value">Valor</th>
                  <th class="col-action">Acción</th>
                  <th class="col-obs">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let result of getResultsByCategory(category)"
                  [class.critical-fail]="result.item?.esCritico && result.conforme === false"
                >
                  <td class="col-description">
                    <div class="description-content">
                      {{ result.item?.descripcion }}
                      <aero-badge variant="error" *ngIf="result.item?.esCritico">
                        CRÍTICO
                      </aero-badge>
                    </div>
                  </td>
                  <td class="col-status">
                    <aero-badge [variant]="getStatusBadgeVariant(result.conforme)">
                      {{ getStatusLabel(result.conforme) }}
                    </aero-badge>
                  </td>
                  <td class="col-value">
                    {{ result.valorMedido || '-' }}
                  </td>
                  <td class="col-action">
                    <aero-badge [variant]="getActionBadgeVariant(result.accionRequerida)">
                      {{ getActionLabel(result.accionRequerida) }}
                    </aero-badge>
                  </td>
                  <td class="col-obs">
                    {{ result.observaciones || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </app-page-card>

        <!-- General Observations -->
        <app-page-card title="Observaciones Generales" *ngIf="inspection.observacionesGenerales">
          <p class="observations-text">{{ inspection.observacionesGenerales }}</p>
        </app-page-card>
      </div>

      <div class="no-data" *ngIf="!loading && !inspection">
        <i class="fa-solid fa-exclamation-circle"></i>
        <p>No se encontró la inspección</p>
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

      .inspection-content {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);
      }

      .header-badges {
        display: flex;
        gap: var(--s-8);
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

      .info-item .label {
        font-size: 12px;
        color: var(--grey-600);
        font-weight: 600;
        text-transform: uppercase;
      }

      .info-item .value {
        font-size: 16px;
        color: var(--grey-900);
        font-weight: 600;
      }

      .stats-section h2 {
        margin-bottom: var(--s-16);
        font-size: var(--type-h3-size);
        font-weight: 700;
        color: var(--grey-900);
      }

      .warning-card {
        display: flex;
        align-items: flex-start;
        gap: var(--s-16);
        padding: var(--s-20);
        border-radius: var(--s-8);
        border-left: 4px solid;
      }

      .warning-card i {
        font-size: 24px;
      }

      .warning-card.critical {
        background: var(--error-50);
        border-color: var(--error-500);
        color: var(--error-800);
      }

      .warning-card.maintenance {
        background: var(--warning-50);
        border-color: var(--warning-500);
        color: var(--warning-800);
      }

      .warning-card strong {
        display: block;
        margin-bottom: var(--s-8);
        font-size: 16px;
      }

      .warning-card p {
        margin: 0;
        font-size: 14px;
      }

      .category-section {
        margin-bottom: var(--s-32);
      }

      .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-16);
        padding-bottom: var(--s-12);
        border-bottom: 2px solid var(--primary-500);
      }

      .category-header h3 {
        margin: 0;
        color: var(--primary-800);
        font-size: 18px;
      }

      .results-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }

      .results-table th {
        background: var(--grey-100);
        font-weight: 700;
        font-size: 12px;
        text-transform: uppercase;
        color: var(--grey-700);
        padding: var(--s-12);
        text-align: left;
        border-bottom: 2px solid var(--grey-200);
      }

      .results-table td {
        padding: var(--s-12);
        border-bottom: 1px solid var(--grey-200);
        vertical-align: top;
      }

      .results-table tr:hover {
        background-color: var(--grey-50);
      }

      .results-table tr.critical-fail {
        background-color: var(--error-50);
      }

      .results-table tr.critical-fail td {
        border-color: var(--error-200);
      }

      .col-description {
        width: 30%;
      }
      .col-status {
        width: 15%;
      }
      .col-value {
        width: 15%;
      }
      .col-action {
        width: 15%;
      }
      .col-obs {
        width: 25%;
      }

      .description-content {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
        font-weight: 500;
      }

      .observations-text {
        line-height: 1.6;
        color: var(--grey-700);
        white-space: pre-wrap;
      }

      .no-data {
        text-align: center;
        padding: var(--s-48);
        color: var(--grey-500);
      }

      .no-data i {
        font-size: 48px;
        margin-bottom: var(--s-16);
      }
    `,
  ],
})
export class InspectionDetailComponent implements OnInit {
  private checklistService = inject(ChecklistService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  inspection: InspectionWithResults | null = null;
  loading = false;
  statItems: StatItem[] = [];

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Listas de Verificación', url: '/checklists' },
    { label: 'Inspecciones', url: '/checklists/inspections' },
    { label: 'Detalle' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInspection(Number(id));
    }
  }

  loadInspection(id: number): void {
    this.loading = true;
    this.checklistService.getInspectionWithResults(id).subscribe({
      next: (data) => {
        this.inspection = data;
        this.calculateStatItems();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading inspection:', error);
        this.loading = false;
      },
    });
  }

  calculateStatItems(): void {
    if (!this.inspection) return;

    this.statItems = [
      {
        label: 'Total Items',
        value: this.inspection.itemsTotal || 0,
        icon: 'fa-list',
        color: 'primary',
        testId: 'total-items',
      },
      {
        label: 'Conformes',
        value: this.inspection.itemsConforme || 0,
        icon: 'fa-check-circle',
        color: 'success',
        testId: 'conforming-items',
      },
      {
        label: 'No Conformes',
        value: this.inspection.itemsNoConforme || 0,
        icon: 'fa-times-circle',
        color: 'danger',
        testId: 'non-conforming-items',
      },
      {
        label: 'Tasa Aprobación',
        value: `${this.getApprovalRate()}%`,
        icon: 'fa-chart-line',
        color: 'info',
        testId: 'approval-rate',
      },
    ];
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      EN_PROGRESO: 'En Progreso',
      COMPLETADO: 'Completado',
      RECHAZADO: 'Rechazado',
      CANCELADO: 'Cancelado',
    };
    return labels[estado] || estado;
  }

  getEstadoBadgeVariant(estado: string): BadgeVariant {
    const variants: Record<string, BadgeVariant> = {
      EN_PROGRESO: 'info',
      COMPLETADO: 'success',
      RECHAZADO: 'error',
      CANCELADO: 'neutral',
    };
    return variants[estado] || 'neutral';
  }

  getResultadoLabel(resultado: string): string {
    const labels: Record<string, string> = {
      APROBADO: 'Aprobado',
      APROBADO_CON_OBSERVACIONES: 'Con Observaciones',
      RECHAZADO: 'Rechazado',
    };
    return labels[resultado] || resultado;
  }

  getResultadoBadgeVariant(resultado: string): BadgeVariant {
    const variants: Record<string, BadgeVariant> = {
      APROBADO: 'success',
      APROBADO_CON_OBSERVACIONES: 'warning',
      RECHAZADO: 'error',
    };
    return variants[resultado] || 'neutral';
  }

  getApprovalRate(): number {
    if (!this.inspection || !this.inspection.itemsTotal) return 0;
    return Math.round(((this.inspection.itemsConforme || 0) / this.inspection.itemsTotal) * 100);
  }

  getCategories(): string[] {
    if (!this.inspection?.resultados) return [];
    const categories = new Set<string>();
    this.inspection.resultados.forEach((result) => {
      if (result.item?.categoria) {
        categories.add(result.item.categoria);
      }
    });
    return Array.from(categories).sort();
  }

  getResultsByCategory(category: string) {
    if (!this.inspection?.resultados) return [];
    return this.inspection.resultados.filter((result) => result.item?.categoria === category);
  }

  getStatusLabel(conforme: boolean | null | undefined): string {
    if (conforme === true) return 'Conforme';
    if (conforme === false) return 'No Conforme';
    return 'N/A';
  }

  getStatusBadgeVariant(conforme: boolean | null | undefined): BadgeVariant {
    if (conforme === true) return 'success';
    if (conforme === false) return 'error';
    return 'neutral';
  }

  getActionLabel(action: string | undefined): string {
    const labels: Record<string, string> = {
      NINGUNA: 'Ninguna',
      OBSERVAR: 'Observar',
      REPARAR: 'Reparar',
      REEMPLAZAR: 'Reemplazar',
    };
    return action ? labels[action] || action : '-';
  }

  getActionBadgeVariant(action: string | undefined): BadgeVariant {
    if (!action) return 'neutral';
    const variants: Record<string, BadgeVariant> = {
      NINGUNA: 'neutral',
      OBSERVAR: 'info',
      REPARAR: 'warning',
      REEMPLAZAR: 'error',
    };
    return variants[action] || 'neutral';
  }

  exportPDF(): void {
    if (!this.inspection) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      this.snackBar.open('No se encontró token de autenticación', 'Cerrar', { duration: 3000 });
      return;
    }

    const url = `${this.checklistService['apiUrl']}/inspections/${this.inspection.id}/export-pdf`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al generar el PDF');
        }
        return response.blob();
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `inspeccion-${this.inspection?.codigo}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error('Error exporting PDF:', error);
        this.snackBar.open('Error al exportar el PDF', 'Cerrar', { duration: 3000 });
      });
  }

  sendToMaintenance(): void {
    this.snackBar.open('Función para enviar a mantenimiento en desarrollo', 'Cerrar', {
      duration: 3000,
    });
  }
}
