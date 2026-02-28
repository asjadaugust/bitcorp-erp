import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent } from '../back-button/back-button.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-form-container',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, ButtonComponent],
  template: `
    <div class="form-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <app-back-button *ngIf="backUrl" [url]="backUrl" class="mr-2"></app-back-button>
          <div class="icon-wrapper">
            <i class="fa-solid" [class]="icon"></i>
          </div>
          <div class="title-group">
            <h1>{{ title }}</h1>
            <p class="subtitle" *ngIf="subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <div class="header-actions" *ngIf="showActions">
          <app-button
            variant="secondary"
            icon="fa-times"
            label="Cancelar"
            (clicked)="handleCancel()"
          ></app-button>
          <app-button
            variant="primary"
            [icon]="submitIcon"
            [label]="loading ? loadingText : submitLabel"
            [disabled]="disableSubmit"
            [loading]="loading"
            (clicked)="handleSubmit()"
          ></app-button>
        </div>
      </div>

      <!-- Form Content -->
      <div class="card form-card show-validation">
        <ng-content></ng-content>

        <!-- Optional Footer Actions -->
        <div class="form-footer" *ngIf="showFooter">
          <div class="footer-actions">
            <app-button
              variant="secondary"
              icon="fa-times"
              label="Cancelar"
              (clicked)="handleCancel()"
            ></app-button>
            <app-button
              variant="primary"
              [icon]="submitIcon"
              [label]="loading ? loadingText : submitLabel"
              [disabled]="disableSubmit"
              [loading]="loading"
              (clicked)="handleSubmit()"
            ></app-button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .form-container {
        background: var(--grey-100);
        min-height: calc(100vh - 72px);
        padding: var(--s-24);
      }

      /* Header */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--s-24);
        margin-bottom: var(--s-24);
        flex-wrap: wrap;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: var(--s-16);
      }

      .icon-wrapper {
        width: 48px;
        height: 48px;
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: var(--s-12);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: var(--shadow-sm);
        flex-shrink: 0;
      }

      .title-group {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
      }

      h1 {
        margin: 0;
        font-size: var(--type-h2-size);
        font-weight: 700;
        color: var(--grey-900);
        font-family: var(--font-family-display);
        line-height: 1.2;
      }

      .subtitle {
        margin: 0;
        font-size: var(--type-body-size);
        color: var(--grey-700);
        line-height: 1.5;
      }

      .header-actions {
        display: flex;
        gap: var(--s-12);
        align-items: center;
        flex-wrap: wrap;
      }

      /* Card */
      .form-card {
        background: white;
        border-radius: var(--s-12);
        padding: var(--s-32);
        box-shadow: var(--shadow-sm);
      }

      /* Footer */
      .form-footer {
        margin-top: var(--s-24);
        padding: var(--s-16) var(--s-24);
        border-top: 1px solid var(--grey-200);
        position: sticky;
        bottom: 0;
        background: white;
        z-index: 10;
        margin-left: -32px;
        margin-right: -32px;
        margin-bottom: -32px;
        border-bottom-left-radius: var(--s-12);
        border-bottom-right-radius: var(--s-12);
      }

      .footer-actions {
        display: flex;
        gap: var(--s-12);
        justify-content: flex-end;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .form-container {
          padding: var(--s-16);
        }

        .page-header {
          flex-direction: column;
          align-items: stretch;
        }

        .header-actions {
          justify-content: flex-start;
          width: 100%;
        }

        .form-card {
          padding: var(--s-20);
        }

        .footer-actions {
          flex-direction: column-reverse;
        }

        .footer-actions app-button {
          width: 100%;
        }

        .form-footer {
          margin-left: -20px;
          margin-right: -20px;
          margin-bottom: -20px;
        }
      }
    `,
  ],
})
export class FormContainerComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = 'fa-plus';
  @Input() breadcrumbs: { label: string; link?: string }[] = [];
  @Input() submitLabel = 'Guardar';
  @Input() submitIcon = 'fa-save';
  @Input() disableSubmit = false;
  @Input() loading = false;
  @Input() loadingText = 'Guardando...';
  @Input() showFooter = true;
  @Input() showActions = true;
  @Input() backUrl?: string;

  @Output() submitted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  handleSubmit(): void {
    if (!this.disableSubmit && !this.loading) {
      this.submitted.emit();
    }
  }

  handleCancel(): void {
    this.cancelled.emit();
  }
}
