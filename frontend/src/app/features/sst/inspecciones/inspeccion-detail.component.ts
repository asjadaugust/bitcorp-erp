import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  InspeccionSsomaService,
  InspeccionSsomaDetalle,
  SeguimientoInspeccion,
} from './inspeccion-ssoma.service';
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
  selector: 'app-inspeccion-detail',
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
      title="Detalle Inspección"
      icon="fa-magnifying-glass"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <aero-button variant="secondary" iconLeft="fa-pen" (clicked)="editInspeccion()">
          Editar
        </aero-button>
        <aero-button
          variant="secondary"
          iconLeft="fa-trash"
          [disabled]="deleting"
          (clicked)="deleteInspeccion()"
        >
          {{ deleting ? 'Eliminando...' : 'Eliminar' }}
        </aero-button>
        <aero-button variant="tertiary" iconLeft="fa-arrow-left" (clicked)="goBack()">
          Volver a Lista
        </aero-button>
      </app-actions-container>

      @if (inspeccion) {
        <app-page-card title="Información del Hallazgo">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Fecha</span>
              <p class="value">{{ inspeccion.fecha_hallazgo | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Lugar</span>
              <p class="value">{{ inspeccion.lugar_hallazgo || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Tipo</span>
              <p class="value">{{ inspeccion.tipo_inspeccion || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Inspector</span>
              <p class="value">{{ inspeccion.inspector || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Nivel Riesgo</span>
              <p>
                <aero-badge [variant]="getRiskVariant(inspeccion.nivel_riesgo)">
                  {{ inspeccion.nivel_riesgo || '-' }}
                </aero-badge>
              </p>
            </div>
            <div class="info-item">
              <span class="label">Estado</span>
              <p>
                <aero-badge [variant]="getEstadoVariant(inspeccion.estado)">
                  {{ inspeccion.estado || '-' }}
                </aero-badge>
              </p>
            </div>
            <div class="info-item full-width">
              <span class="label">Descripción</span>
              <p class="value">{{ inspeccion.descripcion_hallazgo || '-' }}</p>
            </div>
            <div class="info-item full-width">
              <span class="label">Causas</span>
              <p class="value">{{ inspeccion.causas_hallazgo || '-' }}</p>
            </div>
          </div>
        </app-page-card>

        <app-page-card title="Subsanación">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Responsable</span>
              <p class="value">{{ inspeccion.responsable_subsanacion || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Fecha Subsanación</span>
              <p class="value">{{ inspeccion.fecha_subsanacion | date: 'dd/MM/yyyy' }}</p>
            </div>
          </div>
        </app-page-card>

        <app-page-card title="Seguimientos" [noPadding]="true">
          <div header-actions>
            <aero-button
              variant="secondary"
              size="small"
              iconLeft="fa-plus"
              (clicked)="toggleSeguimientoForm()"
            >
              {{ showSeguimientoForm ? 'Cancelar' : 'Agregar Seguimiento' }}
            </aero-button>
          </div>

          @if (showSeguimientoForm) {
            <div class="seguimiento-form-wrapper">
              <form [formGroup]="seguimientoForm" class="seguimiento-form">
                <div class="form-group">
                  <label class="form-label">Inspector</label>
                  <input
                    type="text"
                    formControlName="inspector"
                    class="form-control"
                    placeholder="Nombre del inspector"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Avance Estimado (%)</label>
                  <input
                    type="number"
                    formControlName="avance_estimado"
                    class="form-control"
                    min="0"
                    max="100"
                    placeholder="0-100"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha Próxima Inspección</label>
                  <input
                    type="date"
                    formControlName="fecha_proxima_inspeccion"
                    class="form-control"
                  />
                </div>
                <div class="form-group full-width">
                  <label class="form-label">Descripción</label>
                  <textarea
                    formControlName="descripcion_inspeccion"
                    class="form-control"
                    rows="3"
                    placeholder="Describa las observaciones del seguimiento..."
                  ></textarea>
                </div>
                <div class="form-actions">
                  <aero-button
                    variant="primary"
                    size="small"
                    iconLeft="fa-save"
                    [disabled]="savingSeguimiento"
                    (clicked)="saveSeguimiento()"
                  >
                    {{ savingSeguimiento ? 'Guardando...' : 'Guardar Seguimiento' }}
                  </aero-button>
                </div>
              </form>
            </div>
          }

          <aero-data-grid
            [columns]="seguimientoColumns"
            [data]="inspeccion.seguimientos"
            [loading]="loading"
            [dense]="true"
            [actions]="seguimientoActions"
            (actionClick)="onSeguimientoAction($event)"
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

      .seguimiento-form-wrapper {
        padding: var(--s-16);
        border-bottom: 1px solid var(--grey-200);
        background: var(--grey-50);
      }

      .seguimiento-form {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--s-16);
      }

      .seguimiento-form .full-width {
        grid-column: 1 / -1;
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

      textarea.form-control {
        resize: vertical;
      }

      .form-actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: flex-end;
      }
    `,
  ],
})
export class InspeccionDetailComponent implements OnInit {
  private readonly service = inject(InspeccionSsomaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmService = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);

  inspeccion: InspeccionSsomaDetalle | null = null;
  loading = true;
  deleting = false;
  showSeguimientoForm = false;
  savingSeguimiento = false;

  seguimientoForm!: FormGroup;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'SST', url: '/sst' },
    { label: 'Inspecciones', url: '/sst/inspecciones' },
    { label: 'Detalle' },
  ];

  seguimientoColumns: DataGridColumn[] = [
    { key: 'fecha', label: 'Fecha', type: 'date', sortable: true },
    { key: 'inspector', label: 'Inspector', type: 'text' },
    { key: 'descripcion_inspeccion', label: 'Descripci\u00f3n', type: 'text' },
    { key: 'avance_estimado', label: 'Avance (%)', type: 'number', align: 'right' },
  ];

  seguimientoActions = [{ key: 'delete', label: 'Eliminar', icon: 'fa-trash' }];

  ngOnInit(): void {
    this.initSeguimientoForm();
    const id = +this.route.snapshot.params['id'];
    this.loadInspeccion(id);
  }

  initSeguimientoForm(): void {
    this.seguimientoForm = this.fb.group({
      inspector: [''],
      descripcion_inspeccion: [''],
      avance_estimado: [null],
      fecha_proxima_inspeccion: [''],
    });
  }

  loadInspeccion(id: number): void {
    this.loading = true;
    this.service.getInspeccion(id).subscribe({
      next: (data) => {
        this.inspeccion = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/sst/inspecciones']);
      },
    });
  }

  getRiskVariant(nivel: string | null): 'error' | 'warning' | 'success' | 'neutral' {
    switch (nivel) {
      case 'ALTO':
        return 'error';
      case 'MEDIO':
        return 'warning';
      case 'BAJO':
        return 'success';
      default:
        return 'neutral';
    }
  }

  getEstadoVariant(estado: string | null): 'warning' | 'info' | 'success' | 'neutral' {
    switch (estado) {
      case 'ABIERTO':
        return 'warning';
      case 'EN PROCESO':
        return 'info';
      case 'CERRADO':
        return 'success';
      default:
        return 'neutral';
    }
  }

  toggleSeguimientoForm(): void {
    this.showSeguimientoForm = !this.showSeguimientoForm;
    if (this.showSeguimientoForm) {
      this.seguimientoForm.reset();
    }
  }

  saveSeguimiento(): void {
    if (!this.inspeccion) return;
    this.savingSeguimiento = true;

    const payload = { ...this.seguimientoForm.value };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '' || payload[key] === null) payload[key] = null;
    });

    this.service.createSeguimiento(this.inspeccion.id, payload).subscribe({
      next: () => {
        this.savingSeguimiento = false;
        this.showSeguimientoForm = false;
        this.loadInspeccion(this.inspeccion!.id);
      },
      error: () => {
        this.savingSeguimiento = false;
      },
    });
  }

  onSeguimientoAction(event: { action: string; row: SeguimientoInspeccion }): void {
    if (event.action === 'delete') {
      this.deleteSeguimiento(event.row);
    }
  }

  deleteSeguimiento(seguimiento: SeguimientoInspeccion): void {
    if (!this.inspeccion) return;

    this.confirmService.confirmDelete('este seguimiento').subscribe((confirmed) => {
      if (confirmed && this.inspeccion) {
        this.service.deleteSeguimiento(this.inspeccion.id, seguimiento.id).subscribe({
          next: () => {
            this.loadInspeccion(this.inspeccion!.id);
          },
        });
      }
    });
  }

  editInspeccion(): void {
    if (this.inspeccion) {
      this.router.navigate(['/sst/inspecciones', this.inspeccion.id, 'edit']);
    }
  }

  deleteInspeccion(): void {
    if (!this.inspeccion) return;

    this.confirmService.confirmDelete('esta inspecci\u00f3n').subscribe((confirmed) => {
      if (confirmed && this.inspeccion) {
        this.deleting = true;
        this.service.deleteInspeccion(this.inspeccion.id).subscribe({
          next: () => {
            this.router.navigate(['/sst/inspecciones']);
          },
          error: () => {
            this.deleting = false;
          },
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/sst/inspecciones']);
  }
}
