import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AdministrationService } from '../../services/administration.service';
import {
  FormErrorHandlerService,
  ValidationError,
} from '../../../../core/services/form-error-handler.service';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../../shared/components/dropdown/dropdown.component';
import { ValidationErrorsComponent } from '../../../../shared/components/validation-errors/validation-errors.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { FormContainerComponent } from '../../../../shared/components/form-container/form-container.component';
import { AeroInputComponent } from '../../../../core/design-system/input/aero-input.component';

@Component({
  selector: 'app-cost-center-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DropdownComponent,
    ValidationErrorsComponent,
    AlertComponent,
    FormContainerComponent,
    AeroInputComponent,
  ],
  template: `
    <app-form-container
      [icon]="isEditMode ? 'fa-pen' : 'fa-sitemap'"
      [title]="isEditMode ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información del centro de costo'
          : 'Registrar un nuevo centro de costo en el sistema'
      "
      submitLabel="Guardar Centro de Costo"
      submitIcon="fa-save"
      [loading]="loading"
      [disableSubmit]="form.invalid || loading"
      (onSubmit)="onSubmit()"
      (onCancel)="onCancel()"
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
        <!-- Section: Cost Center Information -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fa-solid fa-sitemap"></i> Información del Centro de Costo
          </h3>
          <div class="section-grid">
            <div class="form-group">
              <aero-input
                label="Código"
                formControlName="codigo"
                placeholder="ej. CC-001"
                [required]="true"
                [error]="hasError('codigo') ? 'Código es requerido' : ''"
              ></aero-input>
            </div>

            <div class="form-group">
              <aero-input
                label="Nombre"
                formControlName="nombre"
                placeholder="Nombre del centro de costo"
                [required]="true"
                [error]="hasError('nombre') ? 'Nombre es requerido' : ''"
              ></aero-input>
            </div>

            <div class="form-group">
              <label for="tipo">Tipo *</label>
              <app-dropdown
                formControlName="tipo"
                [options]="typeOptions"
                [placeholder]="'Seleccione...'"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('tipo')">Tipo es requerido</div>
            </div>

            <div class="form-group">
              <label for="is_active">Estado *</label>
              <app-dropdown
                formControlName="is_active"
                [options]="statusOptions"
                [placeholder]="'Seleccione...'"
              ></app-dropdown>
              <div class="error-msg" *ngIf="hasError('is_active')">Estado es requerido</div>
            </div>

            <div class="form-group full-width">
              <label for="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                formControlName="descripcion"
                class="form-control"
                rows="3"
                placeholder="Descripción breve del centro de costo..."
              ></textarea>
            </div>
          </div>
        </div>
      </form>
    </app-form-container>
  `,
  styles: [],
})
export class CostCenterFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private adminService = inject(AdministrationService);
  private errorHandler = inject(FormErrorHandlerService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  costCenterId?: string;
  validationErrors: ValidationError[] = [];
  errorMessage: string | null = null;

  typeOptions: DropdownOption[] = [
    { label: 'Proyecto', value: 'Proyecto' },
    { label: 'Departamento', value: 'Departamento' },
    { label: 'Área', value: 'Área' },
    { label: 'Otro', value: 'Otro' },
  ];

  statusOptions: DropdownOption[] = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id === 'undefined' || id === 'NaN') {
      this.router.navigate(['/administracion/cost-centers']);
      return;
    }
    this.costCenterId = id;
    this.isEditMode = !!this.costCenterId;
    this.initForm();
    if (this.isEditMode) this.loadCostCenter();
  }

  initForm() {
    this.form = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      tipo: ['', Validators.required],
      is_active: [true, Validators.required], // Changed from isActive
      descripcion: [''],
    });
  }

  loadCostCenter() {
    if (!this.costCenterId) return;
    this.loading = true;
    this.adminService.getCostCenter(this.costCenterId).subscribe({
      next: (cc) => {
        this.form.patchValue(cc);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        console.error('Error loading cost center', err);
        // Only redirect on 404/permission errors if desired, otherwise show error
        // this.router.navigate(['/administracion/cost-centers']);
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.validationErrors = [];
    this.errorMessage = null;

    const req =
      this.isEditMode && this.costCenterId
        ? this.adminService.updateCostCenter(this.costCenterId, this.form.value)
        : this.adminService.createCostCenter(this.form.value);

    req.subscribe({
      next: () => {
        this.router.navigate(['/administracion/cost-centers']);
      },
      error: (err) => {
        this.loading = false;
        this.validationErrors = this.errorHandler.extractValidationErrors(err);
        this.errorMessage = this.errorHandler.getErrorMessage(err);
        console.error('Error saving cost center', err);
      },
    });
  }

  onCancel() {
    this.router.navigate(['/administracion/cost-centers']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
