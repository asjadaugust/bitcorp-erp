import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import {
  PageLayoutComponent,
  TabItem,
} from '../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { AeroButtonComponent, AeroInputComponent } from '../../core/design-system';
import {
  AeroDropdownComponent,
  DropdownOption,
} from '../../core/design-system/dropdown/aero-dropdown.component';
import { ConfirmService } from '../../core/services/confirm.service';
import { InsumoService, InsumoListItem } from '../../core/services/insumo.service';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';

const BUDGET_TABS: TabItem[] = [
  { label: 'Insumos', route: '/presupuestos/insumos', icon: 'fa-boxes-stacked' },
  { label: 'APUs', route: '/presupuestos/apus', icon: 'fa-calculator' },
  { label: 'Presupuestos', route: '/presupuestos', icon: 'fa-file-invoice-dollar' },
];

@Component({
  selector: 'app-insumo-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    PageCardComponent,
    AeroButtonComponent,
    AeroInputComponent,
    AeroDropdownComponent,
    FilterBarComponent,
  ],
  template: `
    <app-page-layout
      title="Insumos — Recursos Maestros"
      icon="fa-boxes-stacked"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <div actions style="display:flex;gap:8px;align-items:center">
        <aero-button
          data-testid="insumo-toggle-form-btn"
          variant="primary"
          iconLeft="fa-plus"
          (clicked)="toggleForm()"
        >
          {{ showForm ? 'Cancelar' : 'Nuevo Insumo' }}
        </aero-button>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      @if (showForm) {
        <app-page-card [title]="editingId ? 'Editar Insumo' : 'Nuevo Insumo'" [noPadding]="false">
          <div class="inline-form" data-testid="insumo-form">
            <div class="form-group">
              <label class="form-label">Código *</label>
              <input
                data-testid="insumo-form-codigo"
                type="text"
                class="form-control"
                [(ngModel)]="formData.codigo"
                placeholder="Ej: MO-001"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Nombre *</label>
              <input
                data-testid="insumo-form-nombre"
                type="text"
                class="form-control"
                [(ngModel)]="formData.nombre"
                placeholder="Nombre del insumo"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Tipo *</label>
              <aero-dropdown
                data-testid="insumo-form-tipo"
                [options]="tipoOptions"
                [(ngModel)]="formData.tipo"
                placeholder="Tipo"
              ></aero-dropdown>
            </div>
            <div class="form-group">
              <label class="form-label">Unidad Medida *</label>
              <input
                data-testid="insumo-form-unidad"
                type="text"
                class="form-control"
                [(ngModel)]="formData.unidad_medida"
                placeholder="Ej: hh, m3, kg"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Precio Unitario</label>
              <input
                data-testid="insumo-form-precio"
                type="number"
                class="form-control"
                [(ngModel)]="formData.precio_unitario"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div class="form-actions">
              <aero-button
                data-testid="insumo-form-submit-btn"
                variant="primary"
                size="small"
                iconLeft="fa-check"
                [disabled]="
                  saving ||
                  !formData.codigo ||
                  !formData.nombre ||
                  !formData.tipo ||
                  !formData.unidad_medida
                "
                (clicked)="saveForm()"
              >
                {{ saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Agregar' }}
              </aero-button>
              @if (editingId) {
                <aero-button
                  data-testid="insumo-form-cancel-edit-btn"
                  variant="secondary"
                  size="small"
                  (clicked)="cancelEdit()"
                  >Cancelar Edición</aero-button
                >
              }
            </div>
          </div>
        </app-page-card>
      }

      <app-page-card [noPadding]="true">
        <aero-data-grid
          data-testid="insumo-data-grid"
          [gridId]="'insumo-master-list'"
          [columns]="columns"
          [data]="items"
          [loading]="loading"
          [dense]="true"
          [serverSide]="true"
          [totalItems]="total"
          [actionsTemplate]="actionsRef"
          [templates]="{ codigo: codigoRef, precio_unitario: precioRef }"
          emptyMessage="No hay insumos registrados"
          emptyIcon="fa-boxes-stacked"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        ></aero-data-grid>

        <ng-template #codigoRef let-row>
          <span class="code-badge">{{ row.codigo }}</span>
        </ng-template>

        <ng-template #precioRef let-row>
          <span class="price-cell">{{ row.precio_unitario | number: '1.2-4' }}</span>
        </ng-template>

        <ng-template #actionsRef let-row>
          <div class="action-buttons">
            <aero-button
              data-testid="insumo-edit-btn"
              variant="ghost"
              size="small"
              iconCenter="fa-pen"
              title="Editar"
              (clicked)="startEdit(row); $event.stopPropagation()"
            ></aero-button>
            <aero-button
              data-testid="insumo-delete-btn"
              variant="ghost"
              size="small"
              iconCenter="fa-trash"
              title="Eliminar"
              (clicked)="deleteItem(row); $event.stopPropagation()"
            ></aero-button>
          </div>
        </ng-template>
      </app-page-card>
    </app-page-layout>
  `,
  styles: [
    `
      .inline-form {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--s-16);
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .form-label {
        font-size: 12px;
        font-weight: 500;
        color: var(--grey-700);
      }
      .form-control {
        padding: 8px 12px;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-md);
        font-size: 14px;
        background: white;
      }
      .form-control:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 2px rgba(0, 97, 170, 0.15);
      }
      .form-actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      .code-badge {
        font-family: monospace;
        background: var(--grey-100);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        color: var(--grey-700);
        font-weight: 600;
      }
      .price-cell {
        font-family: monospace;
        font-weight: 500;
      }
      .action-buttons {
        display: flex;
        gap: var(--s-4);
        align-items: center;
      }
    `,
  ],
})
export class InsumoListComponent implements OnInit {
  private insumoService = inject(InsumoService);
  private snackBar = inject(MatSnackBar);
  private confirmSvc = inject(ConfirmService);

  items: InsumoListItem[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  loading = false;
  saving = false;
  showForm = false;
  editingId: number | null = null;
  filters = { search: '', tipo: '' };

  formData = {
    codigo: '',
    nombre: '',
    tipo: '',
    unidad_medida: '',
    precio_unitario: 0,
  };

  breadcrumbs = [
    { label: 'Inicio', url: '/dashboard' },
    { label: 'Presupuestos', url: '/presupuestos' },
    { label: 'Insumos' },
  ];

  tabs = BUDGET_TABS;

  tipoOptions: DropdownOption[] = [
    { label: 'Mano de Obra', value: 'MANO_OBRA' },
    { label: 'Material', value: 'MATERIAL' },
    { label: 'Equipo', value: 'EQUIPO' },
    { label: 'Subcontrato', value: 'SUBCONTRATO' },
  ];

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Buscar por código o nombre...' },
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'select',
      options: [
        { label: 'Mano de Obra', value: 'MANO_OBRA' },
        { label: 'Material', value: 'MATERIAL' },
        { label: 'Equipo', value: 'EQUIPO' },
        { label: 'Subcontrato', value: 'SUBCONTRATO' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'codigo', label: 'Código', type: 'template', width: '120px', sortable: true },
    { key: 'nombre', label: 'Nombre', type: 'text', sortable: true },
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'badge',
      width: '140px',
      badgeConfig: {
        MANO_OBRA: {
          label: 'Mano de Obra',
          class: 'status-badge status-active',
          icon: 'fa-person-digging',
        },
        MATERIAL: { label: 'Material', class: 'status-badge status-info', icon: 'fa-cubes' },
        EQUIPO: { label: 'Equipo', class: 'status-badge status-on-hold', icon: 'fa-tractor' },
        SUBCONTRATO: {
          label: 'Subcontrato',
          class: 'status-badge status-completed',
          icon: 'fa-handshake',
        },
      },
    },
    { key: 'unidad_medida', label: 'U.M.', type: 'text', width: '80px' },
    {
      key: 'precio_unitario',
      label: 'Precio Unit.',
      type: 'template',
      width: '120px',
      sortable: true,
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.insumoService
      .getAllPaginated({
        page: this.page,
        limit: this.pageSize,
        search: this.filters.search || undefined,
        tipo: this.filters.tipo || undefined,
      })
      .subscribe({
        next: (res) => {
          this.items = res.data;
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadData();
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.tipo = (filters['tipo'] as string) || '';
    this.page = 1;
    this.loadData();
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  startEdit(row: InsumoListItem): void {
    this.editingId = row.id;
    this.formData = {
      codigo: row.codigo,
      nombre: row.nombre,
      tipo: row.tipo,
      unidad_medida: row.unidad_medida,
      precio_unitario: row.precio_unitario,
    };
    this.showForm = true;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.resetForm();
  }

  saveForm(): void {
    if (
      !this.formData.codigo ||
      !this.formData.nombre ||
      !this.formData.tipo ||
      !this.formData.unidad_medida
    )
      return;
    this.saving = true;

    if (this.editingId) {
      this.insumoService
        .update(this.editingId, {
          nombre: this.formData.nombre,
          tipo: this.formData.tipo,
          unidad_medida: this.formData.unidad_medida,
          precio_unitario: this.formData.precio_unitario,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.showForm = false;
            this.editingId = null;
            this.resetForm();
            this.snackBar.open('Insumo actualizado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => {
            this.saving = false;
            this.snackBar.open('Error al actualizar insumo', 'Cerrar', { duration: 3000 });
          },
        });
    } else {
      this.insumoService.create(this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.showForm = false;
          this.resetForm();
          this.snackBar.open('Insumo creado', 'Cerrar', { duration: 3000 });
          this.loadData();
        },
        error: () => {
          this.saving = false;
          this.snackBar.open('Error al crear insumo', 'Cerrar', { duration: 3000 });
        },
      });
    }
  }

  deleteItem(row: InsumoListItem): void {
    this.confirmSvc.confirmDelete(`el insumo "${row.nombre}"`).subscribe((confirmed) => {
      if (confirmed) {
        this.loading = true;
        this.insumoService.delete(row.id).subscribe({
          next: () => {
            this.snackBar.open('Insumo eliminado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => {
            this.loading = false;
            this.snackBar.open('Error al eliminar insumo', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  private resetForm(): void {
    this.editingId = null;
    this.formData = { codigo: '', nombre: '', tipo: '', unidad_medida: '', precio_unitario: 0 };
  }
}
