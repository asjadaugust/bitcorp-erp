# BitCorp ERP — Workstream Tracker

**Last updated:** 2026-02-28
**Backend tests:** 709 passing (37 suites)

---

## Completed Workstreams (WS-1 through WS-38 + Session Work)

### Core Equipment & Operations (WS-1 to WS-10)

| WS | Feature | Scope |
|----|---------|-------|
| 1 | Document Expiry Alerts (#32) | Auto-notification when operator/equipment docs near expiration |
| 2 | Valuation Deadline Alerts (#14) | Notifications for upcoming valuation deadlines |
| 3 | Payment Mora Tracking (#23) | Late payment tracking with penalty calculations |
| 4 | Daily Report Reception (#10) | Track reception state of daily operator reports |
| 5 | Contract PDF (#19) | PDF generation for contracts via Puppeteer |
| 6 | Resident Signature (#34) | Digital signature capture for field engineers |
| 7 | es_propio Flag (#35) | Own vs. rented equipment distinction |
| 8 | Equipment Dashboard (#41) | Fleet overview with KPIs and status cards |
| 9 | Email Notifications (#38) | SMTP-based email dispatch for critical alerts |
| 10 | Equipment Inspection (#11) | Pre-use inspection forms and tracking |

### Equipment Lifecycle (WS-11 to WS-13)

| WS | Feature | Entity / Route | Code |
|----|---------|---------------|------|
| 11 | Solicitud de Equipo (#1) | `equipo.solicitud_equipo` / `/api/solicitudes-equipo` | SEQ-NNNN |
| 12 | Acta de Devolución (#12, #45) | `equipo.acta_devolucion` / `/api/actas-devolucion` | ADV-NNNN |
| 13 | Orden de Alquiler (#4) | `equipo.orden_alquiler` / `/api/ordenes-alquiler` | OAL-NNNN |

### Business Logic & Rules (WS-15 to WS-23)

| WS | Feature | Key Details |
|----|---------|-------------|
| 15 | Discount Rules Engine (#28-31) | STAND_BY, AVERIA, CLIMATICO subtypes with proportional/daily calc |
| 16 | Contract Lifecycle (#20, #42) | ACTIVO/VENCIDO → RESUELTO → LIQUIDADO state machine |
| 17 | Inoperability Penalty (#40) | `equipo.periodo_inoperatividad`, 5-day threshold |
| 18 | Equipment Categorization (#44) | `equipo.tipo_equipo`, 4 PRD categories, 28 types seeded |
| 19 | Precalentamiento Config (#27) | Per-tipo_equipo warm-up hours, auto-apply in reports |
| 20 | PDF Parte Diario (#33) | Handlebars template, 5 signature fields |
| 21 | Obligaciones del Arrendador (#21) | 9 obligation types, PENDIENTE/CUMPLIDA/INCUMPLIDA |
| 22 | Obligaciones del Arrendatario (#22) | 4 obligation types per Cláusula 8 |
| 23 | Vale de Combustible (#9) | `equipo.vale_combustible`, code VCB-NNNN, 5 fuel types |

### UI & Analytics (WS-24 to WS-26)

| WS | Feature | Key Details |
|----|---------|-------------|
| 24 | Notifications Bell | Bell icon, dropdown, `/notificaciones` page, 60s polling |
| 25 | Analytics Dashboard | 3 tabs: Fleet, Utilization, Fuel; 5 backend endpoints |
| 26 | Operator Performance & Availability | `rrhh.disponibilidad_operador`, monthly calendar, performance metrics |

### Infrastructure & Cleanup (WS-27 to WS-30)

| WS | Feature | Key Details |
|----|---------|-------------|
| 27 | Fuel Records Retired + Manipuleo Config | Deleted orphaned FuelRecord; added `equipo.configuracion_combustible` |
| 28 | Photo Gallery UI | Lightbox viewer for daily report photos |
| 29 | Payment Record Excel Export | ExcelExportService wiring, fixed DTO fields |
| 30 | Operator Profile API Integration | Certifications, skills, availability, performance endpoints |

### Advanced Features (WS-31 to WS-38)

| WS | Feature | Key Details |
|----|---------|-------------|
| 31b | Checklist Frequency Enforcement | Daily/weekly rules, overdue inspections endpoint |
| 32b | Contract Notarial Legalization | 4-step flow: PENDIENTE_FIRMA → EN_ENVIO → PENDIENTE_LEGAL → LEGALIZADO |
| 33 | Offline Recovery UI | Dead-letter queue, exponential backoff, IndexedDB sync |
| 34 | Provider Comparison Matrix | `equipo.cotizacion_proveedor`, code COT-NNNN, min 2 quotes rule |
| 35 | Flexible Approval Engine | Template-based + ad-hoc approval workflows |
| 38 | Manual Deduction Line Items | Valuations: custom deduction rows |

### Session 2026-02-28 Completions

| Story | Feature | Key Details |
|-------|---------|-------------|
| #25 | Modalidades Servida Enum | `ModalidadContrato` type: alquiler_seco, alquiler_con_operador, alquiler_todo_costo, servicio. `@IsIn()` validation. |
| #33 | PDF Parte Diario Format Alignment | All 4 checkbox sections in `daily-report.hbs` corrected to match frontend form labels |
| #45 | Acta Entrega Equipo | Full CRUD: `equipo.acta_entrega`, code AEN-NNNN, PDF generation, state machine BORRADOR→PENDIENTE→FIRMADO |
| Phase 21 | Multi-Tenant Filtering | 230+ TODOs resolved across 26 services + controllers. All queries now filter by `tenantId`. |

---

## Remaining Stories

### Tier 1: Production-Ready Cleanup

| Story | Feature | Effort | Notes |
|-------|---------|--------|-------|
| Frontend TODOs | 3 items remaining | < 1 day | `main.ts` service worker, `daily-report` load last values, `periodo-inoperatividad-form` error handling |

### Tier 2: P2 Features (High Business Value)

| Story | Feature | Effort | Notes |
|-------|---------|--------|-------|
| #1 | Requerimiento de Equipo (CORP-LA-F-001) | 5-8 days | Full CRUD module — formal approval flow for equipment requests |
| #5 | Checklist Pre-Uso / Incorporación Gate | 3-5 days | Block equipment deployment until pre-use checklist completed |

### Tier 3: P3 Features

| Story | Feature | Effort | Notes |
|-------|---------|--------|-------|
| #43 | Reportes Cumplimiento Normativo | 3-5 days | Compliance dashboard over existing docs/checklists |
| #15 | Flujo Informe Gastos de Obra | 3-5 days | WorkExpense entity exists, needs service/controller/routes |
| #16 | Flujo Informe Adelantos | 3-5 days | AdvanceAmortization entity exists, needs service/controller/routes |
| #36 | Tipo de Cambio Automático (USD) | 3-5 days | Daily exchange rate for USD-denominated valuations |
| WS-33b | Operator Mobile Report (Full PWA) | 5-8 days | Complete offline-first PWA with service worker sync |

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Completed workstreams | 38+ | All passing (709 tests) |
| Session completions (2026-02-28) | 4 | #25, #33, #45, Phase 21 |
| Remaining cleanup | 1 | Frontend TODOs |
| Remaining P2 features | 2 | #1, #5 |
| Remaining P3 features | 5 | #43, #15, #16, #36, WS-33b |
| **Total remaining** | **8** | **~20-30 days estimated** |
