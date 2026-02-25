import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService, Product } from '../../services/inventory.service';
import { WebMcpService } from '../../../../core/services/webmcp.service';
import {
  AeroTableComponent,
  TableColumn,
} from '../../../../core/design-system/table/aero-table.component';
import {
  PageLayoutComponent,
  TabItem,
} from '../../../../shared/components/page-layout/page-layout.component';
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

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ActionsContainerComponent,
    StatsGridComponent,
    AeroTableComponent,
    PageLayoutComponent,
    ExportDropdownComponent,
    FilterBarComponent,
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
        <button class="btn btn-primary" (click)="navigateToCreate()">
          <i class="fa-solid fa-plus"></i> Nuevo Producto
        </button>
      </app-actions-container>

      <app-stats-grid [items]="statItems" testId="product-stats"></app-stats-grid>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="filteredProducts"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          code: codeTemplate,
          category: categoryTemplate,
          stock: stockTemplate,
          totalValue: totalValueTemplate,
        }"
      >
      </aero-table>

      <!-- Custom Templates -->
      <ng-template #codeTemplate let-row>
        <strong class="equipment-code">{{ row.codigo }}</strong>
      </ng-template>

      <ng-template #categoryTemplate let-row>
        <span class="badge badge-fuel">{{ row.categoria || 'General' }}</span>
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
          <button class="btn-icon" (click)="viewDetails(row)" title="Ver Detalles">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="btn-icon" (click)="editProduct(row)" title="Editar">
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
      .btn-secondary {
        background: var(--grey-200);
        color: var(--primary-900);
      }
      .btn-secondary:hover {
        background: var(--grey-300);
      }

      /* Utilities */
      .equipment-code {
        color: var(--primary-500);
        font-weight: 600;
      }
      .font-semibold {
        font-weight: 600;
      }
      .badge {
        padding: var(--s-4) var(--s-8);
        border-radius: var(--s-4);
        font-size: var(--type-label-size);
        font-weight: 500;
      }
      .badge-fuel {
        background: var(--grey-200);
        color: var(--grey-900);
      }
      /* Removed obsolete badge-status-* classes as we use global status-badge now */

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
      .btn-icon {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        padding: var(--s-4) var(--s-8);
        color: var(--grey-500);
      }
      .btn-icon:hover {
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: var(--s-4);
        transition: color 0.2s;
      }
    `,
    `
      .actions-container {
        display: flex;
        gap: var(--s-8);
        align-items: center;
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

  tabs: TabItem[] = [
    { label: 'Productos', route: '/logistics/products', icon: 'fa-boxes-stacked' },
    { label: 'Movimientos', route: '/logistics/movements', icon: 'fa-dolly' },
    { label: 'Combustible', route: '/logistics/fuel', icon: 'fa-gas-pump' },
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

  columns: TableColumn[] = [
    { key: 'code', label: 'Código', type: 'template' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'category', label: 'Categoría', type: 'template' },
    { key: 'unidad_medida', label: 'Unidad', type: 'text' },
    { key: 'stock', label: 'Stock', type: 'template' },
    { key: 'precio_unitario', label: 'Precio Unit.', type: 'currency', format: 'PEN' },
    { key: 'totalValue', label: 'Valor Total', type: 'template' },
    { key: 'ubicacion', label: 'Ubicación', type: 'text' },
    {
      key: 'esta_activo',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        true: { label: 'Activo', class: 'status-badge status-active', icon: 'fa-check' },
        false: { label: 'Inactivo', class: 'status-badge status-inactive', icon: 'fa-ban' },
      },
    },
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
          query: { type: 'string', description: 'The search term' }
        },
        required: ['query']
      },
      execute: async (args: { query: string }) => {
        this.onFilterChange({ search: args.query });
        return { success: true, message: `Searching products for: ${args.query}` };
      }
    });

    this.webMcpService.registerTool({
      name: 'view_product_details',
      description: 'Views the details page for a specific product by its unique ID.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The unique ID of the product' }
        },
        required: ['id']
      },
      execute: async (args: { id: string }) => {
        await this.router.navigate(['/logistics/products', args.id]);
        return { success: true, message: `Navigating to product details for ID: ${args.id}` };
      }
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
