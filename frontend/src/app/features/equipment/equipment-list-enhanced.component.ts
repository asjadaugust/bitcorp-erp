import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EquipmentService } from '../../core/services/equipment.service';
import { Equipment } from '../../core/models/equipment.model';
import { MainNavComponent } from '../../shared/components/main-nav.component';
import { AeroTableComponent, TableColumn } from '../../core/design-system/table/aero-table.component';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { CsvExportService } from '../../core/services/csv-export.service';
import { ExportDropdownComponent, ExportFormat } from '../../shared/components/export-dropdown/export-dropdown.component';

@Component({
  selector: 'app-equipment-list-enhanced',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainNavComponent, AeroTableComponent, ExportDropdownComponent],
  template: `
    <app-main-nav></app-main-nav>
    <div class="equipment-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-title">
          <div class="page-icon">
            <i class="fa-solid fa-tractor"></i>
          </div>
          <div>
            <h1>Gestión de Equipo Mecánico</h1>
            <div class="breadcrumb">
              <a routerLink="/dashboard"><i class="fa-solid fa-home"></i> Dashboard</a>
              <span class="separator">›</span>
              <span>Equipo Mecánico</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="action-bar">
        <div class="primary-actions">
          <button class="btn btn-primary" (click)="navigateToCreate()">
            <i class="fa-solid fa-plus"></i> Agregar Equipo
          </button>
          <button class="btn btn-danger" [disabled]="selectedIds.length === 0">
            <i class="fa-solid fa-trash"></i> Eliminar Seleccionados ({{ selectedIds.length }})
          </button>
          <app-export-dropdown 
            (export)="handleExport($event)"
            [disabled]="equipment.length === 0">
          </app-export-dropdown>
        </div>
        <div class="filter-toggle">
          <button class="btn btn-outline" (click)="showFilters = !showFilters">
            <i class="fa-solid fa-filter"></i>
            {{ showFilters ? 'Ocultar Filtros' : 'Filtros Avanzados' }}
          </button>
        </div>
      </div>

      <!-- Filter Panel -->
      <div class="filter-panel" *ngIf="showFilters">
        <div class="filter-grid">
          <div class="filter-group">
            <label>Quick Search</label>
            <input
              type="text"
              [(ngModel)]="filters.search"
              (input)="applyFilters()"
              placeholder="Search by code, name, plate, brand..."
            />
          </div>
          <div class="filter-group">
            <label>Status</label>
            <select [(ngModel)]="filters.status" (change)="applyFilters()">
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Category</label>
            <select [(ngModel)]="filters.category" (change)="applyFilters()">
              <option value="">All Categories</option>
              <option value="Excavadora">Excavadora</option>
              <option value="Tractor de Oruga">Tractor de Oruga</option>
              <option value="Cargador Frontal">Cargador Frontal</option>
              <option value="Camión Volquete">Camión Volquete</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Expiration Alert</label>
            <div class="checkbox-wrapper">
              <input
                type="checkbox"
                id="expiringOnly"
                [(ngModel)]="filters.expiringOnly"
                (change)="applyFilters()"
              />
              <label for="expiringOnly">Show only expiring equipment</label>
            </div>
          </div>
          <div class="filter-group">
            <button class="btn btn-text" (click)="clearFilters()">Clear Filters</button>
          </div>
        </div>
      </div>

      <!-- Statistics Bar -->
      <div class="stats-bar" *ngIf="stats">
        <div class="stat-card">
          <span class="stat-label">Total Equipment</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
        <div class="stat-card stat-available">
          <span class="stat-label">Available</span>
          <span class="stat-value">{{ stats.available }}</span>
        </div>
        <div class="stat-card stat-in-use">
          <span class="stat-label">In Use</span>
          <span class="stat-value">{{ stats.in_use }}</span>
        </div>
        <div class="stat-card stat-maintenance">
          <span class="stat-label">Maintenance</span>
          <span class="stat-value">{{ stats.maintenance }}</span>
        </div>
        <div class="stat-card stat-warning">
          <span class="stat-label">Expiring Soon</span>
          <span class="stat-value">{{ stats.expiring }}</span>
        </div>
      </div>

      <!-- Equipment Table -->
      <div class="table-container">
        <div class="loading-overlay" *ngIf="loading">
          <div class="spinner"></div>
        </div>

        <aero-table
          [columns]="columns"
          [data]="equipment"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            'select': selectTemplate,
            'codigo_equipo': codeTemplate,
            'estado': statusTemplate,
            'provider': providerTemplate,
            'medidor_uso': readingTemplate
          }"
          (rowClick)="viewDetails($event)"
        >
        </aero-table>

        <!-- Custom Templates -->
        <ng-template #selectTemplate let-row>
          <input
            type="checkbox"
            [checked]="selectedIds.includes(row.id)"
            (change)="toggleSelect(row.id)"
            (click)="$event.stopPropagation()"
          />
        </ng-template>

        <ng-template #codeTemplate let-row>
          <strong class="equipment-code">{{ row.codigo_equipo }}</strong>
        </ng-template>

        <ng-template #statusTemplate let-row>
          <span [class]="'badge badge-status-' + row.estado">
            {{ row.estado }}
          </span>
        </ng-template>

        <ng-template #providerTemplate let-row>
          {{ row.provider?.razon_social || '-' }}
        </ng-template>

        <ng-template #readingTemplate let-row>
          {{ row.medidor_uso || '-' }}
        </ng-template>

        <!-- Actions Template -->
        <ng-template #actionsTemplate let-row>
          <div class="action-buttons" (click)="$event.stopPropagation()">
            <button class="btn-icon" (click)="viewDetails(row)" title="View Details">
              📝
            </button>
            <button class="btn-icon" title="More Actions">⋮</button>
          </div>
        </ng-template>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="equipment.length > 0">
        <span class="pagination-info">
          Showing {{ equipment.length }} of {{ totalEquipment }} equipment
        </span>
        <div class="pagination-controls">
          <button class="btn btn-sm" [disabled]="currentPage === 1">‹ Previous</button>
          <span class="page-number">Page {{ currentPage }}</span>
          <button class="btn btn-sm">Next ›</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .equipment-page {
        min-height: 100vh;
        background: #f5f5f5;
        padding: 2rem;
      }

      /* Page Header */
      .page-header {
        margin-bottom: 2rem;
      }
      .page-title {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .page-icon {
        width: 48px;
        height: 48px;
        background: var(--primary-100);
        color: var(--primary-800);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }
      .page-title h1 {
        margin: 0 0 0.25rem 0;
        font-size: 24px;
        font-weight: 700;
        color: var(--primary-900);
      }
      .breadcrumb {
        color: var(--grey-500);
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .breadcrumb a {
        color: var(--primary-500);
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        transition: color 0.2s;
      }
      .breadcrumb a:hover {
        color: var(--primary-800);
      }
      .breadcrumb .separator {
        color: var(--grey-400);
      }

      /* Action Bar */
      .action-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .primary-actions {
        display: flex;
        gap: 0.75rem;
      }
      .btn {
        padding: 0.625rem 1.25rem;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      .btn-primary {
        background: #0077cd;
        color: white;
      }
      .btn-primary:hover {
        background: #005fa3;
        transform: translateY(-1px);
      }
      .btn-danger {
        background: #ef4444;
        color: white;
      }
      .btn-danger:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      .btn-secondary {
        background: #6b7280;
        color: white;
      }
      .btn-outline {
        background: white;
        border: 1px solid #d1d5db;
        color: #374151;
      }
      .btn-text {
        background: transparent;
        color: #0077cd;
      }

      /* Filter Panel */
      .filter-panel {
        margin-bottom: 1.5rem;
        padding: 1.5rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }
      .filter-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 13px;
        font-weight: 500;
        color: #374151;
      }
      .filter-group input[type='text'],
      .filter-group select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 14px;
      }
      .checkbox-wrapper {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      /* Stats Bar */
      .stats-bar {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .stat-card {
        padding: 1rem;
        background: white;
        border-radius: 8px;
        border-left: 4px solid #0077cd;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .stat-card.stat-available {
        border-left-color: #10b981;
      }
      .stat-card.stat-in-use {
        border-left-color: #0077cd;
      }
      .stat-card.stat-maintenance {
        border-left-color: #fcd34d;
      }
      .stat-card.stat-warning {
        border-left-color: #ef4444;
      }
      .stat-label {
        display: block;
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 0.25rem;
      }
      .stat-value {
        display: block;
        font-size: 24px;
        font-weight: 700;
        color: #111827;
      }

      /* Table Container */
      .table-container {
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      .table-wrapper {
        overflow-x: auto;
        max-height: 600px;
        overflow-y: auto;
      }
      .equipment-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .equipment-table thead {
        background: #f9fafb;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .equipment-table th {
        padding: 0.75rem 1rem;
        text-align: left;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: #6b7280;
        border-bottom: 2px solid #e5e7eb;
        white-space: nowrap;
      }
      .equipment-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #f3f4f6;
        white-space: nowrap;
      }
      .equipment-table tbody tr {
        cursor: pointer;
        transition: all 0.15s ease;
        border-left: 3px solid transparent;
      }
      .equipment-table tbody tr:hover {
        background: #f9fafb;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      .equipment-table tbody tr.row-available {
        border-left-color: #10b981;
      }
      .equipment-table tbody tr.row-in-use {
        border-left-color: #0077cd;
      }
      .equipment-table tbody tr.row-maintenance {
        border-left-color: #fcd34d;
      }
      .equipment-table tbody tr.row-retired {
        border-left-color: #ef4444;
      }

      /* Sticky Columns */
      .sticky-col {
        position: sticky;
        background: white;
        z-index: 5;
      }
      .checkbox-col {
        left: 0;
        width: 50px;
      }
      .code-col {
        left: 50px;
        min-width: 120px;
      }
      .equipment-table thead .sticky-col {
        background: #f9fafb;
      }
      .equipment-table tbody tr:hover .sticky-col {
        background: #f9fafb;
      }

      .equipment-code {
        color: #0077cd;
        font-weight: 600;
      }

      /* Badges */
      .badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        text-transform: capitalize;
      }
      .badge-status-available {
        background: #d1fae5;
        color: #065f46;
      }
      .badge-status-in_use {
        background: #dbeafe;
        color: #1e40af;
      }
      .badge-status-maintenance {
        background: #fef3c7;
        color: #92400e;
      }
      .badge-status-retired {
        background: #fee2e2;
        color: #991b1b;
      }
      .badge-provider,
      .badge-fuel {
        background: #e5e7eb;
        color: #374151;
      }

      /* Text Utilities */
      .text-right {
        text-align: right;
      }
      .text-center {
        text-align: center;
      }
      .text-warning {
        color: #d97706;
      }
      .text-danger {
        color: #dc2626;
      }

      /* Actions Column */
      .actions-col {
        text-align: center;
        min-width: 100px;
      }
      .btn-icon {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
      }
      .btn-icon:hover {
        background: #f3f4f6;
        border-radius: 4px;
      }

      /* Loading & Empty States */
      .loading-cell {
        text-align: center;
        padding: 3rem;
        color: #6b7280;
      }
      .spinner {
        display: inline-block;
        width: 24px;
        height: 24px;
        border: 3px solid #f3f4f6;
        border-top-color: #0077cd;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 0.5rem;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .empty-state {
        text-align: center;
        padding: 4rem;
      }
      .empty-message {
        max-width: 300px;
        margin: 0 auto;
      }
      .empty-icon {
        font-size: 48px;
        display: block;
        margin-bottom: 1rem;
      }
      .empty-message p {
        color: #6b7280;
        margin-bottom: 1rem;
      }

      /* Pagination */
      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1.5rem;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .pagination-info {
        font-size: 14px;
        color: #6b7280;
      }
      .pagination-controls {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .btn-sm {
        padding: 0.5rem 0.75rem;
        font-size: 13px;
      }
      .page-number {
        font-size: 14px;
        color: #374151;
      }
    `,
  ],
})
export class EquipmentListEnhancedComponent implements OnInit {
  private equipmentService = inject(EquipmentService);
  private excelService = inject(ExcelExportService);
  private csvService = inject(CsvExportService);
  private router = inject(Router);

  equipment: any[] = [];
  loading = false;
  selectedIds: number[] = [];
  showFilters = false;

  filters = {
    search: '',
    status: '',
    category: '',
    expiringOnly: false,
  };

  stats = {
    total: 0,
    available: 0,
    in_use: 0,
    maintenance: 0,
    expiring: 0,
  };

  currentPage = 1;
  totalEquipment = 0;

  columns: TableColumn[] = [
    { key: 'select', label: '', type: 'template', sticky: true, width: '50px' },
    { key: 'codigo_equipo', label: 'Código', type: 'template', sticky: true, width: '120px' },
    { key: 'marca', label: 'Marca', type: 'text' },
    { key: 'modelo', label: 'Modelo', type: 'text' },
    { key: 'categoria', label: 'Categoría', type: 'text' },
    { key: 'estado', label: 'Estado', type: 'template' },
    { key: 'provider', label: 'Proveedor', type: 'template' },
    { key: 'placa', label: 'Placa', type: 'text' },
    { key: 'anio_fabricacion', label: 'Año', type: 'text', align: 'center' },
    { key: 'medidor_uso', label: 'Tipo Medidor', type: 'template', align: 'right' }
  ];

  ngOnInit(): void {
    this.loadEquipment();
    this.loadStatistics();
  }

  loadEquipment(): void {
    this.loading = true;
    this.equipmentService.getAll(this.filters).subscribe({
      next: (data: any) => {
        this.equipment = Array.isArray(data) ? data : [];
        this.totalEquipment = this.equipment.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load equipment:', err);
        this.loading = false;
      },
    });
  }

  loadStatistics(): void {
    this.equipmentService.getStatistics().subscribe({
      next: (data: any) => {
        this.stats = data;
      },
      error: (err) => console.error('Failed to load stats:', err),
    });
  }

  applyFilters(): void {
    this.loadEquipment();
  }

  clearFilters(): void {
    this.filters = { search: '', status: '', category: '', expiringOnly: false };
    this.loadEquipment();
  }

  toggleSelect(id: number): void {
    const index = this.selectedIds.indexOf(id);
    if (index > -1) {
      this.selectedIds.splice(index, 1);
    } else {
      this.selectedIds.push(id);
    }
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedIds = [];
    } else {
      this.selectedIds = this.equipment.map((e) => e.id);
    }
  }

  get allSelected(): boolean {
    return this.equipment.length > 0 && this.selectedIds.length === this.equipment.length;
  }

  onRowClick(equip: any, event: MouseEvent): void {
    // Ctrl/Cmd click for multi-select
    if (event.ctrlKey || event.metaKey) {
      this.toggleSelect(equip.id);
    } else {
      this.viewDetails(equip);
    }
  }

  viewDetails(equip: any): void {
    this.router.navigate(['/equipment', equip.id]);
  }

  navigateToCreate(): void {
    this.router.navigate(['/equipment/new']);
  }

  handleExport(format: ExportFormat): void {
    if (this.equipment.length === 0) {
      alert('No hay equipos para exportar');
      return;
    }

    // Prepare data for export with Spanish headers
    const exportData = this.equipment.map(eq => ({
      'Código': eq.code || eq.C08001_Codigo || '',
      'Nombre': eq.name || '',
      'Marca': eq.brand || '',
      'Modelo': eq.modelo || '',
      'Categoría': eq.categoria || '',
      'Estado': eq.estado || '',
      'Proveedor': eq.provider?.razon_social || '',
      'RUC Proveedor': eq.provider?.ruc || '',
      'Placa': eq.placa || '',
      'Año Fabricación': eq.anio_fabricacion || '',
      'Tipo Medidor': eq.medidor_uso || '',
      'Tipo Motor': eq.tipo_motor || '',
      'Número Serie': eq.numero_serie_equipo || '',
      'Fecha Registro': eq.created_at ? new Date(eq.created_at).toLocaleDateString('es-PE') : ''
    }));

    if (format === 'excel') {
      this.excelService.exportToExcel(exportData, {
        filename: 'equipos_reporte',
        sheetName: 'Equipos',
        includeTimestamp: true
      });
    } else {
      this.csvService.exportToCsv(exportData, {
        filename: 'equipos_reporte',
        includeTimestamp: true
      });
    }
  }

  formatDate(date: any): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  isExpiringSoon(date: any): boolean {
    if (!date) return false;
    const d = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  }

  isExpired(date: any): boolean {
    if (!date) return false;
    const d = new Date(date);
    return d < new Date();
  }

  getFuelIcon(fuelType: string): string {
    const icons: Record<string, string> = {
      diesel: '⛽',
      gasoline: '⛽',
      electric: '🔋',
      hybrid: '🔋⛽',
    };
    return icons[fuelType] || '⛽';
  }
}
