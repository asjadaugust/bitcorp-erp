import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ApprovalService, PlantillaAprobacionDto } from '../../core/services/approval.service';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { AeroButtonComponent } from '../../core/design-system';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-approval-templates-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageLayoutComponent,
    PageCardComponent,
    AeroButtonComponent,
    ActionsContainerComponent,
  ],
  template: `
    <app-page-layout
      title="Plantillas de Aprobación"
      icon="fa-list-check"
      [breadcrumbs]="[
        { label: 'Aprobaciones', url: '/approvals/dashboard' },
        { label: 'Plantillas' },
      ]"
      [loading]="loading()"
    >
      <app-actions-container actions>
        <aero-button
          variant="primary"
          iconLeft="fa-plus"
          (clicked)="router.navigate(['/approvals/templates/new'])"
          >Nueva Plantilla</aero-button
        >
      </app-actions-container>

      <app-page-card [noPadding]="true">
        <div *ngIf="templates().length === 0 && !loading()" class="empty-state">
          <i class="fa-regular fa-folder-open empty-icon"></i>
          <p class="empty-title">Sin plantillas configuradas</p>
          <p class="empty-desc">Crea tu primera plantilla de aprobación</p>
          <aero-button
            variant="primary"
            iconLeft="fa-plus"
            (clicked)="router.navigate(['/approvals/templates/new'])"
            >Crear Plantilla</aero-button
          >
        </div>

        <table class="templates-table" *ngIf="templates().length > 0">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Módulo</th>
              <th>Pasos</th>
              <th>Versión</th>
              <th>Estado</th>
              <th class="actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of templates()">
              <td>
                <strong>{{ t.nombre }}</strong>
                <p class="table-desc" *ngIf="t.descripcion">{{ t.descripcion }}</p>
              </td>
              <td>
                <span class="module-chip module-chip--{{ t.module_name }}">
                  <i class="fa-solid" [class]="getModuleIcon(t.module_name)"></i>
                  {{ getModuleLabel(t.module_name) }}
                </span>
              </td>
              <td>{{ t.pasos?.length ?? 0 }}</td>
              <td>v{{ t.version }}</td>
              <td>
                <span class="estado-pill estado-pill--{{ t.estado.toLowerCase() }}">{{
                  t.estado
                }}</span>
              </td>
              <td>
                <div class="row-actions">
                  <aero-button
                    variant="ghost"
                    iconLeft="fa-edit"
                    (clicked)="router.navigate(['/approvals/templates', t.id, 'edit'])"
                    >Editar</aero-button
                  >
                  <aero-button
                    *ngIf="t.estado !== 'ACTIVO'"
                    variant="ghost"
                    iconLeft="fa-play"
                    (clicked)="confirmActivate(t)"
                    >Activar</aero-button
                  >
                  <aero-button
                    *ngIf="t.estado !== 'ARCHIVADO'"
                    variant="ghost"
                    iconLeft="fa-archive"
                    (clicked)="confirmArchive(t)"
                    >Archivar</aero-button
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </app-page-card>
    </app-page-layout>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .templates-table {
        width: 100%;
        border-collapse: collapse;

        th {
          padding: 10px 16px;
          text-align: left;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--grey-500);
          border-bottom: 1px solid var(--grey-200);
          background: var(--grey-50);
        }

        td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--grey-100);
          font-size: 0.88rem;
          color: var(--grey-700);
          vertical-align: middle;
        }

        tr:last-child td {
          border-bottom: none;
        }

        tr:hover td {
          background: var(--grey-50);
        }
      }

      .actions-col {
        text-align: right;
      }

      .table-desc {
        font-size: 0.78rem;
        color: var(--grey-400);
        margin: 2px 0 0;
      }

      .module-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 9px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      .module-chip--daily_report {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .module-chip--valorizacion {
        background: #d1fae5;
        color: #065f46;
      }
      .module-chip--solicitud_equipo {
        background: #fef3c7;
        color: #92400e;
      }
      .module-chip--adhoc {
        background: #ede9fe;
        color: #5b21b6;
      }

      .estado-pill {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 10px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .estado-pill--activo {
        background: #d1fae5;
        color: #065f46;
      }
      .estado-pill--inactivo {
        background: #fef3c7;
        color: #92400e;
      }
      .estado-pill--archivado {
        background: #f3f4f6;
        color: #374151;
      }

      .row-actions {
        display: flex;
        gap: 4px;
        justify-content: flex-end;
      }

      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--grey-400);
      }

      .empty-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 12px;
        color: var(--grey-300);
      }

      .empty-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--grey-600);
        margin: 0 0 6px;
      }

      .empty-desc {
        font-size: 0.9rem;
        margin: 0 0 16px;
      }
    `,
  ],
})
export class ApprovalTemplatesListComponent implements OnInit {
  router = inject(Router);
  private approvalSvc = inject(ApprovalService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  templates = signal<PlantillaAprobacionDto[]>([]);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.approvalSvc.getTemplates().subscribe({
      next: (data) => {
        this.templates.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  confirmActivate(template: PlantillaAprobacionDto) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Activar Plantilla',
        message: `¿Está seguro de activar la plantilla "${template.nombre}"?`,
        confirmLabel: 'Activar',
        icon: 'fa-play',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.activate(template.id);
    });
  }

  confirmArchive(template: PlantillaAprobacionDto) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Archivar Plantilla',
        message: `¿Está seguro de archivar la plantilla "${template.nombre}"? Las solicitudes existentes no se verán afectadas.`,
        confirmLabel: 'Archivar',
        isDanger: true,
        icon: 'fa-archive',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.archive(template.id);
    });
  }

  private activate(id: number) {
    this.approvalSvc.activateTemplate(id).subscribe({ next: () => this.load() });
  }

  private archive(id: number) {
    this.approvalSvc.archiveTemplate(id).subscribe({ next: () => this.load() });
  }

  getModuleIcon(module: string): string {
    const icons: Record<string, string> = {
      daily_report: 'fa-file-lines',
      valorizacion: 'fa-calculator',
      solicitud_equipo: 'fa-tractor',
      adhoc: 'fa-bolt',
    };
    return icons[module] ?? 'fa-circle';
  }

  getModuleLabel(module: string): string {
    const labels: Record<string, string> = {
      daily_report: 'Parte Diario',
      valorizacion: 'Valorización',
      solicitud_equipo: 'Solicitud Equipo',
      adhoc: 'Ad-hoc',
    };
    return labels[module] ?? module;
  }
}
