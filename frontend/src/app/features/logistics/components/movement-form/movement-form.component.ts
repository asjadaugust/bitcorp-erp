import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { InventoryService, Product, Movement } from '../../services/inventory.service';

@Component({
  selector: 'app-movement-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-page">
      <!-- Header -->
      <div class="page-header">
        <div class="page-title">
          <div class="icon-wrapper">
            <i class="fa-solid fa-right-left"></i>
          </div>
          <h1>
            {{
              isEditMode
                ? 'Ver Movimiento'
                : movementType === 'IN'
                  ? 'Registrar Ingreso'
                  : 'Registrar Salida'
            }}
          </h1>
        </div>
        <div class="breadcrumb">
          <a routerLink="/dashboard">Dashboard</a>
          <span class="separator">›</span>
          <a routerLink="/logistics">Logística</a>
          <span class="separator">›</span>
          <a routerLink="/logistics/movements">Movimientos</a>
          <span class="separator">›</span>
          <span>{{ isEditMode ? 'Detalle' : 'Nuevo' }}</span>
        </div>
      </div>

      <div class="form-container">
        <form [formGroup]="movementForm" (ngSubmit)="onSubmit()">
          <!-- Header Section -->
          <div class="form-section">
            <h2 class="section-title">Datos del Movimiento</h2>

            <div class="form-grid">
              <div class="form-group">
                <label>Tipo de Movimiento</label>
                <div class="static-value">
                  <span
                    [class]="
                      movementType === 'IN'
                        ? 'badge badge-status-available'
                        : 'badge badge-status-retired'
                    "
                  >
                    {{ movementType === 'IN' ? 'INGRESO' : 'SALIDA' }}
                  </span>
                </div>
              </div>

              <div class="form-group">
                <label for="fecha">Fecha <span class="required">*</span></label>
                <input
                  id="fecha"
                  type="datetime-local"
                  formControlName="fecha"
                  [class.error]="isFieldInvalid('fecha')"
                />
              </div>

              <div class="form-group" *ngIf="movementType === 'IN'">
                <label for="provider_id">Proveedor</label>
                <select id="provider_id" formControlName="provider_id">
                  <option value="">Seleccionar Proveedor</option>
                  <!-- TODO: Load providers -->
                  <option value="1">Proveedor A</option>
                  <option value="2">Proveedor B</option>
                </select>
              </div>

              <div class="form-group" *ngIf="movementType === 'OUT'">
                <label for="project_id">Proyecto Destino</label>
                <select id="project_id" formControlName="project_id">
                  <option value="">Seleccionar Proyecto</option>
                  <!-- TODO: Load projects -->
                  <option value="1">Proyecto Alpha</option>
                  <option value="2">Proyecto Beta</option>
                </select>
              </div>

              <div class="form-group">
                <label for="tipo_documento">Tipo Documento</label>
                <select id="tipo_documento" formControlName="tipo_documento">
                  <option value="GUIA">Guía de Remisión</option>
                  <option value="FACTURA">Factura</option>
                  <option value="BOLETA">Boleta</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div class="form-group">
                <label for="numero_documento">Nro. Documento</label>
                <input
                  id="numero_documento"
                  type="text"
                  formControlName="numero_documento"
                  placeholder="Ej. 001-123456"
                />
              </div>
            </div>

            <div class="form-group full-width">
              <label for="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                formControlName="observaciones"
                rows="2"
                placeholder="Notas adicionales..."
              ></textarea>
            </div>
          </div>

          <!-- Details Section -->
          <div class="form-section">
            <div class="section-header">
              <h2 class="section-title">Items</h2>
              <button
                type="button"
                class="btn btn-outline btn-sm"
                (click)="addItem()"
                *ngIf="!isEditMode"
              >
                <i class="fa-solid fa-plus"></i> Agregar Item
              </button>
            </div>

            <div class="table-wrapper">
              <table class="details-table">
                <thead>
                  <tr>
                    <th style="width: 40%">Producto</th>
                    <th style="width: 15%">Unidad</th>
                    <th style="width: 15%">Cantidad</th>
                    <th style="width: 15%">Costo Unit.</th>
                    <th style="width: 15%">Total</th>
                    <th style="width: 50px" *ngIf="!isEditMode"></th>
                  </tr>
                </thead>
                <tbody formArrayName="details">
                  <tr *ngFor="let item of details.controls; let i = index" [formGroupName]="i">
                    <td>
                      <select formControlName="product_id" (change)="onProductChange(i)">
                        <option value="">Seleccionar Producto</option>
                        <option *ngFor="let product of products" [value]="product.id">
                          {{ product.codigo }} - {{ product.nombre }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        formControlName="unidad_medida"
                        readonly
                        class="readonly-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        formControlName="cantidad"
                        min="0.01"
                        step="0.01"
                        (input)="calculateTotal(i)"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        formControlName="costo_unitario"
                        min="0"
                        step="0.01"
                        (input)="calculateTotal(i)"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        formControlName="total"
                        readonly
                        class="readonly-input"
                      />
                    </td>
                    <td *ngIf="!isEditMode">
                      <button type="button" class="btn-icon text-danger" (click)="removeItem(i)">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="details.length === 0">
                    <td colspan="6" class="empty-row">No hay items agregados</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="text-right font-bold">Total Movimiento:</td>
                    <td class="font-bold">{{ totalAmount | currency: 'PEN' }}</td>
                    <td *ngIf="!isEditMode"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="cancel()">Cancelar</button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="movementForm.invalid || submitting || details.length === 0"
              *ngIf="!isEditMode"
            >
              <i class="fa-solid fa-save" *ngIf="!submitting"></i>
              <span class="spinner-sm" *ngIf="submitting"></span>
              {{ submitting ? 'Procesando...' : 'Registrar Movimiento' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .form-page {
        min-height: 100vh;
        background: var(--grey-100);
        padding: var(--s-32);
      }

      /* Header */
      .page-header {
        margin-bottom: var(--s-24);
      }
      .page-title {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        margin-bottom: var(--s-8);
      }
      .icon-wrapper {
        width: 40px;
        height: 40px;
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: var(--s-8);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }
      .page-title h1 {
        margin: 0;
        font-size: var(--type-h2-size);
        font-weight: 700;
        color: var(--primary-900);
        font-family: var(--font-family-display);
      }
      .breadcrumb {
        color: var(--grey-700);
        font-size: var(--type-bodySmall-size);
      }
      .breadcrumb a {
        color: var(--primary-500);
        text-decoration: none;
      }
      .breadcrumb .separator {
        margin: 0 var(--s-8);
      }

      /* Form Container */
      .form-container {
        max-width: 1000px;
        margin: 0 auto;
      }
      .form-section {
        background: var(--neutral-0);
        border-radius: var(--s-8);
        box-shadow: var(--shadow-sm);
        padding: var(--s-24);
        margin-bottom: var(--s-24);
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-16);
        padding-bottom: var(--s-8);
        border-bottom: 1px solid var(--grey-200);
      }
      .section-title {
        font-size: var(--type-h4-size);
        color: var(--primary-900);
        margin: 0;
      }

      /* Form Grid */
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-16);
      }
      .full-width {
        grid-column: 1 / -1;
      }

      /* Form Controls */
      .form-group {
        margin-bottom: var(--s-16);
      }
      .form-group label {
        display: block;
        margin-bottom: var(--s-8);
        font-size: var(--type-bodySmall-size);
        font-weight: 600;
        color: var(--grey-700);
      }
      .required {
        color: var(--semantic-error);
      }

      input,
      select,
      textarea {
        width: 100%;
        padding: var(--s-12);
        border: 1px solid var(--grey-300);
        border-radius: var(--s-4);
        font-size: var(--type-body-size);
        font-family: var(--font-family-base);
        transition: border-color 0.2s;
      }
      input:focus,
      select:focus,
      textarea:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px var(--primary-100);
      }
      input.error,
      select.error {
        border-color: var(--semantic-error);
      }
      .readonly-input {
        background-color: var(--grey-100);
        color: var(--grey-700);
        cursor: not-allowed;
      }

      /* Details Table */
      .details-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--type-bodySmall-size);
      }
      .details-table th {
        text-align: left;
        padding: var(--s-8);
        background: var(--grey-100);
        color: var(--grey-700);
        font-weight: 600;
        border-bottom: 2px solid var(--grey-200);
      }
      .details-table td {
        padding: var(--s-8);
        border-bottom: 1px solid var(--grey-100);
        vertical-align: top;
      }
      .details-table input,
      .details-table select {
        padding: var(--s-8);
        font-size: var(--type-bodySmall-size);
      }
      .empty-row {
        text-align: center;
        padding: var(--s-24);
        color: var(--grey-500);
        font-style: italic;
      }

      /* Utilities */
      .badge {
        padding: var(--s-4) var(--s-8);
        border-radius: var(--s-4);
        font-size: var(--type-label-size);
        font-weight: 500;
      }
      .badge-status-available {
        background: #d1fae5;
        color: var(--semantic-success);
      }
      .badge-status-retired {
        background: #fee2e2;
        color: var(--semantic-error);
      }
      .text-right {
        text-align: right;
      }
      .font-bold {
        font-weight: 700;
      }
      .text-danger {
        color: var(--semantic-error);
      }

      /* Actions */
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--s-12);
        margin-top: var(--s-24);
      }
      .btn {
        padding: var(--s-12) var(--s-24);
        border: none;
        border-radius: var(--s-4);
        font-size: var(--type-body-size);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        transition: all 0.2s ease;
      }
      .btn-sm {
        padding: var(--s-4) var(--s-12);
        font-size: var(--type-label-size);
      }
      .btn-primary {
        background: var(--primary-500);
        color: var(--neutral-0);
      }
      .btn-primary:hover {
        background: var(--primary-800);
      }
      .btn-primary:disabled {
        background: var(--grey-300);
        cursor: not-allowed;
      }
      .btn-secondary {
        background: var(--neutral-0);
        border: 1px solid var(--grey-300);
        color: var(--grey-700);
      }
      .btn-secondary:hover {
        background: var(--grey-100);
      }
      .btn-outline {
        background: var(--neutral-0);
        border: 1px solid var(--primary-500);
        color: var(--primary-500);
      }
      .btn-outline:hover {
        background: var(--primary-100);
      }
      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        padding: var(--s-4);
      }

      .spinner-sm {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class MovementFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  movementForm: FormGroup;
  isEditMode = false;
  movementId: string | null = null;
  movementType: 'IN' | 'OUT' = 'IN';
  submitting = false;
  products: Product[] = [];

  constructor() {
    this.movementForm = this.fb.group({
      project_id: [''],
      provider_id: [''],
      fecha: [new Date().toISOString().slice(0, 16), Validators.required],
      tipo_movimiento: ['IN', Validators.required],
      tipo_documento: ['GUIA'],
      numero_documento: [''],
      observaciones: [''],
      details: this.fb.array([]),
    });
  }

  get details() {
    return this.movementForm.get('details') as FormArray;
  }

  get totalAmount(): number {
    return this.details.controls.reduce((acc, control) => {
      return acc + (control.get('total')?.value || 0);
    }, 0);
  }

  ngOnInit(): void {
    this.loadProducts();

    this.route.queryParams.subscribe((params) => {
      if (params['type']) {
        this.movementType = params['type'];
        this.movementForm.patchValue({ tipo_movimiento: this.movementType });
      }
    });

    this.movementId = this.route.snapshot.paramMap.get('id');
    if (this.movementId) {
      this.isEditMode = true;
      this.loadMovement(this.movementId);
      this.movementForm.disable(); // View only mode for now
    } else {
      this.addItem(); // Add one empty item by default
    }
  }

  loadProducts(): void {
    this.inventoryService.getProducts().subscribe({
      next: (data) => (this.products = data),
      error: (err) => console.error('Error loading products', err),
    });
  }

  loadMovement(id: string): void {
    this.inventoryService.getMovementById(id).subscribe({
      next: (movement: Movement) => {
        this.movementType = movement.tipo_movimiento;

        // Patch header
        this.movementForm.patchValue({
          ...movement,
          fecha: new Date(movement.fecha).toISOString().slice(0, 16),
        });

        // Patch details
        this.details.clear();
        if (movement.details) {
          movement.details.forEach((detail: any) => {
            this.details.push(
              this.fb.group({
                product_id: [detail.product_id],
                unidad_medida: [detail.unidad_medida],
                cantidad: [detail.cantidad],
                costo_unitario: [detail.costo_unitario],
                total: [detail.total],
              })
            );
          });
        }
      },
      error: (err: any) => console.error('Error loading movement', err),
    });
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      product_id: ['', Validators.required],
      unidad_medida: [''],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      costo_unitario: [0, [Validators.required, Validators.min(0)]],
      total: [0],
    });
    this.details.push(itemGroup);
  }

  removeItem(index: number): void {
    this.details.removeAt(index);
  }

  onProductChange(index: number): void {
    const control = this.details.at(index);
    const productId = control.get('product_id')?.value;
    const product = this.products.find((p) => p.id == productId); // Loose equality for string/number match

    if (product) {
      control.patchValue({
        unidad_medida: product.unidad_medida,
        costo_unitario: product.costo_unitario,
      });
      this.calculateTotal(index);
    }
  }

  calculateTotal(index: number): void {
    const control = this.details.at(index);
    const cantidad = control.get('cantidad')?.value || 0;
    const costo = control.get('costo_unitario')?.value || 0;
    control.patchValue({ total: cantidad * costo }, { emitEvent: false });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.movementForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.movementForm.invalid) {
      this.movementForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const movementData = this.movementForm.getRawValue();

    this.inventoryService.createMovement(movementData).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/logistics/movements']);
      },
      error: (err: any) => {
        console.error('Error saving movement', err);
        this.submitting = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/logistics/movements']);
  }
}
