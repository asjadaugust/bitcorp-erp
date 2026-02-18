import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-aero-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="aero-dialog">
      <!-- Header -->
      <div class="aero-dialog__header" *ngIf="showHeader">
        <div class="aero-dialog__header-content">
          <div class="aero-dialog__icon" *ngIf="icon">
            <i class="fa-solid" [class]="icon"></i>
          </div>
          <div class="aero-dialog__title-group">
            <h2 mat-dialog-title class="aero-dialog__title">{{ title }}</h2>
            <p class="aero-dialog__subtitle" *ngIf="subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <button
          type="button"
          class="aero-dialog__close"
          (click)="onClose.emit()"
          aria-label="Cerrar"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Content -->
      <mat-dialog-content class="aero-dialog__content">
        <ng-content></ng-content>
      </mat-dialog-content>

      <!-- Footer -->
      <div class="aero-dialog__footer" *ngIf="showFooter">
        <div class="aero-dialog__footer-start">
          <ng-content select="[footer-start]"></ng-content>
        </div>
        <div class="aero-dialog__footer-actions">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="onCancel.emit()"
            *ngIf="showCancel"
          >
            {{ cancelLabel }}
          </button>
          <button
            type="button"
            [class]="'btn ' + submitBtnClass"
            (click)="onSubmit.emit()"
            [disabled]="disableSubmit || loading"
            *ngIf="showSubmit"
          >
            <i class="fa-solid fa-spinner fa-spin" *ngIf="loading"></i>
            <i class="fa-solid" [class]="submitIcon" *ngIf="!loading && submitIcon"></i>
            {{ loading ? loadingLabel : submitLabel }}
          </button>
          <ng-content select="[footer-end]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .aero-dialog {
        display: flex;
        flex-direction: column;
        background: white;
        max-width: 100%;
      }

      /* Header */
      .aero-dialog__header {
        padding: var(--s-16) var(--s-24);
        border-bottom: 1px solid var(--grey-200);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--neutral-0);
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .aero-dialog__header-content {
        display: flex;
        align-items: center;
        gap: var(--s-16);
      }

      .aero-dialog__icon {
        width: 40px;
        height: 40px;
        background: var(--primary-50);
        color: var(--primary-500);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }

      .aero-dialog__title-group {
        display: flex;
        flex-direction: column;
      }

      .aero-dialog__title {
        margin: 0 !important;
        padding: 0 !important;
        font-size: 18px !important;
        font-weight: 700 !important;
        color: var(--grey-900) !important;
        font-family: var(--font-family-display) !important;
        line-height: 1.2 !important;
      }

      .aero-dialog__subtitle {
        margin: 0;
        font-size: 13px;
        color: var(--grey-600);
        line-height: 1.4;
      }

      .aero-dialog__close {
        background: none;
        border: none;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: var(--grey-400);
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: all 0.2s;

        &:hover {
          background: var(--grey-100);
          color: var(--grey-700);
        }
      }

      /* Content */
      .aero-dialog__content {
        padding: var(--s-24) !important;
        margin: 0 !important;
        max-height: calc(85vh - 140px);
        overflow-y: auto;
      }

      /* Footer */
      .aero-dialog__footer {
        padding: var(--s-16) var(--s-24);
        border-top: 1px solid var(--grey-200);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--grey-50);
        position: sticky;
        bottom: 0;
        z-index: 10;
      }

      .aero-dialog__footer-actions {
        display: flex;
        gap: var(--s-12);
        margin-left: auto;
      }

      /* Standardized MD Dialog Overrides */
      ::ng-deep .mat-mdc-dialog-container {
        padding: 0 !important;
        border-radius: var(--radius-lg) !important;
        overflow: hidden !important;
        box-shadow: var(--shadow-lg) !important;
        border: 1px solid var(--grey-200) !important;
      }

      ::ng-deep .mat-mdc-dialog-surface {
        border-radius: inherit !important;
      }
    `,
  ],
})
export class AeroDialogComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
  @Input() showHeader = true;
  @Input() showFooter = true;
  @Input() showCancel = true;
  @Input() showSubmit = true;
  @Input() cancelLabel = 'Cancelar';
  @Input() submitLabel = 'Guardar';
  @Input() loadingLabel = 'Guardando...';
  @Input() submitIcon = '';
  @Input() submitBtnClass = 'btn-primary';
  @Input() disableSubmit = false;
  @Input() loading = false;

  @Output() onClose = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<void>();
}
