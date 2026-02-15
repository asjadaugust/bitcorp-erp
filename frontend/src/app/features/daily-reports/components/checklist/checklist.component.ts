import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../../shared/components/dropdown/dropdown.component';

export interface ChecklistItem {
  id: string;
  label: string;
  type: 'boolean' | 'text' | 'number' | 'select';
  required: boolean;
  options?: any;
  displayOrder: number;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  items: ChecklistItem[];
}

export interface ChecklistResponse {
  itemId: string;
  value: any;
}

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  template: `
    <div class="checklist-container">
      <h3 class="checklist-title">{{ template?.name }}</h3>
      <p class="checklist-description" *ngIf="template?.description">
        {{ template.description }}
      </p>

      <div class="checklist-items">
        <div *ngFor="let item of template?.items" class="checklist-item">
          <label class="checklist-label">
            {{ item.label }}
            <span class="required" *ngIf="item.required">*</span>
          </label>

          <div *ngIf="item.type === 'boolean'" class="checkbox-container">
            <input
              type="checkbox"
              [id]="item.id"
              [(ngModel)]="responses[item.id]"
              (ngModelChange)="onResponseChange()"
              class="checkbox-input"
            />
            <label [for]="item.id" class="checkbox-label">
              {{ item.options?.trueLabel || 'Yes' }}
            </label>
          </div>

          <input
            *ngIf="item.type === 'text'"
            type="text"
            [(ngModel)]="responses[item.id]"
            (ngModelChange)="onResponseChange()"
            [required]="item.required"
            class="text-input"
            [placeholder]="item.options?.placeholder || ''"
          />

          <input
            *ngIf="item.type === 'number'"
            type="number"
            [(ngModel)]="responses[item.id]"
            (ngModelChange)="onResponseChange()"
            [required]="item.required"
            [min]="item.options?.min"
            [max]="item.options?.max"
            [step]="item.options?.step || 1"
            class="number-input"
          />

          <app-dropdown
            *ngIf="item.type === 'select'"
            [(ngModel)]="responses[item.id]"
            [options]="item.options?.values || []"
            (ngModelChange)="onResponseChange()"
            [placeholder]="'Select...'"
            [required]="item.required"
          ></app-dropdown>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .checklist-container {
        padding: 1rem;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 1rem;
      }

      .checklist-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: #1a1a1a;
      }

      .checklist-description {
        color: #666;
        margin: 0 0 1rem 0;
        font-size: 0.875rem;
      }

      .checklist-items {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .checklist-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .checklist-label {
        font-weight: 500;
        color: #333;
        font-size: 0.9375rem;
      }

      .required {
        color: #d32f2f;
        margin-left: 0.25rem;
      }

      .checkbox-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .checkbox-input {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .checkbox-label {
        cursor: pointer;
        margin: 0;
        font-weight: normal;
      }

      .text-input,
      .number-input,
      .select-input {
        padding: 0.625rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        width: 100%;
        transition: border-color 0.2s;
      }

      .text-input:focus,
      .number-input:focus,
      .select-input:focus {
        outline: none;
        border-color: #00a1de;
      }

      @media (max-width: 768px) {
        .checklist-container {
          padding: 0.75rem;
        }

        .text-input,
        .number-input,
        .select-input {
          font-size: 16px;
        }
      }
    `,
  ],
})
export class ChecklistComponent implements OnInit {
  @Input() template: ChecklistTemplate | null = null;
  @Input() initialResponses: ChecklistResponse[] = [];
  @Output() responsesChange = new EventEmitter<ChecklistResponse[]>();

  responses: { [itemId: string]: any } = {};

  ngOnInit() {
    if (this.initialResponses?.length) {
      this.initialResponses.forEach((response) => {
        this.responses[response.itemId] = response.value;
      });
    }
  }

  onResponseChange() {
    const responseArray: ChecklistResponse[] = Object.keys(this.responses)
      .filter((itemId) => this.responses[itemId] !== null && this.responses[itemId] !== undefined)
      .map((itemId) => ({
        itemId,
        value: this.responses[itemId],
      }));

    this.responsesChange.emit(responseArray);
  }

  getResponses(): ChecklistResponse[] {
    return Object.keys(this.responses).map((itemId) => ({
      itemId,
      value: this.responses[itemId],
    }));
  }
}
