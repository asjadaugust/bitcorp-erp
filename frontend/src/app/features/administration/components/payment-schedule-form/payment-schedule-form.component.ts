import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdministrationService, PaymentSchedule, AccountsPayable, PaymentScheduleDetail } from '../../services/administration.service';
import { PageLayoutComponent, Breadcrumb } from '../../../../shared/components/page-layout/page-layout.component';

@Component({
  selector: 'app-payment-schedule-form',
  standalone: true,
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  template: `
    <app-page-layout
      [title]="isEditMode ? 'Editar Programación' : 'Nueva Programación'"
      icon="fa-calendar-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <form (ngSubmit)="onSubmit()" #psForm="ngForm" class="form-container">
        <div class="form-grid">
          <div class="form-group">
            <label>Fecha de Programación *</label>
            <input type="date" [(ngModel)]="formData.schedule_date" name="schedule_date" required class="form-control">
          </div>

          <div class="form-group">
            <label>Fecha de Pago *</label>
            <input type="date" [(ngModel)]="formData.payment_date" name="payment_date" required class="form-control">
          </div>

          <div class="form-group full-width">
            <label>Descripción</label>
            <textarea [(ngModel)]="formData.description" name="description" class="form-control" rows="2" placeholder="Ingrese una descripción..."></textarea>
          </div>
        </div>

        <!-- Details Section -->
        <div class="details-section">
          <div class="section-header">
            <h3>Items de Cuentas por Pagar</h3>
            <button type="button" class="btn btn-secondary" (click)="showAddItemModal = true" *ngIf="!isEditMode || formData.status === 'draft'">
              <i class="fa-solid fa-plus"></i> Agregar Item
            </button>
          </div>

          <table class="details-table" *ngIf="selectedDetails.length > 0">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Proveedor</th>
                <th>Monto</th>
                <th *ngIf="!isEditMode || formData.status === 'draft'">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let detail of selectedDetails">
                <td>{{ detail.accounts_payable?.document_number }}</td>
                <td>{{ detail.accounts_payable?.provider?.C07001_RazonSocial || 'N/A' }}</td>
                <td>{{ detail.amount_to_pay | currency:'PEN':'symbol' }}</td>
                <td *ngIf="!isEditMode || formData.status === 'draft'">
                  <button type="button" class="btn-icon btn-danger" (click)="removeDetail(detail)" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="empty-state" *ngIf="selectedDetails.length === 0">
            <i class="fa-solid fa-inbox"></i>
            <p>No hay items agregados. Haga clic en "Agregar Item" para comenzar.</p>
          </div>
        </div>

        <!-- Total Summary -->
        <div class="total-section">
          <h3>Total: {{ calculateTotal() | currency:'PEN':'symbol' }}</h3>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="!psForm.form.valid || loading || selectedDetails.length === 0">
            <i class="fa-solid" [class.fa-save]="!loading" [class.fa-spinner]="loading" [class.fa-spin]="loading"></i>
            {{ isEditMode ? 'Actualizar' : 'Crear' }}
          </button>
        </div>
      </form>

      <!-- Add Item Modal -->
      <div class="modal" *ngIf="showAddItemModal" (click)="showAddItemModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Seleccionar Cuentas por Pagar Pendientes</h3>
            <button type="button" class="btn-close" (click)="showAddItemModal = false">×</button>
          </div>
          <div class="modal-body">
            <table class="modal-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Documento</th>
                  <th>Proveedor</th>
                  <th>Monto</th>
                  <th>Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ap of availableAP">
                  <td>
                    <input type="checkbox" [(ngModel)]="ap.selected" [ngModelOptions]="{standalone: true}">
                  </td>
                  <td>{{ ap.document_number }}</td>
                  <td>{{ ap.provider?.C07001_RazonSocial || 'N/A' }}</td>
                  <td>{{ ap.amount | currency:'PEN':'symbol' }}</td>
                  <td>{{ ap.due_date | date:'dd/MM/yyyy' }}</td>
                </tr>
                <tr *ngIf="availableAP.length === 0">
                  <td colspan="5" class="text-center">No hay cuentas por pagar pendientes</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showAddItemModal = false">Cancelar</button>
            <button type="button" class="btn btn-primary" (click)="addSelectedItems()">Agregar Seleccionados</button>
          </div>
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [`
    .form-container {
      max-width: 1000px;
      margin: 0 auto;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--s-16);
      margin-bottom: var(--s-24);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--s-8);
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    label {
      font-weight: 600;
      font-size: var(--type-bodySmall-size);
      color: var(--grey-700);
    }

    .form-control {
      padding: var(--s-8) var(--s-12);
      border: 1px solid var(--grey-300);
      border-radius: var(--s-8);
      font-size: var(--type-bodySmall-size);
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary-500);
    }

    .details-section {
      background: var(--grey-50);
      padding: var(--s-20);
      border-radius: var(--s-8);
      margin-bottom: var(--s-20);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--s-16);
    }

    .section-header h3 {
      margin: 0;
      color: var(--grey-800);
      font-size: var(--type-h4-size);
    }

    .details-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: var(--s-8);
      overflow: hidden;
    }

    .details-table th,
    .details-table td {
      padding: var(--s-12);
      text-align: left;
      border-bottom: 1px solid var(--grey-200);
    }

    .details-table th {
      background: var(--grey-100);
      font-weight: 600;
      font-size: var(--type-bodySmall-size);
      color: var(--grey-700);
    }

    .empty-state {
      text-align: center;
      padding: var(--s-32);
      color: var(--grey-500);
    }

    .empty-state i {
      font-size: 48px;
      margin-bottom: var(--s-12);
      opacity: 0.3;
    }

    .total-section {
      background: var(--primary-100);
      padding: var(--s-16);
      border-radius: var(--s-8);
      margin-bottom: var(--s-20);
    }

    .total-section h3 {
      margin: 0;
      color: var(--primary-800);
      font-size: var(--type-h3-size);
      text-align: right;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--s-12);
    }

    .btn {
      padding: var(--s-10) var(--s-20);
      border: none;
      border-radius: var(--s-8);
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: var(--s-8);
    }

    .btn-primary {
      background: var(--primary-500);
      color: white;
    }

    .btn-secondary {
      background: var(--grey-200);
      color: var(--grey-800);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      color: var(--grey-500);
    }

    .btn-icon.btn-danger:hover {
      background: var(--error-100);
      color: var(--error-600);
      border-radius: var(--s-4);
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: var(--s-12);
      max-width: 800px;
      width: 90%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: var(--s-20);
      border-bottom: 1px solid var(--grey-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--grey-500);
    }

    .modal-body {
      padding: var(--s-20);
      overflow-y: auto;
    }

    .modal-table {
      width: 100%;
      border-collapse: collapse;
    }

    .modal-table th,
    .modal-table td {
      padding: var(--s-12);
      text-align: left;
      border-bottom: 1px solid var(--grey-200);
    }

    .modal-table th {
      background: var(--grey-50);
      font-weight: 600;
    }

    .modal-footer {
      padding: var(--s-20);
      border-top: 1px solid var(--grey-200);
      display: flex;
      justify-content: flex-end;
      gap: var(--s-12);
    }

    .text-center {
      text-align: center;
      padding: var(--s-24);
      color: var(--grey-500);
    }
  `]
})
export class PaymentScheduleFormComponent implements OnInit {
  private adminService = inject(AdministrationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  formData: Partial<PaymentSchedule> = {
    schedule_date: '',
    payment_date: '',
    total_amount: 0,
    currency: 'PEN',
    description: '',
    status: 'draft'
  };

  selectedDetails: PaymentScheduleDetail[] = [];
  availableAP: (AccountsPayable & { selected?: boolean })[] = [];
  showAddItemModal = false;
  loading = false;
  isEditMode = false;
  scheduleId?: number;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Administración', url: '/administracion' },
    { label: 'Programación de Pagos', url: '/administracion/payment-schedules' },
    { label: 'Formulario' }
  ];

  ngOnInit() {
    this.loadPendingAP();
    this.scheduleId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.scheduleId;

    if (this.isEditMode) {
      this.loadSchedule();
    }
  }

  loadPendingAP() {
    this.adminService.getPendingAccountsPayable().subscribe({
      next: (items) => {
        this.availableAP = items.map(item => ({ ...item, selected: false }));
      },
      error: (err) => console.error('Error loading pending AP:', err)
    });
  }

  loadSchedule() {
    if (!this.scheduleId) return;
    
    this.loading = true;
    this.adminService.getPaymentScheduleById(this.scheduleId).subscribe({
      next: (schedule) => {
        this.formData = { ...schedule };
        this.selectedDetails = schedule.details || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  addSelectedItems() {
    const selected = this.availableAP.filter(ap => ap.selected);
    
    selected.forEach(ap => {
      const detail: PaymentScheduleDetail = {
        id: 0,
        payment_schedule_id: this.scheduleId || 0,
        accounts_payable_id: ap.id,
        amount_to_pay: ap.amount,
        accounts_payable: ap
      };
      this.selectedDetails.push(detail);
    });

    this.availableAP = this.availableAP.filter(ap => !ap.selected);
    this.showAddItemModal = false;
  }

  removeDetail(detail: PaymentScheduleDetail) {
    const index = this.selectedDetails.indexOf(detail);
    if (index > -1) {
      this.selectedDetails.splice(index, 1);
      
      if (detail.accounts_payable) {
        this.availableAP.push({ ...detail.accounts_payable, selected: false });
      }
    }
  }

  calculateTotal(): number {
    return this.selectedDetails.reduce((sum, detail) => sum + detail.amount_to_pay, 0);
  }

  onSubmit() {
    this.loading = true;
    this.formData.total_amount = this.calculateTotal();

    const operation = this.isEditMode && this.scheduleId
      ? this.adminService.updatePaymentSchedule(this.scheduleId, this.formData)
      : this.adminService.createPaymentSchedule(this.formData);

    operation.subscribe({
      next: (schedule) => {
        if (!this.isEditMode && schedule.id) {
          this.addDetailsToSchedule(schedule.id);
        } else {
          this.router.navigate(['/administracion/payment-schedules']);
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  addDetailsToSchedule(scheduleId: number) {
    let completed = 0;
    const total = this.selectedDetails.length;

    if (total === 0) {
      this.router.navigate(['/administracion/payment-schedules']);
      return;
    }

    this.selectedDetails.forEach(detail => {
      this.adminService.addPaymentScheduleDetail(scheduleId, {
        accounts_payable_id: detail.accounts_payable_id,
        amount_to_pay: detail.amount_to_pay
      }).subscribe({
        next: () => {
          completed++;
          if (completed === total) {
            this.router.navigate(['/administracion/payment-schedules']);
          }
        },
        error: () => {
          this.loading = false;
        }
      });
    });
  }

  cancel() {
    this.router.navigate(['/administracion/payment-schedules']);
  }
}
