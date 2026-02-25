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
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { FormContainerComponent } from '../../../../shared/components/form-container/form-container.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../../shared/components/dropdown/dropdown.component';
import { AeroInputComponent } from '../../../../core/design-system/input/aero-input.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ValidationErrorsComponent,
    AlertComponent,
    FormContainerComponent,
    AeroInputComponent,
    DropdownComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Producto' : 'Nuevo Producto'"
      [subtitle]="
        isEditMode
          ? 'Actualiza la información del producto'
          : 'Registra un nuevo producto en el catálogo'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-box'"
      [loading]="loading || submitting"
      [disableSubmit]="submitting || (productForm && productForm.invalid)"
      (onSubmit)="onSubmit()"
      (onCancel)="cancel()"
    >
      <!-- Error Handling -->
      <app-validation-errors
        *ngIf="validationErrors.length > 0"
        [errors]="validationErrors"
        [fieldLabels]="fieldLabels"
        class="mb-4"
      ></app-validation-errors>

      <app-alert
        *ngIf="errorMessage"
        type="error"
        [message]="errorMessage"
        [dismissible]="true"
        (dismiss)="errorMessage = null"
        class="mb-4"
      ></app-alert>

      <form [formGroup]="productForm" (ngSubmit)="onSubmit()" id="standardForm">
        <!-- General Info Section -->
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-box"></i> Información General</h3>

          <div class="section-grid">
            <div class="form-group">
              <aero-input
                label="Código"
                formControlName="codigo"
                placeholder="Ej. PROD-001"
                [required]="true"
                [error]="isFieldInvalid('codigo') ? 'Código es requerido' : ''"
              ></aero-input>
            </div>

            <div class="form-group">
              <aero-input
                label="Nombre del Producto"
                formControlName="nombre"
                placeholder="Nombre descriptivo del producto"
                [required]="true"
                [error]="isFieldInvalid('nombre') ? 'Nombre es requerido' : ''"
              ></aero-input>
            </div>

            <div class="form-group">
              <label class="aero-label">Categoría</label>
              <app-dropdown
                formControlName="categoria"
                [options]="categoryOptions"
                placeholder="Seleccione categoría..."
              ></app-dropdown>
            </div>

            <div class="form-group">
              <label class="aero-label">Unidad de Medida <span class="required">*</span></label>
              <app-dropdown
                formControlName="unidad_medida"
                [options]="unitOptions"
                placeholder="Seleccione unidad..."
              ></app-dropdown>
            </div>

            <div class="form-group span-full">
              <label for="descripcion" class="aero-label">Descripción</label>
              <textarea
                id="descripcion"
                formControlName="descripcion"
                class="form-control"
                rows="3"
                placeholder="Detalles adicionales del producto..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Inventory Info Section -->
        <div class="form-section">
          <h3>Inventario y Costos</h3>
          <div class="form-grid">
            <div class="form-group">
              <aero-input
                label="Stock Inicial"
                type="number"
                formControlName="stock_actual"
                hint="Solo editable al crear. Use movimientos para ajustar después."
              ></aero-input>
            </div>

            <div class="form-group">
              <aero-input
                label="Precio Unitario (PEN)"
                type="number"
                formControlName="precio_unitario"
              ></aero-input>
            </div>
          </div>
        </div>
      </form>
    </app-form-container>
  `,
  styles: [],
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(FormErrorHandlerService);

  productForm: FormGroup;
  isEditMode = false;
  productId: string | null = null;
  loading = false;
  submitting = false;
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  categoryOptions: DropdownOption[] = [
    { label: 'Repuestos', value: 'Repuestos' },
    { label: 'EPP', value: 'EPP' },
    { label: 'Herramientas', value: 'Herramientas' },
    { label: 'Consumibles', value: 'Consumibles' },
    { label: 'Materiales', value: 'Materiales' },
  ];

  unitOptions: DropdownOption[] = [
    { label: 'Unidad (UND)', value: 'UND' },
    { label: 'Kilogramo (KG)', value: 'KG' },
    { label: 'Metro (M)', value: 'M' },
    { label: 'Metro Cuadrado (M2)', value: 'M2' },
    { label: 'Metro Cúbico (M3)', value: 'M3' },
    { label: 'Galón (GLN)', value: 'GLN' },
    { label: 'Litro (L)', value: 'L' },
    { label: 'Juego (JGO)', value: 'JGO' },
  ];

  fieldLabels: Record<string, string> = {
    codigo: 'Código',
    nombre: 'Nombre del Producto',
    categoria: 'Categoría',
    unidad_medida: 'Unidad de Medida',
    descripcion: 'Descripción',
    stock_actual: 'Stock Inicial',
    precio_unitario: 'Precio Unitario',
  };

  constructor() {
    this.productForm = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      categoria: [''],
      unidad_medida: ['', Validators.required],
      descripcion: [''],
      stock_actual: [0, [Validators.min(0)]],
      precio_unitario: [0, [Validators.min(0)]],
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
    this.loading = true;
    this.inventoryService.getProductById(id).subscribe({
      next: (product: Product) => {
        this.productForm.patchValue(product);
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('Error loading product', err);
        this.errorMessage = this.errorHandler.getErrorMessage(err as any);
        this.loading = false;
      },
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
    this.validationErrors = [];
    this.errorMessage = null;

    const productData = this.productForm.getRawValue();

    if (this.isEditMode && this.productId) {
      // Strip non-permitted fields for update (strict backend validation)
      const {
        codigo: _codigo,
        id: _id,
        created_at: _created_at,
        updated_at: _updated_at,
        stock_actual: _stock_actual,
        ...updateData
      } = productData;

      this.inventoryService.updateProduct(this.productId, updateData).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/logistics/products']);
        },
        error: (err: unknown) => {
          console.error('Error updating product:', err);
          this.submitting = false;
          this.validationErrors = this.errorHandler.extractValidationErrors(err as any);
          this.errorMessage = this.errorHandler.getErrorMessage(err as any);
        },
      });
    } else {
      this.inventoryService.createProduct(productData).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/logistics/products']);
        },
        error: (err: unknown) => {
          console.error('Error saving product', err);
          this.submitting = false;
          this.validationErrors = this.errorHandler.extractValidationErrors(err as any);
          this.errorMessage = this.errorHandler.getErrorMessage(err as any);
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/logistics/products']);
  }
}
