import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ChecklistService } from '../../../core/services/checklist.service';
import { ChecklistItem } from '../../../core/models/checklist.model';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import { AeroInputComponent } from '../../../core/design-system/input/aero-input.component';
import { ConfirmService } from '../../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AeroButtonComponent } from '../../../core/design-system';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    PageLayoutComponent,
    DropdownComponent,
    AeroButtonComponent,
    PageCardComponent,
    AeroInputComponent,
  ],
  template: `
    <app-page-layout
      [title]="isEditMode ? 'Editar Plantilla' : 'Nueva Plantilla'"
      icon="fa-clipboard-list"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      backUrl="/checklists/templates"
    >
      <div actions class="action-buttons-header">
        <aero-button
          variant="primary"
          iconLeft="fa-save"
          [disabled]="!templateForm.valid || saving"
          (clicked)="onSubmit()"
          >{{ saving ? 'Guardando...' : 'Guardar' }}</aero-button
        >
      </div>

      <form [formGroup]="templateForm" (ngSubmit)="onSubmit()">
        <!-- General Information Card -->
        <app-page-card title="Información General">
          <div class="form-grid">
            <div class="form-group">
              <aero-input
                label="Código"
                formControlName="codigo"
                placeholder="Ej: CHL-EXC-001"
                [required]="true"
                [error]="
                  templateForm.get('codigo')?.invalid && templateForm.get('codigo')?.touched
                    ? 'El código es requerido'
                    : ''
                "
              ></aero-input>
            </div>

            <div class="form-group">
              <aero-input
                label="Nombre"
                formControlName="nombre"
                placeholder="Nombre de la plantilla"
                [required]="true"
                [error]="
                  templateForm.get('nombre')?.invalid && templateForm.get('nombre')?.touched
                    ? 'El nombre es requerido'
                    : ''
                "
              ></aero-input>
            </div>

            <div class="form-group">
              <label class="aero-label">Tipo de Equipo</label>
              <app-dropdown
                formControlName="tipoEquipo"
                [options]="equipmentTypeOptions"
                [placeholder]="'Seleccione...'"
              ></app-dropdown>
            </div>

            <div class="form-group">
              <label class="aero-label">Frecuencia</label>
              <app-dropdown
                formControlName="frecuencia"
                [options]="frequencyOptions"
                [placeholder]="'Seleccione...'"
              ></app-dropdown>
            </div>

            <div class="form-group full-width">
              <label class="aero-label">Descripción</label>
              <textarea
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
        </app-page-card>

        <!-- Items Card -->
        <app-page-card title="Items del Checklist">
          <div header-actions>
            <aero-button variant="primary" iconLeft="fa-plus" size="small" (clicked)="addItem()"
              >Agregar Item</aero-button
            >
          </div>

          <div formArrayName="items" class="items-list">
            <div
              *ngFor="let item of items.controls; let i = index"
              [formGroupName]="i"
              class="item-form-row"
            >
              <div class="item-form-header">
                <span class="item-number">#{{ i + 1 }}</span>
                <aero-button
                  variant="ghost"
                  size="small"
                  iconCenter="fa-trash"
                  (clicked)="removeItem(i)"
                ></aero-button>
              </div>

              <div class="item-form-grid">
                <div class="form-group">
                  <aero-input
                    label="Orden"
                    type="number"
                    formControlName="orden"
                    [required]="true"
                  ></aero-input>
                </div>

                <div class="form-group span-2">
                  <aero-input
                    label="Categoría"
                    formControlName="categoria"
                    placeholder="Ej: Sistema Hidráulico"
                  ></aero-input>
                </div>

                <div class="form-group full-width">
                  <aero-input
                    label="Descripción"
                    formControlName="descripcion"
                    placeholder="Descripción del item a verificar"
                    [required]="true"
                  ></aero-input>
                </div>

                <div class="form-group">
                  <label class="aero-label"
                    >Tipo de Verificación <span class="required">*</span></label
                  >
                  <app-dropdown
                    formControlName="tipoVerificacion"
                    [options]="verificationTypeOptions"
                    [placeholder]="'Seleccione...'"
                  ></app-dropdown>
                </div>

                <div class="form-group span-2">
                  <aero-input
                    label="Valor Esperado"
                    formControlName="valorEsperado"
                    placeholder="Ej: Sin fugas, Operativo, etc."
                  ></aero-input>
                </div>

                <div class="form-group full-width">
                  <label class="aero-label">Instrucciones</label>
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
        </app-page-card>
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

      .action-buttons-header {
        display: flex;
        gap: var(--s-12);
        align-items: center;
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

      .item-form-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--s-12);
      }

      .required {
        color: var(--error-500);
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
  private checklistService = inject(ChecklistService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

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
    { label: 'Inicio', url: '/dashboard' },
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
    this.confirmSvc.confirmDelete('este item').subscribe((confirmed) => {
      if (confirmed) {
        this.items.removeAt(index);
        this.items.controls.forEach((control, i) => {
          control.get('orden')?.setValue(i + 1);
        });
      }
    });
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
        this.snackBar.open('Error al cargar la plantilla', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/checklists/templates']);
      },
    });
  }

  onSubmit(): void {
    if (this.templateForm.invalid) {
      this.templateForm.markAllAsTouched();
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', {
        duration: 3000,
      });
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
      template['id'] = this.templateId;
      this.checklistService.updateTemplate(this.templateId, template as any).subscribe({
        next: () => {
          this.snackBar.open('Plantilla actualizada correctamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/checklists/templates']);
        },
        error: (error) => {
          console.error('Error updating template:', error);
          this.saving = false;
          this.snackBar.open('Error al actualizar la plantilla', 'Cerrar', { duration: 3000 });
        },
      });
    } else {
      this.checklistService.createTemplate(template as any).subscribe({
        next: () => {
          this.snackBar.open('Plantilla creada correctamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/checklists/templates']);
        },
        error: (error) => {
          console.error('Error creating template:', error);
          this.saving = false;
          this.snackBar.open('Error al crear la plantilla', 'Cerrar', { duration: 3000 });
        },
      });
    }
  }
}
