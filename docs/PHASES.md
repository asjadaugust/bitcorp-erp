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


Backend Migration

│ Plan to implement                                                                                                                                                                                                  │
│                                                                                                                                                                                                                    │
│ Backend Migration: Node.js/Express → Python/FastAPI                                                                                                                                                                │
│                                                                                                                                                                                                                    │
│ Context                                                                                                                                                                                                            │
│                                                                                                                                                                                                                    │
│ The BitCorp ERP backend is currently Node.js/TypeScript/Express (407 files, ~87K lines, 78 TypeORM entities, 709 tests). The developer is more productive in Python, needs Python's ML/data ecosystem for future   │
│ features (Celery, pandas, scikit-learn), and finds Pydantic + FastAPI superior to class-validator + Express. There is no production pressure — the app is in dev/staging.                                          │
│                                                                                                                                                                                                                    │
│ Goal: Full rewrite of the backend in Python/FastAPI, preserving the exact API contract so the Angular 19 frontend works unchanged.                                                                                 │
│                                                                                                                                                                                                                    │
│ Naming convention change: All Python code uses Spanish names exclusively. No English fallbacks (e.g., equipo not equipment, proveedor not provider, contrato not contract). API paths remain unchanged             │
│ (/api/equipment stays as-is for frontend compatibility, but internal code — models, services, variables — is 100% Spanish).                                                                                        │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Directory Layout                                                                                                                                                                                                   │
│                                                                                                                                                                                                                    │
│ - backend/ → Python/FastAPI (new primary backend)                                                                                                                                                                  │
│ - bff/ → Node.js/Express (existing backend, renamed, kept during transition)                                                                                                                                       │
│ - frontend/ → Angular 19 (unchanged)                                                                                                                                                                               │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Tech Stack                                                                                                                                                                                                         │
│                                                                                                                                                                                                                    │
│ ┌───────────────┬────────────────────────┬─────────────────────────────────────┐                                                                                                                                   │
│ │    Concern    │   Node.js (current)    │            Python (new)             │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Framework     │ Express 4.21           │ FastAPI >=0.115                     │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Server        │ Node built-in          │ Uvicorn (ASGI)                      │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ ORM           │ TypeORM 0.3            │ SQLAlchemy 2.0 (async)              │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ DB driver     │ pg                     │ asyncpg                             │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Migrations    │ TypeORM migrations     │ Alembic (future only)               │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Validation    │ class-validator        │ Pydantic v2                         │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Config        │ dotenv                 │ pydantic-settings                   │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ JWT           │ jsonwebtoken           │ python-jose                         │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Password      │ bcrypt                 │ passlib[bcrypt]                     │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Redis         │ redis v4               │ redis[hiredis] v5                   │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ PDF           │ Puppeteer + Handlebars │ Playwright + Jinja2                 │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ PDF merge     │ pdf-lib                │ pypdf                               │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Excel         │ ExcelJS                │ openpyxl                            │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ CSV           │ json2csv               │ stdlib csv                          │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Cron          │ node-cron              │ APScheduler                         │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Email         │ nodemailer             │ aiosmtplib                          │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Logging       │ winston                │ structlog                           │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Upload        │ multer                 │ python-multipart (FastAPI built-in) │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ OpenAPI       │ swagger-ui-express     │ FastAPI built-in                    │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Testing       │ Jest                   │ pytest + pytest-asyncio             │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Linting       │ ESLint + Prettier      │ ruff                                │                                                                                                                                   │
│ ├───────────────┼────────────────────────┼─────────────────────────────────────┤                                                                                                                                   │
│ │ Type checking │ TypeScript             │ mypy (optional)                     │                                                                                                                                   │
│ └───────────────┴────────────────────────┴─────────────────────────────────────┘                                                                                                                                   │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Project Structure                                                                                                                                                                                                  │
│                                                                                                                                                                                                                    │
│ backend/                                                                                                                                                                                                           │
│ ├── alembic/                    # Future migrations only (DB already exists)                                                                                                                                       │
│ │   ├── alembic.ini                                                                                                                                                                                                │
│ │   ├── env.py                                                                                                                                                                                                     │
│ │   └── versions/                                                                                                                                                                                                  │
│ ├── app/                                                                                                                                                                                                           │
│ │   ├── main.py                 # FastAPI app factory, lifespan events, health check                                                                                                                               │
│ │   ├── config/                                                                                                                                                                                                    │
│ │   │   ├── settings.py         # pydantic-settings (DB, Redis, JWT, SMTP, CORS)                                                                                                                                   │
│ │   │   ├── database.py         # SQLAlchemy async engine + sessionmaker                                                                                                                                           │
│ │   │   ├── redis.py            # Async Redis client                                                                                                                                                               │
│ │   │   └── logging.py          # structlog config                                                                                                                                                                 │
│ │   ├── core/                                                                                                                                                                                                      │
│ │   │   ├── seguridad.py        # JWT encode/decode, password hashing                                                                                                                                              │
│ │   │   ├── dependencias.py     # Depends: obtener_db, obtener_usuario_actual, obtener_tenant                                                                                                                      │
│ │   │   ├── roles.py            # ROLES dict, role hierarchy                                                                                                                                                       │
│ │   │   └── excepciones.py      # NoEncontradoError, ConflictoError, ValidacionError, etc.                                                                                                                         │
│ │   ├── middleware/                                                                                                                                                                                                │
│ │   │   ├── error_handler.py    # Global → {success: false, error: {...}}                                                                                                                                          │
│ │   │   ├── request_logger.py   # Correlation ID, structlog                                                                                                                                                        │
│ │   │   └── tenant.py           # id_empresa from JWT → tenant context                                                                                                                                             │
│ │   ├── modelos/                # SQLAlchemy models (Spanish names, grouped by schema)                                                                                                                             │
│ │   │   ├── base.py             # DeclarativeBase, common mixins                                                                                                                                                   │
│ │   │   ├── sistema.py          # Usuario, Rol, Permiso                                                                                                                                                            │
│ │   │   ├── equipo.py           # Equipo, Contrato, Valorizacion, ParteDiario, etc.                                                                                                                                │
│ │   │   ├── rrhh.py             # Trabajador, CertificacionOperador, etc.                                                                                                                                          │
│ │   │   ├── proyectos.py        # Proyecto, EDT                                                                                                                                                                    │
│ │   │   ├── logistica.py        # Producto, Movimiento                                                                                                                                                             │
│ │   │   ├── proveedores.py      # Proveedor, ContactoProveedor, InfoFinanciera                                                                                                                                     │
│ │   │   ├── administracion.py   # CentroCosto, CuentaPorPagar                                                                                                                                                      │
│ │   │   ├── sst.py              # IncidenteSeguridad, PlantillaChecklist                                                                                                                                           │
│ │   │   └── publico.py          # Notificacion, DocumentoSig, Licitacion                                                                                                                                           │
│ │   ├── esquemas/               # Pydantic v2 schemas (= DTOs)                                                                                                                                                     │
│ │   │   ├── comunes.py          # RespuestaApi[T], RespuestaPaginada[T]                                                                                                                                            │
│ │   │   ├── auth.py             # LoginSolicitud, LoginRespuesta, TokenPayload                                                                                                                                     │
│ │   │   ├── equipo.py           # EquipoListaDto, EquipoCrear, etc.                                                                                                                                                │
│ │   │   ├── contrato.py                                                                                                                                                                                            │
│ │   │   ├── valorizacion.py                                                                                                                                                                                        │
│ │   │   ├── parte_diario.py                                                                                                                                                                                        │
│ │   │   ├── operador.py                                                                                                                                                                                            │
│ │   │   ├── proveedor.py                                                                                                                                                                                           │
│ │   │   ├── proyecto.py                                                                                                                                                                                            │
│ │   │   └── ...                 # One per domain                                                                                                                                                                   │
│ │   ├── api/                    # FastAPI routers                                                                                                                                                                  │
│ │   │   ├── router.py           # Main APIRouter aggregator                                                                                                                                                        │
│ │   │   ├── auth.py                                                                                                                                                                                                │
│ │   │   ├── equipos.py                                                                                                                                                                                             │
│ │   │   ├── contratos.py                                                                                                                                                                                           │
│ │   │   ├── valorizaciones.py                                                                                                                                                                                      │
│ │   │   ├── reportes.py                                                                                                                                                                                            │
│ │   │   ├── operadores.py                                                                                                                                                                                          │
│ │   │   ├── proveedores.py                                                                                                                                                                                         │
│ │   │   ├── proyectos.py                                                                                                                                                                                           │
│ │   │   └── ...                                                                                                                                                                                                    │
│ │   ├── servicios/              # Business logic (Spanish)                                                                                                                                                         │
│ │   │   ├── equipo.py                                                                                                                                                                                              │
│ │   │   ├── contrato.py                                                                                                                                                                                            │
│ │   │   ├── valorizacion.py                                                                                                                                                                                        │
│ │   │   ├── reporte.py                                                                                                                                                                                             │
│ │   │   ├── pdf.py              # Playwright + Jinja2                                                                                                                                                              │
│ │   │   ├── cache.py            # Redis                                                                                                                                                                            │
│ │   │   ├── correo.py           # Email                                                                                                                                                                            │
│ │   │   ├── exportar.py         # Excel/CSV                                                                                                                                                                        │
│ │   │   └── cron.py             # APScheduler                                                                                                                                                                      │
│ │   ├── plantillas/             # Jinja2 PDF templates (converted from HBS)                                                                                                                                        │
│ │   │   ├── parte-diario.html                                                                                                                                                                                      │
│ │   │   ├── valorizacion-*.html                                                                                                                                                                                    │
│ │   │   ├── contrato.html                                                                                                                                                                                          │
│ │   │   ├── acta-entrega.html                                                                                                                                                                                      │
│ │   │   └── estilos/                                                                                                                                                                                               │
│ │   └── utils/                                                                                                                                                                                                     │
│ │       ├── respuesta.py        # send_success, send_error helpers                                                                                                                                                 │
│ │       └── reglas_descuento.py # Discount rules engine                                                                                                                                                            │
│ ├── tests/                                                                                                                                                                                                         │
│ │   ├── conftest.py             # Fixtures: async db, test client, auth helpers                                                                                                                                    │
│ │   ├── test_auth.py                                                                                                                                                                                               │
│ │   ├── test_equipos.py                                                                                                                                                                                            │
│ │   └── ...                                                                                                                                                                                                        │
│ ├── pyproject.toml                                                                                                                                                                                                 │
│ ├── Dockerfile                                                                                                                                                                                                     │
│ └── .env.example                                                                                                                                                                                                   │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Spanish Naming Rules                                                                                                                                                                                               │
│                                                                                                                                                                                                                    │
│ ┌────────────────────────┬───────────────────────────────────┬───────────────────────────────────────────────────┐                                                                                                 │
│ │         Layer          │            Convention             │                      Example                      │                                                                                                 │
│ ├────────────────────────┼───────────────────────────────────┼───────────────────────────────────────────────────┤                                                                                                 │
│ │ SQLAlchemy model class │ PascalCase Spanish                │ Equipo, Contrato, Valorizacion                    │                                                                                                 │
│ ├────────────────────────┼───────────────────────────────────┼───────────────────────────────────────────────────┤                                                                                                 │
│ │ Model column/property  │ snake_case Spanish                │ fecha_inicio, precio_unitario                     │                                                                                                 │
│ ├────────────────────────┼───────────────────────────────────┼───────────────────────────────────────────────────┤                                                                                                 │
│ │ Pydantic schema class  │ PascalCase Spanish                │ EquipoCrear, ContratoListaDto                     │                                                                                                 │
│ ├────────────────────────┼───────────────────────────────────┼───────────────────────────────────────────────────┤                                                                                                 │
│ │ Schema field           │ snake_case Spanish                │ codigo_equipo, estado                             │                                                                                                 │
│ ├────────────────────────┼───────────────────────────────────┼───────────────────────────────────────────────────┤                                                                                                 │
│ │ Service class          │ PascalCase Spanish                │ ServicioEquipo, ServicioContrato                  │                                                                                                 │
│ ├────────────────────────┼───────────────────────────────────┼───────────────────────────────────────────────────┤                                                                                                 │
│ │ Service method         │ snake_case Spanish                │ listar(), obtener_por_id(), crear(), actualizar() │                                                                                                 │
│ ├────────────────────────┼───────────────────────────────────┼───────────────────────────────────────────────────┤                                                                                                 │
│ │ Router function        │ snake_case Spanish                │ listar_equipos(), crear_contrato()                │                                                                                                 │
│ ├────────────────────────┼───────────────────────────────────┼───────────────────────────────────────────────────┤                                                                                                 │
│ │ API URL paths          │ Keep existing for frontend compat │ /api/equipment, /api/contracts                    │                                                                                                 │
│ ├────────────────────────┼───────────────────────────────────┼───────────────────────────────────────────────────┤                                                                                                 │
│ │ Variables, params      │ snake_case Spanish                │ tenant_id, usuario_id, pagina, limite             │                                                                                                 │
│ ├────────────────────────┼───────────────────────────────────┼───────────────────────────────────────────────────┤                                                                                                 │
│ │ Exceptions             │ PascalCase Spanish                │ NoEncontradoError, ConflictoError                 │                                                                                                 │
│ ├────────────────────────┼───────────────────────────────────┼───────────────────────────────────────────────────┤                                                                                                 │
│ │ Directory names        │ Spanish                           │ modelos/, servicios/, esquemas/, plantillas/      │                                                                                                 │
│ └────────────────────────┴───────────────────────────────────┴───────────────────────────────────────────────────┘                                                                                                 │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Migration Phases                                                                                                                                                                                                   │
│                                                                                                                                                                                                                    │
│ Phase 0: Foundation (Week 1-2)                                                                                                                                                                                     │
│                                                                                                                                                                                                                    │
│ Create the Python project scaffold and core infrastructure.                                                                                                                                                        │
│                                                                                                                                                                                                                    │
│ Files to create:                                                                                                                                                                                                   │
│ - backend/pyproject.toml — all dependencies                                                                                                                                                                        │
│ - backend/Dockerfile                                                                                                                                                                                               │
│ - backend/app/main.py — FastAPI app + health check                                                                                                                                                                 │
│ - backend/app/config/settings.py — pydantic-settings                                                                                                                                                               │
│ - backend/app/config/database.py — SQLAlchemy async engine → same PostgreSQL                                                                                                                                       │
│ - backend/app/config/redis.py — async Redis client                                                                                                                                                                 │
│ - backend/app/core/seguridad.py — JWT (same secret as Node), password hashing                                                                                                                                      │
│ - backend/app/core/dependencias.py — obtener_db, obtener_usuario_actual, requerir_roles()                                                                                                                          │
│ - backend/app/core/roles.py — ROLES dict matching Node's types/roles.ts                                                                                                                                            │
│ - backend/app/core/excepciones.py — error classes                                                                                                                                                                  │
│ - backend/app/middleware/error_handler.py — global exception → {success: false, error: {...}}                                                                                                                      │
│ - backend/app/middleware/request_logger.py — correlation ID                                                                                                                                                        │
│ - backend/app/middleware/tenant.py — tenant context                                                                                                                                                                │
│ - backend/app/esquemas/comunes.py — RespuestaApi[T], RespuestaPaginada[T]                                                                                                                                          │
│ - backend/app/utils/respuesta.py — helper functions                                                                                                                                                                │
│ - backend/app/modelos/base.py — DeclarativeBase + common mixins                                                                                                                                                    │
│ - backend/tests/conftest.py — pytest fixtures                                                                                                                                                                      │
│ - Docker-compose: add python-backend service on port 3410                                                                                                                                                          │
│                                                                                                                                                                                                                    │
│ Verification: GET http://localhost:3410/health returns {status: "OK"} and pings DB + Redis.                                                                                                                        │
│                                                                                                                                                                                                                    │
│ Critical reference files:                                                                                                                                                                                          │
│ - bff/src/utils/api-response.ts — response contract to replicate exactly                                                                                                                                           │
│ - bff/src/middleware/auth.middleware.ts — JWT verification logic                                                                                                                                                   │
│ - bff/src/types/roles.ts — role definitions                                                                                                                                                                        │
│ - bff/src/config/database.config.ts — DB connection params + all 78 entity registrations                                                                                                                           │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Phase 1: Auth + Simple CRUD (Week 3-4)                                                                                                                                                                             │
│                                                                                                                                                                                                                    │
│ Prove the full stack works: login → JWT → tenant → service → DB → DTO → response.                                                                                                                                  │
│                                                                                                                                                                                                                    │
│ Modules:                                                                                                                                                                                                           │
│ - Auth (login, me, refresh)                                                                                                                                                                                        │
│ - Tipos de Equipo (simple CRUD, 1 entity)                                                                                                                                                                          │
│ - Precalentamiento Config (simple CRUD, 1 entity)                                                                                                                                                                  │
│ - Combustible Config (simple CRUD, 1 entity)                                                                                                                                                                       │
│ - Cost Centers (simple CRUD)                                                                                                                                                                                       │
│ - Users (list/detail)                                                                                                                                                                                              │
│                                                                                                                                                                                                                    │
│ Key risk: JWT interoperability — tokens from Python must work on Node endpoints and vice versa. Test cross-backend auth first.                                                                                     │
│                                                                                                                                                                                                                    │
│ Verification: Log in via Python, use token on Node /api/equipment → works. Add nginx routing for migrated modules.                                                                                                 │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Phase 2: Core Equipment Domain (Week 5-8)                                                                                                                                                                          │
│                                                                                                                                                                                                                    │
│ The heart of the ERP — the hardest phase.                                                                                                                                                                          │
│                                                                                                                                                                                                                    │
│ Modules:                                                                                                                                                                                                           │
│ - Equipment (CRUD + filters + Excel export)                                                                                                                                                                        │
│ - Contracts (state machine: ACTIVO→RESUELTO→LIQUIDADO, obligaciones, legalization)                                                                                                                                 │
│ - Daily Reports (CRUD + child entities, precalentamiento auto-calc)                                                                                                                                                │
│ - Valuations (6-state workflow, discount rules, financial calculations)                                                                                                                                            │
│ - Discount Rules engine (pure business logic — port + exhaustive tests)                                                                                                                                            │
│                                                                                                                                                                                                                    │
│ Key risk: valorizacion.service.ts is 3,421 lines. Port discount rules first with known-correct test fixtures from Node. Port valuation service method by method.                                                   │
│                                                                                                                                                                                                                    │
│ Verification: API compatibility test — run same requests on both backends, diff JSON responses field by field.                                                                                                     │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Phase 3: Operational Modules (Week 9-12)                                                                                                                                                                           │
│                                                                                                                                                                                                                    │
│ Modules:                                                                                                                                                                                                           │
│ - Operators (certs, skills, availability, performance)                                                                                                                                                             │
│ - Providers (CRUD + contacts + financial info)                                                                                                                                                                     │
│ - Maintenance (schedules, recurring)                                                                                                                                                                               │
│ - Solicitudes de Equipo, Ordenes de Alquiler, Actas (Entrega + Devolucion)                                                                                                                                         │
│ - Periodos de Inoperatividad                                                                                                                                                                                       │
│ - Vales de Combustible                                                                                                                                                                                             │
│ - Cotizaciones (comparison matrix)                                                                                                                                                                                 │
│ - Scheduling                                                                                                                                                                                                       │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Phase 4: Support Modules (Week 13-15)                                                                                                                                                                              │
│                                                                                                                                                                                                                    │
│ Modules:                                                                                                                                                                                                           │
│ - Dashboard (aggregation queries, Redis cache)                                                                                                                                                                     │
│ - Analytics (fleet, utilization, fuel)                                                                                                                                                                             │
│ - Notifications (CRUD + mark read)                                                                                                                                                                                 │
│ - Approvals engine                                                                                                                                                                                                 │
│ - Payment Records, Payment Schedules, Accounts Payable                                                                                                                                                             │
│ - Reporting (complex SQL aggregation)                                                                                                                                                                              │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Phase 5: Secondary Modules + PDF + Cron (Week 16-18)                                                                                                                                                               │
│                                                                                                                                                                                                                    │
│ Modules:                                                                                                                                                                                                           │
│ - Projects, HR (timesheets, employees), Logistics, SST, SIG, Tenders, Checklists, Administration, Tenant                                                                                                           │
│ - PDF Generation: Convert 12 Handlebars templates → Jinja2, Playwright rendering                                                                                                                                   │
│ - Cron Jobs: node-cron → APScheduler                                                                                                                                                                               │
│ - Email: nodemailer → aiosmtplib                                                                                                                                                                                   │
│ - Excel export: ExcelJS → openpyxl                                                                                                                                                                                 │
│                                                                                                                                                                                                                    │
│ Key risk: PDF visual fidelity — compare Puppeteer vs Playwright output pixel by pixel for each template.                                                                                                           │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Phase 6: Cutover (Week 19-20)                                                                                                                                                                                      │
│                                                                                                                                                                                                                    │
│ - Full API compatibility test suite (automated)                                                                                                                                                                    │
│ - Performance benchmarks (Python must be within 20% of Node)                                                                                                                                                       │
│ - Switch nginx to route 100% to Python                                                                                                                                                                             │
│ - Remove BFF (Node)                                                                                                                                                                                                │
│ - Update CLAUDE.md, README, docker-compose                                                                                                                                                                         │
│ - Delete bff/ directory                                                                                                                                                                                            │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Transition Infrastructure                                                                                                                                                                                          │
│                                                                                                                                                                                                                    │
│ During migration, both backends coexist:                                                                                                                                                                           │
│                                                                                                                                                                                                                    │
│ 1. Nginx reverse proxy on port 3400 (frontend's existing port)                                                                                                                                                     │
│ 2. Routes migrated endpoints → Python (port 3410), rest → Node (port 3400 internal, remapped to 3401)                                                                                                              │
│ 3. Shared JWT secret — tokens work on both backends                                                                                                                                                                │
│ 4. Same PostgreSQL database — both connect to bitcorp_dev                                                                                                                                                          │
│ 5. Gradual switchover — add nginx locations as modules complete                                                                                                                                                    │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Per-Module Migration Checklist                                                                                                                                                                                     │
│                                                                                                                                                                                                                    │
│ For each module, repeat:                                                                                                                                                                                           │
│                                                                                                                                                                                                                    │
│ 1. SQLAlchemy model from TypeORM entity (Spanish class/property names)                                                                                                                                             │
│ 2. Pydantic schemas from TypeScript DTOs (input: *Crear/*Actualizar, output: *Dto)                                                                                                                                 │
│ 3. FastAPI router from Express routes (same URL paths)                                                                                                                                                             │
│ 4. Service from TypeScript service (Spanish method names: listar, crear, obtener_por_id, actualizar, eliminar)                                                                                                     │
│ 5. pytest tests — API-level integration tests with TestClient                                                                                                                                                      │
│ 6. API compatibility check — diff responses between Python and Node for same inputs                                                                                                                                │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Risks                                                                                                                                                                                                              │
│                                                                                                                                                                                                                    │
│ ┌─────┬────────────────────────────────┬──────────┬───────────────────────────────────────────────────────────────┐                                                                                                │
│ │  #  │              Risk              │ Severity │                          Mitigation                           │                                                                                                │
│ ├─────┼────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤                                                                                                │
│ │ 1   │ API response format divergence │ Critical │ Automated compatibility test suite diffing JSON responses     │                                                                                                │
│ ├─────┼────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤                                                                                                │
│ │ 2   │ SQLAlchemy query correctness   │ High     │ Compare generated SQL; seed test DB with known data           │                                                                                                │
│ ├─────┼────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤                                                                                                │
│ │ 3   │ JWT interoperability           │ High     │ Cross-backend auth test in Phase 1 (first thing verified)     │                                                                                                │
│ ├─────┼────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤                                                                                                │
│ │ 4   │ PDF visual fidelity            │ Medium   │ Pixel-diff between Puppeteer and Playwright output            │                                                                                                │
│ ├─────┼────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤                                                                                                │
│ │ 5   │ Performance regression         │ Medium   │ Benchmark critical endpoints; use orjson + connection pooling │                                                                                                │
│ └─────┴────────────────────────────────┴──────────┴───────────────────────────────────────────────────────────────┘                                                                                                │
│                                                                                                                                                                                                                    │
│ ---                                                                                                                                                                                                                │
│ Verification                                                                                                                                                                                                       │
│                                                                                                                                                                                                                    │
│ After each phase:                                                                                                                                                                                                  │
│ 1. Run pytest — all new tests pass                                                                                                                                                                                 │
│ 2. Run API compatibility test script — diff against Node responses                                                                                                                                                 │
│ 3. Check docker-compose logs — no errors on either backend                                                                                                                                                         │
│ 4. Manually test migrated endpoints via Swagger UI at http://localhost:3410/docs                                                                                                                                   │
│ 5. Verify frontend works through nginx proxy