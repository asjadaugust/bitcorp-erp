import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EvaluacionService, EvaluacionProveedorDetalle } from './evaluacion.service';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import { ActionsContainerComponent } from '../../../shared/components/actions-container/actions-container.component';
import { AeroButtonComponent, AeroBadgeComponent } from '../../../core/design-system';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-evaluacion-detail',
  standalone: true,
  imports: [
    CommonModule,
    PageLayoutComponent,
    PageCardComponent,
    ActionsContainerComponent,
    AeroButtonComponent,
    AeroBadgeComponent,
  ],
  template: `
    <app-page-layout
      title="Detalle Evaluación"
      icon="fa-clipboard-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <aero-button variant="secondary" iconLeft="fa-pen" (clicked)="editEvaluacion()">
          Editar
        </aero-button>
        <aero-button
          variant="secondary"
          iconLeft="fa-trash"
          [disabled]="deleting"
          (clicked)="deleteEvaluacion()"
        >
          {{ deleting ? 'Eliminando...' : 'Eliminar' }}
        </aero-button>
        <aero-button variant="tertiary" iconLeft="fa-arrow-left" (clicked)="goBack()">
          Volver a Lista
        </aero-button>
      </app-actions-container>

      @if (evaluacion) {
        <app-page-card title="Información del Proveedor">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">RUC</span>
              <p class="value">{{ evaluacion.ruc || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Razón Social</span>
              <p class="value">{{ evaluacion.razon_social || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Fecha Evaluación</span>
              <p class="value">
                {{ evaluacion.fecha_evaluacion | date: 'dd/MM/yyyy' }}
              </p>
            </div>
            <div class="info-item">
              <span class="label">Evaluado Por</span>
              <p class="value">{{ evaluacion.evaluado_por || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Puntaje</span>
              <p class="value highlight">{{ evaluacion.puntaje ?? '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Resultado</span>
              <p>
                <aero-badge [variant]="getResultadoVariant(evaluacion.resultado)">
                  {{ evaluacion.resultado || '-' }}
                </aero-badge>
              </p>
            </div>
            <div class="info-item">
              <span class="label">Acción</span>
              <p class="value">{{ evaluacion.accion || '-' }}</p>
            </div>
          </div>
        </app-page-card>

        <app-page-card title="Criterios de Evaluación">
          <div class="criteria-grid">
            <div class="criteria-header">
              <span>Aspecto</span>
              <span>Valor Seleccionado</span>
            </div>
            <div class="criteria-row">
              <span class="criteria-label">Precios</span>
              <span class="criteria-value">{{ evaluacion.precio || '-' }}</span>
            </div>
            <div class="criteria-row">
              <span class="criteria-label">Plazo de Pago</span>
              <span class="criteria-value">{{ evaluacion.plazo_pago || '-' }}</span>
            </div>
            <div class="criteria-row">
              <span class="criteria-label">Calidad</span>
              <span class="criteria-value">{{ evaluacion.calidad || '-' }}</span>
            </div>
            <div class="criteria-row">
              <span class="criteria-label">Plazo de Cumplimiento</span>
              <span class="criteria-value">{{ evaluacion.plazo_cumplimiento || '-' }}</span>
            </div>
            <div class="criteria-row">
              <span class="criteria-label">Ubicación</span>
              <span class="criteria-value">{{ evaluacion.ubicacion || '-' }}</span>
            </div>
            <div class="criteria-row">
              <span class="criteria-label">Atención al Cliente</span>
              <span class="criteria-value">{{ evaluacion.atencion_cliente || '-' }}</span>
            </div>
            <div class="criteria-row">
              <span class="criteria-label">SGC</span>
              <span class="criteria-value">{{ evaluacion.sgc || '-' }}</span>
            </div>
            <div class="criteria-row">
              <span class="criteria-label">SGSST</span>
              <span class="criteria-value">{{ evaluacion.sgsst || '-' }}</span>
            </div>
            <div class="criteria-row">
              <span class="criteria-label">SGA</span>
              <span class="criteria-value">{{ evaluacion.sga || '-' }}</span>
            </div>
          </div>
        </app-page-card>

        @if (evaluacion.observacion) {
          <app-page-card title="Observaciones">
            <p class="observacion-text">{{ evaluacion.observacion }}</p>
          </app-page-card>
        }
      }
    </app-page-layout>
  `,
  styles: [
    `
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--s-16);
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .label {
        font-size: 12px;
        font-weight: 500;
        color: var(--grey-500);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .value {
        font-size: 14px;
        font-weight: 500;
        color: var(--grey-900);
        margin: 0;
      }

      .highlight {
        color: var(--primary-900);
        font-weight: 700;
        font-size: 20px;
      }

      .criteria-grid {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .criteria-header {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--s-16);
        padding: var(--s-8) var(--s-16);
        background: var(--grey-100);
        border-radius: var(--radius-md) var(--radius-md) 0 0;
        font-size: 12px;
        font-weight: 600;
        color: var(--grey-700);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .criteria-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--s-16);
        padding: var(--s-8) var(--s-16);
        border-bottom: 1px solid var(--grey-100);
        font-size: 14px;
      }

      .criteria-row:last-child {
        border-bottom: none;
      }

      .criteria-label {
        font-weight: 500;
        color: var(--grey-700);
      }

      .criteria-value {
        color: var(--grey-900);
      }

      .observacion-text {
        margin: 0;
        font-size: 14px;
        color: var(--grey-700);
        line-height: 1.6;
        white-space: pre-wrap;
      }
    `,
  ],
})
export class EvaluacionDetailComponent implements OnInit {
  private readonly evaluacionService = inject(EvaluacionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmService = inject(ConfirmService);

  evaluacion: EvaluacionProveedorDetalle | null = null;
  loading = true;
  deleting = false;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Proveedores', url: '/providers' },
    { label: 'Evaluaciones', url: '/providers/evaluaciones' },
    { label: 'Detalle' },
  ];

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.loadEvaluacion(id);
  }

  loadEvaluacion(id: number): void {
    this.loading = true;
    this.evaluacionService.getEvaluacion(id).subscribe({
      next: (ev) => {
        this.evaluacion = ev;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/providers/evaluaciones']);
      },
    });
  }

  getResultadoVariant(
    resultado: string | null
  ): 'error' | 'warning' | 'info' | 'success' | 'neutral' {
    switch (resultado) {
      case 'Pesimo':
        return 'error';
      case 'Regular':
        return 'warning';
      case 'Bueno':
        return 'info';
      case 'Muy Bueno':
      case 'Excelente':
        return 'success';
      default:
        return 'neutral';
    }
  }

  editEvaluacion(): void {
    if (this.evaluacion) {
      this.router.navigate(['/providers/evaluaciones', this.evaluacion.id, 'edit']);
    }
  }

  deleteEvaluacion(): void {
    if (!this.evaluacion) return;

    this.confirmService
      .confirmDelete(`la evaluaci\u00f3n de ${this.evaluacion.razon_social}`)
      .subscribe((confirmed) => {
        if (confirmed && this.evaluacion) {
          this.deleting = true;
          this.evaluacionService.deleteEvaluacion(this.evaluacion.id).subscribe({
            next: () => {
              this.router.navigate(['/providers/evaluaciones']);
            },
            error: () => {
              this.deleting = false;
            },
          });
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/providers/evaluaciones']);
  }
}
