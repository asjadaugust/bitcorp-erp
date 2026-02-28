# WS-33: Offline Recovery UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an `/operator/pending-reports` page where operators can view, retry, and delete their offline-queued daily reports stored in IndexedDB.

**Architecture:** Single standalone Angular component reading from IndexedDB via the existing `SyncManager` service. No backend changes. The component uses signals for reactive state and polls every 5 seconds. Integration points: new route in app.routes.ts, nav link in operator-layout, conditional card in operator-dashboard, "Ver detalles" link in offline-indicator.

**Tech Stack:** Angular 19 standalone component, IndexedDB (via SyncManager), signals, Aero design system components

---

### Task 1: Create OperatorPendingReportsComponent

**Files:**
- Create: `frontend/src/app/features/operator/pending-reports/operator-pending-reports.component.ts`

**Step 1: Create the component file**

This is a single-file standalone component (template + styles inline, matching operator module pattern). The component:
- Injects `SyncManager` and `ServiceWorkerService`
- Uses signals for `pendingReports`, `deadLetters`, `isSyncing`
- Polls every 5s via `setInterval`
- Provides: syncAll, retryOne, retryAll, deleteReport actions
- Uses `<app-page-layout>` wrapper (same as operator-dashboard)
- Uses `<app-button>` for actions (same as operator-layout)
- Uses `<aero-badge>` for status indicators
- Uses confirm dialog pattern before delete

```typescript
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SyncManager } from '../../../core/services/sync-manager.service';
import { ServiceWorkerService } from '../../../core/services/service-worker.service';
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AeroBadgeComponent } from '../../../core/design-system/badge/aero-badge.component';
import { StatsGridComponent, StatItem } from '../../../shared/components/stats-grid/stats-grid.component';

interface PendingReport {
  id: number;
  fecha_parte: string;
  equipo_id: number;
  horometro_inicial: number;
  horometro_final: number;
  observaciones: string;
  timestamp: number;
  syncAttempts: number;
  lastSyncAttempt: number | null;
  deadLetter: number;
  deadLetteredAt: number | null;
  photoCount?: number;
}

@Component({
  selector: 'app-operator-pending-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageLayoutComponent,
    ButtonComponent,
    AeroBadgeComponent,
    StatsGridComponent,
  ],
  template: `
    <app-page-layout title="Reportes Pendientes" icon="fa-clock-rotate-left">
      <p class="subtitle">Gestionar reportes guardados sin conexión</p>

      <app-stats-grid [items]="statItems()" testId="pending-stats"></app-stats-grid>

      <!-- Pending Reports Section -->
      @if (pendingReports().length > 0) {
        <div class="section">
          <div class="section-header">
            <h3><i class="fa-solid fa-clock"></i> En cola de sincronización</h3>
            <app-button
              variant="primary"
              icon="fa-rotate"
              label="Sincronizar todo"
              [disabled]="isSyncing() || !isOnline()"
              (clicked)="syncAll()"
            ></app-button>
          </div>

          <div class="report-cards">
            @for (report of pendingReports(); track report.id) {
              <div class="report-card pending" [attr.data-testid]="'pending-report-' + report.id">
                <div class="card-header">
                  <span class="card-date">
                    <i class="fa-solid fa-calendar"></i>
                    {{ report.fecha_parte || 'Sin fecha' }}
                  </span>
                  <aero-badge variant="warning">Pendiente</aero-badge>
                </div>
                <div class="card-body">
                  <div class="card-detail">
                    <i class="fa-solid fa-truck"></i>
                    Equipo #{{ report.equipo_id }}
                  </div>
                  <div class="card-detail" *ngIf="report.horometro_inicial">
                    <i class="fa-solid fa-gauge"></i>
                    Horómetro: {{ report.horometro_inicial }} → {{ report.horometro_final }}
                  </div>
                  <div class="card-meta">
                    Guardado: {{ formatTimeAgo(report.timestamp) }}
                    · Intentos: {{ report.syncAttempts }}/5
                  </div>
                </div>
                <div class="card-actions">
                  <app-button
                    variant="danger"
                    size="sm"
                    icon="fa-trash"
                    label="Eliminar"
                    (clicked)="deleteReport(report)"
                  ></app-button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Dead Letters Section -->
      @if (deadLetters().length > 0) {
        <div class="section">
          <div class="section-header">
            <h3><i class="fa-solid fa-triangle-exclamation"></i> Fallidos (requieren atención)</h3>
            <app-button
              variant="warning"
              icon="fa-rotate"
              label="Reintentar todos"
              [disabled]="isSyncing() || !isOnline()"
              (clicked)="retryAll()"
            ></app-button>
          </div>

          <div class="report-cards">
            @for (report of deadLetters(); track report.id) {
              <div class="report-card dead-letter" [attr.data-testid]="'dead-letter-' + report.id">
                <div class="card-header">
                  <span class="card-date">
                    <i class="fa-solid fa-calendar"></i>
                    {{ report.fecha_parte || 'Sin fecha' }}
                  </span>
                  <aero-badge variant="error">Fallido</aero-badge>
                </div>
                <div class="card-body">
                  <div class="card-detail">
                    <i class="fa-solid fa-truck"></i>
                    Equipo #{{ report.equipo_id }}
                  </div>
                  <div class="card-detail" *ngIf="report.horometro_inicial">
                    <i class="fa-solid fa-gauge"></i>
                    Horómetro: {{ report.horometro_inicial }} → {{ report.horometro_final }}
                  </div>
                  <div class="card-meta">
                    Falló: {{ formatTimeAgo(report.deadLetteredAt) }}
                    · {{ report.syncAttempts }} intentos agotados
                  </div>
                </div>
                <div class="card-actions">
                  <app-button
                    variant="primary"
                    size="sm"
                    icon="fa-rotate"
                    label="Reintentar"
                    [disabled]="isSyncing() || !isOnline()"
                    (clicked)="retryOne(report)"
                  ></app-button>
                  <app-button
                    variant="danger"
                    size="sm"
                    icon="fa-trash"
                    label="Eliminar"
                    (clicked)="deleteReport(report)"
                  ></app-button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (pendingReports().length === 0 && deadLetters().length === 0) {
        <div class="empty-state" data-testid="empty-state">
          <i class="fa-solid fa-circle-check empty-icon"></i>
          <h3>Todo sincronizado</h3>
          <p>No hay reportes pendientes. Todos los datos están al día.</p>
          <app-button
            variant="primary"
            icon="fa-plus"
            label="Nuevo Parte Diario"
            routerLink="/operator/daily-report"
          ></app-button>
        </div>
      }

      <!-- Syncing overlay -->
      @if (isSyncing()) {
        <div class="syncing-overlay">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <span>Sincronizando...</span>
        </div>
      }
    </app-page-layout>
  `,
  styles: [`
    .subtitle {
      color: var(--grey-500);
      margin: 0 0 24px 0;
    }

    .section {
      margin-top: 24px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--grey-700);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .report-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .report-card {
      background: var(--neutral-0);
      border-radius: var(--radius-md);
      border: 1px solid var(--grey-200);
      padding: 16px;
      transition: box-shadow 0.2s;
    }

    .report-card:hover {
      box-shadow: var(--shadow-sm);
    }

    .report-card.pending {
      border-left: 4px solid var(--warning-500, #f59e0b);
    }

    .report-card.dead-letter {
      border-left: 4px solid var(--error-500, #ef4444);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .card-date {
      font-weight: 600;
      color: var(--grey-700);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card-body {
      margin-bottom: 12px;
    }

    .card-detail {
      color: var(--grey-600);
      font-size: 14px;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card-detail i {
      width: 16px;
      text-align: center;
      color: var(--grey-400);
    }

    .card-meta {
      font-size: 13px;
      color: var(--grey-400);
      margin-top: 8px;
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid var(--grey-100);
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--grey-500);
    }

    .empty-icon {
      font-size: 48px;
      color: var(--success-500, #22c55e);
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: var(--grey-700);
    }

    .empty-state p {
      margin: 0 0 24px 0;
    }

    .syncing-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: var(--primary-50, #eff6ff);
      border-radius: var(--radius-md);
      color: var(--primary-700, #1d4ed8);
      font-weight: 500;
      margin-top: 16px;
    }
  `],
})
export class OperatorPendingReportsComponent implements OnInit, OnDestroy {
  private syncManager = inject(SyncManager);
  private swService = inject(ServiceWorkerService);

  pendingReports = signal<PendingReport[]>([]);
  deadLetters = signal<PendingReport[]>([]);
  isSyncing = signal(false);
  isOnline = signal(navigator.onLine);

  statItems = computed<StatItem[]>(() => [
    {
      label: 'Pendientes',
      value: this.pendingReports().length,
      icon: 'fa-clock',
      color: 'warning',
    },
    {
      label: 'Fallidos',
      value: this.deadLetters().length,
      icon: 'fa-triangle-exclamation',
      color: 'error',
    },
    {
      label: 'Total en cola',
      value: this.pendingReports().length + this.deadLetters().length,
      icon: 'fa-layer-group',
      color: 'info',
    },
  ]);

  private checkInterval: ReturnType<typeof setInterval> | undefined;
  private onlineHandler = () => this.isOnline.set(true);
  private offlineHandler = () => this.isOnline.set(false);

  ngOnInit() {
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    this.loadReports();
    this.checkInterval = setInterval(() => this.loadReports(), 5000);
  }

  ngOnDestroy() {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
    if (this.checkInterval) clearInterval(this.checkInterval);
  }

  async loadReports() {
    try {
      const pending = await this.syncManager.getPendingReports();
      this.pendingReports.set(pending.map((r) => r as unknown as PendingReport));

      const dead = await this.syncManager.getDeadLetters();
      this.deadLetters.set(dead.map((r) => r as unknown as PendingReport));
    } catch {
      // IndexedDB may not be initialized
    }
  }

  async syncAll() {
    if (!this.isOnline() || this.isSyncing()) return;
    this.isSyncing.set(true);
    try {
      await this.swService.syncPendingReports();
      await this.loadReports();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      this.isSyncing.set(false);
    }
  }

  async retryOne(report: PendingReport) {
    if (!this.isOnline() || this.isSyncing()) return;
    this.isSyncing.set(true);
    try {
      await this.syncManager.retryDeadLetter(report.id);
      await this.swService.syncPendingReports();
      await this.loadReports();
    } catch (e) {
      console.error('Retry failed:', e);
    } finally {
      this.isSyncing.set(false);
    }
  }

  async retryAll() {
    if (!this.isOnline() || this.isSyncing()) return;
    this.isSyncing.set(true);
    try {
      const deadLetters = await this.syncManager.getDeadLetters();
      for (const dl of deadLetters) {
        await this.syncManager.retryDeadLetter(dl['id'] as number);
      }
      await this.swService.syncPendingReports();
      await this.loadReports();
    } catch (e) {
      console.error('Retry all failed:', e);
    } finally {
      this.isSyncing.set(false);
    }
  }

  async deleteReport(report: PendingReport) {
    if (!confirm('¿Eliminar este reporte? Esta acción no se puede deshacer.')) return;
    try {
      await this.syncManager.deleteSyncedReport(report.id);
      await this.syncManager.deletePhotosForReport(report.id);
      await this.loadReports();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  }

  formatTimeAgo(timestamp: number | null): string {
    if (!timestamp) return 'desconocido';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'hace unos segundos';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  }
}
```

IMPORTANT: Check that `app-button` component accepts `size="sm"` — if not, remove the `size` prop. Also check that `StatsGridComponent` `StatItem` interface supports `color` field — if not, adjust to match the actual interface. Read the actual component files to verify before writing code.

**Step 2: Verify the component compiles**

Run: `docker-compose logs -f frontend 2>&1 | head -5` (check for build errors after save)

**Step 3: Commit**

```
git commit -m "feat(operator): add pending reports recovery page (ws-33)

New /operator/pending-reports page showing offline-queued reports.
Operators can view, retry dead letters, and delete queued reports.
Polls IndexedDB every 5s for updates."
```

---

### Task 2: Add route and navigation links

**Files:**
- Modify: `frontend/src/app/app.routes.ts:308-321` (add pending-reports route)
- Modify: `frontend/src/app/features/operator/operator-layout.component.ts:29-36` (add nav link)

**Step 1: Add route to app.routes.ts**

In the operator children array (around line 314, after the `history` route), add:

```typescript
{
  path: 'pending-reports',
  loadComponent: () =>
    import('./features/operator/pending-reports/operator-pending-reports.component').then(
      (m) => m.OperatorPendingReportsComponent
    ),
},
```

**Step 2: Add nav link to operator-layout.component.ts**

In the `sidebar-nav` section (after the "Historial" link, before "Perfil"), add:

```html
<a routerLink="/operator/pending-reports" routerLinkActive="active" class="nav-item">
  <i class="fa-solid fa-clock-rotate-left nav-icon"></i>
  <span class="label">Pendientes</span>
</a>
```

**Step 3: Verify frontend builds**

Check `docker-compose logs -f frontend` — should rebuild with no errors.

**Step 4: Commit**

```
git commit -m "feat(operator): add pending-reports route and nav link"
```

---

### Task 3: Add conditional card to operator dashboard

**Files:**
- Modify: `frontend/src/app/features/operator/dashboard/operator-dashboard.component.ts`

**Step 1: Add SyncManager import and pending count signal**

Add imports:
```typescript
import { SyncManager } from '../../../core/services/sync-manager.service';
```

Add to class:
```typescript
private syncManager = inject(SyncManager);
pendingCount = signal(0);
```

In `ngOnInit`, add:
```typescript
this.syncManager.getPendingCount().then(c => this.pendingCount.set(c));
this.syncManager.getDeadLetterCount().then(c => this.pendingCount.update(v => v + c));
```

**Step 2: Add conditional action card in template**

In the `quick-actions` div, after the "Ver Historial" card, add:

```html
@if (pendingCount() > 0) {
  <a routerLink="/operator/pending-reports" class="action-card warning">
    <i class="fa-solid fa-clock-rotate-left action-icon"></i>
    <div class="content">
      <h3>{{ pendingCount() }} Pendientes</h3>
      <p>Reportes sin sincronizar</p>
    </div>
  </a>
}
```

**Step 3: Add warning card CSS**

Add to styles (find the `.action-card` styles section):

```css
.action-card.warning {
  border-color: var(--warning-500, #f59e0b);
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.action-card.warning .action-icon {
  color: var(--warning-600, #d97706);
}
```

IMPORTANT: Check the existing `.action-card` styles to match the pattern (border vs background approach).

**Step 4: Add `signal` to imports from `@angular/core`**

Check if `signal` is already imported; if not add it.

**Step 5: Commit**

```
git commit -m "feat(operator): show pending reports card on dashboard when offline queue has items"
```

---

### Task 4: Add "Ver detalles" link to offline indicator

**Files:**
- Modify: `frontend/src/app/shared/components/offline-indicator/offline-indicator.component.ts`

**Step 1: Add Router import**

Add `Router` import and inject:
```typescript
import { Router } from '@angular/router';
// in class:
private router = inject(Router);
```

**Step 2: Add "Ver detalles" link to pending badge template**

In the `pending-badge` div, after the text spans, add:

```html
<span class="details-link" (click)="goToDetails($event)">(ver detalles)</span>
```

**Step 3: Add navigation method**

```typescript
goToDetails(event: Event) {
  event.stopPropagation(); // Don't trigger syncNow
  this.router.navigate(['/operator/pending-reports']);
}
```

**Step 4: Add CSS for details link**

```css
.details-link {
  text-decoration: underline;
  cursor: pointer;
  opacity: 0.8;
  font-size: 12px;
  margin-left: 4px;
}

.details-link:hover {
  opacity: 1;
}
```

**Step 5: Commit**

```
git commit -m "feat(offline): add 'ver detalles' link to offline indicator badge"
```

---

### Task 5: Verify and final commit

**Step 1: Rebuild docker**

Run: `docker-compose up -d --build`

**Step 2: Check frontend logs**

Run: `docker-compose logs -f frontend` — no build errors

**Step 3: Check backend logs**

Run: `docker-compose logs -f backend` — no errors

**Step 4: Navigate to the page in browser**

Open: http://localhost:3420/operator/pending-reports
Expected: Empty state with "Todo sincronizado" message + "Nuevo Parte Diario" button

Verify:
- Stats grid shows 0/0/0
- Nav sidebar shows "Pendientes" link
- Click "Pendientes" highlights active

**Step 5: Final verification commit (if any fixes needed)**

```
git commit -m "fix(operator): ws-33 offline recovery UI adjustments"
```

---

## Verification Checklist

- [ ] `/operator/pending-reports` route loads the component
- [ ] Empty state shows "Todo sincronizado" when no pending reports
- [ ] Sidebar shows "Pendientes" nav link with correct icon
- [ ] Dashboard shows conditional "Pendientes" card only when count > 0
- [ ] Offline indicator has "ver detalles" link navigating to pending-reports
- [ ] Frontend builds without errors
- [ ] Stats grid displays correct counts
- [ ] data-testid attributes present for testing
