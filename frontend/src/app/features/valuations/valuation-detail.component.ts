import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmService } from '../../core/services/confirm.service';
import { ValuationService, DeduccionManual } from '../../core/services/valuation.service';
import { AeroDataGridComponent, DataGridColumn } from '../../core/design-system';
import { Valuation, PaymentData, ValuationSummary } from '../../core/models/valuation.model';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentRecordList, PaymentSummary } from '../../core/models/payment-record.model';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';
import {
  EntityDetailShellComponent,
  EntityDetailSidebarCardComponent,
  EntityDetailHeader,
  AuditInfo,
  NotFoundConfig,
} from '../../shared/components/entity-detail';
import { AeroButtonComponent, AeroBadgeComponent, BreadcrumbItem } from '../../core/design-system';
import { AeroTabsComponent } from '../../shared/components/aero-tabs/aero-tabs.component';
import { TabItem } from '../../shared/components/page-layout/page-layout.component';
import { CombustiblePanelComponent } from '../equipment/associations/combustible-panel.component';
import { EdtPanelComponent } from '../equipment/associations/edt-panel.component';

@Component({
  selector: 'app-valuation-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DropdownComponent,
    EntityDetailShellComponent,
    EntityDetailSidebarCardComponent,
    AeroButtonComponent,
    AeroBadgeComponent,
    AeroTabsComponent,
    AeroDataGridComponent,
    CombustiblePanelComponent,
    EdtPanelComponent,
  ],
  template: `
    <app-entity-detail-shell
      [loading]="loading"
      [entity]="valuation"
      [header]="header"
      [auditInfo]="auditInfo"
      [notFound]="notFoundConfig"
      [backUrl]="'/equipment/valuations'"
      [breadcrumbs]="breadcrumbs"
      loadingText="Cargando detalles de la valorización..."
    >
      <!-- ── BELOW HEADER: deadline timeline ──────────────────── -->
      <!-- ── BELOW HEADER: deadline timeline ──────────────────── -->
      @if (valuation?.deadlines) {
        <div entity-header-below class="deadline-section-compact">
          <div class="deadline-tracker">
            <div
              class="tracker-step"
              [class.done]="isDeadlinePassed(valuation!.deadlines!.parcial)"
              [class.active]="
                !isDeadlinePassed(valuation!.deadlines!.parcial) &&
                !isDeadlineMissed(valuation!.deadlines!.parcial, valuation!.estado)
              "
              [class.overdue]="isDeadlineMissed(valuation!.deadlines!.parcial, valuation!.estado)"
            >
              <div class="tracker-dot"></div>
              <div class="tracker-label">Parcial (Día 5)</div>
              <div class="tracker-date">{{ valuation!.deadlines!.parcial | date: 'dd/MM' }}</div>
            </div>
            <div class="tracker-line"></div>
            <div
              class="tracker-step"
              [class.done]="isDeadlinePassed(valuation!.deadlines!.gasto_obra)"
              [class.active]="
                isDeadlinePassed(valuation!.deadlines!.parcial) &&
                !isDeadlinePassed(valuation!.deadlines!.gasto_obra)
              "
              [class.overdue]="
                isDeadlineMissed(valuation!.deadlines!.gasto_obra, valuation!.estado)
              "
            >
              <div class="tracker-dot"></div>
              <div class="tracker-label">Gasto Obra (Día 10)</div>
              <div class="tracker-date">{{ valuation!.deadlines!.gasto_obra | date: 'dd/MM' }}</div>
            </div>
            <div class="tracker-line"></div>
            <div
              class="tracker-step"
              [class.done]="isDeadlinePassed(valuation!.deadlines!.cierre)"
              [class.active]="
                isDeadlinePassed(valuation!.deadlines!.gasto_obra) &&
                !isDeadlinePassed(valuation!.deadlines!.cierre)
              "
              [class.overdue]="isDeadlineMissed(valuation!.deadlines!.cierre, valuation!.estado)"
            >
              <div class="tracker-dot"></div>
              <div class="tracker-label">Cierre (Día 15)</div>
              <div class="tracker-date">{{ valuation!.deadlines!.cierre | date: 'dd/MM' }}</div>
            </div>
          </div>
          @if (valuation!.deadlines!.alerta_vencimiento) {
            <div class="tracker-alert">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ valuation!.deadlines!.alerta_vencimiento }}
            </div>
          }
        </div>
      }

      <!-- ── MAIN CONTENT ─────────────────────────────────────── -->
      <div entity-main-content class="detail-sections">
        <app-aero-tabs
          [tabs]="tabs"
          [activeTabId]="activeTab"
          (tabChange)="onTabChange($event)"
        ></app-aero-tabs>

        <!-- ═══ TAB 1: RESUMEN ═══ -->
        @if (activeTab === 'resumen') {
          <section class="detail-section">
            <h2>Información General</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Período</span>
                <p>{{ valuation?.periodo }}</p>
              </div>
              <div class="info-item">
                <span class="label">Equipo</span>
                <p>
                  <a [routerLink]="['/equipment', valuation?.equipmentId]" class="link-primary">
                    {{ valuation?.codigo_equipo }}
                  </a>
                </p>
              </div>
              <div class="info-item">
                <span class="label">Contrato</span>
                <p>
                  @if (valuation?.contractId) {
                    <a
                      [routerLink]="['/equipment/operaciones/contratos', valuation?.contractId]"
                      class="link-primary"
                    >
                      {{ valuation?.contrato_numero || 'Ver Contrato' }}
                    </a>
                  } @else {
                    <span>Sin contrato</span>
                  }
                </p>
              </div>
              <div class="info-item">
                <span class="label">Cliente</span>
                <p>{{ valuation?.cliente_nombre || '-' }}</p>
              </div>
              <div class="info-item">
                <span class="label">Proveedor</span>
                <p>
                  {{
                    resumenData?.['proveedor_razon_social'] || valuation?.proveedor_nombre || '-'
                  }}
                </p>
              </div>
              @if (resumenData?.['proveedor_ruc']) {
                <div class="info-item">
                  <span class="label">RUC Proveedor</span>
                  <p>{{ resumenData?.['proveedor_ruc'] }}</p>
                </div>
              }
              <div class="info-item">
                <span class="label">Tipo de Tarifa</span>
                <p>{{ valuation?.tipoTarifa || '-' }}</p>
              </div>
              @if (resumenData?.['modalidad']) {
                <div class="info-item">
                  <span class="label">Modalidad</span>
                  <p>{{ resumenData?.['modalidad'] }}</p>
                </div>
              }
              @if (resumenData?.['moneda']) {
                <div class="info-item">
                  <span class="label">Moneda</span>
                  <p>{{ resumenData?.['moneda'] }}</p>
                </div>
              }
              @if (resumenData?.['tipo_cambio']) {
                <div class="info-item">
                  <span class="label">Tipo de Cambio</span>
                  <p>{{ resumenData?.['tipo_cambio'] }}</p>
                </div>
              }
              @if (resumenData?.['minimo_por']) {
                <div class="info-item">
                  <span class="label">Mínimo Por</span>
                  <p>{{ resumenData?.['minimo_por'] }} — {{ resumenData?.['cantidad_minima'] }}</p>
                </div>
              }
            </div>
          </section>

          <section class="detail-section">
            <h2>Resumen Financiero</h2>
            <div class="financial-table-container">
              <table class="financial-table">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th class="text-right">Cantidad</th>
                    <th class="text-right">Tarifa</th>
                    <th class="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="row-header">
                    <td colspan="4"><strong>Valorización</strong></td>
                  </tr>
                  <tr>
                    <td>Cantidad a Valorizar</td>
                    <td class="text-right">{{ resumenData?.['cantidad_a_valorizar'] }}</td>
                    <td class="text-right">
                      {{ resumenData?.['precio_unitario'] | currency: 'USD' }}
                    </td>
                    <td class="text-right">
                      {{ resumenData?.['valorizacion_bruta'] | currency: 'USD' }}
                    </td>
                  </tr>
                  @if (resumenData?.['descuento_combustible']) {
                    <tr>
                      <td>Descuento Combustible</td>
                      <td class="text-right">-</td>
                      <td class="text-right">-</td>
                      <td class="text-right text-danger">
                        -{{ resumenData?.['descuento_combustible'] | currency: 'USD' }}
                      </td>
                    </tr>
                  }
                  @if (resumenData?.['descuento_manipuleo']) {
                    <tr>
                      <td>Descuento Manipuleo</td>
                      <td class="text-right">-</td>
                      <td class="text-right">-</td>
                      <td class="text-right text-danger">
                        -{{ resumenData?.['descuento_manipuleo'] | currency: 'USD' }}
                      </td>
                    </tr>
                  }
                  @if (resumenData?.['descuento_gasto_obra']) {
                    <tr>
                      <td>Descuento Gasto en Obra</td>
                      <td class="text-right">-</td>
                      <td class="text-right">-</td>
                      <td class="text-right text-danger">
                        -{{ resumenData?.['descuento_gasto_obra'] | currency: 'USD' }}
                      </td>
                    </tr>
                  }
                  @if (resumenData?.['descuento_adelanto']) {
                    <tr>
                      <td>Descuento Adelanto</td>
                      <td class="text-right">-</td>
                      <td class="text-right">-</td>
                      <td class="text-right text-danger">
                        -{{ resumenData?.['descuento_adelanto'] | currency: 'USD' }}
                      </td>
                    </tr>
                  }
                  @if (resumenData?.['descuento_exceso_combustible']) {
                    <tr>
                      <td>Exceso Combustible</td>
                      <td class="text-right">-</td>
                      <td class="text-right">-</td>
                      <td class="text-right text-danger">
                        -{{ resumenData?.['descuento_exceso_combustible'] | currency: 'USD' }}
                      </td>
                    </tr>
                  }
                  @if (resumenData?.['total_descuento']) {
                    <tr class="row-subtotal">
                      <td colspan="3"><em>Total Descuentos</em></td>
                      <td class="text-right text-danger">
                        <em>-{{ resumenData?.['total_descuento'] | currency: 'USD' }}</em>
                      </td>
                    </tr>
                  }
                  <tr class="row-total">
                    <td colspan="3"><strong>Valorización Neta</strong></td>
                    <td class="text-right">
                      <strong>{{ resumenData?.['valorizacion_neta'] | currency: 'USD' }}</strong>
                    </td>
                  </tr>
                  @if (resumenData?.['igv_monto']) {
                    <tr>
                      <td colspan="3">IGV ({{ resumenData?.['igv_porcentaje'] || 18 }}%)</td>
                      <td class="text-right">{{ resumenData?.['igv_monto'] | currency: 'USD' }}</td>
                    </tr>
                  }
                  <tr class="row-grand-total">
                    <td colspan="3"><strong>Total con IGV</strong></td>
                    <td class="text-right">
                      <strong>{{ resumenData?.['total_con_igv'] | currency: 'USD' }}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="detail-section">
            <h2>Detalles del Período</h2>
            <div class="info-grid-2col">
              <div class="info-column">
                <div class="info-item">
                  <span class="label">Fecha Inicio</span>
                  <p>{{ valuation?.fechaInicio | date: 'dd/MM/yyyy' }}</p>
                </div>
                <div class="info-item">
                  <span class="label">Fecha Fin</span>
                  <p>{{ valuation?.fechaFin | date: 'dd/MM/yyyy' }}</p>
                </div>
                <div class="info-item">
                  <span class="label">Días Trabajados</span>
                  <p>{{ valuation?.diasTrabajados || '-' }}</p>
                </div>
                <div class="info-item">
                  <span class="label">Horas Totales</span>
                  <p>{{ valuation?.horasTotales || '-' }}</p>
                </div>
              </div>
              <div class="info-column">
                <div class="info-item">
                  <span class="label">Tarifa Base</span>
                  <p class="highlight">{{ valuation?.tarifa | currency: 'USD' }}</p>
                </div>
                <div class="info-item">
                  <span class="label">Monto Bruto</span>
                  <p>{{ valuation?.montoBruto | currency: 'USD' }}</p>
                </div>
                <div class="info-item">
                  <span class="label">Monto Neto</span>
                  <p class="highlight">{{ valuation?.montoNeto | currency: 'USD' }}</p>
                </div>
              </div>
            </div>
            @if (valuation?.observaciones) {
              <div class="observaciones-block">
                <span class="label">Observaciones</span>
                <div class="observaciones-text">{{ valuation?.observaciones }}</div>
              </div>
            }
          </section>

          <section class="detail-section payments-section">
            <div class="section-header">
              <h2>Pagos Registrados</h2>
              @if (valuation?.estado === 'APROBADO' || valuation?.estado === 'PAGADO') {
                <aero-button
                  variant="primary"
                  size="small"
                  iconLeft="fa-plus"
                  (clicked)="navigateToCreatePayment()"
                  >Registrar Pago</aero-button
                >
              }
            </div>

            @if (paymentSummary) {
              <div class="payment-summary-widget">
                <div class="summary-row">
                  <span class="summary-label">Total Valorización</span>
                  <span class="summary-value">{{
                    paymentSummary.totalValorizacion | currency: 'USD'
                  }}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Total Pagado</span>
                  <span class="summary-value text-success">
                    {{ paymentSummary.totalPagado | currency: 'USD' }}
                  </span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Saldo Pendiente</span>
                  <span
                    class="summary-value"
                    [class.text-warning]="paymentSummary.saldoPendiente > 0"
                  >
                    {{ paymentSummary.saldoPendiente | currency: 'USD' }}
                  </span>
                </div>
                <div class="progress-bar-container">
                  <div
                    class="progress-bar-fill"
                    [style.width.%]="paymentSummary.porcentajePagado"
                  ></div>
                </div>
                <p class="progress-label">
                  {{ paymentSummary.porcentajePagado | number: '1.0-0' }}% pagado
                </p>
              </div>
            }

            @if (loadingPayments) {
              <div class="loading-payments">
                <div class="spinner-small"></div>
                <span>Cargando pagos...</span>
              </div>
            } @else if (payments.length > 0) {
              <div class="payments-table-container">
                <table class="payments-table">
                  <thead>
                    <tr>
                      <th>N° Pago</th>
                      <th>Fecha</th>
                      <th>Método</th>
                      <th>Referencia</th>
                      <th class="text-right">Monto</th>
                      <th>Estado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (payment of payments; track payment.id) {
                      <tr>
                        <td>
                          <a
                            class="payment-link"
                            (click)="viewPayment(payment.id)"
                            (keydown.enter)="viewPayment(payment.id)"
                            tabindex="0"
                            style="cursor:pointer"
                          >
                            {{ payment.numero_pago || '#' + payment.id }}
                          </a>
                        </td>
                        <td>{{ payment.fecha_pago | date: 'dd/MM/yyyy' }}</td>
                        <td>{{ payment.metodo_pago }}</td>
                        <td>{{ payment.referencia_pago }}</td>
                        <td class="text-right amount-cell">
                          {{ payment.monto | currency: 'USD' }}
                        </td>
                        <td>
                          <aero-badge [variant]="getEstadoVariant(payment.estado)">{{
                            payment.estado
                          }}</aero-badge>
                        </td>
                        <td>
                          @if (payment.conciliado) {
                            <aero-badge variant="success">
                              <i class="fa-solid fa-check"></i> Conciliado
                            </aero-badge>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="empty-state-payments">
                <i class="fa-solid fa-money-bill-wave empty-icon"></i>
                <p class="empty-text">No hay pagos registrados para esta valorización.</p>
                @if (valuation?.estado === 'APROBADO') {
                  <aero-button
                    variant="primary"
                    size="small"
                    iconLeft="fa-plus"
                    (clicked)="navigateToCreatePayment()"
                    >Registrar Primer Pago</aero-button
                  >
                }
              </div>
            }
          </section>
        }

        <!-- ═══ TAB 2: RESUMEN ACUMULADO ═══ -->
        @if (activeTab === 'acumulado') {
          <section class="detail-section">
            <h2>Resumen Acumulado del Contrato</h2>
            <aero-data-grid
              [gridId]="'valuation-detail'"
              [columns]="acumuladoColumns"
              [data]="acumuladoData"
              [loading]="loadingTab"
              [dense]="true"
              [footerRow]="acumuladoFooter"
              [highlightRow]="isCurrentValuation"
              [templates]="{ estado: estadoBadgeTpl }"
              [showColumnChooser]="true"
              emptyMessage="No hay valorizaciones previas para este contrato."
              emptyIcon="fa-layer-group"
            ></aero-data-grid>
            <ng-template #estadoBadgeTpl let-row>
              <aero-badge [variant]="getEstadoVariant(row['estado'] + '')">{{
                row['estado']
              }}</aero-badge>
            </ng-template>
          </section>
        }

        <!-- ═══ TAB 3: PARTE DIARIO ═══ -->
        @if (activeTab === 'partes') {
          <section class="detail-section">
            <h2>Partes Diarios del Período</h2>
            <aero-data-grid
              [columns]="partesColumns"
              [data]="partesData"
              [loading]="loadingTab"
              [dense]="true"
              [footerRow]="partesFooter"
              [showColumnChooser]="true"
              [templates]="{ edt_resumen: edtResumenTpl }"
              (rowClick)="onParteRowClick($event)"
              emptyMessage="No hay partes diarios vinculados a esta valorización."
              emptyIcon="fa-clipboard-list"
              gridId="valorizacion-partes"
            ></aero-data-grid>
            <ng-template #edtResumenTpl let-row>
              @if (row['edt_count'] > 0) {
                <div class="edt-cell">
                  <span class="edt-summary">{{ row['edt_resumen'] }}</span>
                  <span
                    class="edt-badge"
                    [class.complete]="row['edt_porcentaje_total'] === 100"
                    [class.incomplete]="row['edt_porcentaje_total'] !== 100"
                  >
                    {{ row['edt_porcentaje_total'] }}%
                  </span>
                </div>
              } @else {
                <span class="edt-empty"> <i class="fa-solid fa-plus-circle"></i> Asignar EDT </span>
              }
            </ng-template>
          </section>

          <!-- EDT Modal -->
          @if (selectedParteForEdt) {
            <div class="modal" (click)="closeEdtModal()" tabindex="0" role="button">
              <div
                class="modal-content modal-lg"
                (click)="$event.stopPropagation()"
                tabindex="0"
                role="dialog"
              >
                <div class="modal-header">
                  <h2>EDT — Parte #{{ selectedParteForEdt['numero_parte'] }}</h2>
                  <aero-button
                    variant="text"
                    iconCenter="fa-xmark"
                    (clicked)="closeEdtModal()"
                  ></aero-button>
                </div>
                <div class="modal-body">
                  <app-edt-panel
                    [parteDiarioId]="selectedParteForEdt['id']"
                    (saved)="closeEdtModal()"
                  ></app-edt-panel>
                </div>
              </div>
            </div>
          }
        }

        <!-- ═══ TAB 4: COMBUSTIBLE ═══ -->
        @if (activeTab === 'combustible') {
          <section class="detail-section">
            <h2>Vales de Combustible</h2>
            @if (!loadingTab && combustibleData && combustibleData['resumen']) {
              <div class="combustible-summary">
                <div class="summary-row">
                  <span class="summary-label">Total Galones</span>
                  <span class="summary-value">{{
                    combustibleData['resumen']['total_galones'] | number: '1.2-2'
                  }}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Precio Promedio</span>
                  <span class="summary-value">{{
                    combustibleData['resumen']['precio_promedio'] | currency: 'USD'
                  }}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Total Importe</span>
                  <span class="summary-value">{{
                    combustibleData['resumen']['total_importe'] | currency: 'USD'
                  }}</span>
                </div>
                @if (combustibleData['resumen']['ratio']) {
                  <div class="summary-row">
                    <span class="summary-label">Ratio (gal/H-M)</span>
                    <span class="summary-value">{{
                      combustibleData['resumen']['ratio'] | number: '1.2-2'
                    }}</span>
                  </div>
                }
              </div>
            }
            <aero-data-grid
              [columns]="combustibleColumns"
              [data]="combustibleVales"
              [loading]="loadingTab"
              [dense]="true"
              [showColumnChooser]="true"
              emptyMessage="No hay vales de combustible vinculados a esta valorización."
              emptyIcon="fa-gas-pump"
            ></aero-data-grid>
          </section>
        }

        <!-- ═══ TAB 5: GASTO EN OBRA ═══ -->
        @if (activeTab === 'gastos') {
          <section class="detail-section">
            <div class="section-header">
              <h2>Gastos en Obra</h2>
              @if (valuation?.estado === 'BORRADOR') {
                <aero-button
                  variant="primary"
                  size="small"
                  iconLeft="fa-plus"
                  (clicked)="showAddGastoModal = true"
                  >Agregar Gasto</aero-button
                >
              }
            </div>
            <aero-data-grid
              [columns]="gastosColumns"
              [data]="gastosData"
              [loading]="loadingTab"
              [dense]="true"
              [footerRow]="gastosFooter"
              [actionsTemplate]="valuation?.estado === 'BORRADOR' ? gastoActionsTpl : undefined"
              [templates]="{ incluye_igv: igvTpl }"
              [showColumnChooser]="true"
              emptyMessage="No hay gastos en obra registrados."
              emptyIcon="fa-receipt"
            ></aero-data-grid>
            <ng-template #gastoActionsTpl let-row>
              <aero-button
                variant="ghost"
                size="small"
                iconCenter="fa-trash-can"
                title="Eliminar"
                (clicked)="removeGasto(row['id'])"
              ></aero-button>
            </ng-template>
            <ng-template #igvTpl let-row>
              {{ row['incluye_igv'] ? 'Sí' : 'No' }}
            </ng-template>
          </section>
        }

        <!-- ═══ TAB 6: ADELANTOS ═══ -->
        @if (activeTab === 'adelantos') {
          <section class="detail-section">
            <div class="section-header">
              <h2>Adelantos y Amortizaciones</h2>
              @if (valuation?.estado === 'BORRADOR') {
                <aero-button
                  variant="primary"
                  size="small"
                  iconLeft="fa-plus"
                  (clicked)="showAddAdelantoModal = true"
                  >Agregar Adelanto</aero-button
                >
              }
            </div>
            <aero-data-grid
              [columns]="adelantosColumns"
              [data]="adelantosData"
              [loading]="loadingTab"
              [dense]="true"
              [footerRow]="adelantosFooter"
              [actionsTemplate]="valuation?.estado === 'BORRADOR' ? adelantoActionsTpl : undefined"
              [templates]="{ tipo_operacion: tipoOpTpl }"
              [showColumnChooser]="true"
              emptyMessage="No hay adelantos ni amortizaciones registrados."
              emptyIcon="fa-hand-holding-dollar"
            ></aero-data-grid>
            <ng-template #adelantoActionsTpl let-row>
              <aero-button
                variant="ghost"
                size="small"
                iconCenter="fa-trash-can"
                title="Eliminar"
                (clicked)="removeAdelanto(row['id'])"
              ></aero-button>
            </ng-template>
            <ng-template #tipoOpTpl let-row>
              <aero-badge
                [variant]="row['tipo_operacion'] === 'AMORTIZACION' ? 'success' : 'warning'"
              >
                {{ row['tipo_operacion'] }}
              </aero-badge>
            </ng-template>
          </section>
        }

        <!-- ═══ TAB 7: ANÁLISIS DE COMBUSTIBLE ═══ -->
        @if (activeTab === 'analisis') {
          <section class="detail-section">
            <h2>Análisis de Combustible</h2>
            @if (loadingTab) {
              <div class="loading-payments">
                <div class="spinner-small"></div>
                <span>Cargando...</span>
              </div>
            } @else if (analisisData.length > 0) {
              @for (a of analisisData; track a['id']) {
                <div class="analisis-card">
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="label">Consumo Combustible (gal)</span>
                      <p>{{ a['consumo_combustible'] | number: '1.2-2' }}</p>
                    </div>
                    <div class="info-item">
                      <span class="label">Tipo Medidor</span>
                      <p>{{ a['tipo_horometro_odometro'] || '-' }}</p>
                    </div>
                    <div class="info-item">
                      <span class="label">Lectura Inicio</span>
                      <p>{{ a['lectura_inicio'] | number: '1.2-4' }}</p>
                    </div>
                    <div class="info-item">
                      <span class="label">Lectura Final</span>
                      <p>{{ a['lectura_final'] | number: '1.2-4' }}</p>
                    </div>
                    <div class="info-item">
                      <span class="label">Total Uso</span>
                      <p>{{ a['total_uso'] | number: '1.2-4' }}</p>
                    </div>
                    <div class="info-item">
                      <span class="label">Rendimiento</span>
                      <p class="highlight">{{ a['rendimiento'] | number: '1.2-4' }}</p>
                    </div>
                  </div>

                  <div class="analisis-editable">
                    <div class="form-group">
                      <span class="label">Ratio Control</span>
                      <input
                        type="number"
                        class="form-control"
                        [ngModel]="a['ratio_control']"
                        (ngModelChange)="a['ratio_control'] = $event; recalcAnalisis(a)"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div class="form-group">
                      <span class="label">Precio Unitario</span>
                      <input
                        type="number"
                        class="form-control"
                        [ngModel]="a['precio_unitario']"
                        (ngModelChange)="a['precio_unitario'] = $event; recalcAnalisis(a)"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <aero-button
                      variant="secondary"
                      size="small"
                      iconLeft="fa-floppy-disk"
                      (clicked)="saveAnalisis(a)"
                      >Guardar</aero-button
                    >
                  </div>

                  <div class="analisis-results">
                    <div class="info-item">
                      <span class="label">Diferencia</span>
                      <p>{{ a['diferencia'] | number: '1.2-4' }}</p>
                    </div>
                    <div class="info-item">
                      <span class="label">Exceso Combustible (gal)</span>
                      <p [class.text-danger]="(a['exceso_combustible'] || 0) > 0">
                        {{ a['exceso_combustible'] | number: '1.2-4' }}
                      </p>
                    </div>
                    <div class="info-item">
                      <span class="label">Importe Exceso</span>
                      <p class="highlight" [class.text-danger]="(a['importe_exceso'] || 0) > 0">
                        {{ a['importe_exceso'] | currency: 'USD' }}
                      </p>
                    </div>
                  </div>
                </div>
              }
            } @else {
              <p class="empty-docs">
                No hay análisis de combustible. Ejecute "Valorizar" para generar el análisis.
              </p>
            }
          </section>
        }

        <!-- ═══ TAB 8: CONSUMO EQUIPO (Legacy) ═══ -->
        @if (activeTab === 'consumo_legacy') {
          <section class="detail-section">
            <h2>Consumo de Combustible por Equipo</h2>
            <app-combustible-panel
              [valorizacionLegacyId]="valuation?.legacyId || ''"
            ></app-combustible-panel>
          </section>
        }
      </div>

      <!-- ── SIDEBAR: WORKFLOW ACTIONS ─────────────────────────── -->
      <ng-container entity-sidebar-actions>
        @if (valuation) {
          <!-- BORRADOR -->
          @if (valuation.estado === 'BORRADOR') {
            <aero-button
              variant="primary"
              [fullWidth]="true"
              iconLeft="fa-paper-plane"
              [disabled]="processingWorkflow"
              (clicked)="submitDraft()"
              >{{ processingWorkflow ? 'Procesando...' : 'Marcar como Pendiente' }}</aero-button
            >
            <aero-button
              variant="secondary"
              [fullWidth]="true"
              iconLeft="fa-pen"
              (clicked)="editValuation()"
              >Editar Valorización</aero-button
            >
            <aero-button
              variant="secondary"
              [fullWidth]="true"
              iconLeft="fa-calculator"
              [disabled]="valorizando"
              (clicked)="runValorizar()"
              >{{ valorizando ? 'Valorizando...' : 'Valorizar' }}</aero-button
            >
            <aero-button
              variant="secondary"
              [fullWidth]="true"
              iconLeft="fa-calculator"
              [disabled]="recalculating"
              (clicked)="recalculate()"
              >{{ recalculating ? 'Recalculando...' : 'Recalcular' }}</aero-button
            >
          }

          <!-- PENDIENTE -->
          @if (valuation.estado === 'PENDIENTE') {
            <aero-button
              variant="primary"
              [fullWidth]="true"
              iconLeft="fa-paper-plane"
              [disabled]="processingWorkflow || !valuation.conformidadProveedor"
              (clicked)="submitForReview()"
              >{{ processingWorkflow ? 'Procesando...' : 'Enviar a Revisión' }}</aero-button
            >
          }

          <!-- EN_REVISION -->
          @if (valuation.estado === 'EN_REVISION' && canValidate()) {
            <aero-button
              variant="primary"
              [fullWidth]="true"
              iconLeft="fa-check-double"
              [disabled]="processingWorkflow"
              (clicked)="confirmValidate()"
              >{{ processingWorkflow ? 'Procesando...' : 'Validar' }}</aero-button
            >
          }

          <!-- VALIDADO -->
          @if (valuation.estado === 'VALIDADO' && canApprove()) {
            <aero-button
              variant="primary"
              [fullWidth]="true"
              iconLeft="fa-circle-check"
              [disabled]="processingWorkflow"
              (clicked)="showApproveModal = true"
              >Aprobar Valorización</aero-button
            >
          }

          <!-- APROBADO + canMarkAsPaid -->
          @if (valuation.estado === 'APROBADO' && canMarkAsPaid()) {
            <aero-button
              variant="primary"
              [fullWidth]="true"
              iconLeft="fa-money-check-dollar"
              [disabled]="processingWorkflow"
              (clicked)="showMarkPaidModal = true"
              >Marcar como Pagada</aero-button
            >
          }

          <!-- RECHAZADO -->
          @if (valuation.estado === 'RECHAZADO') {
            <aero-button
              variant="secondary"
              [fullWidth]="true"
              iconLeft="fa-rotate-left"
              [disabled]="processingWorkflow"
              (clicked)="confirmReopen()"
              >{{ processingWorkflow ? 'Procesando...' : 'Reabrir Valorización' }}</aero-button
            >
          }

          <!-- Reject (multi-state) -->
          @if (canRejectCurrentState() && canReject()) {
            <aero-button
              variant="danger"
              [fullWidth]="true"
              iconLeft="fa-ban"
              [disabled]="processingWorkflow"
              (clicked)="showRejectModal = true"
              >Rechazar</aero-button
            >
          }

          <!-- Workflow hint -->
          @if (getWorkflowHint()) {
            <p class="workflow-hint">{{ getWorkflowHint() }}</p>
          }

          <hr style="border:none;border-top:1px solid var(--grey-100);margin:var(--s-8) 0" />

          <!-- Common actions -->
          <aero-button
            variant="secondary"
            [fullWidth]="true"
            iconLeft="fa-file-pdf"
            (clicked)="downloadPDF()"
            >Descargar PDF</aero-button
          >
          <aero-button
            variant="ghost"
            [fullWidth]="true"
            iconLeft="fa-pen-to-square"
            (clicked)="editValuation()"
            >Editar Detalles</aero-button
          >
          <aero-button
            variant="danger"
            [fullWidth]="true"
            iconLeft="fa-trash-can"
            (clicked)="deleteValuation()"
            >Eliminar</aero-button
          >
        }
      </ng-container>

      <!-- ── SIDEBAR: EXTRA CARDS ───────────────────────────────── -->

      <!-- Conformidad del Proveedor -->
      @if (valuation) {
        <app-entity-detail-sidebar-card entity-sidebar-after title="Conformidad del Proveedor">
          @if (valuation.conformidadProveedor) {
            <div class="conformidad-status conformidad-ok">
              <i class="fa-solid fa-circle-check"></i>
              <div>
                <strong>Conformidad registrada</strong>
                <p>{{ valuation.conformidadProveedor.fecha | date: 'dd/MM/yyyy' }}</p>
                @if (valuation.conformidadProveedor.observaciones) {
                  <p class="conformidad-obs">{{ valuation.conformidadProveedor.observaciones }}</p>
                }
              </div>
            </div>
          } @else {
            <div class="conformidad-status conformidad-pending">
              <i class="fa-solid fa-clock"></i>
              <div>
                <strong>Pendiente de conformidad</strong>
                <p>El proveedor aún no ha dado su conformidad.</p>
              </div>
            </div>
            @if (valuation.estado === 'PENDIENTE') {
              <aero-button
                variant="secondary"
                [fullWidth]="true"
                iconLeft="fa-signature"
                class="mt-8"
                (clicked)="showConformidadModal = true"
                >Registrar Conformidad</aero-button
              >
            }
          }
        </app-entity-detail-sidebar-card>
      }

      <!-- Descuentos (Anexo B) -->
      @if (valuation && (valuation.estado === 'BORRADOR' || discountEvents.length > 0)) {
        <app-entity-detail-sidebar-card entity-sidebar-after title="Descuentos (Anexo B)">
          <p class="section-hint">Eventos de descuento aplicados a la valorización.</p>
          @if (discountEvents.length > 0) {
            <div class="discount-events-list">
              @for (event of discountEvents; track event.id) {
                <div class="discount-event-item">
                  <div class="discount-event-header">
                    <span class="discount-event-type">
                      {{ event.tipo }}
                      @if (event.subtipo) {
                        · {{ event.subtipo }}
                      }
                    </span>
                    <span class="discount-event-date">{{ event.fecha | date: 'dd/MM/yy' }}</span>
                  </div>
                  <div class="discount-event-values">
                    @if (event.aplica_descuento === false && event.subtipo) {
                      <span class="no-discount-badge">Sin descuento</span>
                    } @else if (event.aplica_descuento === true) {
                      @if (event.descuento_calculado_horas) {
                        <span class="calc-badge"
                          >{{ event.descuento_calculado_horas }}h calculado</span
                        >
                      }
                      @if (event.descuento_calculado_dias) {
                        <span class="calc-badge"
                          >{{ event.descuento_calculado_dias }}d calculado</span
                        >
                      }
                    } @else {
                      @if (event.horas_descuento) {
                        <span>{{ event.horas_descuento }}h descuento</span>
                      }
                      @if (event.dias_descuento) {
                        <span>{{ event.dias_descuento }}d descuento</span>
                      }
                    }
                  </div>
                  @if (event.descripcion) {
                    <p class="discount-event-desc">{{ event.descripcion }}</p>
                  }
                  @if (valuation.estado === 'BORRADOR') {
                    <aero-button
                      variant="ghost"
                      size="small"
                      iconCenter="fa-trash-can"
                      title="Eliminar evento"
                      (clicked)="removeDiscountEvent(event.id)"
                    ></aero-button>
                  }
                </div>
              }
            </div>
          } @else {
            <p class="empty-docs">Sin descuentos registrados.</p>
          }
          @if (valuation.estado === 'BORRADOR') {
            <aero-button
              variant="secondary"
              [fullWidth]="true"
              iconLeft="fa-plus"
              class="mt-8"
              (clicked)="showAddDiscountModal = true"
              >Agregar Descuento</aero-button
            >
          }
        </app-entity-detail-sidebar-card>
      }

      <!-- Deducciones Manuales (WS-38) -->
      @if (
        valuation &&
        (valuation.estado === 'BORRADOR' ||
          valuation.estado === 'PENDIENTE' ||
          manualDeductions.length > 0)
      ) {
        <app-entity-detail-sidebar-card entity-sidebar-after title="Deducciones Manuales">
          <p class="section-hint">Deducciones por repuestos, combustible, adelantos, etc.</p>
          @if (manualDeductions.length > 0) {
            <div class="deductions-list">
              @for (ded of manualDeductions; track ded.id) {
                <div class="deduction-item">
                  <div class="deduction-header">
                    <span class="deduction-type-badge">{{ translateDeductionType(ded.tipo) }}</span>
                    <span class="deduction-amount"
                      >-{{ ded.monto | currency: 'PEN' : 'symbol' : '1.2-2' }}</span
                    >
                  </div>
                  <p class="deduction-concepto">{{ ded.concepto }}</p>
                  @if (ded.num_documento) {
                    <p class="deduction-meta">Doc: {{ ded.num_documento }}</p>
                  }
                  @if (ded.fecha) {
                    <p class="deduction-meta">{{ ded.fecha | date: 'dd/MM/yy' }}</p>
                  }
                  @if (valuation.estado === 'BORRADOR' || valuation.estado === 'PENDIENTE') {
                    <aero-button
                      variant="ghost"
                      size="small"
                      iconCenter="fa-trash-can"
                      title="Eliminar deducción"
                      (clicked)="removeManualDeduction(ded.id)"
                    ></aero-button>
                  }
                </div>
              }
              <div class="deductions-total">
                <span>Total Deducciones:</span>
                <strong>-{{ totalManualDeductions | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
              </div>
            </div>
          } @else {
            <p class="empty-docs">Sin deducciones manuales registradas.</p>
          }
          @if (valuation.estado === 'BORRADOR' || valuation.estado === 'PENDIENTE') {
            <aero-button
              variant="secondary"
              [fullWidth]="true"
              iconLeft="fa-plus"
              class="mt-8"
              (clicked)="showAddDeductionModal = true"
              >Agregar Deducción</aero-button
            >
          }
        </app-entity-detail-sidebar-card>
      }

      <!-- Documentos de Pago -->
      @if (paymentDocs.length > 0) {
        <app-entity-detail-sidebar-card entity-sidebar-after title="Documentos de Pago">
          <div class="payment-docs-list">
            @for (doc of paymentDocs; track doc.id) {
              <div class="pay-doc-item">
                <div class="pay-doc-header">
                  <span class="pay-doc-type">{{ translatePayDocType(doc.tipo) }}</span>
                  <span
                    class="pay-doc-badge"
                    [class.pay-doc-pendiente]="doc.estado === 'PENDIENTE'"
                    [class.pay-doc-presentado]="doc.estado === 'PRESENTADO'"
                    [class.pay-doc-aprobado]="doc.estado === 'APROBADO'"
                    [class.pay-doc-rechazado]="doc.estado === 'RECHAZADO'"
                    >{{ doc.estado }}</span
                  >
                </div>
                @if (doc.numero || doc.fecha_vencimiento) {
                  <p class="pay-doc-meta">
                    @if (doc.numero) {
                      {{ doc.numero }}
                    }
                    @if (doc.fecha_vencimiento) {
                      · Vence: {{ doc.fecha_vencimiento | date: 'dd/MM/yy' }}
                    }
                  </p>
                }
              </div>
            }
          </div>
        </app-entity-detail-sidebar-card>
      }
    </app-entity-detail-shell>

    <!-- ── MODALS ──────────────────────────────────────────────── -->

    <!-- Approve Modal -->
    @if (showApproveModal) {
      <div
        class="modal"
        (click)="showApproveModal = false"
        (keydown.enter)="showApproveModal = false"
        tabindex="0"
        role="button"
      >
        <div
          class="modal-content"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="dialog"
        >
          <div class="modal-header">
            <h2>Confirmar Aprobación</h2>
            <aero-button
              variant="ghost"
              size="small"
              iconCenter="fa-xmark"
              (clicked)="showApproveModal = false"
            ></aero-button>
          </div>
          <div class="modal-body">
            <p>¿Confirmas la aprobación final de esta valorización?</p>
            @if (valuation) {
              <div class="approval-summary">
                <p><strong>Valorización:</strong> {{ valuation.numeroValorizacion }}</p>
                <p><strong>Monto Total:</strong> {{ valuation.montoNeto | currency: 'USD' }}</p>
                <p><strong>Período:</strong> {{ valuation.periodo }}</p>
              </div>
            }
            <p class="alert alert-warning">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Esta acción es definitiva y pasará la valorización a estado APROBADO.
            </p>
          </div>
          <div class="modal-footer">
            <aero-button variant="secondary" (clicked)="showApproveModal = false"
              >Cancelar</aero-button
            >
            <aero-button
              variant="primary"
              [disabled]="processingWorkflow"
              (clicked)="confirmApprove()"
              >{{ processingWorkflow ? 'Aprobando...' : 'Confirmar Aprobación' }}</aero-button
            >
          </div>
        </div>
      </div>
    }

    <!-- Reject Modal -->
    @if (showRejectModal) {
      <div
        class="modal"
        (click)="showRejectModal = false"
        (keydown.enter)="showRejectModal = false"
        tabindex="0"
        role="button"
      >
        <div
          class="modal-content"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="dialog"
        >
          <div class="modal-header">
            <h2>Rechazar Valorización</h2>
            <aero-button
              variant="ghost"
              size="small"
              iconCenter="fa-xmark"
              (clicked)="showRejectModal = false"
            ></aero-button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="rejectReason"> Motivo de Rechazo <span class="required">*</span> </label>
              <textarea
                id="rejectReason"
                class="form-control"
                rows="4"
                [(ngModel)]="rejectReason"
                placeholder="Ingrese el motivo del rechazo..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <aero-button variant="secondary" (clicked)="showRejectModal = false"
              >Cancelar</aero-button
            >
            <aero-button
              variant="danger"
              [disabled]="processingWorkflow || !rejectReason"
              (clicked)="confirmReject()"
              >{{ processingWorkflow ? 'Rechazando...' : 'Confirmar Rechazo' }}</aero-button
            >
          </div>
        </div>
      </div>
    }

    <!-- Mark as Paid Modal -->
    @if (showMarkPaidModal) {
      <div
        class="modal"
        (click)="showMarkPaidModal = false"
        (keydown.enter)="showMarkPaidModal = false"
        tabindex="0"
        role="button"
      >
        <div
          class="modal-content"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="dialog"
        >
          <div class="modal-header">
            <h2>Registrar Pago</h2>
            <aero-button
              variant="ghost"
              size="small"
              iconCenter="fa-xmark"
              (clicked)="showMarkPaidModal = false"
            ></aero-button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <span class="label">Fecha de Pago<span class="required">*</span></span>
              <input type="date" class="form-control" [(ngModel)]="paymentData.fecha_pago" />
            </div>
            <div class="form-group">
              <span class="label">Método de Pago<span class="required">*</span></span>
              <app-dropdown
                [options]="paymentMethodOptions"
                [placeholder]="'Seleccionar método'"
                [(value)]="paymentData.metodo_pago"
              ></app-dropdown>
            </div>
            <div class="form-group">
              <span class="label"
                >Referencia / Número de Operación<span class="required">*</span></span
              >
              <input
                type="text"
                class="form-control"
                [(ngModel)]="paymentData.referencia_pago"
                placeholder="Ej: TRF-2024-001"
              />
            </div>
          </div>
          <div class="modal-footer">
            <aero-button variant="secondary" (clicked)="showMarkPaidModal = false"
              >Cancelar</aero-button
            >
            <aero-button
              variant="primary"
              [disabled]="processingWorkflow || !isPaymentDataValid()"
              (clicked)="confirmMarkAsPaid()"
              >{{ processingWorkflow ? 'Guardando...' : 'Confirmar Pago' }}</aero-button
            >
          </div>
        </div>
      </div>
    }

    <!-- Add Discount Event Modal -->
    @if (showAddDiscountModal) {
      <div
        class="modal"
        (click)="showAddDiscountModal = false"
        (keydown.enter)="showAddDiscountModal = false"
        tabindex="0"
        role="button"
      >
        <div
          class="modal-content"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="dialog"
        >
          <div class="modal-header">
            <h2>Agregar Evento de Descuento</h2>
            <aero-button
              variant="ghost"
              size="small"
              iconCenter="fa-xmark"
              (clicked)="showAddDiscountModal = false"
            ></aero-button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <span class="label">Fecha<span class="required">*</span></span>
              <input type="date" class="form-control" [(ngModel)]="newDiscountEvent.fecha" />
            </div>
            <div class="form-group">
              <span class="label">Tipo de Descuento<span class="required">*</span></span>
              <app-dropdown
                [options]="discountTypeOptions"
                [placeholder]="'Seleccionar tipo'"
                [(value)]="newDiscountEvent.tipo"
                (valueChange)="onDiscountTipoChange()"
              ></app-dropdown>
            </div>
            @if (currentSubtipoOptions.length > 0) {
              <div class="form-group">
                <span class="label">Subtipo<span class="required">*</span></span>
                <app-dropdown
                  [options]="currentSubtipoOptions"
                  [placeholder]="'Seleccionar subtipo'"
                  [(value)]="newDiscountEvent.subtipo"
                  (valueChange)="onDiscountSubtipoChange()"
                ></app-dropdown>
                <small class="form-hint"
                  >Define la regla de descuento aplicable (PRD Anexo B)</small
                >
              </div>

              @if (discountRuleBadge) {
                <div class="alert" [ngClass]="discountRuleBadge.cls">
                  <i class="fa-solid" [ngClass]="discountRuleBadge.icon"></i>
                  {{ discountRuleBadge.text }}
                </div>
              }
            }
            @if (showHorasHorometro) {
              <div class="form-group">
                <span class="label">Horas Horómetro (Mecánica)<span class="required">*</span></span>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="newDiscountEvent.horas_horometro_mecanica"
                  min="0"
                  step="0.5"
                  placeholder="Horas registradas en horómetro"
                />
                <small class="form-hint">Se calcularán días proporcionales: h / 8</small>
              </div>
            }
            @if (showHorasDescuento) {
              <div class="form-group">
                <span class="label">Horas de Paralización</span>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="newDiscountEvent.horas_descuento"
                  min="0"
                  step="0.5"
                  (input)="onHorasDescuentoChange()"
                />
                @if (
                  newDiscountEvent.tipo === 'AVERIA' && newDiscountEvent.subtipo === 'ARRENDADOR'
                ) {
                  <small class="form-hint">
                    @if ((newDiscountEvent.horas_descuento || 0) >= 5) {
                      <span class="rule-enforced"
                        ><i class="fa-solid fa-check-circle"></i> ≥5h → 1 día completo
                        aplicado</span
                      >
                    } @else {
                      <span>Regla: &lt;5h proporcional / ≥5h = 1 día completo</span>
                    }
                  </small>
                }
              </div>
            }
            @if (!newDiscountEvent.subtipo) {
              <div class="form-group">
                <span class="label">Días de Descuento (manual)</span>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="newDiscountEvent.dias_descuento"
                  min="0"
                  step="0.5"
                />
              </div>
            }
            <div class="form-group">
              <span class="label">Descripción</span>
              <textarea
                class="form-control"
                rows="3"
                [(ngModel)]="newDiscountEvent.descripcion"
                placeholder="Descripción del evento..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <aero-button variant="secondary" (clicked)="showAddDiscountModal = false"
              >Cancelar</aero-button
            >
            <aero-button
              variant="primary"
              [disabled]="!newDiscountEvent.fecha || !newDiscountEvent.tipo"
              (clicked)="confirmAddDiscountEvent()"
              >Agregar Descuento</aero-button
            >
          </div>
        </div>
      </div>
    }

    <!-- Add Manual Deduction Modal -->
    @if (showAddDeductionModal) {
      <div
        class="modal"
        (click)="showAddDeductionModal = false"
        (keydown.enter)="showAddDeductionModal = false"
        tabindex="0"
        role="button"
      >
        <div
          class="modal-content"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="dialog"
        >
          <div class="modal-header">
            <h2>Agregar Deducción Manual</h2>
            <aero-button
              variant="ghost"
              size="small"
              iconCenter="fa-xmark"
              (clicked)="showAddDeductionModal = false"
            ></aero-button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <span class="label">Tipo de Deducción<span class="required">*</span></span>
              <app-dropdown
                [options]="deductionTypeOptions"
                [placeholder]="'Seleccionar tipo'"
                [(value)]="newDeduction.tipo"
              ></app-dropdown>
            </div>
            <div class="form-group">
              <span class="label">Concepto<span class="required">*</span></span>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="newDeduction.concepto"
                placeholder="Descripción de la deducción..."
              />
            </div>
            <div class="form-group">
              <span class="label">Monto (S/)<span class="required">*</span></span>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="newDeduction.monto"
                min="0.01"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div class="form-group">
              <span class="label">N° Documento</span>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="newDeduction.num_documento"
                placeholder="Factura, boleta, etc."
              />
            </div>
            <div class="form-group">
              <span class="label">Fecha</span>
              <input type="date" class="form-control" [(ngModel)]="newDeduction.fecha" />
            </div>
            <div class="form-group">
              <span class="label">Observaciones</span>
              <textarea
                class="form-control"
                rows="3"
                [(ngModel)]="newDeduction.observaciones"
                placeholder="Notas adicionales..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <aero-button variant="secondary" (clicked)="showAddDeductionModal = false"
              >Cancelar</aero-button
            >
            <aero-button
              variant="primary"
              [disabled]="
                !newDeduction.tipo ||
                !newDeduction.concepto ||
                !newDeduction.monto ||
                newDeduction.monto <= 0
              "
              (clicked)="confirmAddDeduction()"
              >Agregar Deducción</aero-button
            >
          </div>
        </div>
      </div>
    }

    <!-- Add Gasto en Obra Modal -->
    @if (showAddGastoModal) {
      <div class="modal" (click)="showAddGastoModal = false" tabindex="0" role="button">
        <div class="modal-content" (click)="$event.stopPropagation()" tabindex="0" role="dialog">
          <div class="modal-header">
            <h2>Agregar Gasto en Obra</h2>
            <aero-button
              variant="ghost"
              size="small"
              iconCenter="fa-xmark"
              (clicked)="showAddGastoModal = false"
            ></aero-button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <span class="label">Fecha<span class="required">*</span></span>
              <input type="date" class="form-control" [(ngModel)]="newGasto.fecha" />
            </div>
            <div class="form-group">
              <span class="label">Proveedor</span>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="newGasto.proveedor"
                placeholder="Nombre del proveedor"
              />
            </div>
            <div class="form-group">
              <span class="label">Concepto<span class="required">*</span></span>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="newGasto.concepto"
                placeholder="Descripción del gasto"
              />
            </div>
            <div class="form-group">
              <span class="label">Tipo Documento</span>
              <app-dropdown
                [options]="tipoDocOptions"
                [placeholder]="'Seleccionar'"
                [(value)]="newGasto.tipo_documento"
              ></app-dropdown>
            </div>
            <div class="form-group">
              <span class="label">N° Documento</span>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="newGasto.numero_documento"
                placeholder="Ej: F001-00123"
              />
            </div>
            <div class="form-group">
              <span class="label">Importe<span class="required">*</span></span>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="newGasto.importe"
                min="0.01"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div class="form-group">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                <input type="checkbox" [(ngModel)]="newGasto.incluye_igv" />
                Incluye IGV (18%)
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <aero-button variant="secondary" (clicked)="showAddGastoModal = false"
              >Cancelar</aero-button
            >
            <aero-button
              variant="primary"
              [disabled]="!newGasto.fecha || !newGasto.concepto || !newGasto.importe"
              (clicked)="confirmAddGasto()"
              >Agregar Gasto</aero-button
            >
          </div>
        </div>
      </div>
    }

    <!-- Add Adelanto Modal -->
    @if (showAddAdelantoModal) {
      <div class="modal" (click)="showAddAdelantoModal = false" tabindex="0" role="button">
        <div class="modal-content" (click)="$event.stopPropagation()" tabindex="0" role="dialog">
          <div class="modal-header">
            <h2>Agregar Adelanto / Amortización</h2>
            <aero-button
              variant="ghost"
              size="small"
              iconCenter="fa-xmark"
              (clicked)="showAddAdelantoModal = false"
            ></aero-button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <span class="label">Tipo<span class="required">*</span></span>
              <app-dropdown
                [options]="tipoOperacionOptions"
                [placeholder]="'Seleccionar'"
                [(value)]="newAdelanto.tipo_operacion"
              ></app-dropdown>
            </div>
            <div class="form-group">
              <span class="label">Fecha<span class="required">*</span></span>
              <input type="date" class="form-control" [(ngModel)]="newAdelanto.fecha" />
            </div>
            <div class="form-group">
              <span class="label">N° Documento</span>
              <input type="text" class="form-control" [(ngModel)]="newAdelanto.numero_documento" />
            </div>
            <div class="form-group">
              <span class="label">Concepto</span>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="newAdelanto.concepto"
                placeholder="Descripción"
              />
            </div>
            <div class="form-group">
              <span class="label">N° Cuota</span>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="newAdelanto.numero_cuota"
                placeholder="Ej: 1/12"
              />
            </div>
            <div class="form-group">
              <span class="label">Monto<span class="required">*</span></span>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="newAdelanto.monto"
                min="0.01"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
          <div class="modal-footer">
            <aero-button variant="secondary" (clicked)="showAddAdelantoModal = false"
              >Cancelar</aero-button
            >
            <aero-button
              variant="primary"
              [disabled]="!newAdelanto.tipo_operacion || !newAdelanto.fecha || !newAdelanto.monto"
              (clicked)="confirmAddAdelanto()"
              >Agregar</aero-button
            >
          </div>
        </div>
      </div>
    }

    <!-- Conformidad Modal -->
    @if (showConformidadModal) {
      <div
        class="modal"
        (click)="showConformidadModal = false"
        (keydown.enter)="showConformidadModal = false"
        tabindex="0"
        role="button"
      >
        <div
          class="modal-content"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="dialog"
        >
          <div class="modal-header">
            <h2>Registrar Conformidad del Proveedor</h2>
            <aero-button
              variant="ghost"
              size="small"
              iconCenter="fa-xmark"
              (clicked)="showConformidadModal = false"
            ></aero-button>
          </div>
          <div class="modal-body">
            <p class="alert alert-info">
              <i class="fa-solid fa-circle-info"></i>
              Registra la fecha en que el proveedor dio su conformidad a esta valorización.
            </p>
            <div class="form-group">
              <span class="label">Fecha de Conformidad<span class="required">*</span></span>
              <input type="date" class="form-control" [(ngModel)]="conformidadData.fecha" />
            </div>
            <div class="form-group">
              <span class="label">Observaciones (opcional)</span>
              <textarea
                class="form-control"
                rows="3"
                [(ngModel)]="conformidadData.observaciones"
                placeholder="Observaciones del proveedor..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <aero-button variant="secondary" (clicked)="showConformidadModal = false"
              >Cancelar</aero-button
            >
            <aero-button
              variant="primary"
              [disabled]="processingWorkflow || !conformidadData.fecha"
              (clicked)="confirmConformidad()"
              >{{ processingWorkflow ? 'Guardando...' : 'Registrar Conformidad' }}</aero-button
            >
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .link-primary {
        color: var(--primary-600);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }

      .highlight {
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-600);
      }

      .observaciones-block {
        margin-top: var(--s-16);

        label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--grey-700);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: var(--s-8);
        }
      }

      .observaciones-text {
        padding: var(--s-16);
        background: var(--grey-50);
        border-left: 3px solid var(--primary-500);
        border-radius: var(--radius-sm);
        white-space: pre-wrap;
        font-size: 14px;
        line-height: 1.6;
      }

      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--s-32);
        margin-top: var(--s-8);
      }

      /* Deadline timeline */
      .deadline-section {
        margin-bottom: var(--s-8);
        padding: var(--s-16);
        background: var(--grey-50);
        border-radius: var(--s-8);
        border: 1px solid var(--grey-200);
      }

      .deadline-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--grey-700);
        margin-bottom: var(--s-16);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .deadline-timeline {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-left: 8px;
      }

      .deadline-item {
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
        padding-left: 20px;

        &::before {
          content: '';
          position: absolute;
          left: 7px;
          top: 20px;
          bottom: -16px;
          width: 2px;
          background: var(--grey-300);
        }

        &:last-child::before {
          display: none;
        }
      }

      /* Deadline Tracker (Compact) */
      .deadline-section-compact {
        background: var(--grey-50);
        padding: 12px 20px;
        border-radius: 8px;
        border-bottom: 4px solid var(--grey-100);
      }

      .deadline-tracker {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .tracker-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        position: relative;
        flex: 1;

        .tracker-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--grey-100);
          border: 2px solid var(--grey-300);
          z-index: 1;
          transition: all 0.3s ease;
        }

        .tracker-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--grey-500);
          margin-top: 6px;
        }

        .tracker-date {
          font-size: 10px;
          color: var(--grey-400);
          font-family: monospace;
        }

        &.done {
          .tracker-dot {
            background: var(--semantic-blue-500);
            border-color: var(--primary-900);
            box-shadow: 0 0 0 4px var(--semantic-green-50);
          }
          .tracker-label {
            color: var(--primary-900);
          }
        }

        &.active {
          .tracker-dot {
            border-color: var(--primary-500);
            box-shadow: 0 0 0 4px var(--primary-50);
          }
          .tracker-label {
            color: var(--primary-600);
          }
        }

        &.overdue {
          .tracker-dot {
            background: var(--accent-500);
            border-color: var(--grey-900);
            box-shadow: 0 0 0 4px var(--semantic-red-50);
          }
          .tracker-label {
            color: var(--grey-900);
          }
        }
      }

      .tracker-line {
        flex: 1;
        height: 2px;
        background: var(--grey-200);
        margin-top: -24px;
      }

      .tracker-alert {
        margin-top: 12px;
        padding: 6px 12px;
        background: var(--semantic-red-50);
        color: var(--grey-900);
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: center;
      }

      /* Info grids */
      .info-grid-2col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--s-24);

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      .info-column {
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
      }

      /* Payments section */
      .payments-section {
        margin-top: var(--s-32);
        padding-top: var(--s-32);
        border-top: 2px solid var(--grey-200);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-24);

        h2 {
          margin: 0;
        }
      }

      .payment-summary-widget {
        background: var(--grey-100);
        border: 1px solid var(--grey-200);
        padding: var(--s-24);
        border-radius: var(--radius-md);
        margin-bottom: var(--s-24);
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-12);

        &:last-of-type {
          margin-bottom: var(--s-16);
        }
      }

      .summary-label {
        font-size: 14px;
        color: var(--grey-600);
      }
      .summary-value {
        font-size: 18px;
        font-weight: 600;
        color: var(--grey-900);
      }
      .text-success {
        color: var(--primary-900) !important;
      }
      .text-warning {
        color: var(--grey-900) !important;
      }

      .progress-bar-container {
        width: 100%;
        height: 8px;
        background: var(--grey-100);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: var(--s-8);
      }

      .progress-bar-fill {
        height: 100%;
        background: var(--primary-500);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .progress-label {
        font-size: 12px;
        text-align: center;
        color: var(--grey-600);
      }

      .loading-payments {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        padding: var(--s-24);
        color: var(--grey-500);
      }

      .spinner-small {
        border: 2px solid var(--grey-200);
        border-top: 2px solid var(--primary-500);
        border-radius: 50%;
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .payments-table-container {
        overflow-x: auto;
        margin-top: var(--s-16);
      }

      .payments-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--neutral-0);

        th {
          background: var(--grey-50);
          padding: var(--s-12) var(--s-16);
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: var(--grey-700);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid var(--grey-200);
        }

        td {
          padding: var(--s-12) var(--s-16);
          border-bottom: 1px solid var(--grey-100);
          font-size: 14px;
          color: var(--grey-900);
        }

        tbody tr:hover {
          background: var(--grey-50);
        }
      }

      .payment-link {
        color: var(--primary-500);
        text-decoration: none;
        font-weight: 500;
        font-family: monospace;

        &:hover {
          text-decoration: underline;
        }
      }

      .amount-cell {
        font-weight: 600;
        font-family: monospace;
      }
      .text-right {
        text-align: right;
      }

      .empty-state-payments {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--s-48) var(--s-24);
        text-align: center;
        background: var(--grey-50);
        border-radius: var(--radius-md);
      }

      .empty-icon {
        font-size: 48px;
        color: var(--grey-300);
        margin-bottom: var(--s-16);
      }
      .empty-text {
        font-size: 14px;
        color: var(--grey-500);
        margin-bottom: var(--s-16);
      }

      /* Workflow hint */
      .workflow-hint {
        font-size: 12px;
        color: var(--grey-500);
        margin-top: var(--s-8);
        font-style: italic;
        text-align: center;
      }

      .mt-8 {
        margin-top: var(--s-8);
      }

      /* Conformidad */
      .conformidad-status {
        display: flex;
        align-items: flex-start;
        gap: var(--s-12);
        padding: var(--s-12);
        border-radius: var(--radius-sm);

        i {
          font-size: 20px;
          margin-top: 2px;
        }
        strong {
          display: block;
          margin-bottom: 4px;
        }
        p {
          font-size: 12px;
          margin: 0;
        }
      }

      .conformidad-ok {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }
      .conformidad-pending {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
      }
      .conformidad-obs {
        font-style: italic;
        margin-top: 4px !important;
      }

      /* Discount events */
      .section-hint {
        font-size: 12px;
        color: var(--grey-500);
        margin-bottom: var(--s-12);
      }

      .discount-events-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .discount-event-item {
        padding: 8px;
        border: 1px solid var(--grey-200);
        border-radius: 6px;
        position: relative;
      }

      .discount-event-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .discount-event-type {
        font-size: 13px;
        font-weight: 500;
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .discount-event-date {
        font-size: 12px;
        color: var(--grey-500);
      }

      .discount-event-values {
        font-size: 12px;
        color: var(--grey-700);
        display: flex;
        gap: 8px;
      }

      .discount-event-desc {
        font-size: 12px;
        color: var(--grey-500);
        margin-top: 4px;
        font-style: italic;
      }

      .no-discount-badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
        background: var(--grey-100);
        color: var(--grey-500);
        font-weight: 600;
      }

      .calc-badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
        font-weight: 600;
      }

      .discount-event-item aero-button {
        position: absolute;
        top: 4px;
        right: 4px;
      }

      .empty-docs {
        font-size: 13px;
        color: var(--grey-500);
        text-align: center;
        padding: 8px;
      }

      /* Manual Deductions */
      .deductions-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .deduction-item {
        padding: 8px;
        border: 1px solid var(--grey-200);
        border-radius: 6px;
        position: relative;
      }

      .deduction-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .deduction-type-badge {
        font-size: 11px;
        font-weight: 600;
        background: var(--semantic-red-50);
        color: var(--grey-900);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .deduction-amount {
        font-size: 13px;
        font-weight: 600;
        color: var(--grey-900);
        font-family: monospace;
      }

      .deduction-concepto {
        font-size: 13px;
        color: var(--grey-900);
        margin: 2px 0;
      }

      .deduction-meta {
        font-size: 11px;
        color: var(--grey-500);
        margin: 1px 0;
      }

      .deduction-item aero-button {
        position: absolute;
        top: 4px;
        right: 4px;
      }

      .deductions-total {
        display: flex;
        justify-content: space-between;
        padding: 8px;
        border-top: 2px solid var(--grey-200);
        margin-top: 4px;
        font-size: 13px;
        color: var(--grey-900);
      }

      /* Payment docs */
      .payment-docs-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .pay-doc-item {
        padding: 8px;
        border: 1px solid var(--grey-200);
        border-radius: 6px;
      }

      .pay-doc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .pay-doc-type {
        font-size: 13px;
        font-weight: 500;
      }

      .pay-doc-badge {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: 500;
      }

      .pay-doc-pendiente {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
      }
      .pay-doc-presentado {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }
      .pay-doc-aprobado {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }
      .pay-doc-rechazado {
        background: var(--semantic-red-50);
        color: var(--grey-900);
      }

      .pay-doc-meta {
        font-size: 12px;
        color: var(--grey-500);
        margin-top: 4px;
      }

      /* Valorizar bar */
      /* Combustible summary */
      .combustible-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: var(--s-16);
        padding: var(--s-16);
        background: var(--grey-50);
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-md);
        margin-bottom: var(--s-16);
      }

      /* Analisis card */
      .analisis-card {
        padding: var(--s-24);
        background: var(--grey-50);
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-md);
        margin-bottom: var(--s-16);
      }

      .analisis-editable {
        display: flex;
        align-items: flex-end;
        gap: var(--s-16);
        padding: var(--s-16);
        margin: var(--s-16) 0;
        background: var(--grey-100);
        border-radius: var(--radius-sm);
        border: 1px dashed var(--grey-300);

        .form-group {
          flex: 1;
          margin-bottom: 0;
        }
      }

      .analisis-results {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--s-16);
        margin-top: var(--s-16);
        padding-top: var(--s-16);
        border-top: 1px solid var(--grey-200);
      }

      /* Modals */
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: color-mix(in srgb, var(--grey-900) 50%, transparent);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .modal-content {
        background: var(--neutral-0);
        padding: 0;
        border-radius: var(--radius-md);
        width: 90%;
        max-width: 500px;
        box-shadow: var(--shadow-lg);
      }

      .modal-content.modal-lg {
        max-width: 720px;
      }

      .edt-cell {
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .edt-summary {
        font-size: 12px;
        color: var(--grey-700);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 140px;
      }

      .edt-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 1px 6px;
        border-radius: var(--radius-sm, 4px);
      }

      .edt-badge.complete {
        background: var(--semantic-green-100, #dcfce7);
        color: var(--semantic-green-700, #15803d);
      }

      .edt-badge.incomplete {
        background: var(--semantic-yellow-100, #fef9c3);
        color: var(--semantic-yellow-700, #a16207);
      }

      .edt-empty {
        font-size: 12px;
        color: var(--primary-500);
        cursor: pointer;
        i {
          margin-right: 4px;
        }
      }

      .modal-header {
        padding: var(--s-16) var(--s-24);
        border-bottom: 1px solid var(--grey-200);
        display: flex;
        justify-content: space-between;
        align-items: center;

        h2 {
          margin: 0;
          font-size: 18px;
        }
      }

      .modal-body {
        padding: var(--s-24);

        p {
          margin-bottom: var(--s-16);
          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .modal-footer {
        padding: var(--s-16) var(--s-24);
        border-top: 1px solid var(--grey-200);
        display: flex;
        justify-content: flex-end;
        gap: var(--s-8);
      }

      .approval-summary {
        background: var(--grey-50);
        padding: var(--s-16);
        border-radius: var(--radius-sm);
        margin: var(--s-16) 0;

        p {
          margin-bottom: var(--s-8);
          font-size: 14px;
          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .form-group {
        margin-bottom: var(--s-16);
        &:last-child {
          margin-bottom: 0;
        }

        label {
          display: block;
          margin-bottom: var(--s-8);
          font-weight: 500;
          color: var(--grey-700);
          font-size: 14px;
        }
      }

      .required {
        color: var(--accent-500);
      }

      .form-control {
        width: 100%;
        padding: var(--s-8) var(--s-12);
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        font-size: 14px;
      }

      .alert {
        padding: var(--s-12);
        border-radius: var(--radius-sm);
        font-size: 14px;
        margin-top: var(--s-16);
      }

      .alert-warning {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
        border: 1px solid var(--semantic-yellow-200);
      }

      .alert-info {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
        border: 1px solid var(--semantic-blue-200);
      }
    `,
  ],
})
export class ValuationDetailComponent implements OnInit {
  private valuationService = inject(ValuationService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);
  paymentService = inject(PaymentService); // public for template access

  valuation: Valuation | null = null;
  valuationSummary: ValuationSummary | null = null;
  loading = true;
  processingWorkflow = false;

  // ─── Tabs ───
  activeTab = 'resumen';
  tabs: (TabItem & { id?: string })[] = [
    { id: 'resumen', label: 'Resumen', icon: 'fa-file-invoice-dollar' },
    { id: 'acumulado', label: 'Acumulado', icon: 'fa-layer-group' },
    { id: 'partes', label: 'Parte Diario', icon: 'fa-clipboard-list' },
    { id: 'combustible', label: 'Combustible', icon: 'fa-gas-pump' },
    { id: 'gastos', label: 'Gasto en Obra', icon: 'fa-receipt' },
    { id: 'adelantos', label: 'Adelantos', icon: 'fa-hand-holding-dollar' },
    { id: 'analisis', label: 'Analisis', icon: 'fa-chart-line' },
    { id: 'consumo_legacy', label: 'Consumo Equipo', icon: 'fa-fire-flame-curved' },
  ];

  // Tab data
  resumenData: Record<string, unknown> | null = null;
  acumuladoData: Record<string, unknown>[] = [];
  partesData: Record<string, unknown>[] = [];
  combustibleData: Record<string, unknown> | null = null;
  gastosData: Record<string, unknown>[] = [];
  adelantosData: Record<string, unknown>[] = [];
  analisisData: Record<string, unknown>[] = [];
  loadingTab = false;
  valorizando = false;

  // Payment-related properties
  payments: PaymentRecordList[] = [];
  paymentSummary: PaymentSummary | null = null;
  paymentDocs: Record<string, unknown>[] = [];
  paymentCount = 0;
  loadingPayments = false;

  // Recalculate & discount events
  recalculating = false;
  discountEvents: Record<string, unknown>[] = [];
  showAddDiscountModal = false;
  newDiscountEvent: {
    fecha: string;
    tipo: string;
    subtipo: string;
    horas_descuento: number;
    dias_descuento: number;
    horas_horometro_mecanica: number | null;
    descripcion: string;
  } = {
    fecha: new Date().toISOString().split('T')[0],
    tipo: '',
    subtipo: '',
    horas_descuento: 0,
    dias_descuento: 0,
    horas_horometro_mecanica: null,
    descripcion: '',
  };
  discountTypeOptions: DropdownOption[] = [
    { label: 'Avería', value: 'AVERIA' },
    { label: 'Stand By', value: 'STAND_BY' },
    { label: 'Climático', value: 'CLIMATICO' },
    { label: 'Otro', value: 'OTRO' },
  ];
  discountSubtipoMap: Record<string, DropdownOption[]> = {
    STAND_BY: [
      { label: 'Domingo (sin descuento)', value: 'DOMINGO' },
      { label: 'Feriado (1 día completo)', value: 'FERIADO' },
      { label: 'Falta de frente (sin descuento)', value: 'FALTA_DE_FRENTE' },
    ],
    AVERIA: [
      { label: 'Por arrendador (<5h proporcional, ≥5h día completo)', value: 'ARRENDADOR' },
      { label: 'Por arrendatario (sin descuento)', value: 'ARRENDATARIO' },
      { label: 'Mecánica (proporcional por horómetro)', value: 'MECANICA' },
    ],
    CLIMATICO: [
      { label: 'Total (1 día completo)', value: 'TOTAL' },
      { label: 'Parcial (proporcional)', value: 'PARCIAL' },
    ],
  };

  get currentSubtipoOptions(): DropdownOption[] {
    return this.discountSubtipoMap[this.newDiscountEvent.tipo] || [];
  }

  get showHorasHorometro(): boolean {
    return this.newDiscountEvent.tipo === 'AVERIA' && this.newDiscountEvent.subtipo === 'MECANICA';
  }

  get showHorasDescuento(): boolean {
    const { tipo, subtipo } = this.newDiscountEvent;
    if (
      tipo === 'STAND_BY' &&
      (subtipo === 'FERIADO' || subtipo === 'DOMINGO' || subtipo === 'FALTA_DE_FRENTE')
    )
      return false;
    if (tipo === 'CLIMATICO' && subtipo === 'TOTAL') return false;
    if (tipo === 'AVERIA' && (subtipo === 'ARRENDATARIO' || subtipo === 'MECANICA')) return false;
    return true;
  }

  onDiscountTipoChange(): void {
    this.newDiscountEvent.subtipo = '';
    this.newDiscountEvent.horas_horometro_mecanica = null;
    this.newDiscountEvent.horas_descuento = 0;
    this.newDiscountEvent.dias_descuento = 0;
  }

  onDiscountSubtipoChange(): void {
    const { tipo, subtipo } = this.newDiscountEvent;
    // SIN DESCUENTO subtypes — lock to 0
    const sinDescuento =
      (tipo === 'STAND_BY' && (subtipo === 'DOMINGO' || subtipo === 'FALTA_DE_FRENTE')) ||
      (tipo === 'AVERIA' && subtipo === 'ARRENDATARIO');
    // 1 DÍA COMPLETO subtypes — auto-set to 1
    const unDiaCompleto =
      (tipo === 'STAND_BY' && subtipo === 'FERIADO') ||
      (tipo === 'CLIMATICO' && subtipo === 'TOTAL');

    if (sinDescuento) {
      this.newDiscountEvent.dias_descuento = 0;
      this.newDiscountEvent.horas_descuento = 0;
    } else if (unDiaCompleto) {
      this.newDiscountEvent.dias_descuento = 1;
      this.newDiscountEvent.horas_descuento = 0;
    } else {
      this.newDiscountEvent.dias_descuento = 0;
    }
    this.newDiscountEvent.horas_horometro_mecanica = null;
  }

  onHorasDescuentoChange(): void {
    const { tipo, subtipo, horas_descuento } = this.newDiscountEvent;
    // AVERIA:ARRENDADOR — auto-apply ≥5h = 1 día completo rule
    if (tipo === 'AVERIA' && subtipo === 'ARRENDADOR') {
      if ((horas_descuento || 0) >= 5) {
        this.newDiscountEvent.dias_descuento = 1;
      } else {
        this.newDiscountEvent.dias_descuento = 0;
      }
    }
  }

  get discountRuleBadge(): { text: string; cls: string; icon: string } | null {
    const { tipo, subtipo } = this.newDiscountEvent;
    if (!subtipo) return null;
    const sinDescuento =
      (tipo === 'STAND_BY' && (subtipo === 'DOMINGO' || subtipo === 'FALTA_DE_FRENTE')) ||
      (tipo === 'AVERIA' && subtipo === 'ARRENDATARIO');
    const unDiaCompleto =
      (tipo === 'STAND_BY' && subtipo === 'FERIADO') ||
      (tipo === 'CLIMATICO' && subtipo === 'TOTAL');
    if (sinDescuento)
      return {
        text: 'Sin descuento aplicable — no afecta la valorización',
        cls: 'alert-info',
        icon: 'fa-info-circle',
      };
    if (unDiaCompleto)
      return {
        text: '1 día completo de descuento aplicado automáticamente',
        cls: 'alert-warning',
        icon: 'fa-calendar-day',
      };
    if (tipo === 'AVERIA' && subtipo === 'ARRENDADOR')
      return {
        text: 'Regla: < 5h proporcional / ≥ 5h = 1 día completo',
        cls: 'alert-info',
        icon: 'fa-ruler',
      };
    return null;
  }

  // Manual deductions (WS-38)
  manualDeductions: DeduccionManual[] = [];
  showAddDeductionModal = false;
  newDeduction = {
    tipo: '',
    concepto: '',
    monto: 0,
    num_documento: '',
    fecha: '',
    observaciones: '',
  };
  deductionTypeOptions: DropdownOption[] = [
    { label: 'Repuestos / Spare Parts', value: 'REPUESTOS' },
    { label: 'Manipuleo de Combustible', value: 'MANIPULEO_COMBUSTIBLE' },
    { label: 'Amortización de Adelanto', value: 'AMORTIZACION_ADELANTO' },
    { label: 'Penalidad', value: 'PENALIDAD' },
    { label: 'Retención', value: 'RETENCION' },
    { label: 'Otro', value: 'OTRO' },
  ];

  get totalManualDeductions(): number {
    return this.manualDeductions.reduce((sum, d) => sum + (parseFloat(String(d.monto)) || 0), 0);
  }

  // ─── Data Grid Column Definitions ───

  acumuladoColumns: DataGridColumn[] = [
    { key: 'numero_valorizacion', label: 'N° Val.', width: '90px', sortable: true },
    { key: 'periodo', label: 'Período', width: '100px', sortable: true },
    { key: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', width: '110px' },
    { key: 'fecha_fin', label: 'Fecha Fin', type: 'date', width: '110px' },
    { key: 'cantidad', label: 'Cantidad', type: 'number', width: '100px', sortable: true },
    { key: 'unidad_medida', label: 'Unidad', width: '70px' },
    { key: 'precio_unitario', label: 'P.U.', type: 'number', width: '90px', format: '1.2-2' },
    { key: 'valorizacion_bruta', label: 'Bruta', type: 'currency', width: '120px', format: 'USD' },
    { key: 'total_descuento', label: 'Descuento', type: 'currency', width: '120px', format: 'USD' },
    {
      key: 'valorizacion_neta',
      label: 'Neta',
      type: 'currency',
      width: '120px',
      format: 'USD',
      bold: true,
    },
    { key: 'estado', label: 'Estado', type: 'template', width: '110px' },
  ];

  partesColumns: DataGridColumn[] = [
    { key: 'numero_parte', label: 'N° Parte', width: '85px', sortable: true },
    { key: 'fecha', label: 'Fecha', type: 'date', width: '100px', sortable: true },
    { key: 'operador_dni', label: 'DNI', width: '90px', hidden: true },
    { key: 'operador_nombre', label: 'Operador', width: '160px', hidden: true },
    { key: 'turno', label: 'Turno', width: '70px' },
    {
      key: 'horometro_inicial',
      label: 'H. Inicio',
      type: 'number',
      width: '95px',
      format: '1.2-2',
    },
    { key: 'horometro_final', label: 'H. Final', type: 'number', width: '95px', format: '1.2-2' },
    {
      key: 'diferencia',
      label: 'Diferencia',
      type: 'number',
      width: '95px',
      format: '1.2-2',
      bold: true,
    },
    {
      key: 'horas_precalentamiento',
      label: 'Precalent.',
      type: 'number',
      width: '95px',
      format: '1.2-2',
    },
    {
      key: 'otros_descuentos',
      label: 'Otros Desc.',
      type: 'number',
      width: '95px',
      format: '1.2-2',
      hidden: true,
    },
    {
      key: 'cantidad_efectiva',
      label: 'Cant. Efectiva',
      type: 'number',
      width: '110px',
      format: '1.2-2',
      bold: true,
    },
    {
      key: 'descuento_cantidad_minima',
      label: 'Desc. Mín.',
      type: 'number',
      width: '95px',
      format: '1.2-2',
      hidden: true,
    },
    {
      key: 'cantidad_minima',
      label: 'Cant. Mínima',
      type: 'number',
      width: '110px',
      format: '1.2-2',
    },
    { key: 'actividad', label: 'Actividad', width: '180px' },
    { key: 'edt_resumen', label: 'EDT', width: '200px', type: 'template' },
  ];

  combustibleColumns: DataGridColumn[] = [
    { key: 'numero_vale', label: 'N° Vale', width: '100px', sortable: true },
    { key: 'fecha', label: 'Fecha', type: 'date', width: '100px', sortable: true },
    { key: 'tipo_combustible', label: 'Tipo', width: '90px' },
    { key: 'cantidad_galones', label: 'Galones', type: 'number', width: '90px', format: '1.2-2' },
    { key: 'precio_unitario', label: 'P.U.', type: 'number', width: '90px', format: '1.4-4' },
    {
      key: 'monto_total',
      label: 'Importe',
      type: 'currency',
      width: '110px',
      format: 'USD',
      bold: true,
    },
    { key: 'proveedor', label: 'Proveedor', width: '150px' },
    { key: 'observaciones', label: 'Observaciones', width: '150px', hidden: true },
  ];

  gastosColumns: DataGridColumn[] = [
    { key: 'fecha', label: 'Fecha', type: 'date', width: '100px', sortable: true },
    { key: 'proveedor', label: 'Proveedor', width: '150px' },
    { key: 'concepto', label: 'Concepto', width: '180px' },
    { key: 'tipo_documento', label: 'Tipo Doc.', width: '100px' },
    { key: 'numero_documento', label: 'N° Doc.', width: '110px' },
    { key: 'importe', label: 'Importe', type: 'currency', width: '110px', format: 'USD' },
    { key: 'incluye_igv', label: 'IGV', type: 'template', width: '60px', align: 'center' },
    {
      key: 'importe_sin_igv',
      label: 'Sin IGV',
      type: 'currency',
      width: '110px',
      format: 'USD',
      bold: true,
    },
  ];

  adelantosColumns: DataGridColumn[] = [
    { key: 'tipo_operacion', label: 'Tipo', type: 'template', width: '130px' },
    { key: 'fecha', label: 'Fecha', type: 'date', width: '100px', sortable: true },
    { key: 'numero_documento', label: 'N° Documento', width: '130px' },
    { key: 'concepto', label: 'Concepto', width: '180px' },
    { key: 'numero_cuota', label: 'N° Cuota', width: '90px' },
    { key: 'monto', label: 'Monto', type: 'currency', width: '120px', format: 'USD', bold: true },
  ];

  // Highlight predicate for acumulado tab
  isCurrentValuation = (row: Record<string, unknown>): boolean => {
    return row['id'] === this.valuation?.id;
  };

  // Computed footer rows
  get acumuladoFooter(): Record<string, unknown> {
    return {
      numero_valorizacion: 'Totales',
      cantidad: this.sumField(this.acumuladoData, 'cantidad'),
      valorizacion_bruta: this.sumField(this.acumuladoData, 'valorizacion_bruta'),
      total_descuento: this.sumField(this.acumuladoData, 'total_descuento'),
      valorizacion_neta: this.sumField(this.acumuladoData, 'valorizacion_neta'),
    };
  }

  get partesFooter(): Record<string, unknown> {
    return {
      fecha: 'Totales',
      diferencia: this.sumField(this.partesData, 'diferencia'),
      horas_precalentamiento: this.sumField(this.partesData, 'horas_precalentamiento'),
      otros_descuentos: this.sumField(this.partesData, 'otros_descuentos'),
      cantidad_efectiva: this.sumField(this.partesData, 'cantidad_efectiva'),
      descuento_cantidad_minima: this.sumField(this.partesData, 'descuento_cantidad_minima'),
      cantidad_minima: this.sumField(this.partesData, 'cantidad_minima'),
    };
  }

  get gastosFooter(): Record<string, unknown> {
    return {
      concepto: 'Total',
      importe: this.sumField(this.gastosData, 'importe'),
      importe_sin_igv: this.sumField(this.gastosData, 'importe_sin_igv'),
    };
  }

  get adelantosFooter(): Record<string, unknown> {
    return {
      concepto: 'Total Amortización',
      monto: this.sumFieldFiltered(this.adelantosData, 'monto', 'tipo_operacion', 'AMORTIZACION'),
    };
  }

  // Combustible vales getter (extracted from nested data)
  get combustibleVales(): Record<string, unknown>[] {
    if (!this.combustibleData || !this.combustibleData['vales']) return [];
    return this.combustibleData['vales'] as Record<string, unknown>[];
  }

  // Modal states
  showApproveModal = false;
  showRejectModal = false;
  showMarkPaidModal = false;
  showConformidadModal = false;
  showAddGastoModal = false;
  showAddAdelantoModal = false;
  selectedParteForEdt: Record<string, unknown> | null = null;

  // New Gasto form
  newGasto = {
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    concepto: '',
    tipo_documento: '',
    numero_documento: '',
    importe: 0,
    incluye_igv: false,
  };
  tipoDocOptions: DropdownOption[] = [
    { label: 'Factura', value: 'FACTURA' },
    { label: 'Boleta', value: 'BOLETA' },
    { label: 'Recibo', value: 'RECIBO' },
    { label: 'Otro', value: 'OTRO' },
  ];

  // New Adelanto form
  newAdelanto = {
    tipo_operacion: '',
    fecha: new Date().toISOString().split('T')[0],
    numero_documento: '',
    concepto: '',
    numero_cuota: '',
    monto: 0,
  };
  tipoOperacionOptions: DropdownOption[] = [
    { label: 'Adelanto', value: 'ADELANTO' },
    { label: 'Amortización', value: 'AMORTIZACION' },
  ];

  // Form data
  rejectReason = '';
  conformidadData = {
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
  };

  paymentMethodOptions: DropdownOption[] = [
    { label: 'Transferencia Bancaria', value: 'Transferencia Bancaria' },
    { label: 'Cheque', value: 'Cheque' },
    { label: 'Efectivo', value: 'Efectivo' },
    { label: 'Letra', value: 'Letra' },
    { label: 'Otro', value: 'Otro' },
  ];

  paymentData: PaymentData = {
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: '',
    referencia_pago: '',
  };

  get header(): EntityDetailHeader {
    return {
      icon: 'fa-solid fa-file-invoice-dollar',
      title:
        'Valorización ' + (this.valuation?.numeroValorizacion || '#' + (this.valuation?.id || '')),
      subtitle: this.valuation?.periodo || 'Período no definido',
      statusLabel: this.valuation?.estado || 'BORRADOR',
      statusClass: this.getStatusClass(this.valuation?.estado || 'BORRADOR'),
    };
  }

  get auditInfo(): AuditInfo {
    return {
      entries: [
        { date: this.valuation?.updatedAt, label: 'Última actualización' },
        { date: this.valuation?.createdAt, label: 'Valorización creada' },
      ],
    };
  }

  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Valorizaciones', url: '/equipment/valuations' },
      { label: this.valuation?.numeroValorizacion || 'Detalle' },
    ];
  }

  notFoundConfig: NotFoundConfig = {
    icon: 'fa-solid fa-file-invoice-dollar',
    title: 'Valorización no encontrada',
    message: 'La valorización que buscas no existe o ha sido eliminada.',
    backLabel: 'Volver a la lista',
    backRoute: '/equipment/valuations',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadValuation(id);
    this.loadSummary(id);
    this.loadPayments(id);
    this.loadPaymentSummary(id);
    this.loadDiscountEvents(id);
    this.loadManualDeductions(id);
  }

  loadValuation(id: number): void {
    this.loading = true;
    this.valuationService.getById(id).subscribe({
      next: (data) => {
        this.valuation = data;
        this.loading = false;
        this.loadPaymentDocs(id);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadPaymentDocs(id: number): void {
    this.valuationService.getPaymentDocuments(id).subscribe({
      next: (docs) => (this.paymentDocs = docs),
    });
  }

  translatePayDocType(tipo: string): string {
    const map: Record<string, string> = {
      FACTURA: 'Factura',
      POLIZA_TREC: 'Póliza TREC',
      ESSALUD: 'ESSALUD',
      SCTR: 'SCTR',
    };
    return map[tipo] || tipo;
  }

  loadSummary(id: number): void {
    this.valuationService.getSummary(id).subscribe({
      next: (data) => {
        this.valuationSummary = data;
      },
      error: (error) => {
        console.error('Error loading valuation summary:', error);
      },
    });
    this.valuationService.getResumen(id).subscribe({
      next: (data) => {
        this.resumenData = data;
      },
      error: () => {},
    });
  }

  loadPayments(valuationId: number): void {
    this.loadingPayments = true;
    this.paymentService.getPaymentsByValuation(valuationId).subscribe({
      next: (payments) => {
        this.payments = payments;
        this.paymentCount = payments.length;
        this.loadingPayments = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.loadingPayments = false;
      },
    });
  }

  loadPaymentSummary(valuationId: number): void {
    this.paymentService.getPaymentSummary(valuationId).subscribe({
      next: (summary) => {
        this.paymentSummary = summary;
      },
      error: (error) => {
        console.error('Error loading payment summary:', error);
      },
    });
  }

  private getUserRoles(): string[] {
    const user = this.authService.currentUser;
    if (user?.roles && Array.isArray(user.roles)) {
      return user.roles;
    }
    if (user?.rol) {
      return [user.rol];
    }
    return [];
  }

  canSubmitForReview(): boolean {
    return true;
  }

  canValidate(): boolean {
    const roles = this.getUserRoles();
    return roles.some((r) => ['ADMIN', 'RESIDENTE', 'ADMINISTRADOR_PROYECTO'].includes(r));
  }

  canApprove(): boolean {
    const roles = this.getUserRoles();
    return roles.some((r) => ['ADMIN', 'DIRECTOR'].includes(r));
  }

  canReject(): boolean {
    const roles = this.getUserRoles();
    return roles.some((r) =>
      ['ADMIN', 'DIRECTOR', 'RESIDENTE', 'ADMINISTRADOR_PROYECTO'].includes(r)
    );
  }

  canRejectCurrentState(): boolean {
    if (!this.valuation) return false;
    return ['PENDIENTE', 'EN_REVISION', 'VALIDADO', 'APROBADO'].includes(this.valuation.estado);
  }

  canMarkAsPaid(): boolean {
    const roles = this.getUserRoles();
    return roles.includes('ADMIN');
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      PENDIENTE: 'Pendiente',
      EN_REVISION: 'En Revisión',
      VALIDADO: 'Validado',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado',
      PAGADO: 'Pagado',
      ELIMINADO: 'Eliminado',
    };
    return labels[estado] || estado;
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'APROBADO':
      case 'PAGADO':
        return 'status-APROBADO';
      case 'PENDIENTE':
      case 'EN_REVISION':
      case 'VALIDADO':
        return 'status-PENDIENTE';
      case 'RECHAZADO':
      case 'ELIMINADO':
        return 'status-CANCELADO';
      default:
        return 'status-BORRADOR';
    }
  }

  getWorkflowHint(): string | null {
    if (!this.valuation) return null;

    const status = this.valuation.estado;

    if (status === 'BORRADOR') {
      return 'Completa los datos y marca como pendiente para iniciar el proceso.';
    }
    if (status === 'PENDIENTE') {
      if (!this.valuation.conformidadProveedor) {
        return 'Registra la conformidad del proveedor antes de enviar a revisión.';
      }
      return 'Envía esta valorización a revisión.';
    }
    if (status === 'EN_REVISION') {
      return 'Esta valorización está en revisión y puede ser validada o rechazada.';
    }
    if (status === 'VALIDADO') {
      return 'Validada por Control OC. Pendiente de aprobación final.';
    }
    if (status === 'APROBADO' && this.canMarkAsPaid()) {
      return 'Aprobada. Puede ser marcada como pagada.';
    }
    if (status === 'RECHAZADO') {
      return 'Rechazada. Puede ser reabierta para corrección.';
    }
    if (status === 'PAGADO') {
      return 'Esta valorización ya ha sido pagada.';
    }

    return null;
  }

  // Workflow actions
  submitDraft(): void {
    if (!this.valuation || this.processingWorkflow) return;
    this.confirmSvc
      .confirm({
        title: 'Marcar como Pendiente',
        message: '¿Deseas marcar esta valorización como pendiente para iniciar el proceso?',
        icon: 'fa-circle-question',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.processingWorkflow = true;
          this.valuationService.submitDraft(this.valuation!.id).subscribe({
            next: () => {
              this.processingWorkflow = false;
              this.snackBar.open('Valorización marcada como pendiente', 'Cerrar', {
                duration: 3000,
              });
              this.loadValuation(this.valuation!.id);
            },
            error: (err) => {
              this.processingWorkflow = false;
              this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
                duration: 5000,
              });
            },
          });
        }
      });
  }

  submitForReview(): void {
    if (!this.valuation || this.processingWorkflow) return;
    this.confirmSvc
      .confirm({
        title: 'Enviar a Revisión',
        message: '¿Deseas enviar esta valorización a revisión?',
        icon: 'fa-paper-plane',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.processingWorkflow = true;
          this.valuationService.submitForReview(this.valuation!.id).subscribe({
            next: () => {
              this.processingWorkflow = false;
              this.snackBar.open('Valorización enviada a revisión exitosamente', 'Cerrar', {
                duration: 3000,
              });
              this.loadValuation(this.valuation!.id);
            },
            error: (err) => {
              this.processingWorkflow = false;
              this.snackBar.open(
                'Error al enviar a revisión: ' + (err.error?.error?.message || err.message),
                'Cerrar',
                { duration: 5000 }
              );
            },
          });
        }
      });
  }

  confirmApprove(): void {
    if (!this.valuation || this.processingWorkflow) return;

    this.processingWorkflow = true;
    this.valuationService.approve(this.valuation.id).subscribe({
      next: () => {
        this.processingWorkflow = false;
        this.showApproveModal = false;
        this.snackBar.open('Valorización aprobada exitosamente', 'Cerrar', { duration: 3000 });
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        this.snackBar.open(
          'Error al aprobar: ' + (err.error?.error?.message || err.message),
          'Cerrar',
          {
            duration: 5000,
          }
        );
      },
    });
  }

  confirmReject(): void {
    if (!this.valuation || !this.rejectReason || this.processingWorkflow) return;

    this.processingWorkflow = true;
    this.valuationService.reject(this.valuation.id, this.rejectReason).subscribe({
      next: () => {
        this.processingWorkflow = false;
        this.showRejectModal = false;
        this.rejectReason = '';
        this.snackBar.open('Valorización rechazada', 'Cerrar', { duration: 3000 });
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        this.snackBar.open(
          'Error al rechazar: ' + (err.error?.error?.message || err.message),
          'Cerrar',
          {
            duration: 5000,
          }
        );
      },
    });
  }

  confirmMarkAsPaid(): void {
    if (!this.valuation || !this.isPaymentDataValid() || this.processingWorkflow) return;

    this.processingWorkflow = true;
    this.valuationService.markAsPaid(this.valuation.id, this.paymentData).subscribe({
      next: () => {
        this.processingWorkflow = false;
        this.showMarkPaidModal = false;
        this.resetPaymentData();
        this.snackBar.open('Valorización marcada como pagada exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        this.snackBar.open(
          'Error al marcar como pagado: ' + (err.error?.error?.message || err.message),
          'Cerrar',
          { duration: 5000 }
        );
      },
    });
  }

  confirmValidate(): void {
    if (!this.valuation || this.processingWorkflow) return;
    this.confirmSvc
      .confirm({
        title: 'Validar Valorización',
        message: '¿Deseas validar esta valorización?',
        icon: 'fa-clipboard-check',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.processingWorkflow = true;
          this.valuationService.validate(this.valuation!.id).subscribe({
            next: () => {
              this.processingWorkflow = false;
              this.snackBar.open('Valorización validada exitosamente', 'Cerrar', {
                duration: 3000,
              });
              this.loadValuation(this.valuation!.id);
            },
            error: (err) => {
              this.processingWorkflow = false;
              this.snackBar.open(
                'Error al validar: ' + (err.error?.error?.message || err.message),
                'Cerrar',
                { duration: 5000 }
              );
            },
          });
        }
      });
  }

  confirmReopen(): void {
    if (!this.valuation || this.processingWorkflow) return;
    this.confirmSvc
      .confirm({
        title: 'Reabrir Valorización',
        message: '¿Deseas reabrir esta valorización para corrección? Volverá al estado Borrador.',
        icon: 'fa-rotate-left',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.processingWorkflow = true;
          this.valuationService.reopen(this.valuation!.id).subscribe({
            next: () => {
              this.processingWorkflow = false;
              this.snackBar.open('Valorización reabierta como borrador', 'Cerrar', {
                duration: 3000,
              });
              this.loadValuation(this.valuation!.id);
            },
            error: (err) => {
              this.processingWorkflow = false;
              this.snackBar.open(
                'Error al reabrir: ' + (err.error?.error?.message || err.message),
                'Cerrar',
                { duration: 5000 }
              );
            },
          });
        }
      });
  }

  confirmConformidad(): void {
    if (!this.valuation || !this.conformidadData.fecha || this.processingWorkflow) return;

    this.processingWorkflow = true;
    this.valuationService.registerConformidad(this.valuation.id, this.conformidadData).subscribe({
      next: () => {
        this.processingWorkflow = false;
        this.showConformidadModal = false;
        this.snackBar.open('Conformidad del proveedor registrada', 'Cerrar', { duration: 3000 });
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
          duration: 5000,
        });
      },
    });
  }

  isPaymentDataValid(): boolean {
    return !!(
      this.paymentData.fecha_pago &&
      this.paymentData.metodo_pago &&
      this.paymentData.referencia_pago
    );
  }

  resetPaymentData(): void {
    this.paymentData = {
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: '',
      referencia_pago: '',
    };
  }

  recalculate(): void {
    if (!this.valuation || this.recalculating) return;
    this.recalculating = true;
    this.valuationService.recalculate(this.valuation.id).subscribe({
      next: (updated) => {
        this.valuation = updated;
        this.recalculating = false;
        this.loadSummary(this.valuation!.id);
        this.snackBar.open('Valorización recalculada exitosamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.recalculating = false;
        this.snackBar.open(
          'Error al recalcular: ' + (err.error?.error?.message || err.message),
          'Cerrar',
          { duration: 5000 }
        );
      },
    });
  }

  loadDiscountEvents(valuationId: number): void {
    this.valuationService.getDiscountEvents(valuationId).subscribe({
      next: (events) => (this.discountEvents = events),
    });
  }

  confirmAddDiscountEvent(): void {
    if (!this.valuation || !this.newDiscountEvent.fecha || !this.newDiscountEvent.tipo) return;
    this.valuationService.createDiscountEvent(this.valuation.id, this.newDiscountEvent).subscribe({
      next: () => {
        this.showAddDiscountModal = false;
        this.resetDiscountEventForm();
        this.loadDiscountEvents(this.valuation!.id);
      },
      error: (err) => {
        this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
          duration: 5000,
        });
      },
    });
  }

  removeDiscountEvent(eventId: number): void {
    this.confirmSvc.confirmDelete('este evento de descuento').subscribe((confirmed) => {
      if (confirmed) {
        this.valuationService.deleteDiscountEvent(eventId).subscribe({
          next: () => {
            this.loadDiscountEvents(this.valuation!.id);
            this.snackBar.open('Evento eliminado', 'Cerrar', { duration: 3000 });
          },
          error: (err) => {
            this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
              duration: 5000,
            });
          },
        });
      }
    });
  }

  private resetDiscountEventForm(): void {
    this.newDiscountEvent = {
      fecha: new Date().toISOString().split('T')[0],
      tipo: '',
      subtipo: '',
      horas_descuento: 0,
      dias_descuento: 0,
      horas_horometro_mecanica: null,
      descripcion: '',
    };
  }

  // ─── Manual Deductions (WS-38) ───

  loadManualDeductions(valuationId: number): void {
    this.valuationService.getManualDeductions(valuationId).subscribe({
      next: (deductions) => (this.manualDeductions = deductions),
    });
  }

  translateDeductionType(tipo: string): string {
    const map: Record<string, string> = {
      REPUESTOS: 'Repuestos',
      MANIPULEO_COMBUSTIBLE: 'Manipuleo Comb.',
      AMORTIZACION_ADELANTO: 'Amort. Adelanto',
      PENALIDAD: 'Penalidad',
      RETENCION: 'Retención',
      OTRO: 'Otro',
    };
    return map[tipo] || tipo;
  }

  confirmAddDeduction(): void {
    if (
      !this.valuation ||
      !this.newDeduction.tipo ||
      !this.newDeduction.concepto ||
      !this.newDeduction.monto
    )
      return;

    this.valuationService
      .createManualDeduction(this.valuation.id, {
        tipo: this.newDeduction.tipo,
        concepto: this.newDeduction.concepto,
        monto: this.newDeduction.monto,
        num_documento: this.newDeduction.num_documento || undefined,
        fecha: this.newDeduction.fecha || undefined,
        observaciones: this.newDeduction.observaciones || undefined,
      })
      .subscribe({
        next: () => {
          this.showAddDeductionModal = false;
          this.resetDeductionForm();
          this.loadManualDeductions(this.valuation!.id);
          this.snackBar.open('Deducción agregada exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
            duration: 5000,
          });
        },
      });
  }

  removeManualDeduction(deduccionId: number): void {
    this.confirmSvc.confirmDelete('esta deducción manual').subscribe((confirmed) => {
      if (confirmed) {
        this.valuationService.deleteManualDeduction(deduccionId).subscribe({
          next: () => {
            this.loadManualDeductions(this.valuation!.id);
            this.snackBar.open('Deducción eliminada', 'Cerrar', { duration: 3000 });
          },
          error: (err) => {
            this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
              duration: 5000,
            });
          },
        });
      }
    });
  }

  private resetDeductionForm(): void {
    this.newDeduction = {
      tipo: '',
      concepto: '',
      monto: 0,
      num_documento: '',
      fecha: '',
      observaciones: '',
    };
  }

  // ─── Tab Management ───

  onTabChange(tab: TabItem & { id?: string }): void {
    this.activeTab = tab.id || 'resumen';
    if (!this.valuation) return;
    const id = this.valuation.id;
    switch (this.activeTab) {
      case 'acumulado':
        if (this.acumuladoData.length === 0) this.loadAcumulado(id);
        break;
      case 'partes':
        if (this.partesData.length === 0) this.loadPartes(id);
        break;
      case 'combustible':
        if (!this.combustibleData) this.loadCombustible(id);
        break;
      case 'gastos':
        if (this.gastosData.length === 0) this.loadGastos(id);
        break;
      case 'adelantos':
        if (this.adelantosData.length === 0) this.loadAdelantos(id);
        break;
      case 'analisis':
        if (this.analisisData.length === 0) this.loadAnalisis(id);
        break;
    }
  }

  private loadAcumulado(id: number): void {
    this.loadingTab = true;
    this.valuationService.getResumenAcumulado(id).subscribe({
      next: (data) => {
        this.acumuladoData = data;
        this.loadingTab = false;
      },
      error: () => {
        this.loadingTab = false;
      },
    });
  }

  private loadPartes(id: number): void {
    this.loadingTab = true;
    this.valuationService.getPartesDetalle(id).subscribe({
      next: (data) => {
        this.partesData = data;
        this.loadingTab = false;
      },
      error: () => {
        this.loadingTab = false;
      },
    });
  }

  private loadCombustible(id: number): void {
    this.loadingTab = true;
    this.valuationService.getCombustibleDetalle(id).subscribe({
      next: (data) => {
        this.combustibleData = data;
        this.loadingTab = false;
      },
      error: () => {
        this.loadingTab = false;
      },
    });
  }

  private loadGastos(id: number): void {
    this.loadingTab = true;
    this.valuationService.getGastosObra(id).subscribe({
      next: (data) => {
        this.gastosData = data;
        this.loadingTab = false;
      },
      error: () => {
        this.loadingTab = false;
      },
    });
  }

  private loadAdelantos(id: number): void {
    this.loadingTab = true;
    this.valuationService.getAdelantos(id).subscribe({
      next: (data) => {
        this.adelantosData = data;
        this.loadingTab = false;
      },
      error: () => {
        this.loadingTab = false;
      },
    });
  }

  private loadAnalisis(id: number): void {
    this.loadingTab = true;
    this.valuationService.getAnalisisCombustible(id).subscribe({
      next: (data) => {
        this.analisisData = data;
        this.loadingTab = false;
      },
      error: () => {
        this.loadingTab = false;
      },
    });
  }

  // ─── Valorizar ───

  runValorizar(): void {
    if (!this.valuation || this.valorizando) return;
    this.confirmSvc
      .confirm({
        title: 'Ejecutar Valorización',
        message:
          '¿Deseas calcular automáticamente todos los montos de esta valorización a partir de los partes diarios, vales de combustible, gastos y adelantos?',
        icon: 'fa-calculator',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.valorizando = true;
          this.valuationService.valorizar(this.valuation!.id).subscribe({
            next: (updated) => {
              this.valuation = updated;
              this.valorizando = false;
              this.loadSummary(this.valuation!.id);
              // Reset cached tab data so they reload with new values
              this.acumuladoData = [];
              this.partesData = [];
              this.combustibleData = null;
              this.gastosData = [];
              this.adelantosData = [];
              this.analisisData = [];
              this.snackBar.open('Valorización calculada exitosamente', 'Cerrar', {
                duration: 3000,
              });
            },
            error: (err) => {
              this.valorizando = false;
              this.snackBar.open(
                'Error al valorizar: ' + (err.error?.error?.message || err.message),
                'Cerrar',
                { duration: 5000 }
              );
            },
          });
        }
      });
  }

  // ─── Gasto en Obra CRUD ───

  confirmAddGasto(): void {
    if (
      !this.valuation ||
      !this.newGasto.fecha ||
      !this.newGasto.concepto ||
      !this.newGasto.importe
    )
      return;
    this.valuationService.createGastoObra(this.valuation.id, this.newGasto).subscribe({
      next: () => {
        this.showAddGastoModal = false;
        this.resetGastoForm();
        this.loadGastos(this.valuation!.id);
        this.snackBar.open('Gasto agregado exitosamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
          duration: 5000,
        });
      },
    });
  }

  removeGasto(gastoId: number): void {
    this.confirmSvc.confirmDelete('este gasto en obra').subscribe((confirmed) => {
      if (confirmed) {
        this.valuationService.deleteGastoObra(gastoId).subscribe({
          next: () => {
            this.loadGastos(this.valuation!.id);
            this.snackBar.open('Gasto eliminado', 'Cerrar', { duration: 3000 });
          },
          error: (err) => {
            this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
              duration: 5000,
            });
          },
        });
      }
    });
  }

  private resetGastoForm(): void {
    this.newGasto = {
      fecha: new Date().toISOString().split('T')[0],
      proveedor: '',
      concepto: '',
      tipo_documento: '',
      numero_documento: '',
      importe: 0,
      incluye_igv: false,
    };
  }

  // ─── Adelanto CRUD ───

  confirmAddAdelanto(): void {
    if (
      !this.valuation ||
      !this.newAdelanto.tipo_operacion ||
      !this.newAdelanto.fecha ||
      !this.newAdelanto.monto
    )
      return;
    // Create adelanto scoped to contract
    const contractId = this.valuation.contractId;
    if (!contractId) {
      this.snackBar.open('Error: esta valorización no tiene contrato asociado', 'Cerrar', {
        duration: 5000,
      });
      return;
    }
    const payload = {
      ...this.newAdelanto,
      equipo_id: this.valuation.equipmentId,
      valorizacion_id: this.valuation.id,
    };
    this.valuationService.createAdelanto(contractId, payload).subscribe({
      next: () => {
        this.showAddAdelantoModal = false;
        this.resetAdelantoForm();
        this.loadAdelantos(this.valuation!.id);
        this.snackBar.open('Adelanto agregado exitosamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
          duration: 5000,
        });
      },
    });
  }

  removeAdelanto(adelantoId: number): void {
    this.confirmSvc.confirmDelete('este adelanto').subscribe((confirmed) => {
      if (confirmed) {
        this.valuationService.deleteAdelanto(adelantoId).subscribe({
          next: () => {
            this.loadAdelantos(this.valuation!.id);
            this.snackBar.open('Adelanto eliminado', 'Cerrar', { duration: 3000 });
          },
          error: (err) => {
            this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
              duration: 5000,
            });
          },
        });
      }
    });
  }

  private resetAdelantoForm(): void {
    this.newAdelanto = {
      tipo_operacion: '',
      fecha: new Date().toISOString().split('T')[0],
      numero_documento: '',
      concepto: '',
      numero_cuota: '',
      monto: 0,
    };
  }

  // ─── Análisis Combustible ───

  recalcAnalisis(a: Record<string, unknown>): void {
    const ratio = Number(a['ratio_control']) || 0;
    const precio = Number(a['precio_unitario']) || 0;
    const consumo = Number(a['consumo_combustible']) || 0;
    const totalUso = Number(a['total_uso']) || 0;
    const tipo = String(a['tipo_horometro_odometro'] || '');

    let exceso = 0;
    if (tipo === 'HOROMETRO' && ratio > 0) {
      exceso = consumo - totalUso * ratio;
    } else if (tipo === 'ODOMETRO' && ratio > 0) {
      exceso = consumo - totalUso / ratio;
    }
    a['exceso_combustible'] = Math.max(0, exceso);
    a['importe_exceso'] = Math.max(0, exceso) * precio;
  }

  saveAnalisis(a: Record<string, unknown>): void {
    const analisisId = a['id'] as number;
    this.valuationService
      .updateAnalisisCombustible(analisisId, {
        ratio_control: Number(a['ratio_control']) || undefined,
        precio_unitario: Number(a['precio_unitario']) || undefined,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Análisis actualizado', 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
            duration: 5000,
          });
        },
      });
  }

  // ─── Helpers ───

  sumField(rows: Record<string, unknown>[], field: string): number {
    return rows.reduce((sum, r) => sum + (Number(r[field]) || 0), 0);
  }

  sumFieldFiltered(
    rows: Record<string, unknown>[],
    field: string,
    filterField: string,
    filterValue: string
  ): number {
    return rows
      .filter((r) => r[filterField] === filterValue)
      .reduce((sum, r) => sum + (Number(r[field]) || 0), 0);
  }

  getStatusBadgeClass(estado: string): string {
    if (['APROBADO', 'PAGADO'].includes(estado)) return 'success';
    if (['PENDIENTE', 'EN_REVISION', 'VALIDADO', 'BORRADOR'].includes(estado)) return 'warning';
    return 'danger';
  }

  getEstadoVariant(estado: string): string {
    if (estado === 'APROBADO') return 'success';
    if (estado === 'PENDIENTE') return 'warning';
    if (estado === 'RECHAZADO') return 'error';
    if (estado === 'PAGADO') return 'neutral';
    if (['EN_REVISION', 'VALIDADO', 'BORRADOR'].includes(estado)) return 'warning';
    return 'neutral';
  }

  onParteRowClick(row: Record<string, unknown>): void {
    this.selectedParteForEdt = row;
  }

  closeEdtModal(): void {
    this.selectedParteForEdt = null;
    // Refresh partes data to reflect EDT changes
    if (this.valuation) {
      this.loadPartes(this.valuation.id);
    }
  }

  editValuation(): void {
    if (this.valuation) {
      this.router.navigate(['/equipment/valuations', this.valuation.id, 'edit']);
    }
  }

  downloadPDF(): void {
    if (!this.valuation) return;

    this.valuationService.downloadPdf(this.valuation.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `valorizacion-${this.valuation?.numeroValorizacion || this.valuation?.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading PDF', err);
        this.snackBar.open('Error al descargar el PDF', 'Cerrar', { duration: 5000 });
      },
    });
  }

  navigateToCreatePayment(): void {
    if (this.valuation) {
      this.router.navigate(['/payments/create'], {
        queryParams: { valorizacion_id: this.valuation.id },
      });
    }
  }

  viewPayment(paymentId: number): void {
    this.router.navigate(['/payments', paymentId]);
  }

  isDeadlinePassed(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date() > new Date(dateStr);
  }

  isDeadlineMissed(dateStr: string, estado: string): boolean {
    if (!dateStr) return false;
    return this.isDeadlinePassed(dateStr) && ['BORRADOR', 'PENDIENTE'].includes(estado);
  }

  deleteValuation(): void {
    if (!this.valuation) return;
    this.confirmSvc
      .confirmDelete(`la valorización ${this.valuation.numeroValorizacion}`)
      .subscribe((confirmed) => {
        if (confirmed) {
          this.valuationService.delete(this.valuation!.id).subscribe({
            next: () => {
              this.router.navigate(['/equipment/valuations']);
              this.snackBar.open('Valorización eliminada', 'Cerrar', { duration: 3000 });
            },
            error: (err) => {
              console.error('Error deleting valuation', err);
              this.snackBar.open(
                'Error al eliminar: ' + (err.error?.error?.message || err.message),
                'Cerrar',
                { duration: 5000 }
              );
            },
          });
        }
      });
  }
}
