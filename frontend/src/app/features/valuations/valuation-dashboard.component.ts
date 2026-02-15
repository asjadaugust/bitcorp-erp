import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValuationService } from '../../core/services/valuation.service';

@Component({
  selector: 'app-valuation-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="header">
        <h1>Dashboard de Valorizaciones</h1>
        <p>Resumen financiero y operativo</p>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <div *ngIf="!loading && data" class="dashboard-grid">
        <!-- Summary Cards -->
        <div class="card summary-card total">
          <div class="icon"><i class="fa-solid fa-sack-dollar"></i></div>
          <div class="content">
            <h3>Total Valorizado</h3>
            <p class="value">{{ getTotalAmount() | currency: 'PEN' : 'S/ ' }}</p>
          </div>
        </div>

        <div class="card summary-card pending">
          <div class="icon"><i class="fa-solid fa-clock"></i></div>
          <div class="content">
            <h3>Pendientes</h3>
            <p class="value">{{ getStatusCount('PENDIENTE') }}</p>
          </div>
        </div>

        <div class="card summary-card approved">
          <div class="icon"><i class="fa-solid fa-check-circle"></i></div>
          <div class="content">
            <h3>Aprobadas</h3>
            <p class="value">{{ getStatusCount('APROBADO') }}</p>
          </div>
        </div>

        <!-- Monthly Trend Chart -->
        <div class="card chart-card full-width">
          <h3>Tendencia Mensual (Últimos 6 meses)</h3>
          <div class="bar-chart">
            <div *ngFor="let item of data.monthly_trend" class="bar-group">
              <div class="bar-container">
                <div class="bar" [style.height.%]="getBarHeight(item.total)">
                  <span class="tooltip">{{ item.total | currency: 'PEN' : 'S/ ' }}</span>
                </div>
              </div>
              <span class="label">{{ item.period }}</span>
            </div>
          </div>
        </div>

        <!-- Top Equipment -->
        <div class="card list-card">
          <h3>Top 5 Equipos por Costo</h3>
          <div class="equipment-list">
            <div *ngFor="let item of data.top_equipment" class="list-item">
              <span class="name">{{ item.name }}</span>
              <span class="amount">{{ item.total | currency: 'PEN' : 'S/ ' }}</span>
              <div class="progress-bg">
                <div
                  class="progress-bar"
                  [style.width.%]="getEquipmentPercentage(item.total)"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Breakdown -->
        <div class="card list-card">
          <h3>Desglose por Estado</h3>
          <div class="status-list">
            <div *ngFor="let item of data.status_breakdown" class="list-item">
              <span [class]="'status-badge status-' + item.status">{{ item.status }}</span>
              <span class="count">{{ item.count }} valorizaciones</span>
              <span class="amount">{{ item.total | currency: 'PEN' : 'S/ ' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 0;
      }
      .header {
        margin-bottom: 24px;
      }
      .header h1 {
        font-size: 24px;
        color: var(--primary-900);
        margin: 0;
      }
      .header p {
        color: var(--grey-500);
        margin: 4px 0 0;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 24px;
      }

      .full-width {
        grid-column: 1 / -1;
      }

      .card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--grey-200);
      }

      /* Summary Cards */
      .summary-card {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .summary-card .icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }
      .summary-card.total .icon {
        background: var(--primary-100);
        color: var(--primary-500);
      }
      .summary-card.pending .icon {
        background: var(--semantic-yellow-100);
        color: var(--semantic-yellow-600);
      }
      .summary-card.approved .icon {
        background: var(--semantic-green-100);
        color: var(--semantic-green-600);
      }

      .summary-card .content h3 {
        margin: 0;
        font-size: 14px;
        color: var(--grey-500);
        font-weight: 500;
      }
      .summary-card .content .value {
        margin: 4px 0 0;
        font-size: 24px;
        font-weight: 700;
        color: var(--grey-900);
      }

      /* Bar Chart */
      .bar-chart {
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        height: 200px;
        margin-top: 24px;
        padding-bottom: 24px;
      }
      .bar-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        height: 100%;
        justify-content: flex-end;
        flex: 1;
      }
      .bar-container {
        height: 100%;
        width: 40px;
        display: flex;
        align-items: flex-end;
        position: relative;
      }
      .bar {
        width: 100%;
        background: var(--primary-500);
        border-radius: 4px 4px 0 0;
        transition: height 0.3s ease;
        position: relative;
        min-height: 4px;
      }
      .bar:hover .tooltip {
        opacity: 1;
        transform: translateX(-50%) translateY(-10px);
      }
      .tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: var(--grey-900);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s;
      }
      .label {
        font-size: 12px;
        color: var(--grey-500);
      }

      /* Lists */
      .list-card h3 {
        margin: 0 0 16px;
        font-size: 16px;
        color: var(--grey-900);
      }
      .list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--grey-100);
        position: relative;
      }
      .list-item:last-child {
        border-bottom: none;
      }

      .progress-bg {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        width: 100%;
        background: var(--grey-100);
      }
      .progress-bar {
        height: 100%;
        background: var(--primary-500);
      }

      .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        text-transform: capitalize;
      }
      .status-draft {
        background: var(--grey-100);
        color: var(--grey-700);
      }
      .status-pending {
        background: var(--semantic-yellow-100);
        color: var(--semantic-yellow-700);
      }
      .status-approved {
        background: var(--semantic-green-100);
        color: var(--semantic-green-700);
      }
      .status-paid {
        background: var(--semantic-blue-100);
        color: var(--semantic-blue-700);
      }

      .loading {
        display: flex;
        justify-content: center;
        padding: 48px;
      }
    `,
  ],
})
export class ValuationDashboardComponent implements OnInit {
  valuationService = inject(ValuationService);
  loading = true;
  data: any = null;

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.valuationService.getAnalytics().subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading analytics', err);
        this.loading = false;
      },
    });
  }

  getTotalAmount(): number {
    if (!this.data) return 0;
    return this.data.status_breakdown.reduce((acc: number, curr: any) => acc + curr.total, 0);
  }

  getStatusCount(status: string): number {
    if (!this.data) return 0;
    const item = this.data.status_breakdown.find((s: any) => s.status === status);
    return item ? item.count : 0;
  }

  getBarHeight(value: number): number {
    if (!this.data || this.data.monthly_trend.length === 0) return 0;
    const max = Math.max(...this.data.monthly_trend.map((i: any) => i.total));
    return max > 0 ? (value / max) * 100 : 0;
  }

  getEquipmentPercentage(value: number): number {
    if (!this.data || this.data.top_equipment.length === 0) return 0;
    const max = Math.max(...this.data.top_equipment.map((i: any) => i.total));
    return max > 0 ? (value / max) * 100 : 0;
  }
}
