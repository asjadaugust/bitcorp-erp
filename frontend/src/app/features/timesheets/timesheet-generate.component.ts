import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TimesheetService } from '../../core/services/timesheet.service';
import { OperatorService } from '../../core/services/operator.service';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-timesheet-generate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="page-header">
        <h1>📊 Generar Planilla de Tiempo</h1>
        <button class="btn btn-secondary" (click)="goBack()">← Volver</button>
      </div>

      <div class="form-card">
        <form #timesheetForm="ngForm" (ngSubmit)="generateTimesheet()">
          <!-- Operator Selection -->
          <div class="form-group">
            <label for="operator">Operador *</label>
            <select
              id="operator"
              name="operator"
              [(ngModel)]="formData.operatorId"
              required
              class="form-control"
            >
              <option value="">Seleccionar operador...</option>
              <option *ngFor="let op of operators" [value]="op.id">
                {{ op.C05000_Nombre }} {{ op.C05000_Apellido }}
              </option>
            </select>
          </div>

          <!-- Project Selection (Optional) -->
          <div class="form-group">
            <label for="project">Proyecto (Opcional)</label>
            <select
              id="project"
              name="project"
              [(ngModel)]="formData.projectId"
              class="form-control"
            >
              <option value="">Todos los proyectos</option>
              <option *ngFor="let proj of projects" [value]="proj.id">
                {{ proj.G00007_Codigo }} - {{ proj.G00007_Nombre }}
              </option>
            </select>
          </div>

          <!-- Date Range -->
          <div class="form-row">
            <div class="form-group">
              <label for="periodStart">Fecha Inicio *</label>
              <input
                type="date"
                id="periodStart"
                name="periodStart"
                [(ngModel)]="formData.periodStart"
                required
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="periodEnd">Fecha Fin *</label>
              <input
                type="date"
                id="periodEnd"
                name="periodEnd"
                [(ngModel)]="formData.periodEnd"
                required
                class="form-control"
              />
            </div>
          </div>

          <!-- Info Box -->
          <div class="info-box">
            <div class="info-icon">ℹ️</div>
            <div class="info-content">
              <strong>¿Cómo funciona?</strong>
              <p>
                La planilla se generará automáticamente desde los reportes diarios del operador en
                el período seleccionado. Se calcularán las horas totales trabajadas y los días
                laborados.
              </p>
            </div>
          </div>

          <!-- Success Message -->
          <div *ngIf="successMessage" class="success-message">✅ {{ successMessage }}</div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="error-message">❌ {{ errorMessage }}</div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="goBack()">Cancelar</button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="!timesheetForm.valid || loading"
            >
              <span *ngIf="!loading">Generar Planilla</span>
              <span *ngIf="loading">⏳ Generando...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .page-header h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a202c;
        margin: 0;
      }

      .form-card {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
      }

      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s;
      }

      .form-control:focus {
        outline: none;
        border-color: #3182ce;
        box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .info-box {
        display: flex;
        gap: 1rem;
        background: #ebf8ff;
        border: 1px solid #90cdf4;
        border-radius: 8px;
        padding: 1rem;
        margin: 1.5rem 0;
      }

      .info-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .info-content strong {
        display: block;
        color: #2c5282;
        margin-bottom: 0.25rem;
      }

      .info-content p {
        margin: 0;
        color: #2d3748;
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .success-message {
        background: #c6f6d5;
        color: #22543d;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-weight: 500;
      }

      .error-message {
        background: #fed7d7;
        color: #742a2a;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-weight: 500;
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #e2e8f0;
      }

      .btn {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-primary {
        background: #3182ce;
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: #2c5282;
        transform: translateY(-2px);
      }

      .btn-secondary {
        background: #e2e8f0;
        color: #2d3748;
      }

      .btn-secondary:hover {
        background: #cbd5e0;
      }

      @media (max-width: 640px) {
        .form-row {
          grid-template-columns: 1fr;
        }

        .form-actions {
          flex-direction: column-reverse;
        }

        .btn {
          width: 100%;
        }
      }
    `,
  ],
})
export class TimesheetGenerateComponent implements OnInit {
  private timesheetService = inject(TimesheetService);
  private operatorService = inject(OperatorService);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  formData = {
    operatorId: null as number | null,
    projectId: '',
    periodStart: '',
    periodEnd: '',
  };

  operators: any[] = [];
  projects: any[] = [];
  loading = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.loadOperators();
    this.loadProjects();
    this.setDefaultDates();
  }

  setDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.formData.periodStart = firstDay.toISOString().split('T')[0];
    this.formData.periodEnd = lastDay.toISOString().split('T')[0];
  }

  loadOperators() {
    this.operatorService.getAll().subscribe({
      next: (response: any) => {
        this.operators = response || [];
      },
      error: (err: any) => {
        console.error('Error loading operators:', err);
        this.operators = [];
      },
    });
  }

  loadProjects() {
    this.projectService.getAll().subscribe({
      next: (response: any) => {
        this.projects = response || [];
      },
      error: (err: any) => {
        console.error('Error loading projects:', err);
        this.projects = [];
      },
    });
  }

  generateTimesheet() {
    if (!this.formData.operatorId) return;

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const dto = {
      operatorId: this.formData.operatorId,
      projectId: this.formData.projectId || undefined,
      periodStart: this.formData.periodStart,
      periodEnd: this.formData.periodEnd,
    };

    this.timesheetService.generateTimesheet(dto).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = `Planilla generada exitosamente: ${response.timesheetCode}`;

        setTimeout(() => {
          this.router.navigate(['/timesheets', response.id]);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Error al generar la planilla';
        console.error('Error generating timesheet:', err);
      },
    });
  }

  goBack() {
    this.router.navigate(['/timesheets']);
  }
}
