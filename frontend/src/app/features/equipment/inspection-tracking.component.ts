import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  DailyReportService,
  EquipmentInspectionTracking,
  InspectionObservacion,
} from '../../core/services/daily-report.service';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { AeroBadgeComponent } from '../../core/design-system/badge/aero-badge.component';

@Component({
  selector: 'app-inspection-tracking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    PageCardComponent,
    AeroBadgeComponent,
  ],
  template: `
    <app-page-layout
      title="Seguimiento de Observaciones"
      icon="fa-magnifying-glass-chart"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <!-- Filters -->
      <div class="filters-row" actions>
        <div class="filter-group">
          <label class="filter-label">Desde</label>
          <input
            type="date"
            class="aero-date-input"
            [(ngModel)]="fechaDesde"
            (change)="loadData()"
            data-testid="filter-fecha-desde"
          />
        </div>
        <div class="filter-group">
          <label class="filter-label">Hasta</label>
          <input
            type="date"
            class="aero-date-input"
            [(ngModel)]="fechaHasta"
            (change)="loadData()"
            data-testid="filter-fecha-hasta"
          />
        </div>
        <div class="filter-group toggle-group">
          <label class="toggle-label">
            <input
              type="checkbox"
              [(ngModel)]="soloAbiertas"
              (ngModelChange)="loadData()"
              data-testid="filter-solo-abiertas"
            />
            <span class="toggle-text">Solo abiertas</span>
          </label>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards" *ngIf="data.length > 0">
        <div class="summary-card" data-testid="card-equipos">
          <div class="summary-value">{{ data.length }}</div>
          <div class="summary-label">Equipos con observaciones</div>
        </div>
        <div class="summary-card alert" data-testid="card-abiertas">
          <div class="summary-value">{{ getTotalAbiertas() }}</div>
          <div class="summary-label">Observaciones abiertas</div>
        </div>
        <div class="summary-card complete" data-testid="card-resueltas">
          <div class="summary-value">{{ getTotalResueltas() }}</div>
          <div class="summary-label">Resueltas</div>
        </div>
        <div class="summary-card" data-testid="card-total">
          <div class="summary-value">{{ getTotalObservaciones() }}</div>
          <div class="summary-label">Total observaciones</div>
        </div>
      </div>

      <!-- Equipment List -->
      <div class="equipment-list" *ngIf="data.length > 0">
        @for (equipo of data; track equipo.equipo_id) {
          <app-page-card [noPadding]="true">
            <div class="equipo-header" (click)="toggleEquipo(equipo.equipo_id)">
              <div class="equipo-info">
                <span class="equipo-codigo">{{ equipo.codigo_equipo }}</span>
                <span class="equipo-desc">{{ equipo.marca }} {{ equipo.modelo }}</span>
              </div>
              <div class="equipo-badges">
                <aero-badge *ngIf="equipo.observaciones_abiertas > 0" variant="error"
                  >{{ equipo.observaciones_abiertas }} abiertas</aero-badge
                >
                <aero-badge *ngIf="equipo.observaciones_resueltas > 0" variant="success"
                  >{{ equipo.observaciones_resueltas }} resueltas</aero-badge
                >
                <i
                  class="fa-solid chevron-icon"
                  [class.fa-chevron-down]="!isExpanded(equipo.equipo_id)"
                  [class.fa-chevron-up]="isExpanded(equipo.equipo_id)"
                ></i>
              </div>
            </div>

            <!-- Observations List (expandable) -->
            <div class="observations-list" *ngIf="isExpanded(equipo.equipo_id)">
              @for (obs of equipo.observaciones; track obs.id) {
                <div
                  class="observation-row"
                  [class.resolved]="obs.resuelta"
                  [attr.data-testid]="'obs-' + obs.id"
                >
                  <div class="obs-status-icon">
                    <i
                      class="fa-solid"
                      [class.fa-circle-exclamation]="!obs.resuelta"
                      [class.fa-circle-check]="obs.resuelta"
                      [class.icon-open]="!obs.resuelta"
                      [class.icon-resolved]="obs.resuelta"
                    ></i>
                  </div>
                  <div class="obs-content">
                    <div class="obs-header-row">
                      <span class="obs-code">{{ obs.codigo }}</span>
                      <span class="obs-date" *ngIf="obs.fecha">
                        <i class="fa-regular fa-calendar"></i>
                        {{ formatDate(obs.fecha) }}
                      </span>
                      <span class="obs-report-link"> Parte #{{ obs.parte_diario_id }} </span>
                    </div>
                    <p class="obs-description" *ngIf="obs.descripcion">
                      {{ obs.descripcion }}
                    </p>
                    <!-- Resolution info -->
                    <div class="obs-resolution" *ngIf="obs.resuelta">
                      <i class="fa-solid fa-check"></i>
                      Resuelta{{
                        obs.fecha_resolucion ? ' el ' + formatDate(obs.fecha_resolucion) : ''
                      }}
                      <span *ngIf="obs.observacion_resolucion" class="resolution-note">
                        — {{ obs.observacion_resolucion }}
                      </span>
                    </div>
                  </div>
                  <div class="obs-actions" *ngIf="!obs.resuelta">
                    <button
                      class="btn-resolve"
                      (click)="openResolveDialog(obs)"
                      [disabled]="resolvingId === obs.id"
                      [attr.data-testid]="'btn-resolve-' + obs.id"
                    >
                      <i
                        class="fa-solid"
                        [class.fa-check]="resolvingId !== obs.id"
                        [class.fa-spinner]="resolvingId === obs.id"
                        [class.fa-spin]="resolvingId === obs.id"
                      ></i>
                      Resolver
                    </button>
                  </div>
                </div>
              }
            </div>
          </app-page-card>
        }
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading && data.length === 0">
        <i class="fa-solid fa-clipboard-check empty-icon"></i>
        <p *ngIf="soloAbiertas">No hay observaciones abiertas en el rango seleccionado.</p>
        <p *ngIf="!soloAbiertas">No se encontraron observaciones en el rango seleccionado.</p>
      </div>
    </app-page-layout>

    <!-- Resolve Dialog Overlay -->
    <div class="dialog-overlay" *ngIf="resolveDialogObs" (click)="cancelResolve()">
      <div class="dialog-card" (click)="$event.stopPropagation()" data-testid="resolve-dialog">
        <div class="dialog-header">
          <h3>Resolver Observación</h3>
          <button class="dialog-close" (click)="cancelResolve()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="dialog-body">
          <p class="dialog-obs-info">
            <strong>{{ resolveDialogObs.codigo }}</strong>
            <span *ngIf="resolveDialogObs.descripcion"> — {{ resolveDialogObs.descripcion }}</span>
          </p>
          <label class="dialog-label">Nota de resolución (opcional)</label>
          <textarea
            class="dialog-textarea"
            [(ngModel)]="resolutionNote"
            placeholder="Describa cómo se resolvió la observación..."
            rows="3"
            data-testid="resolution-note"
          ></textarea>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" (click)="cancelResolve()">Cancelar</button>
          <button
            class="btn-confirm"
            (click)="confirmResolve()"
            [disabled]="resolvingId !== null"
            data-testid="btn-confirm-resolve"
          >
            <i class="fa-solid fa-check"></i> Confirmar resolución
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Filters */
      .filters-row {
        display: flex;
        gap: 16px;
        align-items: flex-end;
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .filter-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--grey-600);
      }
      .aero-date-input {
        padding: 8px 12px;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-md, 6px);
        font-size: 13px;
        color: var(--grey-900);
        background: var(--neutral-0);
        transition: border-color 0.15s;
      }
      .aero-date-input:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(0, 97, 170, 0.1);
      }
      .toggle-group {
        justify-content: flex-end;
        padding-bottom: 4px;
      }
      .toggle-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 13px;
        color: var(--grey-700);
        font-weight: 500;
      }
      .toggle-label input[type='checkbox'] {
        width: 16px;
        height: 16px;
        accent-color: var(--primary-500);
      }

      /* Summary Cards */
      .summary-cards {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }
      .summary-card {
        background: var(--neutral-0);
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-md, 6px);
        padding: 16px 24px;
        text-align: center;
        min-width: 120px;
        flex: 1;
      }
      .summary-card.alert {
        border-color: var(--semantic-red-300);
        background: var(--semantic-red-50, #fef2f2);
      }
      .summary-card.complete {
        border-color: var(--semantic-green-300);
        background: var(--semantic-green-50, #f0fdf4);
      }
      .summary-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--grey-900);
      }
      .summary-card.alert .summary-value {
        color: var(--semantic-red-500);
      }
      .summary-card.complete .summary-value {
        color: var(--semantic-green-600);
      }
      .summary-label {
        font-size: 12px;
        color: var(--grey-500);
        margin-top: 4px;
      }

      /* Equipment List */
      .equipment-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .equipo-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 16px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .equipo-header:hover {
        background: var(--grey-50);
      }
      .equipo-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .equipo-codigo {
        font-weight: 700;
        color: var(--primary-700);
        font-size: 14px;
      }
      .equipo-desc {
        color: var(--grey-600);
        font-size: 13px;
      }
      .equipo-badges {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .chevron-icon {
        color: var(--grey-400);
        font-size: 12px;
        margin-left: 8px;
        transition: transform 0.15s;
      }

      /* Observations */
      .observations-list {
        border-top: 1px solid var(--grey-200);
      }
      .observation-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--grey-100);
      }
      .observation-row:last-child {
        border-bottom: none;
      }
      .observation-row.resolved {
        opacity: 0.7;
        background: var(--grey-50);
      }

      .obs-status-icon {
        flex-shrink: 0;
        width: 24px;
        padding-top: 2px;
      }
      .icon-open {
        color: var(--semantic-red-500);
        font-size: 16px;
      }
      .icon-resolved {
        color: var(--semantic-green-500);
        font-size: 16px;
      }

      .obs-content {
        flex: 1;
        min-width: 0;
      }
      .obs-header-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 4px;
      }
      .obs-code {
        font-weight: 700;
        font-size: 13px;
        color: var(--grey-900);
        background: var(--grey-100);
        padding: 1px 6px;
        border-radius: 3px;
      }
      .obs-date {
        font-size: 12px;
        color: var(--grey-500);
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .obs-report-link {
        font-size: 12px;
        color: var(--primary-500);
      }
      .obs-description {
        font-size: 13px;
        color: var(--grey-700);
        margin: 0;
        line-height: 1.4;
      }

      .obs-resolution {
        font-size: 12px;
        color: var(--semantic-green-600);
        margin-top: 6px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .resolution-note {
        color: var(--grey-600);
        font-style: italic;
      }

      .obs-actions {
        flex-shrink: 0;
      }
      .btn-resolve {
        padding: 6px 12px;
        border: 1px solid var(--primary-500);
        background: var(--neutral-0);
        color: var(--primary-600);
        border-radius: var(--radius-md, 6px);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.15s;
      }
      .btn-resolve:hover:not(:disabled) {
        background: var(--primary-50);
      }
      .btn-resolve:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Empty state */
      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--grey-500);
      }
      .empty-icon {
        font-size: 48px;
        color: var(--grey-300);
        margin-bottom: 16px;
      }

      /* Resolve Dialog */
      .dialog-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .dialog-card {
        background: var(--neutral-0);
        border-radius: var(--radius-md, 6px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        width: 480px;
        max-width: 90vw;
      }
      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--grey-200);
      }
      .dialog-header h3 {
        margin: 0;
        font-size: 16px;
        color: var(--grey-900);
      }
      .dialog-close {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--grey-400);
        font-size: 16px;
        padding: 4px;
      }
      .dialog-close:hover {
        color: var(--grey-700);
      }
      .dialog-body {
        padding: 20px;
      }
      .dialog-obs-info {
        font-size: 13px;
        color: var(--grey-700);
        margin: 0 0 16px;
        padding: 10px 12px;
        background: var(--grey-50);
        border-radius: 4px;
      }
      .dialog-label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--grey-600);
        margin-bottom: 6px;
      }
      .dialog-textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-md, 6px);
        font-size: 13px;
        font-family: inherit;
        resize: vertical;
        color: var(--grey-900);
      }
      .dialog-textarea:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(0, 97, 170, 0.1);
      }
      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 20px;
        border-top: 1px solid var(--grey-200);
      }
      .btn-cancel {
        padding: 8px 16px;
        border: 1px solid var(--grey-300);
        background: var(--neutral-0);
        color: var(--grey-700);
        border-radius: var(--radius-md, 6px);
        font-size: 13px;
        cursor: pointer;
      }
      .btn-cancel:hover {
        background: var(--grey-50);
      }
      .btn-confirm {
        padding: 8px 16px;
        border: none;
        background: var(--primary-500);
        color: white;
        border-radius: var(--radius-md, 6px);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: background 0.15s;
      }
      .btn-confirm:hover:not(:disabled) {
        background: var(--primary-600);
      }
      .btn-confirm:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class InspectionTrackingComponent implements OnInit {
  private reportService = inject(DailyReportService);

  loading = false;
  data: EquipmentInspectionTracking[] = [];
  expandedIds = new Set<number>();

  fechaDesde = '';
  fechaHasta = '';
  soloAbiertas = true;

  // Resolve dialog
  resolveDialogObs: InspectionObservacion | null = null;
  resolutionNote = '';
  resolvingId: number | null = null;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Equipos', url: '/equipment' },
    { label: 'Seguimiento de Observaciones' },
  ];

  ngOnInit() {
    // Default: last 90 days
    const now = new Date();
    const past = new Date(now);
    past.setDate(past.getDate() - 90);
    this.fechaDesde = past.toISOString().slice(0, 10);
    this.fechaHasta = now.toISOString().slice(0, 10);
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.reportService
      .getInspectionTracking(
        this.fechaDesde || undefined,
        this.fechaHasta || undefined,
        this.soloAbiertas
      )
      .subscribe({
        next: (result) => {
          this.data = result;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  getTotalAbiertas(): number {
    return this.data.reduce((sum, eq) => sum + eq.observaciones_abiertas, 0);
  }

  getTotalResueltas(): number {
    return this.data.reduce((sum, eq) => sum + eq.observaciones_resueltas, 0);
  }

  getTotalObservaciones(): number {
    return this.data.reduce((sum, eq) => sum + eq.total_observaciones, 0);
  }

  toggleEquipo(equipoId: number): void {
    if (this.expandedIds.has(equipoId)) {
      this.expandedIds.delete(equipoId);
    } else {
      this.expandedIds.add(equipoId);
    }
  }

  isExpanded(equipoId: number): boolean {
    return this.expandedIds.has(equipoId);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  openResolveDialog(obs: InspectionObservacion): void {
    this.resolveDialogObs = obs;
    this.resolutionNote = '';
  }

  cancelResolve(): void {
    this.resolveDialogObs = null;
    this.resolutionNote = '';
  }

  confirmResolve(): void {
    if (!this.resolveDialogObs) return;
    const obsId = this.resolveDialogObs.id;
    this.resolvingId = obsId;

    this.reportService.resolverObservacion(obsId, this.resolutionNote || undefined).subscribe({
      next: () => {
        // Update local state
        for (const equipo of this.data) {
          const obs = equipo.observaciones.find((o) => o.id === obsId);
          if (obs) {
            obs.resuelta = true;
            obs.fecha_resolucion = new Date().toISOString().slice(0, 10);
            obs.observacion_resolucion = this.resolutionNote || null;
            equipo.observaciones_abiertas--;
            equipo.observaciones_resueltas++;
            break;
          }
        }
        this.resolvingId = null;
        this.resolveDialogObs = null;
        this.resolutionNote = '';
      },
      error: () => {
        this.resolvingId = null;
      },
    });
  }
}
