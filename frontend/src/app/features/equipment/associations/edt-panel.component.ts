import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../core/design-system/data-grid/aero-data-grid.component';
import { AeroButtonComponent, AeroBadgeComponent } from '../../../core/design-system';
import {
  AeroDropdownComponent,
  DropdownOption,
} from '../../../core/design-system/dropdown/aero-dropdown.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import { ConfirmService } from '../../../core/services/confirm.service';
import { EdtService, EdtDropdownItem } from '../../../core/services/edt.service';
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
    AeroDropdownComponent,
    PageCardComponent,
  ],
  template: `
    <app-page-card title="EDT (Estructura de Desglose de Trabajo)" [noPadding]="true">
      <div header-actions>
        <aero-button
          variant="secondary"
          size="small"
          iconLeft="fa-plus"
          [disabled]="!showForm && validation.total >= 100"
          (clicked)="toggleForm()"
        >
          {{ showForm ? 'Cancelar' : 'Agregar EDT' }}
        </aero-button>
      </div>

      <!-- Error banner -->
      @if (errorMessage) {
        <div class="edt-error-banner">
          <i class="fa-solid fa-circle-exclamation"></i>
          <span>{{ errorMessage }}</span>
          <button class="close-btn" (click)="errorMessage = null">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      }

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
              <aero-dropdown
                [options]="edtOptions"
                [searchable]="true"
                placeholder="Seleccione EDT"
                [(ngModel)]="formData.edt_id"
                (ngModelChange)="onEdtSelected($event)"
              ></aero-dropdown>
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
                [disabled]="
                  saving || !formData.edt_id || !formData.porcentaje || formData.porcentaje <= 0
                "
                (clicked)="addEdt()"
              >
                {{ saving ? 'Guardando...' : 'Agregar' }}
              </aero-button>
            </div>
          </div>
        </div>
      }

      <aero-data-grid
        [gridId]="'edt-panel'"
        [columns]="columns"
        [data]="edtList"
        [loading]="loadingList"
        [templates]="{ porcentaje: porcentajeRef }"
        [actionsTemplate]="actionsRef"
        emptyMessage="No hay registros EDT"
        emptyIcon="fa-sitemap"
      ></aero-data-grid>

      <ng-template #porcentajeRef let-row>
        @if (editingId === row['id']) {
          <div class="inline-edit" (click)="$event.stopPropagation()">
            <input
              type="number"
              class="form-control inline-edit-input"
              [(ngModel)]="editPorcentaje"
              min="0"
              max="100"
              step="0.01"
            />
            <button class="icon-btn confirm" (click)="saveEditPorcentaje(row)" title="Guardar">
              <i class="fa-solid fa-check"></i>
            </button>
            <button class="icon-btn cancel" (click)="cancelEdit()" title="Cancelar">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        } @else {
          <div class="porcentaje-display" (click)="$event.stopPropagation()">
            <span class="porcentaje-value">{{ row['porcentaje'] }}%</span>
            <button class="icon-btn edit" (click)="startEdit(row)" title="Editar porcentaje">
              <i class="fa-solid fa-pencil"></i>
            </button>
          </div>
        }
      </ng-template>

      <!-- Footer with Guardar -->
      <div class="edt-footer">
        <aero-button
          variant="primary"
          size="small"
          iconLeft="fa-check"
          [disabled]="!validation.valid"
          (clicked)="save()"
        >
          Guardar
        </aero-button>
      </div>

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
      .edt-error-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px var(--s-16);
        background: var(--semantic-red-50, #fff1f1);
        color: var(--semantic-red-700, #da1e28);
        font-size: 13px;
        font-weight: 500;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .edt-error-banner .close-btn {
        margin-left: auto;
        background: none;
        border: none;
        color: var(--semantic-red-700, #da1e28);
        cursor: pointer;
        padding: 2px 6px;
        font-size: 14px;
      }

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

      .porcentaje-display {
        display: flex;
        align-items: center;
        gap: 6px;
        justify-content: flex-end;
      }
      .porcentaje-value {
        font-weight: 600;
      }

      .inline-edit {
        display: flex;
        align-items: center;
        gap: 4px;
        justify-content: flex-end;
      }
      .inline-edit-input {
        width: 80px;
        padding: 4px 8px;
        text-align: right;
      }

      .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: var(--radius-md);
        font-size: 12px;
        line-height: 1;
      }
      .icon-btn.edit {
        color: var(--grey-500);
        opacity: 0.5;
        transition: opacity 0.15s;
      }
      .icon-btn.edit:hover {
        opacity: 1;
        color: var(--primary-500);
      }
      .icon-btn.confirm {
        color: var(--semantic-green-500, #198038);
      }
      .icon-btn.cancel {
        color: var(--semantic-red-500, #da1e28);
      }

      .edt-footer {
        display: flex;
        justify-content: flex-end;
        padding: var(--s-16);
        border-top: 1px solid var(--grey-200);
      }
    `,
  ],
})
export class EdtPanelComponent implements OnInit, OnChanges {
  @Input() parteDiarioId!: string | number;
  @Output() saved = new EventEmitter<void>();

  private service = inject(EquipoAsociacionesService);
  private confirmService = inject(ConfirmService);
  private edtService = inject(EdtService);

  edtList: Record<string, unknown>[] = [];
  edtOptions: DropdownOption[] = [];
  private edtDropdownItems: EdtDropdownItem[] = [];
  loadingList = false;
  saving = false;
  showForm = false;
  errorMessage: string | null = null;

  editingId: number | null = null;
  editPorcentaje = 0;

  validation: ValidacionPorcentaje = { valid: false, total: 0 };

  formData: EquipoEdtCrear = {
    edt_id: undefined,
    edt_nombre: '',
    porcentaje: undefined,
    actividad: '',
  };

  columns: DataGridColumn[] = [
    {
      key: 'porcentaje',
      label: 'Porcentaje (%)',
      type: 'template',
      align: 'right',
      width: '160px',
    },
    { key: 'edt_nombre', label: 'EDT', type: 'text' },
    { key: 'actividad', label: 'Actividad', type: 'text' },
  ];

  ngOnInit(): void {
    this.loadEdtOptions();
    if (this.parteDiarioId) {
      this.loadData();
    }
  }

  loadEdtOptions(): void {
    this.edtService.getDropdownOptions().subscribe({
      next: (items) => {
        this.edtDropdownItems = items;
        this.edtOptions = items.map((e) => ({
          value: e.id,
          label: `[${e.codigo}]${e.codigo_alfanumerico ? ' ' + e.codigo_alfanumerico + ' —' : ''} ${e.nombre}`,
        }));
      },
      error: () => {
        this.edtOptions = [];
      },
    });
  }

  onEdtSelected(edtId: unknown): void {
    const item = this.edtDropdownItems.find((e) => e.id === edtId);
    if (item) {
      this.formData.edt_nombre = item.nombre;
      this.formData.edt_id = item.id;
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
      this.errorMessage = null;
    }
  }

  addEdt(): void {
    if (!this.formData.edt_id || !this.formData.porcentaje) {
      return;
    }

    const projectedTotal = (this.validation?.total || 0) + this.formData.porcentaje;
    if (projectedTotal > 100) {
      this.errorMessage = `No se puede agregar. El total sería ${projectedTotal}% (máximo 100%).`;
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    const payload: EquipoEdtCrear = {
      parte_diario_id: Number(this.parteDiarioId),
      edt_id: this.formData.edt_id,
      edt_nombre: this.formData.edt_nombre,
      porcentaje: this.formData.porcentaje,
      actividad: this.formData.actividad,
    };

    this.service.createEdt(payload).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.errorMessage = null;
        this.resetForm();
        this.loadData();
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Error al agregar EDT.';
      },
    });
  }

  startEdit(row: Record<string, unknown>): void {
    this.editingId = row['id'] as number;
    this.editPorcentaje = (row['porcentaje'] as number) || 0;
    this.errorMessage = null;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editPorcentaje = 0;
    this.errorMessage = null;
  }

  saveEditPorcentaje(row: Record<string, unknown>): void {
    const id = row['id'] as number;
    const oldValue = (row['porcentaje'] as number) || 0;
    const newValue = this.editPorcentaje;

    if (newValue <= 0) {
      this.errorMessage = 'El porcentaje debe ser mayor a 0%.';
      return;
    }

    const projectedTotal = (this.validation?.total || 0) - oldValue + newValue;
    if (projectedTotal > 100) {
      this.errorMessage = `No se puede guardar. El total sería ${projectedTotal}% (máximo 100%).`;
      return;
    }

    this.errorMessage = null;
    this.service.updateEdt(id, { porcentaje: newValue }).subscribe({
      next: () => {
        this.editingId = null;
        this.editPorcentaje = 0;
        this.loadData();
      },
      error: () => {
        this.errorMessage = 'Error al actualizar porcentaje.';
      },
    });
  }

  deleteEdt(row: Record<string, unknown>): void {
    this.confirmService.confirmDelete('este registro EDT').subscribe((confirmed) => {
      if (confirmed) {
        const id = row['id'] as number;
        this.service.deleteEdt(id).subscribe({
          next: () => {
            this.errorMessage = null;
            this.loadData();
          },
          error: () => {
            this.errorMessage = 'Error al eliminar EDT.';
          },
        });
      }
    });
  }

  save(): void {
    if (this.validation.valid) {
      this.saved.emit();
    }
  }

  clampPercentage(value: number): number {
    return Math.min(Math.max(value, 0), 100);
  }

  private resetForm(): void {
    this.formData = {
      edt_id: undefined,
      edt_nombre: '',
      porcentaje: undefined,
      actividad: '',
    };
  }
}
