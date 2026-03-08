import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ConfirmService } from '../../core/services/confirm.service';
import { ContractService } from '../../core/services/contract.service';
import { Contract } from '../../core/models/contract.model';

import {
  AeroDataGridComponent,
  DataGridColumn,
  DataGridSortEvent,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { ExcelExportService } from '../../core/services/excel-export.service';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../shared/components/export-dropdown/export-dropdown.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { EQUIPMENT_TABS, OPERACIONES_TABS } from '../equipment/equipment-tabs';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
    PageCardComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Contratos"
      icon="fa-file-contract"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="equipmentTabs"
      [subtabs]="operacionesTabs"
    >
      <app-actions-container actions>
        <app-export-dropdown [disabled]="contracts.length === 0" (export)="handleExport($event)">
        </app-export-dropdown>

        <aero-button iconLeft="fa-plus" variant="primary" (clicked)="createContract()"
          >Nuevo Contrato</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'contract-list'"
          [columns]="columns"
          [data]="contracts"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [showFilters]="true"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            numero_contrato: codeTemplate,
            vigencia: vigenciaTemplate,
          }"
          (rowClick)="viewContract($event)"
          (sortChange)="onSortChange($event)"
        >
        </aero-data-grid>
      </app-page-card>

      <!-- Custom Column Templates -->
      <ng-template #codeTemplate let-row>
        <span class="code-badge">{{ row.numero_contrato }}</span>
      </ng-template>

      <ng-template #vigenciaTemplate let-row>
        <div class="date-range">
          <span>{{ row.fecha_inicio | date: 'dd/MM/yyyy' }}</span>
          <i class="fa-solid fa-arrow-right"></i>
          <span>{{ row.fecha_fin | date: 'dd/MM/yyyy' }}</span>
          <i
            class="fa-solid fa-triangle-exclamation text-warning"
            *ngIf="row.estado === 'VIGENTE' && isExpiring(row.fecha_fin)"
            title="Expira pronto"
          ></i>
        </div>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-eye"
            title="Ver Detalles"
            (clicked)="viewContract(row); $event.stopPropagation()"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-trash"
            title="Eliminar"
            (clicked)="deleteContract(row); $event.stopPropagation()"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .code-badge {
        font-family: monospace;
        background: var(--grey-100);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        color: var(--grey-700);
        font-weight: 600;
      }

      .client-name {
        font-weight: 600;
        color: var(--grey-900);
      }

      .date-range {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--grey-700);
      }

      .date-range i {
        font-size: 10px;
        color: var(--grey-400);
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .text-warning {
        color: var(--accent-500);
      }
    `,
  ],
})
export class ContractListComponent implements OnInit {
  contractService = inject(ContractService);
  private excelService = inject(ExcelExportService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  equipmentTabs = EQUIPMENT_TABS;
  operacionesTabs = OPERACIONES_TABS;
  contracts: Contract[] = [];
  loading = false;
  filters = { estado: '', search: '' };

  breadcrumbs = [
    { label: 'Inicio', url: '/dashboard' },
    { label: 'Equipos', url: '/equipment' },
    { label: 'Operaciones', url: '/equipment/operaciones' },
    { label: 'Contratos' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por proveedor, equipo, código...',
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Vigente', value: 'VIGENTE' },
        { label: 'En Proceso', value: 'EN_PROCESO' },
        { label: 'Vencido', value: 'VENCIDO' },
        { label: 'Resuelto', value: 'RESUELTO' },
        { label: 'Liquidado', value: 'LIQUIDADO' },
        { label: 'Cancelado', value: 'CANCELADO' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'numero_contrato', label: 'Código', type: 'template', sortable: true, filterable: true },
    {
      key: 'proveedor_razon_social',
      label: 'Proveedor',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      key: 'equipo_info',
      label: 'Equipo (Modelo / Placa)',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      key: 'modalidad_display',
      label: 'Modalidad',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    { key: 'vigencia', label: 'Vigencia', type: 'template', sortable: false },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Vigente', value: 'VIGENTE' },
        { label: 'En Proceso', value: 'EN_PROCESO' },
        { label: 'Sin Contrato', value: 'SIN_CONTRATO' },
        { label: 'Vencido', value: 'VENCIDO' },
        { label: 'Cancelado', value: 'CANCELADO' },
        { label: 'Resuelto', value: 'RESUELTO' },
        { label: 'Liquidado', value: 'LIQUIDADO' },
      ],
      badgeConfig: {
        VIGENTE: {
          label: 'Vigente',
          class: 'status-badge status-active',
          icon: 'fa-solid fa-check',
        },
        EN_PROCESO: {
          label: 'En Proceso',
          class: 'status-badge status-draft',
          icon: 'fa-solid fa-pencil',
        },
        SIN_CONTRATO: {
          label: 'Sin Contrato',
          class: 'status-badge status-draft',
          icon: 'fa-solid fa-file-circle-xmark',
        },
        VENCIDO: {
          label: 'Vencido',
          class: 'status-badge status-cancelled',
          icon: 'fa-solid fa-clock',
        },
        CANCELADO: {
          label: 'Cancelado',
          class: 'status-badge status-cancelled',
          icon: 'fa-solid fa-ban',
        },
        RESUELTO: {
          label: 'Resuelto',
          class: 'status-badge status-warning',
          icon: 'fa-solid fa-scale-balanced',
        },
        LIQUIDADO: {
          label: 'Liquidado',
          class: 'status-badge status-active',
          icon: 'fa-solid fa-circle-check',
        },
      },
    },
    // ─── Legacy columns (hidden by default) ───
    { key: 'tipo_contrato', label: 'Tipo Contrato', type: 'text', hidden: true, sortable: true },
    { key: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', hidden: true, sortable: true },
    { key: 'fecha_fin', label: 'Fecha Fin', type: 'date', hidden: true, sortable: true },
    {
      key: 'monto_contrato',
      label: 'Monto Contrato',
      type: 'financial',
      hidden: true,
      sortable: true,
    },
    { key: 'moneda', label: 'Moneda', type: 'text', hidden: true, sortable: true },
    { key: 'cliente_ruc', label: 'RUC Cliente', type: 'text', hidden: true, sortable: true },
    {
      key: 'representante_legal',
      label: 'Representante Legal',
      type: 'text',
      hidden: true,
      sortable: true,
    },
    {
      key: 'plazo_dias',
      label: 'Plazo Días',
      type: 'number',
      format: '1.0-0',
      hidden: true,
      sortable: true,
    },
    {
      key: 'penalidad_porcentaje',
      label: '% Penalidad',
      type: 'number',
      hidden: true,
      sortable: true,
    },
    { key: 'garantia', label: 'Garantía', type: 'text', hidden: true, sortable: true },
    { key: 'adenda_numero', label: 'N° Adenda', type: 'text', hidden: true, sortable: true },
    { key: 'observaciones', label: 'Observaciones', type: 'text', hidden: true, sortable: true },
    { key: 'fecha_registro', label: 'Fecha Registro', type: 'date', hidden: true, sortable: true },
    {
      key: 'usuario_registro',
      label: 'Registrado por',
      type: 'text',
      hidden: true,
      sortable: true,
    },
  ];

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.loading = true;
    this.contractService.getAll(this.filters).subscribe({
      next: (data) => {
        this.contracts = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.estado = (filters['estado'] as string) || '';
    this.loadContracts();
  }

  onSortChange(event: DataGridSortEvent): void {
    // Sorting is handled client-side by aero-data-grid
  }

  viewContract(contract: Contract): void {
    if (!contract || !contract.id) {
      console.error('Invalid contract ID', contract);
      return;
    }
    this.router.navigate([contract.id], { relativeTo: this.route });
  }

  editContract(contract: Contract): void {
    if (!contract || !contract.id) {
      console.error('Invalid contract ID', contract);
      return;
    }
    this.router.navigate([contract.id, 'edit'], { relativeTo: this.route });
  }

  createContract(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  deleteContract(contract: Contract): void {
    this.confirmSvc
      .confirmDelete(`el contrato ${contract.numero_contrato}`)
      .subscribe((confirmed) => {
        if (confirmed) {
          this.contractService.delete(contract.id.toString()).subscribe({
            next: () => {
              this.loadContracts();
              this.snackBar.open('Contrato eliminado correctamente', 'Cerrar', { duration: 3000 });
            },
            error: () => {
              this.snackBar.open('Error al eliminar contrato', 'Cerrar', { duration: 3000 });
            },
          });
        }
      });
  }

  isExpiring(dateStr: string): boolean {
    if (!dateStr) return false;
    const endDate = new Date(dateStr);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30; // Expiring in next 30 days
  }

  handleExport(format: ExportFormat): void {
    if (format === 'excel') {
      this.exportToExcel();
    } else if (format === 'csv') {
      this.exportToCSV();
    }
  }

  exportToExcel(): void {
    if (this.contracts.length === 0) {
      this.snackBar.open('No hay contratos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.contracts.map((contract) => ({
      'Número Contrato': contract.numero_contrato || '',
      'Equipo ID': contract.equipo_id || '',
      'Equipo Código': contract.equipo_codigo || '',
      'Proveedor ID': contract.proveedor_id || '',
      'Fecha Inicio': contract.fecha_inicio
        ? new Date(contract.fecha_inicio).toLocaleDateString('es-PE')
        : '',
      'Fecha Fin': contract.fecha_fin
        ? new Date(contract.fecha_fin).toLocaleDateString('es-PE')
        : '',
      'Duración (días)': contract.duracion_dias || 0,
      Tarifa: contract.tarifa ? `${contract.moneda} ${contract.tarifa}` : '',
      'Tipo Tarifa': contract.tipo_tarifa || '',
      Moneda: contract.moneda || 'PEN',
      Estado: contract.estado || '',
      'Incluye Motor': contract.incluye_motor ? 'Sí' : 'No',
      'Incluye Operador': contract.incluye_operador ? 'Sí' : 'No',
      Creado: contract.created_at ? new Date(contract.created_at).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'contratos',
      sheetName: 'Contratos',
      includeTimestamp: true,
    });
  }

  exportToCSV(): void {
    if (this.contracts.length === 0) {
      this.snackBar.open('No hay contratos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.contracts.map((contract) => ({
      'Número Contrato': contract.numero_contrato || '',
      'Equipo ID': contract.equipo_id || '',
      'Equipo Código': contract.equipo_codigo || '',
      'Proveedor ID': contract.proveedor_id || '',
      'Fecha Inicio': contract.fecha_inicio
        ? new Date(contract.fecha_inicio).toLocaleDateString('es-PE')
        : '',
      'Fecha Fin': contract.fecha_fin
        ? new Date(contract.fecha_fin).toLocaleDateString('es-PE')
        : '',
      'Duración (días)': contract.duracion_dias || 0,
      Tarifa: contract.tarifa ? `${contract.moneda} ${contract.tarifa}` : '',
      'Tipo Tarifa': contract.tipo_tarifa || '',
      Moneda: contract.moneda || 'PEN',
      Estado: contract.estado || '',
      'Incluye Motor': contract.incluye_motor ? 'Sí' : 'No',
      'Incluye Operador': contract.incluye_operador ? 'Sí' : 'No',
      Creado: contract.created_at ? new Date(contract.created_at).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToCSV(exportData, 'contratos');
  }
}
