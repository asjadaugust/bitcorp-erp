import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EvaluacionService,
  CriterioSeleccionEvaluacion,
  EvaluacionProveedorCrear,
} from './evaluacion.service';
import { FormContainerComponent } from '../../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';
import { AeroBadgeComponent, AeroDatePickerComponent } from '../../../core/design-system';

interface CriterioOption {
  parametro: string;
  puntaje: number;
}

interface AspectoGroup {
  aspecto: string;
  formField: string;
  label: string;
  options: CriterioOption[];
}

@Component({
  selector: 'app-evaluacion-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormContainerComponent,
    FormSectionComponent,
    AeroBadgeComponent,
    AeroDatePickerComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Evaluación' : 'Nueva Evaluación'"
      [subtitle]="
        isEditMode
          ? 'Actualizar evaluación de proveedor'
          : 'Registrar una nueva evaluación de proveedor'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-clipboard-check'"
      [loading]="saving"
      [disableSubmit]="form.invalid || saving"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Evaluación'"
      (submitted)="onSubmit()"
      (cancelled)="cancel()"
    >
      <form [formGroup]="form" class="form-grid">
        <app-form-section title="Datos del Proveedor" icon="fa-building">
          <div class="form-group">
            <label for="ruc">RUC *</label>
            <input
              id="ruc"
              type="text"
              formControlName="ruc"
              class="form-control"
              placeholder="ej. 20123456789"
            />
            <div class="error-msg" *ngIf="hasError('ruc')">RUC es requerido</div>
          </div>

          <div class="form-group">
            <label for="razon_social">Razón Social *</label>
            <input
              id="razon_social"
              type="text"
              formControlName="razon_social"
              class="form-control"
              placeholder="ej. Empresa S.A.C."
            />
            <div class="error-msg" *ngIf="hasError('razon_social')">Razón social es requerida</div>
          </div>

          <div class="form-group">
            <aero-date-picker
              [mode]="'single'"
              label="Fecha Evaluación *"
              formControlName="fecha_evaluacion"
              [state]="hasError('fecha_evaluacion') ? 'error' : 'default'"
              [error]="hasError('fecha_evaluacion') ? 'Fecha de evaluación es requerida' : ''"
            ></aero-date-picker>
          </div>

          <div class="form-group">
            <label for="evaluado_por">Evaluado Por</label>
            <input
              id="evaluado_por"
              type="text"
              formControlName="evaluado_por"
              class="form-control"
              placeholder="Nombre del evaluador"
            />
          </div>
        </app-form-section>

        <app-form-section title="Criterios de Evaluación" icon="fa-clipboard-check" [columns]="3">
          @if (loadingCriterios) {
            <div class="form-group full-width">
              <p class="loading-text">Cargando criterios...</p>
            </div>
          } @else {
            @for (grupo of aspectoGroups; track grupo.formField) {
              <div class="form-group">
                <label [for]="grupo.formField">{{ grupo.label }} *</label>
                <select
                  [id]="grupo.formField"
                  [formControlName]="grupo.formField"
                  class="form-control"
                >
                  <option value="">Seleccionar...</option>
                  @for (opt of grupo.options; track opt.parametro) {
                    <option [value]="opt.parametro">
                      {{ opt.parametro }} ({{ opt.puntaje }} pts)
                    </option>
                  }
                </select>
              </div>
            }
          }

          <div class="form-group full-width scoring-summary">
            <div class="score-display">
              <div class="score-item">
                <span class="score-label">Puntaje Total</span>
                <span class="score-value">{{ calculatedPuntaje }}</span>
              </div>
              <div class="score-item">
                <span class="score-label">Resultado</span>
                <aero-badge [variant]="resultadoBadgeVariant">
                  {{ calculatedResultado }}
                </aero-badge>
              </div>
            </div>
          </div>
        </app-form-section>

        <app-form-section title="Observaciones" icon="fa-comment" [columns]="1">
          <div class="form-group full-width">
            <label for="observacion">Observación</label>
            <textarea
              id="observacion"
              formControlName="observacion"
              class="form-control"
              rows="4"
              placeholder="Observaciones adicionales sobre la evaluación..."
            ></textarea>
          </div>
        </app-form-section>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout';

      .loading-text {
        color: var(--grey-500);
        font-style: italic;
        margin: 0;
      }

      .full-width {
        grid-column: 1 / -1;
      }

      .scoring-summary {
        margin-top: var(--s-16);
        padding-top: var(--s-16);
        border-top: 1px solid var(--grey-200);
      }

      .score-display {
        display: flex;
        gap: var(--s-32);
        align-items: center;
      }

      .score-item {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
      }

      .score-label {
        font-size: 12px;
        font-weight: 500;
        color: var(--grey-500);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .score-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--primary-900);
      }
    `,
  ],
})
export class EvaluacionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly evaluacionService = inject(EvaluacionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form: FormGroup;
  isEditMode = false;
  saving = false;
  loadingCriterios = true;
  evaluacionId: number | null = null;

  criterios: CriterioSeleccionEvaluacion[] = [];
  aspectoGroups: AspectoGroup[] = [];

  /** Maps aspecto name -> form field name */
  private readonly aspectoFieldMap: Record<string, string> = {
    Precios: 'precio',
    'Plazo de pago': 'plazo_pago',
    Calidad: 'calidad',
    'Plazo de Cumplimiento': 'plazo_cumplimiento',
    Ubicacion: 'ubicacion',
    'Atencion al cliente': 'atencion_cliente',
    SGC: 'sgc',
    SGSST: 'sgsst',
    SGA: 'sga',
  };

  private readonly aspectoLabels: Record<string, string> = {
    Precios: 'Precios',
    'Plazo de pago': 'Plazo de Pago',
    Calidad: 'Calidad',
    'Plazo de Cumplimiento': 'Plazo de Cumplimiento',
    Ubicacion: 'Ubicaci\u00f3n',
    'Atencion al cliente': 'Atenci\u00f3n al Cliente',
    SGC: 'SGC',
    SGSST: 'SGSST',
    SGA: 'SGA',
  };

  calculatedPuntaje = 0;
  calculatedResultado = '-';

  get resultadoBadgeVariant(): 'error' | 'warning' | 'info' | 'success' | 'neutral' {
    switch (this.calculatedResultado) {
      case 'P\u00e9simo':
        return 'error';
      case 'Regular':
        return 'warning';
      case 'Bueno':
        return 'info';
      case 'Muy Bueno':
      case 'Excelente':
        return 'success';
      default:
        return 'neutral';
    }
  }

  constructor() {
    this.form = this.fb.group({
      ruc: ['', Validators.required],
      razon_social: ['', Validators.required],
      fecha_evaluacion: [new Date().toISOString().split('T')[0], Validators.required],
      evaluado_por: [''],
      precio: ['', Validators.required],
      plazo_pago: ['', Validators.required],
      calidad: ['', Validators.required],
      plazo_cumplimiento: ['', Validators.required],
      ubicacion: ['', Validators.required],
      atencion_cliente: ['', Validators.required],
      sgc: ['', Validators.required],
      sgsst: ['', Validators.required],
      sga: ['', Validators.required],
      observacion: [''],
    });

    // Subscribe to criteria field changes for real-time score calculation
    const criteriaFields = [
      'precio',
      'plazo_pago',
      'calidad',
      'plazo_cumplimiento',
      'ubicacion',
      'atencion_cliente',
      'sgc',
      'sgsst',
      'sga',
    ];
    criteriaFields.forEach((field) => {
      this.form.get(field)?.valueChanges.subscribe(() => this.recalculateScore());
    });
  }

  ngOnInit(): void {
    this.loadCriterios();

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.evaluacionId = +params['id'];
        this.loadEvaluacion(this.evaluacionId);
      }
    });
  }

  loadCriterios(): void {
    this.loadingCriterios = true;
    this.evaluacionService.getCriterios().subscribe({
      next: (criterios) => {
        this.criterios = criterios;
        this.buildAspectoGroups();
        this.loadingCriterios = false;
      },
      error: () => {
        this.loadingCriterios = false;
      },
    });
  }

  buildAspectoGroups(): void {
    const grouped = new Map<string, CriterioOption[]>();

    this.criterios.forEach((c) => {
      if (!c.aspecto) return;
      if (!grouped.has(c.aspecto)) {
        grouped.set(c.aspecto, []);
      }
      grouped.get(c.aspecto)!.push({
        parametro: c.parametro || '',
        puntaje: c.puntaje || 0,
      });
    });

    this.aspectoGroups = [];
    for (const [aspecto, options] of grouped) {
      const formField = this.aspectoFieldMap[aspecto];
      if (formField) {
        this.aspectoGroups.push({
          aspecto,
          formField,
          label: this.aspectoLabels[aspecto] || aspecto,
          options,
        });
      }
    }
  }

  recalculateScore(): void {
    let total = 0;
    const criteriaFields = [
      'precio',
      'plazo_pago',
      'calidad',
      'plazo_cumplimiento',
      'ubicacion',
      'atencion_cliente',
      'sgc',
      'sgsst',
      'sga',
    ];

    criteriaFields.forEach((field) => {
      const selectedParametro = this.form.get(field)?.value;
      if (selectedParametro) {
        const aspecto = Object.entries(this.aspectoFieldMap).find(([, f]) => f === field)?.[0];
        if (aspecto) {
          const grupo = this.aspectoGroups.find((g) => g.aspecto === aspecto);
          const option = grupo?.options.find((o) => o.parametro === selectedParametro);
          if (option) {
            total += option.puntaje;
          }
        }
      }
    });

    this.calculatedPuntaje = total;
    this.calculatedResultado = this.getResultado(total);
  }

  getResultado(puntaje: number): string {
    if (puntaje <= 0) return '-';
    if (puntaje <= 10) return 'P\u00e9simo';
    if (puntaje <= 12) return 'Regular';
    if (puntaje <= 15) return 'Bueno';
    if (puntaje <= 18) return 'Muy Bueno';
    return 'Excelente';
  }

  loadEvaluacion(id: number): void {
    this.saving = true;
    this.evaluacionService.getEvaluacion(id).subscribe({
      next: (ev) => {
        this.form.patchValue({
          ruc: ev.ruc || '',
          razon_social: ev.razon_social || '',
          fecha_evaluacion: ev.fecha_evaluacion ? ev.fecha_evaluacion.split('T')[0] : '',
          evaluado_por: ev.evaluado_por || '',
          precio: ev.precio || '',
          plazo_pago: ev.plazo_pago || '',
          calidad: ev.calidad || '',
          plazo_cumplimiento: ev.plazo_cumplimiento || '',
          ubicacion: ev.ubicacion || '',
          atencion_cliente: ev.atencion_cliente || '',
          sgc: ev.sgc || '',
          sgsst: ev.sgsst || '',
          sga: ev.sga || '',
          observacion: ev.observacion || '',
        });
        this.recalculateScore();
        this.saving = false;
      },
      error: () => {
        this.saving = false;
        this.router.navigate(['/providers/evaluaciones']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const formData = this.form.value;

    const payload: EvaluacionProveedorCrear = {
      ruc: formData.ruc,
      razon_social: formData.razon_social,
      precio: formData.precio,
      plazo_pago: formData.plazo_pago,
      calidad: formData.calidad,
      plazo_cumplimiento: formData.plazo_cumplimiento,
      ubicacion: formData.ubicacion,
      atencion_cliente: formData.atencion_cliente,
      sgc: formData.sgc,
      sgsst: formData.sgsst,
      sga: formData.sga,
      puntaje: this.calculatedPuntaje,
      observacion: formData.observacion || null,
      fecha_evaluacion: formData.fecha_evaluacion || null,
      evaluado_por: formData.evaluado_por || null,
    };

    if (this.isEditMode && this.evaluacionId) {
      this.evaluacionService.updateEvaluacion(this.evaluacionId, payload).subscribe({
        next: () => {
          this.router.navigate(['/providers/evaluaciones', this.evaluacionId]);
        },
        error: () => {
          this.saving = false;
        },
      });
    } else {
      this.evaluacionService.createEvaluacion(payload).subscribe({
        next: (res) => {
          this.router.navigate(['/providers/evaluaciones', res.id]);
        },
        error: () => {
          this.saving = false;
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/providers/evaluaciones']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
