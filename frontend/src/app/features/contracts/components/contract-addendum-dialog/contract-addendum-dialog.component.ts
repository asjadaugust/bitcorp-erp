import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AeroDialogComponent } from '../../../../shared/components/aero-dialog/aero-dialog.component';

@Component({
  selector: 'app-contract-addendum-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AeroDialogComponent],
  template: `
    <app-aero-dialog
      title="Crear Adenda"
      subtitle="Modificar términos o vigencia del contrato"
      icon="fa-file-signature"
      submitLabel="Crear Adenda"
      submitIcon="fa-plus"
      [loading]="loading"
      [disableSubmit]="form.invalid"
      (onClose)="cancel()"
      (onCancel)="cancel()"
      (onSubmit)="submit()"
    >
      <form [formGroup]="form" class="addendum-form">
        <div class="current-state-card">
          <div class="current-state-card__icon">
            <i class="fa-solid fa-calendar-day"></i>
          </div>
          <div class="current-state-card__content">
            <label>Vigencia Actual</label>
            <p>
              Finaliza el <strong>{{ data.currentEndDate | date: 'dd/MM/yyyy' }}</strong>
            </p>
          </div>
        </div>

        <div class="section-grid">
          <div class="form-group">
            <label>Fecha de Adenda *</label>
            <input type="date" formControlName="addendumDate" class="form-control" />
            <div
              class="error-msg"
              *ngIf="form.get('addendumDate')?.touched && form.get('addendumDate')?.invalid"
            >
              La fecha de adenda es requerida
            </div>
          </div>

          <div class="form-group">
            <label>Nueva Fecha de Fin *</label>
            <input type="date" formControlName="newEndDate" class="form-control" />
            <div
              class="error-msg"
              *ngIf="form.get('newEndDate')?.touched && form.get('newEndDate')?.invalid"
            >
              La nueva fecha de fin es requerida
            </div>
          </div>

          <div class="form-group full-width">
            <label>Descripción / Motivo *</label>
            <textarea
              formControlName="description"
              class="form-control"
              rows="4"
              placeholder="Describa detalladamente el motivo de esta adenda..."
            ></textarea>
            <div
              class="error-msg"
              *ngIf="form.get('description')?.touched && form.get('description')?.invalid"
            >
              La descripción es requerida
            </div>
          </div>

          <div class="form-group">
            <label>Ajuste de Monto (Opcional)</label>
            <div class="amount-input-wrapper">
              <span class="currency-symbol">S/</span>
              <input
                type="number"
                formControlName="amountChange"
                class="form-control"
                placeholder="0.00"
              />
              <span
                class="amount-hint"
                [class.positive]="form.get('amountChange')?.value > 0"
                [class.negative]="form.get('amountChange')?.value < 0"
                *ngIf="
                  form.get('amountChange')?.value !== 0 && form.get('amountChange')?.value !== null
                "
              >
                <i
                  class="fa-solid"
                  [class.fa-plus]="form.get('amountChange')?.value > 0"
                  [class.fa-minus]="form.get('amountChange')?.value < 0"
                ></i>
                {{ getAbsValue(form.get('amountChange')?.value) | currency: 'PEN' : 'S/ ' }}
              </span>
            </div>
          </div>
        </div>
      </form>
    </app-aero-dialog>
  `,
  styles: [
    `
      .addendum-form {
        display: flex;
        flex-direction: column;
        gap: var(--s-32);
      }

      .current-state-card {
        background: var(--primary-50);
        border: 1px solid var(--primary-100);
        border-radius: var(--radius-md);
        padding: var(--s-16);
        display: flex;
        align-items: center;
        gap: var(--s-16);

        &__icon {
          width: 40px;
          height: 40px;
          background: white;
          color: var(--primary-500);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: var(--shadow-sm);
        }

        &__content {
          label {
            display: block;
            font-size: 11px;
            font-weight: 700;
            color: var(--primary-600);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: var(--s-2);
          }
          p {
            margin: 0;
            font-size: 15px;
            color: var(--primary-900);
            font-weight: 500;

            strong {
              color: var(--primary-700);
            }
          }
        }
      }

      .section-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--s-24);
      }

      .full-width {
        grid-column: 1 / -1;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--s-8);

        label {
          font-size: 13px;
          font-weight: 600;
          color: var(--grey-700);
        }
      }

      .form-control {
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        font-size: 14px;
        transition: all 0.2s;
        width: 100%;

        &:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px var(--primary-100);
        }

        &::placeholder {
          color: var(--grey-400);
        }
      }

      textarea.form-control {
        min-height: 100px;
        resize: vertical;
      }

      .amount-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;

        .currency-symbol {
          position: absolute;
          left: var(--s-12);
          font-size: 14px;
          color: var(--grey-500);
          font-weight: 500;
          pointer-events: none;
        }

        .form-control {
          padding-left: var(--s-32);
          padding-right: 100px;
        }

        .amount-hint {
          position: absolute;
          right: var(--s-12);
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: var(--s-4);
          pointer-events: none;
          opacity: 0;
          transform: translateX(10px);
          transition: all 0.2s;

          &.positive,
          &.negative {
            opacity: 1;
            transform: translateX(0);
          }

          &.positive {
            color: var(--semantic-green-600);
          }
          &.negative {
            color: var(--semantic-red-600);
          }
        }
      }

      .error-msg {
        font-size: 12px;
        color: var(--semantic-red-500);
        font-weight: 500;
      }
    `,
  ],
})
export class ContractAddendumDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ContractAddendumDialogComponent>);

  form: FormGroup;
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { contractId: number; currentEndDate: string }
  ) {
    const today = new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      addendumDate: [today, Validators.required],
      newEndDate: ['', Validators.required],
      description: ['', Validators.required],
      amountChange: [0],
    });
  }

  getAbsValue(val: any): number {
    return Math.abs(Number(val || 0));
  }

  cancel() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
