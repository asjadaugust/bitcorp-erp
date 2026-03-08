import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SolicitudMaterialService, RequerimientoDetalle } from './solicitud-material.service';
import { FormContainerComponent } from '../../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';
import { AeroButtonComponent, AeroDatePickerComponent } from '../../../core/design-system';

@Component({
  selector: 'app-requerimiento-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormContainerComponent,
    FormSectionComponent,
    AeroButtonComponent,
    AeroDatePickerComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Requerimiento' : 'Nuevo Requerimiento'"
      [subtitle]="isEditMode ? 'Actualizar el requerimiento' : 'Registrar un nuevo requerimiento'"
      [icon]="isEditMode ? 'fa-pen' : 'fa-clipboard-list'"
      [loading]="loading"
      [disableSubmit]="form.invalid || loading"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Requerimiento'"
      (submitted)="onSubmit()"
      (cancelled)="cancel()"
    >
      <form [formGroup]="form" class="form-grid">
        <!-- Datos del Requerimiento -->
        <app-form-section title="Datos del Requerimiento" icon="fa-clipboard-list">
          <div class="form-group">
            <label for="motivo">Motivo *</label>
            <input
              id="motivo"
              type="text"
              formControlName="motivo"
              class="form-control"
              placeholder="Motivo del requerimiento"
            />
            <div class="error-msg" *ngIf="hasError('motivo')">Motivo es requerido</div>
          </div>

          <div class="form-group">
            <aero-date-picker
              [mode]="'single'"
              label="Fecha de Requerimiento"
              formControlName="fecha_requerimiento"
            ></aero-date-picker>
          </div>

          <div class="form-group">
            <label for="solicitado_por">Solicitado Por</label>
            <input
              id="solicitado_por"
              type="text"
              formControlName="solicitado_por"
              class="form-control"
              placeholder="Nombre del solicitante"
            />
          </div>
        </app-form-section>

        <!-- Detalle del Requerimiento -->
        <app-form-section title="Detalle del Requerimiento" icon="fa-list-ol" [columns]="1">
          <div class="detalles-header">
            <p class="detalles-info">Agregue las lineas de detalle del requerimiento.</p>
            <aero-button
              variant="secondary"
              size="small"
              iconLeft="fa-plus"
              (clicked)="addDetalle()"
            >
              Agregar Linea
            </aero-button>
          </div>

          <div class="detalles-table" *ngIf="detalles.length > 0">
            <div class="detalles-table-header">
              <span class="col-producto">Producto</span>
              <span class="col-cantidad">Cantidad</span>
              <span class="col-unidad">Unidad</span>
              <span class="col-estatus">Estatus</span>
              <span class="col-actions"></span>
            </div>

            <div
              *ngFor="let detalle of detalles.controls; let i = index"
              class="detalles-row"
              [formGroupName]="i"
            >
              <div class="col-producto">
                <input
                  type="text"
                  formControlName="producto"
                  class="form-control"
                  placeholder="Nombre del producto"
                />
              </div>

              <div class="col-cantidad">
                <input
                  type="number"
                  formControlName="cantidad"
                  class="form-control"
                  placeholder="0"
                />
              </div>

              <div class="col-unidad">
                <input
                  type="text"
                  formControlName="unidad_medida"
                  class="form-control"
                  placeholder="UND"
                />
              </div>

              <div class="col-estatus">
                <input
                  type="text"
                  formControlName="estatus"
                  class="form-control"
                  placeholder="PENDIENTE"
                  readonly
                />
              </div>

              <div class="col-actions">
                <aero-button
                  variant="text"
                  size="small"
                  iconLeft="fa-trash"
                  (clicked)="removeDetalle(i)"
                >
                </aero-button>
              </div>
            </div>
          </div>

          <div *ngIf="detalles.length === 0" class="detalles-empty">
            No hay lineas de detalle. Haga clic en "Agregar Linea" para agregar una.
          </div>
        </app-form-section>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout';

      .detalles-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-16);
        gap: var(--s-16);
      }

      .detalles-info {
        margin: 0;
        font-size: 13px;
        color: var(--grey-600);
      }

      .detalles-table {
        border: 1px solid var(--grey-200);
        border-radius: 8px;
        overflow: hidden;
      }

      .detalles-table-header {
        display: grid;
        grid-template-columns: 1fr 100px 100px 120px 48px;
        gap: var(--s-8);
        padding: var(--s-12) var(--s-16);
        background: var(--grey-100);
        font-size: 12px;
        font-weight: 600;
        color: var(--grey-700);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .detalles-row {
        display: grid;
        grid-template-columns: 1fr 100px 100px 120px 48px;
        gap: var(--s-8);
        padding: var(--s-8) var(--s-16);
        border-top: 1px solid var(--grey-150);
        align-items: center;

        .form-control {
          height: 36px;
          font-size: 13px;
        }
      }

      .col-cantidad {
        text-align: right;
      }

      .col-actions {
        display: flex;
        justify-content: center;
      }

      .detalles-empty {
        padding: var(--s-24);
        text-align: center;
        color: var(--grey-500);
        font-size: 14px;
        background: var(--grey-50);
        border-radius: 8px;
        border: 1px dashed var(--grey-300);
      }

      @media (max-width: 768px) {
        .detalles-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .detalles-table-header {
          display: none;
        }

        .detalles-row {
          grid-template-columns: 1fr;
          gap: var(--s-8);
          padding: var(--s-16);
        }

        .col-actions {
          justify-content: flex-end;
        }
      }
    `,
  ],
})
export class RequerimientoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly solicitudService = inject(SolicitudMaterialService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form: FormGroup;
  isEditMode = false;
  loading = false;
  requerimientoId: number | null = null;

  constructor() {
    this.form = this.fb.group({
      motivo: ['', Validators.required],
      fecha_requerimiento: [new Date().toISOString().split('T')[0]],
      solicitado_por: [''],
      detalles: this.fb.array([]),
    });
  }

  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode = true;
        this.requerimientoId = +params['id'];
        this.loadRequerimiento(this.requerimientoId);
      }
    });
  }

  loadRequerimiento(id: number): void {
    this.loading = true;
    this.solicitudService.getRequerimiento(id).subscribe({
      next: (req: RequerimientoDetalle) => {
        this.form.patchValue({
          motivo: req.motivo || '',
          fecha_requerimiento: req.fecha_requerimiento ? req.fecha_requerimiento.split('T')[0] : '',
          solicitado_por: req.solicitado_por || '',
        });

        // Populate detalles FormArray
        if (req.detalles && req.detalles.length > 0) {
          req.detalles.forEach((d) => {
            this.detalles.push(
              this.fb.group({
                id: [d.id],
                producto: [d.producto || ''],
                cantidad: [d.cantidad || 0],
                unidad_medida: [d.unidad_medida || ''],
                estatus: [d.estatus || 'PENDIENTE'],
              })
            );
          });
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/logistics/requirements']);
      },
    });
  }

  addDetalle(): void {
    this.detalles.push(
      this.fb.group({
        producto: [''],
        cantidad: [0],
        unidad_medida: [''],
        estatus: ['PENDIENTE'],
      })
    );
  }

  removeDetalle(index: number): void {
    this.detalles.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const formData = this.form.getRawValue();

    if (this.isEditMode && this.requerimientoId) {
      const { detalles, ...headerData } = formData;
      this.solicitudService.updateRequerimiento(this.requerimientoId, headerData).subscribe({
        next: () => {
          this.router.navigate(['/logistics/requirements']);
        },
        error: () => {
          this.loading = false;
        },
      });
    } else {
      this.solicitudService.createRequerimiento(formData).subscribe({
        next: () => {
          this.router.navigate(['/logistics/requirements']);
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/logistics/requirements']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
