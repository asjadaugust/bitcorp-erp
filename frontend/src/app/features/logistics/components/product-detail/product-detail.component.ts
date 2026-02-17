import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InventoryService, Product } from '../../services/inventory.service';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../../../shared/components/stats-grid/stats-grid.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageLayoutComponent, StatsGridComponent],
  template: `
    <app-page-layout
      [title]="product ? product.nombre : 'Detalle de Producto'"
      icon="fa-box"
      [breadcrumbs]="[
        { label: 'Inicio', url: '/app' },
        { label: 'Logística', url: '/logistics' },
        { label: 'Productos', url: '/logistics/products' },
        { label: product?.codigo || 'Detalle' },
      ]"
      [loading]="loading"
      [backUrl]="'/logistics/products'"
    >
      <div actions>
        <button class="btn btn-primary" (click)="editProduct()">
          <i class="fa-solid fa-pen"></i> Editar Producto
        </button>
      </div>

      <div *ngIf="product" class="detail-container">
        <!-- Stats Recap -->
        <app-stats-grid [items]="statItems"></app-stats-grid>

        <div class="card p-6 mt-6">
          <div class="detail-header mb-6">
            <h3 class="text-lg font-semibold text-primary-900 border-b border-grey-200 pb-2 mb-4">
              Información del Producto
            </h3>
            <div class="info-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div class="info-item">
                <label class="text-xs uppercase font-medium text-grey-500 tracking-wider"
                  >Código</label
                >
                <p class="text-base font-semibold text-primary-600">{{ product.codigo }}</p>
              </div>
              <div class="info-item">
                <label class="text-xs uppercase font-medium text-grey-500 tracking-wider"
                  >Categoría</label
                >
                <p class="text-base text-grey-900">{{ product.categoria || 'Sin categoría' }}</p>
              </div>
              <div class="info-item">
                <label class="text-xs uppercase font-medium text-grey-500 tracking-wider"
                  >Unidad de Medida</label
                >
                <p class="text-base text-grey-900">{{ product.unidad_medida }}</p>
              </div>
              <div class="info-item">
                <label class="text-xs uppercase font-medium text-grey-500 tracking-wider"
                  >Precio Unitario</label
                >
                <p class="text-base text-grey-900">
                  {{ product.precio_unitario | currency: 'PEN' }}
                </p>
              </div>
              <div class="info-item">
                <label class="text-xs uppercase font-medium text-grey-500 tracking-wider"
                  >Stock Mínimo</label
                >
                <p class="text-base text-grey-900">{{ product.stock_minimo || 'N/A' }}</p>
              </div>
              <div class="info-item">
                <label class="text-xs uppercase font-medium text-grey-500 tracking-wider"
                  >Ubicación</label
                >
                <p class="text-base text-grey-900">{{ product.ubicacion || '-' }}</p>
              </div>
            </div>
          </div>

          <div class="detail-description mb-6">
            <h3 class="text-lg font-semibold text-primary-900 border-b border-grey-200 pb-2 mb-4">
              Descripción
            </h3>
            <p class="text-base text-grey-700 leading-relaxed">
              {{ product.descripcion || 'Sin descripción adicional.' }}
            </p>
          </div>

          <div class="detail-metadata">
            <div class="flex gap-4 text-xs text-grey-400">
              <span><strong>Creado:</strong> {{ product.created_at | date: 'short' }}</span>
              <span><strong>Actualizado:</strong> {{ product.updated_at | date: 'short' }}</span>
            </div>
          </div>
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .detail-container {
        animation: fadeIn 0.3s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);

  product: Product | null = null;
  loading = true;
  statItems: StatItem[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadProduct(id);
    }
  }

  loadProduct(id: string | number): void {
    this.loading = true;
    this.inventoryService.getProductById(id).subscribe({
      next: (data) => {
        this.product = data;
        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading product', err);
        this.router.navigate(['/logistics/products']);
      },
    });
  }

  calculateStats(): void {
    if (!this.product) return;

    const stock = Number(this.product.stock_actual);
    const stockMin = Number(this.product.stock_minimo || 0);

    let statusColor: StatItem['color'] = 'success';
    let statusIcon = 'fa-check-circle';

    if (stock === 0) {
      statusColor = 'danger';
      statusIcon = 'fa-times-circle';
    } else if (stock <= stockMin) {
      statusColor = 'warning';
      statusIcon = 'fa-exclamation-triangle';
    }

    this.statItems = [
      {
        label: 'Stock Actual',
        value: stock,
        icon: statusIcon,
        color: statusColor,
        testId: 'product-stock',
      },
      {
        label: 'Precio Unitario',
        value: `S/ ${this.product.precio_unitario}`,
        icon: 'fa-tag',
        color: 'info',
        testId: 'product-price',
      },
      {
        label: 'Valor Inventario',
        value: `S/ ${stock * Number(this.product.precio_unitario)}`,
        icon: 'fa-coins',
        color: 'primary',
        testId: 'product-value',
      },
    ];
  }

  editProduct(): void {
    if (this.product) {
      this.router.navigate(['/logistics/products', this.product.id, 'edit']);
    }
  }
}
