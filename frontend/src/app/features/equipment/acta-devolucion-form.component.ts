import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ActaDevolucionService, ActaDevolucion } from '../../core/services/acta-devolucion.service';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../shared/components/page-layout/page-layout.component';
import { ConfirmService } from '../../core/services/confirm.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-acta-devolucion-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageLayoutComponent],
  template: `
    <app-page-layout
      [title]="isEdit ? 'Editar Acta' : 'Nueva Acta de Devolución'"
      icon="fa-file-signature"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <div class="form-container">
        <form (ngSubmit)="guardar()" #f="ngForm">
          <div class="form-grid">
            <div class="form-group">
              <span class="form-label required">ID Equipo</span>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.equipo_id"
                name="equipo_id"
                required
                min="1"
                placeholder="Número de ID del equipo"
              />
            </div>

            <div class="form-group">
              <span class="form-label required">Fecha de Devolución</span>
              <input
                type="date"
                class="form-control"
                [(ngModel)]="form.fecha_devolucion"
                name="fecha_devolucion"
                required
              />
            </div>

            <div class="form-group">
              <span class="form-label">Tipo de Acta</span>
              <select class="form-select" [(ngModel)]="form.tipo" name="tipo">
                <option value="DEVOLUCION">Devolución</option>
                <option value="DESMOBILIZACION">Desmovilización</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>

            <div class="form-group">
              <span class="form-label">Condición del Equipo</span>
              <select
                class="form-select"
                [(ngModel)]="form.condicion_equipo"
                name="condicion_equipo"
              >
                <option value="BUENO">Bueno</option>
                <option value="REGULAR">Regular</option>
                <option value="MALO">Malo</option>
                <option value="CON_OBSERVACIONES">Con Observaciones</option>
              </select>
            </div>

            <div class="form-group">
              <span class="form-label">Horómetro (horas)</span>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.horometro_devolucion"
                name="horometro_devolucion"
                step="0.01"
                min="0"
              />
            </div>

            <div class="form-group">
              <span class="form-label">Kilometraje (km)</span>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.kilometraje_devolucion"
                name="kilometraje_devolucion"
                step="0.01"
                min="0"
              />
            </div>

            <div class="form-group">
              <span class="form-label">ID Contrato (opcional)</span>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.contrato_id"
                name="contrato_id"
                min="1"
              />
            </div>

            <div class="form-group">
              <span class="form-label">ID Proyecto (opcional)</span>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.proyecto_id"
                name="proyecto_id"
                min="1"
              />
            </div>

            <div class="form-group span-2">
              <span class="form-label">Observaciones Generales</span>
              <textarea
                class="form-control"
                [(ngModel)]="form.observaciones"
                name="observaciones"
                rows="2"
              ></textarea>
            </div>

            <div class="form-group span-2">
              <span class="form-label">Observaciones Físicas / Daños</span>
              <textarea
                class="form-control"
                [(ngModel)]="form.observaciones_fisicas"
                name="observaciones_fisicas"
                rows="3"
                placeholder="Describir daños físicos, piezas faltantes, etc..."
              ></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline-secondary" (click)="cancelar(f)">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="saving || f.invalid">
              <i class="fa-solid fa-save"></i>
              {{ saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Acta' }}
            </button>
          </div>
        </form>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .form-container {
        padding: var(--s-24);
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--s-16);
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .span-2 {
        grid-column: span 2;
      }
      .form-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--grey-700, #495057);
      }
      .form-label.required::after {
        content: ' *';
        color: #dc3545;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: var(--s-24);
        padding-top: var(--s-16);
        border-top: 1px solid var(--grey-200);
      }
    `,
  ],
})
export class ActaDevolucionFormComponent implements OnInit {
  private service = inject(ActaDevolucionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);

  isEdit = false;
  loading = false;
  saving = false;
  actaId?: number;

  form: Partial<ActaDevolucion> = {
    equipo_id: undefined,
    fecha_devolucion: '',
    tipo: 'DEVOLUCION',
    condicion_equipo: 'BUENO',
    horometro_devolucion: null,
    kilometraje_devolucion: null,
    observaciones: '',
    observaciones_fisicas: '',
  };

  breadcrumbs: Breadcrumb[] = [];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.actaId = parseInt(id);
      this.breadcrumbs = [
        { label: 'Equipo', url: '/equipment' },
        { label: 'Actas de Devolución', url: '/equipment/actas-devolucion' },
        { label: 'Editar Acta' },
      ];
      this.cargar();
    } else {
      this.breadcrumbs = [
        { label: 'Equipo', url: '/equipment' },
        { label: 'Actas de Devolución', url: '/equipment/actas-devolucion' },
        { label: 'Nueva Acta' },
      ];
    }
  }

  cargar() {
    this.loading = true;
    this.service.obtener(this.actaId!).subscribe({
      next: (a) => {
        this.form = {
          equipo_id: a.equipo_id,
          contrato_id: a.contrato_id,
          proyecto_id: a.proyecto_id,
          fecha_devolucion: a.fecha_devolucion,
          tipo: a.tipo,
          condicion_equipo: a.condicion_equipo,
          horometro_devolucion: a.horometro_devolucion,
          kilometraje_devolucion: a.kilometraje_devolucion,
          observaciones: a.observaciones ?? '',
          observaciones_fisicas: a.observaciones_fisicas ?? '',
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  guardar() {
    this.saving = true;
    const obs = this.isEdit
      ? this.service.actualizar(this.actaId!, this.form)
      : this.service.crear(this.form);

    obs.subscribe({
      next: (a) => {
        this.saving = false;
        this.router.navigate(['/equipment/actas-devolucion', a.id]);
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  cancelar(f: NgForm) {
    if (f.dirty) {
      this.confirmSvc
        .confirm({
          title: 'Confirmar Cancelación',
          message: '¿Está seguro de cancelar? Los cambios no guardados se perderán.',
          icon: 'fa-triangle-exclamation',
          confirmLabel: 'Salir sin guardar',
          isDanger: true,
        })
        .subscribe((confirmed) => {
          if (confirmed) {
            this.router.navigate(['/equipment/actas-devolucion']);
          }
        });
    } else {
      this.router.navigate(['/equipment/actas-devolucion']);
    }
  }
}
