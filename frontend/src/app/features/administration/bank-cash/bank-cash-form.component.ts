import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BankCashService, CuentaCajaBanco, FlujoCajaBancoDetalle } from './bank-cash.service';
import { FormContainerComponent } from '../../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';
import { AeroButtonComponent, AeroDatePickerComponent } from '../../../core/design-system';
import { forkJoin } from 'rxjs';

const CLASIFICACION_OPTIONS = [
  'VALORIZACION',
  'PAGO DE MATERIAL',
  'PAGO DE EQUIPO',
  'PAGO DE TRABAJADOR',
  'PAGO DE SUBCONTRATO',
  'PAGO DE SERVICIO',
  'PAGO DE DETRACCION',
  'PAGO DE IGV',
  'ITF',
  'PAGO DE COMISION',
  'GASTO BANCARIO',
  'OTROS GASTOS',
  'AMORTIZACION',
  'INTERES',
  'MOVIMIENTO',
  'OTROS INGRESOS',
  'PRESTAMO',
];

@Component({
  selector: 'app-bank-cash-form',
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
      [title]="isEditMode ? 'Editar Movimiento' : 'Nuevo Movimiento'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del movimiento bancario'
          : 'Registrar un nuevo movimiento de caja y banco'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-building-columns'"
      [loading]="loading"
      [disableSubmit]="form.invalid || loading"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Movimiento'"
      (submitted)="onSubmit()"
      (cancelled)="cancel()"
    >
      <form [formGroup]="form" class="form-grid">
        <!-- Datos del Movimiento -->
        <app-form-section title="Datos del Movimiento" icon="fa-building-columns">
          <div class="form-group">
            <label for="tipo_movimiento">Tipo de Movimiento *</label>
            <select
              id="tipo_movimiento"
              formControlName="tipo_movimiento"
              class="form-control form-select"
            >
              <option value="">Seleccionar...</option>
              <option value="SALIDA">Salida</option>
              <option value="INGRESO">Ingreso</option>
            </select>
            <div class="error-msg" *ngIf="hasError('tipo_movimiento')">
              Tipo de movimiento es requerido
            </div>
          </div>

          <div class="form-group">
            <aero-date-picker
              [mode]="'single'"
              formControlName="fecha_movimiento"
              label="Fecha del Movimiento"
            ></aero-date-picker>
          </div>

          <div class="form-group">
            <label for="numero_cuenta_origen">Cuenta Origen *</label>
            <select
              id="numero_cuenta_origen"
              formControlName="numero_cuenta_origen"
              class="form-control form-select"
              (change)="onCuentaSelected()"
            >
              <option value="">Seleccionar cuenta...</option>
              <option *ngFor="let c of cuentas" [value]="c.numero_cuenta">
                {{ c.numero_cuenta }} - {{ c.cuenta }}
              </option>
            </select>
            <div class="error-msg" *ngIf="hasError('numero_cuenta_origen')">
              Cuenta origen es requerida
            </div>
          </div>

          <div class="form-group">
            <label for="cuenta_origen">Nombre Cuenta Origen</label>
            <input
              id="cuenta_origen"
              type="text"
              formControlName="cuenta_origen"
              class="form-control"
              placeholder="Se auto-completa al seleccionar cuenta"
              readonly
            />
          </div>

          <div class="form-group">
            <label for="numero_cuenta_destino">N° Cuenta Destino</label>
            <input
              id="numero_cuenta_destino"
              type="text"
              formControlName="numero_cuenta_destino"
              class="form-control"
              placeholder="Número de cuenta destino"
            />
          </div>

          <div class="form-group">
            <label for="cuenta_destino">Nombre Cuenta Destino</label>
            <input
              id="cuenta_destino"
              type="text"
              formControlName="cuenta_destino"
              class="form-control"
              placeholder="Nombre de la cuenta destino"
            />
          </div>

          <div class="form-group">
            <label for="concepto">Concepto</label>
            <input
              id="concepto"
              type="text"
              formControlName="concepto"
              class="form-control"
              placeholder="Descripción del movimiento"
            />
          </div>

          <div class="form-group">
            <label for="moneda">Moneda</label>
            <select id="moneda" formControlName="moneda" class="form-control form-select">
              <option value="">Seleccionar...</option>
              <option value="SOLES">Soles</option>
              <option value="DOLARES">Dólares</option>
            </select>
          </div>

          <div class="form-group">
            <label for="total">Total</label>
            <input
              id="total"
              type="number"
              formControlName="total"
              class="form-control"
              placeholder="0.00"
              readonly
            />
          </div>

          <div class="form-group">
            <label for="voucher">Voucher</label>
            <input
              id="voucher"
              type="text"
              formControlName="voucher"
              class="form-control"
              placeholder="Número de voucher"
            />
          </div>
        </app-form-section>

        <!-- Detalle de Movimientos -->
        <app-form-section title="Detalle de Movimientos" icon="fa-list-ol" [columns]="1">
          <div class="detalles-header">
            <p class="detalles-info">
              Agregue las líneas de detalle del movimiento. El total se calcula automáticamente.
            </p>
            <aero-button
              variant="secondary"
              size="small"
              iconLeft="fa-plus"
              (clicked)="addDetalle()"
            >
              Agregar Detalle
            </aero-button>
          </div>

          <div class="detalles-table" *ngIf="detalles.length > 0">
            <div class="detalles-table-header">
              <span class="col-clasificacion">Clasificación</span>
              <span class="col-concepto">Concepto</span>
              <span class="col-monto">Monto</span>
              <span class="col-actions"></span>
            </div>

            <div
              *ngFor="let detalle of detalles.controls; let i = index"
              class="detalles-row"
              [formGroupName]="i"
            >
              <div class="col-clasificacion">
                <select formControlName="clasificacion" class="form-control form-select">
                  <option value="">Seleccionar...</option>
                  <option *ngFor="let opt of clasificacionOptions" [value]="opt">
                    {{ opt }}
                  </option>
                </select>
              </div>

              <div class="col-concepto">
                <input
                  type="text"
                  formControlName="concepto"
                  class="form-control"
                  placeholder="Concepto del detalle"
                />
              </div>

              <div class="col-monto">
                <input
                  type="number"
                  formControlName="monto"
                  class="form-control"
                  placeholder="0.00"
                  (input)="recalcTotal()"
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
            No hay líneas de detalle. Haga clic en "Agregar Detalle" para añadir una.
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
        grid-template-columns: 1fr 1fr 120px 48px;
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
        grid-template-columns: 1fr 1fr 120px 48px;
        gap: var(--s-8);
        padding: var(--s-8) var(--s-16);
        border-top: 1px solid var(--grey-150);
        align-items: center;

        .form-control {
          height: 36px;
          font-size: 13px;
        }
      }

      .col-monto {
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
export class BankCashFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bankCashService = inject(BankCashService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form: FormGroup;
  isEditMode = false;
  loading = false;
  flujoId: number | null = null;
  cuentas: CuentaCajaBanco[] = [];
  clasificacionOptions = CLASIFICACION_OPTIONS;

  constructor() {
    this.form = this.fb.group({
      tipo_movimiento: ['', Validators.required],
      fecha_movimiento: [new Date().toISOString().split('T')[0]],
      numero_cuenta_origen: ['', Validators.required],
      cuenta_origen: [''],
      numero_cuenta_destino: [''],
      cuenta_destino: [''],
      concepto: [''],
      moneda: ['SOLES'],
      total: [{ value: 0, disabled: true }],
      voucher: [''],
      detalles: this.fb.array([]),
    });
  }

  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  ngOnInit(): void {
    // Load available cuentas for dropdown
    this.bankCashService.getCuentas().subscribe((c) => (this.cuentas = c));

    this.route.params.subscribe((params) => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode = true;
        this.flujoId = +params['id'];
        this.loadFlujo(this.flujoId);
      }
    });
  }

  loadFlujo(id: number): void {
    this.loading = true;
    this.bankCashService.getFlujo(id).subscribe({
      next: (flujo: FlujoCajaBancoDetalle) => {
        this.form.patchValue({
          tipo_movimiento: flujo.tipo_movimiento || '',
          fecha_movimiento: flujo.fecha_movimiento ? flujo.fecha_movimiento.split('T')[0] : '',
          numero_cuenta_origen: flujo.numero_cuenta_origen || '',
          cuenta_origen: flujo.cuenta_origen || '',
          numero_cuenta_destino: flujo.numero_cuenta_destino || '',
          cuenta_destino: flujo.cuenta_destino || '',
          concepto: flujo.concepto || '',
          moneda: flujo.moneda || '',
          total: flujo.total || 0,
          voucher: flujo.voucher || '',
        });

        // Populate detalles FormArray
        if (flujo.detalles && flujo.detalles.length > 0) {
          flujo.detalles.forEach((d) => {
            this.detalles.push(
              this.fb.group({
                id: [d.id],
                clasificacion: [d.clasificacion || ''],
                concepto: [d.concepto || ''],
                monto: [d.monto || 0],
              })
            );
          });
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/administracion/bank-cash']);
      },
    });
  }

  onCuentaSelected(): void {
    const numeroCuenta = this.form.get('numero_cuenta_origen')?.value;
    const cuenta = this.cuentas.find((c) => c.numero_cuenta === numeroCuenta);
    if (cuenta) {
      this.form.patchValue({ cuenta_origen: cuenta.cuenta });
    } else {
      this.form.patchValue({ cuenta_origen: '' });
    }
  }

  addDetalle(): void {
    this.detalles.push(
      this.fb.group({
        clasificacion: [''],
        concepto: [''],
        monto: [0],
      })
    );
    this.recalcTotal();
  }

  removeDetalle(index: number): void {
    this.detalles.removeAt(index);
    this.recalcTotal();
  }

  recalcTotal(): void {
    const total = this.detalles.controls.reduce(
      (sum, ctrl) => sum + (ctrl.get('monto')?.value || 0),
      0
    );
    this.form.get('total')?.setValue(total, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const formData = this.form.getRawValue();
    const detallesData = formData.detalles;
    delete formData.detalles;

    if (this.isEditMode && this.flujoId) {
      this.bankCashService.updateFlujo(this.flujoId, formData).subscribe({
        next: () => {
          // Create new detail lines (skip existing ones with id)
          const newDetalles = detallesData.filter((d: Record<string, unknown>) => !d['id']);
          if (newDetalles.length > 0 && this.flujoId) {
            const creates = newDetalles.map(
              (d: { concepto: string; clasificacion: string; monto: number }) =>
                this.bankCashService.createDetalle(this.flujoId!, {
                  concepto: d.concepto,
                  clasificacion: d.clasificacion,
                  monto: d.monto,
                })
            );
            forkJoin(creates).subscribe({
              next: () => this.router.navigate(['/administracion/bank-cash']),
              error: () => {
                this.loading = false;
              },
            });
          } else {
            this.router.navigate(['/administracion/bank-cash']);
          }
        },
        error: () => {
          this.loading = false;
        },
      });
    } else {
      this.bankCashService.createFlujo(formData).subscribe({
        next: (result) => {
          const flujoId = result.id;
          if (detallesData.length > 0) {
            const creates = detallesData.map(
              (d: { concepto: string; clasificacion: string; monto: number }) =>
                this.bankCashService.createDetalle(flujoId, {
                  concepto: d.concepto,
                  clasificacion: d.clasificacion,
                  monto: d.monto,
                })
            );
            forkJoin(creates).subscribe({
              next: () => this.router.navigate(['/administracion/bank-cash']),
              error: () => {
                this.loading = false;
              },
            });
          } else {
            this.router.navigate(['/administracion/bank-cash']);
          }
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/administracion/bank-cash']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
