import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { SstService } from '../../services/sst.service';

@Component({
  selector: 'app-incident-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fa-solid" [class.fa-plus]="!isEditMode" [class.fa-pen]="isEditMode"></i>
          </div>
          <div class="title-group">
            <h1>{{ isEditMode ? 'Editar Incidente' : 'Reportar Incidente' }}</h1>
            <p class="subtitle">
              {{
                isEditMode
                  ? 'Actualizar información del incidente'
                  : 'Registrar un nuevo incidente o accidente en el sistema'
              }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="onCancel()">Cancelar</button>
          <button class="btn btn-primary" (click)="onSubmit()" [disabled]="form.invalid || loading">
            <i class="fa-solid fa-save"></i>
            {{ isEditMode ? 'Guardar Cambios' : 'Reportar Incidente' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="card form-card">
        <form [formGroup]="form" class="form-grid">
          <!-- Section 1: Incident Details -->
          <div class="form-section full-width">
            <h3>Información del Incidente</h3>
            <div class="section-grid">
              <div class="form-group">
                <label for="date">Fecha *</label>
                <input id="date" type="date" formControlName="date" class="form-control" />
                <div class="error-msg" *ngIf="hasError('date')">Fecha es requerida</div>
              </div>

              <div class="form-group">
                <label for="time">Hora *</label>
                <input id="time" type="time" formControlName="time" class="form-control" />
                <div class="error-msg" *ngIf="hasError('time')">Hora es requerida</div>
              </div>

              <div class="form-group">
                <label for="type">Tipo *</label>
                <select id="type" formControlName="type" class="form-select">
                  <option value="">Seleccione...</option>
                  <option value="Accidente">Accidente</option>
                  <option value="Incidente">Incidente</option>
                  <option value="Casi Accidente">Casi Accidente</option>
                  <option value="Condición Insegura">Condición Insegura</option>
                </select>
                <div class="error-msg" *ngIf="hasError('type')">Tipo es requerido</div>
              </div>

              <div class="form-group">
                <label for="severity">Severidad *</label>
                <select id="severity" formControlName="severity" class="form-select">
                  <option value="Leve">Leve</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Grave">Grave</option>
                  <option value="Fatal">Fatal</option>
                </select>
                <div class="error-msg" *ngIf="hasError('severity')">Severidad es requerida</div>
              </div>

              <div class="form-group full-width">
                <label for="location">Ubicación *</label>
                <input
                  id="location"
                  type="text"
                  formControlName="location"
                  class="form-control"
                  placeholder="Lugar exacto del incidente"
                />
                <div class="error-msg" *ngIf="hasError('location')">Ubicación es requerida</div>
              </div>

              <div class="form-group full-width">
                <label for="description">Descripción *</label>
                <textarea
                  id="description"
                  formControlName="description"
                  class="form-control"
                  rows="4"
                  placeholder="Describa detalladamente qué sucedió..."
                ></textarea>
                <div class="error-msg" *ngIf="hasError('description')">
                  Descripción es requerida
                </div>
              </div>

              <div class="form-group full-width">
                <label for="involvedPersons">Personas Involucradas</label>
                <textarea
                  id="involvedPersons"
                  formControlName="involvedPersons"
                  class="form-control"
                  rows="2"
                  placeholder="Nombres de las personas involucradas (opcional)"
                ></textarea>
              </div>

              <div class="form-group full-width">
                <label for="actions">Acciones Correctivas</label>
                <textarea
                  id="actions"
                  formControlName="actions"
                  class="form-control"
                  rows="3"
                  placeholder="Acciones tomadas o sugeridas (opcional)"
                ></textarea>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .form-container {
        max-width: 1000px;
        margin: 0 auto;
        padding-bottom: 2rem;
      }

      /* Header */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }
      .header-content {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .icon-wrapper {
        width: 48px;
        height: 48px;
        background: var(--primary-100);
        color: var(--primary-800);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }
      .title-group h1 {
        margin: 0;
        font-size: 24px;
        color: var(--grey-900);
      }
      .subtitle {
        margin: 0;
        color: var(--grey-500);
        font-size: 14px;
      }
      .header-actions {
        display: flex;
        gap: 1rem;
      }

      /* Form Card */
      .form-card {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .form-grid {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .form-section h3 {
        font-size: 16px;
        color: var(--primary-800);
        border-bottom: 1px solid var(--grey-200);
        padding-bottom: 0.5rem;
        margin-bottom: 1.5rem;
        font-weight: 600;
      }

      .section-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
      }

      .full-width {
        grid-column: 1 / -1;
      }

      /* Form Controls */
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      label {
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-700);
      }

      .form-control,
      .form-select {
        padding: 0.625rem;
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s;
      }

      .form-control:focus,
      .form-select:focus {
        border-color: var(--primary-500);
        outline: none;
        box-shadow: 0 0 0 3px var(--primary-100);
      }

      .error-msg {
        color: var(--semantic-red-600);
        font-size: 12px;
      }

      /* Buttons */
      .btn {
        padding: 0.625rem 1.25rem;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
      }

      .btn-primary {
        background: var(--primary-500);
        color: white;
      }
      .btn-primary:hover {
        background: var(--primary-800);
      }
      .btn-primary:disabled {
        background: var(--grey-300);
        cursor: not-allowed;
      }

      .btn-secondary {
        background: white;
        border: 1px solid var(--grey-300);
        color: var(--grey-700);
      }
      .btn-secondary:hover {
        background: var(--grey-50);
      }

      @media (max-width: 768px) {
        .section-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class IncidentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sstService = inject(SstService);

  form!: FormGroup;
  loading = false;
  isEditMode = false;
  incidentId?: string;

  ngOnInit() {
    this.incidentId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.incidentId;
    this.initForm();
    if (this.isEditMode) this.loadIncident();
  }

  initForm() {
    this.form = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      type: ['', Validators.required],
      severity: ['Leve', Validators.required],
      location: ['', Validators.required],
      description: ['', Validators.required],
      involvedPersons: [''],
      actions: [''],
    });
  }

  loadIncident() {
    if (!this.incidentId) return;
    this.loading = true;
    this.sstService.getIncident(this.incidentId).subscribe({
      next: (incident) => {
        this.form.patchValue(incident);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        console.error('Error loading incident');
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const req =
      this.isEditMode && this.incidentId
        ? this.sstService.updateIncident(this.incidentId, this.form.value)
        : this.sstService.createIncident(this.form.value);

    req.subscribe({
      next: () => {
        this.router.navigate(['/sst']);
      },
      error: () => {
        this.loading = false;
        console.error('Error saving incident');
      },
    });
  }

  onCancel() {
    this.router.navigate(['/sst']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
