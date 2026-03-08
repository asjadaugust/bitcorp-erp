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
import { ChecklistService, OverdueInspection } from '../../core/services/checklist.service';

import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';
import { AeroBadgeComponent } from '../../core/design-system/badge/aero-badge.component';
import { AeroToggleComponent } from '../../core/design-system/form-controls/aero-toggle.component';
import { AeroButtonComponent } from '../../core/design-system/button/aero-button.component';
import { EQUIPMENT_TABS } from './equipment-tabs';

@Component({
  selector: 'app-equipment-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageLayoutComponent,
    PageCardComponent,
    StatsGridComponent,
    AeroBadgeComponent,
    AeroToggleComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Dashboard de Equipos"
      icon="fa-chart-line"
      [tabs]="tabs"
      [breadcrumbs]="[
        { label: 'Inicio', url: '/dashboard' },
        { label: 'Equipos', url: '/equipment' },
        { label: 'Dashboard' },
      ]"
      [loading]="loading"
    >
      <!-- Stats summary -->
      <div class="stats-section">
        <app-stats-grid [items]="summaryStats"></app-stats-grid>
      </div>

      <!-- Document Alerts Panel -->
      @if (documentAlerts) {
        <app-page-card title="Alertas de Documentos">
          <aero-button header-actions variant="text" size="small" routerLink="/equipment"
            >Ver equipos</aero-button
          >

          <div class="alerts-row">
            <div class="alert-group" [class.has-alerts]="documentAlerts.equipment.expired > 0">
              <div class="alert-group-title"><i class="fa-solid fa-tractor"></i> Equipos</div>
              <div class="badges-row">
                @if (documentAlerts.equipment.expired > 0) {
                  <aero-badge variant="error"
                    >{{ documentAlerts.equipment.expired }} vencidos</aero-badge
                  >
                }
                @if (documentAlerts.equipment.critical > 0) {
                  <aero-badge variant="warning"
                    >{{ documentAlerts.equipment.critical }} críticos</aero-badge
                  >
                }
                @if (documentAlerts.equipment.warning > 0) {
                  <aero-badge variant="info"
                    >{{ documentAlerts.equipment.warning }} por vencer</aero-badge
                  >
                }
                @if (
                  documentAlerts.equipment.expired === 0 &&
                  documentAlerts.equipment.critical === 0 &&
                  documentAlerts.equipment.warning === 0
                ) {
                  <aero-badge variant="success">Todo vigente</aero-badge>
                }
              </div>
            </div>

            <div class="alert-group" [class.has-alerts]="documentAlerts.operators.expired > 0">
              <div class="alert-group-title"><i class="fa-solid fa-id-card"></i> Operadores</div>
              <div class="badges-row">
                @if (documentAlerts.operators.expired > 0) {
                  <aero-badge variant="error"
                    >{{ documentAlerts.operators.expired }} vencidos</aero-badge
                  >
                }
                @if (documentAlerts.operators.critical > 0) {
                  <aero-badge variant="warning"
                    >{{ documentAlerts.operators.critical }} críticos</aero-badge
                  >
                }
                @if (documentAlerts.operators.warning > 0) {
                  <aero-badge variant="info"
                    >{{ documentAlerts.operators.warning }} por vencer</aero-badge
                  >
                }
                @if (
                  documentAlerts.operators.expired === 0 &&
                  documentAlerts.operators.critical === 0 &&
                  documentAlerts.operators.warning === 0
                ) {
                  <aero-badge variant="success">Todo vigente</aero-badge>
                }
              </div>
            </div>

            <div class="alert-group" [class.has-alerts]="documentAlerts.contracts.expired > 0">
              <div class="alert-group-title">
                <i class="fa-solid fa-file-contract"></i> Contratos
              </div>
              <div class="badges-row">
                @if (documentAlerts.contracts.expired > 0) {
                  <aero-badge variant="error"
                    >{{ documentAlerts.contracts.expired }} vencidos</aero-badge
                  >
                }
                @if (documentAlerts.contracts.critical > 0) {
                  <aero-badge variant="warning"
                    >{{ documentAlerts.contracts.critical }} críticos</aero-badge
                  >
                }
                @if (documentAlerts.contracts.warning > 0) {
                  <aero-badge variant="info"
                    >{{ documentAlerts.contracts.warning }} por vencer</aero-badge
                  >
                }
                @if (
                  documentAlerts.contracts.expired === 0 &&
                  documentAlerts.contracts.critical === 0 &&
                  documentAlerts.contracts.warning === 0
                ) {
                  <aero-badge variant="success">Todo vigente</aero-badge>
                }
              </div>
            </div>
          </div>
        </app-page-card>
      }

      <!-- Overdue Inspections Alert -->
      @if (overdueInspections.length > 0) {
        <app-page-card title="Inspecciones Vencidas" class="overdue-card">
          <aero-button
            header-actions
            variant="text"
            size="small"
            routerLink="/checklists/inspections"
            >Ir a inspecciones</aero-button
          >

          <div class="overdue-list">
            @for (
              item of overdueInspections.slice(0, 8);
              track item.equipo_id + '-' + item.plantilla_id
            ) {
              <div class="overdue-row">
                <div class="overdue-equipo">
                  <span class="overdue-codigo">{{ item.codigo_equipo }}</span>
                  <span class="overdue-desc">{{ item.marca }} {{ item.modelo }}</span>
                </div>
                <div class="overdue-template">{{ item.plantilla_nombre }}</div>
                <div class="overdue-meta">
                  @if (item.dias_vencido >= 999) {
                    <aero-badge variant="error">Nunca inspeccionado</aero-badge>
                  }
                  @if (item.dias_vencido > 0 && item.dias_vencido < 999) {
                    <aero-badge variant="error">{{ item.dias_vencido }}d vencido</aero-badge>
                  }
                  <aero-badge variant="neutral">{{ item.frecuencia }}</aero-badge>
                </div>
              </div>
            }
          </div>
          @if (overdueInspections.length > 8) {
            <div class="panel-footer">
              <span class="text-muted">y {{ overdueInspections.length - 8 }} más...</span>
            </div>
          }
        </app-page-card>
      }

      <div class="dashboard-grid">
        <!-- Daily Report Reception -->
        <app-page-card title="Recepción de Partes Diarios" [noPadding]="true">
          <div header-actions class="panel-controls">
            <input
              type="month"
              [(ngModel)]="selectedMonth"
              (change)="loadReceptionStatus()"
              class="month-input"
            />
            <aero-button variant="text" size="small" routerLink="/equipment/daily-reports/reception"
              >Ver todo</aero-button
            >
          </div>

          @if (receptionStatus.length === 0 && !loadingReception) {
            <div class="empty-state">
              <i class="fa-solid fa-clipboard"></i>
              <p>Sin datos para el período seleccionado.</p>
            </div>
          } @else if (loadingReception) {
            <div class="loading-inline"><div class="dots-loader"></div></div>
          } @else {
            <div class="mini-table-wrap">
              <table class="mini-table">
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
                      [class.row-danger]="(item?.porcentaje_recepcion || 0) < 50"
                      [class.row-warning]="
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
                      <td class="text-center font-semibold">{{ item.reportes_recibidos }}</td>
                      <td class="text-center font-semibold">{{ item.reportes_pendientes }}</td>
                      <td>
                        <div class="progress-cell">
                          <div class="progress-bar-track">
                            <div
                              class="progress-bar-fill"
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
                <div class="table-footer">
                  <aero-button
                    variant="text"
                    size="small"
                    routerLink="/equipment/daily-reports/reception"
                    >Ver los {{ receptionStatus.length }} equipos</aero-button
                  >
                </div>
              }
            </div>
          }
        </app-page-card>

        <!-- Inspection Tracking Panel -->
        <app-page-card title="Seguimiento de Inspecciones" [noPadding]="true">
          <div header-actions class="panel-controls">
            <aero-toggle
              [(ngModel)]="soloAbiertas"
              (ngModelChange)="loadInspectionTracking()"
              label="Solo abiertas"
            ></aero-toggle>
            <aero-button variant="text" size="small" routerLink="/equipment/inspection-tracking"
              >Ver todo</aero-button
            >
          </div>

          @if (loadingInspection) {
            <div class="loading-inline"><div class="dots-loader"></div></div>
          } @else if (inspectionTracking.length === 0) {
            <div class="empty-state">
              <i class="fa-solid fa-circle-check"></i>
              <p>Sin observaciones {{ soloAbiertas ? 'abiertas' : '' }} registradas.</p>
            </div>
          } @else {
            <div class="mini-table-wrap">
              <table class="mini-table">
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
                      [class.row-danger]="item.observaciones_abiertas > 3"
                      [class.row-warning]="
                        item.observaciones_abiertas > 0 && item.observaciones_abiertas <= 3
                      "
                    >
                      <td class="equipo-cell">
                        <span class="code">{{ item.codigo_equipo }}</span>
                        <span class="desc">{{ item.marca }}</span>
                      </td>
                      <td class="text-center">
                        @if (item.observaciones_abiertas > 0) {
                          <aero-badge variant="error">{{ item.observaciones_abiertas }}</aero-badge>
                        } @else {
                          <aero-badge variant="success">0</aero-badge>
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
        </app-page-card>
      </div>

      <!-- Quick Access -->
      <div class="quick-access-section">
        <h3 class="section-title"><i class="fa-solid fa-bolt"></i> Acceso rápido</h3>
        <div class="quick-links-row">
          <a routerLink="/equipment/maintenance" class="quick-link-card">
            <div class="ql-icon"><i class="fa-solid fa-wrench"></i></div>
            <div class="ql-info">
              <span class="ql-title">Mantenimiento</span>
              <span class="ql-desc">Programas y registros de mantenimiento</span>
            </div>
            <i class="fa-solid fa-chevron-right ql-arrow"></i>
          </a>
          <a routerLink="/equipment/inoperatividad" class="quick-link-card">
            <div class="ql-icon ql-icon-warning">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="ql-info">
              <span class="ql-title">Inoperatividad</span>
              <span class="ql-desc">Períodos de inoperatividad y penalidades</span>
            </div>
            <i class="fa-solid fa-chevron-right ql-arrow"></i>
          </a>
          <a routerLink="/equipment/precalentamiento-config" class="quick-link-card">
            <div class="ql-icon ql-icon-config"><i class="fa-solid fa-fire-flame-curved"></i></div>
            <div class="ql-info">
              <span class="ql-title">Precalentamiento</span>
              <span class="ql-desc">Configuración de horas por tipo de equipo</span>
            </div>
            <i class="fa-solid fa-chevron-right ql-arrow"></i>
          </a>
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .stats-section {
        margin-bottom: var(--s-24);
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: var(--s-24);
        margin-top: var(--s-24);

        @media (max-width: 1200px) {
          grid-template-columns: 1fr;
        }
      }

      /* ─── Alert Groups ────────────────────────────── */
      .alerts-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--s-16);

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
          background: var(--grey-100);
        }

        &.has-alerts {
          border-color: var(--semantic-red-200);
          background: var(--semantic-red-50);
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
        gap: var(--s-4);
      }

      /* ─── Overdue Card ────────────────────────────── */
      :host ::ng-deep .overdue-card .page-card {
        border-left: 3px solid var(--semantic-red-500);
      }

      .overdue-list {
        display: flex;
        flex-direction: column;
      }

      .overdue-row {
        display: flex;
        align-items: center;
        gap: var(--s-16);
        padding: var(--s-8) var(--s-16);
        border-bottom: 1px solid var(--grey-100);
        font-size: 13px;

        &:last-child {
          border-bottom: none;
        }
      }

      .overdue-equipo {
        flex: 0 0 200px;
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .overdue-codigo {
        font-weight: 700;
        color: var(--primary-700);
      }

      .overdue-desc {
        color: var(--grey-600);
        font-size: 12px;
      }

      .overdue-template {
        flex: 1;
        color: var(--grey-700);
        font-size: 12px;
      }

      .overdue-meta {
        display: flex;
        gap: var(--s-4);
        align-items: center;
      }

      .panel-footer {
        padding: var(--s-8) var(--s-16);
        text-align: center;
        border-top: 1px solid var(--grey-100);
      }

      .text-muted {
        color: var(--grey-500);
        font-size: 12px;
      }

      /* ─── Panel Controls ──────────────────────────── */
      .panel-controls {
        display: flex;
        align-items: center;
        gap: var(--s-16);
      }

      .month-input {
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-md);
        padding: var(--s-4) var(--s-12);
        font-size: 13px;
        color: var(--grey-700);
        background: var(--grey-50);
        font-weight: 500;
        outline: none;
        transition: border-color 0.2s;

        &:focus {
          border-color: var(--primary-500);
          box-shadow: 0 0 0 2px var(--primary-100);
        }
      }

      /* ─── Mini-Table (dashboard widget tables) ───── */
      .mini-table-wrap {
        overflow-x: auto;
      }

      .mini-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;

        th {
          text-align: left;
          padding: var(--s-8) var(--s-16);
          color: var(--grey-500);
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--grey-100);
        }

        td {
          padding: var(--s-12) var(--s-16);
          border-bottom: 1px solid var(--grey-50);
        }

        tbody tr {
          transition: background 0.15s;

          &:hover {
            background: var(--grey-50);
          }
        }
      }

      .row-danger td {
        background: var(--semantic-red-50);
      }

      .row-warning td {
        background: var(--semantic-yellow-50);
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

      .font-semibold {
        font-weight: 600;
      }

      /* ─── Progress Bar ────────────────────────────── */
      .progress-cell {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        min-width: 120px;
      }

      .progress-bar-track {
        flex: 1;
        height: 6px;
        background: var(--grey-100);
        border-radius: 999px;
        overflow: hidden;
      }

      .progress-bar-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 0.3s ease;
      }

      .fill-green {
        background: var(--semantic-green-500);
      }

      .fill-yellow {
        background: var(--semantic-yellow-500);
      }

      .fill-red {
        background: var(--semantic-red-500);
      }

      .pct {
        font-size: 12px;
        font-weight: 600;
        color: var(--grey-600);
        min-width: 32px;
        text-align: right;
      }

      .table-footer {
        text-align: center;
        padding: var(--s-12);
        border-top: 1px solid var(--grey-50);
      }

      /* ─── Observation Summary ─────────────────────── */
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

      /* ─── Empty & Loading States ──────────────────── */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--s-32) 0;
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

      .loading-inline {
        display: flex;
        justify-content: center;
        padding: var(--s-24);
      }

      .dots-loader {
        width: 40px;
        height: 10px;
        background: radial-gradient(circle closest-side, var(--primary-300) 90%, transparent) 0
          0/33% 100% space;
        animation: dots 0.75s infinite linear;
      }

      @keyframes dots {
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

      /* ─── Quick Access ────────────────────────────── */
      .quick-access-section {
        margin-top: var(--s-24);
      }

      .section-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--grey-900);
        display: flex;
        align-items: center;
        gap: var(--s-12);
        margin: 0 0 var(--s-16) 0;

        i {
          color: var(--primary-500);
          background: var(--primary-50);
          padding: var(--s-8);
          border-radius: var(--radius-md);
          font-size: 14px;
        }
      }

      .quick-links-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--s-16);

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      }

      .quick-link-card {
        display: flex;
        align-items: center;
        gap: var(--s-16);
        padding: var(--s-16) var(--s-24);
        background: white;
        border: 1px solid var(--grey-100);
        border-radius: var(--radius-md);
        text-decoration: none;
        transition: all 0.2s;

        &:hover {
          border-color: var(--primary-200);
          box-shadow: var(--shadow-sm);
          transform: translateY(-1px);
        }
      }

      .ql-icon {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-md);
        background: var(--primary-50);
        color: var(--primary-600);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
      }

      .ql-icon-warning {
        background: var(--semantic-orange-50);
        color: var(--semantic-orange-600);
      }

      .ql-icon-config {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
      }

      .ql-info {
        flex: 1;
        min-width: 0;
      }

      .ql-title {
        display: block;
        font-weight: 700;
        font-size: 14px;
        color: var(--grey-900);
      }

      .ql-desc {
        display: block;
        font-size: 12px;
        color: var(--grey-500);
        margin-top: 2px;
      }

      .ql-arrow {
        color: var(--grey-300);
        font-size: 12px;
        flex-shrink: 0;
      }
    `,
  ],
})
export class EquipmentDashboardComponent implements OnInit {
  tabs = EQUIPMENT_TABS;
  private dailyReportService = inject(DailyReportService);
  private dashboardService = inject(DashboardApiService);
  private equipmentService = inject(EquipmentService);
  private checklistService = inject(ChecklistService);

  loading = false;
  loadingReception = false;
  loadingInspection = false;

  documentAlerts: DocumentAlertsSummary | null = null;
  receptionStatus: EquipmentReceptionStatus[] = [];
  inspectionTracking: EquipmentInspectionTracking[] = [];
  overdueInspections: OverdueInspection[] = [];
  soloAbiertas = true;

  selectedMonth: string = this.getCurrentMonth();
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
    this.loadOverdueInspections();
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

  loadOverdueInspections(): void {
    this.checklistService.getOverdueInspections().subscribe({
      next: (data) => {
        this.overdueInspections = data;
      },
      error: () => {
        this.overdueInspections = [];
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
    this.equipmentService.getStatistics().subscribe({
      next: (response: any) => {
        const stats = response || {};
        this.summaryStats = [
          {
            label: 'Total Equipos',
            value: stats.total ?? 0,
            icon: 'fa-tractor',
            color: 'primary',
          },
          {
            label: 'Disponibles',
            value: stats.disponible ?? 0,
            icon: 'fa-circle-check',
            color: 'success',
          },
          {
            label: 'En Uso',
            value: stats.en_uso ?? 0,
            icon: 'fa-gears',
            color: 'warning',
          },
          {
            label: 'Mantenimiento',
            value: stats.mantenimiento ?? 0,
            icon: 'fa-wrench',
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
