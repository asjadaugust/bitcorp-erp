import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OperatorService } from '../../core/services/operator.service';
import { Operator } from '../../core/models/operator.model';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { ExcelExportService } from '../../core/services/excel-export.service';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../shared/components/export-dropdown/export-dropdown.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-operator-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent
  ],
  template: `
    <app-page-layout
      title="Gestión de Operadores"
      icon="fa-id-card"
      [breadcrumbs]="[{ label: 'Dashboard', url: '/app' }, { label: 'Operadores' }]"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-export-dropdown [disabled]="operators.length === 0" (export)="handleExport($event)">
        </app-export-dropdown>
        <button class="btn btn-primary" (click)="addOperator()">
          <i class="fa-solid fa-plus"></i> Nuevo Operador
        </button>
      </app-actions-container>

      <!-- Stats Dashboard -->
      <div class="stats-dashboard">
        <div class="stat-card">
          <div class="stat-icon bg-blue">
            <i class="fa-solid fa-users"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ operators.length }}</span>
            <span class="stat-label">Total Operadores</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-green">
            <i class="fa-solid fa-user-check"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ getActiveCount() }}</span>
            <span class="stat-label">Activos</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-orange">
            <i class="fa-solid fa-user-clock"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ getOnLeaveCount() }}</span>
            <span class="stat-label">De Vacaciones</span>
          </div>
        </div>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <!-- Data Table -->
      <div class="table-container">
        <aero-table
          [columns]="columns"
          [data]="operators"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            operator: operatorTemplate,
            contact: contactTemplate,
            license: licenseTemplate,
            skills: skillsTemplate,
          }"
          (rowClick)="viewOperator($event)"
        >
        </aero-table>

        <!-- Custom Templates -->
        <ng-template #operatorTemplate let-row>
          <div class="user-cell">
            <div class="avatar-circle">{{ getInitials(row) }}</div>
            <div class="user-info">
              <span class="user-name">{{
                row.full_name || row.first_name + ' ' + row.last_name
              }}</span>
              <span class="user-role">Operador</span>
            </div>
          </div>
        </ng-template>

        <ng-template #contactTemplate let-row>
          <div class="contact-info">
            <div *ngIf="row.email" class="contact-item">
              <i class="fa-regular fa-envelope"></i> {{ row.email }}
            </div>
            <div *ngIf="row.phone" class="contact-item">
              <i class="fa-solid fa-phone"></i> {{ row.phone }}
            </div>
          </div>
        </ng-template>

        <ng-template #licenseTemplate let-row>
          <span class="license-badge" *ngIf="row.license_number">
            {{ row.license_number }}
          </span>
          <span class="text-muted" *ngIf="!row.license_number">-</span>
        </ng-template>

        <ng-template #skillsTemplate let-row>
          <div class="skills-list">
            <span class="skill-tag" *ngFor="let skill of row.skills?.slice(0, 2)">
              {{ skill.equipment_type }}
            </span>
            <span class="skill-more" *ngIf="row.skills && row.skills.length > 2">
              +{{ row.skills.length - 2 }}
            </span>
          </div>
        </ng-template>

        <!-- Actions Template -->
        <ng-template #actionsTemplate let-row>
          <div class="action-buttons">
            <button
              class="btn-icon"
              (click)="viewOperator(row); $event.stopPropagation()"
              title="Ver Detalles"
            >
              <i class="fa-solid fa-eye"></i>
            </button>
            <button
              class="btn-icon"
              (click)="editOperator(row); $event.stopPropagation()"
              title="Editar"
            >
              <i class="fa-solid fa-pen"></i>
            </button>
          </div>
        </ng-template>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      /* Stats Dashboard */
      .stats-dashboard {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-16);
        margin-bottom: var(--s-24);
      }

      .stat-card {
        background: var(--neutral-0);
        padding: var(--s-16);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        display: flex;
        align-items: center;
        gap: var(--s-16);
        border: 1px solid var(--grey-200);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .bg-blue {
        background: var(--primary-100);
        color: var(--primary-500);
      }
      .bg-green {
        background: var(--semantic-green-50);
        color: var(--semantic-green-600);
      }
      .bg-orange {
        background: var(--semantic-orange-50);
        color: var(--semantic-orange-600);
      }

      .stat-info {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--grey-900);
        line-height: 1.2;
      }

      .stat-label {
        font-size: 12px;
        color: var(--grey-500);
        font-weight: 500;
      }

      /* Data Table */
      .table-container {
        background: var(--neutral-0);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        overflow-x: auto;
        position: relative;
        border: 1px solid var(--grey-200);
      }

      /* Cell Components */
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
        color: var(--primary-800);
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
        color: var(--grey-700);
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
      }

      .skills-list {
        display: flex;
        gap: 4px;
      }

      .skill-tag {
        background: var(--primary-100);
        color: var(--primary-800);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
      }

      .skill-more {
        background: var(--grey-100);
        color: var(--grey-700);
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 11px;
      }

      /* Actions */
      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .btn-icon {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--grey-500);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .btn-icon:hover {
        background: var(--grey-100);
        color: var(--primary-500);
      }

      .text-muted {
        color: var(--grey-400);
      }

      .btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
      }

      .btn-primary {
        background: var(--primary-500);
        color: white;
      }

      .btn-primary:hover {
        background: var(--primary-800);
      }

      .btn-secondary {
        background: var(--grey-700);
        color: white;
      }

      .btn-secondary:hover {
        background: var(--grey-700);
      }

      .btn-secondary:disabled {
        background: var(--grey-300);
        cursor: not-allowed;
        opacity: 0.6;
      }
    `,
  ],
})
export class OperatorListComponent implements OnInit {
  operatorService = inject(OperatorService);
  private excelService = inject(ExcelExportService);
  private router = inject(Router);

  operators: Operator[] = [];
  loading = false;

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por nombre, DNI o licencia...',
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
        { label: 'De Vacaciones', value: 'on_leave' },
      ],
    },
  ];

  currentFilters: any = { status: '', search: '' };

  columns: TableColumn[] = [
    { key: 'operator', label: 'Operador', type: 'template' },
    { key: 'contact', label: 'Contacto', type: 'template' },
    { key: 'license', label: 'Licencia', type: 'template' },
    { key: 'hourly_rate', label: 'Tarifa/Hr', type: 'currency', format: 'USD' },
    { key: 'employment_start_date', label: 'Inicio Contrato', type: 'date', format: 'mediumDate' },
    { key: 'skills', label: 'Habilidades', type: 'template' },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        active: { label: 'Activo', class: 'badge status-active' },
        inactive: { label: 'Inactivo', class: 'badge status-inactive' },
        on_leave: { label: 'Vacaciones', class: 'badge status-on_leave' },
      },
    },
  ];

  ngOnInit(): void {
    this.loadOperators();
  }

  onFilterChange(filters: any) {
    this.currentFilters = { ...this.currentFilters, ...filters };
    this.loadOperators();
  }

  loadOperators(): void {
    this.loading = true;
    this.operatorService.getAll(this.currentFilters).subscribe({
      next: (data) => {
        this.operators = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getInitials(operator: Operator): string {
    const first = operator.first_name?.charAt(0) || '';
    const last = operator.last_name?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getActiveCount(): number {
    return this.operators.filter((o) => o.status === 'active').length;
  }

  getOnLeaveCount(): number {
    return this.operators.filter((o) => o.status === 'on_leave').length;
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

  handleExport(format: ExportFormat): void {
    if (format === 'excel') {
      this.exportToExcel();
    } else if (format === 'csv') {
      this.exportToCSV();
    }
  }

  exportToExcel(): void {
    if (this.operators.length === 0) {
      alert('No hay operadores para exportar');
      return;
    }

    const exportData = this.operators.map((operator: any) => {
      // Format skills array - handle both formats
      const skills =
        operator.skills?.map((s: any) => s.equipment_type || s.skill_name || s).join(', ') || '';

      return {
        'Nombre Completo': operator.full_name || `${operator.first_name} ${operator.last_name}`,
        Email: operator.email || '',
        Teléfono: operator.phone || '',
        Licencia: operator.license_number || '',
        'Vencimiento Licencia': operator.license_expiry
          ? new Date(operator.license_expiry).toLocaleDateString('es-PE')
          : '',
        'Tarifa por Hora': operator.hourly_rate ? `$${operator.hourly_rate}` : '',
        'Inicio Contrato': operator.employment_start_date
          ? new Date(operator.employment_start_date).toLocaleDateString('es-PE')
          : '',
        'Fin Contrato': operator.employment_end_date
          ? new Date(operator.employment_end_date).toLocaleDateString('es-PE')
          : '',
        Habilidades: skills,
        Estado: operator.status || '',
        Calificación: operator.performance_rating || '',
        Notas: operator.notes || '',
        Creado: operator.created_at
          ? new Date(operator.created_at).toLocaleDateString('es-PE')
          : '',
      };
    });

    this.excelService.exportToExcel(exportData, {
      filename: 'operadores',
      sheetName: 'Operadores',
      includeTimestamp: true,
    });
  }

  exportToCSV(): void {
    if (this.operators.length === 0) {
      alert('No hay operadores para exportar');
      return;
    }

    const exportData = this.operators.map((operator: any) => {
      const skills =
        operator.skills?.map((s: any) => s.equipment_type || s.skill_name || s).join(', ') || '';

      return {
        'Nombre Completo': operator.full_name || `${operator.first_name} ${operator.last_name}`,
        Email: operator.email || '',
        Teléfono: operator.phone || '',
        Licencia: operator.license_number || '',
        'Vencimiento Licencia': operator.license_expiry
          ? new Date(operator.license_expiry).toLocaleDateString('es-PE')
          : '',
        'Tarifa por Hora': operator.hourly_rate ? `$${operator.hourly_rate}` : '',
        'Inicio Contrato': operator.employment_start_date
          ? new Date(operator.employment_start_date).toLocaleDateString('es-PE')
          : '',
        'Fin Contrato': operator.employment_end_date
          ? new Date(operator.employment_end_date).toLocaleDateString('es-PE')
          : '',
        Habilidades: skills,
        Estado: operator.status || '',
        Calificación: operator.performance_rating || '',
        Notas: operator.notes || '',
        Creado: operator.created_at
          ? new Date(operator.created_at).toLocaleDateString('es-PE')
          : '',
      };
    });

    this.excelService.exportToCSV(exportData, 'operadores');
  }
}
