import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ActaDevolucionService, ActaDevolucion } from '../../core/services/acta-devolucion.service';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../shared/components/form-section/form-section.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';
import { ConfirmService } from '../../core/services/confirm.service';
import { AeroDatePickerComponent } from '../../core/design-system';

@Component({
  selector: 'app-acta-devolucion-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormContainerComponent,
    FormSectionComponent,
    DropdownComponent,
    AeroDatePickerComponent,
  ],
  template: `
    <app-form-container
      [title]="isEdit ? 'Editar Acta' : 'Nueva Acta de Devolución'"
      [subtitle]="
        isEdit ? 'Actualizar información del acta' : 'Registrar una nueva acta de devolución'
      "
      [icon]="isEdit ? 'fa-pen' : 'fa-file-signature'"
      [loading]="saving"
      [disableSubmit]="saving || f.invalid"
      [submitLabel]="isEdit ? 'Actualizar' : 'Crear Acta'"
      (submitted)="guardar()"
      (cancelled)="cancelar(f)"
    >
      <form #f="ngForm" class="form-grid">
        <!-- Section 1: Equipo y Fecha -->
        <app-form-section title="Datos del Equipo" icon="fa-tractor">
          <div class="form-group">
            <label class="form-label required" for="equipo_id">ID Equipo</label>
            <input
              id="equipo_id"
              type="number"
              class="form-control"
              [(ngModel)]="form.equipo_id"
              name="equipo_id"
              required
              min="1"
              placeholder="Numero de ID del equipo"
            />
          </div>

          <div class="form-group">
            <aero-date-picker
              [mode]="'single'"
              [(ngModel)]="form.fecha_devolucion"
              name="fecha_devolucion"
              label="Fecha de Devolucion"
              [required]="true"
            ></aero-date-picker>
          </div>

          <div class="form-group">
            <label class="form-label" for="tipo">Tipo de Acta</label>
            <app-dropdown
              [(ngModel)]="form.tipo"
              name="tipo"
              [options]="tipoOptions"
              placeholder="Seleccionar tipo"
            ></app-dropdown>
          </div>

          <div class="form-group">
            <label class="form-label" for="condicion_equipo">Condicion del Equipo</label>
            <app-dropdown
              [(ngModel)]="form.condicion_equipo"
              name="condicion_equipo"
              [options]="condicionOptions"
              placeholder="Seleccionar condicion"
            ></app-dropdown>
          </div>
        </app-form-section>

        <!-- Section 2: Mediciones -->
        <app-form-section title="Mediciones" icon="fa-gauge-high">
          <div class="form-group">
            <label class="form-label" for="horometro_devolucion">Horometro (horas)</label>
            <input
              id="horometro_devolucion"
              type="number"
              class="form-control"
              [(ngModel)]="form.horometro_devolucion"
              name="horometro_devolucion"
              step="0.01"
              min="0"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="kilometraje_devolucion">Kilometraje (km)</label>
            <input
              id="kilometraje_devolucion"
              type="number"
              class="form-control"
              [(ngModel)]="form.kilometraje_devolucion"
              name="kilometraje_devolucion"
              step="0.01"
              min="0"
            />
          </div>
        </app-form-section>

        <!-- Section 3: Referencias -->
        <app-form-section title="Referencias" icon="fa-link">
          <div class="form-group">
            <label class="form-label" for="contrato_id"
              >ID Contrato <span class="optional">(opcional)</span></label
            >
            <input
              id="contrato_id"
              type="number"
              class="form-control"
              [(ngModel)]="form.contrato_id"
              name="contrato_id"
              min="1"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="proyecto_id"
              >ID Proyecto <span class="optional">(opcional)</span></label
            >
            <input
              id="proyecto_id"
              type="number"
              class="form-control"
              [(ngModel)]="form.proyecto_id"
              name="proyecto_id"
              min="1"
            />
          </div>
        </app-form-section>

        <!-- Section 4: Observaciones -->
        <app-form-section title="Observaciones" icon="fa-comment-dots" [columns]="1">
          <div class="form-group">
            <label class="form-label" for="observaciones">Observaciones Generales</label>
            <textarea
              id="observaciones"
              class="form-control"
              [(ngModel)]="form.observaciones"
              name="observaciones"
              rows="2"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="observaciones_fisicas"
              >Observaciones Fisicas / Danos</label
            >
            <textarea
              id="observaciones_fisicas"
              class="form-control"
              [(ngModel)]="form.observaciones_fisicas"
              name="observaciones_fisicas"
              rows="3"
              placeholder="Describir danos fisicos, piezas faltantes, etc..."
            ></textarea>
          </div>
        </app-form-section>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout';
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

  tipoOptions: DropdownOption[] = [
    { label: 'Devolucion', value: 'DEVOLUCION' },
    { label: 'Desmovilizacion', value: 'DESMOBILIZACION' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
  ];

  condicionOptions: DropdownOption[] = [
    { label: 'Bueno', value: 'BUENO' },
    { label: 'Regular', value: 'REGULAR' },
    { label: 'Malo', value: 'MALO' },
    { label: 'Con Observaciones', value: 'CON_OBSERVACIONES' },
  ];

  breadcrumbs = [
    { label: 'Equipo', url: '/equipment' },
    { label: 'Actas de Devolucion', url: '/equipment/actas-devolucion' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.actaId = parseInt(id);
      this.cargar();
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
          title: 'Confirmar Cancelacion',
          message: 'Esta seguro de cancelar? Los cambios no guardados se perderan.',
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
