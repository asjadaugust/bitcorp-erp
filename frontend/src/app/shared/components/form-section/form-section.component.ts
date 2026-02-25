import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-section full-width">
      <h3 class="section-title">
        <i *ngIf="icon" class="fa-solid" [ngClass]="icon"></i>
        {{ title }}
      </h3>
      <p *ngIf="subtitle" class="section-subtitle">{{ subtitle }}</p>
      <div
        class="section-grid"
        [class.section-grid-1]="columns === 1"
        [class.section-grid-3]="columns === 3"
      >
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'form-layout';

      .section-subtitle {
        font-size: 13px;
        color: var(--grey-500);
        margin: -0.75rem 0 1rem 0;
        line-height: 1.4;
      }

      .section-grid-1 {
        grid-template-columns: 1fr !important;
      }

      .section-grid-3 {
        grid-template-columns: repeat(3, 1fr) !important;

        @media (max-width: 1024px) {
          grid-template-columns: repeat(2, 1fr) !important;
        }

        @media (max-width: 768px) {
          grid-template-columns: 1fr !important;
        }
      }
    `,
  ],
})
export class FormSectionComponent {
  @Input({ required: true }) title = '';
  @Input() icon = '';
  @Input() subtitle = '';
  @Input() columns: 1 | 2 | 3 = 2;
}
