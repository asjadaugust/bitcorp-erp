import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DailyReportService } from '../../core/services/daily-report.service';
import { SyncService } from '../../core/services/sync.service';
import { OfflineDBService } from '../../core/services/offline-db.service';
import { DailyReport } from '../../core/models/daily-report.model';

@Component({
  selector: 'app-daily-report-list-pwa',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="daily-reports-pwa">
      <!-- Status Bar -->
      <div class="status-bar" [class.offline]="!syncService.syncStatus().isOnline">
        <div class="status-info">
          <span class="indicator-dot" 
                [class.online]="syncService.syncStatus().isOnline"
                [class.offline]="!syncService.syncStatus().isOnline">
          </span>
          <span>{{ syncService.syncStatus().isOnline ? 'En Línea' : 'Sin Conexión' }}</span>
        </div>
        
        <div class="sync-info" *ngIf="syncService.syncStatus().pendingCount > 0">
          <span class="badge">{{ syncService.syncStatus().pendingCount }} pendientes</span>
          <button class="btn-sync-icon" (click)="syncNow()" 
                  [disabled]="syncService.syncStatus().isSyncing">
            {{ syncService.syncStatus().isSyncing ? '⟳' : '↻' }}
          </button>
        </div>
      </div>

      <!-- Header -->
      <div class="page-header">
        <h1>Partes Diarios</h1>
        <button class="btn btn-primary" routerLink="/daily-reports/new">
          + Nuevo Reporte
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <input type="date" 
                 [(ngModel)]="filters.startDate" 
                 (change)="applyFilters()"
                 placeholder="Desde">
          <input type="date" 
                 [(ngModel)]="filters.endDate"
                 (change)="applyFilters()"
                 placeholder="Hasta">
        </div>
        
        <select [(ngModel)]="filters.status" (change)="applyFilters()" class="filter-select">
          <option value="">Todos los Estados</option>
          <option value="draft">Borradores</option>
          <option value="submitted">Enviados</option>
          <option value="approved">Aprobados</option>
          <option value="rejected">Rechazados</option>
        </select>
      </div>

      <!-- Selection Mode -->
      <div class="selection-bar" *ngIf="selectionMode()">
        <span>{{ selectedReports().length }} seleccionados</span>
        <div class="selection-actions">
          <button class="btn btn-sm btn-primary" (click)="exportSelectedPDF()">
            📄 Exportar PDF
          </button>
          <button class="btn btn-sm btn-secondary" (click)="cancelSelection()">
            Cancelar
          </button>
        </div>
      </div>

      <!-- Reports List -->
      <div class="reports-container">
        <div *ngIf="loading()" class="loading-spinner">
          Cargando reportes...
        </div>

        <div *ngIf="!loading() && filteredReports().length === 0" class="empty-state">
          <p>No hay reportes para mostrar</p>
          <button class="btn btn-primary" routerLink="/daily-reports/new">
            Crear Primer Reporte
          </button>
        </div>

        <div class="reports-list" *ngIf="!loading() && filteredReports().length > 0">
          <div *ngFor="let report of filteredReports()" 
               class="report-card"
               [class.selected]="isSelected(report)"
               [class.synced]="report.status === 'synced'"
               (click)="selectionMode() ? toggleSelection(report) : viewReport(report)">
            
            <div class="report-header">
              <div class="report-date">
                <strong>{{ report.report_date | date:'mediumDate' }}</strong>
                <span class="status-badge" [class]="'status-' + report.status">
                  {{ getStatusLabel(report.status) }}
                </span>
              </div>
              
              <div class="selection-checkbox" *ngIf="selectionMode()">
                <input type="checkbox" 
                       [checked]="isSelected(report)"
                       (click)="$event.stopPropagation()">
              </div>
            </div>

            <div class="report-info">
              <div class="info-row">
                <span class="label">Equipo:</span>
                <span>{{ report.equipment_code }} - {{ report.equipment_name }}</span>
              </div>
              <div class="info-row">
                <span class="label">Operador:</span>
                <span>{{ report.operator_name }}</span>
              </div>
              <div class="info-row">
                <span class="label">Ubicación:</span>
                <span>{{ report.location }}</span>
              </div>
              <div class="info-row">
                <span class="label">Horas:</span>
                <span>{{ report.start_time }} - {{ report.end_time }}</span>
              </div>
            </div>

            <div class="report-metrics">
              <div class="metric">
                <span class="metric-label">Horómetro</span>
                <span class="metric-value">
                  {{ (report.hourmeter_end - report.hourmeter_start).toFixed(1) }} hrs
                </span>
              </div>
              <div class="metric" *ngIf="report.fuel_consumed">
                <span class="metric-label">Combustible</span>
                <span class="metric-value">{{ report.fuel_consumed.toFixed(1) }}%</span>
              </div>
            </div>

            <div class="report-actions" (click)="$event.stopPropagation()">
              <button class="btn-icon" (click)="exportSinglePDF(report)" title="Exportar PDF">
                📄
              </button>
              <button class="btn-icon" (click)="viewReport(report)" title="Ver detalles">
                👁️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Action Button -->
      <button class="fab" routerLink="/daily-reports/new">
        +
      </button>

      <!-- Batch Actions -->
      <div class="bottom-actions" *ngIf="!selectionMode() && filteredReports().length > 0">
        <button class="btn btn-secondary btn-block" (click)="enableSelectionMode()">
          📋 Seleccionar Múltiples
        </button>
      </div>
    </div>
  `,
  styles: [`
    .daily-reports-pwa {
      min-height: 100vh;
      background: #f5f5f5;
      padding-bottom: 80px;
    }

    .status-bar {
      background: var(--primary-600);
      color: white;
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      
      &.offline {
        background: #6c757d;
      }
    }

    .status-info, .sync-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      
      &.online { background: #28a745; }
      &.offline { background: #dc3545; }
    }

    .badge {
      background: rgba(255,255,255,0.2);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
    }

    .btn-sync-icon {
      background: none;
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 16px;
    }

    .page-header {
      background: white;
      padding: 20px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      
      h1 {
        font-size: 24px;
        font-weight: 600;
        margin: 0;
      }
    }

    .filters-section {
      padding: 16px;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      
      .filter-group {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        
        input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }
      }
      
      .filter-select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 14px;
      }
    }

    .selection-bar {
      background: var(--primary-100);
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--primary-300);
      
      .selection-actions {
        display: flex;
        gap: 8px;
      }
    }

    .reports-container {
      padding: 16px;
    }

    .loading-spinner, .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .reports-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .report-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      
      &:active {
        transform: scale(0.98);
      }
      
      &.selected {
        border: 2px solid var(--primary-500);
        box-shadow: 0 4px 8px rgba(0,51,102,0.2);
      }
      
      &.synced {
        border-left: 4px solid #28a745;
      }
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      
      .report-date {
        display: flex;
        flex-direction: column;
        gap: 4px;
        
        strong {
          font-size: 16px;
          color: #333;
        }
      }
    }

    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      
      &.status-draft { background: #ffc107; color: #000; }
      &.status-submitted { background: #17a2b8; color: #fff; }
      &.status-approved { background: #28a745; color: #fff; }
      &.status-rejected { background: #dc3545; color: #fff; }
      &.status-synced { background: #28a745; color: #fff; }
    }

    .report-info {
      margin-bottom: 12px;
      
      .info-row {
        display: flex;
        gap: 8px;
        margin-bottom: 6px;
        font-size: 14px;
        
        .label {
          font-weight: 600;
          color: #666;
          min-width: 80px;
        }
      }
    }

    .report-metrics {
      display: flex;
      gap: 16px;
      padding: 12px 0;
      border-top: 1px solid #e0e0e0;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 12px;
      
      .metric {
        flex: 1;
        
        .metric-label {
          display: block;
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        
        .metric-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--primary-600);
        }
      }
    }

    .report-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      
      .btn-icon {
        background: none;
        border: none;
        font-size: 20px;
        padding: 8px;
        cursor: pointer;
        
        &:active {
          opacity: 0.7;
        }
      }
    }

    .fab {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--primary-500);
      color: white;
      border: none;
      font-size: 32px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      cursor: pointer;
      z-index: 100;
      
      &:active {
        transform: scale(0.95);
      }
    }

    .bottom-actions {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      background: white;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
    }

    .btn-block {
      width: 100%;
      padding: 14px;
    }

    @media (min-width: 769px) {
      .reports-container {
        max-width: 1200px;
        margin: 0 auto;
      }
      
      .reports-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      }
      
      .fab {
        display: none;
      }
    }
  `]
})
export class DailyReportListPWAComponent implements OnInit {
  private dailyReportService = inject(DailyReportService);
  protected syncService = inject(SyncService);
  private offlineDB = inject(OfflineDBService);

  reports = signal<any[]>([]);
  loading = signal(true);
  selectionMode = signal(false);
  selectedReports = signal<any[]>([]);

  filters = {
    startDate: '',
    endDate: '',
    status: ''
  };

  filteredReports = computed(() => {
    let result = this.reports();
    
    if (this.filters.startDate) {
      result = result.filter(r => r.report_date >= this.filters.startDate);
    }
    if (this.filters.endDate) {
      result = result.filter(r => r.report_date <= this.filters.endDate);
    }
    if (this.filters.status) {
      result = result.filter(r => r.status === this.filters.status);
    }
    
    return result;
  });

  ngOnInit(): void {
    this.loadReports();
  }

  async loadReports(): Promise<void> {
    this.loading.set(true);
    try {
      // Load from offline DB first
      const offlineReports = await this.offlineDB.getAllDailyReports();
      this.reports.set(offlineReports as any[]);

      // Try to fetch from server if online
      if (this.syncService.isOnline()) {
        this.dailyReportService.getAll({}).subscribe({
          next: (serverReports: DailyReport[]) => {
            // Merge with offline reports
            const merged = this.mergeReports(serverReports, offlineReports);
            this.reports.set(merged);
          },
          error: (err) => console.error('Failed to fetch from server:', err)
        });
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private mergeReports(serverReports: any[], offlineReports: any[]): any[] {
    // Prioritize server reports, add offline-only reports
    const merged = [...serverReports];
    const serverIds = new Set(serverReports.map(r => r.id));
    
    offlineReports.forEach(offline => {
      if (!offline.synced && !serverIds.has(offline.id)) {
        merged.push(offline);
      }
    });
    
    return merged.sort((a, b) => 
      new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
    );
  }

  applyFilters(): void {
    // Filters are reactive via computed()
  }

  async syncNow(): Promise<void> {
    await this.syncService.forceSyncNow();
    await this.loadReports();
  }

  enableSelectionMode(): void {
    this.selectionMode.set(true);
    this.selectedReports.set([]);
  }

  cancelSelection(): void {
    this.selectionMode.set(false);
    this.selectedReports.set([]);
  }

  toggleSelection(report: any): void {
    const current = this.selectedReports();
    const index = current.findIndex(r => r.id === report.id);
    
    if (index >= 0) {
      this.selectedReports.set(current.filter(r => r.id !== report.id));
    } else {
      this.selectedReports.set([...current, report]);
    }
  }

  isSelected(report: any): boolean {
    return this.selectedReports().some(r => r.id === report.id);
  }

  viewReport(report: any): void {
    // Navigate to detail view
    console.log('View report:', report);
  }

  exportSinglePDF(report: any): void {
    window.open(`/api/v1/reports/${report.id}/pdf`, '_blank');
  }

  exportSelectedPDF(): void {
    const ids = this.selectedReports().map(r => r.id);
    
    // Call batch PDF endpoint
    fetch('/api/v1/reports/batch-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ reportIds: ids })
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `partes_diarios_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(error => console.error('PDF export failed:', error));
    
    this.cancelSelection();
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'draft': 'Borrador',
      'submitted': 'Enviado',
      'approved': 'Aprobado',
      'rejected': 'Rechazado',
      'synced': 'Sincronizado'
    };
    return labels[status] || status;
  }
}
