import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  SolicitudEquipoService,
} from '../../core/services/solicitud-equipo.service';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-solicitud-equipo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    FormContainerComponent,
    DropdownComponent,
  ],
  template: `
    <app-form-container
      [title]="isEdit ? 'Editar Solicitud' : 'Nueva Solicitud de Equipo'"
      [subtitle]="
        isEdit
          ? 'Actualizar información de la solicitud'
          : 'Completar los campos para solicitar un nuevo equipo'
      "
      [icon]="isEdit ? 'fa-pen' : 'fa-plus'"
      [loading]="loading"
      [disableSubmit]="solicitudForm.invalid || saving"
      [submitLabel]="saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Solicitud'"
      (onSubmit)="guardar()"
      (onCancel)="cancelar()"
    >
      <form [formGroup]="solicitudForm" class="form-grid">
        <!-- Section: Basic Information -->
        <div class="form-section full-width">
          <h3 class="section-title">
            <i class="fa-solid fa-file-invoice"></i> Información de la Solicitud
          </h3>
          <div class="section-grid">
            <div class="form-group">
              <span class="required">Tipo de Equipo</span>
              <input
                type="text"
                class="form-control"
                formControlName="tipo_equipo"
                placeholder="Ej: Excavadora de oruga, Volquete 15m³..."
              />
              <div class="error-msg" *ngIf="hasError('tipo_equipo')">
                Tipo de equipo es requerido
              </div>
            </div>

            <div class="form-group">
              <span class="required">Cantidad</span>
              <input type="number" class="form-control" formControlName="cantidad" min="1" />
              <div class="error-msg" *ngIf="hasError('cantidad')">Cantidad válida es requerida</div>
            </div>

            <div class="form-group">
              <span class="required">Fecha Requerida</span>
              <input type="date" class="form-control" formControlName="fecha_requerida" />
              <div class="error-msg" *ngIf="hasError('fecha_requerida')">Fecha es requerida</div>
            </div>

            <div class="form-group">
              <span class="label">Prioridad</span>
              <app-dropdown
                formControlName="prioridad"
                [options]="[
                  { label: 'Baja', value: 'BAJA' },
                  { label: 'Media', value: 'MEDIA' },
                  { label: 'Alta', value: 'ALTA' },
                ]"
              ></app-dropdown>
            </div>
          </div>
        </div>

        <!-- Section: Technical Details -->
        <div class="form-section full-width">
          <h3 class="section-title">
            <i class="fa-solid fa-wrench"></i> Detalles Técnicos y Justificación
          </h3>
          <div class="section-grid">
            <div class="form-group full-width">
              <span class="label">Descripción Técnica</span>
              <textarea
                class="form-control"
                formControlName="descripcion"
                rows="3"
                placeholder="Especificaciones técnicas del equipo requerido..."
              ></textarea>
            </div>

            <div class="form-group full-width">
              <span class="label">Justificación Operativa</span>
              <textarea
                class="form-control"
                formControlName="justificacion"
                rows="4"
                placeholder="Fundamento operativo o técnico de la solicitud..."
              ></textarea>
            </div>
          </div>
        </div>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      .form-grid {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .form-section h3 {
        font-size: 16px;
        color: var(--primary-800);
        border-bottom: 1px solid var(--grey-200);
        padding-bottom: 0.5rem;
        margin-bottom: 1.5rem;
        font-weight: 600;
      }

      .section-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .full-width {
        grid-column: 1 / -1;
      }

      label {
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-700);
      }

      label.required::after {
        content: ' *';
        color: var(--semantic-red-500);
      }

      .form-control {
        padding: 0.625rem;
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s;
      }

      .form-control:focus {
        border-color: var(--primary-500);
        outline: none;
        box-shadow: 0 0 0 3px var(--primary-100);
      }

      .error-msg {
        color: var(--semantic-red-600);
        font-size: 12px;
      }

      @media (max-width: 768px) {
        .section-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SolicitudEquipoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(SolicitudEquipoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);

  solicitudForm: FormGroup;
  isEdit = false;
  loading = false;
  saving = false;
  solicitudId?: number;

  constructor() {
    this.solicitudForm = this.fb.group({
      tipo_equipo: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      fecha_requerida: ['', Validators.required],
      prioridad: ['MEDIA', Validators.required],
      descripcion: [''],
      justificacion: [''],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.solicitudId = parseInt(id);
      this.cargar();
    }
  }

  cargar() {
    this.loading = true;
    this.service.obtener(this.solicitudId!).subscribe({
      next: (s) => {
        this.solicitudForm.patchValue({
          tipo_equipo: s.tipo_equipo,
          cantidad: s.cantidad,
          fecha_requerida: s.fecha_requerida,
          prioridad: s.prioridad,
          descripcion: s.descripcion,
          justificacion: s.justificacion,
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  hasError(field: string): boolean {
    const control = this.solicitudForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  cancelar() {
    if (this.solicitudForm.dirty) {
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
            this.router.navigate(['/equipment/solicitudes']);
          }
        });
    } else {
      this.router.navigate(['/equipment/solicitudes']);
    }
  }

  guardar() {
    if (this.solicitudForm.invalid) {
      this.solicitudForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formValue = this.solicitudForm.value;
    const obs = this.isEdit
      ? this.service.actualizar(this.solicitudId!, formValue)
      : this.service.crear(formValue);

    obs.subscribe({
      next: (s) => {
        this.saving = false;
        this.router.navigate(['/equipment/solicitudes', s.id]);
      },
      error: () => {
        this.saving = false;
      },
    });
  }
}
