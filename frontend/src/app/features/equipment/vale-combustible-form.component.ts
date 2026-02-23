import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  ValeCombustibleService,
  CreateValeDto,
} from '../../core/services/vale-combustible.service';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';

@Component({
  selector: 'app-vale-combustible-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FormContainerComponent],
  template: `
    <app-form-container
      [title]="isEdit ? 'Editar Vale de Combustible' : 'Nuevo Vale de Combustible'"
      [subtitle]="
        isEdit
          ? 'Modifica los datos del vale existente'
          : 'Registra un nuevo vale de combustible adjunto a un parte diario'
      "
      [icon]="isEdit ? 'fa-pen' : 'fa-gas-pump'"
      submitLabel="Guardar Vale"
      submitIcon="fa-save"
      [loading]="saving"
      [disableSubmit]="saving"
      (onSubmit)="guardar()"
      (onCancel)="volver()"
    >
      <form #f="ngForm" (ngSubmit)="guardar()">
        <!-- ── Sección: Datos del Equipo ─────────────── -->
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-tractor"></i> Equipo</h3>
          <div class="section-grid">
            <div class="form-group">
              <label class="form-label required">ID Equipo</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.equipo_id"
                name="equipo_id"
                required
                min="1"
                placeholder="ID del equipo"
                data-testid="input-equipo-id"
              />
            </div>

            <div class="form-group">
              <label class="form-label"
                >ID Parte Diario <span class="optional">(opcional)</span></label
              >
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.parte_diario_id"
                name="parte_diario_id"
                min="1"
                placeholder="Vincular a parte diario"
                data-testid="input-parte-diario-id"
              />
              <small class="form-hint">Adjunte el vale a un parte diario existente</small>
            </div>

            <div class="form-group">
              <label class="form-label">ID Proyecto <span class="optional">(opcional)</span></label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.proyecto_id"
                name="proyecto_id"
                min="1"
                placeholder="Proyecto relacionado"
                data-testid="input-proyecto-id"
              />
            </div>
          </div>
        </div>

        <!-- ── Sección: Datos del Vale ─────────────── -->
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-receipt"></i> Datos del Vale</h3>
          <div class="section-grid">
            <div class="form-group">
              <label class="form-label required">Fecha</label>
              <input
                type="date"
                class="form-control"
                [(ngModel)]="form.fecha"
                name="fecha"
                required
                data-testid="input-fecha"
              />
            </div>

            <div class="form-group">
              <label class="form-label required">Número de Vale</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="form.numero_vale"
                name="numero_vale"
                required
                maxlength="50"
                placeholder="Ej: V-001234"
                data-testid="input-numero-vale"
              />
              <small class="form-hint">Número impreso en el vale físico</small>
            </div>

            <div class="form-group">
              <label class="form-label required">Tipo de Combustible</label>
              <select
                class="form-control"
                [(ngModel)]="form.tipo_combustible"
                name="tipo_combustible"
                required
                data-testid="select-tipo-combustible"
              >
                <option value="DIESEL">Diesel</option>
                <option value="GASOLINA_90">Gasolina 90</option>
                <option value="GASOLINA_95">Gasolina 95</option>
                <option value="GLP">GLP</option>
                <option value="GNV">GNV</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Cantidad (galones)</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.cantidad_galones"
                name="cantidad_galones"
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                (ngModelChange)="calcularMonto()"
                data-testid="input-cantidad-galones"
              />
            </div>

            <div class="form-group">
              <label class="form-label"
                >Precio Unitario (S/) <span class="optional">(opcional)</span></label
              >
              <input
                type="number"
                class="form-control"
                [(ngModel)]="form.precio_unitario"
                name="precio_unitario"
                min="0"
                step="0.01"
                placeholder="0.00"
                (ngModelChange)="calcularMonto()"
                data-testid="input-precio-unitario"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Monto Total (S/)</label>
              <input
                type="number"
                class="form-control form-control-readonly"
                [value]="montoCalculado"
                name="monto_total_display"
                readonly
                placeholder="Calculado automáticamente"
                data-testid="display-monto-total"
              />
              <small class="form-hint">Calculado: cantidad × precio unitario</small>
            </div>

            <div class="form-group span-2">
              <label class="form-label"
                >Proveedor / Grifo <span class="optional">(opcional)</span></label
              >
              <input
                type="text"
                class="form-control"
                [(ngModel)]="form.proveedor"
                name="proveedor"
                maxlength="150"
                placeholder="Ej: Grifo Central SAC"
                data-testid="input-proveedor"
              />
            </div>

            <div class="form-group span-2">
              <label class="form-label"
                >Observaciones <span class="optional">(opcional)</span></label
              >
              <textarea
                class="form-control"
                [(ngModel)]="form.observaciones"
                name="observaciones"
                rows="3"
                maxlength="500"
                placeholder="Notas adicionales sobre el abastecimiento..."
                data-testid="textarea-observaciones"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div *ngIf="errorMsg" class="alert alert-danger" role="alert" data-testid="error-message">
          <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMsg }}
        </div>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      .section-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
      .span-2 {
        grid-column: span 2;
      }
      .form-control-readonly {
        background: var(--grey-50);
        color: var(--grey-700);
      }
      .optional {
        color: var(--grey-400);
        font-size: 0.85em;
        font-weight: normal;
      }
    `,
  ],
})
export class ValeCombustibleFormComponent implements OnInit {
  private svc = inject(ValeCombustibleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = false;
  saving = false;
  errorMsg = '';
  montoCalculado: number | null = null;

  form: CreateValeDto & { precio_unitario?: number | null } = {
    equipo_id: 0,
    parte_diario_id: null,
    proyecto_id: null,
    fecha: new Date().toISOString().slice(0, 10),
    numero_vale: '',
    tipo_combustible: 'DIESEL',
    cantidad_galones: 0,
    precio_unitario: null,
    proveedor: null,
    observaciones: null,
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.svc.obtener(Number(id)).subscribe({
        next: (vale) => {
          this.form = {
            equipo_id: vale.equipo_id,
            parte_diario_id: vale.parte_diario_id,
            proyecto_id: vale.proyecto_id,
            fecha: vale.fecha,
            numero_vale: vale.numero_vale,
            tipo_combustible: vale.tipo_combustible,
            cantidad_galones: vale.cantidad_galones,
            precio_unitario: vale.precio_unitario,
            proveedor: vale.proveedor,
            observaciones: vale.observaciones,
          };
          this.calcularMonto();
        },
      });
    }
  }

  calcularMonto() {
    if (this.form.cantidad_galones && this.form.precio_unitario) {
      this.montoCalculado = parseFloat(
        (this.form.cantidad_galones * this.form.precio_unitario).toFixed(2)
      );
    } else {
      this.montoCalculado = null;
    }
  }

  guardar() {
    this.errorMsg = '';
    if (
      !this.form.equipo_id ||
      !this.form.fecha ||
      !this.form.numero_vale ||
      !this.form.cantidad_galones
    ) {
      this.errorMsg = 'Por favor complete todos los campos requeridos.';
      return;
    }

    this.saving = true;
    const id = this.route.snapshot.paramMap.get('id');

    const payload = { ...this.form };

    const obs =
      this.isEdit && id
        ? this.svc.actualizar(Number(id), payload)
        : this.svc.crear(payload as CreateValeDto);

    obs.subscribe({
      next: (vale) => {
        this.saving = false;
        this.router.navigate(['/equipment/vales-combustible', vale.id]);
      },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err?.error?.error?.message || 'Error al guardar el vale de combustible.';
      },
    });
  }

  volver() {
    this.router.navigate(['/equipment/vales-combustible']);
  }
}
