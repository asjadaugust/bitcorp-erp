import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { ConfirmService } from '../../core/services/confirm.service';
import { ApuService, ApuListItem } from '../../core/services/apu.service';
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
  selector: 'app-apu-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    PageCardComponent,
    AeroButtonComponent,
    AeroInputComponent,
    FilterBarComponent,
  ],
  template: `
    <app-page-layout
      title="APU — Análisis de Precios Unitarios"
      icon="fa-calculator"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <div actions style="display:flex;gap:8px;align-items:center">
        <aero-button
          data-testid="apu-toggle-form-btn"
          variant="primary"
          iconLeft="fa-plus"
          (clicked)="toggleForm()"
        >
          {{ showForm ? 'Cancelar' : 'Nuevo APU' }}
        </aero-button>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      @if (showForm) {
        <app-page-card title="Nuevo APU" [noPadding]="false">
          <div class="inline-form" data-testid="apu-form">
            <div class="form-group">
              <label class="form-label">Código *</label>
              <input
                data-testid="apu-form-codigo"
                type="text"
                class="form-control"
                [(ngModel)]="formData.codigo"
                placeholder="Ej: APU-001"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Nombre *</label>
              <input
                data-testid="apu-form-nombre"
                type="text"
                class="form-control"
                [(ngModel)]="formData.nombre"
                placeholder="Nombre de la partida"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Unidad Medida *</label>
              <input
                data-testid="apu-form-unidad"
                type="text"
                class="form-control"
                [(ngModel)]="formData.unidad_medida"
                placeholder="Ej: m3, m2, und"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Rendimiento</label>
              <input
                data-testid="apu-form-rendimiento"
                type="number"
                class="form-control"
                [(ngModel)]="formData.rendimiento"
                placeholder="1.00"
                step="0.01"
                min="0.01"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Jornada (hrs)</label>
              <input
                data-testid="apu-form-jornada"
                type="number"
                class="form-control"
                [(ngModel)]="formData.jornada"
                placeholder="8.00"
                step="0.5"
                min="1"
              />
            </div>
            <div class="form-actions">
              <aero-button
                data-testid="apu-form-submit-btn"
                variant="primary"
                size="small"
                iconLeft="fa-check"
                [disabled]="
                  saving || !formData.codigo || !formData.nombre || !formData.unidad_medida
                "
                (clicked)="saveForm()"
              >
                {{ saving ? 'Guardando...' : 'Crear APU' }}
              </aero-button>
            </div>
          </div>
        </app-page-card>
      }

      <app-page-card [noPadding]="true">
        <aero-data-grid
          data-testid="apu-data-grid"
          [gridId]="'apu-master-list'"
          [columns]="columns"
          [data]="items"
          [loading]="loading"
          [dense]="true"
          [serverSide]="true"
          [totalItems]="total"
          [actionsTemplate]="actionsRef"
          [templates]="{ codigo: codigoRef, precio_unitario: precioRef }"
          emptyMessage="No hay APUs registrados"
          emptyIcon="fa-calculator"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
          (rowClick)="viewDetail($event)"
        ></aero-data-grid>

        <ng-template #codigoRef let-row>
          <span class="code-badge">{{ row.codigo }}</span>
        </ng-template>

        <ng-template #precioRef let-row>
          <span class="price-cell">{{ row.precio_unitario | number: '1.2-4' }}</span>
        </ng-template>

        <ng-template #actionsRef let-row>
          <div class="action-buttons" (click)="$event.stopPropagation()">
            <aero-button
              data-testid="apu-view-btn"
              variant="ghost"
              size="small"
              iconCenter="fa-eye"
              title="Ver detalle"
              (clicked)="viewDetail(row)"
            ></aero-button>
            <aero-button
              data-testid="apu-duplicate-btn"
              variant="ghost"
              size="small"
              iconCenter="fa-copy"
              title="Duplicar"
              (clicked)="duplicateApu(row)"
            ></aero-button>
            <aero-button
              data-testid="apu-delete-btn"
              variant="ghost"
              size="small"
              iconCenter="fa-trash"
              title="Eliminar"
              (clicked)="deleteItem(row)"
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
        color: var(--primary-900);
      }
      .action-buttons {
        display: flex;
        gap: var(--s-4);
        align-items: center;
      }
    `,
  ],
})
export class ApuListComponent implements OnInit {
  private apuService = inject(ApuService);
  private snackBar = inject(MatSnackBar);
  private confirmSvc = inject(ConfirmService);
  private router = inject(Router);

  items: ApuListItem[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  loading = false;
  saving = false;
  showForm = false;
  filters = { search: '' };

  formData = {
    codigo: '',
    nombre: '',
    unidad_medida: '',
    rendimiento: 1,
    jornada: 8,
  };

  breadcrumbs = [
    { label: 'Inicio', url: '/dashboard' },
    { label: 'Presupuestos', url: '/presupuestos' },
    { label: 'APUs' },
  ];

  tabs = BUDGET_TABS;

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Buscar por código o nombre...' },
  ];

  columns: DataGridColumn[] = [
    { key: 'codigo', label: 'Código', type: 'template', width: '120px', sortable: true },
    { key: 'nombre', label: 'Nombre', type: 'text', sortable: true },
    { key: 'unidad_medida', label: 'U.M.', type: 'text', width: '80px' },
    { key: 'rendimiento', label: 'Rendimiento', type: 'number', width: '120px' },
    {
      key: 'precio_unitario',
      label: 'P.U. (S/)',
      type: 'template',
      width: '130px',
      sortable: true,
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.apuService
      .getAllPaginated({
        page: this.page,
        limit: this.pageSize,
        search: this.filters.search || undefined,
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
    this.page = 1;
    this.loadData();
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  viewDetail(row: ApuListItem): void {
    this.router.navigate(['/presupuestos/apus', row.id]);
  }

  saveForm(): void {
    if (!this.formData.codigo || !this.formData.nombre || !this.formData.unidad_medida) return;
    this.saving = true;

    this.apuService.create(this.formData).subscribe({
      next: (res) => {
        this.saving = false;
        this.showForm = false;
        this.resetForm();
        this.snackBar.open('APU creado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/presupuestos/apus', res.id]);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Error al crear APU', 'Cerrar', { duration: 3000 });
      },
    });
  }

  duplicateApu(row: ApuListItem): void {
    this.apuService.duplicate(row.id).subscribe({
      next: (res) => {
        this.snackBar.open('APU duplicado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/presupuestos/apus', res.id]);
      },
      error: () => {
        this.snackBar.open('Error al duplicar APU', 'Cerrar', { duration: 3000 });
      },
    });
  }

  deleteItem(row: ApuListItem): void {
    this.confirmSvc.confirmDelete(`el APU "${row.nombre}"`).subscribe((confirmed) => {
      if (confirmed) {
        this.loading = true;
        this.apuService.delete(row.id).subscribe({
          next: () => {
            this.snackBar.open('APU eliminado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => {
            this.loading = false;
            this.snackBar.open('Error al eliminar APU', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  private resetForm(): void {
    this.formData = { codigo: '', nombre: '', unidad_medida: '', rendimiento: 1, jornada: 8 };
  }
}
