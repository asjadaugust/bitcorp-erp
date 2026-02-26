import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PeriodoInoperatividadService } from '../../core/services/periodo-inoperatividad.service';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../shared/components/form-section/form-section.component';

@Component({
  selector: 'app-periodo-inoperatividad-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FormContainerComponent, FormSectionComponent],
  template: `
    <app-form-container
      title="Registrar Periodo de Inoperatividad"
      subtitle="Registre un periodo en que el equipo quedo fuera de servicio por desperfecto"
      icon="fa-triangle-exclamation"
      [loading]="saving"
      [disableSubmit]="saving || !isValid()"
      submitLabel="Registrar Inoperatividad"
      (submitted)="guardar()"
      (cancelled)="cancelar()"
    >
      <form class="form-grid">
        <!-- Section 1: Equipo y Contrato -->
        <app-form-section title="Datos del Equipo" icon="fa-tractor">
          <div class="form-group">
            <label class="form-label required" for="equipo_id">Equipo ID</label>
            <input
              id="equipo_id"
              type="number"
              class="form-control"
              [(ngModel)]="form.equipo_id"
              name="equipo_id"
              placeholder="Ingrese el ID del equipo"
              [disabled]="!!equipoIdFromRoute"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="contrato_id"
              >Contrato <span class="optional">(opcional)</span></label
            >
            <input
              id="contrato_id"
              type="number"
              class="form-control"
              [(ngModel)]="form.contrato_id"
              name="contrato_id"
              placeholder="ID del contrato relacionado"
            />
          </div>
        </app-form-section>

        <!-- Section 2: Detalle de Inoperatividad -->
        <app-form-section title="Detalle de Inoperatividad - Clausula 7.6" icon="fa-clock">
          <div class="form-group">
            <label class="form-label required" for="fecha_inicio"
              >Fecha de inicio de inoperatividad</label
            >
            <input
              id="fecha_inicio"
              type="date"
              class="form-control"
              [(ngModel)]="form.fecha_inicio"
              name="fecha_inicio"
            />
            @if (diasActuales > 0) {
              <span class="field-hint" [class.hint-danger]="diasActuales >= form.dias_plazo">
                <i class="fa-solid fa-clock"></i>
                {{ diasActuales }} dia{{ diasActuales !== 1 ? 's' : '' }} inoperativo
                @if (diasActuales >= form.dias_plazo) {
                  — ya excede el plazo de {{ form.dias_plazo }} dias
                }
              </span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="dias_plazo">Plazo de reparacion (dias)</label>
            <input
              id="dias_plazo"
              type="number"
              class="form-control"
              [(ngModel)]="form.dias_plazo"
              name="dias_plazo"
              min="1"
              max="30"
            />
            <small class="form-hint">PRD Clausula 7.6: valor estandar = 5 dias</small>
          </div>

          <div class="form-group span-2">
            <label class="form-label required" for="motivo"
              >Motivo / Descripcion del desperfecto</label
            >
            <textarea
              id="motivo"
              class="form-control"
              rows="4"
              [(ngModel)]="form.motivo"
              name="motivo"
              placeholder="Describa el desperfecto o averia que causo la inoperatividad..."
            ></textarea>
          </div>
        </app-form-section>

        <!-- Alert if already exceeded -->
        @if (diasActuales >= form.dias_plazo && form.fecha_inicio) {
          <div class="alert-exceeded">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <div>
              <strong>Atencion:</strong> Este periodo ya excede el plazo contractual. Se registrara
              como <strong>EXCEDIDO</strong> y se habilitara la aplicacion de penalidad.
            </div>
          </div>
        }
      </form>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout';

      .field-hint {
        font-size: 12px;
        color: var(--grey-500);
      }

      .field-hint.hint-danger {
        color: var(--error, #dc3545);
        font-weight: 600;
      }

      .alert-exceeded {
        background: var(--error-50, #fef2f2);
        color: var(--error-700, #b91c1c);
        border: 1px solid var(--error-200, #fecaca);
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 13px;
        display: flex;
        align-items: flex-start;
        gap: 10px;

        i {
          margin-top: 2px;
          flex-shrink: 0;
        }
      }
    `,
  ],
})
export class PeriodoInoperatividadFormComponent implements OnInit {
  private service = inject(PeriodoInoperatividadService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  saving = false;
  equipoIdFromRoute: number | null = null;

  form = {
    equipo_id: 0,
    contrato_id: undefined as number | undefined,
    fecha_inicio: new Date().toISOString().split('T')[0],
    motivo: '',
    dias_plazo: 5,
  };

  breadcrumbs = [
    { label: 'Equipos', url: '/equipment' },
    { label: 'Inoperatividad', url: '/equipment/inoperatividad' },
    { label: 'Registrar' },
  ];

  get diasActuales(): number {
    if (!this.form.fecha_inicio) return 0;
    const inicio = new Date(this.form.fecha_inicio);
    const hoy = new Date();
    const diff = hoy.getTime() - inicio.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  ngOnInit() {
    // Pre-populate equipo_id from query param if coming from equipment detail
    const equipoId = this.route.snapshot.queryParamMap.get('equipo_id');
    if (equipoId) {
      this.form.equipo_id = parseInt(equipoId);
      this.equipoIdFromRoute = this.form.equipo_id;
    }
    const contratoId = this.route.snapshot.queryParamMap.get('contrato_id');
    if (contratoId) {
      this.form.contrato_id = parseInt(contratoId);
    }
  }

  isValid(): boolean {
    return !!(this.form.equipo_id && this.form.fecha_inicio && this.form.motivo?.trim());
  }

  guardar() {
    if (!this.isValid()) return;
    this.saving = true;
    this.service
      .crear({
        equipo_id: this.form.equipo_id,
        contrato_id: this.form.contrato_id,
        fecha_inicio: this.form.fecha_inicio,
        motivo: this.form.motivo,
        dias_plazo: this.form.dias_plazo,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['..'], { relativeTo: this.route });
        },
        error: (err) => {
          this.saving = false;
          // TODO: Replace with proper error handling via AlertComponent
          alert(err?.error?.error?.message || 'Error al registrar el periodo');
        },
      });
  }

  cancelar() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }
}
