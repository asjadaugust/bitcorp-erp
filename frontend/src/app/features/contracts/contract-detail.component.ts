import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContractService } from '../../core/services/contract.service';
import { Contract } from '../../core/models/contract.model';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ContractAddendumDialogComponent } from './components/contract-addendum-dialog/contract-addendum-dialog.component';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule],
  template: `
    <div class="detail-container">
      <div class="container">
        <div class="breadcrumb">
          <a routerLink="/equipment/contracts" class="breadcrumb-link">← Volver a Contratos</a>
        </div>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Cargando detalles del contrato...</p>
        </div>

        <div *ngIf="!loading && contract" class="detail-grid">
          <div class="detail-main card">
            <div class="detail-header">
              <div>
                <h1>Contrato {{ contract.numero_contrato }}</h1>
                <p class="code-badge">{{ contract.numero_contrato }}</p>
              </div>
              <div class="detail-actions">
                <button class="btn btn-primary" (click)="editContract()">
                  <i class="fa-solid fa-pen"></i> Editar
                </button>
                <button class="btn btn-danger" (click)="deleteContract()">
                  <i class="fa-solid fa-trash"></i> Eliminar
                </button>
              </div>
            </div>

            <div class="detail-status">
              <span [class]="'status-badge status-' + contract.estado">
                {{
                  contract.estado === 'active'
                    ? 'Activo'
                    : contract.estado === 'completed'
                      ? 'Completado'
                      : contract.estado === 'pending'
                        ? 'Pendiente'
                        : contract.estado === 'cancelled'
                          ? 'Cancelado'
                          : contract.estado
                }}
              </span>
            </div>

            <div class="detail-sections">
              <section class="detail-section">
                <h2>Información General</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Cliente</label>
                    <p>{{ contract.client_name || '-' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Proyecto</label>
                    <p>{{ contract.project_name || '-' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Monto Total</label>
                    <p class="highlight">{{ contract.tarifa | currency: 'PEN' : 'S/ ' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Vigencia</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Fecha de Inicio</label>
                    <p>{{ contract.fecha_inicio | date: 'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Fecha de Fin</label>
                    <p>{{ contract.fecha_fin | date: 'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Días Restantes</label>
                    <p [class.text-warning]="isExpiring(contract.fecha_fin)">
                      {{ getDaysRemaining(contract.fecha_fin) }} días
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div class="detail-sidebar">
            <div class="card">
              <h3>Acciones Rápidas</h3>
              <div class="quick-actions">
                <button class="btn btn-secondary btn-block" (click)="viewAddendums()">
                  <i class="fa-solid fa-file-signature"></i> Ver Adendas
                </button>
                <button class="btn btn-secondary btn-block" (click)="downloadPDF()">
                  <i class="fa-solid fa-file-pdf"></i> Descargar PDF
                </button>
              </div>
            </div>

            <div class="card">
              <h3>Información del Sistema</h3>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-date">{{ contract.updated_at | date:'short' }}</div>
                  <div class="timeline-content">Última actualización</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-date">{{ contract.created_at | date:'short' }}</div>
                  <div class="timeline-content">Contrato creado</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !contract" class="empty-state card">
          <h3>Contrato no encontrado</h3>
          <p>El contrato que buscas no existe o ha sido eliminado.</p>
          <button class="btn btn-primary" routerLink="/contracts">Volver a la lista</button>
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
          <p>¿Estás seguro de que deseas eliminar el contrato <strong>{{ contract?.numero_contrato }}</strong>?</p>
          <p class="alert alert-warning">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showDeleteModal = false">Cancelar</button>
          <button class="btn btn-danger" (click)="confirmDelete()">Eliminar Contrato</button>
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

    .status-active {
      background: var(--semantic-green-50);
      color: var(--semantic-green-700);
    }
    .status-active::before {
      background: var(--semantic-green-500);
    }

    .status-completed {
      background: var(--semantic-blue-50);
      color: var(--semantic-blue-700);
    }
    .status-completed::before {
      background: var(--semantic-blue-500);
    }

    .status-pending {
      background: var(--semantic-yellow-50);
      color: var(--semantic-yellow-700);
    }
    .status-pending::before {
      background: var(--semantic-yellow-500);
    }

    .status-cancelled {
      background: var(--grey-100);
      color: var(--grey-700);
    }
    .status-cancelled::before {
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

    .text-warning {
      color: #f59e0b;
      font-weight: 600;
    }
  `]
})
export class ContractDetailComponent implements OnInit {
  private contractService = inject(ContractService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  contract: Contract | null = null;
  loading = true;
  showDeleteModal = false;


  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadContract(id);
  }

  loadContract(id: string): void {
    this.loading = true;
    this.contractService.getById(id).subscribe({
      next: (data) => {
        this.contract = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  editContract(): void {
    if (this.contract) {
      this.router.navigate(['/equipment/contracts', this.contract.id, 'edit']);
    }
  }

  deleteContract(): void {
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.contract) {
      this.contractService.delete(this.contract.id).subscribe({
        next: () => {
          this.router.navigate(['/equipment/contracts']);
        },
        error: (error) => {
          console.error('Failed to delete contract:', error);
          this.showDeleteModal = false;
        }
      });
    }
  }

  viewAddendums(): void {
    if (!this.contract) return;

    const dialogRef = this.dialog.open(ContractAddendumDialogComponent, {
      width: '500px',
      data: {
        contractId: this.contract.id,
        currentEndDate: this.contract.fecha_fin
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.contract) {
        this.contractService.createAddendum(this.contract.id, result).subscribe({
          next: () => {
            this.loadContract(this.contract!.id); // Reload to show updated end date
            alert('Adenda creada exitosamente');
          },
          error: (err) => console.error('Error creating addendum', err)
        });
      }
    });
  }

  downloadPDF(): void {
    if (!this.contract) return;

    this.contractService.downloadPdf(this.contract.id).subscribe({
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
      }
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
}
