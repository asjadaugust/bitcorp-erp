import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OperatorService } from '../../core/services/operator.service';
import { Operator } from '../../core/models/operator.model';
import { FormErrorHandlerService } from '../../core/services/form-error-handler.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
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
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    AeroButtonComponent,
    PageCardComponent,
  ],
  template: `
    <app-page-layout
      title="Gestión de Operadores"
      icon="fa-users-gear"
      [breadcrumbs]="[{ label: 'Inicio', url: '/app' }, { label: 'Operadores' }]"
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
        <aero-table
          [columns]="columns"
          [data]="operators"
          [loading]="loading"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            nombre_completo: userTemplate,
            contacto: contactTemplate,
            licencia: licenseTemplate,
          }"
          (rowClick)="viewOperator($event)"
        >
        </aero-table>
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
    { key: 'especialidad', label: 'Especialidad', type: 'text' },
    { key: 'fecha_ingreso', label: 'Ingreso', type: 'date' },
    {
      key: 'is_active',
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

  actionsTemplate: unknown;

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

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.status = (filters['status'] as string) || '';
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
