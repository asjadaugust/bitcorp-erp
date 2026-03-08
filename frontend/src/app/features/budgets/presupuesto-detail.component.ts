import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  PageLayoutComponent,
  TabItem,
} from '../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { AeroButtonComponent } from '../../core/design-system';
import { AeroBadgeComponent } from '../../core/design-system/badge/aero-badge.component';
import {
  AeroDropdownComponent,
  DropdownOption,
} from '../../core/design-system/dropdown/aero-dropdown.component';
import { ConfirmService } from '../../core/services/confirm.service';
import {
  PresupuestoService,
  PresupuestoDetail,
  PartidaItem,
} from '../../core/services/presupuesto.service';
import { ApuService, ApuDropdownItem } from '../../core/services/apu.service';
import { ProjectService } from '../../core/services/project.service';

const BUDGET_TABS: TabItem[] = [
  { label: 'Insumos', route: '/presupuestos/insumos', icon: 'fa-boxes-stacked' },
  { label: 'APUs', route: '/presupuestos/apus', icon: 'fa-calculator' },
  { label: 'Presupuestos', route: '/presupuestos', icon: 'fa-file-invoice-dollar' },
];

interface FaseGroup {
  fase: string;
  partidas: PartidaItem[];
  subtotal: number;
  collapsed: boolean;
}

@Component({
  selector: 'app-presupuesto-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageLayoutComponent,
    PageCardComponent,
    AeroButtonComponent,
    AeroBadgeComponent,
    AeroDropdownComponent,
  ],
  template: `
    <app-page-layout
      [title]="
        isCreate
          ? 'Nuevo Presupuesto'
          : presupuesto
            ? presupuesto.codigo + ' — ' + presupuesto.nombre
            : 'Cargando...'
      "
      icon="fa-file-invoice-dollar"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
      backUrl="/presupuestos"
    >
      <div actions style="display:flex;gap:8px;align-items:center">
        @if (!isCreate && presupuesto) {
          <aero-button
            data-testid="presupuesto-recalculate-btn"
            variant="secondary"
            iconLeft="fa-rotate"
            size="small"
            (clicked)="recalculate()"
          >
            Recalcular
          </aero-button>
        }
      </div>

      <!-- Create form -->
      @if (isCreate) {
        <app-page-card title="Datos del Presupuesto" [noPadding]="false">
          <div class="create-form" data-testid="presupuesto-create-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Proyecto *</label>
                <aero-dropdown
                  data-testid="presupuesto-form-proyecto"
                  [options]="projectOptions"
                  [(ngModel)]="createData.proyecto_id"
                  placeholder="Seleccionar proyecto"
                ></aero-dropdown>
              </div>
              <div class="form-group">
                <label class="form-label">Código *</label>
                <input
                  data-testid="presupuesto-form-codigo"
                  type="text"
                  class="form-control"
                  [(ngModel)]="createData.codigo"
                  placeholder="Ej: PRES-001"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Nombre *</label>
                <input
                  data-testid="presupuesto-form-nombre"
                  type="text"
                  class="form-control"
                  [(ngModel)]="createData.nombre"
                  placeholder="Nombre del presupuesto"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Fecha *</label>
                <input
                  data-testid="presupuesto-form-fecha"
                  type="date"
                  class="form-control"
                  [(ngModel)]="createData.fecha"
                />
              </div>
            </div>
            <div class="form-group" style="margin-top:var(--s-8)">
              <label class="form-label">Descripción</label>
              <textarea
                data-testid="presupuesto-form-descripcion"
                class="form-control"
                [(ngModel)]="createData.descripcion"
                rows="2"
                placeholder="Descripción opcional"
              ></textarea>
            </div>
            <div class="form-actions">
              <aero-button
                data-testid="presupuesto-form-cancel-btn"
                variant="tertiary"
                size="small"
                (clicked)="router.navigate(['/presupuestos'])"
                >Cancelar</aero-button
              >
              <aero-button
                data-testid="presupuesto-form-submit-btn"
                variant="primary"
                size="small"
                iconLeft="fa-check"
                [disabled]="
                  saving ||
                  !createData.proyecto_id ||
                  !createData.codigo ||
                  !createData.nombre ||
                  !createData.fecha
                "
                (clicked)="createPresupuesto()"
              >
                Crear Presupuesto
              </aero-button>
            </div>
          </div>
        </app-page-card>
      }

      <!-- Detail view -->
      @if (!isCreate && presupuesto) {
        <!-- Header info -->
        <app-page-card [noPadding]="false">
          <div class="header-grid" data-testid="presupuesto-detail-header">
            <div class="header-field">
              <span class="field-label">Código</span>
              <span class="field-value code-badge" data-testid="presupuesto-detail-codigo">{{
                presupuesto.codigo
              }}</span>
            </div>
            <div class="header-field">
              <span class="field-label">Fecha</span>
              <span class="field-value">{{ presupuesto.fecha }}</span>
            </div>
            <div class="header-field">
              <span class="field-label">Versión</span>
              <span class="field-value">v{{ presupuesto.version }}</span>
            </div>
            <div class="header-field">
              <span class="field-label">Estado</span>
              <aero-badge
                [text]="presupuesto.estado"
                [variant]="estadoVariant(presupuesto.estado)"
              ></aero-badge>
            </div>
            <div class="header-field total-highlight">
              <span class="field-label">Total Presupuestado</span>
              <span class="field-value total-value" data-testid="presupuesto-detail-total"
                >S/ {{ presupuesto.total_presupuestado | number: '1.2-2' }}</span
              >
            </div>
          </div>
        </app-page-card>

        <!-- Partidas by fase -->
        @for (faseGroup of faseGroups; track faseGroup.fase) {
          <app-page-card [noPadding]="false">
            <div
              class="fase-header"
              [attr.data-testid]="'presupuesto-fase-header-' + faseGroup.fase"
              (click)="faseGroup.collapsed = !faseGroup.collapsed"
            >
              <div class="fase-title">
                <i
                  class="fa-solid"
                  [class.fa-chevron-down]="!faseGroup.collapsed"
                  [class.fa-chevron-right]="faseGroup.collapsed"
                ></i>
                <span>{{ faseGroup.fase }}</span>
                <aero-badge
                  [text]="faseGroup.partidas.length.toString()"
                  variant="neutral"
                ></aero-badge>
              </div>
              <div class="fase-subtotal">S/ {{ faseGroup.subtotal | number: '1.2-2' }}</div>
            </div>

            @if (!faseGroup.collapsed) {
              <table class="partida-table" data-testid="presupuesto-partida-table">
                <thead>
                  <tr>
                    <th class="col-code">Código</th>
                    <th>Descripción</th>
                    <th class="col-sm">U.M.</th>
                    <th class="col-num">Metrado</th>
                    <th class="col-num">P.U.</th>
                    <th class="col-num">Parcial</th>
                    <th class="col-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of faseGroup.partidas; track p.id) {
                    <tr>
                      <td class="col-code">
                        <span class="code-badge">{{ p.codigo }}</span>
                      </td>
                      <td>
                        {{ p.descripcion }}
                        @if (p.apu_id) {
                          <a
                            class="apu-link"
                            (click)="navigateToApu(p.apu_id!); $event.stopPropagation()"
                          >
                            <i class="fa-solid fa-calculator"></i> APU
                          </a>
                        }
                      </td>
                      <td class="col-sm">{{ p.unidad_medida }}</td>
                      <td class="col-num">{{ p.metrado | number: '1.2-4' }}</td>
                      <td class="col-num">{{ p.precio_unitario | number: '1.2-4' }}</td>
                      <td class="col-num cost-cell">{{ p.parcial | number: '1.2-2' }}</td>
                      <td class="col-actions">
                        <aero-button
                          data-testid="presupuesto-remove-partida-btn"
                          variant="ghost"
                          size="small"
                          iconCenter="fa-trash"
                          (clicked)="removePartida(p.id)"
                        ></aero-button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </app-page-card>
        }

        <!-- Add partida form -->
        <app-page-card title="Agregar Partida" [noPadding]="false">
          <div class="add-partida-form" data-testid="presupuesto-add-partida-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Código *</label>
                <input
                  data-testid="partida-form-codigo"
                  type="text"
                  class="form-control"
                  [(ngModel)]="newPartida.codigo"
                  placeholder="Ej: 01.01"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Descripción *</label>
                <input
                  data-testid="partida-form-descripcion"
                  type="text"
                  class="form-control"
                  [(ngModel)]="newPartida.descripcion"
                  placeholder="Descripción de la partida"
                />
              </div>
              <div class="form-group">
                <label class="form-label">U.M. *</label>
                <input
                  data-testid="partida-form-unidad"
                  type="text"
                  class="form-control"
                  [(ngModel)]="newPartida.unidad_medida"
                  placeholder="m3"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Metrado</label>
                <input
                  data-testid="partida-form-metrado"
                  type="number"
                  class="form-control"
                  [(ngModel)]="newPartida.metrado"
                  step="0.01"
                  min="0"
                />
              </div>
              <div class="form-group">
                <label class="form-label">APU (auto P.U.)</label>
                <aero-dropdown
                  data-testid="partida-form-apu"
                  [options]="apuDropdown"
                  [(ngModel)]="newPartida.apu_id"
                  placeholder="Sin APU (manual)"
                ></aero-dropdown>
              </div>
              <div class="form-group">
                <label class="form-label">P.U. Manual</label>
                <input
                  data-testid="partida-form-precio"
                  type="number"
                  class="form-control"
                  [(ngModel)]="newPartida.precio_unitario"
                  step="0.01"
                  min="0"
                  placeholder="Auto desde APU"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Fase</label>
                <input
                  data-testid="partida-form-fase"
                  type="text"
                  class="form-control"
                  [(ngModel)]="newPartida.fase"
                  placeholder="Ej: 01 Obras Provisionales"
                />
              </div>
            </div>
            <div class="form-actions">
              <aero-button
                data-testid="partida-form-submit-btn"
                variant="primary"
                size="small"
                iconLeft="fa-plus"
                [disabled]="
                  saving ||
                  !newPartida.codigo ||
                  !newPartida.descripcion ||
                  !newPartida.unidad_medida
                "
                (clicked)="addPartida()"
              >
                {{ saving ? 'Agregando...' : 'Agregar Partida' }}
              </aero-button>
            </div>
          </div>
        </app-page-card>

        <!-- Grand total footer -->
        <app-page-card [noPadding]="false">
          <div class="grand-total" data-testid="presupuesto-grand-total">
            <span>TOTAL PRESUPUESTADO</span>
            <span class="grand-total-value" data-testid="presupuesto-grand-total-value"
              >S/ {{ presupuesto.total_presupuestado | number: '1.2-2' }}</span
            >
          </div>
        </app-page-card>
      }
    </app-page-layout>
  `,
  styles: [
    `
      .header-grid {
        display: flex;
        gap: var(--s-24);
        flex-wrap: wrap;
        align-items: center;
      }
      .header-field {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .field-label {
        font-size: 11px;
        font-weight: 500;
        color: var(--grey-500);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .field-value {
        font-size: 14px;
        font-weight: 500;
        color: var(--primary-900);
      }
      .code-badge {
        font-family: monospace;
        background: var(--grey-100);
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 12px;
      }
      .total-highlight {
        margin-left: auto;
      }
      .total-value {
        font-size: 20px;
        font-weight: 700;
        color: var(--primary-500);
      }

      .fase-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        padding: var(--s-4) 0;
        user-select: none;
      }
      .fase-title {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        font-weight: 600;
        font-size: 14px;
        color: var(--primary-900);
      }
      .fase-subtotal {
        font-family: monospace;
        font-weight: 600;
        font-size: 14px;
        color: var(--primary-500);
      }

      .partida-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        margin-top: var(--s-8);
      }
      .partida-table th {
        text-align: left;
        font-size: 11px;
        font-weight: 600;
        color: var(--grey-500);
        text-transform: uppercase;
        padding: 6px 8px;
        border-bottom: 1px solid var(--grey-200);
      }
      .partida-table td {
        padding: 8px;
        border-bottom: 1px solid var(--grey-100);
      }
      .col-code {
        width: 100px;
      }
      .col-sm {
        width: 60px;
      }
      .col-num {
        text-align: right;
        font-family: monospace;
        width: 110px;
      }
      .col-actions {
        width: 40px;
        text-align: center;
      }
      .cost-cell {
        font-weight: 600;
        color: var(--primary-900);
      }
      .apu-link {
        color: var(--primary-500);
        cursor: pointer;
        font-size: 11px;
        margin-left: 6px;
        text-decoration: none;
      }
      .apu-link:hover {
        text-decoration: underline;
      }

      .create-form,
      .add-partida-form {
        display: flex;
        flex-direction: column;
      }
      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--s-8);
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .form-label {
        font-size: 11px;
        font-weight: 500;
        color: var(--grey-600);
      }
      .form-control {
        padding: 6px 10px;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-md);
        font-size: 13px;
        background: white;
      }
      .form-control:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 2px rgba(0, 97, 170, 0.15);
      }
      textarea.form-control {
        resize: vertical;
      }
      .form-actions {
        display: flex;
        gap: 8px;
        margin-top: var(--s-16);
        justify-content: flex-end;
      }

      .grand-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 700;
        font-size: 16px;
        color: var(--primary-900);
      }
      .grand-total-value {
        font-family: monospace;
        font-size: 22px;
        color: var(--primary-500);
      }
    `,
  ],
})
export class PresupuestoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private presupuestoService = inject(PresupuestoService);
  private apuService = inject(ApuService);
  private projectService = inject(ProjectService);
  private snackBar = inject(MatSnackBar);
  private confirmSvc = inject(ConfirmService);

  presupuesto: PresupuestoDetail | null = null;
  loading = false;
  saving = false;
  isCreate = false;
  faseGroups: FaseGroup[] = [];
  apuDropdown: DropdownOption[] = [];
  projectOptions: DropdownOption[] = [];

  createData = {
    proyecto_id: null as number | null,
    codigo: '',
    nombre: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
  };

  newPartida = {
    codigo: '',
    descripcion: '',
    unidad_medida: '',
    metrado: 0,
    precio_unitario: 0,
    apu_id: null as number | null,
    fase: '',
  };

  breadcrumbs = [
    { label: 'Inicio', url: '/dashboard' },
    { label: 'Presupuestos', url: '/presupuestos' },
    { label: 'Detalle' },
  ];

  tabs = BUDGET_TABS;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isCreate = !id;

    if (this.isCreate) {
      this.loadProjects();
    } else {
      this.loadData(Number(id));
    }
    this.loadApus();
  }

  loadData(id: number): void {
    this.loading = true;
    this.presupuestoService.getById(id).subscribe({
      next: (data) => {
        this.presupuesto = data;
        this.buildFaseGroups();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error al cargar presupuesto', 'Cerrar', { duration: 3000 });
      },
    });
  }

  loadApus(): void {
    this.apuService.getDropdownOptions().subscribe({
      next: (items) => {
        this.apuDropdown = items.map((a) => ({
          label: `${a.codigo} — ${a.nombre} (S/ ${a.precio_unitario.toFixed(2)})`,
          value: a.id,
        }));
      },
    });
  }

  loadProjects(): void {
    this.projectService.getAllPaginated({ limit: 100 }).subscribe({
      next: (res) => {
        this.projectOptions = res.data.map((p: { id: number; codigo: string; nombre: string }) => ({
          label: `${p.codigo} — ${p.nombre}`,
          value: p.id,
        }));
      },
    });
  }

  buildFaseGroups(): void {
    if (!this.presupuesto) return;
    const map = new Map<string, PartidaItem[]>();
    for (const p of this.presupuesto.partidas) {
      const fase = p.fase || 'Sin Fase';
      if (!map.has(fase)) map.set(fase, []);
      map.get(fase)!.push(p);
    }
    this.faseGroups = Array.from(map.entries()).map(([fase, partidas]) => ({
      fase,
      partidas,
      subtotal: partidas.reduce((sum, p) => sum + p.parcial, 0),
      collapsed: false,
    }));
  }

  createPresupuesto(): void {
    if (
      !this.createData.proyecto_id ||
      !this.createData.codigo ||
      !this.createData.nombre ||
      !this.createData.fecha
    )
      return;
    this.saving = true;

    this.presupuestoService
      .create({
        proyecto_id: this.createData.proyecto_id,
        codigo: this.createData.codigo,
        nombre: this.createData.nombre,
        descripcion: this.createData.descripcion || undefined,
        fecha: this.createData.fecha,
      })
      .subscribe({
        next: (res) => {
          this.saving = false;
          this.snackBar.open('Presupuesto creado', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/presupuestos', res.id]);
        },
        error: () => {
          this.saving = false;
          this.snackBar.open('Error al crear presupuesto', 'Cerrar', { duration: 3000 });
        },
      });
  }

  addPartida(): void {
    if (
      !this.presupuesto ||
      !this.newPartida.codigo ||
      !this.newPartida.descripcion ||
      !this.newPartida.unidad_medida
    )
      return;
    this.saving = true;

    this.presupuestoService
      .addPartida(this.presupuesto.id, {
        codigo: this.newPartida.codigo,
        descripcion: this.newPartida.descripcion,
        unidad_medida: this.newPartida.unidad_medida,
        metrado: this.newPartida.metrado,
        precio_unitario: this.newPartida.precio_unitario,
        apu_id: this.newPartida.apu_id ?? undefined,
        fase: this.newPartida.fase || undefined,
      })
      .subscribe({
        next: (data) => {
          this.presupuesto = data;
          this.buildFaseGroups();
          this.saving = false;
          this.newPartida = {
            codigo: '',
            descripcion: '',
            unidad_medida: '',
            metrado: 0,
            precio_unitario: 0,
            apu_id: null,
            fase: this.newPartida.fase,
          };
          this.snackBar.open('Partida agregada', 'Cerrar', { duration: 2000 });
        },
        error: () => {
          this.saving = false;
          this.snackBar.open('Error al agregar partida', 'Cerrar', { duration: 3000 });
        },
      });
  }

  removePartida(partidaId: number): void {
    if (!this.presupuesto) return;
    this.confirmSvc.confirmDelete('esta partida').subscribe((confirmed) => {
      if (confirmed && this.presupuesto) {
        this.presupuestoService.removePartida(this.presupuesto.id, partidaId).subscribe({
          next: (data) => {
            this.presupuesto = data;
            this.buildFaseGroups();
            this.snackBar.open('Partida eliminada', 'Cerrar', { duration: 2000 });
          },
          error: () => {
            this.snackBar.open('Error al eliminar partida', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  recalculate(): void {
    if (!this.presupuesto) return;
    this.loading = true;
    this.presupuestoService.recalculate(this.presupuesto.id).subscribe({
      next: (data) => {
        this.presupuesto = data;
        this.buildFaseGroups();
        this.loading = false;
        this.snackBar.open('Presupuesto recalculado', 'Cerrar', { duration: 2000 });
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error al recalcular', 'Cerrar', { duration: 3000 });
      },
    });
  }

  navigateToApu(apuId: number): void {
    this.router.navigate(['/presupuestos/apus', apuId]);
  }

  estadoVariant(estado: string): string {
    switch (estado) {
      case 'BORRADOR':
        return 'neutral';
      case 'APROBADO':
        return 'info';
      case 'VIGENTE':
        return 'success';
      default:
        return 'neutral';
    }
  }
}
