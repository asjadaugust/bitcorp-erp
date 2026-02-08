import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { InventoryService, Product } from '../../services/inventory.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fa-solid fa-box-open"></i>
          </div>
          <div class="title-group">
            <h1>{{ isEditMode ? 'Editar Producto' : 'Nuevo Producto' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información del producto'
                  : 'Registrar un nuevo producto en el inventario'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button
            type="submit"
            form="productForm"
            class="btn btn-primary"
            [disabled]="productForm.invalid || submitting"
          >
            <i class="fa-solid fa-save" *ngIf="!submitting"></i>
            <span class="spinner-sm" *ngIf="submitting"></span>
            {{ submitting ? 'Guardando...' : 'Guardar Producto' }}
          </button>
        </div>
      </div>

      <div class="form-container">
        <form id="productForm" [formGroup]="productForm" (ngSubmit)="onSubmit()">
          <!-- General Info Section -->
          <div class="form-section">
            <h2 class="section-title">Información General</h2>

            <div class="form-grid">
              <div class="form-group">
                <label for="codigo">Código <span class="required">*</span></label>
                <input
                  id="codigo"
                  type="text"
                  formControlName="codigo"
                  [class.error]="isFieldInvalid('codigo')"
                  placeholder="Ej. PROD-001"
                />
                <div class="error-message" *ngIf="isFieldInvalid('codigo')">
                  El código es requerido
                </div>
              </div>

              <div class="form-group span-2">
                <label for="nombre">Nombre del Producto <span class="required">*</span></label>
                <input
                  id="nombre"
                  type="text"
                  formControlName="nombre"
                  [class.error]="isFieldInvalid('nombre')"
                  placeholder="Nombre descriptivo del producto"
                />
                <div class="error-message" *ngIf="isFieldInvalid('nombre')">
                  El nombre es requerido
                </div>
              </div>

              <div class="form-group">
                <label for="categoria">Categoría</label>
                <select id="categoria" formControlName="categoria">
                  <option value="">Seleccionar Categoría</option>
                  <option value="Repuestos">Repuestos</option>
                  <option value="EPP">EPP</option>
                  <option value="Herramientas">Herramientas</option>
                  <option value="Consumibles">Consumibles</option>
                  <option value="Materiales">Materiales</option>
                </select>
              </div>

              <div class="form-group">
                <label for="unidad_medida">Unidad de Medida <span class="required">*</span></label>
                <select
                  id="unidad_medida"
                  formControlName="unidad_medida"
                  [class.error]="isFieldInvalid('unidad_medida')"
                >
                  <option value="">Seleccionar Unidad</option>
                  <option value="UND">Unidad (UND)</option>
                  <option value="KG">Kilogramo (KG)</option>
                  <option value="M">Metro (M)</option>
                  <option value="M2">Metro Cuadrado (M2)</option>
                  <option value="M3">Metro Cúbico (M3)</option>
                  <option value="GLN">Galón (GLN)</option>
                  <option value="L">Litro (L)</option>
                  <option value="JGO">Juego (JGO)</option>
                </select>
                <div class="error-message" *ngIf="isFieldInvalid('unidad_medida')">
                  La unidad es requerida
                </div>
              </div>
            </div>

            <div class="form-group full-width">
              <label for="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                formControlName="descripcion"
                rows="3"
                placeholder="Detalles adicionales del producto..."
              ></textarea>
            </div>
          </div>

          <!-- Inventory Info Section -->
          <div class="form-section">
            <h2 class="section-title">Inventario y Costos</h2>

            <div class="form-grid">
              <div class="form-group">
                <label for="stock_actual">Stock Inicial</label>
                <input id="stock_actual" type="number" formControlName="stock_actual" min="0" />
                <div class="hint">
                  Solo editable al crear. Use movimientos para ajustar después.
                </div>
              </div>

              <div class="form-group">
                <label for="costo_unitario">Costo Unitario (PEN)</label>
                <input
                  id="costo_unitario"
                  type="number"
                  formControlName="costo_unitario"
                  min="0"
                  step="0.01"
                />
              </div>

              <div class="form-group">
                <label for="ubicacion">Ubicación en Almacén</label>
                <input
                  id="ubicacion"
                  type="text"
                  formControlName="ubicacion"
                  placeholder="Ej. Estante A, Nivel 2"
                />
              </div>
            </div>
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
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-24);
      }
      .header-content {
        display: flex;
        align-items: center;
        gap: var(--s-16);
      }
      .icon-wrapper {
        width: 48px;
        height: 48px;
        background: var(--primary-100);
        color: var(--primary-800);
        border-radius: var(--s-12);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }
      .title-group h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        color: var(--grey-900);
        font-family: var(--font-family-display);
      }
      .subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--grey-500);
      }
      .header-actions {
        display: flex;
        gap: var(--s-12);
      }

      /* Form Container */
      .form-container {
        max-width: 800px;
        margin: 0 auto;
      }
      .form-section {
        background: var(--neutral-0);
        border-radius: var(--s-8);
        box-shadow: var(--shadow-sm);
        padding: var(--s-24);
        margin-bottom: var(--s-24);
      }
      .section-title {
        font-size: var(--type-h4-size);
        color: var(--primary-900);
        margin-bottom: var(--s-16);
        padding-bottom: var(--s-8);
        border-bottom: 1px solid var(--grey-200);
      }

      /* Form Grid */
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-16);
      }
      .span-2 {
        grid-column: span 2;
      }
      .full-width {
        grid-column: 1 / -1;
      }

      @media (max-width: 600px) {
        .span-2 {
          grid-column: span 1;
        }
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

      .error-message {
        color: var(--semantic-error);
        font-size: var(--type-label-size);
        margin-top: var(--s-4);
      }
      .hint {
        color: var(--grey-500);
        font-size: var(--type-label-size);
        margin-top: var(--s-4);
      }

      /* Buttons */
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
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  productForm: FormGroup;
  isEditMode = false;
  productId: string | null = null;
  submitting = false;

  constructor() {
    this.productForm = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      categoria: [''],
      unidad_medida: ['', Validators.required],
      descripcion: [''],
      stock_actual: [0, [Validators.min(0)]],
      costo_unitario: [0, [Validators.min(0)]],
      ubicacion: [''],
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct(this.productId);
      // Disable stock editing in edit mode
      this.productForm.get('stock_actual')?.disable();
    }
  }

  loadProduct(id: string): void {
    this.inventoryService.getProductById(id).subscribe({
      next: (product: Product) => {
        this.productForm.patchValue(product);
      },
      error: (err: any) => console.error('Error loading product', err),
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.productForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const productData = this.productForm.getRawValue();

    const request =
      this.isEditMode && this.productId
        ? this.inventoryService.updateProduct(this.productId, productData)
        : this.inventoryService.createProduct(productData);

    request.subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/logistics/products']);
      },
      error: (err: any) => {
        console.error('Error saving product', err);
        this.submitting = false;
        // TODO: Show toast notification
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/logistics/products']);
  }
}
