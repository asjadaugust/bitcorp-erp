import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { AeroDialogComponent } from '../aero-dialog/aero-dialog.component';

export interface ConfirmDialogData {
  title: string;
  message: string;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  showInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  showAlertOnly?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, AeroDialogComponent, FormsModule],
  template: `
    <app-aero-dialog
      [title]="data.title"
      [subtitle]="data.message"
      [icon]="data.icon || (data.isDanger ? 'fa-triangle-exclamation' : 'fa-circle-question')"
      [submitLabel]="data.confirmLabel || 'Confirmar'"
      [cancelLabel]="data.cancelLabel || 'Cancelar'"
      [submitBtnClass]="data.isDanger ? 'btn-danger' : 'btn-primary'"
      [disableSubmit]="data.inputRequired && !inputValue"
      [showCancel]="!data.showAlertOnly"
      (onCancel)="onCancel()"
      (onSubmit)="onConfirm()"
      (onClose)="onCancel()"
    >
      <div class="input-container" *ngIf="data.showInput">
        <span class="input-label" *ngIf="data.inputLabel">{{ data.inputLabel }}</span>
        <textarea
          class="form-control"
          [(ngModel)]="inputValue"
          [placeholder]="data.inputPlaceholder || 'Escriba aquí...'"
          rows="3"
        ></textarea>
      </div>
    </app-aero-dialog>
  `,
  styles: [
    `
      .input-container {
        margin-top: var(--s-16);
      }
      .input-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--grey-700);
        margin-bottom: var(--s-8);
      }
      .form-control {
        width: 100%;
        padding: var(--s-8) var(--s-12);
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
      }
      .form-control:focus {
        border-color: var(--primary-500);
        outline: none;
        box-shadow: 0 0 0 3px var(--primary-100);
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  private dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
  inputValue = '';

  onConfirm(): void {
    if (this.data.showInput) {
      this.dialogRef.close({ confirmed: true, value: this.inputValue });
    } else {
      this.dialogRef.close(true);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
