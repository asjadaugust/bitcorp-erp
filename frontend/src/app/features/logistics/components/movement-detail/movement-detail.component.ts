import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InventoryService, Movement } from '../../services/inventory.service';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';

@Component({
  selector: 'app-movement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageLayoutComponent],
  template: `
    <app-page-layout
      [title]="movement ? 'Movimiento #' + movement.id : 'Detalle de Movimiento'"
      icon="fa-dolly"
      [breadcrumbs]="[
        { label: 'Inicio', url: '/app' },
        { label: 'Logística', url: '/logistics' },
        { label: 'Movimientos', url: '/logistics/movements' },
        { label: movement ? '#' + movement.id : 'Detalle' },
      ]"
      [loading]="loading"
      [backUrl]="'/logistics/movements'"
    >
      <div *ngIf="movement" class="detail-container">
        <div class="card p-6">
          <div class="flex justify-between items-start mb-6 border-b pb-4">
            <div>
              <h3 class="text-xl font-bold text-primary-900">
                {{ movement.tipo_movimiento | uppercase }}
              </h3>
              <p class="text-grey-500">Documento: {{ movement.numero_documento || 'N/A' }}</p>
            </div>
            <div [class]="'badge badge-' + movement.estado.toLowerCase()">
              {{ movement.estado }}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div class="info-item">
              <label class="text-xs uppercase font-medium text-grey-500">Fecha</label>
              <p class="text-base">{{ movement.fecha | date: 'medium' }}</p>
            </div>
            <div class="info-item">
              <label class="text-xs uppercase font-medium text-grey-500">Proyecto</label>
              <p class="text-base">{{ movement.proyecto_nombre || 'No especificado' }}</p>
            </div>
            <div class="info-item">
              <label class="text-xs uppercase font-medium text-grey-500">Registrado por</label>
              <p class="text-base">{{ movement.creado_por_nombre || 'N/A' }}</p>
            </div>
          </div>

          <div class="table-container mb-6">
            <h4 class="text-lg font-semibold mb-4 text-primary-800">Detalles de Items</h4>
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-grey-50">
                  <th class="p-3 border-b text-xs uppercase font-semibold text-grey-600">
                    Producto
                  </th>
                  <th class="p-3 border-b text-xs uppercase font-semibold text-grey-600">Código</th>
                  <th class="p-3 border-b text-xs uppercase font-semibold text-grey-600">
                    Cantidad
                  </th>
                  <th class="p-3 border-b text-xs uppercase font-semibold text-grey-600">
                    Precio Unit.
                  </th>
                  <th class="p-3 border-b text-xs uppercase font-semibold text-grey-600">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let item of movement.detalles"
                  class="hover:bg-grey-50 transition-colors"
                >
                  <td class="p-3 border-b text-sm">{{ item.producto_nombre }}</td>
                  <td class="p-3 border-b text-sm font-mono text-primary-600">
                    {{ item.producto_codigo }}
                  </td>
                  <td class="p-3 border-b text-sm">{{ item.cantidad }} {{ item.unidad_medida }}</td>
                  <td class="p-3 border-b text-sm">{{ item.precio_unitario | currency: 'PEN' }}</td>
                  <td class="p-3 border-b text-sm font-semibold">
                    {{ item.monto_total | currency: 'PEN' }}
                  </td>
                </tr>
              </tbody>
              <tfoot *ngIf="movement.monto_total">
                <tr class="bg-grey-50 font-bold">
                  <td colspan="4" class="p-3 text-right text-sm">TOTAL:</td>
                  <td class="p-3 text-sm text-primary-700">
                    {{ movement.monto_total | currency: 'PEN' }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div *ngIf="movement.observaciones" class="mt-4 p-4 bg-grey-50 rounded-lg">
            <label class="text-xs uppercase font-medium text-grey-500 block mb-2"
              >Observaciones</label
            >
            <p class="text-sm text-grey-700">{{ movement.observaciones }}</p>
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
      .badge {
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 600;
      }
      .badge-completado {
        background: #dcfce7;
        color: #166534;
      }
      .badge-pendiente {
        background: #fef9c3;
        color: #854d0e;
      }
      .badge-anulado {
        background: #fee2e2;
        color: #991b1b;
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
}
