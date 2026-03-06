import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  WorkerRegistryService,
  RegistroTrabajadorDetalle,
  ComportamientoHistorico,
} from './worker-registry.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../core/design-system/data-grid/aero-data-grid.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import { ActionsContainerComponent } from '../../../shared/components/actions-container/actions-container.component';
import { AeroButtonComponent, AeroBadgeComponent } from '../../../core/design-system';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-registro-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    PageCardComponent,
    ActionsContainerComponent,
    AeroButtonComponent,
    AeroBadgeComponent,
  ],
  template: `
    <app-page-layout
      title="Detalle Registro Trabajador"
      icon="fa-id-card"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      backUrl="/rrhh/worker-registry"
    >
      <app-actions-container actions>
        <aero-button variant="secondary" iconLeft="fa-pen" (clicked)="editRegistro()">
          Editar
        </aero-button>
        <aero-button
          variant="secondary"
          iconLeft="fa-trash"
          [disabled]="deleting"
          (clicked)="deleteRegistro()"
        >
          {{ deleting ? 'Eliminando...' : 'Eliminar' }}
        </aero-button>
      </app-actions-container>

      @if (registro) {
        <app-page-card title="Informacion del Trabajador">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">DNI</span>
              <p class="value">{{ registro.trabajador_dni }}</p>
            </div>
            <div class="info-item">
              <span class="label">RUC Proveedor</span>
              <p class="value">{{ registro.proveedor_ruc || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Fecha Ingreso</span>
              <p class="value">{{ registro.fecha_ingreso | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Fecha Cese</span>
              <p class="value">
                {{ registro.fecha_cese ? (registro.fecha_cese | date: 'dd/MM/yyyy') : '-' }}
              </p>
            </div>
            <div class="info-item">
              <span class="label">Estado</span>
              <p>
                <aero-badge [variant]="getEstadoVariant(registro.estatus)">
                  {{ registro.estatus }}
                </aero-badge>
              </p>
            </div>
            <div class="info-item">
              <span class="label">Sub Grupo</span>
              <p class="value">{{ registro.sub_grupo || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Registrado Por</span>
              <p class="value">{{ registro.registrado_por || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Fecha Registro</span>
              <p class="value">{{ registro.fecha_registro | date: 'dd/MM/yyyy' }}</p>
            </div>
          </div>
        </app-page-card>

        <app-page-card title="Historial Laboral" [noPadding]="true">
          <div header-actions>
            <aero-button
              variant="secondary"
              size="small"
              iconLeft="fa-plus"
              (clicked)="toggleHistorialForm()"
            >
              {{ showHistorialForm ? 'Cancelar' : 'Agregar Historial' }}
            </aero-button>
          </div>

          @if (showHistorialForm) {
            <div class="historial-form-wrapper">
              <form [formGroup]="historialForm" class="historial-form">
                <div class="form-group">
                  <label class="form-label">Cargo</label>
                  <input
                    type="text"
                    formControlName="cargo"
                    class="form-control"
                    placeholder="Cargo del trabajador"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Salario</label>
                  <input
                    type="number"
                    formControlName="salario"
                    class="form-control"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha Inicio</label>
                  <input type="date" formControlName="fecha_inicio" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha Fin</label>
                  <input type="date" formControlName="fecha_fin" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="form-label">Numero Contrato</label>
                  <input
                    type="text"
                    formControlName="numero_contrato"
                    class="form-control"
                    placeholder="Ej: C-001"
                  />
                </div>
                <div class="form-actions">
                  <aero-button
                    variant="primary"
                    size="small"
                    iconLeft="fa-save"
                    [disabled]="savingHistorial"
                    (clicked)="saveHistorial()"
                  >
                    {{ savingHistorial ? 'Guardando...' : 'Guardar Historial' }}
                  </aero-button>
                </div>
              </form>
            </div>
          }

          <aero-data-grid
            [gridId]="'registro-trabajador-detail'"
            [columns]="historialColumns"
            [data]="registro.comportamiento_historico"
            [loading]="loading"
            [dense]="true"
            [actions]="historialActions"
            (actionClick)="onHistorialAction($event)"
          >
          </aero-data-grid>
        </app-page-card>
      }
    </app-page-layout>
  `,
  styles: [
    `
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--s-16);
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .info-item.full-width {
        grid-column: 1 / -1;
      }

      .label {
        font-size: 12px;
        font-weight: 500;
        color: var(--grey-500);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .value {
        font-size: 14px;
        font-weight: 500;
        color: var(--grey-900);
        margin: 0;
      }

      .historial-form-wrapper {
        padding: var(--s-16);
        border-bottom: 1px solid var(--grey-200);
        background: var(--grey-50);
      }

      .historial-form {
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
    `,
  ],
})
export class RegistroDetailComponent implements OnInit {
  private readonly service = inject(WorkerRegistryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmService = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);

  registro: RegistroTrabajadorDetalle | null = null;
  loading = true;
  deleting = false;
  showHistorialForm = false;
  savingHistorial = false;

  historialForm!: FormGroup;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'RRHH', url: '/rrhh' },
    { label: 'Registro', url: '/rrhh/worker-registry' },
    { label: 'Detalle' },
  ];

  historialColumns: DataGridColumn[] = [
    { key: 'cargo', label: 'Cargo', type: 'text' },
    { key: 'salario', label: 'Salario', type: 'number', align: 'right' },
    { key: 'fecha_inicio', label: 'Inicio', type: 'date', sortable: true },
    { key: 'fecha_fin', label: 'Fin', type: 'date' },
    { key: 'numero_contrato', label: 'Contrato', type: 'text' },
  ];

  historialActions = [{ key: 'delete', label: 'Eliminar', icon: 'fa-trash' }];

  ngOnInit(): void {
    this.initHistorialForm();
    const id = +this.route.snapshot.params['id'];
    this.loadRegistro(id);
  }

  initHistorialForm(): void {
    this.historialForm = this.fb.group({
      cargo: [''],
      salario: [null],
      fecha_inicio: [''],
      fecha_fin: [''],
      numero_contrato: [''],
    });
  }

  loadRegistro(id: number): void {
    this.loading = true;
    this.service.getRegistro(id).subscribe({
      next: (data) => {
        this.registro = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/rrhh/worker-registry']);
      },
    });
  }

  getEstadoVariant(estatus: string | null): 'success' | 'error' | 'warning' | 'neutral' {
    switch (estatus) {
      case 'ACTIVO':
        return 'success';
      case 'CESADO':
        return 'error';
      case 'SUSPENDIDO':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  toggleHistorialForm(): void {
    this.showHistorialForm = !this.showHistorialForm;
    if (this.showHistorialForm) {
      this.historialForm.reset();
    }
  }

  saveHistorial(): void {
    if (!this.registro) return;
    this.savingHistorial = true;

    const payload = { ...this.historialForm.value };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '' || payload[key] === null) payload[key] = null;
    });

    this.service.addComportamiento(this.registro.id, payload).subscribe({
      next: () => {
        this.savingHistorial = false;
        this.showHistorialForm = false;
        this.loadRegistro(this.registro!.id);
      },
      error: () => {
        this.savingHistorial = false;
      },
    });
  }

  onHistorialAction(event: { action: string; row: ComportamientoHistorico }): void {
    if (event.action === 'delete') {
      this.deleteHistorial(event.row);
    }
  }

  deleteHistorial(historial: ComportamientoHistorico): void {
    if (!this.registro) return;

    this.confirmService.confirmDelete('este registro de historial').subscribe((confirmed) => {
      if (confirmed && this.registro) {
        this.service.deleteComportamiento(this.registro.id, historial.id).subscribe({
          next: () => {
            this.loadRegistro(this.registro!.id);
          },
        });
      }
    });
  }

  editRegistro(): void {
    if (this.registro) {
      this.router.navigate(['/rrhh/worker-registry', this.registro.id, 'edit']);
    }
  }

  deleteRegistro(): void {
    if (!this.registro) return;

    this.confirmService.confirmDelete('este registro de trabajador').subscribe((confirmed) => {
      if (confirmed && this.registro) {
        this.deleting = true;
        this.service.deleteRegistro(this.registro.id).subscribe({
          next: () => {
            this.router.navigate(['/rrhh/worker-registry']);
          },
          error: () => {
            this.deleting = false;
          },
        });
      }
    });
  }
}
