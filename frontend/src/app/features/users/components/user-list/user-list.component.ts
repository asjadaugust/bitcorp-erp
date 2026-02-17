import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserManagementService } from '../../services/user-management.service';
import { ManagedUser, RoleOption } from '../../../../core/models/managed-user.model';
import {
  AeroTableComponent,
  TableColumn,
} from '../../../../core/design-system/table/aero-table.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../../shared/components/filter-bar/filter-bar.component';
import { ActionsContainerComponent } from '../../../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-user-list',
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
      title="Gestión de Usuarios"
      icon="fa-users-gear"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <button class="btn btn-primary" (click)="createUser()">
          <i class="fa-solid fa-plus"></i> Nuevo Usuario
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="users"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          fullName: fullNameTemplate,
          rolName: rolNameTemplate,
          lastLogin: lastLoginTemplate,
        }"
        (rowClick)="editUser($event)"
      >
      </aero-table>

      <!-- Custom Templates -->
      <ng-template #fullNameTemplate let-row>
        <div class="user-info">
          <span class="user-name">{{ row.full_name || row.username }}</span>
          <span class="user-email">{{ row.email }}</span>
        </div>
      </ng-template>

      <ng-template #rolNameTemplate let-row>
        <span class="role-badge" *ngIf="row.rol">
          {{ row.rol.name }}
        </span>
        <span class="text-muted" *ngIf="!row.rol">Sin rol</span>
      </ng-template>

      <ng-template #lastLoginTemplate let-row>
        <span *ngIf="row.last_login">{{ row.last_login | date: 'dd/MM/yyyy HH:mm' }}</span>
        <span class="text-muted" *ngIf="!row.last_login">Nunca</span>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button class="btn-icon" (click)="editUser(row); $event.stopPropagation()" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button
            class="btn-icon"
            (click)="openPasswordReset(row); $event.stopPropagation()"
            title="Resetear Contraseña"
          >
            <i class="fa-solid fa-key"></i>
          </button>
          <button
            class="btn-icon"
            [class.btn-icon-danger]="row.is_active"
            [class.btn-icon-success]="!row.is_active"
            (click)="toggleActive(row); $event.stopPropagation()"
            [title]="row.is_active ? 'Desactivar' : 'Activar'"
          >
            <i
              class="fa-solid"
              [class.fa-ban]="row.is_active"
              [class.fa-check]="!row.is_active"
            ></i>
          </button>
        </div>
      </ng-template>
    </app-page-layout>

    <!-- Password Reset Modal -->
    <div
      class="modal-overlay"
      *ngIf="passwordResetUser"
      (click)="closePasswordReset()"
      (keyup.escape)="closePasswordReset()"
      tabindex="0"
    >
      <div
        class="modal-content"
        (click)="$event.stopPropagation()"
        (keyup)="$event.stopPropagation()"
        tabindex="0"
      >
        <div class="modal-header">
          <h3><i class="fa-solid fa-key"></i> Resetear Contraseña</h3>
          <button class="btn-icon" (click)="closePasswordReset()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            Resetear contraseña para <strong>{{ passwordResetUser.username }}</strong>
          </p>
          <div class="form-group">
            <label for="newPassword">Nueva Contraseña</label>
            <input
              id="newPassword"
              type="password"
              class="form-control"
              [(ngModel)]="newPassword"
              placeholder="Mínimo 8 caracteres"
              minlength="8"
            />
          </div>
          <div class="modal-feedback" *ngIf="passwordResetMessage">
            <span [class.success]="passwordResetSuccess" [class.error]="!passwordResetSuccess">
              {{ passwordResetMessage }}
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closePasswordReset()">Cancelar</button>
          <button
            class="btn btn-primary"
            (click)="confirmPasswordReset()"
            [disabled]="!newPassword || newPassword.length < 8 || passwordResetLoading"
          >
            <i class="fa-solid fa-spinner fa-spin" *ngIf="passwordResetLoading"></i>
            Cambiar Contraseña
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .user-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .user-name {
        font-weight: 600;
        color: var(--grey-900);
      }

      .user-email {
        font-size: var(--type-label-size);
        color: var(--grey-500);
      }

      .role-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: var(--type-label-size);
        font-weight: 500;
        background: var(--primary-100);
        color: var(--primary-800);
      }

      .text-muted {
        color: var(--grey-400);
        font-size: var(--type-label-size);
      }

      .action-buttons {
        display: flex;
        gap: var(--s-4);
        align-items: center;
      }

      .btn-icon {
        background: none;
        border: none;
        padding: 6px;
        border-radius: 6px;
        cursor: pointer;
        color: var(--grey-600);
        transition: all 0.15s ease;

        &:hover {
          background: var(--grey-100);
          color: var(--primary-700);
        }
      }

      .btn-icon-danger:hover {
        background: var(--red-50, #fef2f2);
        color: var(--red-600, #dc2626);
      }

      .btn-icon-success:hover {
        background: var(--green-50, #f0fdf4);
        color: var(--green-600, #16a34a);
      }

      /* Modal styles */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background: var(--neutral-0, #fff);
        border-radius: 12px;
        width: 100%;
        max-width: 440px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--s-16) var(--s-24);
        border-bottom: 1px solid var(--grey-200);

        h3 {
          margin: 0;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: var(--s-8);
        }
      }

      .modal-body {
        padding: var(--s-24);

        p {
          margin: 0 0 var(--s-16) 0;
          color: var(--grey-700);
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--s-8);
        padding: var(--s-16) var(--s-24);
        border-top: 1px solid var(--grey-200);
      }

      .form-group {
        margin-bottom: var(--s-8);

        label {
          display: block;
          margin-bottom: var(--s-4);
          font-weight: 500;
          font-size: var(--type-label-size);
          color: var(--grey-700);
        }
      }

      .form-control {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--grey-300);
        border-radius: 8px;
        font-size: var(--type-body-size);
        box-sizing: border-box;

        &:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px var(--primary-100);
        }
      }

      .modal-feedback {
        margin-top: var(--s-8);
        font-size: var(--type-label-size);
      }

      .success {
        color: var(--green-600, #16a34a);
      }

      .error {
        color: var(--red-600, #dc2626);
      }

      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        font-size: var(--type-body-size);
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-primary {
        background: var(--primary-500);
        color: white;

        &:hover:not(:disabled) {
          background: var(--primary-600);
        }
      }

      .btn-secondary {
        background: var(--grey-100);
        color: var(--grey-700);

        &:hover:not(:disabled) {
          background: var(--grey-200);
        }
      }
    `,
  ],
})
export class UserListComponent implements OnInit {
  private userService = inject(UserManagementService);
  private router = inject(Router);

  users: ManagedUser[] = [];
  loading = false;
  roles: RoleOption[] = [];

  // Password reset modal state
  passwordResetUser: ManagedUser | null = null;
  newPassword = '';
  passwordResetLoading = false;
  passwordResetMessage = '';
  passwordResetSuccess = false;

  breadcrumbs: Breadcrumb[] = [{ label: 'Inicio', url: '/app' }, { label: 'Gestión de Usuarios' }];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por nombre, usuario o email...',
    },
    {
      key: 'role',
      label: 'Rol',
      type: 'select',
      options: [],
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'username', label: 'Usuario', width: '140px' },
    { key: 'fullName', label: 'Nombre / Email', type: 'template' },
    { key: 'rolName', label: 'Rol', type: 'template', width: '200px' },
    {
      key: 'is_active',
      label: 'Estado',
      type: 'badge',
      width: '110px',
      badgeConfig: {
        true: {
          label: 'Activo',
          class: 'status-badge status-active',
          icon: 'fa-check',
        },
        false: {
          label: 'Inactivo',
          class: 'status-badge status-inactive',
          icon: 'fa-ban',
        },
      },
    },
    { key: 'lastLogin', label: 'Último Acceso', type: 'template', width: '160px' },
  ];

  private filters: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {
    page: 1,
    limit: 10,
  };

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAll(this.filters).subscribe({
      next: (response) => {
        this.users = response.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        // Update the role filter options
        const roleFilter = this.filterConfig.find((f) => f.key === 'role');
        if (roleFilter) {
          roleFilter.options = roles.map((r) => ({ label: r.name, value: r.code }));
        }
      },
    });
  }

  onFilterChange(filters: Record<string, string | number | boolean>): void {
    this.filters = {
      ...this.filters,
      search: (filters['search'] as string) || '',
      role: (filters['role'] as string) || '',
      status: (filters['status'] as string) || '',
      page: 1, // Reset to first page on filter change
    };
    this.loadUsers();
  }

  createUser(): void {
    this.router.navigate(['/users/new']);
  }

  editUser(user: ManagedUser): void {
    this.router.navigate(['/users', user.id, 'edit']);
  }

  toggleActive(user: ManagedUser): void {
    this.userService.toggleActive(user.id).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex((u) => u.id === user.id);
        if (idx >= 0) {
          this.users[idx] = updated;
          this.users = [...this.users];
        }
      },
      error: (err) => {
        const msg = err.error?.error?.message || 'Error al cambiar estado del usuario';
        alert(msg);
      },
    });
  }

  openPasswordReset(user: ManagedUser): void {
    this.passwordResetUser = user;
    this.newPassword = '';
    this.passwordResetMessage = '';
    this.passwordResetSuccess = false;
  }

  closePasswordReset(): void {
    this.passwordResetUser = null;
    this.newPassword = '';
    this.passwordResetMessage = '';
  }

  confirmPasswordReset(): void {
    if (!this.passwordResetUser || !this.newPassword || this.newPassword.length < 8) return;

    this.passwordResetLoading = true;
    this.passwordResetMessage = '';

    this.userService.changePassword(this.passwordResetUser.id, this.newPassword).subscribe({
      next: () => {
        this.passwordResetLoading = false;
        this.passwordResetSuccess = true;
        this.passwordResetMessage = 'Contraseña actualizada exitosamente';
        setTimeout(() => this.closePasswordReset(), 1500);
      },
      error: (err) => {
        this.passwordResetLoading = false;
        this.passwordResetSuccess = false;
        this.passwordResetMessage = err.error?.error?.message || 'Error al cambiar la contraseña';
      },
    });
  }
}
