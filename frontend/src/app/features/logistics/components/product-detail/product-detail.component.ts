import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InventoryService, Product, Movement } from '../../services/inventory.service';
import { EntityDetailShellComponent } from '../../../../shared/components/entity-detail/entity-detail-shell.component';
import { EntityDetailHeader } from '../../../../shared/components/entity-detail/entity-detail.types';
import {
  AeroTableComponent,
  TableColumn,
} from '../../../../core/design-system/table/aero-table.component';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, EntityDetailShellComponent, AeroTableComponent],
  template: `
    <entity-detail-shell
      [header]="header"
      [entity]="product"
      [loading]="loading"
      loadingText="Cargando detalles del producto..."
    >
      <!-- ── BELOW HEADER: tab bar ───────────────────────────── -->
      <div entity-header-below class="tabs-header-premium">
        <button
          type="button"
          class="tab-link"
          [class.active]="activeTab === 'general'"
          (click)="activeTab = 'general'"
        >
          <i class="fa-solid fa-circle-info"></i>
          General
        </button>
        <button
          type="button"
          class="tab-link"
          [class.active]="activeTab === 'movements'"
          (click)="activeTab = 'movements'"
        >
          <i class="fa-solid fa-right-left"></i>
          Movimientos
        </button>
        <button
          type="button"
          class="tab-link"
          [class.active]="activeTab === 'others'"
          (click)="activeTab = 'others'"
        >
          <i class="fa-solid fa-gear"></i>
          Otros
        </button>
      </div>

      <!-- ── MAIN CONTENT: tabs ──────────────────────────────── -->
      <div entity-main-content>
        <!-- GENERAL TAB -->
        @if (activeTab === 'general' && product) {
          <div class="product-info-grid">
            <div class="info-card">
              <div class="card-header">
                <h3>Información Básica</h3>
              </div>
              <div class="card-body">
                <div class="detail-row">
                  <span class="label">Código</span>
                  <span class="value code">{{ product.codigo }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Categoría</span>
                  <span class="value">{{ product.categoria || 'Sin categoría' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">U. Medida</span>
                  <span class="value">{{ product.unidad_medida }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Ubicación</span>
                  <span class="value font-medium">{{ product.ubicacion || '-' }}</span>
                </div>
              </div>
            </div>

            <div class="info-card">
              <div class="card-header">
                <h3>Valores y Stock</h3>
              </div>
              <div class="card-body">
                <div class="detail-row">
                  <span class="label">Stock Actual</span>
                  <span class="value stock-badge" [class.low]="isLowStock()">
                    {{ product.stock_actual }} {{ product.unidad_medida }}
                  </span>
                </div>
                <div class="detail-row">
                  <span class="label">Stock Mínimo</span>
                  <span class="value">{{ product.stock_minimo || 'N/A' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Precio Unit.</span>
                  <span class="value price">{{ product.precio_unitario | currency: 'PEN' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Valor Total</span>
                  <span class="value total-value">
                    {{ getInventoryValue() | currency: 'PEN' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="info-card span-cols">
              <div class="card-header">
                <h3>Descripción</h3>
              </div>
              <div class="card-body">
                <p class="description-text">
                  {{ product.descripcion || 'No hay descripción adicional para este producto.' }}
                </p>
              </div>
            </div>
          </div>
        }

        <!-- MOVEMENTS TAB -->
        @if (activeTab === 'movements') {
          <div class="movements-container">
            <aero-table
              [columns]="movementColumns"
              [data]="movements"
              [loading]="loadingMovements"
              [templates]="{
                tipo_movimiento: typeTemplate,
                fecha: dateTemplate,
              }"
            >
            </aero-table>

            <ng-template #dateTemplate let-row>
              {{ row.fecha | date: 'dd/MM/yyyy HH:mm' }}
            </ng-template>

            <ng-template #typeTemplate let-row>
              <span
                class="badge"
                [class.badge-primary]="row.tipo_movimiento === 'entrada'"
                [class.badge-danger]="row.tipo_movimiento === 'salida'"
              >
                {{ row.tipo_movimiento | uppercase }}
              </span>
            </ng-template>
          </div>
        }

        <!-- OTHERS TAB -->
        @if (activeTab === 'others' && product) {
          <div class="others-tab p-6">
            <div class="meta-info">
              <div class="meta-item">
                <span class="label">Creado:</span>
                <span class="value">{{ product.created_at | date: 'medium' }}</span>
              </div>
              <div class="meta-item">
                <span class="label">Última Actualización:</span>
                <span class="value">{{ product.updated_at | date: 'medium' }}</span>
              </div>
              <div class="meta-item">
                <span class="label">Estado en Sistema:</span>
                <span class="value">
                  <span class="badge" [class.badge-primary]="product.esta_activo">
                    {{ product.esta_activo ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- ── SIDEBAR ACTIONS ──────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <button type="button" class="btn btn-primary btn-block" (click)="editProduct()">
          <i class="fa-solid fa-pen-to-square"></i>
          Editar Detalles
        </button>
        <button type="button" class="btn btn-secondary btn-block" (click)="activeTab = 'movements'">
          <i class="fa-solid fa-right-left"></i>
          Ver Movimientos
        </button>
        <button type="button" class="btn btn-ghost btn-block" routerLink="/logistics/products">
          <i class="fa-solid fa-arrow-left-long"></i>
          Volver a Lista
        </button>
        <button type="button" class="btn btn-danger btn-block" (click)="deleteProduct()">
          <i class="fa-solid fa-trash-can"></i>
          Eliminar Producto
        </button>
      </ng-container>
    </entity-detail-shell>
  `,
  styles: [
    `
      .tabs-header-premium {
        display: flex;
        gap: var(--s-8);
        border-bottom: 2px solid var(--grey-100);
        margin-top: var(--s-8);
      }

      .tab-link {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        font-size: 14px;
        font-weight: 600;
        color: var(--grey-500);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 8px 8px 0 0;

        i {
          font-size: 16px;
          opacity: 0.7;
        }

        &:hover {
          color: var(--primary-600);
          background: var(--primary-50);
          opacity: 1;
        }

        &.active {
          color: var(--primary-600);
          border-bottom: 3px solid var(--primary-600);
          background: var(--primary-50);

          i {
            opacity: 1;
          }
        }
      }

      .product-info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--s-24);
        padding: var(--s-24);
      }

      .info-card {
        background: white;
        border: 1px solid var(--grey-200);
        border-radius: 12px;
        overflow: hidden;

        .card-header {
          padding: 16px 20px;
          background: var(--grey-50);
          border-bottom: 1px solid var(--grey-200);

          h3 {
            font-size: 15px;
            font-weight: 700;
            color: var(--primary-900);
            margin: 0;
          }
        }

        .card-body {
          padding: 20px;
        }

        &.span-cols {
          grid-column: span 2;
        }
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px dashed var(--grey-100);

        &:last-child {
          border-bottom: none;
        }

        .label {
          font-size: 13px;
          color: var(--grey-500);
          font-weight: 500;
        }

        .value {
          font-size: 14px;
          color: var(--grey-900);
          font-weight: 600;

          &.code {
            color: var(--primary-600);
            font-family: monospace;
            background: var(--primary-50);
            padding: 2px 6px;
            border-radius: 4px;
          }

          &.price {
            color: var(--secondary-600);
          }

          &.total-value {
            color: var(--primary-700);
            font-size: 16px;
          }

          &.stock-badge {
            background: var(--success-50);
            color: var(--success-700);
            padding: 4px 10px;
            border-radius: 20px;

            &.low {
              background: var(--warning-50);
              color: var(--warning-700);
            }
          }
        }
      }

      .description-text {
        font-size: 14px;
        line-height: 1.6;
        color: var(--grey-700);
        margin: 0;
      }

      .movements-container {
        padding: var(--s-24);
      }

      .meta-info {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .meta-item {
          display: flex;
          gap: 12px;
          font-size: 13px;

          .label {
            color: var(--grey-400);
            width: 140px;
          }

          .value {
            color: var(--grey-600);
            font-weight: 500;
          }
        }
      }
    `,
  ],
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  product: Product | null = null;
  loading = true;
  activeTab: 'general' | 'movements' | 'others' = 'general';

  // Movements data
  movements: Movement[] = [];
  loadingMovements = false;

  movementColumns: TableColumn[] = [
    { key: 'fecha', label: 'Fecha', type: 'template' },
    { key: 'tipo_movimiento', label: 'Tipo', type: 'template' },
    { key: 'numero_documento', label: 'Documento', type: 'text' },
    { key: 'proyecto_nombre', label: 'Origen/Destino', type: 'text' },
    { key: 'observaciones', label: 'Observaciones', type: 'text' },
  ];

  get header(): EntityDetailHeader {
    return {
      icon: 'fa-solid fa-box',
      title: this.product?.nombre || 'Producto',
      subtitle: this.product?.codigo || 'Detalle de Producto',
      statusLabel: this.product?.esta_activo ? 'ACTIVO' : 'INACTIVO',
      statusClass: this.product?.esta_activo ? 'status-active' : 'status-inactive',
    };
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadProduct(id);
      this.loadMovements(id);
    }
  }

  loadProduct(id: string | number): void {
    this.loading = true;
    this.inventoryService.getProductById(id).subscribe({
      next: (data) => {
        this.product = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading product', err);
        this.router.navigate(['/logistics/products']);
      },
    });
  }

  loadMovements(productId: string | number): void {
    this.loadingMovements = true;
    this.inventoryService.getProductMovements(productId).subscribe({
      next: (data) => {
        this.movements = data;
        this.loadingMovements = false;
      },
      error: (err) => {
        console.error('Error loading movements', err);
        this.loadingMovements = false;
      },
    });
  }

  isLowStock(): boolean {
    if (!this.product) return false;
    const stock = Number(this.product.stock_actual);
    const min = Number(this.product.stock_minimo || 0);
    return stock <= min;
  }

  getInventoryValue(): number {
    if (!this.product) return 0;
    return Number(this.product.stock_actual) * Number(this.product.precio_unitario);
  }

  deleteProduct(): void {
    this.confirmSvc.confirmDelete(`el producto ${this.product?.nombre}`).subscribe((confirmed) => {
      if (confirmed && this.product) {
        this.inventoryService.deleteProduct(this.product.id).subscribe({
          next: () => {
            this.snackBar.open('Producto eliminado correctamente', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/logistics/products']);
          },
          error: (err: unknown) => {
            console.error('Error deleting product', err);
            this.snackBar.open('Error al eliminar el producto', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  editProduct(): void {
    if (this.product) {
      this.router.navigate(['/logistics/products', this.product.id, 'edit']);
    }
  }
}
