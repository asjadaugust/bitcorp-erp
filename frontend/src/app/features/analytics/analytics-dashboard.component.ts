import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  AnalyticsService,
  FlotaUtilizacionDto,
  UtilizacionEquipoDto,
  TendenciaUtilizacionDto,
  CombustibleEquipoDto,
  TendenciaCombustibleDto,
} from '../../core/services/analytics.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { Equipment } from '../../core/models/equipment.model';
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';

type TabId = 'flota' | 'utilizacion' | 'combustible';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatsGridComponent],
  template: `
    <div class="analytics-page" data-testid="analytics-dashboard">
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-header-left">
          <i class="fa-solid fa-chart-line page-icon"></i>
          <div>
            <h1 class="page-title">Analítica de Flota</h1>
            <nav class="breadcrumb" aria-label="breadcrumb">
              <span>Analítica</span>
            </nav>
          </div>
        </div>
        <!-- Period selector -->
        <div class="period-controls" data-testid="period-controls">
          <div class="period-group">
            <label for="fecha-inicio">Desde</label>
            <input
              id="fecha-inicio"
              type="date"
              [(ngModel)]="fechaInicio"
              (change)="onPeriodChange()"
              data-testid="input-fecha-inicio"
              class="date-input"
            />
          </div>
          <div class="period-group">
            <label for="fecha-fin">Hasta</label>
            <input
              id="fecha-fin"
              type="date"
              [(ngModel)]="fechaFin"
              (change)="onPeriodChange()"
              data-testid="input-fecha-fin"
              class="date-input"
            />
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs" data-testid="analytics-tabs">
        <button
          *ngFor="let tab of tabs"
          class="tab-btn"
          [class.active]="tabActivo() === tab.id"
          (click)="tabActivo.set(tab.id)"
          [attr.data-testid]="'tab-' + tab.id"
        >
          <i [class]="tab.icon"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- ══════════════════════════ TAB: FLOTA ══════════════════════════ -->
      <div *ngIf="tabActivo() === 'flota'" data-testid="panel-flota">
        <div *ngIf="cargandoFlota()" class="loading-state" data-testid="flota-loading">
          <i class="fa-solid fa-spinner fa-spin"></i> Cargando métricas de flota...
        </div>

        <div *ngIf="errorFlota()" class="error-state" data-testid="flota-error">
          <i class="fa-solid fa-circle-exclamation"></i> {{ errorFlota() }}
        </div>

        <ng-container *ngIf="!cargandoFlota() && !errorFlota() && flota()">
          <!-- Stats Grid -->
          <app-stats-grid [items]="statsFlota()" testId="stats-flota"></app-stats-grid>

          <div class="cards-grid">
            <!-- Mejores Equipos -->
            <div class="card" data-testid="card-mejores-equipos">
              <div class="card-header">
                <h3><i class="fa-solid fa-trophy"></i> Top Equipos por Utilización</h3>
              </div>
              <div class="card-body">
                <div *ngIf="flota()!.mejores_equipos.length === 0" class="empty-list">
                  <i class="fa-solid fa-inbox"></i> Sin datos en el período
                </div>
                <div
                  *ngFor="let eq of flota()!.mejores_equipos; let i = index"
                  class="rank-item"
                  [attr.data-testid]="'mejor-equipo-' + i"
                >
                  <span class="rank-badge rank-{{ i + 1 }}">{{ i + 1 }}</span>
                  <span class="rank-code">{{ eq.codigo_equipo }}</span>
                  <div class="rank-bar-bg">
                    <div
                      class="rank-bar rank-bar-primary"
                      [style.width.%]="eq.tasa_utilizacion"
                    ></div>
                  </div>
                  <span class="rank-value">{{ eq.tasa_utilizacion | number: '1.1-1' }}%</span>
                </div>
              </div>
            </div>

            <!-- Equipos Sub-utilizados -->
            <div class="card" data-testid="card-sub-utilizados">
              <div class="card-header">
                <h3><i class="fa-solid fa-triangle-exclamation"></i> Equipos Sub-utilizados</h3>
              </div>
              <div class="card-body">
                <div *ngIf="flota()!.equipos_sub_utilizados.length === 0" class="empty-list">
                  <i class="fa-solid fa-check-circle"></i> Todos los equipos con utilización óptima
                </div>
                <div
                  *ngFor="let eq of flota()!.equipos_sub_utilizados; let i = index"
                  class="rank-item"
                  [attr.data-testid]="'sub-utilizado-' + i"
                >
                  <span class="warn-dot"></span>
                  <span class="rank-code">{{ eq.codigo_equipo }}</span>
                  <div class="rank-bar-bg">
                    <div
                      class="rank-bar rank-bar-warning"
                      [style.width.%]="eq.tasa_utilizacion"
                    ></div>
                  </div>
                  <span class="rank-value warn">{{ eq.tasa_utilizacion | number: '1.1-1' }}%</span>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- ══════════════════════════ TAB: UTILIZACIÓN ══════════════════════════ -->
      <div *ngIf="tabActivo() === 'utilizacion'" data-testid="panel-utilizacion">
        <!-- Equipment selector -->
        <div class="equipment-selector" data-testid="selector-equipo-utilizacion">
          <label for="equipo-util">Equipo</label>
          <select
            id="equipo-util"
            [(ngModel)]="equipoIdSeleccionado"
            (change)="onEquipoChange()"
            data-testid="select-equipo-utilizacion"
            class="select-input"
          >
            <option value="">-- Seleccionar equipo --</option>
            <option *ngFor="let eq of equipos()" [value]="eq.id">
              {{ eq.codigo_equipo }} — {{ eq.marca || '' }} {{ eq.modelo || '' }}
            </option>
          </select>
        </div>

        <div *ngIf="cargandoUtilizacion()" class="loading-state" data-testid="utilizacion-loading">
          <i class="fa-solid fa-spinner fa-spin"></i> Calculando utilización...
        </div>

        <ng-container *ngIf="!cargandoUtilizacion() && utilizacion()">
          <!-- Stats -->
          <app-stats-grid [items]="statsUtilizacion()" testId="stats-utilizacion"></app-stats-grid>

          <!-- Trend Chart -->
          <div class="card chart-card" data-testid="chart-tendencia-utilizacion">
            <div class="card-header">
              <h3><i class="fa-solid fa-chart-line"></i> Tendencia de Utilización Diaria</h3>
            </div>
            <div class="card-body">
              <div *ngIf="tendenciaUtilizacion().length === 0" class="empty-list">
                <i class="fa-solid fa-inbox"></i> Sin datos de tendencia para el período
              </div>
              <div *ngIf="tendenciaUtilizacion().length > 0" class="bar-chart">
                <div
                  *ngFor="let punto of tendenciaUtilizacion()"
                  class="bar-col"
                  [attr.data-testid]="'barra-util-' + punto.fecha"
                  [title]="punto.fecha + ': ' + (punto.tasa_utilizacion | number: '1.1-1') + '%'"
                >
                  <div class="bar-wrap">
                    <div class="bar bar-primary" [style.height.%]="punto.tasa_utilizacion">
                      <span class="bar-tooltip">
                        {{ punto.tasa_utilizacion | number: '1.1-1' }}% <br />{{
                          punto.horas_trabajadas | number: '1.1-1'
                        }}h
                      </span>
                    </div>
                  </div>
                  <span class="bar-label"
                    >{{ punto.fecha | slice: 8 : 10 }}/{{ punto.fecha | slice: 5 : 7 }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </ng-container>

        <div
          *ngIf="!cargandoUtilizacion() && !utilizacion() && equipoIdSeleccionado"
          class="empty-state"
        >
          <i class="fa-solid fa-chart-bar"></i>
          <p>Sin datos de utilización para el período seleccionado</p>
        </div>
        <div *ngIf="!equipoIdSeleccionado" class="empty-state">
          <i class="fa-solid fa-hand-pointer"></i>
          <p>Selecciona un equipo para ver su utilización</p>
        </div>
      </div>

      <!-- ══════════════════════════ TAB: COMBUSTIBLE ══════════════════════════ -->
      <div *ngIf="tabActivo() === 'combustible'" data-testid="panel-combustible">
        <!-- Equipment selector -->
        <div class="equipment-selector" data-testid="selector-equipo-combustible">
          <label for="equipo-comb">Equipo</label>
          <select
            id="equipo-comb"
            [(ngModel)]="equipoIdSeleccionado"
            (change)="onEquipoChange()"
            data-testid="select-equipo-combustible"
            class="select-input"
          >
            <option value="">-- Seleccionar equipo --</option>
            <option *ngFor="let eq of equipos()" [value]="eq.id">
              {{ eq.codigo_equipo }} — {{ eq.marca || '' }} {{ eq.modelo || '' }}
            </option>
          </select>
        </div>

        <div *ngIf="cargandoCombustible()" class="loading-state" data-testid="combustible-loading">
          <i class="fa-solid fa-spinner fa-spin"></i> Calculando consumo de combustible...
        </div>

        <ng-container *ngIf="!cargandoCombustible() && combustible()">
          <!-- Stats -->
          <app-stats-grid [items]="statsCombustible()" testId="stats-combustible"></app-stats-grid>

          <!-- Efficiency badge -->
          <div
            class="eficiencia-banner"
            [attr.data-testid]="'badge-eficiencia'"
            [class]="'eficiencia-' + combustible()!.eficiencia"
          >
            <i [class]="eficienciaIcono(combustible()!.eficiencia)"></i>
            Eficiencia de Combustible:
            <strong>{{ eficienciaLabel(combustible()!.eficiencia) }}</strong>
            <span class="eficiencia-detail">
              ({{ combustible()!.promedio_combustible_por_hora | number: '1.2-2' }} gal/hora)
            </span>
          </div>

          <!-- Fuel Trend Chart -->
          <div class="card chart-card" data-testid="chart-tendencia-combustible">
            <div class="card-header">
              <h3><i class="fa-solid fa-gas-pump"></i> Tendencia de Consumo Diario</h3>
            </div>
            <div class="card-body">
              <div *ngIf="tendenciaCombustible().length === 0" class="empty-list">
                <i class="fa-solid fa-inbox"></i> Sin datos de tendencia para el período
              </div>
              <div *ngIf="tendenciaCombustible().length > 0" class="bar-chart">
                <div
                  *ngFor="let punto of tendenciaCombustible()"
                  class="bar-col"
                  [attr.data-testid]="'barra-comb-' + punto.fecha"
                  [title]="
                    punto.fecha + ': ' + (punto.combustible_consumido | number: '1.1-1') + ' gal'
                  "
                >
                  <div class="bar-wrap">
                    <div
                      class="bar bar-fuel"
                      [style.height.%]="barHeightCombustible(punto.combustible_consumido)"
                    >
                      <span class="bar-tooltip">
                        {{ punto.combustible_consumido | number: '1.1-1' }} gal <br />S/
                        {{ punto.costo_combustible | number: '1.2-2' }}
                      </span>
                    </div>
                  </div>
                  <span class="bar-label"
                    >{{ punto.fecha | slice: 8 : 10 }}/{{ punto.fecha | slice: 5 : 7 }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </ng-container>

        <div
          *ngIf="!cargandoCombustible() && !combustible() && equipoIdSeleccionado"
          class="empty-state"
        >
          <i class="fa-solid fa-gas-pump"></i>
          <p>Sin datos de combustible para el período seleccionado</p>
        </div>
        <div *ngIf="!equipoIdSeleccionado" class="empty-state">
          <i class="fa-solid fa-hand-pointer"></i>
          <p>Selecciona un equipo para ver su consumo de combustible</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .analytics-page {
        padding: var(--s-24);
        max-width: 1200px;
        margin: 0 auto;
      }

      /* Header */
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--s-16);
        margin-bottom: var(--s-24);
        flex-wrap: wrap;
      }
      .page-header-left {
        display: flex;
        align-items: center;
        gap: var(--s-16);
      }
      .page-icon {
        font-size: 2rem;
        color: var(--primary-500);
        background: var(--primary-50, #e8f0fe);
        padding: var(--s-16);
        border-radius: var(--radius-md);
      }
      .page-title {
        font-size: var(--type-h3-size, 1.5rem);
        font-weight: 700;
        color: var(--primary-900);
        margin: 0 0 4px 0;
      }
      .breadcrumb {
        font-size: var(--type-bodySmall-size, 0.85rem);
        color: var(--grey-500);
      }

      /* Period controls */
      .period-controls {
        display: flex;
        gap: var(--s-16);
        align-items: flex-end;
        flex-wrap: wrap;
      }
      .period-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        label {
          font-size: var(--type-bodySmall-size, 0.8rem);
          font-weight: 500;
          color: var(--grey-700);
        }
      }
      .date-input,
      .select-input {
        padding: 8px 12px;
        border: 1.5px solid var(--grey-300);
        border-radius: var(--radius-md);
        font-size: var(--type-body-size, 0.9rem);
        background: var(--neutral-0, #fff);
        color: var(--grey-900);
        cursor: pointer;
        transition: border-color 0.15s;
        &:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }

      /* Tabs */
      .tabs {
        display: flex;
        gap: var(--s-8);
        border-bottom: 2px solid var(--grey-200);
        margin-bottom: var(--s-24);
      }
      .tab-btn {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        padding: 10px var(--s-16);
        border: none;
        background: none;
        cursor: pointer;
        font-size: var(--type-body-size, 0.9rem);
        font-weight: 500;
        color: var(--grey-600);
        border-bottom: 3px solid transparent;
        margin-bottom: -2px;
        border-radius: var(--radius-md) var(--radius-md) 0 0;
        transition: all 0.15s;
        &:hover {
          color: var(--primary-600);
          background: var(--grey-50);
        }
        &.active {
          color: var(--primary-900);
          border-bottom-color: var(--primary-500);
          background: var(--grey-50, #f9fafb);
        }
      }

      /* Equipment selector */
      .equipment-selector {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        margin-bottom: var(--s-24);
        label {
          font-weight: 500;
          color: var(--grey-700);
          min-width: 50px;
        }
        select {
          min-width: 280px;
        }
      }

      /* Cards */
      .cards-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--s-24);
        margin-top: var(--s-24);
      }
      .card {
        background: var(--neutral-0, #fff);
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-md);
        overflow: hidden;
      }
      .card-header {
        padding: var(--s-16);
        border-bottom: 1px solid var(--grey-200);
        h3 {
          margin: 0;
          font-size: var(--type-bodyLarge-size, 1rem);
          font-weight: 600;
          color: var(--primary-900);
          display: flex;
          align-items: center;
          gap: var(--s-8);
          i {
            color: var(--primary-500);
          }
        }
      }
      .card-body {
        padding: var(--s-16);
      }
      .chart-card {
        margin-top: var(--s-24);
      }

      /* Rank items */
      .rank-item {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        padding: 8px 0;
        border-bottom: 1px solid var(--grey-100);
        &:last-child {
          border-bottom: none;
        }
      }
      .rank-badge {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        background: var(--grey-200);
        color: var(--grey-700);
        flex-shrink: 0;
      }
      .rank-badge.rank-1 {
        background: #ffd700;
        color: #7a5000;
      }
      .rank-badge.rank-2 {
        background: #c0c0c0;
        color: #444;
      }
      .rank-badge.rank-3 {
        background: #cd7f32;
        color: #fff;
      }
      .warn-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--semantic-yellow-500, #f59e0b);
        flex-shrink: 0;
      }
      .rank-code {
        font-weight: 600;
        font-size: 0.85rem;
        color: var(--primary-900);
        min-width: 80px;
      }
      .rank-bar-bg {
        flex: 1;
        height: 8px;
        background: var(--grey-100);
        border-radius: 4px;
        overflow: hidden;
      }
      .rank-bar {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      .rank-bar-primary {
        background: var(--primary-500, #3b82f6);
      }
      .rank-bar-warning {
        background: var(--semantic-yellow-500, #f59e0b);
      }
      .rank-value {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--grey-700);
        min-width: 45px;
        text-align: right;
      }
      .rank-value.warn {
        color: var(--semantic-yellow-600, #d97706);
      }

      /* Bar charts */
      .bar-chart {
        display: flex;
        gap: 4px;
        align-items: flex-end;
        height: 180px;
        overflow-x: auto;
        padding-bottom: var(--s-16);
      }
      .bar-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 32px;
        flex: 1;
      }
      .bar-wrap {
        height: 140px;
        display: flex;
        align-items: flex-end;
        width: 100%;
      }
      .bar {
        width: 100%;
        min-height: 4px;
        border-radius: 3px 3px 0 0;
        position: relative;
        cursor: pointer;
        transition: opacity 0.15s;
        &:hover .bar-tooltip {
          display: block;
        }
        &:hover {
          opacity: 0.85;
        }
      }
      .bar-primary {
        background: var(--primary-500, #3b82f6);
      }
      .bar-fuel {
        background: var(--semantic-yellow-500, #f59e0b);
      }
      .bar-tooltip {
        display: none;
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        font-size: 0.7rem;
        padding: 4px 6px;
        border-radius: 4px;
        white-space: nowrap;
        z-index: 10;
        text-align: center;
      }
      .bar-label {
        font-size: 0.65rem;
        color: var(--grey-500);
        margin-top: 4px;
        text-align: center;
      }

      /* Eficiencia banner */
      .eficiencia-banner {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        padding: var(--s-16);
        border-radius: var(--radius-md);
        margin-bottom: var(--s-24);
        font-weight: 500;
        i {
          font-size: 1.2rem;
        }
        .eficiencia-detail {
          color: inherit;
          opacity: 0.7;
          font-size: 0.85rem;
          margin-left: 4px;
        }
      }
      .eficiencia-buena {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #86efac;
      }
      .eficiencia-promedio {
        background: #fef9c3;
        color: #854d0e;
        border: 1px solid #fde047;
      }
      .eficiencia-deficiente {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
      }

      /* States */
      .loading-state,
      .error-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-12);
        padding: var(--s-32);
        color: var(--grey-500);
        i {
          font-size: 2rem;
        }
        p {
          margin: 0;
        }
      }
      .error-state {
        color: var(--semantic-red-500);
      }
      .empty-list {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        color: var(--grey-400);
        font-style: italic;
        padding: var(--s-16) 0;
        i {
          font-size: 1.2rem;
        }
      }

      @media (max-width: 768px) {
        .analytics-page {
          padding: var(--s-16);
        }
        .page-header {
          flex-direction: column;
        }
        .cards-grid {
          grid-template-columns: 1fr;
        }
        .tabs {
          overflow-x: auto;
        }
      }
    `,
  ],
})
export class AnalyticsDashboardComponent implements OnInit {
  private analyticsSvc = inject(AnalyticsService);
  private equipmentSvc = inject(EquipmentService);

  // ── Period ──────────────────────────────────────────────────────────────────
  fechaInicio: string;
  fechaFin: string;

  // ── Tab state ───────────────────────────────────────────────────────────────
  tabActivo = signal<TabId>('flota');
  tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'flota', label: 'Resumen de Flota', icon: 'fa-solid fa-truck-fast' },
    { id: 'utilizacion', label: 'Utilización', icon: 'fa-solid fa-clock' },
    { id: 'combustible', label: 'Combustible', icon: 'fa-solid fa-gas-pump' },
  ];

  // ── Equipment selector ──────────────────────────────────────────────────────
  equipos = signal<Equipment[]>([]);
  equipoIdSeleccionado = '';

  // ── Fleet data ──────────────────────────────────────────────────────────────
  flota = signal<FlotaUtilizacionDto | null>(null);
  cargandoFlota = signal(false);
  errorFlota = signal<string | null>(null);

  // ── Utilization data ────────────────────────────────────────────────────────
  utilizacion = signal<UtilizacionEquipoDto | null>(null);
  tendenciaUtilizacion = signal<TendenciaUtilizacionDto[]>([]);
  cargandoUtilizacion = signal(false);

  // ── Fuel data ───────────────────────────────────────────────────────────────
  combustible = signal<CombustibleEquipoDto | null>(null);
  tendenciaCombustible = signal<TendenciaCombustibleDto[]>([]);
  cargandoCombustible = signal(false);

  // ── Computed stats ──────────────────────────────────────────────────────────
  statsFlota = computed<StatItem[]>(() => {
    const f = this.flota();
    if (!f) return [];
    return [
      {
        label: 'Total Equipos',
        value: f.total_equipos,
        icon: 'fa-tractor',
        color: 'primary',
        testId: 'stat-total-equipos',
      },
      {
        label: 'Equipos Activos',
        value: f.equipos_activos,
        icon: 'fa-check-circle',
        color: 'success',
        testId: 'stat-equipos-activos',
      },
      {
        label: 'Utilización Promedio',
        value: `${f.tasa_utilizacion_promedio.toFixed(1)}%`,
        icon: 'fa-chart-pie',
        color: 'info',
        testId: 'stat-utilizacion-promedio',
      },
      {
        label: 'Costo Total',
        value: `S/ ${f.costo_total.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        icon: 'fa-coins',
        color: 'warning',
        testId: 'stat-costo-total',
      },
    ];
  });

  statsUtilizacion = computed<StatItem[]>(() => {
    const u = this.utilizacion();
    if (!u) return [];
    return [
      {
        label: 'Tasa de Utilización',
        value: `${u.tasa_utilizacion.toFixed(1)}%`,
        icon: 'fa-chart-pie',
        color:
          u.tasa_utilizacion >= 70 ? 'success' : u.tasa_utilizacion >= 50 ? 'warning' : 'danger',
        testId: 'stat-tasa-utilizacion',
      },
      {
        label: 'Horas Trabajadas',
        value: `${u.horas_trabajadas.toFixed(1)} h`,
        icon: 'fa-clock',
        color: 'primary',
        testId: 'stat-horas-trabajadas',
      },
      {
        label: 'Horas Inactivas',
        value: `${u.horas_inactivas.toFixed(1)} h`,
        icon: 'fa-pause-circle',
        color: 'info',
        testId: 'stat-horas-inactivas',
      },
      {
        label: 'Costo Total',
        value: `S/ ${u.costo_total.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        icon: 'fa-coins',
        color: 'warning',
        testId: 'stat-costo-utilizacion',
      },
    ];
  });

  statsCombustible = computed<StatItem[]>(() => {
    const c = this.combustible();
    if (!c) return [];
    return [
      {
        label: 'Total Consumido',
        value: `${c.total_combustible_consumido.toFixed(1)} gal`,
        icon: 'fa-gas-pump',
        color: 'warning',
        testId: 'stat-total-combustible',
      },
      {
        label: 'Promedio / Hora',
        value: `${c.promedio_combustible_por_hora.toFixed(2)} gal/h`,
        icon: 'fa-tachometer-alt',
        color: 'info',
        testId: 'stat-promedio-combustible',
      },
      {
        label: 'Costo Total Combustible',
        value: `S/ ${c.costo_total_combustible.toFixed(2)}`,
        icon: 'fa-coins',
        color: 'danger',
        testId: 'stat-costo-combustible',
      },
      {
        label: 'Costo Promedio / Hora',
        value: `S/ ${c.costo_promedio_por_hora.toFixed(2)}/h`,
        icon: 'fa-chart-line',
        color: 'primary',
        testId: 'stat-costo-hora-combustible',
      },
    ];
  });

  constructor() {
    const now = new Date();
    const hace30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ayer = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.fechaInicio = hace30.toISOString().split('T')[0];
    this.fechaFin = ayer.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.cargarEquipos();
    this.cargarFlota();
  }

  cargarEquipos(): void {
    this.equipmentSvc.getAll({ limit: '200' }).subscribe({
      next: (res) => this.equipos.set(res.data || []),
      error: () => {},
    });
  }

  cargarFlota(): void {
    this.cargandoFlota.set(true);
    this.errorFlota.set(null);
    this.analyticsSvc.obtenerFlotaUtilizacion(this.fechaInicio, this.fechaFin).subscribe({
      next: (data) => {
        this.flota.set(data);
        this.cargandoFlota.set(false);
      },
      error: (err) => {
        this.errorFlota.set(err?.error?.error?.message || 'Error al cargar métricas de flota');
        this.cargandoFlota.set(false);
      },
    });
  }

  cargarUtilizacion(): void {
    const id = parseInt(this.equipoIdSeleccionado);
    if (!id) return;
    this.cargandoUtilizacion.set(true);
    this.utilizacion.set(null);
    this.tendenciaUtilizacion.set([]);

    this.analyticsSvc.obtenerUtilizacionEquipo(id, this.fechaInicio, this.fechaFin).subscribe({
      next: (data) => {
        this.utilizacion.set(data);
        this.cargandoUtilizacion.set(false);
      },
      error: () => this.cargandoUtilizacion.set(false),
    });

    this.analyticsSvc.obtenerTendenciaUtilizacion(id, this.fechaInicio, this.fechaFin).subscribe({
      next: (data) => this.tendenciaUtilizacion.set(data),
      error: () => {},
    });
  }

  cargarCombustible(): void {
    const id = parseInt(this.equipoIdSeleccionado);
    if (!id) return;
    this.cargandoCombustible.set(true);
    this.combustible.set(null);
    this.tendenciaCombustible.set([]);

    this.analyticsSvc.obtenerCombustibleEquipo(id, this.fechaInicio, this.fechaFin).subscribe({
      next: (data) => {
        this.combustible.set(data);
        this.cargandoCombustible.set(false);
      },
      error: () => this.cargandoCombustible.set(false),
    });

    this.analyticsSvc.obtenerTendenciaCombustible(id, this.fechaInicio, this.fechaFin).subscribe({
      next: (data) => this.tendenciaCombustible.set(data),
      error: () => {},
    });
  }

  onPeriodChange(): void {
    this.cargarFlota();
    if (this.equipoIdSeleccionado) {
      this.cargarUtilizacion();
      this.cargarCombustible();
    }
  }

  onEquipoChange(): void {
    this.cargarUtilizacion();
    this.cargarCombustible();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  barHeightCombustible(value: number): number {
    const max = Math.max(...this.tendenciaCombustible().map((p) => p.combustible_consumido), 1);
    return max > 0 ? (value / max) * 100 : 0;
  }

  eficienciaLabel(ef: 'buena' | 'promedio' | 'deficiente'): string {
    const map = { buena: 'Buena', promedio: 'Promedio', deficiente: 'Deficiente' };
    return map[ef] ?? ef;
  }

  eficienciaIcono(ef: 'buena' | 'promedio' | 'deficiente'): string {
    const map = {
      buena: 'fa-solid fa-circle-check',
      promedio: 'fa-solid fa-circle-minus',
      deficiente: 'fa-solid fa-circle-xmark',
    };
    return map[ef] ?? 'fa-solid fa-circle';
  }
}
