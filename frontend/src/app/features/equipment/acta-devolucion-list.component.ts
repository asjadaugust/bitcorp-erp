import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ActaDevolucionService, ActaDevolucion } from '../../core/services/acta-devolucion.service';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-acta-devolucion-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    ActionsContainerComponent,
    AeroTableComponent,
    FilterBarComponent,
    PageCardComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Actas de Devolución / Desmovilización"
      icon="fa-file-signature"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-button
          variant="primary"
          icon="fa-plus"
          label="Nueva Acta"
          (clicked)="navigateToCreate()"
        ></app-button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-table
          [columns]="columns"
          [data]="actas"
          [loading]="loading"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            tipo: tipoTemplate,
            condicion: condicionTemplate,
            estado: estadoTemplate,
            firmas: firmasTemplate,
          }"
          (rowClick)="verDetalle($event.id)"
        >
        </aero-table>
      </app-page-card>

      <!-- Templates -->
      <ng-template #tipoTemplate let-row>
        <span class="badge" [ngClass]="tipoClass(row.tipo)">
          {{ tipoLabel(row.tipo) }}
        </span>
      </ng-template>

      <ng-template #condicionTemplate let-row>
        <span class="badge" [ngClass]="condicionClass(row.condicion_equipo)">
          {{ condicionLabel(row.condicion_equipo) }}
        </span>
      </ng-template>

      <ng-template #estadoTemplate let-row>
        <span class="badge" [ngClass]="estadoClass(row.estado)">{{ row.estado }}</span>
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
          <app-button
            *ngIf="['BORRADOR', 'PENDIENTE'].includes(row.estado)"
            variant="icon"
            size="sm"
            icon="fa-pen"
            title="Editar"
            [routerLink]="[row.id, 'edit']"
          ></app-button>
          <app-button
            *ngIf="row.estado === 'BORRADOR'"
            variant="icon"
            size="sm"
            icon="fa-paper-plane"
            title="Enviar para firma"
            (clicked)="enviarParaFirma(row)"
          ></app-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .badge {
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .badge-borrador {
        background: var(--grey-100);
        color: var(--grey-600);
      }
      .badge-pendiente {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
      }
      .badge-firmado {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }
      .badge-anulado {
        background: var(--semantic-red-50);
        color: var(--grey-900);
      }
      .badge-devolucion {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }
      .badge-desmobil {
        background: var(--primary-50);
        color: var(--primary-700);
      }
      .badge-transfer {
        background: var(--grey-100);
        color: var(--grey-900);
      }
      .badge-bueno {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }
      .badge-regular {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
      }
      .badge-malo {
        background: var(--semantic-red-50);
        color: var(--grey-900);
      }
      .badge-obs {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
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
  private svc = inject(ActaDevolucionService);
  private router = inject(Router);
  private confirmSvc = inject(ConfirmService);

  actas: ActaDevolucion[] = [];
  loading = false;
  filtroEstado = '';
  filtroTipo = '';
  search = '';
  page = 1;
  limit = 20;
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

  columns: TableColumn[] = [
    { key: 'codigo', label: 'Código', type: 'text' },
    { key: 'equipo_id', label: 'Equipo ID', type: 'text' },
    { key: 'tipo', label: 'Tipo', type: 'template' },
    { key: 'fecha_devolucion', label: 'Fecha Devolución', type: 'date' },
    { key: 'condicion_equipo', label: 'Condición', type: 'template' },
    { key: 'estado', label: 'Estado', type: 'template' },
    { key: 'firmas', label: 'Firmas', type: 'template' },
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

  estadoClass(estado: string) {
    return {
      'badge-borrador': estado === 'BORRADOR',
      'badge-pendiente': estado === 'PENDIENTE',
      'badge-firmado': estado === 'FIRMADO',
      'badge-anulado': estado === 'ANULADO',
    };
  }

  tipoClass(tipo: string) {
    return {
      'badge-devolucion': tipo === 'DEVOLUCION',
      'badge-desmobil': tipo === 'DESMOBILIZACION',
      'badge-transfer': tipo === 'TRANSFERENCIA',
    };
  }

  tipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      DEVOLUCION: 'Devolución',
      DESMOBILIZACION: 'Desmovil.',
      TRANSFERENCIA: 'Transfer.',
    };
    return labels[tipo] ?? tipo;
  }

  condicionClass(c: string) {
    return {
      'badge-bueno': c === 'BUENO',
      'badge-regular': c === 'REGULAR',
      'badge-malo': c === 'MALO',
      'badge-obs': c === 'CON_OBSERVACIONES',
    };
  }

  condicionLabel(c: string): string {
    const labels: Record<string, string> = {
      BUENO: 'Bueno',
      REGULAR: 'Regular',
      MALO: 'Malo',
      CON_OBSERVACIONES: 'C/Obs.',
    };
    return labels[c] ?? c;
  }
}
