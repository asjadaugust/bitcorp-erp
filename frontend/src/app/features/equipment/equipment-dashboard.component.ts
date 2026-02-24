import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  DailyReportService,
  EquipmentReceptionStatus,
  EquipmentInspectionTracking,
} from '../../core/services/daily-report.service';
import { DashboardApiService, DocumentAlertsSummary } from '../../core/services/dashboard.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { EQUIPMENT_MODULE_TABS } from './equipment-tabs';

import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';

@Component({
  selector: 'app-equipment-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageLayoutComponent, StatsGridComponent],
  template: `
    <app-page-layout
      title="Dashboard de Equipos"
      icon="fa-chart-line"
      [breadcrumbs]="[
        { label: 'Inicio', url: '/app' },
        { label: 'Equipos', url: '/equipment' },
        { label: 'Dashboard' }
      ]"
      [loading]="loading"
      [tabs]="moduleTabs"
    >
      <!-- Stats summary (Moved from actions to top of content) -->
      <div class="stats-section">
        <app-stats-grid [items]="summaryStats"></app-stats-grid>
      </div>

      <!-- Document Alerts Panel -->
      @if (documentAlerts) {
        <div class="panel dashboard-panel">
          <div class="panel-header">
            <h3><i class="fa-solid fa-triangle-exclamation"></i> Alertas de Documentos</h3>
            <a routerLink="/equipment" class="link-action">Ver equipos</a>
          </div>
          <div class="alerts-row">
            <div class="alert-group" [class.has-alerts]="documentAlerts.equipment.expired > 0">
              <div class="alert-group-title"><i class="fa-solid fa-tractor"></i> Equipos</div>
              <div class="badges-row">
                @if (documentAlerts.equipment.expired > 0) {
                  <span class="pill pill-red">{{ documentAlerts.equipment.expired }} vencidos</span>
                }
                @if (documentAlerts.equipment.critical > 0) {
                  <span class="pill pill-orange"
                    >{{ documentAlerts.equipment.critical }} críticos</span
                  >
                }
                @if (documentAlerts.equipment.warning > 0) {
                  <span class="pill pill-yellow"
                    >{{ documentAlerts.equipment.warning }} por vencer</span
                  >
                }
                @if (
                  documentAlerts.equipment.expired === 0 &&
                  documentAlerts.equipment.critical === 0 &&
                  documentAlerts.equipment.warning === 0
                ) {
                  <span class="pill pill-green">Todo vigente</span>
                }
              </div>
            </div>

            <div class="alert-group" [class.has-alerts]="documentAlerts.operators.expired > 0">
              <div class="alert-group-title"><i class="fa-solid fa-id-card"></i> Operadores</div>
              <div class="badges-row">
                @if (documentAlerts.operators.expired > 0) {
                  <span class="pill pill-red">{{ documentAlerts.operators.expired }} vencidos</span>
                }
                @if (documentAlerts.operators.critical > 0) {
                  <span class="pill pill-orange"
                    >{{ documentAlerts.operators.critical }} críticos</span
                  >
                }
                @if (documentAlerts.operators.warning > 0) {
                  <span class="pill pill-yellow"
                    >{{ documentAlerts.operators.warning }} por vencer</span
                  >
                }
                @if (
                  documentAlerts.operators.expired === 0 &&
                  documentAlerts.operators.critical === 0 &&
                  documentAlerts.operators.warning === 0
                ) {
                  <span class="pill pill-green">Todo vigente</span>
                }
              </div>
            </div>

            <div class="alert-group" [class.has-alerts]="documentAlerts.contracts.expired > 0">
              <div class="alert-group-title">
                <i class="fa-solid fa-file-contract"></i> Contratos
              </div>
              <div class="badges-row">
                @if (documentAlerts.contracts.expired > 0) {
                  <span class="pill pill-red">{{ documentAlerts.contracts.expired }} vencidos</span>
                }
                @if (documentAlerts.contracts.critical > 0) {
                  <span class="pill pill-orange"
                    >{{ documentAlerts.contracts.critical }} críticos</span
                  >
                }
                @if (documentAlerts.contracts.warning > 0) {
                  <span class="pill pill-yellow"
                    >{{ documentAlerts.contracts.warning }} por vencer</span
                  >
                }
                @if (
                  documentAlerts.contracts.expired === 0 &&
                  documentAlerts.contracts.critical === 0 &&
                  documentAlerts.contracts.warning === 0
                ) {
                  <span class="pill pill-green">Todo vigente</span>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <div class="dashboard-grid">
        <!-- Daily Report Reception -->
        <div class="panel dashboard-panel">
          <div class="panel-header">
            <h3><i class="fa-solid fa-clipboard-check"></i> Recepción de Partes Diarios</h3>
            <div class="panel-controls">
              <input
                type="month"
                [(ngModel)]="selectedMonth"
                (change)="loadReceptionStatus()"
                class="month-input-premium"
              />
              <a routerLink="/equipment/daily-reports/reception" class="link-action">Ver todo</a>
            </div>
          </div>

          @if (receptionStatus.length === 0 && !loadingReception) {
            <p class="empty-text">Sin datos para el período seleccionado.</p>
          } @else if (loadingReception) {
            <div class="loading-inline"><div class="dots-loader"></div></div>
          } @else {
            <div class="reception-table-premium">
              <table>
                <thead>
                  <tr>
                    <th>Equipo</th>
                    <th class="text-center">Días</th>
                    <th class="text-center">Recibidos</th>
                    <th class="text-center">Pend.</th>
                    <th>Recepción</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of receptionStatus.slice(0, 8); track item.equipo_id) {
                    <tr
                      [class.row-soft-danger]="(item?.porcentaje_recepcion || 0) < 50"
                      [class.row-soft-warning]="
                        (item?.porcentaje_recepcion || 0) >= 50 &&
                        (item?.porcentaje_recepcion || 0) < 80
                      "
                    >
                      <td class="equipo-cell">
                        <span class="code">{{ item?.codigo_equipo }}</span>
                        <span class="desc"
                          >{{ item?.marca }} {{ item?.modelo | slice: 0 : 15 }}</span
                        >
                      </td>
                      <td class="text-center">{{ item.total_dias }}</td>
                      <td class="text-center text-success">{{ item.reportes_recibidos }}</td>
                      <td class="text-center text-danger">{{ item.reportes_pendientes }}</td>
                      <td>
                        <div class="progress-cell-premium">
                          <div class="progress-bar-wrap-slim">
                            <div
                              class="progress-fill"
                              [ngClass]="getPercentClass(item?.porcentaje_recepcion || 0)"
                              [style.width.%]="item?.porcentaje_recepcion || 0"
                            ></div>
                          </div>
                          <span class="pct"
                            >{{ item?.porcentaje_recepcion || 0 | number: '1.0-0' }}%</span
                          >
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              @if (receptionStatus.length > 8) {
                <div class="footer-actions">
                  <a routerLink="/equipment/daily-reports/reception" class="link-action"
                    >Ver los {{ receptionStatus.length }} equipos</a
                  >
                </div>
              }
            </div>
          }
        </div>

        <!-- Inspection Tracking Panel -->
        <div class="panel dashboard-panel">
          <div class="panel-header">
            <h3><i class="fa-solid fa-magnifying-glass-chart"></i> Seguimiento de Inspecciones</h3>
            <div class="panel-controls">
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  [(ngModel)]="soloAbiertas"
                  (change)="loadInspectionTracking()"
                />
                <span class="slider"></span>
                <span class="toggle-text">Solo abiertas</span>
              </label>
            </div>
          </div>

          @if (loadingInspection) {
            <div class="loading-inline"><div class="dots-loader"></div></div>
          } @else if (inspectionTracking.length === 0) {
            <div class="empty-state-dashboard">
              <i class="fa-solid fa-circle-check"></i>
              <p>Sin observaciones {{ soloAbiertas ? 'abiertas' : '' }} registradas.</p>
            </div>
          } @else {
            <div class="reception-table-premium">
              <table>
                <thead>
                  <tr>
                    <th>Equipo</th>
                    <th class="text-center">Abiertas</th>
                    <th>Última obs.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of inspectionTracking.slice(0, 8); track item.equipo_id) {
                    <tr
                      [class.row-soft-danger]="item.observaciones_abiertas > 3"
                      [class.row-soft-warning]="
                        item.observaciones_abiertas > 0 && item.observaciones_abiertas <= 3
                      "
                    >
                      <td class="equipo-cell">
                        <span class="code">{{ item.codigo_equipo }}</span>
                        <span class="desc">{{ item.marca }}</span>
                      </td>
                      <td class="text-center">
                        @if (item.observaciones_abiertas > 0) {
                          <span class="pill-count count-red">{{
                            item.observaciones_abiertas
                          }}</span>
                        } @else {
                          <span class="pill-count count-green">0</span>
                        }
                      </td>
                      <td>
                        @if (item.observaciones[0]) {
                          <div class="obs-summary">
                            <span class="obs-text"
                              >{{ item.observaciones[0].descripcion | slice: 0 : 30 }}...</span
                            >
                            <span class="obs-date">{{
                              item.observaciones[0].fecha | date: 'dd/MM'
                            }}</span>
                          </div>
                        }
                      </td>
                      <td>
                        <a [routerLink]="['/equipment', item.equipo_id]" class="btn-icon-link">
                          <i class="fa-solid fa-chevron-right"></i>
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .stats-section {
        margin-bottom: var(--s-24);
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: var(--s-24);

        @media (max-width: 1200px) {
          grid-template-columns: 1fr;
        }
      }

      .dashboard-panel {
        background: white;
        border: 1px solid var(--grey-100);
        border-radius: var(--radius-lg);
        padding: var(--s-24);
        box-shadow:
          0 4px 6px -1px rgba(0, 0, 0, 0.05),
          0 2px 4px -2px rgba(0, 0, 0, 0.05);
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--s-24);

        h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--grey-800);
          display: flex;
          align-items: center;
          gap: var(--s-12);
          margin: 0;

          i {
            color: var(--primary-500);
            background: var(--primary-50);
            padding: 8px;
            border-radius: 8px;
            font-size: 14px;
          }
        }
      }

      .panel-controls {
        display: flex;
        align-items: center;
        gap: var(--s-16);
      }

      .link-action {
        font-size: 13px;
        color: var(--primary-600);
        text-decoration: none;
        font-weight: 600;
        transition: color 0.2s;

        &:hover {
          color: var(--primary-800);
          text-decoration: underline;
        }
      }

      .alerts-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--s-16);
        margin-bottom: var(--s-8);

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      }

      .alert-group {
        padding: var(--s-16);
        border-radius: var(--radius-md);
        border: 1px solid var(--grey-100);
        background: var(--grey-50);
        transition: all 0.2s;

        &:hover {
          border-color: var(--grey-200);
          background: white;
          box-shadow: var(--shadow-sm);
        }

        &.has-alerts {
          border-color: #fecaca;
          background: #fff5f5;
        }
      }

      .alert-group-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--grey-700);
        margin-bottom: var(--s-12);
        display: flex;
        align-items: center;
        gap: var(--s-8);

        i {
          color: var(--grey-400);
        }
      }

      .badges-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .pill {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }

      .pill-red {
        background: #fee2e2;
        color: #991b1b;
      }

      .pill-orange {
        background: #ffedd5;
        color: #9a3412;
      }

      .pill-yellow {
        background: #fef9c3;
        color: #854d0e;
      }

      .pill-green {
        background: #dcfce7;
        color: #166534;
      }

      .month-input-premium {
        border: 1px solid var(--grey-200);
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 13px;
        color: var(--grey-700);
        background: white;
        font-weight: 500;
        outline: none;
        transition: border-color 0.2s;

        &:focus {
          border-color: var(--primary-500);
          box-shadow: 0 0 0 2px var(--primary-100);
        }
      }

      .reception-table-premium {
        overflow-x: auto;
        flex: 1;

        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 4px;
          font-size: 13px;
        }

        th {
          text-align: left;
          padding: 8px 12px;
          color: var(--grey-500);
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        td {
          padding: 12px;
          background: white;
          border-top: 1px solid var(--grey-50);
          border-bottom: 1px solid var(--grey-50);

          &:first-child {
            border-left: 1px solid var(--grey-50);
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
          }

          &:last-child {
            border-right: 1px solid var(--grey-50);
            border-top-right-radius: 8px;
            border-bottom-right-radius: 8px;
          }
        }

        tr {
          transition: transform 0.2s;
        }

        tr:hover td {
          background: var(--grey-50);
          cursor: pointer;
        }
      }

      .row-soft-danger td {
        background: #fffafa !important;
        border-color: #fce8e8 !important;
      }

      .row-soft-warning td {
        background: #fffdf5 !important;
        border-color: #fcf6d6 !important;
      }

      .equipo-cell {
        .code {
          display: block;
          font-weight: 700;
          color: var(--grey-900);
          font-family: var(--font-family-mono);
          font-size: 12px;
        }

        .desc {
          display: block;
          font-size: 11px;
          color: var(--grey-500);
          margin-top: 2px;
        }
      }

      .text-center {
        text-align: center;
      }

      .text-success {
        color: #166534;
      }

      .text-danger {
        color: #991b1b;
      }

      .progress-cell-premium {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 120px;
      }

      .progress-bar-wrap-slim {
        flex: 1;
        height: 6px;
        background: var(--grey-100);
        border-radius: 999px;
        overflow: hidden;
      }

      .footer-actions {
        margin-top: var(--s-16);
        text-align: center;
        padding-top: var(--s-16);
        border-top: 1px solid var(--grey-50);
      }

      .empty-state-dashboard {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--s-48) 0;
        color: var(--grey-400);

        i {
          font-size: 32px;
          color: var(--grey-200);
          margin-bottom: var(--s-12);
        }

        p {
          font-size: 14px;
          margin: 0;
        }
      }

      .pill-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        padding: 0 6px;
      }

      .count-red {
        background: #fee2e2;
        color: #ef4444;
      }

      .count-green {
        background: #dcfce7;
        color: #22c55e;
      }

      .obs-summary {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .obs-text {
          font-size: 12px;
          color: var(--grey-700);
          font-weight: 500;
        }

        .obs-date {
          font-size: 10px;
          color: var(--grey-400);
        }
      }

      .btn-icon-link {
        color: var(--grey-400);
        transition: all 0.2s;

        &:hover {
          color: var(--primary-500);
          transform: translateX(2px);
        }
      }

      /* Toggle Switch */
      .toggle-switch {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;

        input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          width: 34px;
          height: 18px;
          background-color: var(--grey-300);
          transition: 0.4s;
          border-radius: 34px;
          position: relative;

          &:before {
            position: absolute;
            content: '';
            height: 14px;
            width: 14px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: 0.4s;
            border-radius: 50%;
          }
        }

        input:checked + .slider {
          background-color: var(--primary-500);
        }

        input:checked + .slider:before {
          transform: translateX(16px);
        }

        .toggle-text {
          font-size: 12px;
          font-weight: 600;
          color: var(--grey-600);
        }
      }

      .loading-inline {
        display: flex;
        justify-content: center;
        padding: var(--s-24);
      }

      .dots-loader {
        width: 40px;
        height: 10px;
        background: radial-gradient(circle closest-side, var(--primary-300) 90%, #0000) 0 0/33% 100%
          space;
        animation: d 0.75s infinite linear;
      }

      @keyframes d {
        20% {
          background-position: 0% 0%;
        }
        40% {
          background-position: 50% 0%;
        }
        60% {
          background-position: 100% 0%;
        }
      }
    `,
  ],
})
export class EquipmentDashboardComponent implements OnInit {
  private dailyReportService = inject(DailyReportService);
  private dashboardService = inject(DashboardApiService);
  private equipmentService = inject(EquipmentService);

  loading = false;
  loadingReception = false;
  loadingInspection = false;

  documentAlerts: DocumentAlertsSummary | null = null;
  receptionStatus: EquipmentReceptionStatus[] = [];
  inspectionTracking: EquipmentInspectionTracking[] = [];
  soloAbiertas = true;

  selectedMonth: string = this.getCurrentMonth();
  moduleTabs = EQUIPMENT_MODULE_TABS;
  summaryStats: StatItem[] = [];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.loadDocumentAlerts();
    this.loadReceptionStatus();
    this.loadEquipmentStats();
    this.loadInspectionTracking();
  }

  loadInspectionTracking(): void {
    this.loadingInspection = true;
    this.dailyReportService
      .getInspectionTracking(undefined, undefined, this.soloAbiertas)
      .subscribe({
        next: (data) => {
          this.inspectionTracking = data;
          this.loadingInspection = false;
        },
        error: () => {
          this.loadingInspection = false;
        },
      });
  }

  loadDocumentAlerts(): void {
    this.dashboardService.getDocumentAlerts().subscribe({
      next: (alerts) => {
        this.documentAlerts = alerts;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadReceptionStatus(): void {
    const [year, month] = this.selectedMonth.split('-');
    const fechaDesde = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const fechaHasta = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;

    this.loadingReception = true;
    this.dailyReportService.getReceptionStatus(fechaDesde, fechaHasta).subscribe({
      next: (data) => {
        this.receptionStatus = data.sort((a, b) => a.porcentaje_recepcion - b.porcentaje_recepcion);
        this.loadingReception = false;
      },
      error: () => {
        this.loadingReception = false;
      },
    });
  }

  loadEquipmentStats(): void {
    this.equipmentService.getAll({ limit: '200' }).subscribe({
      next: (response) => {
        const equipos = Array.isArray(response) ? response : (response as any).data || [];
        const total = equipos.length;
        const disponibles = equipos.filter((e: any) => e.estado === 'DISPONIBLE').length;
        const enUso = equipos.filter((e: any) => e.estado === 'EN_USO').length;
        const propios = equipos.filter(
          (e: any) => e.es_propio || e.tipo_proveedor === 'PROPIO'
        ).length;

        this.summaryStats = [
          {
            label: 'Total Equipos',
            value: total,
            icon: 'fa-tractor',
            color: 'primary',
          },
          {
            label: 'Disponibles',
            value: disponibles,
            icon: 'fa-circle-check',
            color: 'success',
          },
          {
            label: 'En Uso',
            value: enUso,
            icon: 'fa-gears',
            color: 'warning',
          },
          {
            label: 'Propios',
            value: propios,
            icon: 'fa-building',
            color: 'info',
          },
        ];
      },
    });
  }

  getPercentClass(pct: number): string {
    if (pct >= 80) return 'fill-green';
    if (pct >= 50) return 'fill-yellow';
    return 'fill-red';
  }

  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }
}
