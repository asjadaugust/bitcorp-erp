import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';
import {
  AeroTableComponent,
  TableColumn,
} from '../../../../core/design-system/table/aero-table.component';
import {
  PageLayoutComponent,
  Breadcrumb,
  TabItem,
} from '../../../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../../shared/components/filter-bar/filter-bar.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { PageCardComponent } from '../../../../shared/components/page-card/page-card.component';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ButtonComponent,
    PageCardComponent,
  ],
  template: `
    <app-page-layout
      title="Gestión de Personal"
      icon="fa-users"
      [breadcrumbs]="breadcrumbs"
      [tabs]="tabs"
      [loading]="loading"
    >
      <div actions>
        <app-button
          variant="primary"
          icon="fa-plus"
          label="Nuevo Personal"
          (clicked)="navigateToCreate()"
        ></app-button>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-table
          [columns]="columns"
          [data]="employees"
          [loading]="loading"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            nombre_completo: userTemplate,
          }"
        >
        </aero-table>
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
          <app-button
            variant="icon"
            size="sm"
            icon="fa-pen"
            (clicked)="editEmployee(row)"
          ></app-button>
          <app-button
            variant="icon"
            size="sm"
            icon="fa-trash"
            (clicked)="deleteEmployee(row)"
          ></app-button>
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

  employees: Employee[] = [];
  loading = false;
  searchTerm = '';

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'RRHH', url: '/rrhh' },
    { label: 'Personal' },
  ];

  tabs: TabItem[] = [
    { label: 'Dashboard', route: '/rrhh', icon: 'fa-chart-pie' },
    { label: 'Personal', route: '/rrhh/employees', icon: 'fa-users' },
  ];

  filterConfig: FilterConfig[] = [
    {
      type: 'text',
      key: 'search',
      label: 'Buscar',
      placeholder: 'Buscar por nombre o DNI...',
    },
  ];

  columns: TableColumn[] = [
    { key: 'dni', label: 'DNI', type: 'text' },
    { key: 'nombre_completo', label: 'Personal', type: 'template' },
    { key: 'telefono', label: 'Teléfono', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'cargo', label: 'Cargo', type: 'text' },
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
    this.employeeService.getEmployees(this.searchTerm).subscribe({
      next: (data) => {
        this.employees = data;
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
