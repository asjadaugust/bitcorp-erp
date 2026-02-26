import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TimesheetService } from '../../core/services/timesheet.service';
import { Timesheet } from '../../core/models/scheduling.model';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';
import { EntityDetailShellComponent } from '../../shared/components/entity-detail/entity-detail-shell.component';
import {
  EntityDetailHeader,
  AuditInfo,
  NotFoundConfig,
} from '../../shared/components/entity-detail/entity-detail.types';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ConfirmService } from '../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-timesheet-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AeroTableComponent,
    StatsGridComponent,
    EntityDetailShellComponent,
    ButtonComponent,
  ],
  template: `
    <app-entity-detail-shell
      [loading]="loading"
      [entity]="timesheet"
      [header]="header"
      [auditInfo]="auditInfo"
      [notFound]="notFoundConfig"
    >
      <!-- Stats below header -->
      <div entity-header-below *ngIf="timesheet">
        <app-stats-grid [items]="statItems" testId="timesheet-summary-stats"></app-stats-grid>
      </div>

      <!-- Main Content -->
      <div entity-main-content class="detail-sections" *ngIf="timesheet">
        <div class="detail-section">
          <h2>Detalle Diario</h2>
          <aero-table
            [columns]="columns"
            [data]="timesheet.details || []"
            [templates]="{
              project: projectTemplate,
              equipment: equipmentTemplate,
              hours: hoursTemplate,
            }"
          >
          </aero-table>

          <ng-template #projectTemplate let-row>
            {{ row.project?.G00007_Nombre || '-' }}
          </ng-template>

          <ng-template #equipmentTemplate let-row>
            {{ row.equipment?.C08001_Nombre || '-' }}
          </ng-template>

          <ng-template #hoursTemplate let-row>
            <strong>{{ row.hours_worked }}</strong>
          </ng-template>
        </div>

        <div class="detail-section" *ngIf="timesheet.observaciones">
          <h2>Observaciones</h2>
          <p class="text-body">{{ timesheet.observaciones }}</p>
        </div>
      </div>

      <!-- Sidebar Actions -->
      <ng-container entity-sidebar-actions *ngIf="timesheet">
        <app-button
          *ngIf="timesheet.estado === 'BORRADOR'"
          variant="primary"
          icon="fa-paper-plane"
          label="Enviar Planilla"
          [fullWidth]="true"
          (clicked)="submitTimesheet()"
        ></app-button>
        <app-button
          *ngIf="timesheet.estado === 'ENVIADO'"
          variant="primary"
          icon="fa-check"
          label="Aprobar Planilla"
          [fullWidth]="true"
          (clicked)="approveTimesheet()"
        ></app-button>
        <app-button
          *ngIf="timesheet.estado === 'ENVIADO'"
          variant="danger"
          icon="fa-xmark"
          label="Rechazar Planilla"
          [fullWidth]="true"
          (clicked)="rejectTimesheet()"
        ></app-button>
        <app-button
          variant="ghost"
          icon="fa-arrow-left"
          label="Volver a Lista"
          [fullWidth]="true"
          routerLink="/operaciones/timesheets"
        ></app-button>
      </ng-container>
    </app-entity-detail-shell>
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);
      }

      .detail-section h2 {
        font-size: var(--type-h3-size);
        font-weight: 700;
        color: var(--grey-900);
        margin-bottom: var(--s-16);
      }

      .text-body {
        color: var(--grey-700);
        line-height: 1.6;
      }
    `,
  ],
})
export class TimesheetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private timesheetService = inject(TimesheetService);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  timesheet: Timesheet | null = null;
  loading = true;
  statItems: StatItem[] = [];

  header: EntityDetailHeader = {
    title: 'Detalle de Planilla',
    statusLabel: '',
    statusClass: '',
  };

  auditInfo: AuditInfo = { entries: [] };

  notFoundConfig: NotFoundConfig = {
    icon: 'fa-solid fa-clipboard-user',
    title: 'Planilla no encontrada',
    message: 'No se pudo cargar la planilla solicitada.',
    backLabel: 'Volver a Planillas',
    backRoute: '/operaciones/timesheets',
  };

  columns: TableColumn[] = [
    { key: 'work_date', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy' },
    { key: 'project', label: 'Proyecto', type: 'template' },
    { key: 'equipment', label: 'Equipo', type: 'template' },
    { key: 'start_time', label: 'Hora Inicio', type: 'text' },
    { key: 'end_time', label: 'Hora Fin', type: 'text' },
    { key: 'hours', label: 'Horas', type: 'template' },
    { key: 'notes', label: 'Notas', type: 'text' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTimesheet(parseInt(id));
    } else {
      this.loading = false;
    }
  }

  loadTimesheet(id: number) {
    this.loading = true;
    this.timesheetService.getTimesheetById(id).subscribe({
      next: (res) => {
        this.timesheet = res;
        this.updateHeader();
        this.calculateStatItems();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.timesheet = null;
        console.error(err);
      },
    });
  }

  private updateHeader(): void {
    if (!this.timesheet) return;

    const statusMap: Record<string, { label: string; css: string }> = {
      BORRADOR: { label: 'Borrador', css: 'status-PENDIENTE' },
      ENVIADO: { label: 'Enviado', css: 'status-PENDIENTE' },
      APROBADO: { label: 'Aprobado', css: 'status-APROBADO' },
      RECHAZADO: { label: 'Rechazado', css: 'status-CANCELADO' },
    };

    const status = statusMap[this.timesheet.estado || ''] || {
      label: this.timesheet.estado || '',
      css: '',
    };

    this.header = {
      icon: 'fa-solid fa-clipboard-user',
      title: `Planilla #${this.timesheet.id}`,
      subtitle: this.timesheet.trabajador?.nombre_completo || '',
      statusLabel: status.label,
      statusClass: status.css,
    };

    this.auditInfo = {
      entries: [
        { label: 'Período', date: this.timesheet.periodo },
        { label: 'Creado', date: this.timesheet.createdAt as string },
        { label: 'Actualizado', date: this.timesheet.updatedAt as string },
      ],
    };
  }

  calculateStatItems() {
    if (!this.timesheet) return;

    this.statItems = [
      {
        label: 'ID Tareo',
        value: `#${this.timesheet.id}`,
        icon: 'fa-hashtag',
        color: 'primary',
        testId: 'timesheet-id',
      },
      {
        label: 'Total Horas',
        value: `${this.timesheet.totalHoras} hrs`,
        icon: 'fa-clock',
        color: 'info',
        testId: 'total-hours',
      },
      {
        label: 'Días Trabajados',
        value: this.timesheet.totalDiasTrabajados,
        icon: 'fa-calendar-check',
        color: 'success',
        testId: 'total-days',
      },
      {
        label: 'Monto Calculado',
        value: this.formatCurrency(this.timesheet.montoCalculado || 0),
        icon: 'fa-money-bill-wave',
        color: 'warning',
        testId: 'calculated-amount',
      },
    ];
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(value);
  }

  submitTimesheet() {
    if (!this.timesheet) return;
    this.confirmSvc
      .confirm({
        title: 'Enviar Planilla',
        message: '¿Está seguro de enviar esta planilla para aprobación?',
        icon: 'fa-paper-plane',
        confirmLabel: 'Enviar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.timesheetService.submitTimesheet(this.timesheet!.id).subscribe({
            next: (res) => {
              this.timesheet = res;
              this.updateHeader();
              this.snackBar.open('Planilla enviada exitosamente', 'Cerrar', { duration: 3000 });
            },
            error: () =>
              this.snackBar.open('Error al enviar planilla', 'Cerrar', { duration: 3000 }),
          });
        }
      });
  }

  approveTimesheet() {
    if (!this.timesheet) return;
    this.confirmSvc
      .confirm({
        title: 'Aprobar Planilla',
        message: '¿Está seguro de aprobar esta planilla?',
        icon: 'fa-check',
        confirmLabel: 'Aprobar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.timesheetService.approveTimesheet(this.timesheet!.id).subscribe({
            next: (res) => {
              this.timesheet = res;
              this.updateHeader();
              this.snackBar.open('Planilla aprobada', 'Cerrar', { duration: 3000 });
            },
            error: () =>
              this.snackBar.open('Error al aprobar planilla', 'Cerrar', { duration: 3000 }),
          });
        }
      });
  }

  rejectTimesheet() {
    if (!this.timesheet) return;
    this.confirmSvc
      .prompt({
        title: 'Rechazar Planilla',
        message: '¿Está seguro de rechazar esta planilla?',
        icon: 'fa-xmark',
        confirmLabel: 'Rechazar',
        isDanger: true,
        inputLabel: 'Motivo del rechazo',
        inputPlaceholder: 'Ingrese el motivo del rechazo...',
        inputRequired: true,
      })
      .subscribe((reason) => {
        if (reason) {
          this.timesheetService.rejectTimesheet(this.timesheet!.id, reason).subscribe({
            next: (res) => {
              this.timesheet = res;
              this.updateHeader();
              this.snackBar.open('Planilla rechazada', 'Cerrar', { duration: 3000 });
            },
            error: () =>
              this.snackBar.open('Error al rechazar planilla', 'Cerrar', { duration: 3000 }),
          });
        }
      });
  }
}
