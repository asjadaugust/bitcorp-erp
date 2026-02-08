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
import { ActionsContainerComponent } from '../../../../shared/components/actions-container/actions-container.component';

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
    ActionsContainerComponent,
  ],
  template: `
    <app-page-layout
      title="Gestión de Personal"
      icon="fa-users"
      [breadcrumbs]="breadcrumbs"
      [tabs]="tabs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <button class="btn btn-primary" (click)="navigateToCreate()">
          <i class="fa-solid fa-plus"></i> Nuevo Personal
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="employees"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          dni: dniTemplate,
          fullName: fullNameTemplate,
        }"
      >
      </aero-table>

      <!-- Custom Templates -->
      <ng-template #dniTemplate let-row>
        <span class="badge badge-neutral">{{ row.dni }}</span>
      </ng-template>

      <ng-template #fullNameTemplate let-row>
        <span class="font-medium">{{ row.firstName }} {{ row.lastName }}</span>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button class="btn-icon" (click)="editEmployee(row)" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon text-danger" (click)="deleteEmployee(row)" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .btn {
        padding: var(--s-8) var(--s-16);
        border: none;
        border-radius: var(--s-8);
        font-size: var(--type-bodySmall-size);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        transition: all 0.2s ease;
      }
      .btn-primary {
        background: var(--primary-500);
        color: var(--neutral-0);
      }
      .btn-primary:hover {
        background: var(--primary-800);
      }

      .font-medium {
        font-weight: 500;
      }
      .badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }
      .badge-neutral {
        background: var(--grey-200);
        color: var(--grey-700);
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        color: var(--grey-500);
        transition: color 0.2s;
      }
      .btn-icon:hover {
        color: var(--primary-500);
      }
      .text-danger:hover {
        color: var(--semantic-error);
      }

      .actions-container {
        display: flex;
        gap: var(--s-8);
        align-items: center;
      }
    `,
  ],
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private router = inject(Router);

  employees: Employee[] = [];
  loading = false;
  searchTerm = '';

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', url: '/app' },
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
    { key: 'dni', label: 'DNI', type: 'template' },
    { key: 'fullName', label: 'Nombre Completo', type: 'template' },
    { key: 'mobile1', label: 'Celular', type: 'text' },
    { key: 'email1', label: 'Email', type: 'text' },
    { key: 'role', label: 'Cargo/Rol', type: 'text' },
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
      },
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.searchTerm = filters['search'] || '';
    this.loadEmployees();
  }

  navigateToCreate(): void {
    this.router.navigate(['/rrhh/employees/new']);
  }

  editEmployee(employee: Employee): void {
    this.router.navigate(['/rrhh/employees', employee.dni, 'edit']);
  }

  deleteEmployee(employee: Employee): void {
    if (confirm(`¿Está seguro de eliminar a ${employee.firstName} ${employee.lastName}?`)) {
      this.employeeService.deleteEmployee(employee.dni).subscribe({
        next: () => {
          this.loadEmployees();
        },
        error: (err) => console.error('Error deleting employee', err),
      });
    }
  }
}
