import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PettyCashService, CajaChicaDetalle, MovimientoCaja } from './petty-cash.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../core/design-system/data-grid/aero-data-grid.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import { ActionsContainerComponent } from '../../../shared/components/actions-container/actions-container.component';
import { AeroButtonComponent, AeroBadgeComponent } from '../../../core/design-system';

@Component({
  selector: 'app-petty-cash-detail',
  standalone: true,
  imports: [
    CommonModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    PageCardComponent,
    ActionsContainerComponent,
    AeroButtonComponent,
    AeroBadgeComponent,
  ],
  template: `
    <app-page-layout
      title="Detalle Caja Chica"
      icon="fa-cash-register"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      backUrl="/administracion/petty-cash"
    >
      <app-actions-container actions>
        @if (caja?.estatus === 'ABIERTA') {
          <aero-button variant="secondary" iconLeft="fa-pen" (clicked)="editCaja()">
            Editar
          </aero-button>
          <aero-button
            variant="secondary"
            iconLeft="fa-lock"
            [disabled]="closing"
            (clicked)="closeCaja()"
          >
            {{ closing ? 'Cerrando...' : 'Cerrar Caja' }}
          </aero-button>
        }
      </app-actions-container>

      @if (caja) {
        <!-- Header Info Card -->
        <app-page-card title="Información General">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">N° Caja</span>
              <p class="value">{{ caja.numero_caja || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Estatus</span>
              <p>
                <aero-badge [variant]="caja.estatus === 'ABIERTA' ? 'success' : 'info'">
                  {{ caja.estatus }}
                </aero-badge>
              </p>
            </div>
            <div class="info-item">
              <span class="label">Fecha Apertura</span>
              <p class="value">{{ caja.fecha_apertura | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Fecha Cierre</span>
              <p class="value">
                {{ caja.fecha_cierre ? (caja.fecha_cierre | date: 'dd/MM/yyyy') : '-' }}
              </p>
            </div>
            <div class="info-item">
              <span class="label">Saldo Inicial</span>
              <p class="value highlight">{{ caja.saldo_inicial | currency: 'PEN' : 'S/ ' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Ingreso Total</span>
              <p class="value">{{ caja.ingreso_total | currency: 'PEN' : 'S/ ' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Salida Total</span>
              <p class="value">{{ caja.salida_total | currency: 'PEN' : 'S/ ' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Saldo Final</span>
              <p class="value highlight">{{ caja.saldo_final | currency: 'PEN' : 'S/ ' }}</p>
            </div>
          </div>
        </app-page-card>

        <!-- Movimientos -->
        <app-page-card title="Movimientos" [noPadding]="true">
          <aero-data-grid
            [gridId]="'petty-cash-detail'"
            [columns]="movimientoColumns"
            [data]="caja.movimientos || []"
            [loading]="false"
            [dense]="true"
          >
          </aero-data-grid>
        </app-page-card>

        <!-- Solicitudes -->
        @if (caja.solicitudes && caja.solicitudes.length > 0) {
          <app-page-card title="Solicitudes" [noPadding]="true">
            <aero-data-grid
              [gridId]="'petty-cash-detail-solicitudes'"
              [columns]="solicitudColumns"
              [data]="caja.solicitudes"
              [loading]="false"
              [dense]="true"
            >
            </aero-data-grid>
          </app-page-card>
        }
      }
    </app-page-layout>
  `,
  styles: [
    `
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--s-16);
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .label {
        font-size: 12px;
        font-weight: 500;
        color: var(--grey-500);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .value {
        font-size: 14px;
        font-weight: 500;
        color: var(--grey-900);
        margin: 0;
      }

      .highlight {
        color: var(--primary-900);
        font-weight: 700;
      }
    `,
  ],
})
export class PettyCashDetailComponent implements OnInit {
  private readonly pettyCashService = inject(PettyCashService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  caja: CajaChicaDetalle | null = null;
  loading = true;
  closing = false;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Administraci\u00f3n', url: '/administracion' },
    { label: 'Caja Chica', url: '/administracion/petty-cash' },
    { label: 'Detalle' },
  ];

  movimientoColumns: DataGridColumn[] = [
    { key: 'fecha_movimiento', label: 'Fecha', type: 'date', sortable: true },
    { key: 'detalle', label: 'Detalle', type: 'text', sortable: true },
    { key: 'rubro', label: 'Rubro', type: 'text', sortable: true },
    { key: 'monto', label: 'Monto', type: 'number', sortable: true, align: 'right' },
    {
      key: 'entrada_salida',
      label: 'Tipo',
      type: 'badge',
      sortable: true,
      badgeConfig: {
        ENTRADA: { label: 'Entrada', class: 'badge success' },
        SALIDA: { label: 'Salida', class: 'badge error' },
      },
    },
    { key: 'registrado_por', label: 'Registrado Por', type: 'text' },
  ];

  solicitudColumns: DataGridColumn[] = [
    { key: 'fecha_solicitud', label: 'Fecha', type: 'date', sortable: true },
    { key: 'nombre', label: 'Solicitante', type: 'text', sortable: true },
    { key: 'motivo', label: 'Motivo', type: 'text', sortable: true },
    {
      key: 'monto_solicitado',
      label: 'Monto Solicitado',
      type: 'number',
      sortable: true,
      align: 'right',
    },
    {
      key: 'monto_rendido',
      label: 'Monto Rendido',
      type: 'number',
      sortable: true,
      align: 'right',
    },
    {
      key: 'estatus',
      label: 'Estatus',
      type: 'badge',
      sortable: true,
      badgeConfig: {
        PENDIENTE: { label: 'Pendiente', class: 'badge warning' },
        APROBADA: { label: 'Aprobada', class: 'badge success' },
        RECHAZADA: { label: 'Rechazada', class: 'badge error' },
        RENDIDA: { label: 'Rendida', class: 'badge info' },
      },
    },
  ];

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.loadCaja(id);
  }

  loadCaja(id: number): void {
    this.loading = true;
    this.pettyCashService.getCaja(id).subscribe({
      next: (caja) => {
        this.caja = caja;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/administracion/petty-cash']);
      },
    });
  }

  closeCaja(): void {
    if (!this.caja) return;
    this.closing = true;
    this.pettyCashService.closeCaja(this.caja.id).subscribe({
      next: (updated) => {
        this.caja = updated;
        this.closing = false;
      },
      error: () => {
        this.closing = false;
      },
    });
  }

  editCaja(): void {
    if (this.caja) {
      this.router.navigate(['/administracion/petty-cash', this.caja.id, 'edit']);
    }
  }
}
