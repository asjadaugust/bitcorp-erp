import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { OrdenAlquilerService, OrdenAlquiler } from '../../core/services/orden-alquiler.service';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';

@Component({
  selector: 'app-orden-alquiler-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FormContainerComponent],
  template: `
    <app-form-container
      [title]="isEdit ? 'Editar Orden de Alquiler' : 'Nueva Orden de Alquiler'"
      [subtitle]="
        isEdit
          ? 'Modifica los datos de la orden existente'
          : 'Crea una nueva orden de alquiler de equipo'
      "
      icon="fa-file-contract"
      submitLabel="Guardar Orden"
      submitIcon="fa-save"
      [loading]="saving"
      [disableSubmit]="saving"
      [icon]="isEdit ? 'fa-pen' : 'fa-file-contract'"
      (onSubmit)="guardar()"
      (onCancel)="volver()"
    >
      <form #f="ngForm" (ngSubmit)="guardar()">
        <!-- ── Sección: Equipo y Proveedor ────────────── -->
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-tractor"></i> Equipo y Proveedor</h3>
          <div class="section-grid">
            <div class="form-group">
              <label class="form-label required">ID Proveedor</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.proveedor_id"
                name="proveedor_id"
                required
                min="1"
                placeholder="ID del proveedor registrado"
              />
              <small class="form-hint">Ingrese el ID numérico del proveedor</small>
            </div>

            <div class="form-group">
              <label class="form-label">ID Equipo <span class="optional">(opcional)</span></label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.equipo_id"
                name="equipo_id"
                min="1"
                placeholder="ID del equipo si ya está definido"
              />
            </div>

            <div class="form-group span-2">
              <label class="form-label required">Descripción del Equipo</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="form.descripcion_equipo"
                name="descripcion_equipo"
                required
                placeholder="Ej: Excavadora Caterpillar 320D, año 2020, Cap. 1.2m³"
              />
            </div>

            <div class="form-group">
              <label class="form-label">ID Proyecto <span class="optional">(opcional)</span></label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.proyecto_id"
                name="proyecto_id"
                min="1"
                placeholder="Proyecto destino"
              />
            </div>

            <div class="form-group">
              <label class="form-label"
                >ID Solicitud de Equipo <span class="optional">(opcional)</span></label
              >
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.solicitud_equipo_id"
                name="solicitud_equipo_id"
                min="1"
                placeholder="Vinculada a solicitud"
              />
            </div>
          </div>
        </div>

        <!-- ── Sección: Fechas ─────────────────────────── -->
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-calendar-days"></i> Fechas</h3>
          <div class="section-grid">
            <div class="form-group">
              <label class="form-label required">Fecha de Orden</label>
              <input
                type="date"
                class="form-control"
                [(ngModel)]="form.fecha_orden"
                name="fecha_orden"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Fecha Inicio Estimada</label>
              <input
                type="date"
                class="form-control"
                [(ngModel)]="form.fecha_inicio_estimada"
                name="fecha_inicio_estimada"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Fecha Fin Estimada</label>
              <input
                type="date"
                class="form-control"
                [(ngModel)]="form.fecha_fin_estimada"
                name="fecha_fin_estimada"
              />
            </div>
          </div>
        </div>

        <!-- ── Sección: Condiciones Económicas ─────────── -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fa-solid fa-dollar-sign"></i> Condiciones Económicas
          </h3>
          <div class="section-grid">
            <div class="form-group">
              <label class="form-label required">Tarifa Acordada</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.tarifa_acordada"
                name="tarifa_acordada"
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Tipo de Tarifa</label>
              <select class="form-select" [(ngModel)]="form.tipo_tarifa" name="tipo_tarifa">
                <option value="HORA">Por Hora</option>
                <option value="DIA">Por Día</option>
                <option value="MES">Por Mes</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Moneda</label>
              <select class="form-select" [(ngModel)]="form.moneda" name="moneda">
                <option value="PEN">PEN (Soles)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </div>

            <div class="form-group" *ngIf="form.moneda === 'USD'">
              <label class="form-label">Tipo de Cambio</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.tipo_cambio"
                name="tipo_cambio"
                min="0.0001"
                step="0.0001"
                placeholder="3.7500"
              />
            </div>

            <div class="form-group" *ngIf="form.tipo_tarifa !== 'HORA'">
              <label class="form-label">Horas Incluidas en la Tarifa</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.horas_incluidas"
                name="horas_incluidas"
                min="0"
                step="0.5"
                placeholder="8"
              />
            </div>

            <div class="form-group" *ngIf="form.tipo_tarifa !== 'HORA'">
              <label class="form-label">Penalidad por Hora Excedente</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.penalidad_exceso"
                name="penalidad_exceso"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <!-- ── Sección: Condiciones y Observaciones ────── -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fa-solid fa-file-lines"></i> Condiciones y Observaciones
          </h3>
          <div class="section-grid">
            <div class="form-group span-2">
              <label class="form-label">Condiciones Especiales</label>
              <textarea
                class="form-control"
                [(ngModel)]="form.condiciones_especiales"
                name="condiciones_especiales"
                rows="3"
                placeholder="Cláusulas o condiciones especiales pactadas con el proveedor..."
              ></textarea>
            </div>
            <div class="form-group span-2">
              <label class="form-label">Observaciones</label>
              <textarea
                class="form-control"
                [(ngModel)]="form.observaciones"
                name="observaciones"
                rows="2"
                placeholder="Observaciones generales..."
              ></textarea>
            </div>
          </div>
        </div>
      </form>
    </app-form-container>
  `,
  styles: [],
})
export class OrdenAlquilerFormComponent implements OnInit {
  private service = inject(OrdenAlquilerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = false;
  saving = false;
  ordenId?: number;

  form: Partial<OrdenAlquiler> = {
    proveedor_id: undefined,
    equipo_id: undefined,
    solicitud_equipo_id: undefined,
    proyecto_id: undefined,
    descripcion_equipo: '',
    fecha_orden: new Date().toISOString().split('T')[0],
    fecha_inicio_estimada: undefined,
    fecha_fin_estimada: undefined,
    tarifa_acordada: undefined,
    tipo_tarifa: 'HORA',
    moneda: 'PEN',
    tipo_cambio: undefined,
    horas_incluidas: undefined,
    penalidad_exceso: undefined,
    condiciones_especiales: '',
    observaciones: '',
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.ordenId = parseInt(id);
      this.cargar();
    }
  }

  cargar() {
    this.service.obtener(this.ordenId!).subscribe({
      next: (o) => {
        this.form = {
          proveedor_id: o.proveedor_id,
          equipo_id: o.equipo_id ?? undefined,
          solicitud_equipo_id: o.solicitud_equipo_id ?? undefined,
          proyecto_id: o.proyecto_id ?? undefined,
          descripcion_equipo: o.descripcion_equipo,
          fecha_orden: o.fecha_orden,
          fecha_inicio_estimada: o.fecha_inicio_estimada ?? undefined,
          fecha_fin_estimada: o.fecha_fin_estimada ?? undefined,
          tarifa_acordada: o.tarifa_acordada,
          tipo_tarifa: o.tipo_tarifa,
          moneda: o.moneda,
          tipo_cambio: o.tipo_cambio ?? undefined,
          horas_incluidas: o.horas_incluidas ?? undefined,
          penalidad_exceso: o.penalidad_exceso ?? undefined,
          condiciones_especiales: o.condiciones_especiales ?? '',
          observaciones: o.observaciones ?? '',
        };
      },
    });
  }

  guardar() {
    this.saving = true;
    const obs = this.isEdit
      ? this.service.actualizar(this.ordenId!, this.form)
      : this.service.crear(this.form);

    obs.subscribe({
      next: (o) => {
        this.saving = false;
        this.router.navigate(['/equipment/ordenes-alquiler', o.id]);
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  volver() {
    if (this.isEdit && this.ordenId) {
      this.router.navigate(['/equipment/ordenes-alquiler', this.ordenId]);
    } else {
      this.router.navigate(['/equipment/ordenes-alquiler']);
    }
  }
}
