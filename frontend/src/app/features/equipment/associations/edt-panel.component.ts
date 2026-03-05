import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../core/design-system/data-grid/aero-data-grid.component';
import { AeroButtonComponent, AeroBadgeComponent } from '../../../core/design-system';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import { ConfirmService } from '../../../core/services/confirm.service';
import {
  EquipoAsociacionesService,
  EquipoEdtLista,
  EquipoEdtCrear,
  ValidacionPorcentaje,
} from './equipo-asociaciones.service';

@Component({
  selector: 'app-edt-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AeroDataGridComponent,
    AeroButtonComponent,
    AeroBadgeComponent,
    PageCardComponent,
  ],
  template: `
    <app-page-card title="EDT (Estructura de Desglose de Trabajo)" [noPadding]="true">
      <div header-actions>
        <aero-button variant="secondary" size="small" iconLeft="fa-plus" (clicked)="toggleForm()">
          {{ showForm ? 'Cancelar' : 'Agregar EDT' }}
        </aero-button>
      </div>

      <!-- Percentage validation bar -->
      <div class="percentage-bar-wrapper">
        <div class="percentage-info">
          <span class="percentage-text">Total: {{ validation.total }}%</span>
          <aero-badge [variant]="validation.valid ? 'success' : 'warning'">
            {{ validation.valid ? 'Completo' : 'Incompleto' }}
          </aero-badge>
        </div>
        <div class="percentage-bar">
          <div
            class="percentage-fill"
            [class.complete]="validation.valid"
            [style.width.%]="clampPercentage(validation.total)"
          ></div>
        </div>
      </div>

      <!-- Inline Add Form -->
      @if (showForm) {
        <div class="form-wrapper">
          <div class="inline-form">
            <div class="form-group">
              <label class="form-label">Nombre EDT</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="formData.edt_nombre"
                placeholder="Nombre del EDT"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Porcentaje (%)</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="formData.porcentaje"
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Actividad</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="formData.actividad"
                placeholder="Descripcion de actividad"
              />
            </div>
            <div class="form-actions">
              <aero-button
                variant="primary"
                size="small"
                iconLeft="fa-check"
                [disabled]="saving"
                (clicked)="addEdt()"
              >
                {{ saving ? 'Guardando...' : 'Agregar' }}
              </aero-button>
            </div>
          </div>
        </div>
      }

      <aero-data-grid
        [columns]="columns"
        [data]="edtList"
        [loading]="loadingList"
        [actionsTemplate]="actionsRef"
        emptyMessage="No hay registros EDT"
        emptyIcon="fa-sitemap"
      ></aero-data-grid>

      <ng-template #actionsRef let-row>
        <div
          class="action-buttons"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="toolbar"
        >
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-trash"
            title="Eliminar"
            (clicked)="deleteEdt(row)"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-card>
  `,
  styles: [
    `
      .percentage-bar-wrapper {
        padding: var(--s-16);
        border-bottom: 1px solid var(--grey-200);
      }
      .percentage-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .percentage-text {
        font-size: 14px;
        font-weight: 600;
        color: var(--grey-700);
      }
      .percentage-bar {
        height: 8px;
        background: var(--grey-200);
        border-radius: 4px;
        overflow: hidden;
      }
      .percentage-fill {
        height: 100%;
        background: var(--semantic-yellow-500, #e5a100);
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      .percentage-fill.complete {
        background: var(--semantic-green-500, #198038);
      }

      .form-wrapper {
        padding: var(--s-16);
        border-bottom: 1px solid var(--grey-200);
        background: var(--grey-50);
      }
      .inline-form {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--s-16);
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .form-label {
        font-size: 12px;
        font-weight: 500;
        color: var(--grey-700);
      }
      .form-control {
        padding: 8px 12px;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-md);
        font-size: 14px;
        background: white;
      }
      .form-control:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 2px rgba(0, 97, 170, 0.15);
      }
      .form-actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: flex-end;
      }

      .action-buttons {
        display: flex;
        gap: 4px;
        justify-content: center;
      }
    `,
  ],
})
export class EdtPanelComponent implements OnInit, OnChanges {
  @Input() parteDiarioId!: string | number;

  private service = inject(EquipoAsociacionesService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  edtList: Record<string, unknown>[] = [];
  loadingList = false;
  saving = false;
  showForm = false;

  validation: ValidacionPorcentaje = { valid: false, total: 0 };

  formData: EquipoEdtCrear = {
    edt_nombre: '',
    porcentaje: undefined,
    actividad: '',
  };

  columns: DataGridColumn[] = [
    {
      key: 'porcentaje',
      label: 'Porcentaje (%)',
      type: 'number',
      align: 'right',
      width: '120px',
      bold: true,
    },
    { key: 'edt_nombre', label: 'EDT', type: 'text' },
    { key: 'actividad', label: 'Actividad', type: 'text' },
  ];

  ngOnInit(): void {
    if (this.parteDiarioId) {
      this.loadData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['parteDiarioId'] && !changes['parteDiarioId'].firstChange) {
      this.loadData();
    }
  }

  loadData(): void {
    if (!this.parteDiarioId) return;
    const id = Number(this.parteDiarioId);
    this.loadingList = true;

    this.service.getEdtList(id).subscribe({
      next: (data) => {
        this.edtList = data as unknown as Record<string, unknown>[];
        this.loadingList = false;
      },
      error: () => {
        this.edtList = [];
        this.loadingList = false;
      },
    });

    this.service.validateEdt(id).subscribe({
      next: (result) => {
        this.validation = result;
      },
      error: () => {
        this.validation = { valid: false, total: 0 };
      },
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.resetForm();
    }
  }

  addEdt(): void {
    if (!this.formData.edt_nombre || !this.formData.porcentaje) {
      this.snackBar.open('Complete nombre EDT y porcentaje', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    this.saving = true;
    const payload: EquipoEdtCrear = {
      parte_diario_id: Number(this.parteDiarioId),
      edt_nombre: this.formData.edt_nombre,
      porcentaje: this.formData.porcentaje,
      actividad: this.formData.actividad,
    };

    this.service.createEdt(payload).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.resetForm();
        this.loadData();
        this.snackBar.open('EDT agregado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Error al agregar EDT', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  deleteEdt(row: Record<string, unknown>): void {
    this.confirmService.confirmDelete('este registro EDT').subscribe((confirmed) => {
      if (confirmed) {
        const id = row['id'] as number;
        this.service.deleteEdt(id).subscribe({
          next: () => {
            this.loadData();
            this.snackBar.open('EDT eliminado', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-success'],
            });
          },
          error: () => {
            this.snackBar.open('Error al eliminar EDT', 'Cerrar', {
              duration: 4000,
              panelClass: ['snackbar-error'],
            });
          },
        });
      }
    });
  }

  clampPercentage(value: number): number {
    return Math.min(Math.max(value, 0), 100);
  }

  private resetForm(): void {
    this.formData = {
      edt_nombre: '',
      porcentaje: undefined,
      actividad: '',
    };
  }
}
