import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ContractService } from '../../core/services/contract.service';
import { Contract } from '../../core/models/contract.model';

import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import {
  PageLayoutComponent,
  TabItem,
} from '../../shared/components/page-layout/page-layout.component';
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

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
  ],
  template: `
    <app-page-layout
      title="Contratos"
      icon="fa-file-contract"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <app-export-dropdown [disabled]="contracts.length === 0" (export)="handleExport($event)">
        </app-export-dropdown>

        <button type="button" class="btn btn-primary" (click)="createContract()">
          <i class="fa-solid fa-plus"></i> Nuevo Contrato
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="contracts"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          code: codeTemplate,
          client_name: clientTemplate,
          vigencia: vigenciaTemplate,
        }"
        (rowClick)="viewContract($event)"
      >
      </aero-table>

      <!-- Custom Column Templates -->
      <ng-template #codeTemplate let-row>
        <span class="code-badge">{{ row.code }}</span>
      </ng-template>

      <ng-template #clientTemplate let-row>
        <span class="client-name">{{ row.client_name }}</span>
      </ng-template>

      <ng-template #vigenciaTemplate let-row>
        <div class="date-range">
          <span>{{ row.start_date | date: 'dd/MM/yyyy' }}</span>
          <i class="fa-solid fa-arrow-right"></i>
          <span>{{ row.end_date | date: 'dd/MM/yyyy' }}</span>
          <i
            class="fa-solid fa-triangle-exclamation text-warning"
            *ngIf="row.status === 'active' && isExpiring(row.end_date)"
            title="Expira pronto"
          ></i>
        </div>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button
            type="button"
            class="btn-icon"
            (click)="viewContract(row); $event.stopPropagation()"
            title="Ver Detalles"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
          <button
            type="button"
            class="btn-icon"
            (click)="editContract(row); $event.stopPropagation()"
            title="Editar"
          >
            <i class="fa-solid fa-pen"></i>
          </button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .btn {
        padding: var(--s-8) var(--s-16);
        border: none;
        border-radius: var(--s-8);
        font-size: var(--type-bodySmall-size);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        transition: all 0.2s ease;
      }
      .btn-primary {
        background: var(--primary-500);
        color: var(--neutral-0);
      }
      .btn-primary:hover {
        background: var(--primary-800);
      }

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

      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        color: var(--grey-500);
        transition: color 0.2s;
      }

      .btn-icon:hover {
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: var(--s-4);
      }

      .text-warning {
        color: #f59e0b;
      }
    `,
  ],
})
export class ContractListComponent implements OnInit {
  contractService = inject(ContractService);
  private excelService = inject(ExcelExportService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  contracts: Contract[] = [];
  loading = false;
  filters = { estado: '', search: '' };

  breadcrumbs = [
    { label: 'Dashboard', url: '/app' },
    { label: 'Equipos', url: '/equipment' },
    { label: 'Contratos' },
  ];

  tabs: TabItem[] = [
    { label: 'Equipos', route: '/equipment', icon: 'fa-list' },
    { label: 'Partes Diarios', route: '/equipment/daily-reports', icon: 'fa-clipboard-list' },
    { label: 'Contratos', route: '/equipment/contracts', icon: 'fa-file-contract' },
    { label: 'Valorizaciones', route: '/equipment/valuations', icon: 'fa-dollar-sign' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por proveedor, equipo, código...',
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Activo', value: 'Activo' },
        { label: 'Vencido', value: 'Vencido' },
        { label: 'Cancelado', value: 'Cancelado' },
        { label: 'Borrador', value: 'Borrador' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'code', label: 'Código', type: 'template' },
    { key: 'provider_name', label: 'Proveedor', type: 'text' },
    { key: 'equipment_info', label: 'Equipo (Modelo / Placa)', type: 'text' },
    { key: 'modalidad_display', label: 'Modalidad', type: 'text' },
    { key: 'vigencia', label: 'Vigencia', type: 'template' },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        Activo: { label: 'Activo', class: 'badge status-active' },
        Vencido: { label: 'Vencido', class: 'badge status-completed' },
        Borrador: { label: 'Borrador', class: 'badge status-pending' },
        Cancelado: { label: 'Cancelado', class: 'badge status-cancelled' },
      },
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

  onFilterChange(filters: Record<string, any>): void {
    this.filters.search = filters['search'] || '';
    this.filters.estado = filters['status'] 
      ? this.contractService.mapEstadoFrontendToBackend(filters['status']) 
      : '';
    this.loadContracts();
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
      alert('No hay contratos para exportar');
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
      alert('No hay contratos para exportar');
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
