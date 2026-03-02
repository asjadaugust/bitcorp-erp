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
import { ProjectService } from '../../../../core/services/project.service';
import { ProviderService } from '../../../../core/services/provider.service';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../../../core/services/form-error-handler.service';
import { ValidationErrorsComponent } from '../../../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { FormContainerComponent } from '../../../../shared/components/form-container/form-container.component';
import { AeroButtonComponent } from '../../../../core/design-system';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-movement-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ValidationErrorsComponent,
    AlertComponent,
    FormContainerComponent,
    DropdownComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-form-container
      [title]="
        isEditMode
          ? 'Ver Movimiento'
          : movementType === 'entrada'
            ? 'Registrar Ingreso de Inventario'
            : 'Registrar Salida de Inventario'
      "
      [subtitle]="
        isEditMode ? 'Detalle del movimiento registrado' : 'Gestión de entrada/salida de productos'
      "
      [loading]="loading || submitting"
      [disableSubmit]="submitting || (movementForm && movementForm.invalid)"
      (submitted)="onSubmit()"
      (cancelled)="cancel()"
      [showFooter]="!isEditMode"
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

      <form [formGroup]="movementForm" (ngSubmit)="onSubmit()" id="standardForm">
        <!-- Header Section -->
        <div class="form-section">
          <h2 class="section-title">Datos del Movimiento</h2>

          <div class="form-grid">
            <div class="form-group">
              <span class="label">Tipo de Movimiento</span>
              <div class="static-value">
                <span
                  [class]="
                    movementType === 'entrada'
                      ? 'badge badge-status-available'
                      : 'badge badge-status-retired'
                  "
                >
                  {{ movementType === 'entrada' ? 'INGRESO' : 'SALIDA' }}
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

            <div class="form-group" *ngIf="movementType === 'entrada'">
              <label for="proveedor_id">Proveedor</label>
              <app-dropdown
                formControlName="proveedor_id"
                [options]="providerOptions"
                [placeholder]="'Seleccionar Proveedor'"
                [searchable]="true"
              ></app-dropdown>
            </div>

            <div class="form-group" *ngIf="movementType === 'salida'">
              <label for="proyecto_id">Proyecto Destino</label>
              <app-dropdown
                formControlName="proyecto_id"
                [options]="projectOptions"
                [placeholder]="'Seleccionar Proyecto'"
                [searchable]="true"
              ></app-dropdown>
            </div>

            <div class="form-group">
              <label for="tipo_documento">Tipo Documento</label>
              <app-dropdown
                formControlName="tipo_documento"
                [options]="documentTypeOptions"
                [placeholder]="'Seleccionar...'"
              ></app-dropdown>
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
            <h2 class="section-title">Items del Movimiento</h2>
            <aero-button
              *ngIf="!isEditMode"
              variant="secondary"
              size="small"
              iconLeft="fa-plus"
              (clicked)="addItem()"
              >Agregar Item</aero-button
            >
          </div>

          <div class="table-wrapper">
            <table class="details-table">
              <thead>
                <tr>
                  <th style="width: 40%">Producto</th>
                  <th style="width: 15%">Unidad</th>
                  <th style="width: 15%">Cantidad</th>
                  <th style="width: 15%">Precio Unit.</th>
                  <th style="width: 15%">Total</th>
                  <th style="width: 50px" *ngIf="!isEditMode"></th>
                </tr>
              </thead>
              <tbody formArrayName="items">
                <tr *ngFor="let item of items.controls; let i = index" [formGroupName]="i">
                  <td>
                    <app-dropdown
                      formControlName="producto_id"
                      [options]="productOptions"
                      [placeholder]="'Seleccionar Producto'"
                      [searchable]="true"
                      (onChange)="onProductChange(i)"
                    ></app-dropdown>
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
                      formControlName="precio_unitario"
                      min="0"
                      step="0.01"
                      (input)="calculateTotal(i)"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      formControlName="monto_total"
                      readonly
                      class="readonly-input"
                    />
                  </td>
                  <td *ngIf="!isEditMode">
                    <aero-button
                      variant="ghost"
                      size="small"
                      iconCenter="fa-trash"
                      title="Eliminar"
                      (clicked)="removeItem(i)"
                    ></aero-button>
                  </td>
                </tr>
                <tr *ngIf="items.length === 0">
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
      </form>
    </app-form-container>
  `,
  styles: [],
})
export class MovementFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private projectService = inject(ProjectService);
  private providerService = inject(ProviderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(FormErrorHandlerService);

  movementForm: FormGroup;
  isEditMode = false;
  movementId: string | null = null;
  movementType: 'entrada' | 'salida' = 'entrada';
  loading = false;
  submitting = false;
  products: Product[] = [];
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  productOptions: DropdownOption[] = [];
  projectOptions: DropdownOption[] = [];
  providerOptions: DropdownOption[] = [];
  documentTypeOptions: DropdownOption[] = [
    { label: 'Guía de Remisión', value: 'GUIA' },
    { label: 'Factura', value: 'FACTURA' },
    { label: 'Boleta', value: 'BOLETA' },
    { label: 'Otro', value: 'OTRO' },
  ];

  fieldLabels: Record<string, string> = {
    proyecto_id: 'Proyecto Destino',
    proveedor_id: 'Proveedor',
    fecha: 'Fecha',
    tipo_movimiento: 'Tipo de Movimiento',
    tipo_documento: 'Tipo de Documento',
    numero_documento: 'Nro. Documento',
    observaciones: 'Observaciones',
    'items.producto_id': 'Producto',
    'items.cantidad': 'Cantidad',
    'items.precio_unitario': 'Precio Unitario',
  };

  constructor() {
    this.movementForm = this.fb.group({
      proyecto_id: [''],
      proveedor_id: [''],
      fecha: [new Date().toISOString().slice(0, 16), Validators.required],
      tipo_movimiento: ['entrada', Validators.required],
      tipo_documento: ['GUIA'],
      numero_documento: [''],
      observaciones: [''],
      items: this.fb.array([]),
    });
  }

  get items() {
    return this.movementForm.get('items') as FormArray;
  }

  get totalAmount(): number {
    return this.items.controls.reduce((acc, control) => {
      return acc + (control.get('monto_total')?.value || 0);
    }, 0);
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadDependencies();

    this.route.queryParams.subscribe((params) => {
      if (params['type']) {
        this.movementType = params['type'];
        this.movementForm.patchValue({ tipo_movimiento: this.movementType });
      }
    });

    this.movementId = this.route.snapshot.paramMap.get('id');
    if (this.movementId) {
      this.isEditMode = true;
      this.loadMovement(Number(this.movementId));
      this.movementForm.disable(); // View only mode for now
    } else {
      this.addItem(); // Add one empty item by default
    }
  }

  loadProducts(): void {
    this.loading = true;
    this.inventoryService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.productOptions = this.products.map((p) => ({
          label: `${p.codigo} - ${p.nombre}`,
          value: p.id,
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products', err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        this.loading = false;
      },
    });
  }

  loadDependencies(): void {
    this.projectService.getAll().subscribe({
      next: (response: unknown) => {
        const projects = (response as Record<string, unknown>)?.['data'] || response;
        this.projectOptions = (projects as Record<string, unknown>[]).map((p) => ({
          label: p['nombre'] as string,
          value: p['id'] as number,
        }));
      },
    });

    this.providerService.getAll().subscribe({
      next: (response: unknown) => {
        const providers = (response as Record<string, unknown>)?.['data'] || response;
        this.providerOptions = (providers as Record<string, unknown>[]).map((p) => ({
          label: p['razon_social'] as string,
          value: p['id'] as number,
        }));
      },
    });
  }

  loadMovement(id: number): void {
    this.loading = true;
    this.inventoryService.getMovementById(id).subscribe({
      next: (movement: Movement) => {
        // Safe cast or mapping if needed, assuming API returns valid distinct union values
        this.movementType = movement.tipo_movimiento as 'entrada' | 'salida';

        // Patch header
        this.movementForm.patchValue({
          ...movement,
          fecha: new Date(movement.fecha).toISOString().slice(0, 16),
        });

        // Patch items
        this.items.clear();
        if (movement.detalles) {
          movement.detalles.forEach((detail) => {
            this.items.push(
              this.fb.group({
                producto_id: [detail.producto_id],
                unidad_medida: [detail.unidad_medida || ''],
                cantidad: [detail.cantidad],
                precio_unitario: [detail.precio_unitario],
                monto_total: [detail.monto_total],
              })
            );
          });
        }
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('Error loading movement', err);
        this.errorMessage = this.errorHandler.getErrorMessage(err as any);
        this.loading = false;
      },
    });
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      producto_id: ['', Validators.required],
      unidad_medida: [''],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      monto_total: [0],
    });
    this.items.push(itemGroup);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  onProductChange(index: number): void {
    const control = this.items.at(index);
    const productId = control.get('producto_id')?.value;
    const product = this.products.find((p) => p.id == productId);

    if (product) {
      control.patchValue({
        unidad_medida: product.unidad_medida,
        precio_unitario: product.precio_unitario,
      });
      this.calculateTotal(index);
    }
  }

  calculateTotal(index: number): void {
    const control = this.items.at(index);
    const cantidad = control.get('cantidad')?.value || 0;
    const precio = control.get('precio_unitario')?.value || 0;
    control.patchValue({ monto_total: cantidad * precio }, { emitEvent: false });
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
    this.validationErrors = [];
    this.errorMessage = null;

    const formValue = this.movementForm.getRawValue();

    // Transform to DTO format
    const movementData = {
      proyecto_id: formValue.proyecto_id ? Number(formValue.proyecto_id) : undefined,
      proveedor_id: formValue.proveedor_id ? Number(formValue.proveedor_id) : undefined,
      fecha: formValue.fecha,
      tipo_movimiento: formValue.tipo_movimiento,
      tipo_documento: formValue.tipo_documento, // Might not be in DTO? Check backend.
      numero_documento: formValue.numero_documento,
      observaciones: formValue.observaciones,
      items: formValue.items.map((item: Record<string, unknown>) => ({
        producto_id: Number(item['producto_id']),
        cantidad: Number(item['cantidad']),
        precio_unitario: Number(item['precio_unitario']),
        observaciones: '', // Optional
      })),
    };

    this.inventoryService.createMovement(movementData).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/logistics/movements']);
      },
      error: (err: unknown) => {
        console.error('Error saving movement', err);
        this.submitting = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err as any);
        this.errorMessage = this.errorHandler.getErrorMessage(err as any);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/logistics/movements']);
  }
}
