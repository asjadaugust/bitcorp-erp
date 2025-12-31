import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ValuationService } from '../../core/services/valuation.service';
import { Valuation } from '../../core/models/valuation.model';

@Component({
  selector: 'app-valuation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="detail-container">
      <div class="container">
        <div class="breadcrumb">
          <a routerLink="/equipment/valuations" class="breadcrumb-link">← Volver a Valorizaciones</a>
        </div>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Cargando detalles de la valorización...</p>
        </div>

        <div *ngIf="!loading && valuation" class="detail-grid">
          <div class="detail-main card">
            <div class="detail-header">
              <div>
                <h1>Valorización {{ valuation.code || '#' + valuation.id }}</h1>
                <p class="code-badge">{{ valuation.status | uppercase }}</p>
              </div>
              <div class="detail-actions">
                <button class="btn btn-primary" (click)="editValuation()">
                  <i class="fa-solid fa-pen"></i> Editar
                </button>
                <button class="btn btn-danger" (click)="deleteValuation()">
                  <i class="fa-solid fa-trash"></i> Eliminar
                </button>
              </div>
            </div>

            <div class="detail-status">
              <span [class]="'status-badge status-' + valuation.status">
                {{
                  valuation.status === 'pending'
                    ? 'Pendiente'
                    : valuation.status === 'under_review'
                      ? 'En Revisión'
                      : valuation.status === 'approved'
                        ? 'Aprobado'
                        : valuation.status === 'paid'
                          ? 'Pagado'
                          : valuation.status
                }}
              </span>
            </div>

            <div class="detail-sections">
              <section class="detail-section">
                <h2>Información del Contrato</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Contrato</label>
                    <p>{{ valuation.contract_code || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Proyecto</label>
                    <p>{{ valuation.project_name || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Cliente</label>
                    <p>{{ valuation.client_name || 'N/A' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Detalles Financieros</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Monto Total</label>
                    <p class="highlight">{{ valuation.amount | currency: 'PEN' : 'S/ ' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Factura</label>
                    <p>{{ valuation.invoice_number || 'Pendiente' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Periodo</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Fecha Inicio</label>
                    <p>{{ valuation.period_start | date:'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Fecha Fin</label>
                    <p>{{ valuation.period_end | date:'dd/MM/yyyy' }}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div class="detail-sidebar">
            <div class="card">
              <h3>Acciones Rápidas</h3>
              <div class="quick-actions">
                <button class="btn btn-secondary btn-block" (click)="downloadPDF()">
                  <i class="fa-solid fa-file-pdf"></i> Descargar PDF
                </button>
                <button class="btn btn-secondary btn-block" (click)="sendEmail()">
                  <i class="fa-solid fa-envelope"></i> Enviar por Email
                </button>
              </div>
            </div>

            <div class="card">
              <h3>Información del Sistema</h3>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-date">{{ valuation.updated_at | date:'short' }}</div>
                  <div class="timeline-content">Última actualización</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-date">{{ valuation.created_at | date:'short' }}</div>
                  <div class="timeline-content">Valorización creada</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !valuation" class="empty-state card">
          <h3>Valorización no encontrada</h3>
          <p>La valorización que buscas no existe o ha sido eliminada.</p>
          <button class="btn btn-primary" routerLink="/valuations">Volver a la lista</button>
        </div>
      </div>
    </div>

    <div *ngIf="showDeleteModal" class="modal" (click)="showDeleteModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Confirmar Eliminación</h2>
          <button class="close" (click)="showDeleteModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>¿Estás seguro de que deseas eliminar esta valorización?</p>
          <p class="alert alert-warning">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showDeleteModal = false">Cancelar</button>
          <button class="btn btn-danger" (click)="confirmDelete()">Eliminar Valorización</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-container {
      min-height: 100vh;
      background: #f5f5f5;
      padding: var(--s-24) 0;
    }

    .breadcrumb {
      margin-bottom: var(--s-24);
    }
      
    .breadcrumb-link {
      color: var(--primary-500);
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
          text-decoration: underline;
        }
      }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: var(--s-24);
      
      @media (max-width: 968px) {
        grid-template-columns: 1fr;
      }
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--s-24);
      padding-bottom: var(--s-24);
      border-bottom: 2px solid #e0e0e0;
      
      h1 {
        font-size: 28px;
        color: var(--primary-900);
        margin-bottom: var(--s-4);
      }
      
      .code-badge {
        font-family: monospace;
        background: var(--grey-100);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 14px;
        color: var(--grey-700);
        font-weight: 600;
        display: inline-block;
      }
      
      @media (max-width: 768px) {
        flex-direction: column;
        gap: var(--s-16);
      }
    }

    .detail-actions {
      display: flex;
      gap: var(--s-8);
      
      @media (max-width: 768px) {
        width: 100%;
        
        .btn {
          flex: 1;
        }
      }
    }

    .detail-status {
      margin-bottom: var(--s-24);
    }

    .detail-sections {
      display: flex;
      flex-direction: column;
      gap: var(--s-32);
    }

    .detail-section {
      h2 {
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-900);
        margin-bottom: var(--s-16);
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--s-24);
    }

    .info-item {
      label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: var(--grey-500);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: var(--s-4);
      }
      
      p {
        font-size: 16px;
        color: #333;
        margin: 0;
        
        &.highlight {
          font-size: 20px;
          font-weight: 600;
          color: var(--primary-500);
        }
      }
    }

    .detail-sidebar {
      display: flex;
      flex-direction: column;
      gap: var(--s-24);
      
      h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--primary-900);
        margin-bottom: var(--s-16);
      }
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: var(--s-8);
    }

    .btn-block {
      width: 100%;
      justify-content: center;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: var(--s-16);
    }

    .timeline-item {
      position: relative;
      padding-left: var(--s-24);
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 6px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--primary-500);
      }
      
      &::after {
        content: '';
        position: absolute;
        left: 3px;
        top: 14px;
        width: 2px;
        height: calc(100% + var(--s-16));
        background: #e0e0e0;
      }
      
      &:last-child::after {
        display: none;
      }
    }

    .timeline-date {
      font-size: 12px;
      color: var(--grey-500);
      margin-bottom: var(--s-4);
    }

    .timeline-content {
      font-size: 14px;
      color: #333;
    }

    /* Status Badges */
    .status-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .status-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .status-pending {
      background: var(--semantic-yellow-50);
      color: var(--semantic-yellow-700);
    }
    .status-pending::before {
      background: var(--semantic-yellow-500);
    }

    .status-under_review {
      background: var(--semantic-blue-50);
      color: var(--semantic-blue-700);
    }
    .status-under_review::before {
      background: var(--semantic-blue-500);
    }

    .status-approved {
      background: var(--semantic-green-50);
      color: var(--semantic-green-700);
    }
    .status-approved::before {
      background: var(--semantic-green-500);
    }

    .status-paid {
      background: var(--grey-100);
      color: var(--grey-700);
    }
    .status-paid::before {
      background: var(--grey-400);
    }

    /* Modal */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      padding: 0;
      border-radius: var(--radius-md);
      width: 90%;
      max-width: 500px;
      box-shadow: var(--shadow-lg);
    }

    .modal-header {
      padding: var(--s-16) var(--s-24);
      border-bottom: 1px solid var(--grey-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h2 {
        margin: 0;
        font-size: 18px;
      }
      
      .close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--grey-500);
      }
    }

    .modal-body {
      padding: var(--s-24);
      
      p {
        margin-bottom: var(--s-16);
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .modal-footer {
      padding: var(--s-16) var(--s-24);
      border-top: 1px solid var(--grey-200);
      display: flex;
      justify-content: flex-end;
      gap: var(--s-8);
    }

    .alert {
      padding: var(--s-12);
      border-radius: var(--radius-sm);
      font-size: 14px;
    }

    .alert-warning {
      background: var(--semantic-yellow-50);
      color: var(--semantic-yellow-700);
      border: 1px solid var(--semantic-yellow-200);
    }
  `]
})
export class ValuationDetailComponent implements OnInit {
  private valuationService = inject(ValuationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  valuation: Valuation | null = null;
  loading = true;
  showDeleteModal = false;

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadValuation(id);
  }

  loadValuation(id: number): void {
    this.loading = true;
    this.valuationService.getById(id).subscribe({
      next: (data) => {
        this.valuation = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  editValuation(): void {
    if (this.valuation) {
      this.router.navigate(['/valuations', this.valuation.id, 'edit']);
    }
  }

  deleteValuation(): void {
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.valuation) {
      this.valuationService.delete(this.valuation.id).subscribe({
        next: () => {
          this.router.navigate(['/valuations']);
        },
        error: (error) => {
          console.error('Failed to delete valuation:', error);
          this.showDeleteModal = false;
        }
      });
    }
  }

  downloadPDF(): void {
    if (!this.valuation) return;
    
    this.valuationService.downloadPdf(this.valuation.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `valorizacion-${this.valuation?.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading PDF', err);
        alert('Error al descargar el PDF');
      }
    });
  }

  sendEmail(): void {
    alert('Enviar por Email - ¡Próximamente!');
  }
}
