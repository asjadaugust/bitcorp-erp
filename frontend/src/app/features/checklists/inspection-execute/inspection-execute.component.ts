import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ChecklistService } from '../../../core/services/checklist.service';
import {
  ChecklistTemplate,
  ChecklistItem,
  ChecklistInspection,
  ChecklistResult,
} from '../../../core/models/checklist.model';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import { AeroInputComponent } from '../../../core/design-system/input/aero-input.component';
import {
  AeroBadgeComponent,
  BadgeVariant,
} from '../../../core/design-system/badge/aero-badge.component';
import { ConfirmService } from '../../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AeroButtonComponent, AeroDatePickerComponent } from '../../../core/design-system';

interface InspectionFormData {
  plantillaId?: number;
  equipoId?: number;
  trabajadorId?: number;
  fechaInspeccion?: string;
  horaInicio?: string;
  ubicacion?: string;
  horometroInicial?: number;
  odometroInicial?: number;
}

@Component({
  selector: 'app-inspection-execute',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    DropdownComponent,
    AeroButtonComponent,
    PageCardComponent,
    AeroInputComponent,
    AeroBadgeComponent,
    AeroDatePickerComponent,
  ],
  template: `
    <app-page-layout
      [title]="getPageTitle()"
      icon="fa-clipboard-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      backUrl="/checklists/inspections"
    >
      <!-- Step Indicator -->
      <div class="steps-indicator" *ngIf="currentStep > 0">
        <div class="step" [class.active]="currentStep === 1" [class.completed]="currentStep > 1">
          <div class="step-number">1</div>
          <div class="step-label">Configuración</div>
        </div>
        <div class="step-line" [class.completed]="currentStep > 1"></div>
        <div class="step" [class.active]="currentStep === 2" [class.completed]="currentStep > 2">
          <div class="step-number">2</div>
          <div class="step-label">Datos Iniciales</div>
        </div>
        <div class="step-line" [class.completed]="currentStep > 2"></div>
        <div class="step" [class.active]="currentStep === 3" [class.completed]="currentStep > 3">
          <div class="step-number">3</div>
          <div class="step-label">Inspección</div>
        </div>
        <div class="step-line" [class.completed]="currentStep > 3"></div>
        <div class="step" [class.active]="currentStep === 4">
          <div class="step-number">4</div>
          <div class="step-label">Resumen</div>
        </div>
      </div>

      <!-- Step 1: Select Template and Equipment -->
      <app-page-card *ngIf="currentStep === 1" title="Seleccionar Plantilla y Equipo">
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="aero-label">Plantilla de Checklist <span class="required">*</span></label>
            <app-dropdown
              [(ngModel)]="formData.plantillaId"
              [options]="templateOptions"
              (ngModelChange)="onTemplateChange()"
              [placeholder]="'Seleccione una plantilla'"
            ></app-dropdown>
          </div>

          <div class="form-group">
            <aero-input
              label="ID Equipo"
              type="number"
              [(ngModel)]="formData.equipoId"
              placeholder="ID del equipo"
              [required]="true"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="ID Inspector"
              type="number"
              [(ngModel)]="formData.trabajadorId"
              placeholder="ID del trabajador"
              [required]="true"
            ></aero-input>
          </div>
        </div>

        <div class="button-group">
          <aero-button variant="secondary" iconLeft="fa-arrow-left" (clicked)="cancel()"
            >Cancelar</aero-button
          >
          <aero-button
            variant="primary"
            iconLeft="fa-arrow-right"
            [disabled]="!formData.plantillaId || !formData.equipoId || !formData.trabajadorId"
            (clicked)="nextStep()"
            >Siguiente</aero-button
          >
        </div>
      </app-page-card>

      <!-- Step 2: Initial Data -->
      <app-page-card *ngIf="currentStep === 2" title="Datos Iniciales de la Inspección">
        <div class="form-grid">
          <div class="form-group">
            <aero-date-picker
              [mode]="'single'"
              [(ngModel)]="formData.fechaInspeccion"
              label="Fecha de Inspección"
              [required]="true"
            ></aero-date-picker>
          </div>

          <div class="form-group">
            <aero-input
              label="Hora de Inicio"
              type="time"
              [(ngModel)]="formData.horaInicio"
              [required]="true"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Ubicación"
              [(ngModel)]="formData.ubicacion"
              placeholder="Ubicación de la inspección"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Horómetro Inicial"
              type="number"
              [(ngModel)]="formData.horometroInicial"
              placeholder="Horas del horómetro"
            ></aero-input>
          </div>

          <div class="form-group">
            <aero-input
              label="Odómetro Inicial"
              type="number"
              [(ngModel)]="formData.odometroInicial"
              placeholder="Kilómetros del odómetro"
            ></aero-input>
          </div>
        </div>

        <div class="button-group">
          <aero-button variant="secondary" iconLeft="fa-arrow-left" (clicked)="previousStep()"
            >Atrás</aero-button
          >
          <aero-button
            variant="primary"
            iconLeft="fa-play"
            [disabled]="!formData.fechaInspeccion || !formData.horaInicio"
            (clicked)="startInspection()"
            >Iniciar Inspección</aero-button
          >
        </div>
      </app-page-card>

      <!-- Step 3: Inspection Items -->
      <div class="step-content inspection-step" *ngIf="currentStep === 3 && currentItem">
        <!-- Progress Bar -->
        <div class="progress-header">
          <h3>Item {{ currentItemIndex + 1 }} de {{ items.length }}</h3>
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div
                class="progress-fill"
                [style.width.%]="((currentItemIndex + 1) / items.length) * 100"
              ></div>
            </div>
            <span class="progress-text"> {{ currentItemIndex + 1 }} / {{ items.length }} </span>
          </div>
        </div>

        <!-- Item Card -->
        <app-page-card>
          <div class="item-header">
            <aero-badge variant="primary">{{ currentItem.categoria }}</aero-badge>
            <aero-badge variant="error" *ngIf="currentItem.esCritico"> CRÍTICO </aero-badge>
          </div>

          <h3 class="item-description">{{ currentItem.descripcion }}</h3>

          <div class="item-instructions" *ngIf="currentItem.instrucciones">
            <i class="fa-solid fa-info-circle"></i>
            {{ currentItem.instrucciones }}
          </div>

          <div class="item-details">
            <div class="detail-item">
              <strong>Tipo de Verificación:</strong> {{ currentItem.tipoVerificacion }}
            </div>
            <div class="detail-item" *ngIf="currentItem.valorEsperado">
              <strong>Valor Esperado:</strong> {{ currentItem.valorEsperado }}
            </div>
          </div>

          <!-- Response Form -->
          <div class="response-form">
            <div class="form-group">
              <span class="aero-label">Estado *</span>
              <div class="radio-group">
                <label
                  class="radio-option conforme"
                  [class.selected]="currentResult.conforme === true"
                >
                  <input
                    type="radio"
                    name="conforme"
                    [value]="true"
                    [(ngModel)]="currentResult.conforme"
                  />
                  <i class="fa-solid fa-circle-check"></i>
                  Conforme
                </label>
                <label
                  class="radio-option no-conforme"
                  [class.selected]="currentResult.conforme === false"
                >
                  <input
                    type="radio"
                    name="conforme"
                    [value]="false"
                    [(ngModel)]="currentResult.conforme"
                  />
                  <i class="fa-solid fa-circle-xmark"></i>
                  No Conforme
                </label>
                <label class="radio-option na" [class.selected]="currentResult.conforme === null">
                  <input
                    type="radio"
                    name="conforme"
                    [value]="null"
                    [(ngModel)]="currentResult.conforme"
                  />
                  N/A
                </label>
              </div>
            </div>

            <div class="form-group" *ngIf="currentItem.tipoVerificacion === 'MEDICION'">
              <aero-input
                label="Valor Medido"
                [(ngModel)]="currentResult.valorMedido"
                placeholder="Ingrese el valor medido"
              ></aero-input>
            </div>

            <div class="form-group">
              <label class="aero-label">Observaciones</label>
              <textarea
                [(ngModel)]="currentResult.observaciones"
                class="form-control"
                rows="3"
                placeholder="Observaciones adicionales..."
              ></textarea>
            </div>

            <div class="form-group" *ngIf="currentResult.conforme === false">
              <label class="aero-label">Acción Requerida <span class="required">*</span></label>
              <app-dropdown
                [(ngModel)]="currentResult.accionRequerida"
                [options]="actionOptions"
              ></app-dropdown>
            </div>

            <div
              class="form-group"
              *ngIf="currentItem.requiereFoto || currentResult.conforme === false"
            >
              <span class="aero-label"
                >Fotografía {{ currentItem.requiereFoto ? '*' : '(Opcional)' }}</span
              >
              <aero-button variant="secondary" iconLeft="fa-camera" [fullWidth]="true"
                >Tomar Foto</aero-button
              >
              <span class="photo-note">Función de cámara en desarrollo</span>
            </div>
          </div>
        </app-page-card>

        <!-- Navigation Buttons -->
        <div class="button-group navigation-buttons">
          <aero-button
            variant="secondary"
            iconLeft="fa-arrow-left"
            [disabled]="currentItemIndex === 0"
            (clicked)="previousItem()"
            >Anterior</aero-button
          >

          <aero-button variant="ghost" iconLeft="fa-floppy-disk" (clicked)="saveDraft()"
            >Guardar Borrador</aero-button
          >

          <aero-button
            variant="primary"
            iconLeft="fa-arrow-right"
            [disabled]="currentResult.conforme === undefined"
            (clicked)="nextItem()"
            >{{ currentItemIndex < items.length - 1 ? 'Siguiente' : 'Revisar' }}</aero-button
          >
        </div>
      </div>

      <!-- Step 4: Summary -->
      <div *ngIf="currentStep === 4">
        <app-page-card title="Resumen de Inspección">
          <div class="summary-stats">
            <div class="stat-card stat-total">
              <div class="stat-value">{{ items.length }}</div>
              <div class="stat-label">Total Items</div>
            </div>
            <div class="stat-card stat-pass">
              <div class="stat-value">{{ getConformeCount() }}</div>
              <div class="stat-label">Conformes</div>
            </div>
            <div class="stat-card stat-fail">
              <div class="stat-value">{{ getNoConformeCount() }}</div>
              <div class="stat-label">No Conformes</div>
            </div>
            <div class="stat-card stat-critical">
              <div class="stat-value">{{ getCriticalFailCount() }}</div>
              <div class="stat-label">Críticos Fallados</div>
            </div>
          </div>

          <div class="critical-warning" *ngIf="getCriticalFailCount() > 0">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <strong>ADVERTENCIA:</strong> Se detectaron fallas en items críticos. El equipo puede
            ser marcado como no operativo.
          </div>

          <div class="form-group">
            <label class="aero-label">Observaciones Generales</label>
            <textarea
              [(ngModel)]="inspection!.observacionesGenerales"
              class="form-control"
              rows="4"
              placeholder="Observaciones generales de la inspección..."
            ></textarea>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" [(ngModel)]="inspection!.requiereMantenimiento" />
              <span>El equipo requiere mantenimiento</span>
            </label>
          </div>

          <div class="button-group">
            <aero-button variant="secondary" iconLeft="fa-arrow-left" (clicked)="backToItems()"
              >Volver a Items</aero-button
            >
            <aero-button variant="ghost" iconLeft="fa-floppy-disk" (clicked)="saveDraft()"
              >Guardar Borrador</aero-button
            >
            <aero-button
              variant="primary"
              iconLeft="fa-check-circle"
              (clicked)="completeInspection()"
              >Completar Inspección</aero-button
            >
          </div>
        </app-page-card>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      /* Steps Indicator */
      .steps-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--s-24);
        padding: var(--s-16);
        background: var(--grey-100);
        border-radius: var(--s-8);
      }

      .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-4);
      }

      .step-number {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--grey-300);
        color: var(--grey-600);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        transition: all 0.3s;
      }

      .step.active .step-number {
        background: var(--primary-500);
        color: var(--grey-100);
      }

      .step.completed .step-number {
        background: var(--success-500);
        color: var(--grey-100);
      }

      .step-label {
        font-size: 12px;
        color: var(--grey-600);
        font-weight: 600;
      }

      .step.active .step-label {
        color: var(--primary-800);
      }

      .step-line {
        width: 60px;
        height: 2px;
        background: var(--grey-300);
        margin: 0 var(--s-8);
      }

      .step-line.completed {
        background: var(--success-500);
      }

      /* Form Styles */
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--s-16);
      }

      .form-group {
        margin-bottom: var(--s-16);
      }

      .form-group.full-width {
        grid-column: 1 / -1;
      }

      .form-control {
        width: 100%;
        padding: var(--s-12);
        border: 1px solid var(--grey-300);
        border-radius: var(--s-4);
        font-size: 14px;
      }

      .form-control:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px var(--primary-100);
      }

      textarea.form-control {
        resize: vertical;
        font-family: inherit;
      }

      /* Buttons */
      .button-group {
        display: flex;
        gap: var(--s-12);
        justify-content: flex-end;
        margin-top: var(--s-24);
      }

      /* Progress Bar */
      .progress-header {
        margin-bottom: var(--s-24);
      }

      .progress-bar-container {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        margin-top: var(--s-8);
      }

      .progress-bar {
        flex: 1;
        height: 12px;
        background: var(--grey-200);
        border-radius: 6px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--primary-500), var(--primary-700));
        transition: width 0.3s ease;
      }

      .progress-text {
        font-weight: 700;
        color: var(--primary-800);
        min-width: 60px;
        text-align: right;
      }

      /* Item Card */
      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-12);
      }

      .item-description {
        font-size: 18px;
        font-weight: 700;
        color: var(--grey-900);
        margin: var(--s-16) 0;
      }

      .item-instructions {
        background: var(--info-50);
        border-left: 4px solid var(--info-500);
        padding: var(--s-12);
        margin: var(--s-16) 0;
        border-radius: var(--s-4);
        display: flex;
        gap: var(--s-8);
      }

      .item-details {
        margin: var(--s-16) 0;
      }

      .detail-item {
        padding: var(--s-8) 0;
        color: var(--grey-700);
      }

      /* Radio Group */
      .radio-group {
        display: flex;
        gap: var(--s-12);
        flex-wrap: wrap;
      }

      .radio-option {
        flex: 1;
        min-width: 120px;
        padding: var(--s-16);
        border: 2px solid var(--grey-300);
        border-radius: var(--s-8);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-8);
        transition: all 0.2s;
        min-height: 80px;
        justify-content: center;
      }

      .radio-option input[type='radio'] {
        display: none;
      }

      .radio-option i {
        font-size: 32px;
      }

      .radio-option.conforme.selected {
        border-color: var(--success-500);
        background: var(--success-50);
        color: var(--success-800);
      }

      .radio-option.no-conforme.selected {
        border-color: var(--error-500);
        background: var(--error-50);
        color: var(--error-800);
      }

      .radio-option.na.selected {
        border-color: var(--grey-500);
        background: var(--grey-100);
        color: var(--grey-900);
      }

      /* Summary */
      .summary-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--s-16);
        margin: var(--s-24) 0;
      }

      .stat-card {
        padding: var(--s-20);
        border-radius: var(--s-8);
        text-align: center;
      }

      .stat-total {
        background: var(--primary-100);
        color: var(--primary-800);
      }

      .stat-pass {
        background: var(--success-100);
        color: var(--success-800);
      }

      .stat-fail {
        background: var(--error-100);
        color: var(--error-800);
      }

      .stat-critical {
        background: var(--warning-100);
        color: var(--warning-800);
      }

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: var(--s-8);
      }

      .stat-label {
        font-size: 14px;
        font-weight: 600;
      }

      .critical-warning {
        background: var(--error-100);
        border-left: 4px solid var(--error-500);
        padding: var(--s-16);
        border-radius: var(--s-4);
        color: var(--error-800);
        margin: var(--s-24) 0;
        display: flex;
        gap: var(--s-12);
        align-items: center;
      }

      .checkbox-group label {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        cursor: pointer;
      }

      .checkbox-group input[type='checkbox'] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .photo-note {
        display: block;
        margin-top: var(--s-8);
        font-size: 12px;
        color: var(--grey-600);
        font-style: italic;
      }

      .required {
        color: var(--error-500);
      }

      /* Mobile Optimizations */
      @media (max-width: 768px) {
        .steps-indicator {
          overflow-x: auto;
          justify-content: flex-start;
        }

        .step-label {
          display: none;
        }

        .form-grid {
          grid-template-columns: 1fr;
        }

        .button-group {
          flex-direction: column;
        }

        .radio-group {
          flex-direction: column;
        }

        .radio-option {
          min-width: 100%;
        }

        .summary-stats {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class InspectionExecuteComponent implements OnInit {
  private checklistService = inject(ChecklistService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  loading = false;
  currentStep = 1;

  templates: ChecklistTemplate[] = [];

  get templateOptions(): DropdownOption[] {
    return this.templates.map((t) => ({
      label: `${t.nombre} (${t.tipoEquipo})`,
      value: t.id,
    }));
  }

  actionOptions: DropdownOption[] = [
    { label: 'Ninguna', value: 'NINGUNA' },
    { label: 'Observar', value: 'OBSERVAR' },
    { label: 'Reparar', value: 'REPARAR' },
    { label: 'Reemplazar', value: 'REEMPLAZAR' },
  ];

  items: ChecklistItem[] = [];
  inspection: ChecklistInspection | null = null;

  formData: InspectionFormData = {};
  currentItemIndex = 0;
  currentItem: ChecklistItem | null = null;
  currentResult: Partial<ChecklistResult> = {};
  results = new Map<number, Partial<ChecklistResult>>();

  breadcrumbs = [
    { label: 'Inicio', url: '/dashboard' },
    { label: 'Listas de Verificación', url: '/checklists' },
    { label: 'Inspecciones', url: '/checklists/inspections' },
    { label: 'Nueva Inspección' },
  ];

  ngOnInit(): void {
    this.loadTemplates();

    const inspectionId = this.route.snapshot.paramMap.get('id');
    if (inspectionId) {
      this.loadExistingInspection(Number(inspectionId));
    } else {
      this.formData.fechaInspeccion = new Date().toISOString().split('T')[0];
      this.formData.horaInicio = new Date().toTimeString().slice(0, 5);
    }
  }

  loadTemplates(): void {
    this.checklistService.getAllTemplates({ activo: true }).subscribe({
      next: (data) => {
        this.templates = data;
      },
      error: (error) => {
        console.error('Error loading templates:', error);
      },
    });
  }

  loadExistingInspection(id: number): void {
    this.loading = true;
    this.checklistService.getInspectionWithResults(id).subscribe({
      next: (data) => {
        this.inspection = data;
        this.items = data.plantilla?.items || [];

        if (data.resultados) {
          data.resultados.forEach((result) => {
            this.results.set(result.itemId, result);
          });
        }

        this.currentStep = 3;
        this.loadCurrentItem();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading inspection:', error);
        this.loading = false;
      },
    });
  }

  onTemplateChange(): void {
    if (this.formData.plantillaId) {
      this.checklistService.getTemplateById(this.formData.plantillaId).subscribe({
        next: (template) => {
          this.items = template.items || [];
        },
      });
    }
  }

  getPageTitle(): string {
    if (this.currentStep === 1) return 'Nueva Inspección - Configuración';
    if (this.currentStep === 2) return 'Nueva Inspección - Datos Iniciales';
    if (this.currentStep === 3) return 'Inspección en Curso';
    if (this.currentStep === 4) return 'Resumen de Inspección';
    return 'Inspección';
  }

  nextStep(): void {
    this.currentStep++;
  }

  previousStep(): void {
    this.currentStep--;
  }

  startInspection(): void {
    this.loading = true;
    this.checklistService.createInspection(this.formData).subscribe({
      next: (inspection) => {
        this.inspection = inspection;
        this.currentStep = 3;
        this.loadCurrentItem();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating inspection:', error);
        this.snackBar.open('Error al crear la inspección', 'Cerrar', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  loadCurrentItem(): void {
    if (this.items.length > 0) {
      this.currentItem = this.items[this.currentItemIndex];

      const existingResult = this.results.get(this.currentItem.id);
      if (existingResult) {
        this.currentResult = { ...existingResult };
      } else {
        this.currentResult = {
          inspeccionId: this.inspection!.id,
          itemId: this.currentItem.id,
          conforme: undefined,
          accionRequerida: 'NINGUNA',
        };
      }
    }
  }

  saveCurrentResult(): void {
    if (this.currentItem) {
      this.checklistService.saveResult(this.currentResult).subscribe({
        next: (result) => {
          this.results.set(this.currentItem!.id, result);
        },
        error: (error) => {
          console.error('Error saving result:', error);
        },
      });
    }
  }

  nextItem(): void {
    this.saveCurrentResult();

    if (this.currentItemIndex < this.items.length - 1) {
      this.currentItemIndex++;
      this.loadCurrentItem();
    } else {
      this.currentStep = 4;
    }
  }

  previousItem(): void {
    this.saveCurrentResult();

    if (this.currentItemIndex > 0) {
      this.currentItemIndex--;
      this.loadCurrentItem();
    }
  }

  backToItems(): void {
    this.currentStep = 3;
  }

  saveDraft(): void {
    this.saveCurrentResult();
    this.snackBar.open('Borrador guardado correctamente', 'Cerrar', { duration: 3000 });
  }

  completeInspection(): void {
    this.saveCurrentResult();

    this.confirmSvc
      .confirmDelete('completar esta inspección (no podrá editarla después)')
      .subscribe((confirmed) => {
        if (confirmed) {
          this.loading = true;
          this.checklistService.completeInspection(this.inspection!.id).subscribe({
            next: (completedInspection) => {
              this.loading = false;
              this.snackBar.open('Inspección completada exitosamente', 'Cerrar', {
                duration: 3000,
              });
              this.router.navigate(['/checklists/inspections', completedInspection.id]);
            },
            error: (error) => {
              console.error('Error completing inspection:', error);
              this.snackBar.open('Error al completar la inspección', 'Cerrar', { duration: 3000 });
              this.loading = false;
            },
          });
        }
      });
  }

  cancel(): void {
    this.confirmSvc
      .confirmDelete('cancelar (se perderán los datos no guardados)')
      .subscribe((confirmed) => {
        if (confirmed) {
          this.router.navigate(['/checklists/inspections']);
        }
      });
  }

  getConformeCount(): number {
    return Array.from(this.results.values()).filter((r) => r.conforme === true).length;
  }

  getNoConformeCount(): number {
    return Array.from(this.results.values()).filter((r) => r.conforme === false).length;
  }

  getCriticalFailCount(): number {
    return this.items.filter((item) => {
      const result = this.results.get(item.id);
      return item.esCritico && result?.conforme === false;
    }).length;
  }
}
