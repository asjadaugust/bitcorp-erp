import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OperatorService } from '../../core/services/operator.service';
import { Operator } from '../../core/models/operator.model';
import { FormErrorHandlerService } from '../../core/services/form-error-handler.service';

@Component({
  selector: 'app-operator-list-enhanced',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="operators-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <h1>👷 Gestión de Operadores</h1>
          <p class="subtitle">Administración de operadores, habilidades y certificaciones</p>
        </div>
        <div class="actions-container">
          <button class="btn btn-primary" (click)="addOperator()">
            <i class="fa-solid fa-plus"></i> Nuevo Operador
          </button>
        </div>
      </div>

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

      <!-- Filters & Actions Bar -->
      <div class="table-controls">
        <div class="search-box">
          <i class="fa-solid fa-search"></i>
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o licencia..."
            [(ngModel)]="filters.search"
            (input)="applyFilters()"
          />
        </div>

        <div class="filter-group">
          <select [(ngModel)]="filters.status" (change)="applyFilters()" class="form-select">
            <option value="">Todos los Estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="vacaciones">De Vacaciones</option>
          </select>
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-container card">
        <div class="loading-overlay" *ngIf="loading">
          <div class="spinner"></div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Operador</th>
              <th>Contacto</th>
              <th>Licencia</th>
              <th>Tarifa/Hr</th>
              <th>Inicio Contrato</th>
              <th>Habilidades</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let operator of operators" class="hover-row">
              <td>
                <div class="user-cell">
                  <div class="avatar-circle">{{ getInitials(operator) }}</div>
                  <div class="user-info">
                    <span class="user-name">{{
                      operator.nombres + ' ' + operator.apellido_paterno
                    }}</span>
                    <span class="user-role">Operador</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="contact-info">
                  <div *ngIf="operator.correo_electronico" class="contact-item">
                    <i class="fa-regular fa-envelope"></i> {{ operator.correo_electronico }}
                  </div>
                  <div *ngIf="operator.telefono" class="contact-item">
                    <i class="fa-solid fa-phone"></i> {{ operator.telefono }}
                  </div>
                </div>
              </td>
              <td>
                <span class="license-badge" *ngIf="operator.licencia_conducir">
                  {{ operator.licencia_conducir }}
                </span>
                <span class="text-muted" *ngIf="!operator.licencia_conducir">-</span>
              </td>
              <!-- Hourly rate removed -->
              <td>-</td>
              <td>
                {{ operator.fecha_ingreso | date: 'mediumDate' }}
              </td>
              <!-- Skills removed/placeholder -->
              <td>-</td>
              <td>
                <span [class]="'status-badge status-' + getEstadoClass(operator)">
                  {{ getEstadoLabel(operator) }}
                </span>
              </td>
              <td class="text-right">
                <div class="action-buttons">
                  <button class="btn-icon" (click)="viewOperator(operator)" title="Ver Detalles">
                    <i class="fa-solid fa-eye"></i>
                  </button>
                  <button class="btn-icon" (click)="editOperator(operator)" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button
                    class="btn-icon btn-danger"
                    (click)="deleteOperator(operator)"
                    title="Desactivar"
                  >
                    <i class="fa-solid fa-user-slash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="operators.length === 0 && !loading">
              <td colspan="8" class="empty-state">
                <div class="empty-content">
                  <i class="fa-solid fa-users-slash"></i>
                  <h3>No se encontraron operadores</h3>
                  <p>Intenta ajustar los filtros o agrega un nuevo operador</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .operators-container {
        padding: 0;
        max-width: 100%;
      }

      /* Header Styles */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-24);
      }

      .header-content h1 {
        font-size: var(--type-h3-size);
        color: var(--primary-900);
        margin: 0 0 var(--s-4) 0;
      }

      .subtitle {
        color: var(--grey-500);
        margin: 0;
        font-size: var(--type-body-size);
      }

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
        background: var(--primary-50);
        color: var(--primary-600);
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

      /* Controls & Filters */
      .table-controls {
        display: flex;
        gap: var(--s-16);
        margin-bottom: var(--s-16);
        flex-wrap: wrap;
      }

      .search-box {
        flex: 1;
        min-width: 300px;
        position: relative;
      }

      .search-box i {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--grey-400);
      }

      .search-box input {
        width: 100%;
        padding: 10px 12px 10px 36px;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        font-size: 14px;
        transition: all 0.2s;
      }

      .search-box input:focus {
        border-color: var(--primary-500);
        outline: none;
        box-shadow: 0 0 0 3px var(--primary-100);
      }

      .form-select {
        padding: 10px 32px 10px 12px;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        font-size: 14px;
        color: var(--grey-700);
        background-color: var(--neutral-0);
        cursor: pointer;
        min-width: 180px;
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

      .data-table {
        width: 100%;
        border-collapse: collapse;
        white-space: nowrap;
      }

      .data-table th {
        background: var(--grey-50);
        padding: 12px 16px;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        color: var(--grey-600);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--grey-200);
      }

      .data-table td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--grey-100);
        color: var(--grey-700);
        font-size: 14px;
        vertical-align: middle;
      }

      .hover-row:hover td {
        background-color: var(--primary-50);
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

      .currency {
        font-weight: 600;
        color: var(--grey-900);
      }

      .skills-list {
        display: flex;
        gap: 4px;
      }

      .skill-tag {
        background: var(--primary-50);
        color: var(--primary-700);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
      }

      .skill-more {
        background: var(--grey-100);
        color: var(--grey-600);
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 11px;
      }

      /* Status Badges */
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

      .status-on_leave {
        background: var(--semantic-orange-50);
        color: var(--semantic-orange-700);
      }
      .status-on_leave::before {
        background: var(--semantic-orange-500);
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
        color: var(--primary-600);
      }

      .btn-icon.btn-danger:hover {
        background: var(--semantic-red-50);
        color: var(--semantic-red-600);
      }

      .text-right {
        text-align: right;
      }
      .text-muted {
        color: var(--grey-400);
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 48px 0;
      }

      .empty-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .empty-content i {
        font-size: 48px;
        color: var(--grey-300);
      }

      .empty-content h3 {
        margin: 0;
        color: var(--grey-900);
      }

      .empty-content p {
        margin: 0;
        color: var(--grey-500);
      }

      /* Loading */
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
      }
    `,
  ],
})
@Component({
  // ... (decorators remain same)
})
export class OperatorListEnhancedComponent implements OnInit {
  operatorService = inject(OperatorService);
  private errorHandler = inject(FormErrorHandlerService); // Inject Error Handler
  private router = inject(Router);

  operators: Operator[] = [];
  loading = false;
  filters = { status: '', search: '' };
  errorMessage = ''; // Add errorMessage property

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

  // ... (other methods remain same)

  applyFilters(): void {
    this.loadOperators();
  }

  getInitials(operator: Operator): string {
    const first = operator.nombres?.charAt(0) || '';
    const last = operator.apellido_paterno?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getActiveCount(): number {
    return this.operators.filter((o) => o.is_active).length;
  }

  getOnLeaveCount(): number {
    return 0;
  }

  getEstadoClass(operator: Operator): string {
    return operator.is_active ? 'activo' : 'inactivo';
  }

  getEstadoLabel(operator: Operator): string {
    return operator.is_active ? 'Activo' : 'Inactivo';
  }

  viewOperator(operator: Operator): void {
    this.router.navigate(['/operations/operators', operator.id]); // Updated route
  }

  editOperator(operator: Operator): void {
    this.router.navigate(['/operations/operators', operator.id, 'edit']); // Updated route
  }

  addOperator(): void {
    this.router.navigate(['/operations/operators/new']); // Updated route
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
