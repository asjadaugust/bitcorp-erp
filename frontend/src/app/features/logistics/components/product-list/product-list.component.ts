import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService, Product } from '../../services/inventory.service';
import { WebMcpService } from '../../../../core/services/webmcp.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../../core/design-system/data-grid/aero-data-grid.component';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { LOGISTICS_TABS } from '../../logistics-tabs';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../../shared/components/filter-bar/filter-bar.component';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../../../shared/components/export-dropdown/export-dropdown.component';
import { ExcelExportService } from '../../../../core/services/excel-export.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { ActionsContainerComponent } from '../../../../shared/components/actions-container/actions-container.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../../../shared/components/stats-grid/stats-grid.component';
import { CurrencyPipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageCardComponent } from '../../../../shared/components/page-card/page-card.component';
import { AeroBadgeComponent } from '../../../../core/design-system/badge/aero-badge.component';
import { AeroButtonComponent } from '../../../../core/design-system';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ActionsContainerComponent,
    StatsGridComponent,
    AeroDataGridComponent,
    AeroBadgeComponent,
    PageLayoutComponent,
    PageCardComponent,
    ExportDropdownComponent,
    FilterBarComponent,
    AeroButtonComponent,
  ],
  providers: [CurrencyPipe],
  template: `
    <app-page-layout
      title="Gestión de Productos"
      icon="fa-boxes-stacked"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <app-export-dropdown
          (export)="handleExport($event)"
          [disabled]="loading || products.length === 0"
        >
        </app-export-dropdown>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToCreate()"
          >Nuevo Producto</aero-button
        >
      </app-actions-container>

      <app-stats-grid [items]="statItems" testId="product-stats"></app-stats-grid>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [columns]="columns"
          [data]="filteredProducts"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            code: codeTemplate,
            category: categoryTemplate,
            stock: stockTemplate,
            totalValue: totalValueTemplate,
          }"
          (sortChange)="onSort($event)"
        >
        </aero-data-grid>
      </app-page-card>

      <!-- Custom Templates -->
      <ng-template #codeTemplate let-row>
        <strong class="equipment-code">{{ row.codigo }}</strong>
      </ng-template>

      <ng-template #categoryTemplate let-row>
        <aero-badge variant="neutral">{{ row.categoria || 'General' }}</aero-badge>
      </ng-template>

      <ng-template #stockTemplate let-row>
        <span [class]="getStockClass(row.stock_actual)">
          {{ row.stock_actual }}
        </span>
      </ng-template>

      <ng-template #totalValueTemplate let-row>
        <span class="font-semibold">
          {{ row.stock_actual * row.precio_unitario | currency: 'PEN' }}
        </span>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-eye"
            (clicked)="viewDetails(row)"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-pen"
            (clicked)="editProduct(row)"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .equipment-code {
        color: var(--primary-500);
        font-weight: 600;
      }
      .font-semibold {
        font-weight: 600;
      }
      .text-success {
        color: var(--semantic-success);
        font-weight: 700;
      }
      .text-warning {
        color: var(--semantic-warning);
        font-weight: 700;
      }
      .text-danger {
        color: var(--semantic-error);
        font-weight: 700;
      }
      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ],
})
export class ProductListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private currencyPipe = inject(CurrencyPipe);
  private webMcpService = inject(WebMcpService);
  private snackBar = inject(MatSnackBar);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  statItems: StatItem[] = [];
  tabs = LOGISTICS_TABS;
  loading = false;

  filters = {
    search: '',
    category: '',
    stockStatus: '',
  };

  stats = {
    total: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0,
    statsLoaded: false,
  };

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Logística', url: '/logistics' },
    { label: 'Productos' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por código, nombre, categoría...',
    },
    {
      key: 'category',
      label: 'Categoría',
      type: 'select',
      options: [
        { label: 'Repuestos', value: 'Repuestos' },
        { label: 'EPP', value: 'EPP' },
        { label: 'Herramientas', value: 'Herramientas' },
        { label: 'Consumibles', value: 'Consumibles' },
      ],
    },
    {
      key: 'stockStatus',
      label: 'Estado de Stock',
      type: 'select',
      options: [
        { label: 'Stock Bajo', value: 'low' },
        { label: 'Sin Stock', value: 'out' },
        { label: 'Disponible', value: 'available' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'code', label: 'Codigo', type: 'template', sortable: true },
    { key: 'nombre', label: 'Nombre', type: 'text', sortable: true, filterable: true },
    { key: 'category', label: 'Categoria', type: 'template', sortable: true, filterable: true },
    { key: 'unidad_medida', label: 'Unidad', type: 'text' },
    { key: 'stock', label: 'Stock', type: 'template', sortable: true },
    {
      key: 'precio_unitario',
      label: 'Precio Unit.',
      type: 'currency',
      format: 'PEN',
      sortable: true,
    },
    { key: 'totalValue', label: 'Valor Total', type: 'template', sortable: true },
    { key: 'ubicacion', label: 'Ubicacion', type: 'text', filterable: true },
    {
      key: 'esta_activo',
      label: 'Estado',
      type: 'badge',
      sortable: true,
      filterable: true,
      badgeConfig: {
        true: { label: 'Activo', class: 'status-badge status-active', icon: 'fa-check' },
        false: { label: 'Inactivo', class: 'status-badge status-inactive', icon: 'fa-ban' },
      },
    },
    { key: 'codigo_interno', label: 'Codigo Interno', hidden: true },
    { key: 'marca', label: 'Marca', hidden: true, filterable: true },
    { key: 'modelo', label: 'Modelo', hidden: true },
    { key: 'presentacion', label: 'Presentacion', hidden: true },
    { key: 'stock_minimo', label: 'Stock Min.', type: 'number', hidden: true },
    { key: 'stock_maximo', label: 'Stock Max.', type: 'number', hidden: true },
    { key: 'punto_reorden', label: 'Punto Reorden', type: 'number', hidden: true },
    { key: 'ubicacion_almacen', label: 'Ubicacion Almacen', hidden: true },
    { key: 'proveedor_principal', label: 'Proveedor Principal', hidden: true },
    { key: 'fecha_ultimo_ingreso', label: 'Ult. Ingreso', type: 'date', hidden: true },
    { key: 'fecha_ultima_salida', label: 'Ult. Salida', type: 'date', hidden: true },
    { key: 'observaciones', label: 'Observaciones', hidden: true },
  ];

  ngOnInit(): void {
    this.loadProducts();
    this.registerWebMcpTools();
  }

  private registerWebMcpTools(): void {
    this.webMcpService.registerTool({
      name: 'search_products',
      description: 'Searches the product list in logistics by name or code.',
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
        return { success: true, message: `Searching products for: ${query}` };
      },
    });

    this.webMcpService.registerTool({
      name: 'view_product_details',
      description: 'Views the details page for a specific product by its unique ID.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The unique ID of the product' },
        },
        required: ['id'],
      },
      execute: async (args: Record<string, unknown>) => {
        const id = args['id'] as string;
        await this.router.navigate(['/logistics/products', id]);
        return { success: true, message: `Navigating to product details for ID: ${id}` };
      },
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.inventoryService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.calculateStats();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products', error);
        this.loading = false;
      },
    });
  }

  calculateStats(): void {
    this.stats.total = this.products.length;
    this.stats.totalValue = this.products.reduce(
      (acc, p) => acc + Number(p.stock_actual) * Number(p.precio_unitario),
      0
    );
    this.stats.lowStock = this.products.filter(
      (p) => p.stock_actual > 0 && p.stock_actual <= 5
    ).length;
    this.stats.outOfStock = this.products.filter((p) => p.stock_actual <= 0).length;

    const formattedValue = this.currencyPipe.transform(
      this.stats.totalValue,
      'PEN',
      'symbol',
      '1.0-0'
    );

    this.statItems = [
      {
        label: 'Total Items',
        value: this.stats.total,
        icon: 'fa-boxes-stacked',
        color: 'primary',
        testId: 'total-items',
      },
      {
        label: 'Valor Total',
        value: formattedValue || '0',
        icon: 'fa-coins',
        color: 'success',
        testId: 'total-value',
      },
      {
        label: 'Stock Bajo',
        value: this.stats.lowStock,
        icon: 'fa-triangle-exclamation',
        color: 'warning',
        testId: 'low-stock',
      },
      {
        label: 'Sin Stock',
        value: this.stats.outOfStock,
        icon: 'fa-box-open',
        color: 'danger',
        testId: 'out-stock',
      },
    ];
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.category = (filters['category'] as string) || '';
    this.filters.stockStatus = (filters['stockStatus'] as string) || '';
    this.applyFilters();
  }

  onSort(event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }

  applyFilters(): void {
    this.filteredProducts = this.products.filter((product) => {
      const matchesSearch =
        !this.filters.search ||
        product.nombre.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        product.codigo.toLowerCase().includes(this.filters.search.toLowerCase());

      const matchesCategory = !this.filters.category || product.categoria === this.filters.category;

      let matchesStock = true;
      if (this.filters.stockStatus === 'low')
        matchesStock = product.stock_actual > 0 && product.stock_actual <= 5;
      if (this.filters.stockStatus === 'out') matchesStock = product.stock_actual <= 0;
      if (this.filters.stockStatus === 'available') matchesStock = product.stock_actual > 5;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }

  getStockClass(stock: number): string {
    if (stock <= 0) return 'text-danger';
    if (stock <= 5) return 'text-warning';
    return 'text-success';
  }

  navigateToCreate(): void {
    this.router.navigate(['/logistics/products/new']);
  }

  viewDetails(product: Product): void {
    this.router.navigate(['/logistics/products', product.id]);
  }

  editProduct(product: Product): void {
    this.router.navigate(['/logistics/products', product.id, 'edit']);
  }

  handleExport(format: ExportFormat): void {
    if (this.products.length === 0) {
      this.snackBar.open('No hay productos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.products.map((product) => ({
      ID: product.id || '',
      Código: product.codigo || '',
      Nombre: product.nombre || '',
      Descripción: product.descripcion || '',
      Categoría: product.categoria || '',
      'Unidad Medida': product.unidad_medida || '',
      'Stock Actual': product.stock_actual || 0,
      'Precio Unitario': product.precio_unitario || 0,
      Ubicación: product.ubicacion || '',
      Activo: product.esta_activo ? 'Sí' : 'No',
    }));

    if (format === 'excel') {
      this.excelService.exportToExcel(exportData, {
        filename: 'productos_reporte',
        sheetName: 'Productos',
        includeTimestamp: true,
      });
    } else {
      this.csvService.exportToCsv(exportData, {
        filename: 'productos_reporte',
        includeTimestamp: true,
      });
    }
  }

  private excelService = inject(ExcelExportService);
  private csvService = inject(CsvExportService);
}
