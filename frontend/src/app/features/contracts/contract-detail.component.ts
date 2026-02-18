import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContractService } from '../../core/services/contract.service';
import { Contract } from '../../core/models/contract.model';
import { ValuationService } from '../../core/services/valuation.service';
import { Valuation } from '../../core/models/valuation.model';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ContractAddendumDialogComponent } from './components/contract-addendum-dialog/contract-addendum-dialog.component';

import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule, AeroTableComponent],
  template: `
    <div class="detail-container">
      <div class="container">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando detalles del contrato...</p>
        </div>

        <div *ngIf="!loading && contract" class="detail-grid">
          <div class="detail-main card">
            <div class="detail-header">
              <div>
                <h1>Contrato {{ contract.numero_contrato }}</h1>
                <p class="text-subtitle">
                  {{ contract.proveedor_razon_social || 'Proveedor no especificado' }}
                </p>
              </div>
              <div class="detail-status">
                <span
                  class="status-badge"
                  [class.status-ACTIVO]="contract.estado === 'ACTIVO'"
                  [class.status-PENDIENTE]="
                    contract.estado === 'PENDIENTE' || contract.estado === 'BORRADOR'
                  "
                  [class.status-APROBADO]="contract.estado === 'ACTIVO'"
                  [class.status-CANCELADO]="
                    contract.estado === 'FINALIZADO' || contract.estado === 'RESCINDIDO'
                  "
                  [class.status-VENCIDO]="contract.estado === 'VENCIDO'"
                >
                  {{ getStatusLabel(contract.estado) }}
                </span>
              </div>
            </div>

            <div class="detail-sections">
              <!-- Termination Alert -->
              <div
                *ngIf="contract.fecha_resolucion"
                class="alert alert-warning"
                style="margin-bottom: var(--s-24)"
              >
                <i class="fa-solid fa-triangle-exclamation"></i>
                <div>
                  <strong>Contrato Rescindido</strong>
                  <p>
                    Este contrato fue rescindido el
                    {{ contract.fecha_resolucion | date: 'dd/MM/yyyy' }}.
                    <span *ngIf="contract.motivo_resolucion">
                      Motivo: {{ contract.motivo_resolucion }}
                    </span>
                  </p>
                </div>
              </div>

              <section class="detail-section">
                <h2>Información General</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Fecha Inicio</label>
                    <p>{{ contract.fecha_inicio | date: 'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Fecha Fin</label>
                    <p>{{ contract.fecha_fin | date: 'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Tarifa</label>
                    <p class="highlight">
                      {{ contract.tarifa | currency: contract.moneda || 'USD' }}
                    </p>
                  </div>
                  <div class="info-item">
                    <label>Tipo</label>
                    <p>{{ contract.tipo || 'Alquiler' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Equipo Asignado</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Codigo Equipo</label>
                    <p>
                      <a
                        [routerLink]="['/equipment', contract.equipo_id]"
                        style="color: var(--primary-500); text-decoration: none; font-weight: 500;"
                      >
                        {{ contract.equipo_codigo || 'N/A' }}
                      </a>
                    </p>
                  </div>
                  <div class="info-item">
                    <label>Marca/Modelo</label>
                    <p>{{ contract.equipo_marca || '-' }} {{ contract.equipo_modelo || '' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Serie</label>
                    <p>{{ contract.equipo_placa || '-' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Ubicación</label>
                    <p>{{ contract.plazo_texto || 'No especificada' }}</p>
                  </div>
                </div>
              </section>

              <!-- Historial de Valorizaciones -->
              <section class="detail-section" *ngIf="valuations.length > 0">
                <h2>Historial de Valorizaciones</h2>
                <aero-table
                  [columns]="valuationColumns"
                  [data]="valuations"
                  [loading]="false"
                  [templates]="{
                    numero_valorizacion: valCodeTemplate,
                    total_valorizado: amountTemplate,
                  }"
                  (rowClick)="router.navigate(['/equipment/valuations', $event.id])"
                >
                </aero-table>

                <!-- Custom Column Templates -->
                <ng-template #valCodeTemplate let-row>
                  <a
                    [routerLink]="['/equipment/valuations', row.id]"
                    class="code-badge"
                    style="color: var(--primary-500); text-decoration: none;"
                    (click)="$event.stopPropagation()"
                  >
                    {{ row.numeroValorizacion || '#' + row.id }}
                  </a>
                </ng-template>

                <ng-template #amountTemplate let-row>
                  <span class="font-mono">
                    {{ row.totalValorizado | currency: 'PEN' : 'S/ ' }}
                  </span>
                </ng-template>
              </section>

              <!-- Annex A -->
              <section class="detail-section" *ngIf="annexA.length > 0">
                <h2>ANEXO A — Inclusiones de Tarifa</h2>
                <aero-table
                  [columns]="annexColumns"
                  [data]="annexA"
                  [loading]="false"
                  [templates]="{
                    incluido: incluidoTemplate,
                  }"
                >
                </aero-table>

                <ng-template #incluidoTemplate let-row>
                  <span
                    [class]="row.incluido ? 'text-success' : 'text-danger'"
                    style="font-weight: 600;"
                  >
                    {{ row.incluido ? 'Sí' : 'No' }}
                  </span>
                </ng-template>
              </section>

              <!-- Propiedad y Jurisdicción -->
              <section
                class="detail-section"
                *ngIf="contract.documento_acredita || contract.jurisdiccion"
              >
                <h2>Propiedad y Jurisdicción</h2>
                <div class="info-grid">
                  <div class="info-item" *ngIf="contract.documento_acredita">
                    <label>Documento que Acredita</label>
                    <p>{{ contract.documento_acredita }}</p>
                  </div>
                  <div class="info-item" *ngIf="contract.fecha_acreditada">
                    <label>Fecha Acreditada</label>
                    <p>{{ contract.fecha_acreditada | date: 'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="info-item" *ngIf="contract.jurisdiccion">
                    <label>Jurisdicción</label>
                    <p>{{ contract.jurisdiccion }}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div class="detail-sidebar">
            <!-- Acciones Card -->
            <div class="card">
              <h3 class="sidebar-card-title">Acciones</h3>
              <div class="workflow-actions">
                <button class="btn btn-secondary btn-block" (click)="editContract()">
                  <i class="fa-solid fa-pen"></i> Editar
                </button>
                <button class="btn btn-secondary btn-block" (click)="viewAddendums()">
                  <i class="fa-solid fa-file-signature"></i> Ver Adendas
                </button>
                <button class="btn btn-secondary btn-block" (click)="downloadPDF()">
                  <i class="fa-solid fa-file-pdf"></i> Descargar PDF
                </button>
                <button class="btn btn-danger btn-block" (click)="deleteContract()">
                  <i class="fa-solid fa-trash"></i> Eliminar
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-block mt-2"
                  routerLink="/equipment/contracts"
                >
                  <i class="fa-solid fa-arrow-left"></i> Volver a Lista
                </button>
              </div>
            </div>

            <!-- Detalles de Vigencia Card -->
            <div class="card">
              <h3>Detalles de Vigencia</h3>
              <div class="info-column">
                <div class="info-item">
                  <label>Cons. Contrato</label>
                  <p>{{ contract.fecha_contrato | date: 'dd/MM/yyyy' }}</p>
                </div>
                <div class="info-item">
                  <label>Inicio Vigencia</label>
                  <p>{{ contract.fecha_inicio | date: 'dd/MM/yyyy' }}</p>
                </div>
                <div class="info-item">
                  <label>Fin Vigencia</label>
                  <p>{{ contract.fecha_fin | date: 'dd/MM/yyyy' }}</p>
                </div>
                <div class="info-item">
                  <label>Días Restantes</label>
                  <p
                    [class.text-danger]="getDaysRemaining(contract.fecha_fin) <= 30"
                    style="font-weight: 600;"
                  >
                    {{ getDaysRemaining(contract.fecha_fin) }} días
                  </p>
                </div>
              </div>
            </div>

            <!-- Documentos Card -->
            <div class="card" *ngIf="requiredDocs.length > 0">
              <h3>Documentos Requeridos</h3>
              <div class="doc-list" style="display: flex; flex-direction: column; gap: 12px;">
                <div
                  *ngFor="let doc of requiredDocs"
                  style="padding: 8px; border: 1px solid var(--grey-100); border-radius: 6px;"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13px; font-weight: 500;">{{
                      translateDocType(doc.tipo_documento)
                    }}</span>
                    <span
                      class="badge"
                      [class.badge-success]="doc.estado === 'CARGADO'"
                      [class.badge-warning]="doc.estado === 'PENDIENTE'"
                      >{{ doc.estado }}</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Auditoría Card -->
            <div class="card">
              <h3>Auditoría</h3>
              <div class="info-column">
                <div class="info-item">
                  <label>Actualizado:</label>
                  <p style="font-size: 13px;">
                    {{ contract.updated_at | date: 'dd/MM/yyyy HH:mm' }}
                  </p>
                </div>
                <div class="info-item">
                  <label>Creado:</label>
                  <p style="font-size: 13px;">
                    {{ contract.created_at | date: 'dd/MM/yyyy HH:mm' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && !contract" class="empty-state card">
          <i
            class="fa-solid fa-file-circle-xmark"
            style="font-size: 48px; color: var(--grey-300); margin-bottom: 16px;"
          ></i>
          <h3>Contrato no encontrado</h3>
          <p>La información solicitada no está disponible actualmente.</p>
          <button
            class="btn btn-primary"
            routerLink="/equipment/contracts"
            style="margin-top: 16px;"
          >
            Ver Todos los Contratos
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .detail-container {
        min-height: calc(100vh - 64px);
        background-color: var(--grey-50);
        padding: var(--s-32) 0;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 var(--s-24);
      }

      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: var(--s-24);
        align-items: start;

        @media (max-width: 900px) {
          grid-template-columns: 1fr;
        }
      }

      .card {
        background: white;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        padding: var(--s-24);
        border: 1px solid var(--grey-100);
      }

      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--s-32);
        padding-bottom: var(--s-24);
        border-bottom: 1px solid var(--grey-100);

        h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: var(--grey-900);
        }

        .text-subtitle {
          margin: var(--s-4) 0 0;
          font-size: 14px;
          color: var(--grey-500);
        }
      }

      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--s-48);
      }

      .detail-section h2 {
        font-size: 16px;
        font-weight: 600;
        color: var(--grey-900);
        margin: 0 0 var(--s-24);
        text-transform: none;
        letter-spacing: normal;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--s-24);
      }

      .info-item label {
        display: block;
        font-size: 12px;
        color: var(--grey-500);
        margin-bottom: var(--s-4);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      .info-item p {
        margin: 0;
        font-size: 14px;
        color: var(--grey-900);
        font-weight: 500;
      }

      .highlight {
        font-size: 18px !important;
        font-weight: 700 !important;
        color: var(--primary-500) !important;
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        text-transform: uppercase;

        &::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
      }

      .status-ACTIVO,
      .status-APROBADO {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
        &::before {
          background: var(--semantic-green-500);
        }
      }

      .status-PENDIENTE,
      .status-BORRADOR {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
        &::before {
          background: var(--semantic-yellow-500);
        }
      }

      .status-VENCIDO,
      .status-CANCELADO,
      .status-RECHAZADO {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
        &::before {
          background: var(--semantic-red-500);
        }
      }

      .detail-sidebar {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);

        h3 {
          font-size: 14px;
          font-weight: 600;
          color: var(--grey-900);
          margin: 0 0 var(--s-16);
        }
      }

      .sidebar-card-title {
        margin-bottom: var(--s-16) !important;
      }

      .workflow-actions {
        display: flex;
        flex-direction: column;
        gap: var(--s-12);
      }

      .btn {
        display: flex;
        align-items: center;
        .btn-block {
          width: 100%;
        }

        .mt-2 {
          margin-top: 8px;
        }

        .info-column {
          display: flex;
          flex-direction: column;
          gap: var(--s-16);
        }

        .text-danger {
          color: var(--semantic-red-500) !important;
        }

        .text-success {
          color: var(--semantic-green-700) !important;
        }

        .info-column {
          display: flex;
          flex-direction: column;
          gap: var(--s-16);
        }
        display: flex;
        gap: 12px;
        padding: 16px;
        border-radius: 8px;
        font-size: 14px;

        i {
          font-size: 18px;
        }

        strong {
          display: block;
          margin-bottom: 4px;
        }

        p {
          margin: 0;
        }
      }

      .alert-warning {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
        border: 1px solid var(--semantic-yellow-200);
      }

      .badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }

      .badge-success {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }

      .badge-warning {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px;
      }

      .spinner {
        border: 3px solid var(--grey-200);
        border-top: 3px solid var(--primary-500);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px;
        text-align: center;
      }
    `,
  ],
})
export class ContractDetailComponent implements OnInit {
  private contractService = inject(ContractService);
  private valuationService = inject(ValuationService);
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private dialog = inject(MatDialog);

  contract: Contract | null = null;
  valuations: Valuation[] = [];
  loading = true;
  showDeleteModal = false;
  annexA: any[] = [];
  annexB: any[] = [];
  requiredDocs: any[] = [];

  valuationColumns: TableColumn[] = [
    { key: 'numero_valorizacion', label: 'N° Valorización', type: 'template' },
    { key: 'periodo', label: 'Periodo', type: 'text' },
    { key: 'fechaInicio', label: 'Fecha Inicio', type: 'date' },
    { key: 'fechaFin', label: 'Fecha Fin', type: 'date' },
    { key: 'total_valorizado', label: 'Monto', type: 'template', align: 'right' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        BORRADOR: {
          label: 'Borrador',
          class: 'status-badge status-BORRADOR',
          icon: 'fa-pencil',
        },
        PENDIENTE: {
          label: 'Pendiente',
          class: 'status-badge status-PENDIENTE',
          icon: 'fa-clock',
        },
        EN_REVISION: {
          label: 'En Revisión',
          class: 'status-badge status-PENDIENTE',
          icon: 'fa-eye',
        },
        VALIDADO: {
          label: 'Validado',
          class: 'status-badge status-PENDIENTE',
          icon: 'fa-clipboard-check',
        },
        APROBADO: {
          label: 'Aprobado',
          class: 'status-badge status-APROBADO',
          icon: 'fa-check',
        },
        PAGADO: {
          label: 'Pagado',
          class: 'status-badge status-APROBADO',
          icon: 'fa-dollar-sign',
        },
        RECHAZADO: {
          label: 'Rechazado',
          class: 'status-badge status-CANCELADO',
          icon: 'fa-xmark',
        },
      },
    },
  ];

  annexColumns: TableColumn[] = [
    { key: 'concepto', label: 'Concepto', type: 'text' },
    { key: 'incluido', label: 'Incluido', type: 'template' },
    { key: 'observaciones', label: 'Observaciones', type: 'text' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadContract(id);
    this.loadValuations(id);
  }

  loadContract(id: string): void {
    this.loading = true;
    this.contractService.getById(id).subscribe({
      next: (data) => {
        this.contract = data;
        this.loading = false;
        this.loadAnnexes(id);
        this.loadRequiredDocs(id);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadValuations(contractId: string): void {
    this.valuationService.getAll({ contrato_id: contractId }).subscribe({
      next: (data) => (this.valuations = data),
      error: (err) => console.error('Error loading valuations', err),
    });
  }

  loadAnnexes(id: string): void {
    this.contractService.getAnnexes(id, 'A').subscribe({
      next: (items) => (this.annexA = items),
    });
    this.contractService.getAnnexes(id, 'B').subscribe({
      next: (items) => (this.annexB = items),
    });
  }

  loadRequiredDocs(id: string): void {
    this.contractService.getRequiredDocuments(id).subscribe({
      next: (docs) => (this.requiredDocs = docs),
    });
  }

  translateDocType(tipo: string): string {
    const map: Record<string, string> = {
      POLIZA_TREC: 'Póliza TREC',
      SOAT: 'SOAT',
      INSPECCION_TECNICA: 'Inspección Técnica',
      TARJETA_PROPIEDAD: 'Tarjeta de Propiedad',
      LICENCIA_CONDUCIR: 'Licencia de Conducir',
    };
    return map[tipo] || tipo;
  }

  editContract(): void {
    if (this.contract) {
      this.router.navigate(['/equipment/contracts', this.contract.id.toString(), 'edit']);
    }
  }

  confirmDelete(): void {
    if (this.contract) {
      this.contractService.delete(this.contract.id.toString()).subscribe({
        next: () => {
          this.router.navigate(['/equipment/contracts']);
        },
        error: (error) => {
          console.error('Failed to delete contract:', error);
          this.showDeleteModal = false;
        },
      });
    }
  }

  deleteContract(): void {
    if (
      confirm(
        '¿Estás seguro de que deseas eliminar este contrato? Esta acción no se puede deshacer.'
      )
    ) {
      this.confirmDelete();
    }
  }

  viewAddendums(): void {
    if (!this.contract) return;

    const dialogRef = this.dialog.open(ContractAddendumDialogComponent, {
      width: '500px',
      data: {
        contractId: this.contract.id.toString(),
        currentEndDate: this.contract.fecha_fin,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.contract) {
        this.contractService.createAddendum(this.contract.id.toString(), result).subscribe({
          next: () => {
            this.loadContract(this.contract!.id.toString()); // Reload to show updated end date
            alert('Adenda creada exitosamente');
          },
          error: (err) => console.error('Error creating addendum', err),
        });
      }
    });
  }

  downloadPDF(): void {
    if (!this.contract) return;

    this.contractService.downloadPdf(this.contract.id.toString()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Contrato-${this.contract?.numero_contrato}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading PDF', err);
        alert('Error al descargar el PDF. Asegúrese de que el backend soporte esta funcionalidad.');
      },
    });
  }

  isExpiring(dateStr: string): boolean {
    if (!dateStr) return false;
    const endDate = new Date(dateStr);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  }

  getDaysRemaining(dateStr: string): number {
    if (!dateStr) return 0;
    const endDate = new Date(dateStr);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusLabel(estado: string): string {
    const labelMap: { [key: string]: string } = {
      BORRADOR: 'Borrador',
      ACTIVO: 'Activo',
      VENCIDO: 'Vencido',
      CANCELADO: 'Cancelado',
      FINALIZADO: 'Finalizado',
      RESCINDIDO: 'Rescindido',
    };
    return labelMap[estado] || estado;
  }
}
