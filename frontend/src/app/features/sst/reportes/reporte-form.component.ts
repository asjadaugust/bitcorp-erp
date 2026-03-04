import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  InspeccionSsomaService,
  ActoCondicionInseguro,
} from '../inspecciones/inspeccion-ssoma.service';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { FormContainerComponent } from '../../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';

@Component({
  selector: 'app-reporte-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ValidationErrorsComponent,
    AlertComponent,
    FormContainerComponent,
    FormSectionComponent,
  ],
  template: `
    <app-form-container
      [icon]="isEditMode ? 'fa-pen' : 'fa-file-lines'"
      [title]="isEditMode ? 'Editar Reporte A/C' : 'Nuevo Reporte A/C'"
      [subtitle]="
        isEditMode
          ? 'Actualizar reporte de acto/condición insegura'
          : 'Registrar un nuevo reporte de acto/condición insegura'
      "
      submitLabel="Guardar"
      submitIcon="fa-save"
      backUrl="/sst/reportes-acto"
      [loading]="loading"
      [disableSubmit]="form.invalid || loading"
      (submitted)="onSubmit()"
      (cancelled)="onCancel()"
    >
      <app-validation-errors *ngIf="validationErrors.length > 0" [errors]="validationErrors">
      </app-validation-errors>
      <app-alert
        *ngIf="errorMessage"
        type="error"
        [message]="errorMessage"
        [dismissible]="true"
        (dismiss)="errorMessage = null"
      >
      </app-alert>

      <form [formGroup]="form" class="form-grid">
        <app-form-section title="Datos del Reportante" icon="fa-user">
          <div class="form-group">
            <label class="form-label">DNI Reportante</label>
            <input
              type="text"
              formControlName="reportado_por_dni"
              class="form-control"
              placeholder="DNI"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Nombre Reportante</label>
            <input
              type="text"
              formControlName="reportado_por_nombre"
              class="form-control"
              placeholder="Nombre completo"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Cargo</label>
            <input
              type="text"
              formControlName="cargo"
              class="form-control"
              placeholder="Cargo del reportante"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Empresa Reportante</label>
            <input
              type="text"
              formControlName="empresa_reportante"
              class="form-control"
              placeholder="Empresa"
            />
          </div>
        </app-form-section>

        <app-form-section title="Datos del Evento" icon="fa-calendar-day">
          <div class="form-group">
            <label class="form-label">Fecha Evento</label>
            <input type="date" formControlName="fecha_evento" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Lugar</label>
            <input
              type="text"
              formControlName="lugar"
              class="form-control"
              placeholder="Lugar del evento"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Empresa</label>
            <input
              type="text"
              formControlName="empresa"
              class="form-control"
              placeholder="Empresa involucrada"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Sistema de Gestión</label>
            <select formControlName="sistema_gestion" class="form-control">
              <option value="">Seleccionar...</option>
              <option value="SST (SEGURIDAD)">SST (SEGURIDAD)</option>
              <option value="GESTION AMBIENTAL">GESTION AMBIENTAL</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de Reporte</label>
            <select formControlName="tipo_reporte" class="form-control">
              <option value="">Seleccionar...</option>
              <option value="ACTO INSEGURO">ACTO INSEGURO</option>
              <option value="CONDICION INSEGURA">CONDICION INSEGURA</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Acto/Condición</label>
            <select formControlName="acto_condicion" class="form-control">
              <option value="">Seleccionar...</option>
              @for (item of filteredCatalog; track item.id) {
                <option [value]="item.acto_condicion">
                  {{ item.codigo }} - {{ item.acto_condicion }}
                </option>
              }
            </select>
          </div>
        </app-form-section>

        <app-form-section title="Daños" icon="fa-triangle-exclamation" [columns]="1">
          <div class="form-group full-width">
            <label class="form-label">Daño A</label>
            <textarea
              formControlName="dano_a"
              class="form-control"
              rows="2"
              placeholder="Valores separados por punto y coma (ej: CABEZA;OJOS Y CARA)"
            ></textarea>
          </div>
          <div class="form-group full-width">
            <label class="form-label">Descripción</label>
            <textarea
              formControlName="descripcion"
              class="form-control"
              rows="3"
              placeholder="Describa lo sucedido..."
            ></textarea>
          </div>
          <div class="form-group full-width">
            <label class="form-label">Cómo actué</label>
            <textarea
              formControlName="como_actue"
              class="form-control"
              rows="3"
              placeholder="Describa cómo actuó..."
            ></textarea>
          </div>
        </app-form-section>

        <app-form-section title="Análisis 5 Por Qué" icon="fa-question">
          <div class="form-group full-width">
            <label class="form-label">Por qué 1</label>
            <input
              type="text"
              formControlName="por_que_1"
              class="form-control"
              placeholder="Primera causa raíz..."
            />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Por qué 2</label>
            <input
              type="text"
              formControlName="por_que_2"
              class="form-control"
              placeholder="Segunda causa..."
            />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Por qué 3</label>
            <input
              type="text"
              formControlName="por_que_3"
              class="form-control"
              placeholder="Tercera causa..."
            />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Por qué 4</label>
            <input
              type="text"
              formControlName="por_que_4"
              class="form-control"
              placeholder="Cuarta causa..."
            />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Por qué 5</label>
            <input
              type="text"
              formControlName="por_que_5"
              class="form-control"
              placeholder="Quinta causa..."
            />
          </div>
        </app-form-section>

        <app-form-section title="Acción Correctiva" icon="fa-check-double" [columns]="1">
          <div class="form-group full-width">
            <label class="form-label">Acción Correctiva</label>
            <textarea
              formControlName="accion_correctiva"
              class="form-control"
              rows="4"
              placeholder="Describa la acción correctiva..."
            ></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select formControlName="estado" class="form-control">
              <option value="ABIERTO">Abierto</option>
              <option value="CERRADO">Cerrado</option>
            </select>
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
export class ReporteFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(InspeccionSsomaService);
  private readonly errorHandler = inject(FormErrorHandlerService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  reporteId?: number;
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  catalog: ActoCondicionInseguro[] = [];
  filteredCatalog: ActoCondicionInseguro[] = [];

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    this.reporteId = idParam ? parseInt(idParam, 10) : undefined;
    this.isEditMode = !!this.reporteId;
    this.initForm();
    this.loadCatalog();
    if (this.isEditMode) this.loadReporte();
  }

  initForm(): void {
    this.form = this.fb.group({
      reportado_por_dni: [''],
      reportado_por_nombre: [''],
      cargo: [''],
      empresa_reportante: [''],
      fecha_evento: [''],
      lugar: [''],
      empresa: [''],
      sistema_gestion: [''],
      tipo_reporte: [''],
      acto_condicion: [''],
      dano_a: [''],
      descripcion: [''],
      como_actue: [''],
      por_que_1: [''],
      por_que_2: [''],
      por_que_3: [''],
      por_que_4: [''],
      por_que_5: [''],
      accion_correctiva: [''],
      estado: ['ABIERTO'],
    });

    // Filter catalog when tipo_reporte changes
    this.form.get('tipo_reporte')?.valueChanges.subscribe((tipo: string) => {
      this.filterCatalog(tipo);
      // Reset acto_condicion when tipo changes
      this.form.get('acto_condicion')?.setValue('');
    });
  }

  loadCatalog(): void {
    this.service.getActosCondicion().subscribe({
      next: (items) => {
        this.catalog = items;
        const currentTipo = this.form.get('tipo_reporte')?.value;
        this.filterCatalog(currentTipo);
      },
      error: () => {
        this.catalog = [];
        this.filteredCatalog = [];
      },
    });
  }

  filterCatalog(tipoReporte: string): void {
    if (!tipoReporte) {
      this.filteredCatalog = this.catalog;
    } else {
      this.filteredCatalog = this.catalog.filter((item) => item.categoria === tipoReporte);
    }
  }

  loadReporte(): void {
    if (!this.reporteId) return;
    this.loading = true;
    this.service.getReporte(this.reporteId).subscribe({
      next: (reporte) => {
        this.form.patchValue({
          reportado_por_dni: reporte.reportado_por_dni ?? '',
          reportado_por_nombre: reporte.reportado_por_nombre ?? '',
          cargo: reporte.cargo ?? '',
          empresa_reportante: reporte.empresa_reportante ?? '',
          fecha_evento: reporte.fecha_evento ? reporte.fecha_evento.split('T')[0] : '',
          lugar: reporte.lugar ?? '',
          empresa: reporte.empresa ?? '',
          sistema_gestion: reporte.sistema_gestion ?? '',
          tipo_reporte: reporte.tipo_reporte ?? '',
          acto_condicion: reporte.acto_condicion ?? '',
          dano_a: reporte.dano_a ?? '',
          descripcion: reporte.descripcion ?? '',
          como_actue: reporte.como_actue ?? '',
          por_que_1: reporte.por_que_1 ?? '',
          por_que_2: reporte.por_que_2 ?? '',
          por_que_3: reporte.por_que_3 ?? '',
          por_que_4: reporte.por_que_4 ?? '',
          por_que_5: reporte.por_que_5 ?? '',
          accion_correctiva: reporte.accion_correctiva ?? '',
          estado: reporte.estado ?? 'ABIERTO',
        });
        // Re-filter catalog after patching tipo_reporte
        this.filterCatalog(reporte.tipo_reporte ?? '');
        // Re-set acto_condicion after filtering (since the subscription reset it)
        setTimeout(() => {
          this.form
            .get('acto_condicion')
            ?.setValue(reporte.acto_condicion ?? '', { emitEvent: false });
        });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.validationErrors = [];
    this.errorMessage = null;

    const payload = { ...this.form.value };
    // Clean empty strings to null
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') payload[key] = null;
    });

    const req =
      this.isEditMode && this.reporteId
        ? this.service.updateReporte(this.reporteId, payload)
        : this.service.createReporte(payload);

    req.subscribe({
      next: (result) => {
        if (this.isEditMode && this.reporteId) {
          this.router.navigate(['/sst/reportes-acto', this.reporteId]);
        } else {
          this.router.navigate(['/sst/reportes-acto', result.id]);
        }
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/sst/reportes-acto']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
