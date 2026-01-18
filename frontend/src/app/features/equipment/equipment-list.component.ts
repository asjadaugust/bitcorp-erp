import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EquipmentService } from '../../core/services/equipment.service';
import { AuthService } from '../../core/services/auth.service';
import { Equipment } from '../../core/models/equipment.model';

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
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    RouterModule,
    ActionsContainerComponent,
  ],
  template: `
    <app-page-layout
      title="Equipos"
      icon="fa-tractor"
      [breadcrumbs]="[{ label: 'Dashboard', url: '/app' }, { label: 'Equipos' }]"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <button type="button" class="btn btn-secondary" (click)="loadStatistics()">
          <i class="fa-solid fa-chart-simple"></i> Estadísticas
        </button>

        <button type="button" class="btn btn-primary" (click)="navigateToCreate()">
          <i class="fa-solid fa-plus"></i> Nuevo Equipo
        </button>
      </app-actions-container>

      <!-- Statistics -->
      <div *ngIf="statistics" class="stats-grid fade-in">
        <div class="stat-card">
          <div class="stat-icon total"><i class="fa-solid fa-cubes"></i></div>
          <div class="stat-info">
            <span class="label">Total Equipos</span>
            <span class="value">{{ statistics.total }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon available"><i class="fa-solid fa-check"></i></div>
          <div class="stat-info">
            <span class="label">Disponibles</span>
            <span class="value">{{ statistics.available }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon in-use"><i class="fa-solid fa-person-digging"></i></div>
          <div class="stat-info">
            <span class="label">En Uso</span>
            <span class="value">{{ statistics.in_use }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon maintenance"><i class="fa-solid fa-wrench"></i></div>
          <div class="stat-info">
            <span class="label">Mantenimiento</span>
            <span class="value">{{ statistics.maintenance }}</span>
          </div>
        </div>
      </div>

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
          estado: statusTemplate,
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
          <span>{{ row.marca }}</span>
          <small>{{ row.modelo }}</small>
        </div>
      </ng-template>

      <ng-template #statusTemplate let-row>
        <span [class]="'status-badge status-' + (row.estado || '').toLowerCase()">
          <i class="fa-solid" [ngClass]="getStatusIcon(row.estado)"></i>
          {{ getStatusLabel(row.estado) }}
        </span>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <button
          type="button"
          class="btn btn-icon"
          (click)="editEquipment(row); $event.stopPropagation()"
          title="Editar"
        >
          <i class="fa-solid fa-pen"></i>
        </button>
        <button
          type="button"
          class="btn btn-icon"
          (click)="viewDetails(row); $event.stopPropagation()"
          title="Ver"
        >
          <i class="fa-solid fa-eye"></i>
        </button>
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

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
      }

      .stat-card {
        background: white;
        padding: 1.25rem;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .stat-icon.total {
        background: var(--primary-100);
        color: var(--primary-500);
      }
      .stat-icon.available {
        background: var(--semantic-green-50);
        color: var(--semantic-green-600);
      }
      .stat-icon.in-use {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-600);
      }
      .stat-icon.maintenance {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-600);
      }

      .stat-info {
        display: flex;
        flex-direction: column;
      }

      .stat-info .label {
        font-size: 12px;
        color: var(--grey-500);
        margin-bottom: 2px;
      }

      .stat-info .value {
        font-size: 20px;
        font-weight: 700;
        color: var(--grey-900);
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

      /* Status Badges */
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-available,
      .status-disponible {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .status-in_use,
      .status-en_uso,
      .status-ocupado {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }
      .status-maintenance,
      .status-mantenimiento {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
      }
      .status-retired,
      .status-retirado {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
      }

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
    `,
  ],
})
export class EquipmentListComponent implements OnInit {
  equipmentService = inject(EquipmentService);
  authService = inject(AuthService);
  private router = inject(Router);

  equipment: Equipment[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  statistics: any = null;

  filters = { status: '', search: '' };

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
      placeholder: 'Buscar por nombre, código, marca...',
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
    { key: 'categoria', label: 'Categoría', type: 'text' },
    { key: 'placa', label: 'Placa', type: 'text' },
    { key: 'tipo_proveedor', label: 'Tipo Proveedor', type: 'text' },
    { key: 'estado', label: 'Estado', type: 'template' },
    { key: 'proveedor_nombre', label: 'Proveedor', type: 'text' },
  ];

  ngOnInit(): void {
    this.loadEquipment();
  }

  loadEquipment(): void {
    this.loading = true;
    this.equipmentService.getAll(this.filters).subscribe({
      next: (response) => {
        this.equipment = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar equipos';
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.filters.search = filters['search'] || '';
    this.filters.status = filters['status'] || '';
    this.loadEquipment();
  }

  navigateToCreate(): void {
    this.router.navigate(['/equipment/new']);
  }

  loadStatistics(): void {
    this.equipmentService.getStatistics().subscribe({
      next: (data) => (this.statistics = data),
      error: () => (this.errorMessage = 'Error al cargar estadísticas'),
    });
  }

  editEquipment(item: Equipment): void {
    this.router.navigate(['/equipment', item.id, 'edit']);
  }

  viewDetails(item: Equipment): void {
    this.router.navigate(['/equipment', item.id]);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      available: 'Disponible',
      disponible: 'Disponible',
      in_use: 'En Uso',
      en_uso: 'En Uso',
      maintenance: 'Mantenimiento',
      mantenimiento: 'Mantenimiento',
      retired: 'Retirado',
      retirado: 'Retirado',
    };
    return labels[status] || status;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      available: 'fa-check',
      disponible: 'fa-check',
      in_use: 'fa-person-digging',
      en_uso: 'fa-person-digging',
      maintenance: 'fa-wrench',
      mantenimiento: 'fa-wrench',
      retired: 'fa-ban',
      retirado: 'fa-ban',
    };
    return icons[status] || 'fa-circle';
  }
}
