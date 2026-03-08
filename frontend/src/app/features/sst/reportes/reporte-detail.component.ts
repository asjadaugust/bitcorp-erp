import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  InspeccionSsomaService,
  ReporteActoCondicionDetalle,
} from '../inspecciones/inspeccion-ssoma.service';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import { ActionsContainerComponent } from '../../../shared/components/actions-container/actions-container.component';
import { AeroButtonComponent, AeroBadgeComponent } from '../../../core/design-system';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-reporte-detail',
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
      title="Detalle Reporte A/C"
      icon="fa-file-lines"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      backUrl="/sst/reportes-acto"
    >
      <app-actions-container actions>
        <aero-button variant="secondary" iconLeft="fa-pen" (clicked)="editReporte()">
          Editar
        </aero-button>
        <aero-button
          variant="secondary"
          iconLeft="fa-trash"
          [disabled]="deleting"
          (clicked)="deleteReporte()"
        >
          {{ deleting ? 'Eliminando...' : 'Eliminar' }}
        </aero-button>
      </app-actions-container>

      @if (reporte) {
        <app-page-card title="Datos del Reportante">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">DNI</span>
              <p class="value">{{ reporte.reportado_por_dni || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Nombre</span>
              <p class="value">{{ reporte.reportado_por_nombre || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Cargo</span>
              <p class="value">{{ reporte.cargo || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Empresa</span>
              <p class="value">{{ reporte.empresa_reportante || '-' }}</p>
            </div>
          </div>
        </app-page-card>

        <app-page-card title="Datos del Evento">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Fecha Evento</span>
              <p class="value">{{ reporte.fecha_evento | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Lugar</span>
              <p class="value">{{ reporte.lugar || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Empresa</span>
              <p class="value">{{ reporte.empresa || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Sistema de Gestión</span>
              <p class="value">{{ reporte.sistema_gestion || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Tipo de Reporte</span>
              <p>
                <aero-badge [variant]="getTipoReporteVariant(reporte.tipo_reporte)">
                  {{ reporte.tipo_reporte || '-' }}
                </aero-badge>
              </p>
            </div>
            <div class="info-item">
              <span class="label">Acto/Condición</span>
              <p class="value">{{ reporte.acto_condicion || '-' }}</p>
            </div>
          </div>
        </app-page-card>

        <app-page-card title="Daños">
          <div class="info-grid">
            <div class="info-item full-width">
              <span class="label">Daño A</span>
              <p class="value">{{ reporte.dano_a || '-' }}</p>
            </div>
            <div class="info-item full-width">
              <span class="label">Descripción</span>
              <p class="value pre-wrap">{{ reporte.descripcion || '-' }}</p>
            </div>
            <div class="info-item full-width">
              <span class="label">Cómo actué</span>
              <p class="value pre-wrap">{{ reporte.como_actue || '-' }}</p>
            </div>
          </div>
        </app-page-card>

        <app-page-card title="Análisis 5 Por Qué">
          <ol class="por-que-list">
            <li class="por-que-item">
              <span class="por-que-label">Por qué 1:</span>
              <span class="por-que-value">{{ reporte.por_que_1 || '-' }}</span>
            </li>
            <li class="por-que-item">
              <span class="por-que-label">Por qué 2:</span>
              <span class="por-que-value">{{ reporte.por_que_2 || '-' }}</span>
            </li>
            <li class="por-que-item">
              <span class="por-que-label">Por qué 3:</span>
              <span class="por-que-value">{{ reporte.por_que_3 || '-' }}</span>
            </li>
            <li class="por-que-item">
              <span class="por-que-label">Por qué 4:</span>
              <span class="por-que-value">{{ reporte.por_que_4 || '-' }}</span>
            </li>
            <li class="por-que-item">
              <span class="por-que-label">Por qué 5:</span>
              <span class="por-que-value">{{ reporte.por_que_5 || '-' }}</span>
            </li>
          </ol>
        </app-page-card>

        <app-page-card title="Acción Correctiva">
          <div class="info-grid">
            <div class="info-item full-width">
              <span class="label">Acción Correctiva</span>
              <p class="value pre-wrap">{{ reporte.accion_correctiva || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Estado</span>
              <p>
                <aero-badge [variant]="getEstadoVariant(reporte.estado)">
                  {{ reporte.estado || '-' }}
                </aero-badge>
              </p>
            </div>
            <div class="info-item">
              <span class="label">Registrado Por</span>
              <p class="value">{{ reporte.registrado_por || '-' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Fecha Registro</span>
              <p class="value">{{ reporte.fecha_registro | date: 'dd/MM/yyyy' }}</p>
            </div>
          </div>
        </app-page-card>
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

      .info-item.full-width {
        grid-column: 1 / -1;
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

      .pre-wrap {
        white-space: pre-wrap;
      }

      .por-que-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
      }

      .por-que-item {
        display: flex;
        gap: var(--s-8);
        padding: var(--s-8) 0;
        border-bottom: 1px solid var(--grey-100);
      }

      .por-que-item:last-child {
        border-bottom: none;
      }

      .por-que-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--grey-700);
        min-width: 100px;
      }

      .por-que-value {
        font-size: 14px;
        color: var(--grey-900);
      }
    `,
  ],
})
export class ReporteDetailComponent implements OnInit {
  private readonly service = inject(InspeccionSsomaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmService = inject(ConfirmService);

  reporte: ReporteActoCondicionDetalle | null = null;
  loading = true;
  deleting = false;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/dashboard' },
    { label: 'SST', url: '/sst' },
    { label: 'Reportes A/C', url: '/sst/reportes-acto' },
    { label: 'Detalle' },
  ];

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.loadReporte(id);
  }

  loadReporte(id: number): void {
    this.loading = true;
    this.service.getReporte(id).subscribe({
      next: (data) => {
        this.reporte = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/sst/reportes-acto']);
      },
    });
  }

  getTipoReporteVariant(tipo: string | null): 'warning' | 'error' | 'neutral' {
    switch (tipo) {
      case 'ACTO INSEGURO':
        return 'warning';
      case 'CONDICION INSEGURA':
        return 'error';
      default:
        return 'neutral';
    }
  }

  getEstadoVariant(estado: string | null): 'warning' | 'success' | 'neutral' {
    switch (estado) {
      case 'ABIERTO':
        return 'warning';
      case 'CERRADO':
        return 'success';
      default:
        return 'neutral';
    }
  }

  editReporte(): void {
    if (this.reporte) {
      this.router.navigate(['/sst/reportes-acto', this.reporte.id, 'edit']);
    }
  }

  deleteReporte(): void {
    if (!this.reporte) return;

    this.confirmService.confirmDelete('este reporte').subscribe((confirmed) => {
      if (confirmed && this.reporte) {
        this.deleting = true;
        this.service.deleteReporte(this.reporte.id).subscribe({
          next: () => {
            this.router.navigate(['/sst/reportes-acto']);
          },
          error: () => {
            this.deleting = false;
          },
        });
      }
    });
  }
}
