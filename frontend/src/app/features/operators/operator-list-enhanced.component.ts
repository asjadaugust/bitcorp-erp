import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OperatorService } from '../../core/services/operator.service';
import { Operator } from '../../core/models/operator.model';
import { FormErrorHandlerService } from '../../core/services/form-error-handler.service';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-operator-list-enhanced',
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
      title="Gestión de Operadores"
      icon="fa-users-gear"
      [breadcrumbs]="[{ label: 'Inicio', url: '/app' }, { label: 'Operadores' }]"
      [loading]="loading"
    >
      <app-actions-container actions>
        <div class="action-buttons">
          <button type="button" class="btn btn-primary" (click)="addOperator()">
            <i class="fa-solid fa-plus"></i> Nuevo Operador
          </button>
        </div>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="operators"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          nombre_completo: userTemplate,
          contacto: contactTemplate,
          licencia: licenseTemplate,
          estado: statusTemplate,
        }"
        (rowClick)="viewOperator($event)"
      >
      </aero-table>

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
        <span class="license-badge" *ngIf="row.licencia_conducir">
          {{ row.licencia_conducir }}
        </span>
        <span class="text-muted" *ngIf="!row.licencia_conducir">-</span>
      </ng-template>

      <ng-template #statusTemplate let-row>
        <span [class]="'status-badge status-' + (row.is_active ? 'active' : 'inactive')">
          {{ row.is_active ? 'Activo' : 'Inactivo' }}
        </span>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button
            type="button"
            class="btn-icon"
            (click)="editOperator(row); $event.stopPropagation()"
            title="Editar"
          >
            <i class="fa-solid fa-pen"></i>
          </button>
          <button
            type="button"
            class="btn-icon"
            (click)="viewOperator(row); $event.stopPropagation()"
            title="Ver Detalles"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
          <button
            type="button"
            class="btn-icon delete-btn"
            (click)="deleteOperator(row); $event.stopPropagation()"
            title="Desactivar"
          >
            <i class="fa-solid fa-user-slash"></i>
          </button>
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

      .status-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .status-badge::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .status-active {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .status-active::before {
        background: var(--semantic-green-500);
      }

      .status-inactive {
        background: var(--grey-100);
        color: var(--grey-600);
      }
      .status-inactive::before {
        background: var(--grey-400);
      }

      .text-muted {
        color: var(--grey-400);
      }
    `,
  ],
})
export class OperatorListEnhancedComponent implements OnInit {
  operatorService = inject(OperatorService);
  private errorHandler = inject(FormErrorHandlerService);
  private router = inject(Router);

  operators: Operator[] = [];
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

  columns: TableColumn[] = [
    { key: 'dni', label: 'DNI', type: 'text' },
    { key: 'nombre_completo', label: 'Operador', type: 'template' },
    { key: 'contacto', label: 'Contacto', type: 'template' },
    { key: 'licencia', label: 'Licencia', type: 'template' },
    { key: 'fecha_ingreso', label: 'Ingreso', type: 'date' },
    { key: 'estado', label: 'Estado', type: 'template' },
  ];

  actionsTemplate: any;

  ngOnInit(): void {
    this.loadOperators();
  }

  loadOperators(): void {
    this.loading = true;
    this.operatorService.getAll(this.filters).subscribe({
      next: (data) => {
        this.operators = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.filters.search = filters['search'] || '';
    this.filters.status = filters['status'] || '';
    this.loadOperators();
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

  deleteOperator(operator: Operator): void {
    const fullName = `${operator.nombres} ${operator.apellido_paterno}`;
    if (
      confirm(
        `¿Desea desactivar al operador "${fullName}"? El operador no será eliminado permanentemente.`
      )
    ) {
      this.operatorService.delete(operator.id).subscribe({
        next: () => {
          this.loadOperators();
        },
        error: (err) => {
          console.error('Error deleting operator:', err);
          this.errorMessage = this.errorHandler.getErrorMessage(err);
        },
      });
    }
  }
}
