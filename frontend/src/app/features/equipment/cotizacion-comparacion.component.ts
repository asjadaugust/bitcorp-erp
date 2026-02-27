import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  CotizacionService,
  Cotizacion,
  ComparacionResponse,
} from '../../core/services/cotizacion.service';
import { ProviderService } from '../../core/services/provider.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { firstValueFrom } from 'rxjs';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-cotizacion-comparacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    PageCardComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-layout>
      <app-page-card [title]="pageTitle" [subtitle]="pageSubtitle">
        <ng-container header-actions>
          <app-button variant="outline" size="sm" icon="arrow_back" (click)="goBack()">
            Volver a Solicitud
          </app-button>
          <app-button
            variant="primary"
            size="sm"
            icon="add"
            (click)="showAddForm = true"
            *ngIf="canAddCotizacion()"
          >
            Agregar Cotización
          </app-button>
        </ng-container>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="loading">
          <span class="material-icons spinning">autorenew</span>
          <p>Cargando comparación de cotizaciones...</p>
        </div>

        <!-- Empty State -->
        <div
          class="empty-state"
          *ngIf="!loading && comparacion && comparacion.cotizaciones.length === 0"
        >
          <span class="material-icons empty-icon">compare_arrows</span>
          <h3>Sin cotizaciones registradas</h3>
          <p>Agregue cotizaciones de proveedores para esta solicitud de equipo.</p>
          <app-button
            variant="primary"
            icon="add"
            (click)="showAddForm = true"
            *ngIf="canAddCotizacion()"
          >
            Agregar Primera Cotización
          </app-button>
        </div>

        <!-- Summary Stats -->
        <div
          class="summary-stats"
          *ngIf="!loading && comparacion && comparacion.cotizaciones.length > 0"
        >
          <div class="stat-card">
            <span class="stat-value">{{ comparacion.resumen.total_cotizaciones }}</span>
            <span class="stat-label">Cotizaciones</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ comparacion.resumen.cotizaciones_evaluadas }}</span>
            <span class="stat-label">Evaluadas</span>
          </div>
          <div class="stat-card highlight">
            <span class="stat-value">{{
              comparacion.resumen.tarifa_minima | currency: 'PEN' : 'symbol' : '1.2-2'
            }}</span>
            <span class="stat-label">Tarifa Mínima</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{
              comparacion.resumen.tarifa_promedio | currency: 'PEN' : 'symbol' : '1.2-2'
            }}</span>
            <span class="stat-label">Promedio</span>
          </div>
          <div class="stat-card" *ngIf="comparacion.resumen.cotizacion_seleccionada">
            <span class="stat-value winner">
              <span class="material-icons">emoji_events</span>
            </span>
            <span class="stat-label">Seleccionada</span>
          </div>
        </div>

        <!-- Comparison Matrix Table -->
        <div
          class="matrix-container"
          *ngIf="!loading && comparacion && comparacion.cotizaciones.length > 0"
        >
          <div class="matrix-scroll">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th class="criteria-col">Criterio</th>
                  <th
                    *ngFor="let cot of comparacion.cotizaciones"
                    class="provider-col"
                    [class.selected]="cot.estado === 'SELECCIONADA'"
                    [class.rejected]="cot.estado === 'RECHAZADA'"
                  >
                    <div class="provider-header">
                      <span class="provider-name">{{
                        cot.proveedor_nombre || 'Proveedor #' + cot.proveedor_id
                      }}</span>
                      <span class="provider-ruc">RUC: {{ cot.proveedor_ruc || '—' }}</span>
                      <span class="estado-badge" [ngClass]="'estado-' + cot.estado.toLowerCase()">
                        {{ cot.estado }}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Código -->
                <tr>
                  <td class="criteria-label">Código</td>
                  <td *ngFor="let cot of comparacion.cotizaciones">{{ cot.codigo }}</td>
                </tr>
                <!-- Tarifa -->
                <tr class="highlight-row">
                  <td class="criteria-label">Tarifa Propuesta</td>
                  <td
                    *ngFor="let cot of comparacion.cotizaciones"
                    [class.best-value]="cot.tarifa_propuesta === comparacion.resumen.tarifa_minima"
                  >
                    <strong>{{
                      cot.tarifa_propuesta
                        | currency: (cot.moneda === 'USD' ? 'USD' : 'PEN') : 'symbol' : '1.2-2'
                    }}</strong>
                    /{{ cot.tipo_tarifa }}
                  </td>
                </tr>
                <!-- Horas Incluidas -->
                <tr>
                  <td class="criteria-label">Horas Incluidas</td>
                  <td *ngFor="let cot of comparacion.cotizaciones">
                    {{ cot.horas_incluidas ? cot.horas_incluidas + ' hrs' : '—' }}
                  </td>
                </tr>
                <!-- Penalidad por Exceso -->
                <tr>
                  <td class="criteria-label">Penalidad por Exceso</td>
                  <td *ngFor="let cot of comparacion.cotizaciones">
                    {{
                      cot.penalidad_exceso
                        ? (cot.penalidad_exceso | currency: 'PEN' : 'symbol' : '1.2-2') + '/hr'
                        : '—'
                    }}
                  </td>
                </tr>
                <!-- Plazo de Entrega -->
                <tr>
                  <td class="criteria-label">Plazo de Entrega</td>
                  <td *ngFor="let cot of comparacion.cotizaciones">
                    {{ cot.plazo_entrega_dias ? cot.plazo_entrega_dias + ' días' : '—' }}
                  </td>
                </tr>
                <!-- Disponibilidad -->
                <tr>
                  <td class="criteria-label">Disponibilidad</td>
                  <td *ngFor="let cot of comparacion.cotizaciones">
                    {{ cot.disponibilidad || '—' }}
                  </td>
                </tr>
                <!-- Garantía -->
                <tr>
                  <td class="criteria-label">Garantía</td>
                  <td *ngFor="let cot of comparacion.cotizaciones">
                    {{ cot.garantia || '—' }}
                  </td>
                </tr>
                <!-- Condiciones de Pago -->
                <tr>
                  <td class="criteria-label">Condiciones de Pago</td>
                  <td *ngFor="let cot of comparacion.cotizaciones">
                    {{ cot.condiciones_pago || '—' }}
                  </td>
                </tr>
                <!-- Condiciones Especiales -->
                <tr>
                  <td class="criteria-label">Condiciones Especiales</td>
                  <td *ngFor="let cot of comparacion.cotizaciones">
                    {{ cot.condiciones_especiales || '—' }}
                  </td>
                </tr>
                <!-- Descripción del Equipo -->
                <tr>
                  <td class="criteria-label">Descripción Equipo</td>
                  <td *ngFor="let cot of comparacion.cotizaciones">
                    {{ cot.descripcion_equipo || '—' }}
                  </td>
                </tr>
                <!-- Puntaje -->
                <tr class="highlight-row">
                  <td class="criteria-label">Puntaje (0-100)</td>
                  <td *ngFor="let cot of comparacion.cotizaciones">
                    <div class="score-cell" *ngIf="cot.puntaje !== null">
                      <div class="score-bar">
                        <div class="score-fill" [style.width.%]="cot.puntaje"></div>
                      </div>
                      <span class="score-value">{{ cot.puntaje }}</span>
                    </div>
                    <span *ngIf="cot.puntaje === null" class="not-evaluated">Sin evaluar</span>
                  </td>
                </tr>
                <!-- Observaciones -->
                <tr>
                  <td class="criteria-label">Observaciones</td>
                  <td *ngFor="let cot of comparacion.cotizaciones">
                    {{ cot.observaciones || '—' }}
                  </td>
                </tr>
                <!-- Actions Row -->
                <tr class="actions-row">
                  <td class="criteria-label">Acciones</td>
                  <td *ngFor="let cot of comparacion.cotizaciones">
                    <div class="action-buttons">
                      <app-button
                        *ngIf="cot.estado === 'REGISTRADA' || cot.estado === 'EVALUADA'"
                        variant="outline"
                        size="xs"
                        icon="star"
                        (click)="openEvaluar(cot)"
                      >
                        Evaluar
                      </app-button>
                      <app-button
                        *ngIf="cot.estado === 'REGISTRADA' || cot.estado === 'EVALUADA'"
                        variant="primary"
                        size="xs"
                        icon="check_circle"
                        (click)="seleccionarCotizacion(cot)"
                      >
                        Seleccionar
                      </app-button>
                      <app-button
                        *ngIf="cot.estado === 'REGISTRADA' || cot.estado === 'EVALUADA'"
                        variant="danger"
                        size="xs"
                        icon="cancel"
                        (click)="rechazarCotizacion(cot)"
                      >
                        Rechazar
                      </app-button>
                      <span
                        *ngIf="cot.estado === 'SELECCIONADA' && cot.orden_alquiler_id"
                        class="oal-link"
                      >
                        <a [routerLink]="['../../ordenes-alquiler', cot.orden_alquiler_id]">
                          <span class="material-icons">open_in_new</span>
                          Ver OAL
                        </a>
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Add Cotización Form (inline) -->
        <div class="add-form-overlay" *ngIf="showAddForm" (click)="showAddForm = false">
          <div class="add-form-card" (click)="$event.stopPropagation()">
            <h3>
              <span class="material-icons">add_circle_outline</span>
              Nueva Cotización
            </h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Proveedor *</label>
                <select class="form-control" [(ngModel)]="newCotizacion.proveedor_id">
                  <option [ngValue]="null">Seleccionar proveedor...</option>
                  <option *ngFor="let p of providers" [ngValue]="p.id">
                    {{ p.razon_social }} ({{ p.ruc }})
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Tarifa Propuesta *</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="newCotizacion.tarifa_propuesta"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div class="form-group">
                <label>Tipo Tarifa</label>
                <select class="form-control" [(ngModel)]="newCotizacion.tipo_tarifa">
                  <option value="HORA">Por Hora</option>
                  <option value="DIA">Por Día</option>
                  <option value="MES">Por Mes</option>
                </select>
              </div>
              <div class="form-group">
                <label>Moneda</label>
                <select class="form-control" [(ngModel)]="newCotizacion.moneda">
                  <option value="PEN">PEN (Soles)</option>
                  <option value="USD">USD (Dólares)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Horas Incluidas</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="newCotizacion.horas_incluidas"
                  min="0"
                  step="0.5"
                />
              </div>
              <div class="form-group">
                <label>Penalidad por Exceso</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="newCotizacion.penalidad_exceso"
                  min="0"
                  step="0.01"
                />
              </div>
              <div class="form-group">
                <label>Plazo Entrega (días)</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="newCotizacion.plazo_entrega_dias"
                  min="0"
                />
              </div>
              <div class="form-group">
                <label>Disponibilidad</label>
                <select class="form-control" [(ngModel)]="newCotizacion.disponibilidad">
                  <option value="">Sin especificar</option>
                  <option value="INMEDIATA">Inmediata</option>
                  <option value="1_SEMANA">1 semana</option>
                  <option value="2_SEMANAS">2 semanas</option>
                  <option value="1_MES">1 mes</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label>Descripción del Equipo Ofertado</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="newCotizacion.descripcion_equipo"
                  rows="2"
                  placeholder="Marca, modelo, año, etc."
                ></textarea>
              </div>
              <div class="form-group full-width">
                <label>Condiciones de Pago</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="newCotizacion.condiciones_pago"
                  rows="2"
                ></textarea>
              </div>
              <div class="form-group full-width">
                <label>Condiciones Especiales</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="newCotizacion.condiciones_especiales"
                  rows="2"
                ></textarea>
              </div>
              <div class="form-group full-width">
                <label>Garantía</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="newCotizacion.garantia"
                  rows="2"
                ></textarea>
              </div>
              <div class="form-group full-width">
                <label>Observaciones</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="newCotizacion.observaciones"
                  rows="2"
                ></textarea>
              </div>
            </div>
            <div class="form-actions">
              <app-button variant="outline" size="sm" (click)="showAddForm = false">
                Cancelar
              </app-button>
              <app-button
                variant="primary"
                size="sm"
                icon="save"
                [disabled]="saving"
                (click)="crearCotizacion()"
              >
                {{ saving ? 'Guardando...' : 'Guardar Cotización' }}
              </app-button>
            </div>
          </div>
        </div>

        <!-- Evaluate Dialog -->
        <div
          class="add-form-overlay"
          *ngIf="evaluatingCotizacion"
          (click)="evaluatingCotizacion = null"
        >
          <div class="add-form-card eval-card" (click)="$event.stopPropagation()">
            <h3>
              <span class="material-icons">star_rate</span>
              Evaluar {{ evaluatingCotizacion.codigo }}
            </h3>
            <p class="eval-subtitle">{{ evaluatingCotizacion.proveedor_nombre }}</p>
            <div class="form-grid">
              <div class="form-group">
                <label>Puntaje (0-100) *</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="evalPuntaje"
                  min="0"
                  max="100"
                />
              </div>
              <div class="form-group full-width">
                <label>Observaciones</label>
                <textarea class="form-control" [(ngModel)]="evalObservaciones" rows="3"></textarea>
              </div>
            </div>
            <div class="form-actions">
              <app-button variant="outline" size="sm" (click)="evaluatingCotizacion = null">
                Cancelar
              </app-button>
              <app-button
                variant="primary"
                size="sm"
                icon="check"
                [disabled]="saving"
                (click)="evaluarCotizacion()"
              >
                Confirmar Evaluación
              </app-button>
            </div>
          </div>
        </div>
      </app-page-card>
    </app-page-layout>
  `,
  styles: [
    `
      @use 'klm-tokens' as *;

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 3rem 1rem;
        color: var(--klm-grey-500);
      }
      .loading-state .spinning {
        animation: spin 1s linear infinite;
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--klm-grey-500);
      }
      .empty-state .empty-icon {
        font-size: 3rem;
        color: var(--klm-grey-300);
      }
      .empty-state h3 {
        margin: 1rem 0 0.5rem;
        color: var(--klm-grey-700);
      }

      .summary-stats {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }
      .stat-card {
        flex: 1;
        min-width: 120px;
        background: var(--klm-grey-50);
        border: 1px solid var(--klm-grey-200);
        border-radius: var(--klm-radius-md);
        padding: 1rem;
        text-align: center;
      }
      .stat-card.highlight {
        background: var(--klm-primary-50, #e8f4fd);
        border-color: var(--klm-primary-blue);
      }
      .stat-value {
        display: block;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--klm-grey-900);
      }
      .stat-value.winner {
        color: #d4a017;
      }
      .stat-label {
        display: block;
        font-size: 0.75rem;
        color: var(--klm-grey-500);
        margin-top: 0.25rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .matrix-container {
        border: 1px solid var(--klm-grey-200);
        border-radius: var(--klm-radius-md);
        overflow: hidden;
      }
      .matrix-scroll {
        overflow-x: auto;
      }

      .comparison-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      .comparison-table th,
      .comparison-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--klm-grey-100);
        vertical-align: top;
      }
      .comparison-table thead th {
        background: var(--klm-grey-50);
        font-weight: 600;
        text-align: center;
        border-bottom: 2px solid var(--klm-grey-200);
        position: sticky;
        top: 0;
      }
      .criteria-col {
        min-width: 180px;
        text-align: left !important;
        background: var(--klm-grey-50) !important;
      }
      .provider-col {
        min-width: 220px;
      }
      .provider-col.selected {
        background: #f0fdf4 !important;
        border-left: 3px solid #22c55e;
      }
      .provider-col.rejected {
        opacity: 0.6;
      }
      .provider-header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        align-items: center;
      }
      .provider-name {
        font-weight: 700;
        font-size: 0.875rem;
      }
      .provider-ruc {
        font-size: 0.75rem;
        color: var(--klm-grey-500);
      }

      .criteria-label {
        font-weight: 600;
        color: var(--klm-grey-700);
        background: var(--klm-grey-50);
      }
      .highlight-row td {
        background: #fefce8;
      }
      .highlight-row .criteria-label {
        background: #fef9c3;
      }
      .best-value {
        color: #16a34a;
        font-weight: 700;
      }

      .score-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .score-bar {
        flex: 1;
        height: 8px;
        background: var(--klm-grey-200);
        border-radius: 4px;
        overflow: hidden;
      }
      .score-fill {
        height: 100%;
        background: var(--klm-primary-blue);
        border-radius: 4px;
        transition: width 0.3s;
      }
      .score-value {
        font-weight: 700;
        min-width: 24px;
        text-align: right;
      }
      .not-evaluated {
        color: var(--klm-grey-400);
        font-style: italic;
        font-size: 0.8rem;
      }

      .actions-row td {
        border-bottom: none;
      }
      .action-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        justify-content: center;
      }
      .oal-link a {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        color: var(--klm-primary-blue);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.8rem;
      }
      .oal-link a:hover {
        text-decoration: underline;
      }
      .oal-link .material-icons {
        font-size: 1rem;
      }

      .estado-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .estado-registrada {
        background: #dbeafe;
        color: #1e40af;
      }
      .estado-evaluada {
        background: #fef3c7;
        color: #92400e;
      }
      .estado-seleccionada {
        background: #dcfce7;
        color: #166534;
      }
      .estado-rechazada {
        background: #fee2e2;
        color: #991b1b;
      }

      /* Add Form Overlay */
      .add-form-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      .add-form-card {
        background: white;
        border-radius: var(--klm-radius-lg, 12px);
        padding: 1.5rem;
        max-width: 700px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      }
      .add-form-card h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 1rem;
        font-size: 1.125rem;
        color: var(--klm-grey-900);
      }
      .eval-card {
        max-width: 450px;
      }
      .eval-subtitle {
        color: var(--klm-grey-500);
        margin: -0.5rem 0 1rem;
        font-size: 0.875rem;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .form-group.full-width {
        grid-column: 1 / -1;
      }
      .form-group label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--klm-grey-700);
      }
      .form-control {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--klm-grey-300);
        border-radius: var(--klm-radius-sm, 6px);
        font-size: 0.875rem;
        font-family: inherit;
        transition: border-color 0.15s;
      }
      .form-control:focus {
        outline: none;
        border-color: var(--klm-primary-blue);
        box-shadow: 0 0 0 3px rgba(0, 95, 150, 0.1);
      }
      select.form-control {
        appearance: auto;
      }
      textarea.form-control {
        resize: vertical;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.25rem;
        padding-top: 1rem;
        border-top: 1px solid var(--klm-grey-100);
      }
    `,
  ],
})
export class CotizacionComparacionComponent implements OnInit {
  private cotizacionService = inject(CotizacionService);
  private providerService = inject(ProviderService);
  private confirmService = inject(ConfirmService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  solicitudId!: number;
  comparacion: ComparacionResponse | null = null;
  providers: { id: number; razon_social: string; ruc: string }[] = [];
  loading = true;
  saving = false;
  showAddForm = false;
  evaluatingCotizacion: Cotizacion | null = null;
  evalPuntaje = 0;
  evalObservaciones = '';

  newCotizacion: Record<string, unknown> = {
    proveedor_id: null,
    tarifa_propuesta: null,
    tipo_tarifa: 'HORA',
    moneda: 'PEN',
    horas_incluidas: null,
    penalidad_exceso: null,
    plazo_entrega_dias: null,
    descripcion_equipo: '',
    condiciones_pago: '',
    condiciones_especiales: '',
    garantia: '',
    disponibilidad: '',
    observaciones: '',
  };

  get pageTitle(): string {
    if (!this.comparacion) return 'Cuadro Comparativo';
    return `Cuadro Comparativo — ${this.comparacion.solicitud.codigo}`;
  }

  get pageSubtitle(): string {
    if (!this.comparacion) return '';
    return `${this.comparacion.solicitud.tipo_equipo} × ${this.comparacion.solicitud.cantidad}`;
  }

  ngOnInit() {
    this.solicitudId = Number(this.route.snapshot.paramMap.get('solicitudId'));
    this.loadData();
    this.loadProviders();
  }

  loadData() {
    this.loading = true;
    this.cotizacionService.obtenerComparacion(this.solicitudId).subscribe({
      next: (data) => {
        this.comparacion = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadProviders() {
    this.providerService.getAll().subscribe({
      next: (providers) => {
        this.providers = providers.map((p) => ({
          id: p.id,
          razon_social: p.razon_social ?? '',
          ruc: p.ruc ?? '',
        }));
      },
      error: () => {
        this.providers = [];
      },
    });
  }

  canAddCotizacion(): boolean {
    if (!this.comparacion) return false;
    return (
      this.comparacion.solicitud.estado === 'APROBADO' &&
      !this.comparacion.resumen.cotizacion_seleccionada
    );
  }

  crearCotizacion() {
    if (!this.newCotizacion['proveedor_id'] || !this.newCotizacion['tarifa_propuesta']) return;
    this.saving = true;
    const dto = {
      ...this.newCotizacion,
      solicitud_equipo_id: this.solicitudId,
    };
    this.cotizacionService.crear(dto).subscribe({
      next: () => {
        this.saving = false;
        this.showAddForm = false;
        this.resetNewCotizacion();
        this.loadData();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  openEvaluar(cot: Cotizacion) {
    this.evaluatingCotizacion = cot;
    this.evalPuntaje = cot.puntaje ?? 0;
    this.evalObservaciones = cot.observaciones ?? '';
  }

  evaluarCotizacion() {
    if (!this.evaluatingCotizacion) return;
    this.saving = true;
    this.cotizacionService
      .evaluar(this.evaluatingCotizacion.id, this.evalPuntaje, this.evalObservaciones)
      .subscribe({
        next: () => {
          this.saving = false;
          this.evaluatingCotizacion = null;
          this.loadData();
        },
        error: () => {
          this.saving = false;
        },
      });
  }

  async seleccionarCotizacion(cot: Cotizacion) {
    const totalCots = this.comparacion?.resumen.total_cotizaciones ?? 0;
    const proveedorUnico = totalCots < 2;

    let message = `Seleccionar la cotización ${cot.codigo} (${cot.proveedor_nombre}) como ganadora. `;
    message +=
      'Esto creará automáticamente una Orden de Alquiler (OAL) y rechazará las demás cotizaciones.';

    if (proveedorUnico) {
      message += '\n\nNota: Solo hay 1 cotización registrada. Se marcará como proveedor único.';
    }

    const confirmed = await firstValueFrom(
      this.confirmService.confirm({
        title: 'Seleccionar Cotización',
        message,
        confirmLabel: 'Seleccionar',
      })
    );
    if (!confirmed) return;

    this.saving = true;
    this.cotizacionService.seleccionar(cot.id, undefined, proveedorUnico).subscribe({
      next: () => {
        this.saving = false;
        this.loadData();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  async rechazarCotizacion(cot: Cotizacion) {
    const confirmed = await firstValueFrom(
      this.confirmService.confirm({
        title: 'Rechazar Cotización',
        message: `¿Rechazar la cotización ${cot.codigo} de ${cot.proveedor_nombre}?`,
        confirmLabel: 'Rechazar',
        isDanger: true,
      })
    );
    if (!confirmed) return;

    this.cotizacionService.rechazar(cot.id).subscribe({
      next: () => this.loadData(),
    });
  }

  goBack() {
    this.router.navigate(['../../solicitudes', this.solicitudId], { relativeTo: this.route });
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'REGISTRADA':
        return 'info';
      case 'EVALUADA':
        return 'warning';
      case 'SELECCIONADA':
        return 'success';
      case 'RECHAZADA':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  private resetNewCotizacion() {
    this.newCotizacion = {
      proveedor_id: null,
      tarifa_propuesta: null,
      tipo_tarifa: 'HORA',
      moneda: 'PEN',
      horas_incluidas: null,
      penalidad_exceso: null,
      plazo_entrega_dias: null,
      descripcion_equipo: '',
      condiciones_pago: '',
      condiciones_especiales: '',
      garantia: '',
      disponibilidad: '',
      observaciones: '',
    };
  }
}
