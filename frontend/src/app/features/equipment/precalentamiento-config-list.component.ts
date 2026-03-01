import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  PrecalentamientoConfigService,
  PrecalentamientoConfig,
} from '../../core/services/precalentamiento-config.service';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { AeroCardComponent } from '../../core/design-system/card/aero-card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

interface EditState {
  tipoEquipoId: number;
  horas: number;
}

@Component({
  selector: 'app-precalentamiento-config-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    AeroCardComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Config. de Precalentamiento"
      subtitle="Horas de precalentamiento por tipo de equipo (PRD Anexo B)"
      icon="fa-fire-flame-curved"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <aero-card>
        <!-- Info banner -->
        <div class="info-banner" data-testid="info-banner">
          <i class="fa-solid fa-circle-info"></i>
          <span>
            Según el <strong>Anexo B</strong> del PRD: Maquinaria Pesada = 0.50 h, Vehículos Pesados
            = 0.25 h, Vehículos Livianos / Equipos Menores = 0.00 h. Estos valores se aplican
            automáticamente al crear un parte diario.
          </span>
        </div>

        <!-- Save / Error alerts -->
        @if (saveSuccess) {
          <div class="alert alert-success" data-testid="save-success-alert">
            <i class="fa-solid fa-circle-check"></i> Configuración guardada correctamente.
          </div>
        }
        @if (saveError) {
          <div class="alert alert-danger" data-testid="save-error-alert">
            <i class="fa-solid fa-circle-xmark"></i> {{ saveError }}
          </div>
        }

        <!-- Config table -->
        <div class="config-table-wrapper" data-testid="config-table">
          <table class="config-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo de Equipo</th>
                <th>Categoría PRD</th>
                <th class="col-horas">Horas Precalentamiento</th>
                <th class="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (cfg of configs; track cfg.tipo_equipo_id) {
                <tr [attr.data-testid]="'row-' + cfg.tipo_equipo_id">
                  <td>
                    <span class="tipo-codigo" data-testid="tipo-codigo">{{
                      cfg.tipo_equipo_codigo
                    }}</span>
                  </td>
                  <td>
                    <span class="tipo-nombre" data-testid="tipo-nombre">{{
                      cfg.tipo_equipo_nombre
                    }}</span>
                  </td>
                  <td>
                    <span
                      class="cat-badge"
                      [ngClass]="getCatClass(cfg.categoria_prd)"
                      data-testid="cat-badge"
                      >{{ getCatLabel(cfg.categoria_prd) }}</span
                    >
                  </td>
                  <td class="col-horas">
                    @if (editState?.tipoEquipoId === cfg.tipo_equipo_id) {
                      <input
                        type="number"
                        class="horas-input"
                        [attr.data-testid]="'horas-input-' + cfg.tipo_equipo_id"
                        [(ngModel)]="editState!.horas"
                        min="0"
                        max="24"
                        step="0.25"
                        (keydown.enter)="guardar()"
                        (keydown.escape)="cancelar()"
                      />
                      <span class="unit-label">h</span>
                    } @else {
                      <span
                        class="horas-value"
                        [attr.data-testid]="'horas-value-' + cfg.tipo_equipo_id"
                      >
                        {{ cfg.horas_precalentamiento | number: '1.2-2' }} h
                      </span>
                    }
                  </td>
                  <td class="col-actions">
                    @if (editState?.tipoEquipoId === cfg.tipo_equipo_id) {
                      <app-button
                        variant="primary"
                        size="sm"
                        icon="fa-check"
                        [label]="saving ? 'Guardando…' : 'Guardar'"
                        [disabled]="saving"
                        (clicked)="guardar()"
                        [attr.data-testid]="'save-btn-' + cfg.tipo_equipo_id"
                      ></app-button>
                      <app-button
                        variant="ghost"
                        size="sm"
                        icon="fa-xmark"
                        label="Cancelar"
                        (clicked)="cancelar()"
                        [attr.data-testid]="'cancel-btn-' + cfg.tipo_equipo_id"
                      ></app-button>
                    } @else {
                      <app-button
                        variant="icon"
                        size="sm"
                        icon="fa-pencil"
                        title="Editar"
                        (clicked)="editar(cfg)"
                        [attr.data-testid]="'edit-btn-' + cfg.tipo_equipo_id"
                      ></app-button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="empty-state" data-testid="empty-state">
                    @if (loading) {
                      <i class="fa-solid fa-spinner fa-spin"></i> Cargando…
                    } @else {
                      No hay configuraciones disponibles.
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </aero-card>
    </app-page-layout>
  `,
  styles: [
    `
      .info-banner {
        display: flex;
        align-items: flex-start;
        gap: var(--s-8);
        background: var(--semantic-blue-50);
        border: 1px solid var(--semantic-blue-200);
        border-radius: var(--radius-md);
        padding: var(--s-12) var(--s-16);
        margin-bottom: var(--s-16);
        font-size: 0.875rem;
        color: var(--semantic-blue-700);
        line-height: 1.5;

        i {
          margin-top: 2px;
          color: var(--semantic-blue-500);
          flex-shrink: 0;
        }
      }

      .alert {
        padding: var(--s-12) var(--s-16);
        border-radius: var(--radius-md);
        margin-bottom: var(--s-16);
        display: flex;
        align-items: center;
        gap: var(--s-8);
        font-size: 0.875rem;
      }

      .alert-success {
        background: var(--semantic-green-50);
        border: 1px solid var(--semantic-green-200);
        color: var(--primary-900);
      }

      .alert-danger {
        background: var(--semantic-red-50);
        border: 1px solid var(--semantic-red-200);
        color: var(--grey-900);
      }

      .config-table-wrapper {
        overflow-x: auto;
        border: 1px solid var(--grey-100);
        border-radius: var(--radius-md);
      }

      .config-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;

        thead tr {
          background: var(--grey-50);
          border-bottom: 2px solid var(--grey-100);
        }

        th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: var(--grey-700);
          white-space: nowrap;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--grey-50);
          vertical-align: middle;
        }

        tbody tr:last-child td {
          border-bottom: none;
        }
        tbody tr:hover {
          background: var(--grey-50);
        }
      }

      .col-horas {
        width: 180px;
      }
      .col-actions {
        width: 200px;
      }

      .tipo-codigo {
        display: inline-block;
        font-family: monospace;
        font-size: 0.85rem;
        background: var(--grey-100);
        padding: 2px 8px;
        border-radius: 4px;
        color: var(--grey-700);
        font-weight: 600;
      }

      .tipo-nombre {
        font-weight: 500;
        color: var(--grey-900);
      }

      .cat-badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .badge-cat-maquinaria {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
      }
      .badge-cat-pesado {
        background: var(--semantic-red-50);
        color: var(--grey-900);
      }
      .badge-cat-liviano {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }
      .badge-cat-menor {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }

      .horas-value {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--primary-800);
      }

      .horas-input {
        width: 80px;
        padding: 4px 8px;
        border: 1.5px solid var(--primary-400);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        outline: none;
        color: var(--grey-900);

        &:focus {
          border-color: var(--primary-600);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-500) 20%, transparent);
        }
      }

      .unit-label {
        margin-left: 4px;
        color: var(--grey-500);
        font-size: 0.8rem;
      }

      .empty-state {
        text-align: center;
        color: var(--grey-400);
        padding: 32px !important;
      }

      .col-actions {
        display: flex;
        gap: 4px;
        align-items: center;
      }
    `,
  ],
})
export class PrecalentamientoConfigListComponent implements OnInit {
  private service = inject(PrecalentamientoConfigService);

  breadcrumbs = [
    { label: 'Equipo Mecánico', url: '/equipment' },
    { label: 'Config. Precalentamiento' },
  ];

  configs: PrecalentamientoConfig[] = [];
  loading = false;
  saving = false;
  saveSuccess = false;
  saveError: string | null = null;

  editState: EditState | null = null;

  ngOnInit(): void {
    this.cargarConfigs();
  }

  cargarConfigs(): void {
    this.loading = true;
    this.service.listar().subscribe({
      next: (data) => {
        this.configs = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando configs:', err);
        this.loading = false;
      },
    });
  }

  editar(cfg: PrecalentamientoConfig): void {
    this.saveSuccess = false;
    this.saveError = null;
    this.editState = {
      tipoEquipoId: cfg.tipo_equipo_id,
      horas: cfg.horas_precalentamiento,
    };
  }

  cancelar(): void {
    this.editState = null;
    this.saveError = null;
  }

  guardar(): void {
    if (!this.editState) return;
    const { tipoEquipoId, horas } = this.editState;
    if (horas < 0) {
      this.saveError = 'Las horas no pueden ser negativas.';
      return;
    }
    this.saving = true;
    this.saveSuccess = false;
    this.saveError = null;

    this.service.actualizar(tipoEquipoId, horas).subscribe({
      next: (updated) => {
        const idx = this.configs.findIndex((c) => c.tipo_equipo_id === tipoEquipoId);
        if (idx !== -1) this.configs[idx] = updated;
        this.editState = null;
        this.saving = false;
        this.saveSuccess = true;
        setTimeout(() => (this.saveSuccess = false), 3000);
      },
      error: (err) => {
        this.saveError = err?.error?.error?.message || 'Error al guardar la configuración.';
        this.saving = false;
      },
    });
  }

  getCatLabel(cat: string): string {
    const labels: Record<string, string> = {
      MAQUINARIA_PESADA: 'Maquinaria Pesada',
      VEHICULOS_PESADOS: 'Vehículos Pesados',
      VEHICULOS_LIVIANOS: 'Vehículos Livianos',
      EQUIPOS_MENORES: 'Equipos Menores',
    };
    return labels[cat] ?? cat;
  }

  getCatClass(cat: string): string {
    const classes: Record<string, string> = {
      MAQUINARIA_PESADA: 'badge-cat-maquinaria',
      VEHICULOS_PESADOS: 'badge-cat-pesado',
      VEHICULOS_LIVIANOS: 'badge-cat-liviano',
      EQUIPOS_MENORES: 'badge-cat-menor',
    };
    return classes[cat] ?? '';
  }
}
