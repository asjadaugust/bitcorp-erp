import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ActaDevolucionService, ActaDevolucion } from '../../core/services/acta-devolucion.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { ConfirmService } from '../../core/services/confirm.service';
import { EQUIPMENT_TABS } from './equipment-tabs';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-acta-devolucion-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    ActionsContainerComponent,
    AeroDataGridComponent,
    FilterBarComponent,
    PageCardComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Actas de Devolución / Desmovilización"
      icon="fa-file-signature"
      [tabs]="tabs"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToCreate()"
          >Nueva Acta</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'acta-devolucion-list'"
          [columns]="columns"
          [data]="actas"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [serverSide]="true"
          [totalItems]="total"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            codigo: codigoTemplate,
            equipo: equipoTemplate,
            firmas: firmasTemplate,
          }"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
          (rowClick)="verDetalle($event.id)"
        >
        </aero-data-grid>
      </app-page-card>

      <!-- Templates -->
      <ng-template #codigoTemplate let-row>
        <span class="code-badge">{{ row.codigo }}</span>
      </ng-template>

      <ng-template #equipoTemplate let-row>
        <div class="equipo-cell">
          <span class="equipo-codigo">{{ row.equipo_codigo || '#' + row.equipo_id }}</span>
          @if (row.equipo_descripcion) {
            <span class="equipo-desc">{{ row.equipo_descripcion }}</span>
          }
        </div>
      </ng-template>

      <ng-template #firmasTemplate let-row>
        <div class="firma-indicators">
          <i
            class="fa-solid fa-pen-nib"
            [class.text-success]="row.tiene_firma_entregado"
            [class.text-muted]="!row.tiene_firma_entregado"
            title="Firma entregador"
          ></i>
          <i
            class="fa-solid fa-pen-nib"
            [class.text-success]="row.tiene_firma_recibido"
            [class.text-muted]="!row.tiene_firma_recibido"
            title="Firma receptor"
          ></i>
        </div>
      </ng-template>

      <ng-template #actionsTemplate let-row>
        <div
          class="action-buttons"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="toolbar"
        >
          <aero-button
            *ngIf="['BORRADOR', 'PENDIENTE'].includes(row.estado)"
            variant="ghost"
            size="small"
            iconCenter="fa-pen"
            title="Editar"
            [routerLink]="[row.id, 'edit']"
          ></aero-button>
          <aero-button
            *ngIf="row.estado === 'BORRADOR'"
            variant="ghost"
            size="small"
            iconCenter="fa-paper-plane"
            title="Enviar para firma"
            (clicked)="enviarParaFirma(row)"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .code-badge {
        font-family: monospace;
        font-size: 12px;
        background: var(--grey-100);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-weight: 600;
        color: var(--primary-700);
      }
      .equipo-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .equipo-codigo {
        font-family: monospace;
        font-size: 12px;
        font-weight: 700;
        color: var(--grey-900);
        background: var(--grey-100);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        display: inline-block;
      }
      .equipo-desc {
        font-size: 12px;
        color: var(--grey-500);
      }
      .firma-indicators {
        display: flex;
        gap: 6px;
        font-size: 16px;
      }
      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      .text-success {
        color: var(--semantic-blue-500);
      }
    `,
  ],
})
export class ActaDevolucionListComponent implements OnInit {
  tabs = EQUIPMENT_TABS;
  private svc = inject(ActaDevolucionService);
  private router = inject(Router);
  private confirmSvc = inject(ConfirmService);

  actas: ActaDevolucion[] = [];
  loading = false;
  filtroEstado = '';
  filtroTipo = '';
  search = '';
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Equipos', url: '/equipment' },
    { label: 'Actas de Devolución' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por código, equipo...',
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Borrador', value: 'BORRADOR' },
        { label: 'Pendiente firma', value: 'PENDIENTE' },
        { label: 'Firmado', value: 'FIRMADO' },
        { label: 'Anulado', value: 'ANULADO' },
      ],
    },
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'select',
      options: [
        { label: 'Devolución', value: 'DEVOLUCION' },
        { label: 'Desmovilización', value: 'DESMOBILIZACION' },
        { label: 'Transferencia', value: 'TRANSFERENCIA' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'codigo', label: 'Codigo', type: 'template', width: '110px', sortable: true },
    { key: 'equipo', label: 'Equipo', type: 'template', sortable: true },
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'badge',
      width: '110px',
      badgeConfig: {
        DEVOLUCION: { label: 'Devolucion', class: 'status-badge status-info' },
        DESMOBILIZACION: { label: 'Desmovil.', class: 'status-badge status-warning' },
        TRANSFERENCIA: { label: 'Transfer.', class: 'status-badge status-neutral' },
      },
    },
    { key: 'fecha_devolucion', label: 'Fecha', type: 'date', width: '110px', sortable: true },
    { key: 'proyecto', label: 'Proyecto', type: 'text', hidden: true },
    { key: 'responsable', label: 'Responsable', type: 'text', hidden: true },
    { key: 'motivo', label: 'Motivo', type: 'text', hidden: true },
    {
      key: 'condicion_equipo',
      label: 'Condición',
      type: 'badge',
      width: '110px',
      badgeConfig: {
        BUENO: { label: 'Bueno', class: 'status-badge status-completed', icon: 'fa-check' },
        REGULAR: { label: 'Regular', class: 'status-badge status-warning', icon: 'fa-minus' },
        MALO: { label: 'Malo', class: 'status-badge status-error', icon: 'fa-times' },
        CON_OBSERVACIONES: { label: 'C/Obs.', class: 'status-badge status-info', icon: 'fa-eye' },
      },
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      width: '110px',
      badgeConfig: {
        BORRADOR: { label: 'Borrador', class: 'status-badge status-draft', icon: 'fa-pencil' },
        PENDIENTE: { label: 'Pendiente', class: 'status-badge status-pending', icon: 'fa-clock' },
        FIRMADO: { label: 'Firmado', class: 'status-badge status-completed', icon: 'fa-check' },
        ANULADO: { label: 'Anulado', class: 'status-badge status-cancelled', icon: 'fa-ban' },
      },
    },
    { key: 'firmas', label: 'Firmas', type: 'template', width: '80px' },
    { key: 'observaciones', label: 'Observaciones', type: 'text' },
  ];

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    const filters: Record<string, string | number> = {
      page: this.page,
      limit: this.limit,
      estado: this.filtroEstado,
      tipo: this.filtroTipo,
      search: this.search,
    };

    this.svc.listar(filters).subscribe({
      next: (res) => {
        this.actas = res.data ?? [];
        this.total = res.pagination?.total ?? 0;
        this.totalPages = res.pagination?.total_pages ?? 1;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.cargar();
  }
  onPageSizeChange(size: number): void {
    this.limit = size;
    this.page = 1;
    this.cargar();
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.search = (filters['search'] as string) || '';
    this.filtroEstado = (filters['estado'] as string) || '';
    this.filtroTipo = (filters['tipo'] as string) || '';
    this.page = 1;
    this.cargar();
  }

  navigateToCreate() {
    this.router.navigate(['/equipment/actas-devolucion/new']);
  }

  verDetalle(id: number) {
    this.router.navigate(['/equipment/actas-devolucion', id]);
  }

  enviarParaFirma(a: ActaDevolucion) {
    this.confirmSvc
      .confirm({
        title: 'Enviar para Firma',
        message: `¿Desea enviar el acta ${a.codigo} para firma?`,
        icon: 'fa-paper-plane',
        confirmLabel: 'Enviar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.svc.enviarParaFirma(a.id).subscribe(() => this.cargar());
        }
      });
  }
}
