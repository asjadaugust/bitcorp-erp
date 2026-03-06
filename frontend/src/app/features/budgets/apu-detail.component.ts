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
import { ApuService, ApuDetail, ApuInsumoLine } from '../../core/services/apu.service';
import { InsumoService, InsumoDropdownItem } from '../../core/services/insumo.service';

const BUDGET_TABS: TabItem[] = [
  { label: 'Insumos', route: '/presupuestos/insumos', icon: 'fa-boxes-stacked' },
  { label: 'APUs', route: '/presupuestos/apus', icon: 'fa-calculator' },
  { label: 'Presupuestos', route: '/presupuestos', icon: 'fa-file-invoice-dollar' },
];

interface InsumoGroup {
  key: string;
  label: string;
  icon: string;
  lines: ApuInsumoLine[];
  total: number;
}

@Component({
  selector: 'app-apu-detail',
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
      [title]="apu ? apu.codigo + ' — ' + apu.nombre : 'Cargando APU...'"
      icon="fa-calculator"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
      backUrl="/presupuestos/apus"
    >
      <div actions style="display:flex;gap:8px;align-items:center">
        <aero-button
          data-testid="apu-detail-duplicate-btn"
          variant="secondary"
          iconLeft="fa-copy"
          size="small"
          (clicked)="duplicateApu()"
          >Duplicar</aero-button
        >
        <aero-button
          data-testid="apu-detail-recalculate-btn"
          variant="secondary"
          iconLeft="fa-rotate"
          size="small"
          (clicked)="loadData()"
          >Recalcular</aero-button
        >
      </div>

      @if (apu) {
        <!-- Header info -->
        <app-page-card [noPadding]="false">
          <div class="header-grid" data-testid="apu-detail-header">
            <div class="header-field">
              <span class="field-label">Código</span>
              <span class="field-value code-badge" data-testid="apu-detail-codigo">{{
                apu.codigo
              }}</span>
            </div>
            <div class="header-field">
              <span class="field-label">Unidad</span>
              <span class="field-value">{{ apu.unidad_medida }}</span>
            </div>
            <div class="header-field">
              <span class="field-label">Rendimiento</span>
              <span class="field-value">{{ apu.rendimiento }} {{ apu.unidad_medida }}/día</span>
            </div>
            <div class="header-field">
              <span class="field-label">Jornada</span>
              <span class="field-value">{{ apu.jornada }} hrs</span>
            </div>
            <div class="header-field pu-highlight">
              <span class="field-label">Precio Unitario</span>
              <span class="field-value pu-value" data-testid="apu-detail-precio-unitario"
                >S/ {{ apu.precio_unitario | number: '1.2-4' }}</span
              >
            </div>
          </div>
        </app-page-card>

        <!-- Cost breakdown sidebar -->
        <div class="detail-layout">
          <div class="detail-main">
            <!-- Grouped insumo sections -->
            @for (group of groups; track group.key) {
              <app-page-card [noPadding]="false">
                <div class="section-header" [attr.data-testid]="'apu-group-header-' + group.key">
                  <div class="section-title">
                    <i class="fa-solid {{ group.icon }}"></i>
                    <span>{{ group.label }}</span>
                    <aero-badge
                      [text]="group.lines.length.toString()"
                      variant="neutral"
                    ></aero-badge>
                  </div>
                  <div class="section-total">S/ {{ group.total | number: '1.2-4' }}</div>
                </div>

                @if (group.lines.length > 0) {
                  <table class="insumo-table" [attr.data-testid]="'apu-insumo-table-' + group.key">
                    <thead>
                      <tr>
                        <th class="col-nombre">Recurso</th>
                        <th class="col-num">Cantidad</th>
                        @if (group.key === 'HERRAMIENTAS') {
                          <th class="col-num">%</th>
                        } @else if (group.key === 'MATERIAL' || group.key === 'SUBCONTRATO') {
                          <th class="col-num">Aporte</th>
                        }
                        <th class="col-num">Precio</th>
                        <th class="col-num">Costo</th>
                        <th class="col-actions"></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (line of group.lines; track line.id) {
                        <tr>
                          <td class="col-nombre">
                            @if (line.sub_apu_id) {
                              <a class="sub-apu-link" (click)="navigateToSubApu(line.sub_apu_id!)">
                                <i class="fa-solid fa-link"></i>
                                {{ line.sub_apu_nombre }}
                              </a>
                            } @else {
                              {{ line.insumo_nombre || '—' }}
                              @if (line.insumo_unidad) {
                                <span class="unit-hint">({{ line.insumo_unidad }})</span>
                              }
                            }
                          </td>
                          <td class="col-num">{{ line.cantidad | number: '1.2-4' }}</td>
                          @if (group.key === 'HERRAMIENTAS') {
                            <td class="col-num">{{ line.porcentaje ?? 0 }}%</td>
                          } @else if (group.key === 'MATERIAL' || group.key === 'SUBCONTRATO') {
                            <td class="col-num">{{ line.aporte | number: '1.4-6' }}</td>
                          }
                          <td class="col-num">{{ line.precio | number: '1.2-4' }}</td>
                          <td class="col-num cost-cell">{{ line.costo | number: '1.2-4' }}</td>
                          <td class="col-actions">
                            <aero-button
                              data-testid="apu-remove-line-btn"
                              variant="ghost"
                              size="small"
                              iconCenter="fa-trash"
                              (clicked)="removeLine(line.id)"
                            ></aero-button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                } @else {
                  <p class="empty-msg">Sin recursos en este grupo</p>
                }

                <!-- Add insumo form -->
                @if (addingToGroup === group.key) {
                  <div class="add-line-form" [attr.data-testid]="'apu-add-line-form-' + group.key">
                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label">Insumo</label>
                        <aero-dropdown
                          data-testid="apu-add-line-insumo"
                          [options]="insumoDropdown"
                          [(ngModel)]="newLine.insumo_id"
                          placeholder="Seleccionar insumo"
                        ></aero-dropdown>
                      </div>
                      <div class="form-group">
                        <label class="form-label">Cantidad</label>
                        <input
                          data-testid="apu-add-line-cantidad"
                          type="number"
                          class="form-control"
                          [(ngModel)]="newLine.cantidad"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      @if (group.key === 'MATERIAL' || group.key === 'SUBCONTRATO') {
                        <div class="form-group">
                          <label class="form-label">Aporte</label>
                          <input
                            type="number"
                            class="form-control"
                            [(ngModel)]="newLine.aporte"
                            step="0.0001"
                            min="0"
                          />
                        </div>
                      }
                      @if (group.key === 'HERRAMIENTAS') {
                        <div class="form-group">
                          <label class="form-label">Porcentaje</label>
                          <input
                            type="number"
                            class="form-control"
                            [(ngModel)]="newLine.porcentaje"
                            step="0.5"
                            min="0"
                            max="100"
                          />
                        </div>
                      }
                      <div class="form-group">
                        <label class="form-label">Precio (override)</label>
                        <input
                          type="number"
                          class="form-control"
                          [(ngModel)]="newLine.precio"
                          step="0.01"
                          min="0"
                          placeholder="Auto"
                        />
                      </div>
                    </div>
                    <div class="form-actions">
                      <aero-button
                        data-testid="apu-add-line-submit-btn"
                        variant="primary"
                        size="small"
                        iconLeft="fa-check"
                        [disabled]="saving"
                        (clicked)="addLine(group.key)"
                        >Agregar</aero-button
                      >
                      <aero-button
                        data-testid="apu-add-line-cancel-btn"
                        variant="tertiary"
                        size="small"
                        (clicked)="addingToGroup = null"
                        >Cancelar</aero-button
                      >
                    </div>
                  </div>
                } @else {
                  <div class="add-btn-row">
                    <aero-button
                      [attr.data-testid]="'apu-start-add-line-' + group.key"
                      variant="tertiary"
                      size="small"
                      iconLeft="fa-plus"
                      (clicked)="startAddLine(group.key)"
                    >
                      Agregar {{ group.label }}
                    </aero-button>
                  </div>
                }
              </app-page-card>
            }
          </div>

          <!-- Cost summary sidebar -->
          <div class="detail-sidebar">
            <app-page-card title="Resumen de Costos" [noPadding]="false">
              <div class="cost-summary" data-testid="apu-cost-summary">
                @for (group of groups; track group.key) {
                  <div class="cost-row">
                    <span class="cost-label">
                      <i class="fa-solid {{ group.icon }}"></i>
                      {{ group.label }}
                    </span>
                    <span class="cost-value">{{ group.total | number: '1.2-4' }}</span>
                  </div>
                }
                <div class="cost-divider"></div>
                <div class="cost-row cost-total">
                  <span class="cost-label">Precio Unitario</span>
                  <span class="cost-value">S/ {{ apu.precio_unitario | number: '1.2-4' }}</span>
                </div>
              </div>
            </app-page-card>
          </div>
        </div>
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
      }
      .pu-highlight {
        margin-left: auto;
      }
      .pu-value {
        font-size: 18px;
        font-weight: 700;
        color: var(--primary-500);
      }

      .detail-layout {
        display: grid;
        grid-template-columns: 1fr 280px;
        gap: var(--s-16);
        align-items: start;
      }
      .detail-main {
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-8);
      }
      .section-title {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        font-weight: 600;
        font-size: 14px;
        color: var(--primary-900);
      }
      .section-total {
        font-family: monospace;
        font-weight: 600;
        font-size: 14px;
        color: var(--primary-500);
      }

      .insumo-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .insumo-table th {
        text-align: left;
        font-size: 11px;
        font-weight: 600;
        color: var(--grey-500);
        text-transform: uppercase;
        padding: 6px 8px;
        border-bottom: 1px solid var(--grey-200);
      }
      .insumo-table td {
        padding: 8px;
        border-bottom: 1px solid var(--grey-100);
      }
      .col-nombre {
        min-width: 200px;
      }
      .col-num {
        text-align: right;
        font-family: monospace;
        width: 100px;
      }
      .col-actions {
        width: 40px;
        text-align: center;
      }
      .cost-cell {
        font-weight: 600;
        color: var(--primary-900);
      }
      .sub-apu-link {
        color: var(--primary-500);
        cursor: pointer;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .sub-apu-link:hover {
        text-decoration: underline;
      }
      .unit-hint {
        font-size: 11px;
        color: var(--grey-400);
        margin-left: 4px;
      }
      .empty-msg {
        color: var(--grey-400);
        font-size: 13px;
        text-align: center;
        padding: var(--s-16) 0;
      }

      .add-btn-row {
        display: flex;
        justify-content: flex-start;
        margin-top: var(--s-8);
      }
      .add-line-form {
        margin-top: var(--s-8);
        padding: var(--s-16);
        background: var(--grey-50);
        border-radius: var(--radius-md);
      }
      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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
      .form-actions {
        display: flex;
        gap: 8px;
        margin-top: var(--s-8);
        justify-content: flex-end;
      }

      .cost-summary {
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
      }
      .cost-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
      }
      .cost-label {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        color: var(--grey-700);
      }
      .cost-value {
        font-family: monospace;
        font-weight: 500;
      }
      .cost-divider {
        height: 1px;
        background: var(--grey-200);
        margin: var(--s-4) 0;
      }
      .cost-total {
        font-weight: 700;
        font-size: 15px;
      }
      .cost-total .cost-value {
        color: var(--primary-500);
      }

      @media (max-width: 960px) {
        .detail-layout {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ApuDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apuService = inject(ApuService);
  private insumoService = inject(InsumoService);
  private snackBar = inject(MatSnackBar);
  private confirmSvc = inject(ConfirmService);

  apu: ApuDetail | null = null;
  loading = false;
  saving = false;
  addingToGroup: string | null = null;
  insumoDropdown: DropdownOption[] = [];

  groups: InsumoGroup[] = [];

  newLine = {
    insumo_id: null as number | null,
    cantidad: 1,
    precio: null as number | null,
    aporte: null as number | null,
    porcentaje: null as number | null,
  };

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Presupuestos', url: '/presupuestos' },
    { label: 'APUs', url: '/presupuestos/apus' },
    { label: 'Detalle' },
  ];

  tabs = BUDGET_TABS;

  ngOnInit(): void {
    this.loadData();
    this.loadInsumos();
  }

  loadData(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;
    this.loading = true;
    this.apuService.getById(id).subscribe({
      next: (data) => {
        this.apu = data;
        this.buildGroups();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error al cargar APU', 'Cerrar', { duration: 3000 });
      },
    });
  }

  loadInsumos(): void {
    this.insumoService.getDropdownOptions().subscribe({
      next: (items) => {
        this.insumoDropdown = items.map((i) => ({
          label: `${i.codigo} — ${i.nombre} (${i.tipo})`,
          value: i.id,
        }));
      },
    });
  }

  buildGroups(): void {
    if (!this.apu) return;
    this.groups = [
      {
        key: 'MANO_OBRA',
        label: 'Mano de Obra',
        icon: 'fa-person-digging',
        lines: this.apu.mano_obra,
        total: this.apu.total_mano_obra,
      },
      {
        key: 'MATERIAL',
        label: 'Materiales',
        icon: 'fa-cubes',
        lines: this.apu.materiales,
        total: this.apu.total_materiales,
      },
      {
        key: 'EQUIPO',
        label: 'Equipos',
        icon: 'fa-tractor',
        lines: this.apu.equipos,
        total: this.apu.total_equipos,
      },
      {
        key: 'HERRAMIENTAS',
        label: 'Herramientas',
        icon: 'fa-wrench',
        lines: this.apu.herramientas,
        total: this.apu.total_herramientas,
      },
      {
        key: 'SUBCONTRATO',
        label: 'Subcontratos',
        icon: 'fa-handshake',
        lines: this.apu.subcontratos,
        total: this.apu.total_subcontratos,
      },
    ];
  }

  startAddLine(groupKey: string): void {
    this.addingToGroup = groupKey;
    this.newLine = { insumo_id: null, cantidad: 1, precio: null, aporte: null, porcentaje: null };
    if (groupKey === 'HERRAMIENTAS') {
      this.newLine.porcentaje = 3;
    }
  }

  addLine(tipo: string): void {
    if (!this.apu || !this.newLine.insumo_id) return;
    this.saving = true;

    const payload: Record<string, unknown> = {
      insumo_id: this.newLine.insumo_id,
      tipo,
      cantidad: this.newLine.cantidad,
      es_porcentaje: tipo === 'HERRAMIENTAS',
    };
    if (this.newLine.precio != null) payload['precio'] = this.newLine.precio;
    if (this.newLine.aporte != null) payload['aporte'] = this.newLine.aporte;
    if (this.newLine.porcentaje != null) payload['porcentaje'] = this.newLine.porcentaje;

    this.apuService
      .addInsumo(this.apu.id, payload as Parameters<ApuService['addInsumo']>[1])
      .subscribe({
        next: (data) => {
          this.apu = data;
          this.buildGroups();
          this.saving = false;
          this.addingToGroup = null;
          this.snackBar.open('Insumo agregado', 'Cerrar', { duration: 2000 });
        },
        error: () => {
          this.saving = false;
          this.snackBar.open('Error al agregar insumo', 'Cerrar', { duration: 3000 });
        },
      });
  }

  removeLine(lineId: number): void {
    if (!this.apu) return;
    this.confirmSvc.confirmDelete('esta línea').subscribe((confirmed) => {
      if (confirmed && this.apu) {
        this.apuService.removeInsumo(this.apu.id, lineId).subscribe({
          next: (data) => {
            this.apu = data;
            this.buildGroups();
            this.snackBar.open('Línea eliminada', 'Cerrar', { duration: 2000 });
          },
          error: () => {
            this.snackBar.open('Error al eliminar línea', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  navigateToSubApu(subApuId: number): void {
    this.router.navigate(['/presupuestos/apus', subApuId]);
  }

  duplicateApu(): void {
    if (!this.apu) return;
    this.apuService.duplicate(this.apu.id).subscribe({
      next: (res) => {
        this.snackBar.open('APU duplicado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/presupuestos/apus', res.id]);
      },
      error: () => {
        this.snackBar.open('Error al duplicar APU', 'Cerrar', { duration: 3000 });
      },
    });
  }
}
