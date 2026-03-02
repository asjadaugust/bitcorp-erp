import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormArray,
  Validators,
} from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApprovalService, CrearPlantillaDto } from '../../core/services/approval.service';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../shared/components/form-section/form-section.component';
import { AeroInputComponent } from '../../core/design-system/input/aero-input.component';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-approval-template-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    FormContainerComponent,
    FormSectionComponent,
    AeroInputComponent,
    DropdownComponent,
    AeroButtonComponent,
  ],
  styles: [
    `
      @use 'form-layout';

      .pasos-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .paso-row {
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-md, 8px);
        padding: 16px;
        background: var(--grey-50);
        position: relative;
      }

      .paso-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--primary-700);
      }

      .paso-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
      }

      .add-step-btn {
        margin-top: 8px;
      }

      .optional-check {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.88rem;
        color: var(--grey-700);
        margin-top: 4px;
        cursor: pointer;

        input[type='checkbox'] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
      }
    `,
  ],
  template: `
    <app-form-container
      [title]="isEdit ? 'Editar Plantilla' : 'Nueva Plantilla de Aprobación'"
      [loading]="saving()"
      (submitted)="onSave()"
      (cancelled)="router.navigate(['/approvals/templates'])"
    >
      <app-form-section title="Configuración del Módulo" icon="fa-cog" [columns]="2">
        <div class="form-group">
          <label>Nombre de la Plantilla *</label>
          <aero-input
            placeholder="Ej: Aprobación Parte Diario"
            [formControl]="form.controls.nombre"
          ></aero-input>
        </div>

        <div class="form-group">
          <label>Módulo *</label>
          <app-dropdown
            [options]="moduleOptions"
            placeholder="Seleccionar módulo"
            [formControl]="form.controls.module_name"
          ></app-dropdown>
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label>Descripción</label>
          <textarea
            class="form-control"
            placeholder="Descripción de este flujo de aprobación..."
            rows="2"
            [formControl]="form.controls.descripcion"
          ></textarea>
        </div>
      </app-form-section>

      <app-form-section title="Pasos de Aprobación" icon="fa-list-ol" [columns]="1">
        <div class="pasos-list">
          <div *ngFor="let paso of pasosArray.controls; let i = index" class="paso-row">
            <div class="paso-header">
              <span>Paso {{ i + 1 }}</span>
              <aero-button
                *ngIf="pasosArray.length > 1"
                variant="ghost"
                iconLeft="fa-trash"
                (clicked)="removePaso(i)"
              ></aero-button>
            </div>

            <div class="paso-grid" [formGroup]="getPasoGroup(i)">
              <div class="form-group">
                <label>Nombre del Paso *</label>
                <aero-input
                  placeholder="Ej: Aprobación Residente"
                  formControlName="nombre_paso"
                ></aero-input>
              </div>

              <div class="form-group">
                <label>Tipo de Aprobador *</label>
                <app-dropdown
                  [options]="tipoAprobadorOptions"
                  formControlName="tipo_aprobador"
                ></app-dropdown>
              </div>

              <div
                class="form-group"
                *ngIf="getPasoGroup(i).get('tipo_aprobador')?.value === 'ROLE'"
              >
                <label>Rol *</label>
                <app-dropdown [options]="roleOptions" formControlName="rol"></app-dropdown>
              </div>

              <div class="form-group">
                <label>Lógica de Aprobación *</label>
                <app-dropdown
                  [options]="logicaOptions"
                  formControlName="logica_aprobacion"
                ></app-dropdown>
              </div>

              <div class="form-group">
                <label class="optional-check">
                  <input type="checkbox" formControlName="es_opcional" />
                  Paso Opcional
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="add-step-btn">
          <aero-button variant="secondary" iconLeft="fa-plus" (clicked)="addPaso()"
            >Agregar Paso</aero-button
          >
        </div>
      </app-form-section>
    </app-form-container>
  `,
})
export class ApprovalTemplateFormComponent implements OnInit {
  router = inject(Router);
  route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private approvalSvc = inject(ApprovalService);

  saving = signal(false);
  isEdit = false;
  editId?: number;

  form = this.fb.group({
    nombre: ['', Validators.required],
    module_name: ['', Validators.required],
    descripcion: [''],
    pasos: this.fb.array([]),
  });

  get pasosArray(): FormArray {
    return this.form.get('pasos') as FormArray;
  }

  moduleOptions = [
    { value: 'daily_report', label: 'Parte Diario' },
    { value: 'valorizacion', label: 'Valorización' },
    { value: 'solicitud_equipo', label: 'Solicitud de Equipo' },
    { value: 'adhoc', label: 'Ad-hoc' },
  ];

  tipoAprobadorOptions = [
    { value: 'ROLE', label: 'Por Rol' },
    { value: 'USER_ID', label: 'Por Usuario Específico' },
  ];

  roleOptions = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'DIRECTOR', label: 'Director' },
    { value: 'RESIDENTE', label: 'Residente' },
    { value: 'ADMINISTRADOR_PROYECTO', label: 'Administrador de Proyecto' },
    { value: 'JEFE_EQUIPO', label: 'Jefe de Equipo' },
    { value: 'SSOMA', label: 'SSOMA' },
  ];

  logicaOptions = [
    { value: 'ALL_MUST_APPROVE', label: 'Todos deben aprobar' },
    { value: 'FIRST_APPROVES', label: 'El primero que aprueba es suficiente' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.editId = parseInt(id);
      this.loadTemplate(this.editId);
    } else {
      this.addPaso(); // Start with one step
    }
  }

  loadTemplate(id: number) {
    this.approvalSvc.getTemplate(id).subscribe({
      next: (t) => {
        this.form.patchValue({
          nombre: t.nombre,
          module_name: t.module_name,
          descripcion: t.descripcion ?? '',
        });
        (t.pasos ?? []).forEach((p) =>
          this.pasosArray.push(
            this.fb.group({
              nombre_paso: [p.nombre_paso, Validators.required],
              tipo_aprobador: [p.tipo_aprobador],
              rol: [p.rol ?? ''],
              logica_aprobacion: [p.logica_aprobacion],
              es_opcional: [p.es_opcional],
            })
          )
        );
      },
    });
  }

  addPaso() {
    this.pasosArray.push(
      this.fb.group({
        nombre_paso: ['', Validators.required],
        tipo_aprobador: ['ROLE'],
        rol: [''],
        logica_aprobacion: ['ALL_MUST_APPROVE'],
        es_opcional: [false],
      })
    );
  }

  removePaso(index: number) {
    this.pasosArray.removeAt(index);
  }

  getPasoGroup(index: number) {
    return this.pasosArray.at(index) as any;
  }

  onSave() {
    if (this.form.invalid) return;

    const pasos = this.pasosArray.value.map((p: any, i: number) => ({
      paso_numero: i + 1,
      nombre_paso: p.nombre_paso,
      tipo_aprobador: p.tipo_aprobador as 'ROLE' | 'USER_ID',
      rol: p.rol || undefined,
      logica_aprobacion: p.logica_aprobacion as 'ALL_MUST_APPROVE' | 'FIRST_APPROVES',
      es_opcional: p.es_opcional,
    }));

    const dto: CrearPlantillaDto = {
      nombre: this.form.value.nombre!,
      module_name: this.form.value.module_name!,
      descripcion: this.form.value.descripcion || undefined,
      pasos,
    };

    this.saving.set(true);
    const obs =
      this.isEdit && this.editId
        ? this.approvalSvc.updateTemplate(this.editId, dto)
        : this.approvalSvc.createTemplate(dto);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/approvals/templates']);
      },
      error: () => this.saving.set(false),
    });
  }
}
