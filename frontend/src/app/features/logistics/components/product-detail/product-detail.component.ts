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
import {
  AeroBadgeComponent,
  BadgeVariant,
} from '../../../../core/design-system/badge/aero-badge.component';
import { AeroCardComponent } from '../../../../core/design-system/card/aero-card.component';
import { AeroTabsComponent } from '../../../../shared/components/aero-tabs/aero-tabs.component';
import { TabItem } from '../../../../shared/components/page-layout/page-layout.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    EntityDetailShellComponent,
    AeroTableComponent,
    AeroBadgeComponent,
    AeroCardComponent,
    AeroTabsComponent,
    ButtonComponent,
  ],
  template: `
    <app-entity-detail-shell
      [header]="header"
      [entity]="product"
      [loading]="loading"
      loadingText="Cargando detalles del producto..."
    >
      <!-- ── BELOW HEADER: tab bar ───────────────────────────── -->
      <div entity-header-below>
        <app-aero-tabs
          [tabs]="detailTabs"
          [activeTabId]="activeTab"
          (tabChange)="onTabChange($event)"
        ></app-aero-tabs>
      </div>

      <!-- ── MAIN CONTENT: tabs ──────────────────────────────── -->
      <div entity-main-content>
        <!-- GENERAL TAB -->
        @if (activeTab === 'general' && product) {
          <div class="product-info-grid">
            <aero-card title="Información Básica">
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
            </aero-card>

            <aero-card title="Valores y Stock">
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
            </aero-card>

            <aero-card title="Descripción" class="span-cols">
              <p class="description-text">
                {{ product.descripcion || 'No hay descripción adicional para este producto.' }}
              </p>
            </aero-card>
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
              <aero-badge [variant]="row.tipo_movimiento === 'entrada' ? 'success' : 'error'">
                {{ row.tipo_movimiento | uppercase }}
              </aero-badge>
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
                  <aero-badge [variant]="product.esta_activo ? 'success' : 'neutral'">
                    {{ product.esta_activo ? 'ACTIVO' : 'INACTIVO' }}
                  </aero-badge>
                </span>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- ── SIDEBAR ACTIONS ──────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <app-button
          variant="primary"
          icon="fa-pen-to-square"
          label="Editar Detalles"
          [fullWidth]="true"
          (clicked)="editProduct()"
        ></app-button>
        <app-button
          variant="secondary"
          icon="fa-right-left"
          label="Ver Movimientos"
          [fullWidth]="true"
          (clicked)="activeTab = 'movements'"
        ></app-button>
        <app-button
          variant="ghost"
          icon="fa-arrow-left-long"
          label="Volver a Lista"
          [fullWidth]="true"
          (clicked)="navigateToList()"
        ></app-button>
        <app-button
          variant="danger"
          icon="fa-trash-can"
          label="Eliminar Producto"
          [fullWidth]="true"
          (clicked)="deleteProduct()"
        ></app-button>
      </ng-container>
    </app-entity-detail-shell>
  `,
  styles: [
    `
      .product-info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--s-24);
        padding: var(--s-24);
      }

      .span-cols {
        grid-column: span 2;
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

  detailTabs: (TabItem & { id: string })[] = [
    { id: 'general', label: 'General', icon: 'fa-circle-info' },
    { id: 'movements', label: 'Movimientos', icon: 'fa-right-left' },
    { id: 'others', label: 'Otros', icon: 'fa-gear' },
  ];

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

  onTabChange(tab: TabItem & { id?: string }): void {
    this.activeTab = (tab.id as 'general' | 'movements' | 'others') || 'general';
  }

  navigateToList(): void {
    this.router.navigate(['/logistics/products']);
  }

  editProduct(): void {
    if (this.product) {
      this.router.navigate(['/logistics/products', this.product.id, 'edit']);
    }
  }
}
