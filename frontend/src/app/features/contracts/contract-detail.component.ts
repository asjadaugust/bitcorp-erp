import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ContractService } from '../../core/services/contract.service';
import {
  Contract,
  ContractObligacion,
  ContractObligacionArrendatario,
  OBLIGACION_LABELS,
  OBLIGACION_ARRENDATARIO_LABELS,
} from '../../core/models/contract.model';
import { ValuationService } from '../../core/services/valuation.service';
import { Valuation } from '../../core/models/valuation.model';
import { ConfirmService } from '../../core/services/confirm.service';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ContractAddendumDialogComponent } from './components/contract-addendum-dialog/contract-addendum-dialog.component';

import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';

import {
  EntityDetailShellComponent,
  EntityDetailSidebarCardComponent,
  EntityDetailHeader,
  AuditInfo,
  NotFoundConfig,
} from '../../shared/components/entity-detail';
import { ButtonComponent } from '../../shared/components/button/button.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';
import { AeroBadgeComponent } from '../../core/design-system/badge/aero-badge.component';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatDialogModule,
    AeroTableComponent,
    EntityDetailShellComponent,
    EntityDetailSidebarCardComponent,
    ButtonComponent,
    DropdownComponent,
    AeroBadgeComponent,
  ],
  template: `
    <entity-detail-shell
      [loading]="loading"
      [entity]="contract"
      [header]="header"
      [auditInfo]="auditInfo"
      [notFound]="notFoundConfig"
      loadingText="Cargando detalles del contrato..."
    >
      <!-- ── MAIN CONTENT ────────────────────────────────────── -->
      <div entity-main-content class="detail-sections">
        <!-- Resolution Alert -->
        @if (contract?.estado === 'RESUELTO' || contract?.estado === 'LIQUIDADO') {
          <div
            class="alert"
            [class.alert-warning]="contract?.estado === 'RESUELTO'"
            [class.alert-success]="contract?.estado === 'LIQUIDADO'"
          >
            <i
              class="fa-solid"
              [class.fa-scale-balanced]="contract?.estado === 'RESUELTO'"
              [class.fa-circle-check]="contract?.estado === 'LIQUIDADO'"
            ></i>
            <div>
              <strong>{{
                contract?.estado === 'LIQUIDADO' ? 'Contrato Liquidado' : 'Contrato Resuelto'
              }}</strong>
              @if (contract?.fecha_resolucion) {
                <p>
                  Resuelto el {{ contract!.fecha_resolucion | date: 'dd/MM/yyyy' }}.
                  @if (contract?.causal_resolucion) {
                    Causal: {{ causalLabel(contract!.causal_resolucion!) }}
                  }
                </p>
              }
              @if (contract?.fecha_liquidacion) {
                <p>Liquidado el {{ contract!.fecha_liquidacion | date: 'dd/MM/yyyy' }}.</p>
              }
              @if (contract?.motivo_resolucion) {
                <p>
                  <em>{{ contract!.motivo_resolucion }}</em>
                </p>
              }
            </div>
          </div>
        }

        <section class="detail-section">
          <h2>Información General</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Fecha Inicio</span>
              <p>{{ contract?.fecha_inicio | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Fecha Fin</span>
              <p>{{ contract?.fecha_fin | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Tarifa</span>
              <p class="highlight">
                {{ contract?.tarifa | currency: contract?.moneda || 'USD' }}
              </p>
            </div>
            <div class="info-item">
              <span class="label">Tipo</span>
              <p>{{ contract?.tipo || 'Alquiler' }}</p>
            </div>
          </div>
        </section>

        <section class="detail-section">
          <h2>Equipo Asignado</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Codigo Equipo</span>
              <p>
                <a [routerLink]="['/equipment', contract?.equipo_id]" class="link-primary">
                  {{ contract?.equipo_codigo || 'N/A' }}
                </a>
              </p>
            </div>
            <div class="info-item">
              <span class="label">Marca/Modelo</span>
              <p>{{ contract?.equipo_marca || '-' }} {{ contract?.equipo_modelo || '' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Serie</span>
              <p>{{ contract?.equipo_placa || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Ubicación</span>
              <p>{{ contract?.plazo_texto || 'No especificada' }}</p>
            </div>
          </div>
        </section>

        <!-- Historial de Valorizaciones -->
        @if (valuations.length > 0) {
          <section class="detail-section">
            <h2>Historial de Valorizaciones</h2>
            <aero-table
              [columns]="valuationColumns"
              [data]="valuations"
              [loading]="false"
              [templates]="{
                numero_valorizacion: valCodeTemplate,
                total_valorizado: amountTemplate,
              }"
              (rowClick)="router.navigate(['/equipment/valuations', $event.id])"
            >
            </aero-table>

            <ng-template #valCodeTemplate let-row>
              <a
                [routerLink]="['/equipment/valuations', row.id]"
                class="code-badge link-primary"
                (click)="$event.stopPropagation()"
              >
                {{ row.numeroValorizacion || '#' + row.id }}
              </a>
            </ng-template>

            <ng-template #amountTemplate let-row>
              <span class="font-mono">
                {{ row.totalValorizado | currency: 'PEN' : 'S/ ' }}
              </span>
            </ng-template>
          </section>
        }

        <!-- Annex A -->
        @if (annexA.length > 0) {
          <section class="detail-section">
            <h2>ANEXO A — Inclusiones de Tarifa</h2>
            <aero-table
              [columns]="annexColumns"
              [data]="annexA"
              [loading]="false"
              [templates]="{ incluido: incluidoTemplate }"
            >
            </aero-table>

            <ng-template #incluidoTemplate let-row>
              <span [class]="row.incluido ? 'text-success' : 'text-danger'" style="font-weight:600">
                {{ row.incluido ? 'Sí' : 'No' }}
              </span>
            </ng-template>
          </section>
        }

        <!-- Propiedad y Jurisdicción -->
        @if (contract?.documento_acredita || contract?.jurisdiccion) {
          <section class="detail-section">
            <h2>Propiedad y Jurisdicción</h2>
            <div class="info-grid">
              @if (contract?.documento_acredita) {
                <div class="info-item">
                  <span class="label">Documento que Acredita</span>
                  <p>{{ contract?.documento_acredita }}</p>
                </div>
              }
              @if (contract?.fecha_acreditada) {
                <div class="info-item">
                  <span class="label">Fecha Acreditada</span>
                  <p>{{ contract?.fecha_acreditada | date: 'dd/MM/yyyy' }}</p>
                </div>
              }
              @if (contract?.jurisdiccion) {
                <div class="info-item">
                  <span class="label">Jurisdicción</span>
                  <p>{{ contract?.jurisdiccion }}</p>
                </div>
              }
            </div>
          </section>
        }

        <!-- Obligaciones del Arrendador (WS-21 — CORP-GEM-F-001 Cláusula 7) -->
        <section class="detail-section" data-testid="obligaciones-section">
          <div class="section-header-row">
            <h2>Obligaciones del Arrendador — Cláusula 7</h2>
            @if (obligaciones.length === 0) {
              <app-button
                variant="secondary"
                size="sm"
                icon="fa-list-check"
                label="Inicializar Lista"
                (onClick)="initObligaciones()"
                [disabled]="savingObligacion"
                data-testid="btn-init-obligaciones"
              />
            }
          </div>

          @if (obligaciones.length === 0) {
            <p class="empty-hint">
              <i class="fa-solid fa-circle-info"></i>
              Presione "Inicializar Lista" para crear las 9 obligaciones según Cláusula 7.
            </p>
          }

          @if (obligaciones.length > 0) {
            <div class="obligaciones-list" data-testid="obligaciones-list">
              @for (ob of obligaciones; track ob.id) {
                <div
                  class="obligacion-row"
                  [class.obligacion-cumplida]="ob.estado === 'CUMPLIDA'"
                  [class.obligacion-incumplida]="ob.estado === 'INCUMPLIDA'"
                  [attr.data-testid]="'obligacion-' + ob.tipo_obligacion"
                >
                  <div class="obligacion-info">
                    <span class="obligacion-label">{{
                      translateObligacion(ob.tipo_obligacion)
                    }}</span>
                    @if (ob.observaciones) {
                      <span class="obligacion-obs">{{ ob.observaciones }}</span>
                    }
                    @if (ob.fecha_compromiso) {
                      <span class="obligacion-fecha">
                        <i class="fa-regular fa-calendar"></i>
                        {{ ob.fecha_compromiso | date: 'dd/MM/yyyy' }}
                      </span>
                    }
                  </div>
                  <div class="obligacion-controls">
                    <app-dropdown
                      [options]="estadoOptions"
                      [ngModel]="ob.estado"
                      (selectionChange)="updateObligacionEstado(ob, $event)"
                      [disabled]="savingObligacion"
                      [attr.data-testid]="'select-estado-' + ob.tipo_obligacion"
                    />
                  </div>
                </div>
              }
            </div>

            <div class="obligaciones-summary">
              <aero-badge variant="success">
                {{ countObligaciones('CUMPLIDA') }} cumplidas
              </aero-badge>
              <aero-badge variant="warning">
                {{ countObligaciones('PENDIENTE') }} pendientes
              </aero-badge>
              <aero-badge variant="error">
                {{ countObligaciones('INCUMPLIDA') }} incumplidas
              </aero-badge>
            </div>
          }
        </section>

        <!-- Obligaciones del Arrendatario (WS-22 — CORP-GEM-F-001 Cláusula 8) -->
        <section class="detail-section" data-testid="obligaciones-arrendatario-section">
          <div class="section-header-row">
            <h2>Obligaciones del Arrendatario — Cláusula 8</h2>
            @if (obligacionesArrendatario.length === 0) {
              <app-button
                variant="secondary"
                size="sm"
                icon="fa-list-check"
                label="Inicializar Lista"
                (onClick)="initObligacionesArrendatario()"
                [disabled]="savingObligacionArrendatario"
                data-testid="btn-init-obligaciones-arrendatario"
              />
            }
          </div>

          @if (obligacionesArrendatario.length === 0) {
            <p class="empty-hint">
              <i class="fa-solid fa-circle-info"></i>
              Presione "Inicializar Lista" para crear las 4 obligaciones según Cláusula 8.
            </p>
          }

          @if (obligacionesArrendatario.length > 0) {
            <div class="obligaciones-list" data-testid="obligaciones-arrendatario-list">
              @for (ob of obligacionesArrendatario; track ob.id) {
                <div
                  class="obligacion-row"
                  [class.obligacion-cumplida]="ob.estado === 'CUMPLIDA'"
                  [class.obligacion-incumplida]="ob.estado === 'INCUMPLIDA'"
                  [attr.data-testid]="'obligacion-arrendatario-' + ob.tipo_obligacion"
                >
                  <div class="obligacion-info">
                    <span class="obligacion-label">{{
                      translateObligacionArrendatario(ob.tipo_obligacion)
                    }}</span>
                    @if (ob.observaciones) {
                      <span class="obligacion-obs">{{ ob.observaciones }}</span>
                    }
                    @if (ob.fecha_compromiso) {
                      <span class="obligacion-fecha">
                        <i class="fa-regular fa-calendar"></i>
                        {{ ob.fecha_compromiso | date: 'dd/MM/yyyy' }}
                      </span>
                    }
                  </div>
                  <div class="obligacion-controls">
                    <app-dropdown
                      [options]="estadoOptions"
                      [ngModel]="ob.estado"
                      (selectionChange)="updateObligacionArrendatarioEstado(ob, $event)"
                      [disabled]="savingObligacionArrendatario"
                      [attr.data-testid]="'select-estado-arrendatario-' + ob.tipo_obligacion"
                    />
                  </div>
                </div>
              }
            </div>

            <div class="obligaciones-summary">
              <aero-badge variant="success">
                {{ countObligacionesArrendatario('CUMPLIDA') }} cumplidas
              </aero-badge>
              <aero-badge variant="warning">
                {{ countObligacionesArrendatario('PENDIENTE') }} pendientes
              </aero-badge>
              <aero-badge variant="error">
                {{ countObligacionesArrendatario('INCUMPLIDA') }} incumplidas
              </aero-badge>
            </div>
          }
        </section>
      </div>

      <!-- ── SIDEBAR ACTIONS ─────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        @if (['ACTIVO', 'BORRADOR'].includes(contract?.estado || '')) {
          <app-button
            variant="secondary"
            fullWidth="true"
            icon="fa-pen"
            label="Editar"
            (onClick)="editContract()"
          />
        }
        <app-button
          variant="secondary"
          fullWidth="true"
          icon="fa-file-signature"
          label="Ver Adendas"
          (onClick)="viewAddendums()"
        />
        <app-button
          variant="secondary"
          fullWidth="true"
          icon="fa-file-pdf"
          label="Descargar PDF"
          (onClick)="downloadPDF()"
        />
        @if (['ACTIVO', 'VENCIDO'].includes(contract?.estado || '')) {
          <app-button
            variant="ghost"
            fullWidth="true"
            icon="fa-scale-balanced"
            label="Resolver Contrato"
            class="text-warning-important"
            (onClick)="showResolverModal = true"
          />
        }
        @if (contract?.estado === 'RESUELTO') {
          <app-button
            variant="primary"
            fullWidth="true"
            icon="fa-circle-check"
            label="Liquidar Contrato"
            (onClick)="abrirLiquidacion()"
          />
        }
        @if (['ACTIVO', 'BORRADOR'].includes(contract?.estado || '')) {
          <app-button
            variant="danger"
            fullWidth="true"
            icon="fa-trash"
            label="Cancelar"
            (onClick)="deleteContract()"
          />
        }
        <app-button
          variant="ghost"
          fullWidth="true"
          icon="fa-arrow-left"
          label="Volver a Lista"
          routerLink="/equipment/contracts"
        />
      </ng-container>

      <!-- ── SIDEBAR AFTER (extra cards below audit) ─────────── -->

      <!-- Detalles de Vigencia -->
      <entity-detail-sidebar-card entity-sidebar-after title="Detalles de Vigencia">
        <div class="info-column">
          <div class="info-item">
            <span class="label">Cons. Contrato</span>
            <p>{{ contract?.fecha_contrato | date: 'dd/MM/yyyy' }}</p>
          </div>
          <div class="info-item">
            <span class="label">Inicio Vigencia</span>
            <p>{{ contract?.fecha_inicio | date: 'dd/MM/yyyy' }}</p>
          </div>
          <div class="info-item">
            <span class="label">Fin Vigencia</span>
            <p>{{ contract?.fecha_fin | date: 'dd/MM/yyyy' }}</p>
          </div>
          <div class="info-item">
            <span class="label">Días Restantes</span>
            <p [class.text-danger]="getDaysRemaining(contract?.fecha_fin) <= 30" class="font-bold">
              {{ getDaysRemaining(contract?.fecha_fin) }} días
            </p>
          </div>
        </div>
      </entity-detail-sidebar-card>

      <!-- Documentos Requeridos -->
      @if (requiredDocs.length > 0) {
        <entity-detail-sidebar-card entity-sidebar-after title="Documentos Requeridos">
          <div class="doc-list">
            @for (doc of requiredDocs; track doc.tipo_documento) {
              <div class="doc-item">
                <span class="doc-name">{{ translateDocType(doc.tipo_documento) }}</span>
                <aero-badge [variant]="doc.estado === 'CARGADO' ? 'success' : 'warning'">
                  {{ doc.estado }}
                </aero-badge>
              </div>
            }
          </div>
        </entity-detail-sidebar-card>
      }
    </entity-detail-shell>

    <!-- ── MODAL: Resolver Contrato ──────────────────────────── -->
    @if (showResolverModal) {
      <div class="modal" (click)="showResolverModal = false" (keydown.enter)="showResolverModal = false" tabindex="0" role="button">
        <div class="modal-content" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0" role="dialog">
          <div class="modal-header">
            <h2><i class="fa-solid fa-scale-balanced"></i> Resolver Contrato</h2>
            <button type="button" class="close" (click)="showResolverModal = false">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">
              La resolución formal registra la terminación anticipada del contrato según PRD §12.
            </p>
            <div class="form-group">
              <span class="label">Causal de Resolución<span class="required">*</span></span>
              <app-dropdown
                [options]="causalOptions"
                [(ngModel)]="resolverForm.causal_resolucion"
                placeholder="Seleccionar causal..."
              />
            </div>
            <div class="form-group">
              <span class="label">Motivo Detallado<span class="required">*</span></span>
              <textarea
                class="form-control"
                rows="3"
                [(ngModel)]="resolverForm.motivo_resolucion"
                placeholder="Describa las circunstancias de la resolución..."
              ></textarea>
            </div>
            <div class="form-group">
              <span class="label">Fecha de Resolución<span class="required">*</span></span>
              <input type="date" class="form-control" [(ngModel)]="resolverForm.fecha_resolucion" />
            </div>
            <div class="form-group">
              <span class="label">Monto de Liquidación Acordado <span class="optional">(opcional)</span></span>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="resolverForm.monto_liquidacion"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
          <div class="modal-footer">
            <app-button
              variant="secondary"
              label="Cancelar"
              (onClick)="showResolverModal = false"
            />
            <app-button
              variant="warning"
              [label]="savingLifecycle ? 'Guardando...' : 'Registrar Resolución'"
              [disabled]="
                savingLifecycle ||
                !resolverForm.causal_resolucion ||
                !resolverForm.motivo_resolucion ||
                !resolverForm.fecha_resolucion
              "
              (onClick)="confirmarResolucion()"
            />
          </div>
        </div>
      </div>
    }

    <!-- ── MODAL: Liquidar Contrato ───────────────────────────── -->
    @if (showLiquidarModal) {
      <div class="modal" (click)="showLiquidarModal = false" (keydown.enter)="showLiquidarModal = false" tabindex="0" role="button">
        <div class="modal-content" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0" role="dialog">
          <div class="modal-header">
            <h2><i class="fa-solid fa-circle-check"></i> Liquidar Contrato</h2>
            <button type="button" class="close" (click)="showLiquidarModal = false">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <!-- Prerequisites check -->
            @if (liquidationCheck) {
              <div
                class="prereq-panel"
                [class.prereq-ok]="liquidationCheck.puede_liquidar"
                [class.prereq-fail]="!liquidationCheck.puede_liquidar"
              >
                <h4>Verificación de Requisitos</h4>
                <ul class="prereq-list">
                  <li [class.ok]="liquidationCheck.valorizaciones_pendientes === 0">
                    <i
                      class="fa-solid"
                      [class.fa-check]="liquidationCheck.valorizaciones_pendientes === 0"
                      [class.fa-xmark]="liquidationCheck.valorizaciones_pendientes > 0"
                    ></i>
                    Valorizaciones pagadas ({{
                      liquidationCheck.total_valorizaciones -
                        liquidationCheck.valorizaciones_pendientes
                    }}/{{ liquidationCheck.total_valorizaciones }})
                  </li>
                  <li [class.ok]="liquidationCheck.tiene_acta_devolucion">
                    <i
                      class="fa-solid"
                      [class.fa-check]="liquidationCheck.tiene_acta_devolucion"
                      [class.fa-xmark]="!liquidationCheck.tiene_acta_devolucion"
                    ></i>
                    Acta de Devolución registrada
                  </li>
                </ul>
                @if (!liquidationCheck.puede_liquidar) {
                  <p class="prereq-warning">
                    No se puede liquidar hasta resolver los requisitos anteriores.
                  </p>
                }
              </div>
            }
            @if (liquidationCheck?.puede_liquidar) {
              <div class="form-group">
                <span class="label">Fecha de Liquidación<span class="required">*</span></span>
                <input
                  type="date"
                  class="form-control"
                  [(ngModel)]="liquidarForm.fecha_liquidacion"
                />
              </div>
              <div class="form-group">
                <span class="label">Monto Final de Liquidación <span class="optional">(opcional)</span></span>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="liquidarForm.monto_liquidacion"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div class="form-group">
                <span class="label">Observaciones de Cierre <span class="optional">(opcional)</span></span>
                <textarea
                  class="form-control"
                  rows="3"
                  [(ngModel)]="liquidarForm.observaciones_liquidacion"
                  placeholder="Notas sobre saldos, ajustes o condiciones de cierre..."
                ></textarea>
              </div>
            }
          </div>
          <div class="modal-footer">
            <app-button
              variant="secondary"
              label="Cancelar"
              (onClick)="showLiquidarModal = false"
            />
            @if (liquidationCheck?.puede_liquidar) {
              <app-button
                variant="primary"
                [label]="savingLifecycle ? 'Guardando...' : 'Confirmar Liquidación'"
                [disabled]="savingLifecycle || !liquidarForm.fecha_liquidacion"
                (onClick)="confirmarLiquidacion()"
              />
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .detail-header {
        border-bottom: 1px solid var(--grey-100);
        margin-bottom: var(--s-24);
        padding-bottom: var(--s-24);
      }

      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--s-32);
        margin-top: var(--s-8);
      }

      .alert-row {
        display: flex;
        gap: var(--s-12);
        padding: var(--s-16);
        border-radius: var(--radius-sm);
        margin-bottom: var(--s-8);

        i {
          font-size: 18px;
          margin-top: 2px;
        }

        strong {
          display: block;
          margin-bottom: 4px;
        }

        p {
          margin: 0;
          font-size: 14px;
        }
      }

      .alert-warning {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
        border: 1px solid var(--semantic-yellow-200);
      }

      .link-primary {
        color: var(--primary-500);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }

      .font-mono {
        font-family: var(--font-family-mono);
      }

      .font-bold {
        font-weight: 700;
      }

      .text-danger {
        color: var(--semantic-red-500) !important;
      }

      .text-success {
        color: var(--semantic-green-700);
      }

      /* Sidebar extras */
      .info-column {
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
      }

      .doc-list {
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
      }

      .doc-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--s-8);
        border: 1px solid var(--grey-100);
        border-radius: var(--radius-sm);
        font-size: 13px;
        font-weight: 500;
      }

      .badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }

      .badge-success {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }

      .badge-warning {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
      }

      /* Lifecycle modals */
      .modal {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background: var(--white);
        border-radius: var(--radius-lg);
        width: 520px;
        max-width: 95vw;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--s-16) var(--s-24);
        border-bottom: 1px solid var(--grey-100);

        h2 {
          font-size: 16px;
          font-weight: 600;
          color: var(--grey-900);
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }

        .close {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--grey-400);
          padding: 4px;
          border-radius: 4px;
          &:hover {
            color: var(--grey-700);
          }
        }
      }

      .modal-body {
        padding: var(--s-24);
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
      }

      .modal-desc {
        font-size: 13px;
        color: var(--grey-600);
        margin: 0;
        padding: 10px 12px;
        background: var(--grey-50);
        border-radius: var(--radius-md);
      }

      .modal-footer {
        display: flex;
        gap: var(--s-8);
        justify-content: flex-end;
        padding: var(--s-16) var(--s-24);
        border-top: 1px solid var(--grey-100);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;

        label {
          font-size: 13px;
          font-weight: 500;
          color: var(--grey-700);
        }

        .required {
          color: var(--semantic-red-500);
          margin-left: 2px;
        }
        .optional {
          font-size: 11px;
          color: var(--grey-400);
        }
      }

      .form-control,
      .form-select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-md);
        font-size: 14px;
        color: var(--grey-900);
        background: var(--white);
        &:focus {
          outline: 2px solid var(--primary-300);
          border-color: var(--primary-500);
        }
      }

      .prereq-panel {
        border-radius: var(--radius-md);
        padding: 12px 16px;
        margin-bottom: 4px;

        h4 {
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 10px;
        }

        &.prereq-ok {
          background: #dcfce7;
          border: 1px solid #86efac;
        }
        &.prereq-fail {
          background: #fef2f2;
          border: 1px solid #fca5a5;
        }
      }

      .prereq-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;

        li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--grey-600);

          &.ok {
            color: #15803d;
          }

          i.fa-check {
            color: #22c55e;
          }
          i.fa-xmark {
            color: #ef4444;
          }
        }
      }

      .prereq-warning {
        font-size: 12px;
        color: #b91c1c;
        margin: 8px 0 0;
        font-style: italic;
      }

      /* Obligaciones del Arrendador (WS-21) */
      .section-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;

        h2 {
          margin: 0;
        }
      }

      .empty-hint {
        color: var(--grey-500);
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .obligaciones-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }

      .obligacion-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 14px;
        border-radius: var(--radius-sm, 6px);
        border: 1px solid var(--grey-200);
        background: var(--grey-50);
        transition: background 0.15s;

        &.obligacion-cumplida {
          background: var(--semantic-green-50, #f0fdf4);
          border-color: var(--semantic-green-200, #bbf7d0);
        }
        &.obligacion-incumplida {
          background: #fff5f5;
          border-color: #fecaca;
        }
      }

      .obligacion-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
      }

      .obligacion-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-800);
      }

      .obligacion-obs {
        font-size: 12px;
        color: var(--grey-500);
        font-style: italic;
      }

      .obligacion-fecha {
        font-size: 12px;
        color: var(--grey-500);
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .obligacion-controls {
        flex-shrink: 0;
        .form-select-sm {
          font-size: 12px;
          padding: 4px 8px;
          min-width: 110px;
        }
      }

      .obligaciones-summary {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .badge-danger {
          background: #fee2e2;
          color: #b91c1c;
          border-color: #fecaca;
        }
      }

      .alert-success {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
        border: 1px solid var(--semantic-green-200);
      }
    `,
  ],
})
export class ContractDetailComponent implements OnInit {
  private contractService = inject(ContractService);
  private valuationService = inject(ValuationService);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);
  router = inject(Router);
  private dialog = inject(MatDialog);

  contract: Contract | null = null;
  valuations: Valuation[] = [];
  loading = true;
  showDeleteModal = false;
  annexA: { concepto: string; incluido: boolean; observaciones: string }[] = [];
  annexB: { concepto: string; incluido: boolean; observaciones: string }[] = [];
  requiredDocs: { tipo_documento: string; estado: string }[] = [];

  // WS-21: Obligaciones del Arrendador
  obligaciones: ContractObligacion[] = [];
  savingObligacion = false;

  // WS-22: Obligaciones del Arrendatario
  obligacionesArrendatario: ContractObligacionArrendatario[] = [];
  savingObligacionArrendatario = false;

  // WS-16: Lifecycle modals
  showResolverModal = false;
  showLiquidarModal = false;
  savingLifecycle = false;
  liquidationCheck: {
    puede_liquidar: boolean;
    contrato_estado: string;
    valorizaciones_pendientes: number;
    total_valorizaciones: number;
    tiene_acta_devolucion: boolean;
    observaciones: string[];
  } | null = null;

  resolverForm = {
    causal_resolucion: '',
    motivo_resolucion: '',
    fecha_resolucion: new Date().toISOString().split('T')[0],
    monto_liquidacion: undefined as number | undefined,
  };

  liquidarForm = {
    fecha_liquidacion: new Date().toISOString().split('T')[0],
    monto_liquidacion: undefined as number | undefined,
    observaciones_liquidacion: '',
  };

  readonly causalLabels: Record<string, string> = {
    MUTUO_ACUERDO: 'Mutuo acuerdo (§12.1)',
    INCUMPLIMIENTO_ARRENDADOR: 'Incumplimiento del arrendador (§12.2)',
    INCUMPLIMIENTO_ARRENDATARIO: 'Incumplimiento del arrendatario (§12.3)',
    FUERZA_MAYOR: 'Fuerza mayor (§12.4)',
    VENCIMIENTO: 'Vencimiento de plazo (§12.5)',
    DECISION_UNILATERAL: 'Decisión unilateral (§12.6)',
    QUIEBRA: 'Quiebra / insolvencia (§12.7)',
    INCAPACIDAD: 'Incapacidad del arrendador (§12.8)',
    JUDICIAL: 'Intervención judicial (§12.9)',
    OTRO: 'Otras causas (§12.10)',
  };

  readonly estadoOptions: DropdownOption[] = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Cumplida', value: 'CUMPLIDA' },
    { label: 'Incumplida', value: 'INCUMPLIDA' },
  ];

  readonly causalOptions: DropdownOption[] = [
    { label: '§12.1 — Mutuo acuerdo', value: 'MUTUO_ACUERDO' },
    { label: '§12.2 — Incumplimiento del arrendador', value: 'INCUMPLIMIENTO_ARRENDADOR' },
    { label: '§12.3 — Incumplimiento del arrendatario', value: 'INCUMPLIMIENTO_ARRENDATARIO' },
    { label: '§12.4 — Caso fortuito o fuerza mayor', value: 'FUERZA_MAYOR' },
    { label: '§12.5 — Vencimiento de plazo', value: 'VENCIMIENTO' },
    { label: '§12.6 — Decisión unilateral (con preaviso)', value: 'DECISION_UNILATERAL' },
    { label: '§12.7 — Quiebra / insolvencia', value: 'QUIEBRA' },
    { label: '§12.8 — Muerte o incapacidad del arrendador', value: 'INCAPACIDAD' },
    { label: '§12.9 — Intervención judicial', value: 'JUDICIAL' },
    { label: '§12.10 — Otras causas previstas', value: 'OTRO' },
  ];

  get header(): EntityDetailHeader {
    return {
      icon: 'fa-solid fa-file-contract',
      title: `Contrato ${this.contract?.numero_contrato ?? ''}`,
      subtitle: this.contract?.proveedor_razon_social || 'Proveedor no especificado',
      codeBadge: this.contract?.numero_contrato,
      statusLabel: this.getStatusLabel(this.contract?.estado ?? 'BORRADOR'),
      statusClass: this.getStatusClass(this.contract?.estado ?? 'BORRADOR'),
    };
  }

  get auditInfo(): AuditInfo {
    return {
      entries: [
        { date: this.contract?.updated_at, label: 'Última actualización' },
        { date: this.contract?.created_at, label: 'Contrato registrado' },
      ],
    };
  }

  notFoundConfig: NotFoundConfig = {
    icon: 'fa-solid fa-file-circle-xmark',
    title: 'Contrato no encontrado',
    message: 'La información solicitada no está disponible actualmente.',
    backLabel: 'Ver Todos los Contratos',
    backRoute: '/equipment/contracts',
  };

  valuationColumns: TableColumn[] = [
    { key: 'numero_valorizacion', label: 'N° Valorización', type: 'template' },
    { key: 'periodo', label: 'Periodo', type: 'text' },
    { key: 'fechaInicio', label: 'Fecha Inicio', type: 'date' },
    { key: 'fechaFin', label: 'Fecha Fin', type: 'date' },
    { key: 'total_valorizado', label: 'Monto', type: 'template', align: 'right' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        BORRADOR: { label: 'Borrador', class: 'status-badge status-BORRADOR', icon: 'fa-pencil' },
        PENDIENTE: { label: 'Pendiente', class: 'status-badge status-PENDIENTE', icon: 'fa-clock' },
        EN_REVISION: {
          label: 'En Revisión',
          class: 'status-badge status-PENDIENTE',
          icon: 'fa-eye',
        },
        VALIDADO: {
          label: 'Validado',
          class: 'status-badge status-PENDIENTE',
          icon: 'fa-clipboard-check',
        },
        APROBADO: { label: 'Aprobado', class: 'status-badge status-APROBADO', icon: 'fa-check' },
        PAGADO: {
          label: 'Pagado',
          class: 'status-badge status-APROBADO',
          icon: 'fa-dollar-sign',
        },
        RECHAZADO: {
          label: 'Rechazado',
          class: 'status-badge status-CANCELADO',
          icon: 'fa-xmark',
        },
      },
    },
  ];

  annexColumns: TableColumn[] = [
    { key: 'concepto', label: 'Concepto', type: 'text' },
    { key: 'incluido', label: 'Incluido', type: 'template' },
    { key: 'observaciones', label: 'Observaciones', type: 'text' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadContract(id);
    this.loadValuations(id);
  }

  loadContract(id: string): void {
    this.loading = true;
    this.contractService.getById(id).subscribe({
      next: (data) => {
        this.contract = data;
        this.loading = false;
        this.loadAnnexes(id);
        this.loadRequiredDocs(id);
        this.loadObligaciones(id);
        this.loadObligacionesArrendatario(id);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadValuations(contractId: string): void {
    this.valuationService.getAll({ contrato_id: contractId }).subscribe({
      next: (data) => (this.valuations = data),
      error: (err) => console.error('Error loading valuations', err),
    });
  }

  loadAnnexes(id: string): void {
    this.contractService.getAnnexes(id, 'A').subscribe({
      next: (items) => (this.annexA = items),
    });
    this.contractService.getAnnexes(id, 'B').subscribe({
      next: (items) => (this.annexB = items),
    });
  }

  loadRequiredDocs(id: string): void {
    this.contractService.getRequiredDocuments(id).subscribe({
      next: (docs) => (this.requiredDocs = docs),
    });
  }

  // WS-21: Obligaciones del Arrendador
  loadObligaciones(id: string): void {
    this.contractService.getObligaciones(id).subscribe({
      next: (items) => (this.obligaciones = items),
    });
  }

  initObligaciones(): void {
    if (!this.contract) return;
    this.savingObligacion = true;
    this.contractService.initializeObligaciones(this.contract.id.toString()).subscribe({
      next: (items) => {
        this.obligaciones = items;
        this.savingObligacion = false;
      },
      error: (err) => {
        console.error('Error initializing obligaciones', err);
        this.savingObligacion = false;
      },
    });
  }

  countObligaciones(estado: string): number {
    return this.obligaciones.filter((o) => o.estado === estado).length;
  }

  translateObligacion(tipo: string): string {
    return OBLIGACION_LABELS[tipo] || tipo;
  }

  updateObligacionEstado(
    ob: ContractObligacion,
    nuevoEstado: 'PENDIENTE' | 'CUMPLIDA' | 'INCUMPLIDA'
  ): void {
    if (!ob || !nuevoEstado) return;
    this.savingObligacion = true;
    this.contractService.updateObligacion(ob.id, { estado: nuevoEstado }).subscribe({
      next: (updated) => {
        const idx = this.obligaciones.findIndex((o) => o.id === ob.id);
        if (idx !== -1) {
          this.obligaciones[idx] = updated;
        }
        this.savingObligacion = false;
      },
      error: (err) => {
        console.error('Error updating obligacion', err);
        this.savingObligacion = false;
        // The dropdown component uses its own internal state,
        // but since we use [ngModel], it should sync back if we force a re-render
        // or we could add more complex state management if needed.
      },
    });
  }

  // ─── WS-22: Obligaciones del Arrendatario ───────────────────────────────

  loadObligacionesArrendatario(id: string): void {
    this.contractService
      .getObligacionesArrendatario(id)
      .subscribe({ next: (items) => (this.obligacionesArrendatario = items) });
  }

  initObligacionesArrendatario(): void {
    if (!this.contract) return;
    this.savingObligacionArrendatario = true;
    this.contractService.initializeObligacionesArrendatario(this.contract.id.toString()).subscribe({
      next: (items) => {
        this.obligacionesArrendatario = items;
        this.savingObligacionArrendatario = false;
      },
      error: (err) => {
        console.error('Error initializing obligaciones arrendatario', err);
        this.savingObligacionArrendatario = false;
      },
    });
  }

  updateObligacionArrendatarioEstado(
    ob: ContractObligacionArrendatario,
    estado: 'PENDIENTE' | 'CUMPLIDA' | 'INCUMPLIDA'
  ): void {
    this.savingObligacionArrendatario = true;
    this.contractService.updateObligacionArrendatario(ob.id, { estado }).subscribe({
      next: (updated) => {
        const idx = this.obligacionesArrendatario.findIndex((o) => o.id === ob.id);
        if (idx !== -1) {
          this.obligacionesArrendatario[idx] = updated;
        }
        this.savingObligacionArrendatario = false;
      },
      error: (err) => {
        console.error('Error updating obligacion arrendatario', err);
        this.savingObligacionArrendatario = false;
      },
    });
  }

  countObligacionesArrendatario(estado: string): number {
    return this.obligacionesArrendatario.filter((o) => o.estado === estado).length;
  }

  translateObligacionArrendatario(tipo: string): string {
    return OBLIGACION_ARRENDATARIO_LABELS[tipo] || tipo;
  }

  translateDocType(tipo: string): string {
    const map: Record<string, string> = {
      POLIZA_TREC: 'Póliza TREC',
      SOAT: 'SOAT',
      INSPECCION_TECNICA: 'Inspección Técnica',
      TARJETA_PROPIEDAD: 'Tarjeta de Propiedad',
      LICENCIA_CONDUCIR: 'Licencia de Conducir',
    };
    return map[tipo] || tipo;
  }

  editContract(): void {
    if (this.contract) {
      this.router.navigate(['/equipment/contracts', this.contract.id.toString(), 'edit']);
    }
  }

  confirmDelete(): void {
    if (this.contract) {
      this.contractService.delete(this.contract.id.toString()).subscribe({
        next: () => {
          this.router.navigate(['/equipment/contracts']);
        },
        error: (error) => {
          console.error('Failed to delete contract:', error);
        },
      });
    }
  }

  deleteContract(): void {
    this.confirmSvc
      .confirmDelete(`el contrato ${this.contract?.numero_contrato}`)
      .subscribe((confirmed) => {
        if (confirmed) {
          this.confirmDelete();
        }
      });
  }

  viewAddendums(): void {
    if (!this.contract) return;

    const dialogRef = this.dialog.open(ContractAddendumDialogComponent, {
      width: '500px',
      data: {
        contractId: this.contract.id.toString(),
        currentEndDate: this.contract.fecha_fin,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.contract) {
        this.contractService.createAddendum(this.contract.id.toString(), result).subscribe({
          next: () => {
            this.loadContract(this.contract!.id.toString());
            alert('Adenda creada exitosamente');
          },
          error: (err) => console.error('Error creating addendum', err),
        });
      }
    });
  }

  downloadPDF(): void {
    if (!this.contract) return;

    this.contractService.downloadPdf(this.contract.id.toString()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Contrato-${this.contract?.numero_contrato}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading PDF', err);
        alert('Error al descargar el PDF. Asegúrese de que el backend soporte esta funcionalidad.');
      },
    });
  }

  getDaysRemaining(dateStr: string | undefined): number {
    if (!dateStr) return 0;
    const endDate = new Date(dateStr);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  causalLabel(causal: string): string {
    return this.causalLabels[causal] || causal;
  }

  abrirLiquidacion(): void {
    if (!this.contract) return;
    this.liquidationCheck = null;
    this.contractService.liquidationCheck(this.contract.id.toString()).subscribe({
      next: (check: {
        puede_liquidar: boolean;
        contrato_estado: string;
        valorizaciones_pendientes: number;
        total_valorizaciones: number;
        tiene_acta_devolucion: boolean;
        observaciones: string[];
      }) => {
        this.liquidationCheck = check;
        this.showLiquidarModal = true;
      },
      error: (err: HttpErrorResponse) =>
        alert('Error verificando requisitos: ' + (err.error?.error?.message || err.message)),
    });
  }

  confirmarResolucion(): void {
    if (!this.contract) return;
    this.savingLifecycle = true;
    this.contractService
      .resolver(this.contract.id.toString(), {
        causal_resolucion: this.resolverForm.causal_resolucion,
        motivo_resolucion: this.resolverForm.motivo_resolucion,
        fecha_resolucion: this.resolverForm.fecha_resolucion,
        monto_liquidacion: this.resolverForm.monto_liquidacion,
      })
      .subscribe({
        next: () => {
          this.savingLifecycle = false;
          this.showResolverModal = false;
          this.loadContract(this.contract!.id.toString());
        },
        error: (err: HttpErrorResponse) => {
          this.savingLifecycle = false;
          alert('Error: ' + (err.error?.error?.message || err.message));
        },
      });
  }

  confirmarLiquidacion(): void {
    if (!this.contract) return;
    this.savingLifecycle = true;
    this.contractService
      .liquidar(this.contract.id.toString(), {
        fecha_liquidacion: this.liquidarForm.fecha_liquidacion,
        monto_liquidacion: this.liquidarForm.monto_liquidacion,
        observaciones_liquidacion: this.liquidarForm.observaciones_liquidacion || undefined,
      })
      .subscribe({
        next: () => {
          this.savingLifecycle = false;
          this.showLiquidarModal = false;
          this.loadContract(this.contract!.id.toString());
        },
        error: (err: HttpErrorResponse) => {
          this.savingLifecycle = false;
          alert('Error: ' + (err.error?.error?.message || err.message));
        },
      });
  }

  getStatusLabel(estado: string): string {
    const labelMap: Record<string, string> = {
      BORRADOR: 'Borrador',
      ACTIVO: 'Activo',
      VENCIDO: 'Vencido',
      CANCELADO: 'Cancelado',
      RESUELTO: 'Resuelto',
      LIQUIDADO: 'Liquidado',
    };
    return labelMap[estado] || estado;
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'ACTIVO':
        return 'status-APROBADO';
      case 'PENDIENTE':
      case 'BORRADOR':
        return 'status-PENDIENTE';
      case 'RESUELTO':
        return 'status-EN_REVISION';
      case 'LIQUIDADO':
        return 'status-VALIDADO';
      case 'VENCIDO':
      case 'CANCELADO':
        return 'status-CANCELADO';
      default:
        return 'status-BORRADOR';
    }
  }
}
