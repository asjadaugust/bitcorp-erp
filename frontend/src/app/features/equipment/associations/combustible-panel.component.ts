import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../core/design-system/data-grid/aero-data-grid.component';
import { AeroButtonComponent, AeroDatePickerComponent } from '../../../core/design-system';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import { ConfirmService } from '../../../core/services/confirm.service';
import {
  EquipoAsociacionesService,
  EquipoCombustibleLista,
  EquipoCombustibleCrear,
} from './equipo-asociaciones.service';

@Component({
  selector: 'app-combustible-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AeroDataGridComponent,
    AeroButtonComponent,
    AeroDatePickerComponent,
    PageCardComponent,
  ],
  template: `
    <app-page-card title="Consumo de Combustible" [noPadding]="true">
      <div header-actions>
        <aero-button variant="secondary" size="small" iconLeft="fa-plus" (clicked)="toggleForm()">
          {{ showForm ? 'Cancelar' : 'Agregar Combustible' }}
        </aero-button>
      </div>

      <!-- Inline Add Form -->
      @if (showForm) {
        <div class="form-wrapper">
          <div class="inline-form">
            <div class="form-group">
              <label class="form-label">N. Vale Salida</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="formData.numero_vale_salida"
                placeholder="0"
              />
            </div>
            <div class="form-group">
              <aero-date-picker
                [mode]="'single'"
                [(ngModel)]="formData.fecha"
                [label]="'Fecha'"
              ></aero-date-picker>
            </div>
            <div class="form-group">
              <label class="form-label">Cantidad (gal)</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="formData.cantidad"
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Precio Unit. sin IGV</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="formData.precio_unitario_sin_igv"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Importe (calculado)</label>
              <input
                type="text"
                class="form-control computed"
                [value]="computedImporte | number: '1.2-2'"
                readonly
              />
            </div>
            <div class="form-group">
              <label class="form-label">Comentario</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="formData.comentario"
                placeholder="Comentario opcional"
              />
            </div>
            <div class="form-actions">
              <aero-button
                variant="primary"
                size="small"
                iconLeft="fa-check"
                [disabled]="saving"
                (clicked)="addCombustible()"
              >
                {{ saving ? 'Guardando...' : 'Agregar' }}
              </aero-button>
            </div>
          </div>
        </div>
      }

      <aero-data-grid
        [gridId]="'combustible-panel'"
        [columns]="columns"
        [data]="combustibleList"
        [loading]="loadingList"
        [footerRow]="footerRow"
        [actionsTemplate]="actionsRef"
        emptyMessage="No hay registros de combustible"
        emptyIcon="fa-gas-pump"
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
            (clicked)="deleteCombustible(row)"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-card>
  `,
  styles: [
    `
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
      .form-control.computed {
        background: var(--grey-100);
        font-weight: 600;
        color: var(--grey-700);
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
export class CombustiblePanelComponent implements OnInit, OnChanges {
  @Input() valorizacionLegacyId!: string;

  private service = inject(EquipoAsociacionesService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  combustibleList: Record<string, unknown>[] = [];
  loadingList = false;
  saving = false;
  showForm = false;

  footerRow: Record<string, unknown> | null = null;

  formData: EquipoCombustibleCrear = {
    numero_vale_salida: undefined,
    fecha: '',
    cantidad: undefined,
    precio_unitario_sin_igv: undefined,
    comentario: '',
  };

  columns: DataGridColumn[] = [
    { key: 'numero_vale_salida', label: 'N. Vale', type: 'number', width: '100px' },
    { key: 'fecha', label: 'Fecha', type: 'date', width: '120px' },
    { key: 'cantidad', label: 'Cantidad (gal)', type: 'number', align: 'right', width: '130px' },
    {
      key: 'precio_unitario_sin_igv',
      label: 'Precio Unit.',
      type: 'number',
      align: 'right',
      width: '120px',
    },
    {
      key: 'importe',
      label: 'Importe',
      type: 'number',
      align: 'right',
      width: '120px',
      bold: true,
      footerFn: (data: Record<string, unknown>[]) => {
        const sum = data.reduce((acc, row) => acc + ((row['importe'] as number) || 0), 0);
        return sum.toFixed(2);
      },
    },
    { key: 'comentario', label: 'Comentario', type: 'text' },
  ];

  get computedImporte(): number {
    const cantidad = this.formData.cantidad || 0;
    const precio = this.formData.precio_unitario_sin_igv || 0;
    return cantidad * precio;
  }

  ngOnInit(): void {
    if (this.valorizacionLegacyId) {
      this.loadData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['valorizacionLegacyId'] && !changes['valorizacionLegacyId'].firstChange) {
      this.loadData();
    }
  }

  loadData(): void {
    if (!this.valorizacionLegacyId) return;
    this.loadingList = true;

    this.service.getCombustibleList(this.valorizacionLegacyId).subscribe({
      next: (data) => {
        this.combustibleList = data as unknown as Record<string, unknown>[];
        this.computeFooter();
        this.loadingList = false;
      },
      error: () => {
        this.combustibleList = [];
        this.footerRow = null;
        this.loadingList = false;
      },
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.resetForm();
    }
  }

  addCombustible(): void {
    if (!this.formData.cantidad || !this.formData.precio_unitario_sin_igv) {
      this.snackBar.open('Complete cantidad y precio unitario', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    this.saving = true;
    const payload: EquipoCombustibleCrear = {
      valorizacion_legacy_id: this.valorizacionLegacyId,
      numero_vale_salida: this.formData.numero_vale_salida,
      fecha: this.formData.fecha || undefined,
      cantidad: this.formData.cantidad,
      precio_unitario_sin_igv: this.formData.precio_unitario_sin_igv,
      comentario: this.formData.comentario || undefined,
    };

    this.service.createCombustible(payload).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.resetForm();
        this.loadData();
        this.snackBar.open('Combustible agregado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Error al agregar combustible', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  deleteCombustible(row: Record<string, unknown>): void {
    this.confirmService.confirmDelete('este registro de combustible').subscribe((confirmed) => {
      if (confirmed) {
        const id = row['id'] as number;
        this.service.deleteCombustible(id).subscribe({
          next: () => {
            this.loadData();
            this.snackBar.open('Combustible eliminado', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-success'],
            });
          },
          error: () => {
            this.snackBar.open('Error al eliminar combustible', 'Cerrar', {
              duration: 4000,
              panelClass: ['snackbar-error'],
            });
          },
        });
      }
    });
  }

  private computeFooter(): void {
    if (this.combustibleList.length === 0) {
      this.footerRow = null;
      return;
    }
    const totalImporte = this.combustibleList.reduce(
      (acc, row) => acc + ((row['importe'] as number) || 0),
      0
    );
    this.footerRow = {
      numero_vale_salida: '',
      fecha: '',
      cantidad: '',
      precio_unitario_sin_igv: 'Total:',
      importe: totalImporte,
      comentario: '',
    };
  }

  private resetForm(): void {
    this.formData = {
      numero_vale_salida: undefined,
      fecha: '',
      cantidad: undefined,
      precio_unitario_sin_igv: undefined,
      comentario: '',
    };
  }
}
