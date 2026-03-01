import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProviderService } from '../../../core/services/provider.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-provider-log',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="log-container">
      <div class="section-header">
        <h3>Historial de Cambios</h3>
        <app-button
          variant="secondary"
          size="sm"
          icon="fa-sync"
          label="Refrescar"
          (clicked)="loadLogs()"
        ></app-button>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Acción</th>
              <th>Campo</th>
              <th>Valor Anterior</th>
              <th>Valor Nuevo</th>
              <th>Usuario</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of logs">
              <td>{{ log.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <span [class]="'action-badge action-' + log.accion.toLowerCase()">
                  {{ log.accion }}
                </span>
              </td>
              <td>{{ log.campo || '-' }}</td>
              <td class="value-cell">{{ log.valor_anterior || '-' }}</td>
              <td class="value-cell">{{ log.valor_nuevo || '-' }}</td>
              <td>{{ log.user?.nombre_usuario || 'Sistema' }}</td>
              <td>{{ log.observaciones }}</td>
            </tr>
            <tr *ngIf="logs.length === 0 && !loading">
              <td colspan="7" class="empty-row">No hay registros en el historial</td>
            </tr>
            <tr *ngIf="loading">
              <td colspan="7" class="loading-row">
                <i class="fa-solid fa-spinner fa-spin"></i> Cargando historial...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .log-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .section-header h3 {
        margin: 0;
        font-size: 16px;
        color: var(--primary-800);
        font-weight: 600;
      }

      .table-container {
        overflow-x: auto;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      .data-table th,
      .data-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--grey-200);
      }

      .data-table th {
        background: var(--grey-50);
        font-weight: 600;
        color: var(--grey-700);
        text-transform: uppercase;
        font-size: 11px;
      }

      .action-badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }

      .action-create {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }
      .action-update {
        background: var(--primary-50);
        color: var(--primary-700);
      }
      .action-delete {
        background: var(--semantic-red-50);
        color: var(--grey-900);
      }
      .action-activate {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }
      .action-deactivate {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
      }

      .value-cell {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .empty-row,
      .loading-row {
        text-align: center;
        padding: 2rem !important;
        color: var(--grey-500);
        font-style: italic;
      }
    `,
  ],
})
export class ProviderLogComponent implements OnInit {
  @Input() providerId!: number | string;
  private providerService = inject(ProviderService);

  logs: Record<string, unknown>[] = [];
  loading = false;

  ngOnInit(): void {
    if (this.providerId) {
      this.loadLogs();
    }
  }

  loadLogs(): void {
    this.loading = true;
    this.providerService.getAuditLogs(this.providerId).subscribe({
      next: (logs) => {
        this.logs = logs;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading provider logs', err);
        this.loading = false;
      },
    });
  }
}
