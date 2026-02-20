import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';
import { FuelService } from '../../core/services/fuel.service';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';

@Component({
  selector: 'app-fuel-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DropdownComponent,
    FormContainerComponent,
  ],
  template: `
    <app-form-container
      [icon]="isEditMode ? 'fa-pen' : 'fa-gas-pump'"
      [title]="isEditMode ? 'Editar Registro de Combustible' : 'Nuevo Registro de Combustible'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del registro'
          : 'Registrar nuevo abastecimiento de combustible'
      "
      submitLabel="Guardar Registro"
      submitIcon="fa-save"
      [loading]="loading"
      [disableSubmit]="fuelForm.invalid || loading"
      (onSubmit)="onSubmit()"
      (onCancel)="cancel()"
    >
      <form [formGroup]="fuelForm" class="form-grid">
        <!-- Section 1: Basic Information -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fa-solid fa-gas-pump"></i> Detalles del Abastecimiento
          </h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="fecha">Fecha *</label>
              <input id="fecha" type="date" formControlName="fecha" class="form-control" />
              <div class="error-msg" *ngIf="hasError('fecha')">Fecha es requerida</div>
            </div>

            <div class="form-group">
              <label for="valorizacion_id">Valorización ID *</label>
              <input
                id="valorizacion_id"
                type="number"
                formControlName="valorizacion_id"
                class="form-control"
                placeholder="ID de valorización"
              />
              <div class="error-msg" *ngIf="hasError('valorizacion_id')">
                Valorización es requerida
              </div>
            </div>

            <div class="form-group">
              <label for="proveedor">Proveedor</label>
              <input
                id="proveedor"
                type="text"
                formControlName="proveedor"
                class="form-control"
                placeholder="Nombre del proveedor"
              />
            </div>

            <div class="form-group">
              <label for="tipo_combustible">Tipo de Combustible</label>
              <app-dropdown
                formControlName="tipo_combustible"
                [options]="fuelTypeOptions"
                [placeholder]="'Seleccionar Tipo'"
              ></app-dropdown>
            </div>
          </div>
        </div>

        <!-- Section 2: Consumption & Cost -->
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-coins"></i> Consumo y Costos</h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="cantidad">Cantidad *</label>
              <input
                id="cantidad"
                type="number"
                formControlName="cantidad"
                class="form-control"
                placeholder="0.00"
                step="0.01"
                (input)="calculateTotal()"
              />
              <div class="error-msg" *ngIf="hasError('cantidad')">Cantidad es requerida</div>
            </div>

            <div class="form-group">
              <label for="precio_unitario">Precio Unitario (S/) *</label>
              <input
                id="precio_unitario"
                type="number"
                formControlName="precio_unitario"
                class="form-control"
                placeholder="0.00"
                step="0.01"
                (input)="calculateTotal()"
              />
              <div class="error-msg" *ngIf="hasError('precio_unitario')">
                Precio unitario es requerido
              </div>
            </div>

            <div class="form-group">
              <label for="monto_total">Monto Total (S/) *</label>
              <input
                id="monto_total"
                type="number"
                formControlName="monto_total"
                class="form-control"
                placeholder="0.00"
                readonly
              />
            </div>
          </div>
        </div>

        <!-- Section 3: Document Info -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fa-solid fa-file-lines"></i> Información del Documento
          </h3>
          <div class="section-grid">
            <div class="form-group">
              <label for="numero_documento">Número de Documento</label>
              <input
                id="numero_documento"
                type="text"
                formControlName="numero_documento"
                class="form-control"
                placeholder="Ej: F001-00001234"
              />
            </div>

            <div class="form-group full-width">
              <label for="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                formControlName="observaciones"
                class="form-control"
                rows="3"
                placeholder="Notas adicionales..."
              ></textarea>
            </div>
          </div>
        </div>
      </form>
    </app-form-container>
  `,
  styles: [],
})
export class FuelFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private fuelService = inject(FuelService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  fuelForm: FormGroup;
  isEditMode = false;
  loading = false;
  recordId: number | null = null;

  fuelTypeOptions: DropdownOption[] = [
    { label: 'Diesel', value: 'DIESEL' },
    { label: 'Gasolina 84', value: 'GASOLINA_84' },
    { label: 'Gasolina 90', value: 'GASOLINA_90' },
    { label: 'Gasolina 95', value: 'GASOLINA_95' },
    { label: 'Gasolina 97', value: 'GASOLINA_97' },
    { label: 'GLP', value: 'GLP' },
    { label: 'GNV', value: 'GNV' },
  ];

  constructor() {
    this.fuelForm = this.fb.group({
      valorizacion_id: [null, Validators.required],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      cantidad: [null, [Validators.required, Validators.min(0.01)]],
      precio_unitario: [null, [Validators.required, Validators.min(0.01)]],
      monto_total: [0, Validators.required],
      tipo_combustible: [null],
      proveedor: [null],
      numero_documento: [null],
      observaciones: [null],
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.recordId = +params['id'];
        this.loadRecord(this.recordId);
      }
    });
  }

  loadRecord(id: number): void {
    this.loading = true;
    this.fuelService.getById(id).subscribe({
      next: (record) => {
        // Format date
        const formatDate = (dateStr: string) => (dateStr ? dateStr.split('T')[0] : '');

        this.fuelForm.patchValue({
          ...record,
          fecha: record.fecha ? formatDate(record.fecha as string) : '',
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading fuel record', err);
        this.loading = false;
        this.router.navigate(['/logistics/fuel']);
      },
    });
  }

  calculateTotal(): void {
    const cantidad = this.fuelForm.get('cantidad')?.value || 0;
    const precioUnitario = this.fuelForm.get('precio_unitario')?.value || 0;
    const total = cantidad * precioUnitario;
    this.fuelForm.patchValue({ monto_total: parseFloat(total.toFixed(2)) }, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.fuelForm.invalid) return;

    this.loading = true;
    const recordData = this.fuelForm.value;

    const request$ =
      this.isEditMode && this.recordId
        ? this.fuelService.update(this.recordId, recordData)
        : this.fuelService.create(recordData);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/logistics/fuel']);
      },
      error: (err) => {
        console.error('Error saving fuel record', err);
        this.loading = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/logistics/fuel']);
  }

  hasError(field: string): boolean {
    const control = this.fuelForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
