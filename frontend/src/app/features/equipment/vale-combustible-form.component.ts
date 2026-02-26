import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  ValeCombustibleService,
  CreateValeDto,
} from '../../core/services/vale-combustible.service';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../shared/components/form-section/form-section.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-vale-combustible-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormContainerComponent,
    FormSectionComponent,
    DropdownComponent,
  ],
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
      (submitted)="guardar()"
      (cancelled)="volver()"
    >
      <form #f="ngForm" class="form-grid">
        <!-- Section 1: Equipo -->
        <app-form-section title="Equipo" icon="fa-tractor">
          <div class="form-group">
            <label class="form-label required" for="equipo_id">ID Equipo</label>
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
            <label class="form-label" for="parte_diario_id"
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
            <label class="form-label" for="proyecto_id"
              >ID Proyecto <span class="optional">(opcional)</span></label
            >
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
        </app-form-section>

        <!-- Section 2: Datos del Vale -->
        <app-form-section title="Datos del Vale" icon="fa-receipt">
          <div class="form-group">
            <label class="form-label required" for="fecha">Fecha</label>
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
            <label class="form-label required" for="numero_vale">Numero de Vale</label>
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
            <small class="form-hint">Numero impreso en el vale fisico</small>
          </div>

          <div class="form-group">
            <label class="form-label required" for="tipo_combustible">Tipo de Combustible</label>
            <app-dropdown
              [(ngModel)]="form.tipo_combustible"
              name="tipo_combustible"
              [options]="tipoCombustibleOptions"
              placeholder="Seleccionar tipo"
              data-testid="select-tipo-combustible"
            ></app-dropdown>
          </div>

          <div class="form-group">
            <label class="form-label required" for="cantidad_galones">Cantidad (galones)</label>
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
            <label class="form-label" for="precio_unitario"
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
            <label class="form-label" for="monto_total">Monto Total (S/)</label>
            <input
              type="number"
              class="form-control form-control-readonly"
              [value]="montoCalculado"
              name="monto_total_display"
              readonly
              placeholder="Calculado automaticamente"
              data-testid="display-monto-total"
            />
            <small class="form-hint">Calculado: cantidad x precio unitario</small>
          </div>

          <div class="form-group span-2">
            <label class="form-label" for="proveedor"
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
            <label class="form-label" for="observaciones"
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
        </app-form-section>

        <!-- Error message -->
        <div *ngIf="errorMsg" class="alert alert-danger" role="alert" data-testid="error-message">
          <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMsg }}
        </div>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout';

      .form-control-readonly {
        background: var(--grey-50);
        color: var(--grey-700);
      }

      .alert-danger {
        background: var(--error-50, #fef2f2);
        color: var(--error-700, #b91c1c);
        border: 1px solid var(--error-200, #fecaca);
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 8px;
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

  tipoCombustibleOptions: DropdownOption[] = [
    { label: 'Diesel', value: 'DIESEL' },
    { label: 'Gasolina 90', value: 'GASOLINA_90' },
    { label: 'Gasolina 95', value: 'GASOLINA_95' },
    { label: 'GLP', value: 'GLP' },
    { label: 'GNV', value: 'GNV' },
  ];

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
