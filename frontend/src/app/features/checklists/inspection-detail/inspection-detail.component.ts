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

@Component({
  selector: 'app-inspection-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageLayoutComponent, StatsGridComponent],
  template: `
    <app-page-layout
      [title]="'Inspección ' + (inspection?.codigo || '')"
      icon="fa-clipboard-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <div class="actions-bar" *ngIf="inspection">
        <button class="btn btn-secondary" (click)="goBack()">
          <i class="fa-solid fa-arrow-left"></i> Volver
        </button>
        <button
          class="btn btn-primary"
          (click)="exportPDF()"
          *ngIf="inspection.estado === 'COMPLETADO'"
        >
          <i class="fa-solid fa-file-pdf"></i> Exportar PDF
        </button>
        <button
          class="btn btn-warning"
          (click)="sendToMaintenance()"
          *ngIf="inspection.requiereMantenimiento && inspection.estado === 'COMPLETADO'"
        >
          <i class="fa-solid fa-wrench"></i> Enviar a Mantenimiento
        </button>
      </div>

      <div class="inspection-content" *ngIf="inspection">
        <!-- Header Card -->
        <div class="info-card header-card">
          <div class="card-header">
            <h2>Información General</h2>
            <div class="header-badges">
              <span class="badge" [ngClass]="getEstadoClass(inspection.estado)">
                {{ getEstadoLabel(inspection.estado) }}
              </span>
              <span
                class="badge"
                [ngClass]="getResultadoClass(inspection.resultadoGeneral)"
                *ngIf="inspection.resultadoGeneral"
              >
                {{ getResultadoLabel(inspection.resultadoGeneral) }}
              </span>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="label">Código:</span>
              <span class="value">{{ inspection.codigo }}</span>
            </div>
            <div class="info-item">
              <span class="label">Fecha:</span>
              <span class="value">{{ inspection.fechaInspeccion | date: 'dd/MM/yyyy' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Equipo:</span>
              <span class="value">{{ inspection.equipo?.codigo || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Inspector:</span>
              <span class="value">
                {{ inspection.trabajador?.nombre }} {{ inspection.trabajador?.apellido }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Ubicación:</span>
              <span class="value">{{ inspection.ubicacion || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Hora Inicio:</span>
              <span class="value">{{ inspection.horaInicio || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Hora Fin:</span>
              <span class="value">{{ inspection.horaFin || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Horómetro:</span>
              <span class="value">{{ inspection.horometroInicial || '-' }}</span>
            </div>
          </div>
        </div>

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
        <div class="info-card results-card">
          <h2>Resultados por Categoría</h2>

          <div *ngFor="let category of getCategories()" class="category-section">
            <div class="category-header">
              <h3>{{ category }}</h3>
              <span class="category-count">
                {{ getResultsByCategory(category).length }} items
              </span>
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
                      <span class="critical-badge" *ngIf="result.item?.esCritico">
                        <i class="fa-solid fa-exclamation-triangle"></i> CRÍTICO
                      </span>
                    </div>
                  </td>
                  <td class="col-status">
                    <span class="status-badge" [ngClass]="getStatusClass(result.conforme)">
                      <i [class]="getStatusIcon(result.conforme)"></i>
                      {{ getStatusLabel(result.conforme) }}
                    </span>
                  </td>
                  <td class="col-value">
                    {{ result.valorMedido || '-' }}
                  </td>
                  <td class="col-action">
                    <span class="action-badge" [ngClass]="getActionClass(result.accionRequerida)">
                      {{ getActionLabel(result.accionRequerida) }}
                    </span>
                  </td>
                  <td class="col-obs">
                    {{ result.observaciones || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- General Observations -->
        <div class="info-card observations-card" *ngIf="inspection.observacionesGenerales">
          <h2>Observaciones Generales</h2>
          <p class="observations-text">{{ inspection.observacionesGenerales }}</p>
        </div>
      </div>

      <div class="no-data" *ngIf="!loading && !inspection">
        <i class="fa-solid fa-exclamation-circle"></i>
        <p>No se encontró la inspección</p>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .actions-bar {
        display: flex;
        gap: var(--s-12);
        margin-bottom: var(--s-24);
        flex-wrap: wrap;
      }

      .btn {
        padding: var(--s-12) var(--s-24);
        border: none;
        border-radius: var(--s-8);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        transition: all 0.2s;
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

      .btn-warning {
        background: var(--warning-500);
        color: var(--neutral-0);
      }

      .btn-warning:hover {
        background: var(--warning-700);
      }

      .info-card {
        background: var(--neutral-0);
        border-radius: var(--s-12);
        padding: var(--s-24);
        margin-bottom: var(--s-24);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-24);
      }

      .card-header h2 {
        margin: 0;
        color: var(--grey-900);
      }

      .header-badges {
        display: flex;
        gap: var(--s-8);
      }

      .badge {
        padding: var(--s-6) var(--s-12);
        border-radius: var(--s-4);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .estado-en-progreso {
        background: var(--info-100);
        color: var(--info-800);
      }

      .estado-completado {
        background: var(--success-100);
        color: var(--success-800);
      }

      .estado-rechazado {
        background: var(--error-100);
        color: var(--error-800);
      }

      .estado-cancelado {
        background: var(--grey-200);
        color: var(--grey-600);
      }

      .resultado-aprobado {
        background: var(--success-100);
        color: var(--success-800);
      }

      .resultado-con-observaciones {
        background: var(--warning-100);
        color: var(--warning-800);
      }

      .resultado-rechazado {
        background: var(--error-100);
        color: var(--error-800);
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
        margin-bottom: var(--s-24);
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

      .category-count {
        background: var(--primary-100);
        color: var(--primary-800);
        padding: var(--s-4) var(--s-12);
        border-radius: var(--s-4);
        font-size: 12px;
        font-weight: 700;
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

      .critical-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--s-4);
        background: var(--error-100);
        color: var(--error-800);
        padding: 2px var(--s-8);
        border-radius: var(--s-4);
        font-size: 10px;
        font-weight: 700;
        width: fit-content;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--s-4);
        padding: var(--s-4) var(--s-8);
        border-radius: var(--s-4);
        font-size: 12px;
        font-weight: 600;
        width: fit-content;
      }

      .status-conforme {
        background: var(--success-100);
        color: var(--success-800);
      }

      .status-no-conforme {
        background: var(--error-100);
        color: var(--error-800);
      }

      .status-na {
        background: var(--grey-200);
        color: var(--grey-700);
      }

      .action-badge {
        display: inline-block;
        padding: var(--s-4) var(--s-8);
        border-radius: var(--s-4);
        font-size: 11px;
        font-weight: 600;
        width: fit-content;
      }

      .action-ninguna {
        background: var(--grey-200);
        color: var(--grey-700);
      }

      .action-observar {
        background: var(--info-100);
        color: var(--info-800);
      }

      .action-reparar {
        background: var(--warning-100);
        color: var(--warning-800);
      }

      .action-reemplazar {
        background: var(--error-100);
        color: var(--error-800);
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

      /* Mobile Responsive */
      @media (max-width: 768px) {
        .result-row {
          grid-template-columns: 1fr;
          gap: var(--s-8);
        }

        .result-row > div {
          display: flex;
          justify-content: space-between;
        }

        .result-row.header-row {
          display: none;
        }

        .result-row > div::before {
          content: attr(class);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 11px;
          color: var(--grey-600);
        }

        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class InspectionDetailComponent implements OnInit {
  checklistService = inject(ChecklistService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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

  getEstadoClass(estado: string): string {
    const classes: Record<string, string> = {
      EN_PROGRESO: 'estado-en-progreso',
      COMPLETADO: 'estado-completado',
      RECHAZADO: 'estado-rechazado',
      CANCELADO: 'estado-cancelado',
    };
    return classes[estado] || '';
  }

  getResultadoLabel(resultado: string): string {
    const labels: Record<string, string> = {
      APROBADO: 'Aprobado',
      APROBADO_CON_OBSERVACIONES: 'Con Observaciones',
      RECHAZADO: 'Rechazado',
    };
    return labels[resultado] || resultado;
  }

  getResultadoClass(resultado: string): string {
    const classes: Record<string, string> = {
      APROBADO: 'resultado-aprobado',
      APROBADO_CON_OBSERVACIONES: 'resultado-con-observaciones',
      RECHAZADO: 'resultado-rechazado',
    };
    return classes[resultado] || '';
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

  getStatusClass(conforme: boolean | null | undefined): string {
    if (conforme === true) return 'status-conforme';
    if (conforme === false) return 'status-no-conforme';
    return 'status-na';
  }

  getStatusIcon(conforme: boolean | null | undefined): string {
    if (conforme === true) return 'fa-solid fa-check-circle';
    if (conforme === false) return 'fa-solid fa-times-circle';
    return 'fa-solid fa-minus-circle';
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

  getActionClass(action: string | undefined): string {
    if (!action) return '';
    const classes: Record<string, string> = {
      NINGUNA: 'action-ninguna',
      OBSERVAR: 'action-observar',
      REPARAR: 'action-reparar',
      REEMPLAZAR: 'action-reemplazar',
    };
    return classes[action] || '';
  }

  goBack(): void {
    this.router.navigate(['/checklists/inspections']);
  }

  exportPDF(): void {
    if (!this.inspection) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('No se encontró token de autenticación');
      return;
    }

    // Create URL for PDF export
    const url = `${this.checklistService['apiUrl']}/inspections/${this.inspection.id}/export-pdf`;

    // Fetch and download PDF
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
        // Create a temporary URL for the blob and trigger download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `inspeccion-${this.inspection?.codigo}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error('Error exporting PDF:', error);
        alert('Error al exportar el PDF. Por favor intente nuevamente.');
      });
  }

  sendToMaintenance(): void {
    console.log('Send to maintenance:', this.inspection?.id);
    alert('Función para enviar a mantenimiento en desarrollo');
  }
}
