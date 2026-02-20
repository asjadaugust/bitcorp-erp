import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PeriodoInoperatividadService } from '../../core/services/periodo-inoperatividad.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { ContractService } from '../../core/services/contract.service';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';

@Component({
  selector: 'app-periodo-inoperatividad-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageLayoutComponent],
  template: `
    <app-page-layout
      title="Registrar Período de Inoperatividad"
      icon="fa-triangle-exclamation"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <div class="form-card">
        <div class="form-header">
          <h3>Nueva Inoperatividad — Cláusula 7.6</h3>
          <p class="form-desc">
            Registre un período en que el equipo quedó fuera de servicio por desperfecto. El
            arrendador tiene <strong>{{ form.dias_plazo }} días</strong> para repararlo o
            reemplazarlo.
          </p>
        </div>

        <div class="form-body">
          <!-- Equipo ID -->
          <div class="form-group">
            <label>Equipo ID *</label>
            <input
              type="number"
              class="form-control"
              [(ngModel)]="form.equipo_id"
              placeholder="Ingrese el ID del equipo"
              [disabled]="!!equipoIdFromRoute"
            />
          </div>

          <!-- Contrato -->
          <div class="form-group">
            <label>Contrato (opcional)</label>
            <input
              type="number"
              class="form-control"
              [(ngModel)]="form.contrato_id"
              placeholder="ID del contrato relacionado"
            />
          </div>

          <!-- Fecha inicio -->
          <div class="form-group">
            <label>Fecha de inicio de inoperatividad *</label>
            <input type="date" class="form-control" [(ngModel)]="form.fecha_inicio" />
            @if (diasActuales > 0) {
              <span class="field-hint" [class.hint-danger]="diasActuales >= form.dias_plazo">
                <i class="fa-solid fa-clock"></i>
                {{ diasActuales }} día{{ diasActuales !== 1 ? 's' : '' }} inoperativo
                @if (diasActuales >= form.dias_plazo) {
                  — <strong>ya excede el plazo de {{ form.dias_plazo }} días</strong>
                }
              </span>
            }
          </div>

          <!-- Motivo -->
          <div class="form-group">
            <label>Motivo / Descripción del desperfecto *</label>
            <textarea
              class="form-control"
              rows="4"
              [(ngModel)]="form.motivo"
              placeholder="Describa el desperfecto o avería que causó la inoperatividad..."
            ></textarea>
          </div>

          <!-- Días plazo -->
          <div class="form-group">
            <label>Plazo de reparación (días)</label>
            <input
              type="number"
              class="form-control"
              [(ngModel)]="form.dias_plazo"
              min="1"
              max="30"
            />
            <span class="field-hint">PRD Cláusula 7.6: valor estándar = 5 días</span>
          </div>

          <!-- Alert if already exceeded -->
          @if (diasActuales >= form.dias_plazo && form.fecha_inicio) {
            <div class="alert alert-danger">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <strong>Atención:</strong> Este período ya excede el plazo contractual. Se registrará
              como <strong>EXCEDIDO</strong> y se habilitará la aplicación de penalidad.
            </div>
          }
        </div>

        <div class="form-footer">
          <button type="button" class="btn btn-secondary" routerLink="..">Cancelar</button>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="saving || !isValid()"
            (click)="guardar()"
          >
            <i class="fa-solid fa-save"></i>
            {{ saving ? 'Guardando...' : 'Registrar Inoperatividad' }}
          </button>
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .form-card {
        background: #fff;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        overflow: hidden;
        max-width: 640px;
      }
      .form-header {
        padding: 20px 24px;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
      }
      .form-header h3 {
        margin: 0 0 6px;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }
      .form-desc {
        margin: 0;
        font-size: 13px;
        color: #64748b;
      }
      .form-body {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .form-footer {
        padding: 16px 24px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        background: #f8fafc;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .form-group label {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }
      .form-control {
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 14px;
        width: 100%;
        box-sizing: border-box;
      }
      .form-control:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
      }
      .form-control:disabled {
        background: #f8fafc;
        color: #94a3b8;
      }

      .field-hint {
        font-size: 12px;
        color: #64748b;
      }
      .field-hint.hint-danger {
        color: #dc2626;
        font-weight: 600;
      }

      .alert {
        border-radius: 6px;
        padding: 12px 16px;
        font-size: 13px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }
      .alert-danger {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
      }

      .btn {
        padding: 8px 18px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .btn-primary {
        background: #4f46e5;
        color: #fff;
      }
      .btn-secondary {
        background: #f1f5f9;
        color: #475569;
      }
      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
          alert(err?.error?.error?.message || 'Error al registrar el período');
        },
      });
  }
}
