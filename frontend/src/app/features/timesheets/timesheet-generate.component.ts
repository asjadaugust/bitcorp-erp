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
        <button class="btn btn-secondary" (click)="goBack()">
          <i class="fa-solid fa-arrow-left"></i> Volver a Planillas
        </button>
      </div>

      <div class="form-card">
        <form #timesheetForm="ngForm" (ngSubmit)="generateTimesheet()">
          <!-- Operator Selection -->
          <div class="form-group">
            <label for="operator">Operador *</label>
            <select
              id="operator"
              name="operator"
              [(ngModel)]="formData.trabajadorId"
              required
              class="form-control"
            >
              <option value="">Seleccionar operador...</option>
              <option *ngFor="let op of operators" [value]="op.id">
                {{ op.nombre_completo || op.nombres + ' ' + op.apellido_paterno }}
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
          <div class="form-group">
            <label for="periodo">Período (Mes) *</label>
            <input
              type="month"
              id="periodo"
              name="periodo"
              [(ngModel)]="formData.periodo"
              required
              class="form-control"
            />
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
        padding: var(--s-24);
        max-width: 800px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-24);
      }

      .page-header h1 {
        font-size: 24px;
        font-weight: 700;
        color: var(--grey-900);
        margin: 0;
      }

      .form-card {
        background: var(--neutral-0);
        border-radius: var(--s-12);
        padding: var(--s-24);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .form-group {
        margin-bottom: var(--s-16);
      }

      .form-group label {
        display: block;
        font-weight: 600;
        color: var(--grey-800);
        margin-bottom: var(--s-8);
        font-size: 14px;
      }

      .form-control {
        width: 100%;
        padding: var(--s-12);
        border: 1px solid var(--grey-300);
        border-radius: var(--s-8);
        font-size: 14px;
        transition: border-color 0.2s;
      }

      .form-control:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px var(--primary-100);
      }

      .info-box {
        display: flex;
        gap: var(--s-12);
        background: var(--info-50);
        border: 1px solid var(--info-200);
        border-radius: var(--s-8);
        padding: var(--s-16);
        margin: var(--s-24) 0;
      }

      .info-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      .info-content strong {
        display: block;
        color: var(--info-800);
        margin-bottom: var(--s-4);
      }

      .info-content p {
        margin: 0;
        color: var(--grey-700);
        font-size: 14px;
        line-height: 1.5;
      }

      .success-message {
        background: var(--success-100);
        color: var(--success-800);
        padding: var(--s-16);
        border-radius: var(--s-8);
        margin-bottom: var(--s-16);
        font-weight: 500;
      }

      .error-message {
        background: var(--error-100);
        color: var(--error-800);
        padding: var(--s-16);
        border-radius: var(--s-8);
        margin-bottom: var(--s-16);
        font-weight: 500;
      }

      .form-actions {
        display: flex;
        gap: var(--s-16);
        justify-content: flex-end;
        margin-top: var(--s-32);
        padding-top: var(--s-24);
        border-top: 1px solid var(--grey-200);
      }

      .btn {
        padding: var(--s-12) var(--s-24);
        border-radius: var(--s-8);
        font-weight: 600;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-primary {
        background: var(--primary-500);
        color: var(--neutral-0);
      }

      .btn-primary:hover:not(:disabled) {
        background: var(--primary-700);
        transform: translateY(-2px);
      }

      .btn-secondary {
        background: var(--grey-200);
        color: var(--grey-800);
      }

      .btn-secondary:hover {
        background: var(--grey-300);
      }
      
      @media (max-width: 640px) {
        .form-actions {
          flex-direction: column-reverse;
        }

        .btn {
          width: 100%;
          justify-content: center;
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
    trabajadorId: null as number | null,
    projectId: '',
    periodo: '',
    totalDiasTrabajados: 0,
    totalHoras: 0,
    observaciones: ''
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
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    this.formData.periodo = `${year}-${month}`;
  }

  loadOperators() {
    this.operatorService.getAll().subscribe({
      next: (response: any) => {
        this.operators = response || [];
      },
      error: (error) => console.error('Error loading operators:', error),
    });
  }

  loadProjects() {
    this.projectService.getAll().subscribe({
      next: (response: any) => {
        this.projects = response || [];
      },
      error: (error) => console.error('Error loading projects:', error),
    });
  }

  generateTimesheet() {
    if (!this.formData.trabajadorId || !this.formData.periodo) {
      this.errorMessage = 'Por favor complete todos los campos obligatorios';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const dto = {
      trabajador_id: parseInt(this.formData.trabajadorId.toString()),
      periodo: this.formData.periodo,
      total_dias_trabajados: this.formData.totalDiasTrabajados ? parseInt(this.formData.totalDiasTrabajados.toString()) : 0,
      total_horas: this.formData.totalHoras ? parseFloat(this.formData.totalHoras.toString()) : 0,
      observaciones: this.formData.observaciones
    };

    console.log('Sending DTO:', dto);

    this.timesheetService.generateTimesheet(dto).subscribe({
      next: (res) => {
        this.loading = false;
        // Navigate to detail
        this.router.navigate(['/operaciones/timesheets', res.id]);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error generating timesheet:', err);
        console.log('FULL ERROR OBJECT:', JSON.stringify(err, null, 2));
        
        if (err.error) {
          if (typeof err.error === 'string') {
            this.errorMessage = err.error;
          } else if (typeof err.error === 'object') {
            if (err.error.message) {
              this.errorMessage = err.error.message;
            } else if (err.error.error) {
              // Handle nested error object from validation middleware
              if (typeof err.error.error === 'string') {
                this.errorMessage = err.error.error;
              } else if (typeof err.error.error === 'object') {
                 if (err.error.error.message) {
                   this.errorMessage = err.error.error.message;
                   if (err.error.error.details && Array.isArray(err.error.error.details)) {
                     const details = err.error.error.details.map((d: any) => `${d.field}: ${d.errors.join(', ')}`).join('; ');
                     this.errorMessage += ` (${details})`;
                   }
                 } else {
                   this.errorMessage = JSON.stringify(err.error.error);
                 }
              }
            } else if (Array.isArray(err.error.errors)) {
              this.errorMessage = err.error.errors.join(', ');
            } else {
              this.errorMessage = JSON.stringify(err.error);
            }
          }
        } else {
          this.errorMessage = err.message || 'Error al generar la planilla';
        }
      },
    });
  }

  goBack() {
    this.router.navigate(['/operaciones/timesheets']);
  }
}
