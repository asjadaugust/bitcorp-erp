import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../../core/design-system/data-grid/aero-data-grid.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../../shared/components/page-layout/page-layout.component';
import { HR_TABS } from '../../hr-tabs';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../../shared/components/filter-bar/filter-bar.component';
import { PageCardComponent } from '../../../../shared/components/page-card/page-card.component';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AeroButtonComponent } from '../../../../core/design-system';

@Component({
  selector: 'app-employee-list',
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
      title="Gestión de Personal"
      icon="fa-users"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <div actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToCreate()"
          >Nuevo Personal</aero-button
        >
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'employee-list'"
          [columns]="columns"
          [data]="employees"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [serverSide]="true"
          [totalItems]="total"
          [pageSize]="pageSize"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            nombre_completo: userTemplate,
          }"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
          (rowClick)="viewEmployee($event)"
        >
        </aero-data-grid>
      </app-page-card>

      <!-- Custom Templates -->
      <ng-template #userTemplate let-row>
        <div class="user-cell">
          <div class="avatar-circle">{{ getInitials(row) }}</div>
          <div class="user-info">
            <span class="user-name">{{ row.nombres }} {{ row.apellido_paterno }}</span>
            <span class="user-role">{{ row.cargo || 'Personal' }}</span>
          </div>
        </div>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-eye"
            (clicked)="viewEmployee(row)"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-pen"
            (clicked)="editEmployee(row)"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-trash"
            (clicked)="deleteEmployee(row)"
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

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ],
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private router = inject(Router);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  tabs = HR_TABS;
  employees: Employee[] = [];
  loading = false;
  total = 0;
  pageSize = 50;
  page = 1;
  searchTerm = '';

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/dashboard' },
    { label: 'RRHH', url: '/rrhh' },
    { label: 'Personal' },
  ];

  filterConfig: FilterConfig[] = [
    {
      type: 'text',
      key: 'search',
      label: 'Buscar',
      placeholder: 'Buscar por nombre o DNI...',
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'dni', label: 'DNI', type: 'text', sortable: true },
    { key: 'nombre_completo', label: 'Personal', type: 'template' },
    { key: 'telefono', label: 'Teléfono', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'cargo', label: 'Cargo', type: 'text', sortable: true },
    { key: 'fecha_ingreso', label: 'Fecha Ingreso', type: 'date', hidden: true },
    { key: 'area', label: 'Área', type: 'text', hidden: true },
    { key: 'direccion', label: 'Dirección', type: 'text', hidden: true },
    {
      key: 'esta_activo',
      label: 'Estado',
      type: 'badge',
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
  ];

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true;
    this.employeeService
      .getEmployees({
        page: this.page,
        limit: this.pageSize,
        search: this.searchTerm || undefined,
      })
      .subscribe({
        next: (response) => {
          this.employees = response.data;
          this.total = response.pagination.total;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading employees', err);
          this.loading = false;
          this.snackBar.open('Error al cargar empleados', 'Cerrar', { duration: 3000 });
        },
      });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.searchTerm = (filters['search'] as string) || '';
    this.page = 1;
    this.loadEmployees();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadEmployees();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadEmployees();
  }

  getInitials(employee: Employee): string {
    const first = employee.nombres?.charAt(0) || '';
    const last = employee.apellido_paterno?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  navigateToCreate(): void {
    this.router.navigate(['/rrhh/employees/new']);
  }

  viewEmployee(employee: Employee | Record<string, unknown>): void {
    const dni = (employee as Employee).dni ?? employee['dni'];
    if (dni) {
      this.router.navigate(['/rrhh/employees', dni]);
    }
  }

  editEmployee(employee: Employee): void {
    this.router.navigate(['/rrhh/employees', employee.dni, 'edit']);
  }

  deleteEmployee(employee: Employee): void {
    this.confirmSvc
      .confirmDelete(`${employee.nombres} ${employee.apellido_paterno}`)
      .subscribe((confirmed) => {
        if (confirmed) {
          this.employeeService.deleteEmployee(employee.dni).subscribe({
            next: () => {
              this.loadEmployees();
              this.snackBar.open('Empleado eliminado correctamente', 'Cerrar', { duration: 3000 });
            },
            error: (err) => {
              console.error('Error deleting employee', err);
              this.snackBar.open('Error al eliminar empleado', 'Cerrar', { duration: 3000 });
            },
          });
        }
      });
  }
}
