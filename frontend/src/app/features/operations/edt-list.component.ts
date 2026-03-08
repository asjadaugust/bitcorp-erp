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
import { EdtService, EdtListItem } from '../../core/services/edt.service';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';

@Component({
  selector: 'app-edt-list',
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
      title="EDT — Estructura de Desglose de Trabajo"
      icon="fa-sitemap"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <div actions style="display:flex;gap:8px;align-items:center">
        <aero-button variant="primary" iconLeft="fa-plus" size="small" (clicked)="toggleForm()">
          {{ showForm ? 'Cancelar' : 'Agregar EDT' }}
        </aero-button>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      @if (showForm) {
        <app-page-card title="Nuevo EDT" [noPadding]="false">
          <div class="inline-form">
            <div class="form-group">
              <label class="form-label">Código *</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="formData.codigo"
                placeholder="Ej: 01.01"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Código Alfanumérico</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="formData.codigo_alfanumerico"
                placeholder="Ej: RA.12"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Nombre *</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="formData.nombre"
                placeholder="Nombre del EDT"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Unidad Medida</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="formData.unidad_medida"
                placeholder="Ej: m3, ton"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Estado</label>
              <aero-dropdown
                [options]="estadoOptions"
                [(ngModel)]="formData.estado"
                placeholder="Estado"
              ></aero-dropdown>
            </div>
            <div class="form-actions">
              <aero-button
                variant="primary"
                size="small"
                iconLeft="fa-check"
                [disabled]="saving || !formData.codigo || !formData.nombre"
                (clicked)="saveForm()"
              >
                {{ saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Agregar' }}
              </aero-button>
              @if (editingId) {
                <aero-button variant="secondary" size="small" (clicked)="cancelEdit()">
                  Cancelar Edición
                </aero-button>
              }
            </div>
          </div>
        </app-page-card>
      }

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'edt-master-list'"
          [columns]="columns"
          [data]="items"
          [loading]="loading"
          [dense]="true"
          [serverSide]="true"
          [totalItems]="total"
          [actionsTemplate]="actionsRef"
          [templates]="{ codigo: codigoRef }"
          emptyMessage="No hay registros EDT"
          emptyIcon="fa-sitemap"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        ></aero-data-grid>

        <ng-template #codigoRef let-row>
          <span class="code-badge">{{ row.codigo }}</span>
        </ng-template>

        <ng-template #actionsRef let-row>
          <div class="action-buttons">
            <aero-button
              variant="ghost"
              size="small"
              iconCenter="fa-pen"
              title="Editar"
              (clicked)="startEdit(row); $event.stopPropagation()"
            ></aero-button>
            <aero-button
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
      .action-buttons {
        display: flex;
        gap: 4px;
        justify-content: center;
      }
    `,
  ],
})
export class EdtListComponent implements OnInit {
  private edtService = inject(EdtService);
  private snackBar = inject(MatSnackBar);
  private confirmSvc = inject(ConfirmService);

  items: EdtListItem[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  loading = false;
  saving = false;
  showForm = false;
  editingId: number | null = null;
  filters = { search: '' };

  formData = {
    codigo: '',
    codigo_alfanumerico: '',
    nombre: '',
    unidad_medida: '',
    estado: 'PLANIFICACION',
  };

  breadcrumbs = [
    { label: 'Inicio', url: '/dashboard' },
    { label: 'Operaciones', url: '/operaciones' },
    { label: 'EDT' },
  ];

  tabs: TabItem[] = [
    { label: 'Proyectos', route: '/operaciones/projects', icon: 'fa-folder-open' },
    { label: 'EDT', route: '/operaciones/edt', icon: 'fa-sitemap' },
    { label: 'Programación', route: '/operaciones/scheduling', icon: 'fa-calendar-days' },
    { label: 'Planillas', route: '/operaciones/timesheets', icon: 'fa-clipboard-user' },
  ];

  estadoOptions: DropdownOption[] = [
    { label: 'Planificación', value: 'PLANIFICACION' },
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Pausado', value: 'PAUSADO' },
    { label: 'Completado', value: 'COMPLETADO' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por código o nombre...',
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'codigo', label: 'Código', type: 'template', width: '100px', sortable: true },
    { key: 'codigo_alfanumerico', label: 'Cod. Alfanumérico', type: 'text', width: '140px' },
    { key: 'nombre', label: 'Nombre', type: 'text', sortable: true },
    { key: 'unidad_medida', label: 'U.M.', type: 'text', width: '80px' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      width: '130px',
      badgeConfig: {
        PLANIFICACION: {
          label: 'Planificación',
          class: 'status-badge status-on-hold',
          icon: 'fa-compass-drafting',
        },
        ACTIVO: { label: 'Activo', class: 'status-badge status-active', icon: 'fa-play' },
        PAUSADO: { label: 'Pausado', class: 'status-badge status-on-hold', icon: 'fa-pause' },
        COMPLETADO: {
          label: 'Completado',
          class: 'status-badge status-completed',
          icon: 'fa-check-circle',
        },
      },
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.edtService
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
    if (!this.showForm) {
      this.resetForm();
    }
  }

  startEdit(row: EdtListItem): void {
    this.editingId = row.id;
    this.formData = {
      codigo: row.codigo,
      codigo_alfanumerico: row.codigo_alfanumerico || '',
      nombre: row.nombre,
      unidad_medida: row.unidad_medida || '',
      estado: row.estado,
    };
    this.showForm = true;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.resetForm();
  }

  saveForm(): void {
    if (!this.formData.codigo || !this.formData.nombre) return;
    this.saving = true;

    if (this.editingId) {
      this.edtService
        .update(this.editingId, {
          nombre: this.formData.nombre,
          codigo_alfanumerico: this.formData.codigo_alfanumerico || undefined,
          unidad_medida: this.formData.unidad_medida || undefined,
          estado: this.formData.estado,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.showForm = false;
            this.editingId = null;
            this.resetForm();
            this.snackBar.open('EDT actualizado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => {
            this.saving = false;
            this.snackBar.open('Error al actualizar EDT', 'Cerrar', { duration: 3000 });
          },
        });
    } else {
      this.edtService.create(this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.showForm = false;
          this.resetForm();
          this.snackBar.open('EDT creado', 'Cerrar', { duration: 3000 });
          this.loadData();
        },
        error: () => {
          this.saving = false;
          this.snackBar.open('Error al crear EDT', 'Cerrar', { duration: 3000 });
        },
      });
    }
  }

  deleteItem(row: EdtListItem): void {
    this.confirmSvc.confirmDelete(`el EDT "${row.nombre}"`).subscribe((confirmed) => {
      if (confirmed) {
        this.loading = true;
        this.edtService.delete(row.id).subscribe({
          next: () => {
            this.snackBar.open('EDT eliminado', 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: () => {
            this.loading = false;
            this.snackBar.open('Error al eliminar EDT', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  private resetForm(): void {
    this.editingId = null;
    this.formData = {
      codigo: '',
      codigo_alfanumerico: '',
      nombre: '',
      unidad_medida: '',
      estado: 'PLANIFICACION',
    };
  }
}
