import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-contract-addendum-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>Crear Adenda</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="addendum-form">
        <p class="info-text">
          Fecha de fin actual: <strong>{{ data.currentEndDate | date:'dd/MM/yyyy' }}</strong>
        </p>

        <mat-form-field appearance="outline">
          <mat-label>Fecha de Adenda</mat-label>
          <input matInput [matDatepicker]="picker1" formControlName="addendumDate">
          <mat-datepicker-toggle matSuffix [for]="picker1"></mat-datepicker-toggle>
          <mat-datepicker #picker1></mat-datepicker>
          <mat-error *ngIf="form.get('addendumDate')?.hasError('required')">
            Requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nueva Fecha de Fin</mat-label>
          <input matInput [matDatepicker]="picker2" formControlName="newEndDate">
          <mat-datepicker-toggle matSuffix [for]="picker2"></mat-datepicker-toggle>
          <mat-datepicker #picker2></mat-datepicker>
          <mat-error *ngIf="form.get('newEndDate')?.hasError('required')">
            Requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descripción / Motivo</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
          <mat-error *ngIf="form.get('description')?.hasError('required')">
            Requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cambio en Monto (Opcional)</mat-label>
          <input matInput type="number" formControlName="amountChange" placeholder="0.00">
          <span matPrefix>S/&nbsp;</span>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid">
        Crear Adenda
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .addendum-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 16px;
      min-width: 400px;
    }
    .info-text {
      margin-bottom: 16px;
      color: var(--grey-700);
    }
  `]
})
export class ContractAddendumDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ContractAddendumDialogComponent>);

  form: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { contractId: number, currentEndDate: string }) {
    this.form = this.fb.group({
      addendumDate: [new Date(), Validators.required],
      newEndDate: ['', Validators.required],
      description: ['', Validators.required],
      amountChange: [0]
    });
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
