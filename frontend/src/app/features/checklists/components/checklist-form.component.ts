import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChecklistType,
  ChecklistStatus,
  ChecklistTemplate,
  ChecklistItem,
  CreateChecklistDto,
} from '../models/checklist.models';
import { ChecklistService } from '../services/checklist.service';
import { FormContainerComponent } from '../../../shared/components/form-container/form-container.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-checklist-form',
  standalone: true,
  imports: [CommonModule, FormsModule, FormContainerComponent, DropdownComponent],
  template: `
    <app-form-container
      [title]="getTypeLabel(checklistType)"
      [subtitle]="'Registro de inspección y estado'"
      [loading]="false"
      [submitLabel]="'Guardar Checklist'"
      [disableSubmit]="!isValid()"
      (onSubmit)="onSave()"
      (onCancel)="onCancel()"
    >
      <div class="checklist-form-content">
        <div class="template-section" *ngIf="!selectedTemplate && templates.length > 0">
          <span class="label">Usar Plantilla:</span>
          <app-dropdown
            [(ngModel)]="selectedTemplateId"
            [options]="templateOptions"
            [placeholder]="'Seleccionar una plantilla'"
            (ngModelChange)="onTemplateSelect($event)"
          ></app-dropdown>
        </div>

        <div class="checklist-items" *ngIf="selectedTemplate">
          <div
            *ngFor="let item of items; let i = index"
            class="checklist-item"
            [class.required]="item.is_required"
          >
            <div class="item-header">
              <span class="item-number">{{ i + 1 }}</span>
              <span class="item-description">{{ item.item_description }}</span>
              <span *ngIf="item.is_required" class="required-badge">Requerido</span>
            </div>

            <div class="item-category" *ngIf="item.category">
              <small>{{ item.category }}</small>
            </div>

            <div class="item-controls">
              <div class="status-buttons">
                <button
                  type="button"
                  *ngFor="let status of statusOptions"
                  [class]="'status-btn status-' + status.value"
                  [class.active]="item.status === status.value"
                  (click)="setItemStatus(i, status.value)"
                >
                  {{ status.label }}
                </button>
              </div>

              <div class="item-value" *ngIf="item.expected_value">
                <span class="label">Esperado: {{ item.expected_value }}</span>
                <input
                  type="text"
                  [(ngModel)]="item.actual_value"
                  placeholder="Valor actual"
                  class="form-control"
                />
              </div>

              <div class="item-comments" *ngIf="item.allow_comments">
                <textarea
                  [(ngModel)]="item.comments"
                  placeholder="Comentarios (opcional)"
                  class="form-control"
                  rows="2"
                ></textarea>
              </div>

              <div class="item-photos" *ngIf="item.allow_photos">
                <button type="button" class="btn-photo" (click)="addPhoto(i)">
                  <i class="fa-solid fa-camera"></i> Agregar Foto
                </button>
                <div class="photo-list" *ngIf="item.photos && item.photos.length > 0">
                  <span *ngFor="let photo of item.photos" class="photo-tag">
                    {{ photo }}
                    <button type="button" (click)="removePhoto(i, photo)">&times;</button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="checklist-footer-content" *ngIf="selectedTemplate">
          <div class="observations">
            <span class="label">Observaciones Generales</span>
            <textarea
              [(ngModel)]="observations"
              placeholder="Cualquier observación general sobre este checklist..."
              class="form-control"
              rows="3"
            ></textarea>
          </div>

          <div class="overall-status">
            <strong>Estado General:</strong>
            <span [class]="'status-badge status-' + overallStatus">
              {{ getStatusLabel(overallStatus) }}
            </span>
          </div>
        </div>
      </div>
    </app-form-container>
  `,
  styles: [
    `
      .checklist-form {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .checklist-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e5e7eb;
      }

      .template-selector {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .checklist-items {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .checklist-item {
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 1rem;
        background: #f9fafb;
      }

      .checklist-item.required {
        border-left: 4px solid #ef4444;
      }

      .item-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }

      .item-number {
        background: #3b82f6;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 0.875rem;
      }

      .item-description {
        flex: 1;
        font-weight: 500;
        color: #1f2937;
      }

      .required-badge {
        background: #ef4444;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .item-category {
        margin-left: 2.5rem;
        margin-bottom: 0.5rem;
        color: #6b7280;
      }

      .item-controls {
        margin-left: 2.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .status-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .status-btn {
        padding: 0.5rem 1rem;
        border: 2px solid #d1d5db;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .status-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .status-btn.active {
        border-width: 3px;
      }

      .status-btn.status-pass.active {
        border-color: #10b981;
        background: #d1fae5;
        color: #065f46;
      }

      .status-btn.status-fail.active {
        border-color: #ef4444;
        background: #fee2e2;
        color: #991b1b;
      }

      .status-btn.status-needs_attention.active {
        border-color: #f59e0b;
        background: #fef3c7;
        color: #92400e;
      }

      .status-btn.status-not_applicable.active {
        border-color: #6b7280;
        background: #f3f4f6;
        color: #374151;
      }

      .form-control {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.875rem;
      }

      .form-control:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .btn-photo {
        padding: 0.5rem 1rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
      }

      .photo-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .photo-tag {
        background: #e5e7eb;
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .photo-tag button {
        background: none;
        border: none;
        color: #ef4444;
        cursor: pointer;
        font-size: 1.25rem;
        line-height: 1;
      }

      .checklist-footer {
        border-top: 2px solid #e5e7eb;
        padding-top: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .overall-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .status-badge {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.875rem;
      }

      .status-badge.status-pass {
        background: #d1fae5;
        color: #065f46;
      }

      .status-badge.status-fail {
        background: #fee2e2;
        color: #991b1b;
      }

      .status-badge.status-needs_attention {
        background: #fef3c7;
        color: #92400e;
      }

      .actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }

      .btn-primary,
      .btn-secondary {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: #2563eb;
      }

      .btn-primary:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: #e5e7eb;
        color: #374151;
      }

      .btn-secondary:hover {
        background: #d1d5db;
      }

      @media (max-width: 768px) {
        .checklist-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }

        .status-buttons {
          flex-direction: column;
        }

        .status-btn {
          width: 100%;
        }
      }
    `,
  ],
})
export class ChecklistFormComponent implements OnInit {
  @Input() checklistType: ChecklistType = ChecklistType.PRE_OPERATION;
  @Input() equipmentId!: string;
  @Input() operatorId?: string;
  @Input() dailyReportId?: string;
  @Input() equipmentCategoryId?: string;
  @Output() saved = new EventEmitter<CreateChecklistDto>();
  @Output() cancelled = new EventEmitter<void>();

  private checklistService = inject(ChecklistService);

  templates: ChecklistTemplate[] = [];
  selectedTemplateId = '';
  selectedTemplate?: ChecklistTemplate;
  items: (ChecklistItem & {
    is_required: boolean;
    expected_value?: string;
    allow_photos: boolean;
    allow_comments: boolean;
  })[] = [];
  observations = '';
  overallStatus: ChecklistStatus = ChecklistStatus.PASS;

  get templateOptions(): DropdownOption[] {
    return this.templates.map((t) => ({
      label: t.template_name,
      value: t.id,
    }));
  }

  statusOptions = [
    { value: ChecklistStatus.PASS, label: 'Pase' },
    { value: ChecklistStatus.FAIL, label: 'Fallo' },
    { value: ChecklistStatus.NEEDS_ATTENTION, label: 'Requiere Atención' },
    { value: ChecklistStatus.NOT_APPLICABLE, label: 'N/A' },
  ];

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    const filters: Record<string, string | boolean> = { checklist_type: this.checklistType, is_active: true };
    if (this.equipmentCategoryId) {
      filters.equipment_category_id = this.equipmentCategoryId;
    }

    this.checklistService.getAllTemplates(filters).subscribe({
      next: (templates) => {
        this.templates = templates;
        if (templates.length === 1) {
          this.loadTemplateById(templates[0].id);
        }
      },
      error: (err) => console.error('Failed to load templates:', err),
    });
  }

  onTemplateSelect(templateId: string) {
    if (templateId) {
      this.loadTemplateById(templateId);
    }
  }

  loadTemplateById(templateId: string) {
    this.checklistService.getTemplateById(templateId).subscribe({
      next: (template) => {
        this.selectedTemplate = template;
        this.items = template.items.map((item) => ({
          id: '',
          item_order: item.item_order,
          item_description: item.item_description,
          category: item.category,
          status: ChecklistStatus.NOT_APPLICABLE,
          actual_value: '',
          comments: '',
          photos: [],
          is_required: item.is_required,
          expected_value: item.expected_value,
          allow_photos: item.allow_photos,
          allow_comments: item.allow_comments,
        }));
      },
      error: (err) => console.error('Failed to load template:', err),
    });
  }

  setItemStatus(index: number, status: ChecklistStatus) {
    this.items[index].status = status;
    this.updateOverallStatus();
  }

  updateOverallStatus() {
    const statuses = this.items.map((i) => i.status);

    if (statuses.some((s) => s === ChecklistStatus.FAIL)) {
      this.overallStatus = ChecklistStatus.FAIL;
    } else if (statuses.some((s) => s === ChecklistStatus.NEEDS_ATTENTION)) {
      this.overallStatus = ChecklistStatus.NEEDS_ATTENTION;
    } else if (
      statuses.every((s) => s === ChecklistStatus.PASS || s === ChecklistStatus.NOT_APPLICABLE)
    ) {
      this.overallStatus = ChecklistStatus.PASS;
    } else {
      this.overallStatus = ChecklistStatus.NOT_APPLICABLE;
    }
  }

  addPhoto(index: number) {
    // TODO: Integrate with photo upload service
    const photoUrl = prompt('Enter photo URL (or implement camera integration):');
    if (photoUrl) {
      if (!this.items[index].photos) {
        this.items[index].photos = [];
      }
      this.items[index].photos!.push(photoUrl);
    }
  }

  removePhoto(index: number, photo: string) {
    this.items[index].photos = this.items[index].photos?.filter((p) => p !== photo);
  }

  isValid(): boolean {
    return this.items.every((item) => {
      if (item.is_required) {
        return item.status !== ChecklistStatus.NOT_APPLICABLE;
      }
      return true;
    });
  }

  onSave() {
    if (!this.isValid()) return;

    const dto: CreateChecklistDto = {
      equipo_id: this.equipmentId,
      checklist_type: this.checklistType,
      template_id: this.selectedTemplate?.id,
      trabajador_id: this.operatorId,
      daily_report_id: this.dailyReportId,
      items: this.items.map(
        ({ _id, _is_required, _expected_value, _allow_photos, _allow_comments, ...item }) => item
      ),
      observations: this.observations || undefined,
    };

    this.saved.emit(dto);
  }

  onCancel() {
    this.cancelled.emit();
  }

  getTypeLabel(type: ChecklistType): string {
    const labels: Record<ChecklistType, string> = {
      [ChecklistType.PRE_OPERATION]: 'Checklist Pre-operacional',
      [ChecklistType.POST_OPERATION]: 'Checklist Post-operacional',
      [ChecklistType.DAILY_INSPECTION]: 'Inspección Diaria',
      [ChecklistType.WEEKLY_INSPECTION]: 'Inspección Semanal',
      [ChecklistType.MONTHLY_INSPECTION]: 'Inspección Mensual',
    };
    return labels[type];
  }

  getStatusLabel(status: ChecklistStatus): string {
    const labels: Record<ChecklistStatus, string> = {
      [ChecklistStatus.PASS]: 'Pase',
      [ChecklistStatus.FAIL]: 'Fallo',
      [ChecklistStatus.NEEDS_ATTENTION]: 'Requiere Atención',
      [ChecklistStatus.NOT_APPLICABLE]: 'No Aplica',
    };
    return labels[status];
  }
}
