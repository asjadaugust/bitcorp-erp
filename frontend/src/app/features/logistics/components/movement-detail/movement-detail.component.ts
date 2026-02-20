import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InventoryService, Movement } from '../../services/inventory.service';
import { EntityDetailShellComponent } from '../../../../shared/components/entity-detail/entity-detail-shell.component';
import {
  EntityDetailHeader,
  AuditInfo,
} from '../../../../shared/components/entity-detail/entity-detail.types';
import {
  AeroTableComponent,
  TableColumn,
} from '../../../../core/design-system/table/aero-table.component';

@Component({
  selector: 'app-movement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, EntityDetailShellComponent, AeroTableComponent],
  template: `
    <entity-detail-shell
      [header]="header"
      [entity]="movement"
      [loading]="loading"
      [auditInfo]="auditInfo"
      loadingText="Cargando detalles del movimiento..."
    >
      <!-- ── TAB NAVIGATION ───────────────────────────────────── -->
      <div entity-header-below class="tabs-header-premium">
        <button
          type="button"
          class="tab-link"
          [class.active]="activeTab === 'general'"
          (click)="activeTab = 'general'"
        >
          <i class="fa-solid fa-circle-info"></i>
          Resumen
        </button>
        <button
          type="button"
          class="tab-link"
          [class.active]="activeTab === 'items'"
          (click)="activeTab = 'items'"
        >
          <i class="fa-solid fa-list-check"></i>
          Ítems
        </button>
        <button
          type="button"
          class="tab-link"
          [class.active]="activeTab === 'others'"
          (click)="activeTab = 'others'"
        >
          <i class="fa-solid fa-clock-rotate-left"></i>
          Metadatos
        </button>
      </div>

      <!-- ── MAIN CONTENT ────────────────────────────────────── -->
      <div entity-main-content>
        <!-- GENERAL TAB -->
        @if (activeTab === 'general' && movement) {
          <section class="detail-section">
            <div class="section-header-compact">
              <i class="fa-solid fa-circle-info"></i>
              <h3>Resumen del Movimiento</h3>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <label>ID Movimiento</label>
                <p class="code">#{{ movement.id }}</p>
              </div>
              <div class="info-item">
                <label>Fecha</label>
                <p>{{ movement.fecha | date: 'medium' }}</p>
              </div>
              <div class="info-item">
                <label>Proyecto</label>
                <p>{{ movement.proyecto_nombre || 'No aplica' }}</p>
              </div>
              <div class="info-item">
                <label>Documento</label>
                <p class="font-medium">{{ movement.numero_documento || '-' }}</p>
              </div>
              <div class="info-item">
                <label>Tipo</label>
                <p>
                  <span
                    class="badge"
                    [class.badge-primary]="movement.tipo_movimiento === 'entrada'"
                    [class.badge-danger]="movement.tipo_movimiento === 'salida'"
                  >
                    {{ movement.tipo_movimiento | uppercase }}
                  </span>
                </p>
              </div>
              <div class="info-item">
                <label>Cant. Items</label>
                <p>{{ movement.items_count || movement.detalles?.length || 0 }}</p>
              </div>
              <div class="info-item span-2">
                <label>Monto Total</label>
                <p class="price-large">
                  S/ {{ movement.monto_total || calculateTotal() | number: '1.2-2' }}
                </p>
              </div>
              <div class="info-item span-2">
                <label>Observaciones</label>
                <p class="description-text">
                  {{ movement.observaciones || 'Sin observaciones registradas.' }}
                </p>
              </div>
            </div>
          </section>
        }

        <!-- ITEMS TAB -->
        @if (activeTab === 'items' && movement) {
          <div class="items-container">
            <aero-table
              [columns]="itemColumns"
              [data]="movement.detalles || []"
              [loading]="false"
              [templates]="{
                monto_total: montoTemplate,
              }"
            >
            </aero-table>

            <ng-template #montoTemplate let-row>
              <span class="font-bold text-primary-700">
                S/ {{ row.monto_total | number: '1.2-2' }}
              </span>
            </ng-template>
          </div>
        }

        <!-- OTHERS TAB -->
        @if (activeTab === 'others' && movement) {
          <div class="others-tab p-6">
            <div class="meta-info">
              <div class="meta-item">
                <span class="label">Registrado por:</span>
                <span class="value">{{ movement.creado_por_nombre || 'Sistema' }}</span>
              </div>
              <div class="meta-item">
                <span class="label">Fecha Creación:</span>
                <span class="value">{{ movement.created_at | date: 'medium' }}</span>
              </div>
              <div class="meta-item">
                <span class="label">Última Modificación:</span>
                <span class="value">{{ movement.updated_at | date: 'medium' }}</span>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- ── SIDEBAR ACTIONS ───────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <button
          type="button"
          class="btn btn-primary btn-block"
          [disabled]="movement?.estado === 'ANULADO'"
          (click)="editMovement()"
        >
          <i class="fa-solid fa-pen-to-square"></i>
          Editar Movimiento
        </button>
        <button type="button" class="btn btn-secondary btn-block" (click)="activeTab = 'items'">
          <i class="fa-solid fa-list-ul"></i>
          Ver Detalle Items
        </button>
        <button type="button" class="btn btn-ghost btn-block" routerLink="/logistics/movements">
          <i class="fa-solid fa-arrow-left"></i>
          Volver a Lista
        </button>
        <button
          type="button"
          class="btn btn-outline-danger btn-block"
          [disabled]="movement?.estado === 'ANULADO'"
          (click)="cancelMovement()"
        >
          <i class="fa-solid fa-ban"></i>
          Anular Movimiento
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
        transition: all 0.2s ease;
        border-radius: 8px 8px 0 0;

        i {
          font-size: 16px;
          opacity: 0.7;
        }
        &:hover {
          color: var(--primary-600);
          background: var(--primary-50);
        }
        &.active {
          color: var(--primary-600);
          border-bottom: 3px solid var(--primary-600);
          background: rgba(var(--primary-600-rgb, 59, 130, 246), 0.05);
          i {
            opacity: 1;
          }
        }
      }

      .tab-content {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);
        margin-top: var(--s-24);
      }

      .btn-block {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 12px;
        padding: 10px 16px;
        width: 100%;
        text-align: left;
        font-weight: 500;
        i {
          width: 16px;
          text-align: center;
        }
      }

      .items-container {
        padding: var(--s-24);
      }
      .description-text {
        font-size: 14px;
        color: var(--grey-700);
        line-height: 1.6;
        margin: 0;
      }

      .meta-info {
        display: flex;
        flex-direction: column;
        gap: 12px;
        .meta-item {
          display: flex;
          gap: 12px;
          .label {
            color: var(--grey-400);
            width: 140px;
            font-size: 13px;
          }
          .value {
            color: var(--grey-600);
            font-weight: 500;
            font-size: 13px;
          }
        }
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }

      .price-large {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--secondary-700);
      }
    `,
  ],
})
export class MovementDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);

  movement: Movement | null = null;
  loading = true;
  activeTab: 'general' | 'items' | 'others' = 'general';

  itemColumns: TableColumn[] = [
    { key: 'producto_nombre', label: 'Producto', type: 'text' },
    { key: 'producto_codigo', label: 'Código', type: 'text' },
    { key: 'cantidad', label: 'Cantidad', type: 'text' },
    { key: 'precio_unitario', label: 'Precio Unit.', type: 'currency' },
    { key: 'monto_total', label: 'Subtotal', type: 'template' },
  ];

  get header(): EntityDetailHeader {
    return {
      icon: 'fa-solid fa-truck-ramp-box',
      title: this.movement ? `Movimiento #${this.movement.id}` : 'Movimiento',
      subtitle: this.movement?.numero_documento || 'Sin documento',
      statusLabel: (this.movement?.estado || 'PENDIENTE').toUpperCase(),
      statusClass: this.getStatusClass(),
    };
  }

  get auditInfo(): AuditInfo {
    return {
      entries: [
        {
          label: `Registrado por: ${this.movement?.creado_por_nombre || 'N/A'}`,
          date: this.movement?.created_at,
        },
        { label: 'Última actualización técnica', date: this.movement?.updated_at },
      ],
    };
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadMovement(id);
    }
  }

  loadMovement(id: number): void {
    this.loading = true;
    this.inventoryService.getMovementById(id).subscribe({
      next: (data) => {
        this.movement = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading movement', err);
        this.router.navigate(['/logistics/movements']);
      },
    });
  }

  getStatusClass(): string {
    const status = this.movement?.estado?.toLowerCase() || '';
    if (status === 'completado') return 'status-active';
    if (status === 'anulado') return 'status-inactive';
    return 'status-pending';
  }

  cancelMovement(): void {
    if (confirm('¿Está seguro de anular este movimiento?')) {
      // Logic for cancellation (could call service)
      console.log('Cancel movement', this.movement?.id);
    }
  }

  editMovement(): void {
    if (this.movement) {
      this.router.navigate(['/logistics/movements', this.movement.id, 'edit']);
    }
  }

  calculateTotal(): number {
    if (!this.movement?.detalles) return 0;
    return this.movement.detalles.reduce((acc, item) => acc + Number(item.monto_total || 0), 0);
  }
}
