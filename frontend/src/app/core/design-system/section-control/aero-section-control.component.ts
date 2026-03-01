import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SectionItem {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'aero-section-control',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="aero-section-control" role="tablist">
      <button
        *ngFor="let item of items"
        type="button"
        class="aero-section-control__tab"
        [class.aero-section-control__tab--active]="item.value === activeValue"
        [disabled]="item.disabled"
        role="tab"
        [attr.aria-selected]="item.value === activeValue"
        (click)="selectTab(item)"
      >
        <i *ngIf="item.icon" class="aero-section-control__icon" [ngClass]="item.icon"></i>
        {{ item.label }}
      </button>
    </div>
  `,
  styles: [
    `
      .aero-section-control {
        display: flex;
        border-bottom: 2px solid var(--grey-200);
        gap: 0;
      }

      .aero-section-control__tab {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        padding: var(--s-12) var(--s-16);
        border: none;
        background: none;
        font-family: var(--font-text);
        font-size: var(--type-body-size);
        line-height: var(--type-body-line-height);
        font-weight: 500;
        color: var(--grey-600);
        cursor: pointer;
        position: relative;
        transition: color 0.15s ease;
        white-space: nowrap;
      }

      .aero-section-control__tab::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -2px;
        height: 2px;
        background-color: transparent;
        transition: background-color 0.15s ease;
      }

      .aero-section-control__tab:hover:not(:disabled):not(.aero-section-control__tab--active) {
        color: var(--primary-900);
      }

      .aero-section-control__tab--active {
        color: var(--primary-500);
      }

      .aero-section-control__tab--active::after {
        background-color: var(--primary-500);
      }

      .aero-section-control__tab:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .aero-section-control__icon {
        font-size: 16px;
      }
    `,
  ],
})
export class AeroSectionControlComponent {
  @Input() items: SectionItem[] = [];
  @Input() activeValue = '';

  @Output() activeValueChange = new EventEmitter<string>();

  selectTab(item: SectionItem): void {
    if (item.disabled) return;
    this.activeValue = item.value;
    this.activeValueChange.emit(item.value);
  }
}
