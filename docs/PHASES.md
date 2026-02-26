Feature Gap Analysis — BitCorp ERP

Here's a prioritized inventory of what can be implemented next, based on codebase exploration cross-referenced against the architecture:

---

✅ Already Complete (WS-1 through WS-23)

Equipment CRUD, Daily Reports + PDF, Maintenance, Contracts + lifecycle, Valuations, Solicitudes, Órdenes Alquiler, Actas Devolución, Vales Combustible, Inoperatividad, Tipos Equipo, Precalentamiento Config,
Document Expiry Alerts, Valuation Deadline Alerts, Payment Mora, Reception Tracking, Contract PDF, Resident Signature, es_propio flag, Equipment Dashboard, Email Notifications, Equipment Inspection, Discount
Rules Engine, Obligaciones Arrendador/Arrendatario.

---

🔴 P1 — Backend complete, no frontend at all

WS-24: Notifications Bell + Centro de Alertas

- Backend /api/notifications/ is fully implemented: getUserNotifications, markAsRead, markAllAsRead, deleteNotification
- There is zero frontend UI — no bell icon, no count badge, no panel
- Low effort, high UX value
- Deliverable: Bell icon in app header with unread badge → dropdown with recent alerts → link to full /notificaciones page

WS-25: Analytics Dashboard

- Backend /api/analytics/\* is fully wired to equipmentAnalyticsService
- Covers: equipment utilization by date range, utilization trend over time, fleet-wide utilization, fuel consumption metrics + trends, maintenance metrics
- There is no frontend page at all
- Deliverable: New "Analítica" section (or tab in Equipment Dashboard) with utilization charts, fuel trends, maintenance stats

---

🟡 P2 — Stub/partial backend + no UI

WS-26: Operator Performance & Availability

- OperatorController has 3 methods that return 501 Method not yet implemented:
  - searchBySkill() — TODO in OperatorService
  - getAvailability() — TODO in OperatorService
  - getPerformance() — TODO in OperatorService
- The availability matrix UI exists (/scheduling/operator-availability) but the save operation has a TODO and never calls the API
- Deliverable: Implement the 3 OperatorService methods + wire up the availability matrix save

WS-27: Fuel Records (legacy fuel/ module) cleanup or integration

- The old fuel/ module (FuelRecord entity, /api/fuel) is separate from the new vales-combustible (WS-23)
- The frontend fuel-list.component.ts, fuel-form.component.ts, fuel-detail.component.ts exist but are not in any route or navigation
- Decision needed: either wire it up alongside vales-combustible or retire it (it likely represents actual diesel dispensing records from the tank, vs. vales which are voucher documents)

---

🟠 P3 — Partial implementations to complete

WS-28: Photo / Attachment Management UI

- Backend routes exist: /api/reports/photo/ and /api/reports/photo-gallery
- No frontend component for photo upload, gallery viewing, or attachment browsing
- Daily report checklist form has a TODO: "Integrate with photo upload service"
- Deliverable: Photo upload in checklist form + gallery viewer in daily report detail

WS-29: Payment Excel Export

- Payment list has an Excel export button that shows TODO: Implement Excel export
- ExcelExportService already exists in the frontend
- Deliverable: Wire export button to the existing ExcelExportService

WS-30: Operator Profile API Integration

- The operator module (/features/operator/) has 4+ TODO comments:
  - profile.component.ts: "TODO: Load from API"
  - history.component.ts: "TODO: Filter by period", "TODO: Call API to delete"
- The component renders with hardcoded mock data
- Deliverable: Complete the API integration for operator profile and history

---

🔵 P4 — New modules not yet started

WS-31: Checklist Frequency Rules by Equipment Type

- PRD specifies: Vehículo liviano / equipo menor → daily checklist; Maquinaria pesada / vehículo pesado → weekly (Mondays)
- The TipoEquipo model (WS-18) provides the categoria_prd field needed to drive this
- Currently all checklists are manual — no frequency enforcement
- Deliverable: Add frecuencia rule per tipo_equipo category, auto-flag missing checklists

WS-32: Contract Notarial Legalization Flow

- PRD describes: send to provider → provider signs → send to central office → legal rep signs → return to project
- No tracking of this document flow exists
- Deliverable: Add legalizacion_notarial state tracking to contract (steps + timestamps + responsible users)

WS-33: Operator Daily Report (Mobile form)

- The /features/operator/daily-report/ component exists but has IndexedDB offline sync TODOs
- Currently the daily report is entered by the equipment manager
- PRD requires the operator to register it themselves (fuel, pre-warming, delays)
- Deliverable: Complete the operator-facing daily report form with offline capability

---

Summary Table

┌─────┬──────────────────────────────────────┬──────────┬────────┬─────────────────────┬──────────────────┐
│ WS │ Feature │ Effort │ Value │ Backend status │ Frontend status │
├─────┼──────────────────────────────────────┼──────────┼────────┼─────────────────────┼──────────────────┤
│ 24 │ Notifications Bell + Center │ Low │ High │ ✅ Complete │ ❌ None │
├─────┼──────────────────────────────────────┼──────────┼────────┼─────────────────────┼──────────────────┤
│ 25 │ Analytics Dashboard │ Medium │ High │ ✅ Complete │ ❌ None │
├─────┼──────────────────────────────────────┼──────────┼────────┼─────────────────────┼──────────────────┤
│ 26 │ Operator Availability/Performance │ Medium │ Medium │ ❌ Stub (3 methods) │ ⚠️ Partial │
├─────┼──────────────────────────────────────┼──────────┼────────┼─────────────────────┼──────────────────┤
│ 27 │ Fuel Records module (wire or retire) │ Low │ Low │ ✅ Complete │ ⚠️ Unlinked │
├─────┼──────────────────────────────────────┼──────────┼────────┼─────────────────────┼──────────────────┤
│ 28 │ Photo/Attachment UI │ Medium │ Medium │ ✅ Routes exist │ ❌ None │
├─────┼──────────────────────────────────────┼──────────┼────────┼─────────────────────┼──────────────────┤
│ 29 │ Payment Excel Export │ Very Low │ Low │ ✅ │ ⚠️ TODO button │
├─────┼──────────────────────────────────────┼──────────┼────────┼─────────────────────┼──────────────────┤
│ 30 │ Operator Profile API wiring │ Low │ Medium │ ✅ │ ⚠️ Mock data │
├─────┼──────────────────────────────────────┼──────────┼────────┼─────────────────────┼──────────────────┤
│ 31 │ Checklist Frequency by Type │ Medium │ Low │ ❌ │ ❌ │
├─────┼──────────────────────────────────────┼──────────┼────────┼─────────────────────┼──────────────────┤
│ 32 │ Contract Notarial Legalization │ Medium │ Medium │ ❌ │ ❌ │
├─────┼──────────────────────────────────────┼──────────┼────────┼─────────────────────┼──────────────────┤
│ 33 │ Operator Mobile Daily Report │ High │ Medium │ ✅ │ ⚠️ Offline TODOs │
└─────┴──────────────────────────────────────┴──────────┴────────┴─────────────────────┴──────────────────┘

---

My recommendation for next workstreams (in order):
You are a Product Owner who cares a lot about the consistency and User-Experience of the product, test the following:
```
1. WS-24 — Notifications (backend is done, just needs frontend bell + panel — quick win)
2. WS-25 — Analytics Dashboard (backend done, high management value)
3. WS-29 — Payment Excel Export (trivial, unblocks existing UI)
4. WS-30 — Operator Profile wiring (completes an existing feature)
5. WS-26 — Operator Availability/Performance (needs real OperatorService implementation)
```
Identify what works and what does not work, make a list of things that don't work and suggestions for improvements.

Navigate to the application, click around thoroughly and not down every details, make use of WebMCP and note down the console messages and docker-compose logs.

Focus on just making the list of things that dont work and suggestions for improvement only.


  4 stories remain implementable:

  ┌───────┬───────────────────────────────┬────────────────────────────────────┬─────────────────────────────────────────────┐
  │   #   │             Story             │               Status               │                   Effort                    │
  ├───────┼───────────────────────────────┼────────────────────────────────────┼─────────────────────────────────────────────┤
  │ WS-28 │ Photo/Attachment Backend      │ Frontend 90%, backend 20%          │ 2–3 days                                    │
  ├───────┼───────────────────────────────┼────────────────────────────────────┼─────────────────────────────────────────────┤
  │ WS-33 │ Operator Daily Report Offline │ Online works, offline not wired    │ 1–2 days (quick win) to 5–8 days (full PWA) │
  ├───────┼───────────────────────────────┼────────────────────────────────────┼─────────────────────────────────────────────┤
  │ WS-31 │ Checklist Frequency Rules     │ 30% — schema exists, no automation │ 5–7 days                                    │
  ├───────┼───────────────────────────────┼────────────────────────────────────┼─────────────────────────────────────────────┤
  │ WS-32 │ Contract Legalization Flow    │ 0% — nothing exists                │ 8–10 days                                   │
  └───────┴───────────────────────────────┴────────────────────────────────────┴─────────────────────────────────────────────┘