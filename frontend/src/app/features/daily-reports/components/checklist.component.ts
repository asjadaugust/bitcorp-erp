import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ChecklistItem {
  id?: string;
  template_id: string;
  item_text: string;
  item_order: number;
  is_required: boolean;
  is_checked: boolean;
  notes?: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  equipment_type_id?: string;
  is_active: boolean;
  items: ChecklistItem[];
}

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="checklist-container">
      <div class="checklist-header">
        <h3>{{ template?.name }}</h3>
        <p class="text-muted" *ngIf="template?.description">{{ template.description }}</p>
      </div>

      <div class="checklist-items">
        <div
          *ngFor="let item of items; let i = index"
          class="checklist-item"
          [class.required]="item.is_required"
        >
          <div class="item-row">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="item.is_checked"
                (change)="onItemChange(item)"
                [id]="'check-' + i"
              />
              <span class="checkbox-text">
                {{ item.item_text }}
                <span class="required-badge" *ngIf="item.is_required">Required</span>
              </span>
            </label>
          </div>

          <div class="item-notes" *ngIf="item.is_checked">
            <textarea
              [(ngModel)]="item.notes"
              [placeholder]="'Add notes for ' + item.item_text"
              (blur)="onItemChange(item)"
              rows="2"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="checklist-summary">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="completionPercentage"></div>
        </div>
        <p class="progress-text">
          {{ checkedCount }} of {{ totalCount }} items completed ({{ completionPercentage }}%)
        </p>
        <p class="error-text" *ngIf="!allRequiredChecked">⚠️ All required items must be checked</p>
      </div>
    </div>
  `,
  styles: [
    `
      .checklist-container {
        background: white;
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .checklist-header h3 {
        margin: 0 0 8px 0;
        color: #333;
        font-size: 1.2rem;
      }

      .text-muted {
        color: #666;
        font-size: 0.9rem;
        margin: 0 0 16px 0;
      }

      .checklist-items {
        margin: 16px 0;
      }

      .checklist-item {
        border-left: 3px solid #e0e0e0;
        padding: 12px;
        margin-bottom: 12px;
        background: #f9f9f9;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .checklist-item.required {
        border-left-color: #ff9800;
      }

      .checklist-item:hover {
        background: #f5f5f5;
      }

      .item-row {
        display: flex;
        align-items: flex-start;
      }

      .checkbox-label {
        display: flex;
        align-items: flex-start;
        cursor: pointer;
        width: 100%;
        user-select: none;
      }

      .checkbox-label input[type='checkbox'] {
        margin-right: 12px;
        margin-top: 2px;
        width: 20px;
        height: 20px;
        cursor: pointer;
        flex-shrink: 0;
      }

      .checkbox-text {
        flex: 1;
        line-height: 1.5;
      }

      .required-badge {
        display: inline-block;
        margin-left: 8px;
        padding: 2px 8px;
        background: #ff9800;
        color: white;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .item-notes {
        margin-top: 8px;
        margin-left: 32px;
      }

      .item-notes textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: inherit;
        font-size: 0.9rem;
        resize: vertical;
      }

      .item-notes textarea:focus {
        outline: none;
        border-color: #2196f3;
      }

      .checklist-summary {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #e0e0e0;
      }

      .progress-bar {
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #4caf50, #8bc34a);
        transition: width 0.3s ease;
      }

      .progress-text {
        color: #666;
        font-size: 0.9rem;
        margin: 8px 0;
      }

      .error-text {
        color: #f44336;
        font-size: 0.9rem;
        margin: 8px 0;
        font-weight: 600;
      }

      @media (max-width: 768px) {
        .checklist-container {
          padding: 12px;
          margin: 12px 0;
        }

        .checklist-item {
          padding: 10px;
        }

        .checkbox-label input[type='checkbox'] {
          width: 24px;
          height: 24px;
        }

        .item-notes {
          margin-left: 36px;
        }
      }
    `,
  ],
})
export class ChecklistComponent implements OnInit {
  @Input() template?: ChecklistTemplate;
  @Input() items: ChecklistItem[] = [];
  @Output() itemsChange = new EventEmitter<ChecklistItem[]>();
  @Output() validationChange = new EventEmitter<boolean>();

  ngOnInit() {
    if (this.template && !this.items.length) {
      this.items = this.template.items.map((item) => ({
        ...item,
        is_checked: false,
        notes: '',
      }));
    }
  }

  onItemChange(item: ChecklistItem) {
    this.itemsChange.emit(this.items);
    this.validationChange.emit(this.allRequiredChecked);
  }

  get checkedCount(): number {
    return this.items.filter((item) => item.is_checked).length;
  }

  get totalCount(): number {
    return this.items.length;
  }

  get completionPercentage(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.checkedCount / this.totalCount) * 100);
  }

  get allRequiredChecked(): boolean {
    return this.items.filter((item) => item.is_required).every((item) => item.is_checked);
  }
}
