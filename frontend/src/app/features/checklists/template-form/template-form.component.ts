import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ChecklistService } from '../../../core/services/checklist.service';
import {
  ChecklistItem,
} from '../../../core/models/checklist.model';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    PageLayoutComponent,
    DropdownComponent,
  ],
  template: `
    <app-page-layout
      [title]="isEditMode ? 'Editar Plantilla' : 'Nueva Plantilla'"
      icon="fa-clipboard-list"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <form [formGroup]="templateForm" (ngSubmit)="onSubmit()">
        <div class="form-actions-top">
          <button type="button" class="btn btn-secondary" (click)="goBack()">
            <i class="fa-solid fa-arrow-left"></i> Cancelar
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="!templateForm.valid || saving">
            <i class="fa-solid fa-save"></i> {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>

        <!-- General Information Card -->
        <div class="form-card">
          <h2 class="card-title">
            <i class="fa-solid fa-info-circle"></i>
            Información General
          </h2>

          <div class="form-grid">
            <div class="form-group">
              <label for="codigo">Código *</label>
              <input
                id="codigo"
                type="text"
                formControlName="codigo"
                class="form-control"
                placeholder="Ej: CHL-EXC-001"
              />
              <span
                class="error-message"
                *ngIf="templateForm.get('codigo')?.invalid && templateForm.get('codigo')?.touched"
              >
                El código es requerido
              </span>
            </div>

            <div class="form-group">
              <label for="nombre">Nombre *</label>
              <input
                id="nombre"
                type="text"
                formControlName="nombre"
                class="form-control"
                placeholder="Nombre de la plantilla"
              />
              <span
                class="error-message"
                *ngIf="templateForm.get('nombre')?.invalid && templateForm.get('nombre')?.touched"
              >
                El nombre es requerido
              </span>
            </div>

            <div class="form-group">
              <label for="tipoEquipo">Tipo de Equipo</label>
              <app-dropdown
                formControlName="tipoEquipo"
                [options]="equipmentTypeOptions"
                [placeholder]="'Seleccione...'"
              ></app-dropdown>
            </div>

            <div class="form-group">
              <label for="frecuencia">Frecuencia</label>
              <app-dropdown
                formControlName="frecuencia"
                [options]="frequencyOptions"
                [placeholder]="'Seleccione...'"
              ></app-dropdown>
            </div>

            <div class="form-group full-width">
              <label for="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                formControlName="descripcion"
                class="form-control"
                rows="3"
                placeholder="Descripción opcional de la plantilla"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="activo" />
                <span>Plantilla activa</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Items Card -->
        <div class="form-card">
          <div class="card-header-with-action">
            <h2 class="card-title">
              <i class="fa-solid fa-list-check"></i>
              Items del Checklist
            </h2>
            <button type="button" class="btn btn-success btn-sm" (click)="addItem()">
              <i class="fa-solid fa-plus"></i> Agregar Item
            </button>
          </div>

          <div formArrayName="items" class="items-list">
            <div
              *ngFor="let item of items.controls; let i = index"
              [formGroupName]="i"
              class="item-form-row"
            >
              <div class="item-form-header">
                <span class="item-number">#{{ i + 1 }}</span>
                <button
                  type="button"
                  class="btn-icon btn-danger-icon"
                  (click)="removeItem(i)"
                  title="Eliminar"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>

              <div class="item-form-grid">
                <div class="form-group">
                  <span class="label">Orden *</span>
                  <input type="number" formControlName="orden" class="form-control" min="1" />
                </div>

                <div class="form-group span-2">
                  <span class="label">Categoría</span>
                  <input
                    type="text"
                    formControlName="categoria"
                    class="form-control"
                    placeholder="Ej: Sistema Hidráulico"
                  />
                </div>

                <div class="form-group full-width">
                  <span class="label">Descripción *</span>
                  <input
                    type="text"
                    formControlName="descripcion"
                    class="form-control"
                    placeholder="Descripción del item a verificar"
                  />
                </div>

                <div class="form-group">
                  <span class="label">Tipo de Verificación *</span>
                  <app-dropdown
                    formControlName="tipoVerificacion"
                    [options]="verificationTypeOptions"
                    [placeholder]="'Seleccione...'"
                  ></app-dropdown>
                </div>

                <div class="form-group span-2">
                  <span class="label">Valor Esperado</span>
                  <input
                    type="text"
                    formControlName="valorEsperado"
                    class="form-control"
                    placeholder="Ej: Sin fugas, Operativo, etc."
                  />
                </div>

                <div class="form-group full-width">
                  <span class="label">Instrucciones</span>
                  <textarea
                    formControlName="instrucciones"
                    class="form-control"
                    rows="2"
                    placeholder="Instrucciones adicionales para la verificación"
                  ></textarea>
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="esCritico" />
                    <span>Item crítico</span>
                  </label>
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="requiereFoto" />
                    <span>Requiere foto</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="empty-state" *ngIf="items.length === 0">
              <i class="fa-solid fa-inbox"></i>
              <p>No hay items. Haga clic en "Agregar Item" para comenzar.</p>
            </div>
          </div>
        </div>

        <div class="form-actions-bottom">
          <button type="button" class="btn btn-secondary" (click)="goBack()">
            <i class="fa-solid fa-arrow-left"></i> Cancelar
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="!templateForm.valid || saving">
            <i class="fa-solid fa-save"></i> {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </form>
    </app-page-layout>
  `,
  styles: [
    `
      form {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);
      }

      .form-actions-top,
      .form-actions-bottom {
        display: flex;
        gap: var(--s-8);
        justify-content: space-between;
      }

      .btn {
        padding: var(--s-8) var(--s-16);
        border: none;
        border-radius: var(--s-8);
        font-size: var(--type-bodySmall-size);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        transition: all 0.2s ease;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-primary {
        background: var(--primary-500);
        color: var(--neutral-0);
      }
      .btn-primary:hover:not(:disabled) {
        background: var(--primary-800);
      }

      .btn-secondary {
        background: var(--grey-200);
        color: var(--grey-800);
      }
      .btn-secondary:hover {
        background: var(--grey-300);
      }

      .btn-success {
        background: var(--success-500);
        color: var(--neutral-0);
      }
      .btn-success:hover {
        background: var(--success-800);
      }

      .btn-sm {
        padding: var(--s-6) var(--s-12);
        font-size: 12px;
      }

      .form-card {
        background: var(--neutral-0);
        border-radius: var(--s-12);
        padding: var(--s-24);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .card-title {
        margin: 0 0 var(--s-20) 0;
        font-size: var(--type-h3-size);
        font-weight: 700;
        color: var(--grey-900);
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .card-header-with-action {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-20);
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--s-16);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--s-6);
      }

      .form-group.full-width {
        grid-column: 1 / -1;
      }

      .form-group.span-2 {
        grid-column: span 2;
      }

      .form-group label {
        font-size: var(--type-bodySmall-size);
        font-weight: 600;
        color: var(--grey-700);
      }

      .form-control {
        padding: var(--s-8) var(--s-12);
        border: 1px solid var(--grey-300);
        border-radius: var(--s-6);
        font-size: var(--type-body-size);
        transition: all 0.2s;
      }

      .form-control:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
      }

      .form-control:disabled {
        background: var(--grey-100);
        cursor: not-allowed;
      }

      textarea.form-control {
        resize: vertical;
        font-family: inherit;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        cursor: pointer;
        user-select: none;
      }

      .checkbox-label input[type='checkbox'] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .error-message {
        color: var(--error-500);
        font-size: var(--type-bodySmall-size);
        margin-top: var(--s-4);
      }

      .items-list {
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
      }

      .item-form-row {
        border: 2px solid var(--grey-200);
        border-radius: var(--s-8);
        padding: var(--s-16);
        background: var(--grey-50);
      }

      .item-form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-12);
        padding-bottom: var(--s-12);
        border-bottom: 1px solid var(--grey-200);
      }

      .item-number {
        font-weight: 700;
        font-size: var(--type-h4-size);
        color: var(--primary-500);
      }

      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: var(--s-6);
        border-radius: var(--s-4);
        transition: all 0.2s;
      }

      .btn-danger-icon {
        color: var(--error-500);
      }

      .btn-danger-icon:hover {
        background: var(--error-100);
        color: var(--error-800);
      }

      .item-form-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--s-12);
      }

      .empty-state {
        text-align: center;
        padding: var(--s-48) var(--s-24);
        color: var(--grey-500);
      }

      .empty-state i {
        font-size: 48px;
        margin-bottom: var(--s-16);
        opacity: 0.5;
      }

      .empty-state p {
        margin: 0;
        font-size: var(--type-body-size);
      }

      @media (max-width: 768px) {
        .form-grid {
          grid-template-columns: 1fr;
        }

        .item-form-grid {
          grid-template-columns: 1fr;
        }

        .form-group.span-2 {
          grid-column: span 1;
        }
      }
    `,
  ],
})
export class TemplateFormComponent implements OnInit {
  checklistService = inject(ChecklistService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  templateForm!: FormGroup;
  loading = false;
  saving = false;
  isEditMode = false;
  templateId?: number;

  equipmentTypeOptions: DropdownOption[] = [
    { label: 'Excavadora', value: 'EXCAVADORA' },
    { label: 'Cargador Frontal', value: 'CARGADOR_FRONTAL' },
    { label: 'Volquete', value: 'VOLQUETE' },
    { label: 'Retroexcavadora', value: 'RETROEXCAVADORA' },
    { label: 'Motoniveladora', value: 'MOTONIVELADORA' },
    { label: 'Rodillo', value: 'RODILLO' },
    { label: 'Cisterna', value: 'CISTERNA' },
  ];

  frequencyOptions: DropdownOption[] = [
    { label: 'Diario', value: 'DIARIO' },
    { label: 'Semanal', value: 'SEMANAL' },
    { label: 'Mensual', value: 'MENSUAL' },
    { label: 'Antes de Uso', value: 'ANTES_USO' },
  ];

  verificationTypeOptions: DropdownOption[] = [
    { label: 'Visual', value: 'VISUAL' },
    { label: 'Medición', value: 'MEDICION' },
    { label: 'Funcional', value: 'FUNCIONAL' },
    { label: 'Auditivo', value: 'AUDITIVO' },
  ];

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Checklists', url: '/checklists' },
    { label: 'Plantillas', url: '/checklists/templates' },
    { label: 'Nuevo' },
  ];

  ngOnInit(): void {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.templateId = +id;
      this.breadcrumbs[this.breadcrumbs.length - 1].label = 'Editar';
      this.loadTemplate(this.templateId);
    }
  }

  initForm(): void {
    this.templateForm = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      tipoEquipo: [''],
      descripcion: [''],
      frecuencia: [''],
      activo: [true],
      items: this.fb.array([]),
    });
  }

  get items(): FormArray {
    return this.templateForm.get('items') as FormArray;
  }

  createItemFormGroup(item?: ChecklistItem): FormGroup {
    return this.fb.group({
      id: [item?.id || null],
      plantillaId: [item?.plantillaId || null],
      orden: [item?.orden || this.items.length + 1, Validators.required],
      categoria: [item?.categoria || ''],
      descripcion: [item?.descripcion || '', Validators.required],
      tipoVerificacion: [item?.tipoVerificacion || '', Validators.required],
      valorEsperado: [item?.valorEsperado || ''],
      esCritico: [item?.esCritico || false],
      requiereFoto: [item?.requiereFoto || false],
      instrucciones: [item?.instrucciones || ''],
    });
  }

  addItem(): void {
    this.items.push(this.createItemFormGroup());
  }

  removeItem(index: number): void {
    if (confirm('¿Está seguro de eliminar este item?')) {
      this.items.removeAt(index);
      // Update orden for remaining items
      this.items.controls.forEach((control, i) => {
        control.get('orden')?.setValue(i + 1);
      });
    }
  }

  loadTemplate(id: number): void {
    this.loading = true;
    this.checklistService.getTemplateById(id).subscribe({
      next: (template) => {
        this.templateForm.patchValue({
          codigo: template.codigo,
          nombre: template.nombre,
          tipoEquipo: template.tipoEquipo || '',
          descripcion: template.descripcion || '',
          frecuencia: template.frecuencia || '',
          activo: template.activo,
        });

        // Load items
        if (template.items && template.items.length > 0) {
          template.items
            .sort((a, b) => a.orden - b.orden)
            .forEach((item) => {
              this.items.push(this.createItemFormGroup(item));
            });
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading template:', error);
        this.loading = false;
        alert('Error al cargar la plantilla');
        this.goBack();
      },
    });
  }

  onSubmit(): void {
    if (this.templateForm.invalid) {
      this.templateForm.markAllAsTouched();
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    this.saving = true;
    const formValue = this.templateForm.value;

    const template: Record<string, unknown> = {
      codigo: formValue.codigo,
      nombre: formValue.nombre,
      tipoEquipo: formValue.tipoEquipo || null,
      descripcion: formValue.descripcion || null,
      frecuencia: formValue.frecuencia || null,
      activo: formValue.activo,
      items: formValue.items,
    };

    if (this.isEditMode && this.templateId) {
      template.id = this.templateId;
      this.checklistService.updateTemplate(this.templateId, template).subscribe({
        next: () => {
          alert('Plantilla actualizada exitosamente');
          this.router.navigate(['/checklists/templates']);
        },
        error: (error) => {
          console.error('Error updating template:', error);
          this.saving = false;
          alert('Error al actualizar la plantilla');
        },
      });
    } else {
      this.checklistService.createTemplate(template).subscribe({
        next: () => {
          alert('Plantilla creada exitosamente');
          this.router.navigate(['/checklists/templates']);
        },
        error: (error) => {
          console.error('Error creating template:', error);
          this.saving = false;
          alert('Error al crear la plantilla');
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/checklists/templates']);
  }
}
