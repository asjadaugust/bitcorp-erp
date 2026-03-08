import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OperatorService, PaginatedResponse } from '../../core/services/operator.service';
import { Operator } from '../../core/models/operator.model';
import { FormErrorHandlerService } from '../../core/services/form-error-handler.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AeroDataGridComponent, DataGridColumn, DataGridSortEvent } from '../../core/design-system';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-operator-list-enhanced',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    FilterBarComponent,
    AeroButtonComponent,
    PageCardComponent,
  ],
  template: `
    <app-page-layout
      title="Gestión de Operadores"
      icon="fa-users-gear"
      [breadcrumbs]="[{ label: 'Inicio', url: '/dashboard' }, { label: 'Operadores' }]"
      [loading]="loading"
    >
      <div actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="addOperator()"
          >Nuevo Operador</aero-button
        >
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'operator-list'"
          [columns]="columns"
          [data]="operators"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [serverSide]="true"
          [totalItems]="total"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            nombre_completo: userTemplate,
            contacto: contactTemplate,
            licencia: licenseTemplate,
          }"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
          (rowClick)="viewOperator($event)"
          (sortChange)="onSortChange($event)"
        >
        </aero-data-grid>
      </app-page-card>

      <!-- Custom Templates -->
      <ng-template #userTemplate let-row>
        <div class="user-cell">
          <div class="avatar-circle">{{ getInitials(row) }}</div>
          <div class="user-info">
            <span class="user-name">{{ row.nombres }} {{ row.apellido_paterno }}</span>
            <span class="user-role">{{ row.cargo || 'Operador' }}</span>
          </div>
        </div>
      </ng-template>

      <ng-template #contactTemplate let-row>
        <div class="contact-info">
          <div *ngIf="row.correo_electronico" class="contact-item">
            <i class="fa-regular fa-envelope"></i> {{ row.correo_electronico }}
          </div>
          <div *ngIf="row.telefono" class="contact-item">
            <i class="fa-solid fa-phone"></i> {{ row.telefono }}
          </div>
        </div>
      </ng-template>

      <ng-template #licenseTemplate let-row>
        @if (row.licencia_conducir) {
          <div class="license-cell">
            <span class="license-badge">{{ row.licencia_conducir }}</span>
            @if (row.vencimiento_licencia) {
              <span
                class="license-expiry"
                [class.license-expired]="isLicenseExpired(row.vencimiento_licencia)"
              >
                Vence: {{ row.vencimiento_licencia | date: 'dd/MM/yyyy' }}
              </span>
            }
          </div>
        } @else {
          <span class="text-muted">-</span>
        }
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-pen"
            (clicked)="editOperator(row); $event.stopPropagation()"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-eye"
            (clicked)="viewOperator(row); $event.stopPropagation()"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-user-slash"
            (clicked)="deleteOperator(row); $event.stopPropagation()"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .user-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .avatar-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--primary-100);
        color: var(--primary-700);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
      }

      .user-info {
        display: flex;
        flex-direction: column;
      }

      .user-name {
        font-weight: 500;
        color: var(--grey-900);
      }

      .user-role {
        font-size: 12px;
        color: var(--grey-500);
      }

      .contact-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
      }

      .contact-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--grey-600);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
      }

      .contact-item i {
        font-size: 12px;
        color: var(--grey-400);
        width: 14px;
        text-align: center;
      }

      .license-badge {
        background: var(--grey-100);
        padding: 2px 8px;
        border-radius: 4px;
        font-family: monospace;
        font-weight: 600;
        color: var(--grey-700);
        border: 1px solid var(--grey-300);
        font-size: 12px;
      }

      .license-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .license-expiry {
        font-size: 11px;
        color: var(--grey-500);
      }
      .license-expired {
        color: var(--semantic-red-500);
        font-weight: 600;
      }
      .text-muted {
        color: var(--grey-400);
      }
    `,
  ],
})
export class OperatorListEnhancedComponent implements OnInit {
  private operatorService = inject(OperatorService);
  private errorHandler = inject(FormErrorHandlerService);
  private router = inject(Router);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  operators: Operator[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  loading = false;
  filters = { status: '', search: '' };
  errorMessage = '';

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por nombre, DNI, email...',
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Todos', value: '' },
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    // ─── Visible columns ───
    { key: 'dni', label: 'DNI', type: 'text', sortable: true, filterable: true },
    {
      key: 'nombre_completo',
      label: 'Operador',
      type: 'template',
      sortable: true,
      filterable: true,
    },
    { key: 'contacto', label: 'Contacto', type: 'template' },
    { key: 'licencia', label: 'Licencia', type: 'template' },
    { key: 'especialidad', label: 'Especialidad', type: 'text', sortable: true, filterable: true },
    { key: 'fecha_ingreso', label: 'Ingreso', type: 'date', sortable: true },
    {
      key: 'is_active',
      label: 'Estado',
      type: 'badge',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Activo', value: 'true' },
        { label: 'Inactivo', value: 'false' },
      ],
      badgeConfig: {
        true: {
          label: 'Activo',
          class: 'status-badge status-active',
          icon: 'fa-solid fa-check',
        },
        false: {
          label: 'Inactivo',
          class: 'status-badge status-inactive',
          icon: 'fa-solid fa-ban',
        },
      },
    },

    // ─── Legacy hidden columns (from 305_RRHH.tbl_C05000_Trabajador) ───
    {
      key: 'apellido_paterno',
      label: 'Apellido Paterno',
      type: 'text',
      hidden: true,
      sortable: true,
    },
    {
      key: 'apellido_materno',
      label: 'Apellido Materno',
      type: 'text',
      hidden: true,
      sortable: true,
    },
    { key: 'nombres', label: 'Nombres', type: 'text', hidden: true, sortable: true },
    {
      key: 'fecha_nacimiento',
      label: 'Fecha Nacimiento',
      type: 'date',
      hidden: true,
      sortable: true,
    },
    { key: 'direccion', label: 'Dirección', type: 'text', hidden: true, sortable: true },
    { key: 'telefono', label: 'Teléfono', type: 'text', hidden: true, sortable: true },
    {
      key: 'correo_electronico',
      label: 'Correo Electrónico',
      type: 'text',
      hidden: true,
      sortable: true,
    },
    { key: 'cargo', label: 'Cargo', type: 'text', hidden: true, sortable: true },
    { key: 'tipo_contrato', label: 'Tipo Contrato', type: 'text', hidden: true, sortable: true },
    { key: 'fecha_cese', label: 'Fecha Cese', type: 'date', hidden: true, sortable: true },
    {
      key: 'licencia_conducir',
      label: 'Licencia Conducir',
      type: 'text',
      hidden: true,
      sortable: true,
    },
    {
      key: 'vencimiento_licencia',
      label: 'Vencimiento Licencia',
      type: 'date',
      hidden: true,
      sortable: true,
    },
    { key: 'created_at', label: 'Fecha Registro', type: 'date', hidden: true, sortable: true },
    {
      key: 'updated_at',
      label: 'Última Actualización',
      type: 'date',
      hidden: true,
      sortable: true,
    },
  ];

  actionsTemplate: unknown;

  ngOnInit(): void {
    this.loadOperators();
  }

  loadOperators(): void {
    this.loading = true;
    this.operatorService
      .getAllPaginated({
        page: this.page,
        limit: this.pageSize,
        search: this.filters.search || undefined,
        estado: this.filters.status || undefined,
      })
      .subscribe({
        next: (res: PaginatedResponse<Operator>) => {
          this.operators = res.data;
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = this.errorHandler.getErrorMessage(err);
          this.loading = false;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadOperators();
  }
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadOperators();
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.status = (filters['status'] as string) || '';
    this.page = 1;
    this.loadOperators();
  }

  onSortChange(event: DataGridSortEvent): void {
    console.log('Sort changed:', event.column, event.direction);
  }

  getInitials(operator: Operator): string {
    const first = operator.nombres?.charAt(0) || '';
    const last = operator.apellido_paterno?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  viewOperator(operator: Operator): void {
    this.router.navigate(['/operators', operator.id]);
  }

  editOperator(operator: Operator): void {
    this.router.navigate(['/operators', operator.id, 'edit']);
  }

  addOperator(): void {
    this.router.navigate(['/operators/new']);
  }

  isLicenseExpired(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  deleteOperator(operator: Operator): void {
    const fullName = `${operator.nombres} ${operator.apellido_paterno}`;
    this.confirmSvc.confirmDelete(`el operador ${fullName}`).subscribe((confirmed) => {
      if (confirmed) {
        this.operatorService.delete(operator.id).subscribe({
          next: () => {
            this.snackBar.open('Operador desactivado correctamente', 'Cerrar', { duration: 3000 });
            this.loadOperators();
          },
          error: (err) => {
            console.error('Error deleting operator:', err);
            this.snackBar.open('Error al desactivar el operador', 'Cerrar', { duration: 3000 });
            this.errorMessage = this.errorHandler.getErrorMessage(err);
          },
        });
      }
    });
  }
}
