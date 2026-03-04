import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PermissionsService, Permiso, Rol, RolPermiso } from './permissions.service';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../shared/components/page-layout/page-layout.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { AeroButtonComponent } from '../../core/design-system';

interface PermisoGroup {
  proceso: string;
  permisos: Permiso[];
}

@Component({
  selector: 'app-role-permission-matrix',
  standalone: true,
  imports: [
    CommonModule,
    PageLayoutComponent,
    ActionsContainerComponent,
    PageCardComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Matriz Rol-Permiso"
      icon="fa-table-cells"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      backUrl="/permissions"
    >
      <app-actions-container actions>
        <aero-button variant="secondary" iconLeft="fa-list" (clicked)="navigateToList()"
          >Ver Lista</aero-button
        >
      </app-actions-container>

      <app-page-card [noPadding]="true">
        <!-- Loading overlay -->
        <div *ngIf="loading" class="matrix-loading">
          <div class="matrix-spinner"></div>
        </div>

        <div class="matrix-scroll-wrap" *ngIf="!loading && roles.length > 0">
          <table class="matrix-table">
            <thead>
              <tr>
                <th class="matrix-th matrix-th--proceso">Proceso</th>
                <th class="matrix-th matrix-th--modulo">Módulo</th>
                <th class="matrix-th matrix-th--permiso">Permiso</th>
                <th *ngFor="let rol of roles" class="matrix-th matrix-th--role">
                  {{ rol.nombre || rol.codigo }}
                </th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let group of permisoGroups">
                <tr *ngFor="let permiso of group.permisos; let first = first">
                  <td
                    *ngIf="first"
                    class="matrix-td matrix-td--proceso"
                    [attr.rowspan]="group.permisos.length"
                  >
                    <strong>{{ group.proceso }}</strong>
                  </td>
                  <td class="matrix-td matrix-td--modulo">{{ permiso.modulo }}</td>
                  <td class="matrix-td matrix-td--permiso">{{ permiso.permiso }}</td>
                  <td *ngFor="let rol of roles" class="matrix-td matrix-td--check">
                    <label
                      class="matrix-check-wrap"
                      [class.matrix-check-wrap--updating]="isUpdating(rol.id, permiso.id)"
                    >
                      <input
                        type="checkbox"
                        [checked]="isAssigned(rol.id, permiso.id)"
                        [disabled]="isUpdating(rol.id, permiso.id)"
                        (change)="onToggle(rol.id, permiso.id, $event)"
                      />
                      <span class="matrix-checkmark"></span>
                    </label>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

        <!-- Empty state -->
        <div
          *ngIf="!loading && (roles.length === 0 || permisoGroups.length === 0)"
          class="matrix-empty"
        >
          <i class="fa-solid fa-table-cells"></i>
          <p>No hay permisos o roles configurados</p>
        </div>
      </app-page-card>
    </app-page-layout>
  `,
  styles: [
    `
      .matrix-loading {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: var(--s-32);
        min-height: 200px;
      }

      .matrix-spinner {
        width: 28px;
        height: 28px;
        border: 3px solid var(--grey-200);
        border-top-color: var(--primary-500);
        border-radius: 50%;
        animation: matrixSpin 0.8s linear infinite;
      }

      @keyframes matrixSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .matrix-scroll-wrap {
        overflow-x: auto;
      }

      .matrix-table {
        width: 100%;
        border-collapse: collapse;
        white-space: nowrap;
      }

      .matrix-th {
        padding: var(--s-8) var(--s-12);
        text-align: left;
        font-family: var(--font-text);
        font-weight: 600;
        font-size: 12px;
        color: var(--grey-700);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid var(--grey-200);
        background-color: var(--grey-50);
        vertical-align: middle;
        position: sticky;
        top: 0;
        z-index: 2;
      }

      .matrix-th--proceso {
        min-width: 140px;
      }

      .matrix-th--modulo {
        min-width: 120px;
      }

      .matrix-th--permiso {
        min-width: 120px;
      }

      .matrix-th--role {
        text-align: center;
        min-width: 100px;
      }

      .matrix-td {
        padding: var(--s-6) var(--s-12);
        font-family: var(--font-text);
        font-size: 13px;
        line-height: 18px;
        color: var(--primary-900);
        vertical-align: middle;
        border-bottom: 1px solid var(--grey-100);
      }

      .matrix-td--proceso {
        background-color: var(--grey-50);
        border-right: 1px solid var(--grey-200);
        font-weight: 600;
        color: var(--primary-900);
        vertical-align: top;
        padding-top: var(--s-8);
      }

      .matrix-td--modulo {
        color: var(--grey-700);
      }

      .matrix-td--permiso {
        color: var(--primary-900);
      }

      .matrix-td--check {
        text-align: center;
      }

      /* Checkbox styling matching aero-data-grid */
      .matrix-check-wrap {
        display: inline-flex;
        align-items: center;
        position: relative;
        cursor: pointer;
      }

      .matrix-check-wrap--updating {
        opacity: 0.5;
        pointer-events: none;
      }

      .matrix-check-wrap input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .matrix-checkmark {
        width: 20px;
        height: 20px;
        border: 2px solid var(--grey-400);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--neutral-0);
        transition: all 0.15s ease;
        flex-shrink: 0;
      }

      .matrix-check-wrap:hover .matrix-checkmark {
        border-color: var(--primary-500);
      }

      .matrix-check-wrap input:checked + .matrix-checkmark {
        background-color: var(--primary-500);
        border-color: var(--primary-500);
      }

      .matrix-check-wrap input:checked + .matrix-checkmark::after {
        content: '';
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        margin-top: -2px;
      }

      /* Row hover */
      .matrix-table tbody tr:hover {
        background-color: var(--primary-100);
      }

      /* Empty state */
      .matrix-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-8);
        padding: var(--s-32);
        color: var(--grey-500);
      }

      .matrix-empty i {
        font-size: 28px;
        color: var(--grey-300);
      }

      .matrix-empty p {
        margin: 0;
        font-size: 13px;
      }
    `,
  ],
})
export class RolePermissionMatrixComponent implements OnInit {
  private readonly permissionsService = inject(PermissionsService);
  private readonly router = inject(Router);

  roles: Rol[] = [];
  permisos: Permiso[] = [];
  permisoGroups: PermisoGroup[] = [];
  loading = false;

  /** Map: "rolId-permisoId" -> true (assigned) */
  assignmentMap = new Map<string, boolean>();

  /** Set of "rolId-permisoId" currently being updated */
  updatingSet = new Set<string>();

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Permisos', url: '/permissions' },
    { label: 'Matriz' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      permisos: this.permissionsService.getPermisos(),
      roles: this.permissionsService.getRoles(),
    }).subscribe({
      next: ({ permisos, roles }) => {
        this.permisos = permisos;
        this.roles = roles;
        this.buildGroups();
        this.loadRolAssignments();
      },
      error: () => {
        this.permisos = [];
        this.roles = [];
        this.loading = false;
      },
    });
  }

  private buildGroups(): void {
    const groupMap = new Map<string, Permiso[]>();

    for (const permiso of this.permisos) {
      const key = permiso.proceso || 'Sin Proceso';
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(permiso);
    }

    this.permisoGroups = Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([proceso, permisos]) => ({ proceso, permisos }));
  }

  private loadRolAssignments(): void {
    if (this.roles.length === 0) {
      this.loading = false;
      return;
    }

    const requests = this.roles.map((rol) => this.permissionsService.getRolPermisos(rol.id));

    forkJoin(requests).subscribe({
      next: (results) => {
        this.assignmentMap.clear();
        results.forEach((rolPermisos, index) => {
          const rolId = this.roles[index].id;
          for (const rp of rolPermisos) {
            this.assignmentMap.set(`${rolId}-${rp.permiso_id}`, true);
          }
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  isAssigned(rolId: number, permisoId: number): boolean {
    return this.assignmentMap.has(`${rolId}-${permisoId}`);
  }

  isUpdating(rolId: number, permisoId: number): boolean {
    return this.updatingSet.has(`${rolId}-${permisoId}`);
  }

  onToggle(rolId: number, permisoId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const key = `${rolId}-${permisoId}`;
    this.updatingSet.add(key);

    if (checkbox.checked) {
      this.permissionsService.assignPermiso(rolId, permisoId).subscribe({
        next: () => {
          this.assignmentMap.set(key, true);
          this.updatingSet.delete(key);
        },
        error: () => {
          checkbox.checked = false;
          this.updatingSet.delete(key);
        },
      });
    } else {
      this.permissionsService.revokePermiso(rolId, permisoId).subscribe({
        next: () => {
          this.assignmentMap.delete(key);
          this.updatingSet.delete(key);
        },
        error: () => {
          checkbox.checked = true;
          this.updatingSet.delete(key);
        },
      });
    }
  }

  navigateToList(): void {
    this.router.navigate(['/permissions']);
  }
}
