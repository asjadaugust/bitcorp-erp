import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  AdministrationService,
  PaymentSchedule,
  AccountsPayable,
  PaymentScheduleDetail,
} from '../../services/administration.service';
import { FormContainerComponent } from '../../../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../../../shared/components/form-section/form-section.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-payment-schedule-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormContainerComponent,
    FormSectionComponent,
    ButtonComponent,
  ],
  template: `
    <app-form-container
      [title]="
        isViewMode
          ? 'Detalle Programación'
          : isEditMode
            ? 'Editar Programación'
            : 'Nueva Programación'
      "
      icon="fa-calendar-check"
      backUrl="/administracion/payment-schedules"
      [loading]="loading"
      [disableSubmit]="!isFormValid() || loading"
      [showFooter]="!isViewMode"
      [showActions]="!isViewMode"
      submitLabel="Guardar"
      (submitted)="onSubmit()"
      (cancelled)="cancel()"
    >
      <app-form-section title="Datos de Programación" icon="fa-calendar" [columns]="2">
        <div class="form-group">
          <label class="required">Fecha de Programación</label>
          <input
            type="date"
            [(ngModel)]="formData.schedule_date"
            name="schedule_date"
            class="form-control"
            [disabled]="isViewMode"
            required
          />
        </div>

        <div class="form-group">
          <label class="required">Fecha de Pago</label>
          <input
            type="date"
            [(ngModel)]="formData.payment_date"
            name="payment_date"
            class="form-control"
            [disabled]="isViewMode"
            required
          />
        </div>

        <div class="form-group full-width">
          <label>Descripción</label>
          <textarea
            [(ngModel)]="formData.description"
            name="description"
            class="form-control"
            rows="2"
            placeholder="Ingrese una descripción..."
            [disabled]="isViewMode"
          ></textarea>
        </div>
      </app-form-section>

      <app-form-section
        title="Items de Cuentas por Pagar"
        icon="fa-file-invoice-dollar"
        [columns]="1"
      >
        <div class="items-header" *ngIf="canEdit">
          <app-button
            variant="secondary"
            icon="fa-plus"
            label="Agregar Item"
            size="sm"
            (clicked)="showAddItemModal = true"
          ></app-button>
        </div>

        <table class="details-table" *ngIf="selectedDetails.length > 0">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Proveedor</th>
              <th>Monto</th>
              <th *ngIf="canEdit">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let detail of selectedDetails">
              <td>{{ detail.accounts_payable?.numero_factura }}</td>
              <td>{{ detail.accounts_payable?.provider?.razonSocial || 'N/A' }}</td>
              <td class="monto-cell">{{ detail.amount_to_pay | currency: 'PEN' : 'symbol' }}</td>
              <td *ngIf="canEdit">
                <app-button
                  variant="ghost"
                  icon="fa-trash"
                  size="sm"
                  (clicked)="removeDetail(detail)"
                ></app-button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="selectedDetails.length === 0">
          <i class="fa-solid fa-inbox"></i>
          <p>No hay items agregados. Haga clic en "Agregar Item" para comenzar.</p>
        </div>
      </app-form-section>

      <!-- Total Summary -->
      <div class="total-section">
        <span class="total-label">Total Programado:</span>
        <span class="total-amount">{{ calculateTotal() | currency: 'PEN' : 'symbol' }}</span>
      </div>
    </app-form-container>

    <!-- Add Item Modal -->
    <div class="modal-overlay" *ngIf="showAddItemModal" (click)="showAddItemModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Seleccionar Cuentas por Pagar Pendientes</h3>
          <app-button
            variant="ghost"
            icon="fa-times"
            size="sm"
            (clicked)="showAddItemModal = false"
          ></app-button>
        </div>
        <div class="modal-body">
          <table class="modal-table" *ngIf="availableAP.length > 0">
            <thead>
              <tr>
                <th class="col-check"></th>
                <th>Documento</th>
                <th>Proveedor</th>
                <th>Monto</th>
                <th>Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let ap of availableAP"
                (click)="ap.selected = !ap.selected"
                class="selectable-row"
              >
                <td class="col-check">
                  <input
                    type="checkbox"
                    [(ngModel)]="ap.selected"
                    [ngModelOptions]="{ standalone: true }"
                    (click)="$event.stopPropagation()"
                  />
                </td>
                <td>{{ ap.numero_factura }}</td>
                <td>{{ ap.provider?.razonSocial || 'N/A' }}</td>
                <td class="monto-cell">{{ ap.monto_total | currency: 'PEN' : 'symbol' }}</td>
                <td>{{ ap.fecha_vencimiento | date: 'dd/MM/yyyy' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="empty-state" *ngIf="availableAP.length === 0">
            <i class="fa-solid fa-inbox"></i>
            <p>No hay cuentas por pagar pendientes</p>
          </div>
        </div>
        <div class="modal-footer">
          <app-button
            variant="secondary"
            label="Cancelar"
            (clicked)="showAddItemModal = false"
          ></app-button>
          <app-button
            variant="primary"
            label="Agregar Seleccionados"
            [disabled]="!hasSelectedItems()"
            (clicked)="addSelectedItems()"
          ></app-button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'form-layout';

      .items-header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: var(--s-12);
      }

      .details-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--grey-100);
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--grey-200);
      }

      .details-table th,
      .details-table td {
        padding: var(--s-12);
        text-align: left;
        border-bottom: 1px solid var(--grey-200);
      }

      .details-table th {
        background: var(--grey-50);
        font-weight: 600;
        font-size: 13px;
        color: var(--grey-700);
      }

      .details-table tbody tr:last-child td {
        border-bottom: none;
      }

      .monto-cell {
        font-variant-numeric: tabular-nums;
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
        display: block;
      }

      .empty-state p {
        margin: 0;
        font-size: 14px;
      }

      .total-section {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: var(--s-12);
        background: var(--primary-100);
        padding: var(--s-16) var(--s-20);
        border-radius: 8px;
        margin-top: var(--s-16);
      }

      .total-label {
        font-size: 15px;
        font-weight: 600;
        color: var(--primary-800);
      }

      .total-amount {
        font-size: 20px;
        font-weight: 700;
        color: var(--primary-900);
        font-variant-numeric: tabular-nums;
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: color-mix(in srgb, var(--grey-900) 50%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background: var(--grey-100);
        border-radius: var(--s-12);
        max-width: 800px;
        width: 90%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
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
        font-size: 16px;
        font-weight: 700;
        color: var(--grey-900);
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
        font-size: 13px;
        color: var(--grey-700);
      }

      .col-check {
        width: 40px;
        text-align: center !important;
      }

      .selectable-row {
        cursor: pointer;
        transition: background-color 0.15s;
      }

      .selectable-row:hover {
        background: var(--grey-50);
      }

      .modal-footer {
        padding: var(--s-16) var(--s-20);
        border-top: 1px solid var(--grey-200);
        display: flex;
        justify-content: flex-end;
        gap: var(--s-12);
      }
    `,
  ],
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
    estado: 'BORRADOR',
  };

  selectedDetails: PaymentScheduleDetail[] = [];
  availableAP: (AccountsPayable & { selected?: boolean })[] = [];
  showAddItemModal = false;
  loading = false;
  isEditMode = false;
  isViewMode = false;
  scheduleId?: number;

  get canEdit(): boolean {
    if (this.isViewMode) return false;
    if (!this.isEditMode) return true;
    return this.formData.estado === 'BORRADOR';
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const url = this.router.url;

    if (id) {
      this.scheduleId = Number(id);
      this.isEditMode = url.endsWith('/edit');
      this.isViewMode = !this.isEditMode;
      this.loadSchedule();
    }

    this.loadPendingAP();
  }

  loadPendingAP() {
    this.adminService.getPendingAccountsPayable().subscribe({
      next: (items) => {
        this.availableAP = items.map((item) => ({ ...item, selected: false }));
      },
      error: (err) => console.error('Error loading pending AP:', err),
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
      },
    });
  }

  isFormValid(): boolean {
    return (
      !!this.formData.schedule_date &&
      !!this.formData.payment_date &&
      this.selectedDetails.length > 0
    );
  }

  hasSelectedItems(): boolean {
    return this.availableAP.some((ap) => ap.selected);
  }

  addSelectedItems() {
    const selected = this.availableAP.filter((ap) => ap.selected);

    selected.forEach((ap) => {
      const detail: PaymentScheduleDetail = {
        id: 0,
        payment_schedule_id: this.scheduleId || 0,
        accounts_payable_id: ap.id,
        amount_to_pay: ap.monto_total,
        accounts_payable: ap,
      };
      this.selectedDetails.push(detail);
    });

    this.availableAP = this.availableAP.filter((ap) => !ap.selected);
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

    const operation =
      this.isEditMode && this.scheduleId
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
      },
    });
  }

  addDetailsToSchedule(scheduleId: number) {
    let completed = 0;
    const total = this.selectedDetails.length;

    if (total === 0) {
      this.router.navigate(['/administracion/payment-schedules']);
      return;
    }

    this.selectedDetails.forEach((detail) => {
      this.adminService
        .addPaymentScheduleDetail(scheduleId, {
          accounts_payable_id: detail.accounts_payable_id,
          amount_to_pay: detail.amount_to_pay,
        })
        .subscribe({
          next: () => {
            completed++;
            if (completed === total) {
              this.router.navigate(['/administracion/payment-schedules']);
            }
          },
          error: () => {
            this.loading = false;
          },
        });
    });
  }

  cancel() {
    this.router.navigate(['/administracion/payment-schedules']);
  }
}
