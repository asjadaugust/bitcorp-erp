import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EquipmentService } from '../../core/services/equipment.service';
import { AuthService } from '../../core/services/auth.service';
import { WebMcpService } from '../../core/services/webmcp.service';
import { Equipment } from '../../core/models/equipment.model';
import { ConfirmService } from '../../core/services/confirm.service';

import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import { AeroBadgeComponent } from '../../core/design-system/badge/aero-badge.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    ActionsContainerComponent,
    StatsGridComponent,
    AeroTableComponent,
    AeroBadgeComponent,
    PageLayoutComponent,
    PageCardComponent,
    FilterBarComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Equipos"
      icon="fa-tractor"
      [breadcrumbs]="[{ label: 'Inicio', url: '/app' }, { label: 'Equipos' }]"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-button
          variant="secondary"
          icon="fa-chart-simple"
          [label]="showStatistics ? 'Ocultar Estadísticas' : 'Ver Estadísticas'"
          [loading]="loadingStatistics"
          (clicked)="toggleStatistics()"
        ></app-button>
        <app-button
          variant="primary"
          icon="fa-plus"
          label="Nuevo Equipo"
          (clicked)="navigateToCreate()"
        ></app-button>
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

      <app-page-card [noPadding]="true">
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
      </app-page-card>

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
            <aero-badge [variant]="getCategoriaBadgeVariant(row.categoria_prd)">
              {{ getCategoriaPrdLabel(row.categoria_prd) }}
            </aero-badge>
          }
        </div>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons" (click)="$event.stopPropagation()">
          <app-button
            variant="icon"
            size="sm"
            icon="fa-pen"
            (clicked)="editEquipment(row)"
          ></app-button>
          <app-button
            variant="icon"
            size="sm"
            icon="fa-eye"
            (clicked)="viewDetails(row)"
          ></app-button>
          <app-button
            variant="icon"
            size="sm"
            icon="fa-trash"
            (clicked)="eliminar(row)"
          ></app-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .code-badge {
        background: var(--grey-100);
        color: var(--grey-700);
        padding: 4px 8px;
        border-radius: var(--radius-sm);
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

      .cat-cell {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .tipo-nombre {
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-900);
      }

      .action-buttons {
        display: flex;
        gap: var(--s-4);
        align-items: center;
      }

      .fade-in {
        animation: fadeIn 0.3s ease-in-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
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
          query: { type: 'string', description: 'The search term' },
        },
        required: ['query'],
      },
      execute: async (args: Record<string, unknown>) => {
        const query = args['query'] as string;
        this.onFilterChange({ search: query });
        return { success: true, message: `Searching for: ${query}` };
      },
    });

    this.webMcpService.registerTool({
      name: 'view_equipment_details',
      description: 'Views the details page for a specific equipment by its unique ID.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The unique ID of the equipment' },
        },
        required: ['id'],
      },
      execute: async (args: Record<string, unknown>) => {
        const id = args['id'] as string;
        await this.router.navigate(['/equipment', id]);
        return { success: true, message: `Navigating to details for ID: ${id}` };
      },
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
        const statsData = data as any;
        this.statistics = statsData;
        this.statItems = [
          {
            label: 'Total Equipos',
            value: statsData.total,
            icon: 'fa-cubes',
            color: 'primary',
            testId: 'total-equipment',
          },
          {
            label: 'Disponibles',
            value: statsData.disponible,
            icon: 'fa-check',
            color: 'success',
            testId: 'available-equipment',
          },
          {
            label: 'En Uso',
            value: statsData.en_uso,
            icon: 'fa-person-digging',
            color: 'info',
            testId: 'in-use-equipment',
          },
          {
            label: 'Mantenimiento',
            value: statsData.mantenimiento,
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

  getCategoriaBadgeVariant(cat: string): 'warning' | 'error' | 'info' | 'success' | 'neutral' {
    const variants: Record<string, 'warning' | 'error' | 'info' | 'success'> = {
      MAQUINARIA_PESADA: 'warning',
      VEHICULOS_PESADOS: 'error',
      VEHICULOS_LIVIANOS: 'info',
      EQUIPOS_MENORES: 'success',
    };
    return variants[cat] ?? 'neutral';
  }
}
