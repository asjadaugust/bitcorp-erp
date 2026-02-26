import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ConfirmService } from '../../core/services/confirm.service';
import { ContractService } from '../../core/services/contract.service';
import { Contract } from '../../core/models/contract.model';

import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
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
          numero_contrato: codeTemplate,
          vigencia: vigenciaTemplate,
        }"
        (rowClick)="viewContract($event)"
      >
      </aero-table>

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
            *ngIf="row.estado === 'ACTIVO' && isExpiring(row.fecha_fin)"
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
            class="btn-icon text-danger"
            (click)="deleteContract(row); $event.stopPropagation()"
            title="Eliminar"
          >
            <i class="fa-solid fa-trash"></i>
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

      .btn-icon.text-danger:hover {
        background: var(--error-100);
        color: var(--error-600);
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
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  contracts: Contract[] = [];
  loading = false;
  filters = { estado: '', search: '' };

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Equipos', url: '/equipment' },
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
        { label: 'Activo', value: 'ACTIVO' },
        { label: 'Vencido', value: 'VENCIDO' },
        { label: 'Resuelto', value: 'RESUELTO' },
        { label: 'Liquidado', value: 'LIQUIDADO' },
        { label: 'Cancelado', value: 'CANCELADO' },
        { label: 'Borrador', value: 'BORRADOR' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'numero_contrato', label: 'Código', type: 'template' },
    { key: 'proveedor_razon_social', label: 'Proveedor', type: 'text' },
    { key: 'equipo_info', label: 'Equipo (Modelo / Placa)', type: 'text' },
    { key: 'modalidad_display', label: 'Modalidad', type: 'text' },
    { key: 'vigencia', label: 'Vigencia', type: 'template' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        ACTIVO: {
          label: 'Activo',
          class: 'status-badge status-active',
          icon: 'fa-solid fa-check',
        },
        VENCIDO: {
          label: 'Vencido',
          class: 'status-badge status-cancelled',
          icon: 'fa-solid fa-clock',
        },
        BORRADOR: {
          label: 'Borrador',
          class: 'status-badge status-draft',
          icon: 'fa-solid fa-pencil',
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
