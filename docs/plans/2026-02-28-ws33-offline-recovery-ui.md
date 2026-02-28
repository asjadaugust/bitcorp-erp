# WS-33: Offline Recovery UI Design

Date: 2026-02-28

## Problem

Operators using the daily report form offline have no visibility into queued reports. The only indication is tiny emoji badges in the offline indicator bar. They can't see what's queued, why syncs failed, or manage individual reports.

## Solution

New `/operator/pending-reports` page showing offline-queued reports with retry/delete actions.

## Architecture

Single standalone component reading directly from IndexedDB via SyncManager. No backend changes needed — all data is client-side.

### Data Sources
- `SyncManager.getPendingReports()` — unsynced, non-dead-letter reports
- `SyncManager.getDeadLetters()` — reports that failed 5+ attempts
- `SyncManager.getPhotosForReport(id)` — photo count per report

### IndexedDB Record Fields Used
```
id, timestamp, synced, syncAttempts, lastSyncAttempt,
deadLetter, deadLetteredAt, fecha_parte, equipo_id,
trabajador_id, horometro_inicial, horometro_final, observaciones
```

## Component: OperatorPendingReportsComponent

**Route:** `/operator/pending-reports` (added to operator children in app.routes.ts)
**Role guard:** OPERADOR (same as other operator routes)

### Layout

```
<app-page-layout>
  <app-page-card title="Reportes Pendientes">

    <!-- Stats Grid: 3 cards -->
    [Pendientes: N]  [Fallidos: N]  [Fotos pendientes: N]

    <!-- Section 1: Pending Reports (if any) -->
    <h3>En cola de sincronización</h3>
    <div class="report-cards">
      For each pending report:
        ┌─────────────────────────────────────────┐
        │ 📋 15/02/2026 — Equipo EXC-001          │
        │ Horómetro: 1000 → 1009                  │
        │ Guardado: hace 2 horas · Intentos: 2/5  │
        │                          [Eliminar]      │
        └─────────────────────────────────────────┘
    </div>
    <aero-button (click)="syncAll()">Sincronizar todo</aero-button>

    <!-- Section 2: Dead Letters (if any) -->
    <h3>Fallidos (requieren atención)</h3>
    <div class="report-cards">
      For each dead letter:
        ┌─────────────────────────────────────────┐
        │ ⚠️ 14/02/2026 — Equipo CAT-003          │
        │ Horómetro: 5000 → 5008                  │
        │ Falló: hace 1 día · 5 intentos agotados │
        │                  [Reintentar] [Eliminar] │
        └─────────────────────────────────────────┘
    </div>
    <aero-button (click)="retryAll()">Reintentar todos</aero-button>

    <!-- Empty state -->
    <div *ngIf="noPending && noDeadLetters">
      ✅ No hay reportes pendientes. Todo sincronizado.
    </div>

  </app-page-card>
</app-page-layout>
```

### Actions
| Action | Method | Effect |
|--------|--------|--------|
| Sync All | `swService.syncPendingReports()` | Triggers sync for all pending |
| Retry single | `syncManager.retryDeadLetter(id)` then sync | Resets attempts, re-queues |
| Retry All | Loop `retryDeadLetter` for each, then sync | Re-queues all dead letters |
| Delete | `syncManager.deleteSyncedReport(id)` + `deletePhotosForReport(id)` | Removes from queue permanently |

### Signals
```typescript
pendingReports = signal<PendingReport[]>([]);
deadLetters = signal<PendingReport[]>([]);
pendingPhotoCount = signal<number>(0);
isSyncing = signal<boolean>(false);
```

### Refresh
Poll every 5 seconds (matching offline indicator frequency). Also refresh after any action.

### Interface
```typescript
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
}
```

## Integration Points

1. **Route:** Add to `app.routes.ts` operator children
2. **Dashboard:** Add card/link in `operator-dashboard.component.ts` (conditional: only show if pending > 0)
3. **Offline indicator:** Add "Ver detalles" link navigating to `/operator/pending-reports`
4. **Confirm dialog:** Use `<app-confirm-dialog>` for delete actions

## Not in Scope
- Editing queued reports (would need full form reconstruction from IndexedDB data)
- Photo preview in queue (blobs too large for list view)
- Mobile responsive redesign (separate story)
- New backend endpoints (all data is client-side IndexedDB)
