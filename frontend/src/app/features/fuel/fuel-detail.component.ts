import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FuelService } from '../../core/services/fuel.service';
import { FuelRecord } from '../../core/models/fuel-record.model';
import { EntityDetailShellComponent } from '../../shared/components/entity-detail/entity-detail-shell.component';
import {
  EntityDetailHeader,
  AuditInfo,
  AuditEntry,
  TabConfig,
} from '../../shared/components/entity-detail/entity-detail.types';

@Component({
  selector: 'app-fuel-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, EntityDetailShellComponent],
  template: `
    <app-entity-detail-shell
      [header]="header"
      [entity]="record"
      [loading]="loading"
      [auditInfo]="auditInfo"
      loadingText="Cargando detalles del consumo..."
    >
      <!-- ── TABS NAVIGATION ──────────────────────────────────── -->
      <div entity-header-below class="detail-tabs">
        <button
          *ngFor="let tab of tabConfigs"
          class="tab-link"
          [class.active]="activeTab === tab.id"
          (click)="onTabChange(tab.id)"
        >
          <i [class]="tab.icon"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- ── MAIN CONTENT ────────────────────────────────────── -->
      <div entity-main-content class="detail-content">
        <!-- Tab: General -->
        <div *ngIf="activeTab === 'general'" class="tab-pane animate-fade-in">
          <div class="detail-sections">
            <section class="detail-section card">
              <div class="section-header">
                <h3>Información de Consumo</h3>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Proveedor</span>
                  <span class="value">{{ record?.proveedor || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Tipo Combustible</span>
                  <span class="value">{{ record?.tipo_combustible || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Cantidad (Gl.)</span>
                  <span class="value highlight">{{ record?.cantidad | number: '1.2-2' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Valorización ID</span>
                  <span class="value">{{ record?.valorizacion_id || 'N/A' }}</span>
                </div>
              </div>
            </section>

            <section class="detail-section card">
              <div class="section-header">
                <h3>Costos y Precios</h3>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Precio Unitario</span>
                  <span class="value price"
                    >S/ {{ record?.precio_unitario | number: '1.2-2' }}</span
                  >
                </div>
                <div class="info-item">
                  <span class="label">Monto Total</span>
                  <span class="value price total"
                    >S/ {{ record?.monto_total | number: '1.2-2' }}</span
                  >
                </div>
              </div>
            </section>
          </div>
        </div>

        <!-- Tab: Document -->
        <div *ngIf="activeTab === 'document'" class="tab-pane animate-fade-in">
          <div class="detail-sections">
            <section class="detail-section card">
              <div class="section-header">
                <h3>Detalle de Documento</h3>
              </div>
              <div class="info-grid single-col">
                <div class="info-item">
                  <span class="label">Número de Documento</span>
                  <span class="value">{{ record?.numero_documento || 'No especificado' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Observaciones</span>
                  <p class="value observations">
                    {{ record?.observaciones || 'Sin observaciones' }}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <!-- ── SIDEBAR ACTIONS ───────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <button type="button" class="btn btn-primary btn-block" (click)="editRecord()">
          <i class="fa-solid fa-pen-to-square"></i>
          Editar Registro
        </button>
        <button type="button" class="btn btn-ghost btn-block" routerLink="/logistics/fuel">
          <i class="fa-solid fa-arrow-left"></i>
          Volver a Lista
        </button>
        <button type="button" class="btn btn-outline-danger btn-block" (click)="deleteRecord()">
          <i class="fa-solid fa-trash-can"></i>
          Eliminar Registro
        </button>
      </ng-container>
    </app-entity-detail-shell>

    <!-- Delete Confirmation Modal -->
    <div
      *ngIf="showDeleteModal"
      class="modal-backdrop"
      (click)="showDeleteModal = false"
      (keydown.enter)="showDeleteModal = false"
      tabindex="0"
      role="button"
    >
      <div
        class="modal-content animate-scale-in"
        (click)="$event.stopPropagation()"
        (keydown.enter)="$event.stopPropagation()"
        tabindex="0"
        role="dialog"
      >
        <div class="modal-header">
          <h3>Eliminar Registro</h3>
          <button class="btn-close" (click)="showDeleteModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>¿Está seguro de que desea eliminar este registro de combustible?</p>
          <div class="alert alert-danger-light">
            <i class="fa-solid fa-triangle-exclamation"></i>
            Esta acción es permanente y no se puede deshacer.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" (click)="showDeleteModal = false">Cancelar</button>
          <button class="btn btn-danger" (click)="confirmDelete()">Eliminar Permanentemente</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .detail-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: var(--s-24);

        .tab-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid var(--grey-200);
          background: var(--neutral-0);
          color: var(--grey-600);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;

          i {
            opacity: 0.7;
            font-size: 13px;
          }

          &:hover {
            background: var(--grey-50);
            border-color: var(--grey-300);
            color: var(--primary-700);
          }

          &.active {
            background: var(--primary-50);
            border-color: var(--primary-200);
            color: var(--primary-700);
            font-weight: 600;
            i {
              opacity: 1;
            }
          }
        }
      }

      .btn-block {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 12px;
        padding: 10px 16px;
        width: 100%;
        text-align: left;
        font-weight: 500;
        i {
          width: 16px;
          text-align: center;
        }
      }

      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .detail-section {
        padding: 24px;
        border-radius: 12px;
        border: 1px solid var(--grey-100);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

        .section-header {
          margin-bottom: 20px;
          h3 {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--grey-800);
          }
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px 32px;

        &.single-col {
          grid-template-columns: 1fr;
        }
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--grey-500);
          font-weight: 600;
        }

        .value {
          font-size: 1rem;
          color: var(--grey-800);
          font-weight: 500;

          &.highlight {
            font-weight: 700;
            color: var(--primary-700);
            font-size: 1.25rem;
          }
          &.price {
            color: var(--primary-700);
            font-weight: 600;
          }
          &.total {
            font-size: 1.25rem;
            font-weight: 800;
            border-top: 1px dashed var(--grey-200);
            padding-top: 8px;
            margin-top: 4px;
          }
          &.observations {
            line-height: 1.6;
            color: var(--grey-700);
            white-space: pre-line;
          }
        }
      }

      /* Modals */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
      }

      .modal-content {
        background: white;
        width: 100%;
        max-width: 500px;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }

      .modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid var(--grey-100);
        display: flex;
        justify-content: space-between;
        align-items: center;
        h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--grey-900);
        }
        .btn-close {
          border: none;
          background: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--grey-400);
        }
      }

      .modal-body {
        padding: 24px;
        p {
          color: var(--grey-600);
          margin: 0 0 16px;
        }
      }

      .modal-footer {
        padding: 16px 24px;
        background: var(--grey-50);
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .alert-danger-light {
        background: #fee2e2;
        color: #b91c1c;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 12px;
        i {
          font-size: 1.1rem;
        }
      }
    `,
  ],
})
export class FuelDetailComponent implements OnInit {
  private fuelService = inject(FuelService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  record: FuelRecord | null = null;
  loading = true;
  showDeleteModal = false;
  activeTab = 'general';

  tabConfigs: TabConfig[] = [
    { id: 'general', label: 'Resumen', icon: 'fa-solid fa-circle-info' },
    { id: 'document', label: 'Documento y Notas', icon: 'fa-solid fa-file-invoice' },
  ];

  header: EntityDetailHeader = {
    title: 'Registro de Combustible',
    statusLabel: '',
    statusClass: '',
  };

  auditInfo: AuditInfo = {
    entries: [],
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadRecord(id);
  }

  loadRecord(id: number): void {
    this.loading = true;
    this.fuelService.getById(id).subscribe({
      next: (data: FuelRecord) => {
        this.record = data;
        this.updateHeaderAndAudit();
        this.loading = false;
      },
      error: (_error: unknown) => {
        this.loading = false;
      },
    });
  }

  private updateHeaderAndAudit(): void {
    if (!this.record) return;

    this.header = {
      icon: 'fa-solid fa-gas-pump',
      title: 'Registro de Combustible',
      subtitle: this.record.fecha ? new Date(this.record.fecha).toLocaleDateString() : undefined,
      statusLabel: 'REGISTRADO',
      statusClass: 'status-completado',
    };

    const entries: AuditEntry[] = [];

    if (this.record.created_at) {
      entries.push({
        label: 'Fecha de creación',
        date: this.record.created_at,
      });
    }

    this.auditInfo = { entries };
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
  }

  editRecord(): void {
    if (this.record) {
      this.router.navigate(['/logistics/fuel', this.record.id, 'edit']);
    }
  }

  deleteRecord(): void {
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.record) {
      this.fuelService.delete(this.record.id).subscribe({
        next: () => {
          this.router.navigate(['/logistics/fuel']);
        },
        error: (error) => {
          console.error('Failed to delete record:', error);
          this.showDeleteModal = false;
        },
      });
    }
  }
}
