import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EquipmentService } from '../../core/services/equipment.service';
import { AuthService } from '../../core/services/auth.service';
import { WebMcpService } from '../../core/services/webmcp.service';
import { Equipment } from '../../core/models/equipment.model';
import { ConfirmService } from '../../core/services/confirm.service'; // Added import

import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';
import { EQUIPMENT_MODULE_TABS } from './equipment-tabs';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    ActionsContainerComponent,
    StatsGridComponent,
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
  ],
  template: `
    <app-page-layout
      title="Equipos"
      icon="fa-tractor"
      [breadcrumbs]="[{ label: 'Inicio', url: '/app' }, { label: 'Equipos' }]"
      [loading]="loading"
      [tabs]="moduleTabs"
    >
      <app-actions-container actions>
        <div class="actions-group">
          <button
            type="button"
            class="btn btn-secondary"
            [class.active]="showStatistics"
            (click)="toggleStatistics()"
            [disabled]="loadingStatistics"
          >
            <i
              class="fa-solid"
              [class.fa-chart-simple]="!loadingStatistics"
              [class.fa-spinner]="loadingStatistics"
              [class.fa-spin]="loadingStatistics"
            ></i>
            {{ showStatistics ? 'Ocultar Estadísticas' : 'Ver Estadísticas' }}
          </button>

          <button type="button" class="btn btn-primary" (click)="navigateToCreate()">
            <i class="fa-solid fa-plus"></i> Nuevo Equipo
          </button>
        </div>
      </app-actions-container>

      <app-stats-grid
        *ngIf="showStatistics && statItems.length > 0"
        [items]="statItems"
        testId="equipment-stats"
        class="fade-in"
      ></app-stats-grid>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="equipment"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          codigo_equipo: codeTemplate,
          brand_model: brandModelTemplate,
          categoria: categoriaTemplate,
        }"
        (rowClick)="viewDetails($event)"
      >
      </aero-table>

      <!-- Custom Templates -->
      <ng-template #codeTemplate let-row>
        <span class="code-badge">{{ row.codigo_equipo }}</span>
      </ng-template>

      <ng-template #brandModelTemplate let-row>
        <div class="brand-model">
          <span>{{ row?.marca || '' }}</span>
          <small>{{ row?.modelo || '' }}</small>
        </div>
      </ng-template>

      <ng-template #categoriaTemplate let-row>
        <div class="cat-cell">
          <span class="tipo-nombre">{{ row.tipo_equipo_nombre || row.categoria || '-' }}</span>
          @if (row.categoria_prd) {
            <span class="cat-badge" [class]="getCategoriaPrdClass(row.categoria_prd)">
              {{ getCategoriaPrdLabel(row.categoria_prd) }}
            </span>
          }
        </div>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button
            type="button"
            class="btn-icon"
            (click)="editEquipment(row); $event.stopPropagation()"
            title="Editar"
          >
            <i class="fa-solid fa-pen"></i>
          </button>
          <button
            type="button"
            class="btn-icon"
            (click)="viewDetails(row); $event.stopPropagation()"
            title="Ver"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
          <button
            type="button"
            class="btn-icon delete-btn"
            (click)="eliminar(row); $event.stopPropagation()"
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
      /* Cards */
      .card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        margin-bottom: 1.5rem;
      }

      .card-header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--grey-100);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .card-header h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--grey-900);
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .card-body {
        padding: 1.5rem;
      }

      /* Form */
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-700);
      }

      .form-control {
        width: 100%;
        padding: 0.625rem 1rem;
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s;
      }

      .form-control:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px var(--primary-100);
      }

      .input-group {
        position: relative;
      }

      .input-group .prefix {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--grey-500);
        font-size: 14px;
      }

      .input-group input {
        padding-left: 2.5rem;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--grey-100);
      }

      .actions-group {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .btn.active {
        background-color: var(--grey-200);
        border-color: var(--grey-300);
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 16px;
        box-shadow:
          0 4px 6px -1px rgba(0, 0, 0, 0.05),
          0 2px 4px -1px rgba(0, 0, 0, 0.03);
        display: flex;
        align-items: center;
        gap: 1.25rem;
        transition:
          transform 0.2s,
          box-shadow 0.2s;
        border: 1px solid var(--grey-100);
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow:
          0 10px 15px -3px rgba(0, 0, 0, 0.05),
          0 4px 6px -2px rgba(0, 0, 0, 0.025);
      }

      /* Card variants for subtle bordering/coloring */
      .stat-card.total-card {
        border-left: 4px solid var(--primary-500);
      }
      .stat-card.available-card {
        border-left: 4px solid var(--semantic-green-500);
      }
      .stat-card.in-use-card {
        border-left: 4px solid var(--semantic-blue-500);
      }
      .stat-card.maintenance-card {
        border-left: 4px solid var(--semantic-yellow-500);
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;
      }

      .stat-icon.total {
        background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
        color: var(--primary-600);
      }
      .stat-icon.available {
        background: linear-gradient(
          135deg,
          var(--semantic-green-50) 0%,
          var(--semantic-green-100) 100%
        );
        color: var(--semantic-green-600);
      }
      .stat-icon.in-use {
        background: linear-gradient(
          135deg,
          var(--semantic-blue-50) 0%,
          var(--semantic-blue-100) 100%
        );
        color: var(--semantic-blue-600);
      }
      .stat-icon.maintenance {
        background: linear-gradient(
          135deg,
          var(--semantic-yellow-50) 0%,
          var(--semantic-yellow-100) 100%
        );
        color: var(--semantic-yellow-600);
      }

      .stat-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .stat-info .label {
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-500);
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-info .value {
        font-size: 28px;
        font-weight: 700;
        color: var(--grey-900);
        line-height: 1.2;
      }

      .code-badge {
        background: var(--grey-100);
        color: var(--grey-700);
        padding: 4px 8px;
        border-radius: 6px;
        font-family: monospace;
        font-size: 12px;
        font-weight: 600;
      }

      .brand-model {
        display: flex;
        flex-direction: column;
      }

      .brand-model small {
        color: var(--grey-500);
        font-size: 12px;
      }

      /* Status Badges - Removed local overrides to use global .status-badge */

      /* Alerts */
      .alert {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 14px;
      }

      .alert-success {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
        border: 1px solid var(--semantic-green-200);
      }

      .alert-error {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
        border: 1px solid var(--semantic-red-200);
      }

      .fade-in {
        animation: fadeIn 0.3s ease-in-out;
      }

      .actions-container {
        display: flex;
        gap: var(--s-8);
        align-items: center;
      }

      /* Category PRD badges */
      .cat-cell {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .tipo-nombre {
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-800);
      }
      .cat-badge {
        display: inline-block;
        font-size: 10px;
        font-weight: 600;
        padding: 1px 6px;
        border-radius: 10px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        width: fit-content;
      }
      .badge-cat-maquinaria {
        background: #fef3c7;
        color: #92400e;
      }
      .badge-cat-pesado {
        background: #fee2e2;
        color: #991b1b;
      }
      .badge-cat-liviano {
        background: #dbeafe;
        color: #1e40af;
      }
      .badge-cat-menor {
        background: #d1fae5;
        color: #065f46;
      }
    `,
  ],
})
export class EquipmentListComponent implements OnInit {
  equipmentService = inject(EquipmentService);
  authService = inject(AuthService);
  private webMcpService = inject(WebMcpService);
  private router = inject(Router);
  private confirmSvc = inject(ConfirmService); // Injected ConfirmService

  equipment: Equipment[] = [];
  loading = false;
  moduleTabs = EQUIPMENT_MODULE_TABS;
  loadingStatistics = false;
  showStatistics = false;
  errorMessage = '';
  successMessage = '';
  statistics: Record<string, number> | null = null;
  statItems: StatItem[] = [];

  filters = { status: '', search: '', categoria_prd: '', marca: '' };

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por nombre, código, marca...',
    },
    {
      key: 'categoria_prd',
      label: 'Categoría PRD',
      type: 'select',
      options: [
        { label: 'Maquinaria Pesada', value: 'MAQUINARIA_PESADA' },
        { label: 'Vehículos Pesados', value: 'VEHICULOS_PESADOS' },
        { label: 'Vehículos Livianos', value: 'VEHICULOS_LIVIANOS' },
        { label: 'Equipos Menores', value: 'EQUIPOS_MENORES' },
      ],
    },
    {
      key: 'marca',
      label: 'Marca / Modelo',
      type: 'text',
      placeholder: 'Ej. CAT, Toyota...',
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Disponible', value: 'available' },
        { label: 'En Uso', value: 'in_use' },
        { label: 'Mantenimiento', value: 'maintenance' },
        { label: 'Retirado', value: 'retired' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'codigo_equipo', label: 'Código', type: 'template' },
    { key: 'brand_model', label: 'Marca / Modelo', type: 'template' },
    { key: 'categoria', label: 'Tipo / Categoría', type: 'template' },
    { key: 'placa', label: 'Placa', type: 'text' },
    { key: 'tipo_proveedor', label: 'Tipo Proveedor', type: 'text' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        available: {
          label: 'Disponible',
          class: 'status-badge status-available',
          icon: 'fa-check',
        },
        disponible: {
          label: 'Disponible',
          class: 'status-badge status-available',
          icon: 'fa-check',
        },
        in_use: {
          label: 'En Uso',
          class: 'status-badge status-in_use',
          icon: 'fa-person-digging',
        },
        en_uso: {
          label: 'En Uso',
          class: 'status-badge status-in_use',
          icon: 'fa-person-digging',
        },
        maintenance: {
          label: 'Mantenimiento',
          class: 'status-badge status-maintenance',
          icon: 'fa-wrench',
        },
        mantenimiento: {
          label: 'Mantenimiento',
          class: 'status-badge status-maintenance',
          icon: 'fa-wrench',
        },
        retired: { label: 'Retirado', class: 'status-badge status-retired', icon: 'fa-ban' },
        retirado: { label: 'Retirado', class: 'status-badge status-retired', icon: 'fa-ban' },
      },
    },
    { key: 'proveedor_nombre', label: 'Proveedor', type: 'text' },
  ];

  actionsTemplate: TemplateRef<unknown> | undefined;

  ngOnInit(): void {
    this.loadEquipment();
    this.registerWebMcpTools();
  }

  private registerWebMcpTools(): void {
    this.webMcpService.registerTool({
      name: 'search_equipment',
      description: 'Searches the equipment list by name, code, or brand.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search term' }
        },
        required: ['query']
      },
      execute: async (args: { query: string }) => {
        this.onFilterChange({ search: args.query });
        return { success: true, message: `Searching for: ${args.query}` };
      }
    });

    this.webMcpService.registerTool({
      name: 'view_equipment_details',
      description: 'Views the details page for a specific equipment by its unique ID.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The unique ID of the equipment' }
        },
        required: ['id']
      },
      execute: async (args: { id: string }) => {
        await this.router.navigate(['/equipment', args.id]);
        return { success: true, message: `Navigating to details for ID: ${args.id}` };
      }
    });
  }

  loadEquipment(): void {
    this.loading = true;
    this.equipmentService.getAll(this.filters).subscribe({
      next: (response) => {
        this.equipment = response.data;
        this.loading = false;
      },
      error: (_error) => {
        this.errorMessage = 'Error al cargar la lista de equipos';
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.status = (filters['status'] as string) || '';
    this.filters.categoria_prd = (filters['categoria_prd'] as string) || '';
    this.filters.marca = (filters['marca'] as string) || '';
    this.loadEquipment();
  }

  navigateToCreate(): void {
    this.router.navigate(['/equipment/new']);
  }

  toggleStatistics(): void {
    if (this.showStatistics) {
      this.showStatistics = false;
    } else {
      this.loadStatistics();
    }
  }

  loadStatistics(): void {
    this.loadingStatistics = true;
    this.equipmentService.getStatistics().subscribe({
      next: (data) => {
        this.statistics = data;
        this.statItems = [
          {
            label: 'Total Equipos',
            value: data.total,
            icon: 'fa-cubes',
            color: 'primary',
            testId: 'total-equipment',
          },
          {
            label: 'Disponibles',
            value: data.disponible,
            icon: 'fa-check',
            color: 'success',
            testId: 'available-equipment',
          },
          {
            label: 'En Uso',
            value: data.en_uso,
            icon: 'fa-person-digging',
            color: 'info',
            testId: 'in-use-equipment',
          },
          {
            label: 'Mantenimiento',
            value: data.mantenimiento,
            icon: 'fa-wrench',
            color: 'warning',
            testId: 'maintenance-equipment',
          },
        ];
        this.showStatistics = true;
        this.loadingStatistics = false;
      },
      error: () => {
        this.errorMessage = 'Error al cargar las estadísticas';
        this.loadingStatistics = false;
      },
    });
  }

  editEquipment(item: Equipment): void {
    this.router.navigate(['/equipment', item.id, 'edit']);
  }

  viewDetails(item: Equipment): void {
    this.router.navigate(['/equipment', item.id]);
  }

  eliminar(item: Equipment): void {
    this.confirmSvc.confirmDelete(`el equipo ${item.codigo_equipo}`).subscribe((confirmed) => {
      if (confirmed) {
        this.loading = true;
        this.equipmentService.delete(item.id).subscribe({
          next: () => {
            this.loadEquipment();
            if (this.showStatistics) {
              this.loadStatistics();
            }
          },
          error: (err) => {
            console.error('Error al eliminar equipo:', err);
            this.loading = false;
          },
        });
      }
    });
  }

  getCategoriaPrdLabel(cat: string): string {
    const labels: Record<string, string> = {
      MAQUINARIA_PESADA: 'Maq. Pesada',
      VEHICULOS_PESADOS: 'Veh. Pesado',
      VEHICULOS_LIVIANOS: 'Veh. Liviano',
      EQUIPOS_MENORES: 'Eq. Menor',
    };
    return labels[cat] ?? cat;
  }

  getCategoriaPrdClass(cat: string): string {
    const classes: Record<string, string> = {
      MAQUINARIA_PESADA: 'badge-cat-maquinaria',
      VEHICULOS_PESADOS: 'badge-cat-pesado',
      VEHICULOS_LIVIANOS: 'badge-cat-liviano',
      EQUIPOS_MENORES: 'badge-cat-menor',
    };
    return classes[cat] ?? '';
  }
}
