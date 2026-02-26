import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TimesheetService } from '../../core/services/timesheet.service';
import { OperatorService } from '../../core/services/operator.service';
import { ProjectService } from '../../core/services/project.service';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../shared/components/form-section/form-section.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-timesheet-generate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownComponent,
    FormContainerComponent,
    FormSectionComponent,
  ],
  template: `
    <app-form-container
      title="Generar Planilla de Tiempo"
      icon="fa-chart-bar"
      submitLabel="Generar Planilla"
      submitIcon="fa-wand-magic-sparkles"
      [loading]="loading"
      loadingText="Generando..."
      [disableSubmit]="!isFormValid()"
      backUrl="/operaciones/timesheets"
      (submitted)="generateTimesheet()"
      (cancelled)="goBack()"
    >
      <app-form-section title="Datos de la Planilla" icon="fa-clipboard-user" [columns]="1">
        <div class="form-group">
          <label for="operator">Operador *</label>
          <app-dropdown
            name="operator"
            [(ngModel)]="formData.trabajadorId"
            [options]="operatorOptions"
            [placeholder]="'Seleccionar operador...'"
            [searchable]="true"
            [required]="true"
          ></app-dropdown>
        </div>

        <div class="form-group">
          <label for="project">Proyecto (Opcional)</label>
          <app-dropdown
            name="project"
            [(ngModel)]="formData.projectId"
            [options]="projectOptions"
            [placeholder]="'Seleccionar proyecto'"
            [searchable]="true"
          ></app-dropdown>
        </div>

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
      </app-form-section>

      <!-- Info Box -->
      <div class="info-box">
        <div class="info-icon">
          <i class="fa-solid fa-circle-info"></i>
        </div>
        <div class="info-content">
          <strong>¿Cómo funciona?</strong>
          <p>
            La planilla se generará automáticamente desde los reportes diarios del operador en el
            período seleccionado. Se calcularán las horas totales trabajadas y los días laborados.
          </p>
        </div>
      </div>

      <!-- Status Messages -->
      <div *ngIf="successMessage" class="success-message">
        <i class="fa-solid fa-check-circle"></i> {{ successMessage }}
      </div>
      <div *ngIf="errorMessage" class="error-message">
        <i class="fa-solid fa-circle-exclamation"></i> {{ errorMessage }}
      </div>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout' as *;

      .info-box {
        display: flex;
        gap: var(--s-12);
        background: var(--primary-50);
        border: 1px solid var(--primary-200);
        border-radius: var(--s-8);
        padding: var(--s-16);
        margin: var(--s-16) 0;
      }

      .info-icon {
        font-size: 20px;
        color: var(--primary-500);
        flex-shrink: 0;
      }

      .info-content strong {
        display: block;
        color: var(--primary-900);
        margin-bottom: var(--s-4);
      }

      .info-content p {
        margin: 0;
        color: var(--grey-700);
        font-size: 14px;
        line-height: 1.5;
      }

      .success-message {
        background: var(--semantic-green-100);
        color: var(--semantic-green-900);
        padding: var(--s-16);
        border-radius: var(--s-8);
        margin-top: var(--s-16);
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .error-message {
        background: var(--semantic-red-100);
        color: var(--semantic-red-900);
        padding: var(--s-16);
        border-radius: var(--s-8);
        margin-top: var(--s-16);
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }
    `,
  ],
})
export class TimesheetGenerateComponent implements OnInit {
  private timesheetService = inject(TimesheetService);
  private operatorService = inject(OperatorService);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  formData = {
    trabajadorId: null as number | null,
    projectId: '',
    periodo: '',
    totalDiasTrabajados: 0,
    totalHoras: 0,
    observaciones: '',
  };

  operators: Record<string, unknown>[] = [];
  projects: Record<string, unknown>[] = [];
  loading = false;
  successMessage = '';
  errorMessage = '';

  get operatorOptions(): DropdownOption[] {
    return this.operators.map((op) => ({
      label: (op['nombre_completo'] as string) || `${op['nombres']} ${op['apellido_paterno']}`,
      value: op['id'],
    }));
  }

  get projectOptions(): DropdownOption[] {
    const options = this.projects.map((proj) => ({
      label: `${proj['G00007_Codigo']} - ${proj['G00007_Nombre']}`,
      value: proj['id'],
    }));
    return [{ label: 'Todos los proyectos', value: '' }, ...options];
  }

  ngOnInit() {
    this.loadOperators();
    this.loadProjects();
    this.setDefaultDates();
  }

  isFormValid(): boolean {
    return !!this.formData.trabajadorId && !!this.formData.periodo;
  }

  setDefaultDates() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    this.formData.periodo = `${year}-${month}`;
  }

  loadOperators() {
    this.operatorService.getAll().subscribe({
      next: (response: unknown) => {
        this.operators = (response as Record<string, unknown>[]) || [];
      },
      error: (error) => console.error('Error loading operators:', error),
    });
  }

  loadProjects() {
    this.projectService.getAll().subscribe({
      next: (response: unknown) => {
        this.projects = (response as Record<string, unknown>[]) || [];
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
      total_dias_trabajados: this.formData.totalDiasTrabajados
        ? parseInt(this.formData.totalDiasTrabajados.toString())
        : 0,
      total_horas: this.formData.totalHoras ? parseFloat(this.formData.totalHoras.toString()) : 0,
      observaciones: this.formData.observaciones,
    };

    this.timesheetService.generateTimesheet(dto).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate(['/operaciones/timesheets', res.id]);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error generating timesheet:', err);

        if (err.error) {
          if (typeof err.error === 'string') {
            this.errorMessage = err.error;
          } else if (typeof err.error === 'object') {
            if (err.error.message) {
              this.errorMessage = err.error.message;
            } else if (err.error.error) {
              if (typeof err.error.error === 'string') {
                this.errorMessage = err.error.error;
              } else if (typeof err.error.error === 'object') {
                if (err.error.error.message) {
                  this.errorMessage = err.error.error.message;
                  if (err.error.error.details && Array.isArray(err.error.error.details)) {
                    const details = err.error.error.details
                      .map(
                        (d: Record<string, unknown>) =>
                          `${d['field']}: ${(d['errors'] as string[]).join(', ')}`
                      )
                      .join('; ');
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
