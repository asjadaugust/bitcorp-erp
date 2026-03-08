import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PettyCashService } from './petty-cash.service';
import { FormContainerComponent } from '../../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';
import { AeroDatePickerComponent } from '../../../core/design-system';
@Component({
  selector: 'app-petty-cash-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormContainerComponent,
    FormSectionComponent,
    AeroDatePickerComponent,
  ],
  template: `
    <app-form-container
      [title]="isEditMode ? 'Editar Caja Chica' : 'Nueva Caja Chica'"
      [subtitle]="
        isEditMode
          ? 'Actualizar información de la caja chica'
          : 'Registrar una nueva caja chica en el sistema'
      "
      [icon]="isEditMode ? 'fa-pen' : 'fa-plus'"
      [loading]="loading"
      [disableSubmit]="cajaForm.invalid || loading"
      [submitLabel]="isEditMode ? 'Guardar Cambios' : 'Crear Caja'"
      (submitted)="onSubmit()"
      (cancelled)="cancel()"
    >
      <form [formGroup]="cajaForm" class="form-grid">
        <app-form-section title="Datos de la Caja" icon="fa-cash-register">
          <div class="form-group">
            <label for="numero_caja">Número de Caja *</label>
            <input
              id="numero_caja"
              type="text"
              formControlName="numero_caja"
              class="form-control"
              placeholder="ej. CAJA-001"
            />
            <div class="error-msg" *ngIf="hasError('numero_caja')">Número de caja es requerido</div>
          </div>

          <div class="form-group">
            <label for="saldo_inicial">Saldo Inicial *</label>
            <input
              id="saldo_inicial"
              type="number"
              formControlName="saldo_inicial"
              class="form-control"
              placeholder="0.00"
            />
            <div class="error-msg" *ngIf="hasError('saldo_inicial')">
              Saldo inicial es requerido
            </div>
          </div>

          <div class="form-group">
            <aero-date-picker
              [mode]="'single'"
              formControlName="fecha_apertura"
              label="Fecha de Apertura"
              [required]="true"
              [state]="hasError('fecha_apertura') ? 'error' : 'default'"
              [error]="hasError('fecha_apertura') ? 'Fecha de apertura es requerida' : ''"
            ></aero-date-picker>
          </div>
        </app-form-section>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout';
    `,
  ],
})
export class PettyCashFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pettyCashService = inject(PettyCashService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  cajaForm: FormGroup;
  isEditMode = false;
  loading = false;
  cajaId: number | null = null;

  constructor() {
    this.cajaForm = this.fb.group({
      numero_caja: ['', Validators.required],
      saldo_inicial: [null, [Validators.required, Validators.min(0)]],
      fecha_apertura: [new Date().toISOString().split('T')[0], Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.cajaId = +params['id'];
        this.loadCaja(this.cajaId);
      }
    });
  }

  loadCaja(id: number): void {
    this.loading = true;
    this.pettyCashService.getCaja(id).subscribe({
      next: (caja) => {
        this.cajaForm.patchValue({
          numero_caja: caja.numero_caja,
          saldo_inicial: caja.saldo_inicial,
          fecha_apertura: caja.fecha_apertura ? caja.fecha_apertura.split('T')[0] : '',
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/administracion/petty-cash']);
      },
    });
  }

  onSubmit(): void {
    if (this.cajaForm.invalid) return;

    this.loading = true;
    const formData = this.cajaForm.value;

    if (this.isEditMode && this.cajaId) {
      this.pettyCashService.updateCaja(this.cajaId, formData).subscribe({
        next: () => {
          this.router.navigate(['/administracion/petty-cash']);
        },
        error: () => {
          this.loading = false;
        },
      });
    } else {
      this.pettyCashService.createCaja(formData).subscribe({
        next: () => {
          this.router.navigate(['/administracion/petty-cash']);
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/administracion/petty-cash']);
  }

  hasError(field: string): boolean {
    const control = this.cajaForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
