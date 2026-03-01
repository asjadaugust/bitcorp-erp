Plan to implement │
│ │
│ WS-35: Flexible Approval System │
│ │
│ Context │
│ │
│ The ERP currently has hardcoded approval logic in each module — daily reports, valuations, and equipment requests each have different hardcoded state machines and role guards. As the business grows across │
│ projects with different org structures, this is infeasible. │
│ │
│ The design doc (docs/flexible-approval-design/) specifies a Microsoft Teams-style approval engine: configurable per-project/module templates, sequential multi-step flows, OR logic within steps, an immutable │
│ audit trail, ad-hoc requests, and a unified Recibidos/Enviados dashboard. │
│ │
│ The PRD analysis confirms this engine must support: │
│ - Daily reports (parte_diario): Operator submits → Residente approves (currently hardcoded) │
│ - Valuations (valorizacion_equipo): 5-step hardcoded workflow → 2 configurable steps (Residente → Director) │
│ - Solicitud de equipo: Simple 1-step (currently hardcoded Jefe Equipo) │
│ │
│ Decision: New aprobaciones PostgreSQL schema, replace existing hardcoded approval logic, existing records stay as-is (nullable FK backward compat). │
│ │
│ --- │
│ Architecture Overview │
│ │
│ aprobaciones schema (new) │
│ ├── plantilla_aprobacion — templates per module/project │
│ ├── plantilla_paso — steps within templates │
│ ├── solicitud_aprobacion — approval request instances │
│ ├── paso_solicitud — step completion tracking │
│ ├── solicitud_adhoc — free-form requests │
│ ├── respuesta_adhoc — ad-hoc responses │
│ └── auditoria_aprobacion — immutable audit trail │
│ │
│ Existing entity tables get: solicitud_aprobacion_id (nullable INT) │
│ - equipo.parte_diario │
│ - equipo.valorizacion_equipo │
│ - equipo.solicitud_equipo │
│ │
│ Flow: │
│ Module "submit" → instanciar() → creates solicitud + N paso_solicitud rows │
│ Approver POSTs /approvals/requests/:id/approve → advance or complete │
│ On complete → ApprovalCallbackService updates parent entity.estado │
│ │
│ --- │
│ Phase A: Database Migration │
│ │
│ Migration: backend/src/database/migrations/1771965600000-CreateAprobacionesSchema.ts │
│ │
│ New Schema DDL (in up()) │
│ │
│ CREATE SCHEMA IF NOT EXISTS aprobaciones; │
│ │
│ -- plantilla_aprobacion │
│ CREATE TABLE aprobaciones.plantilla_aprobacion ( │
│ id SERIAL PRIMARY KEY, │
│ tenant_id INTEGER, │
│ nombre VARCHAR(200) NOT NULL, │
│ module_name VARCHAR(50) NOT NULL, -- 'daily_report'|'valorizacion'|'solicitud_equipo'|'adhoc' │
│ proyecto_id INTEGER, │
│ version INTEGER NOT NULL DEFAULT 1, │
│ estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO', -- 'ACTIVO'|'INACTIVO'|'ARCHIVADO' │
│ descripcion TEXT, │
│ created_at TIMESTAMP NOT NULL DEFAULT NOW(), │
│ created_by INTEGER │
│ ); │
│ CREATE INDEX idx_plantilla_module ON aprobaciones.plantilla_aprobacion(module_name); │
│ CREATE INDEX idx_plantilla_tenant ON aprobaciones.plantilla_aprobacion(tenant_id); │
│ CREATE INDEX idx_plantilla_estado ON aprobaciones.plantilla_aprobacion(estado); │
│ │
│ -- plantilla_paso │
│ CREATE TABLE aprobaciones.plantilla_paso ( │
│ id SERIAL PRIMARY KEY, │
│ tenant_id INTEGER, │
│ plantilla_id INTEGER NOT NULL REFERENCES aprobaciones.plantilla_aprobacion(id) ON DELETE CASCADE, │
│ paso_numero INTEGER NOT NULL, │
│ nombre_paso VARCHAR(200) NOT NULL, │
│ tipo_aprobador VARCHAR(20) NOT NULL DEFAULT 'ROLE', -- 'ROLE'|'USER_ID' │
│ rol VARCHAR(50), │
│ usuario_id INTEGER, │
│ logica_aprobacion VARCHAR(30) NOT NULL DEFAULT 'ALL_MUST_APPROVE', -- 'ALL_MUST_APPROVE'|'FIRST_APPROVES' │
│ es_opcional BOOLEAN NOT NULL DEFAULT FALSE, │
│ created_at TIMESTAMP NOT NULL DEFAULT NOW() │
│ ); │
│ CREATE INDEX idx_plantilla_paso_plantilla ON aprobaciones.plantilla_paso(plantilla_id); │
│ │
│ -- solicitud_aprobacion │
│ CREATE TABLE aprobaciones.solicitud_aprobacion ( │
│ id SERIAL PRIMARY KEY, │
│ tenant_id INTEGER, │
│ plantilla_id INTEGER REFERENCES aprobaciones.plantilla_aprobacion(id), │
│ plantilla_version INTEGER, │
│ module_name VARCHAR(50) NOT NULL, │
│ entity_id INTEGER NOT NULL, │
│ proyecto_id INTEGER, │
│ usuario_solicitante_id INTEGER NOT NULL, │
│ titulo VARCHAR(400) NOT NULL, │
│ descripcion TEXT, │
│ estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE', │
│ -- 'PENDIENTE'|'EN_REVISION'|'APROBADO'|'RECHAZADO'|'CANCELADO' │
│ paso_actual INTEGER NOT NULL DEFAULT 1, │
│ fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(), │
│ fecha_completado TIMESTAMP, │
│ completado_por_id INTEGER │
│ ); │
│ CREATE INDEX idx_solicitud_entity ON aprobaciones.solicitud_aprobacion(entity_id, module_name); │
│ CREATE INDEX idx_solicitud_estado ON aprobaciones.solicitud_aprobacion(estado); │
│ CREATE INDEX idx_solicitud_tenant ON aprobaciones.solicitud_aprobacion(tenant_id); │
│ CREATE INDEX idx_solicitud_solicit ON aprobaciones.solicitud_aprobacion(usuario_solicitante_id); │
│ │
│ -- paso_solicitud │
│ CREATE TABLE aprobaciones.paso_solicitud ( │
│ id SERIAL PRIMARY KEY, │
│ tenant_id INTEGER, │
│ solicitud_id INTEGER NOT NULL REFERENCES aprobaciones.solicitud_aprobacion(id) ON DELETE CASCADE, │
│ paso_numero INTEGER NOT NULL, │
│ aprobador_id INTEGER, │
│ estado_paso VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE', -- 'PENDIENTE'|'APROBADO'|'RECHAZADO'|'OMITIDO' │
│ accion_fecha TIMESTAMP, │
│ comentario TEXT │
│ ); │
│ CREATE INDEX idx_paso_solicitud ON aprobaciones.paso_solicitud(solicitud_id); │
│ CREATE INDEX idx_paso_aprobador ON aprobaciones.paso_solicitud(aprobador_id); │
│ CREATE INDEX idx_paso_estado ON aprobaciones.paso_solicitud(estado_paso); │
│ │
│ -- solicitud_adhoc │
│ CREATE TABLE aprobaciones.solicitud_adhoc ( │
│ id SERIAL PRIMARY KEY, │
│ tenant_id INTEGER, │
│ usuario_solicitante_id INTEGER NOT NULL, │
│ titulo VARCHAR(400) NOT NULL, │
│ descripcion TEXT, │
│ aprobadores JSONB NOT NULL DEFAULT '[]', │
│ usuarios_cc JSONB NOT NULL DEFAULT '[]', │
│ logica_aprobacion VARCHAR(30) NOT NULL DEFAULT 'ALL_MUST_APPROVE', │
│ estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE', │
│ fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(), │
│ fecha_completado TIMESTAMP, │
│ archivos_adjuntos JSONB │
│ ); │
│ CREATE INDEX idx_adhoc_solicitante ON aprobaciones.solicitud_adhoc(usuario_solicitante_id); │
│ CREATE INDEX idx_adhoc_estado ON aprobaciones.solicitud_adhoc(estado); │
│ │
│ -- respuesta_adhoc │
│ CREATE TABLE aprobaciones.respuesta_adhoc ( │
│ id SERIAL PRIMARY KEY, │
│ tenant_id INTEGER, │
│ solicitud_adhoc_id INTEGER NOT NULL REFERENCES aprobaciones.solicitud_adhoc(id) ON DELETE CASCADE, │
│ aprobador_id INTEGER NOT NULL, │
│ respuesta VARCHAR(20) NOT NULL, -- 'APROBADO'|'RECHAZADO' │
│ comentario TEXT, │
│ fecha_respuesta TIMESTAMP NOT NULL DEFAULT NOW() │
│ ); │
│ CREATE INDEX idx_respuesta_adhoc ON aprobaciones.respuesta_adhoc(solicitud_adhoc_id); │
│ │
│ -- auditoria_aprobacion (immutable — never UPDATE/DELETE) │
│ CREATE TABLE aprobaciones.auditoria_aprobacion ( │
│ id SERIAL PRIMARY KEY, │
│ tenant_id INTEGER, │
│ solicitud_id INTEGER, │
│ solicitud_adhoc_id INTEGER, │
│ plantilla_version INTEGER, │
│ accion VARCHAR(30) NOT NULL, │
│ -- 'CREATED'|'STEP_APPROVED'|'STEP_REJECTED'|'COMPLETED'|'REJECTED'|'REBASED'|'CANCELLED' │
│ usuario_id INTEGER NOT NULL, │
│ paso_numero INTEGER, │
│ comentario TEXT, │
│ timestamp TIMESTAMP NOT NULL DEFAULT NOW(), │
│ metadata JSONB │
│ ); │
│ CREATE INDEX idx_auditoria_solicitud ON aprobaciones.auditoria_aprobacion(solicitud_id); │
│ CREATE INDEX idx_auditoria_usuario ON aprobaciones.auditoria_aprobacion(usuario_id); │
│ │
│ -- FK columns on existing entity tables (nullable for backward compat) │
│ ALTER TABLE equipo.parte_diario ADD COLUMN IF NOT EXISTS solicitud_aprobacion_id INTEGER; │
│ ALTER TABLE equipo.valorizacion_equipo ADD COLUMN IF NOT EXISTS solicitud_aprobacion_id INTEGER; │
│ ALTER TABLE equipo.solicitud_equipo ADD COLUMN IF NOT EXISTS solicitud_aprobacion_id INTEGER; │
│ │
│ down() — drop in reverse order │
│ │
│ ALTER TABLE equipo.solicitud_equipo DROP COLUMN IF EXISTS solicitud_aprobacion_id; │
│ ALTER TABLE equipo.valorizacion_equipo DROP COLUMN IF EXISTS solicitud_aprobacion_id; │
│ ALTER TABLE equipo.parte_diario DROP COLUMN IF EXISTS solicitud_aprobacion_id; │
│ DROP TABLE IF EXISTS aprobaciones.auditoria_aprobacion; │
│ DROP TABLE IF EXISTS aprobaciones.respuesta_adhoc; │
│ DROP TABLE IF EXISTS aprobaciones.solicitud_adhoc; │
│ DROP TABLE IF EXISTS aprobaciones.paso_solicitud; │
│ DROP TABLE IF EXISTS aprobaciones.solicitud_aprobacion; │
│ DROP TABLE IF EXISTS aprobaciones.plantilla_paso; │
│ DROP TABLE IF EXISTS aprobaciones.plantilla_aprobacion; │
│ DROP SCHEMA IF EXISTS aprobaciones; │
│ │
│ --- │
│ Phase B: Backend Core Engine │
│ │
│ Step 1 — TypeORM Models (7 new files in backend/src/models/) │
│ │
│ ┌───────────────────────────────┬─────────────────────┬───────────────────────────────────┐ │
│ │ File │ Entity │ Schema Table │ │
│ ├───────────────────────────────┼─────────────────────┼───────────────────────────────────┤ │
│ │ plantilla-aprobacion.model.ts │ PlantillaAprobacion │ aprobaciones.plantilla_aprobacion │ │
│ ├───────────────────────────────┼─────────────────────┼───────────────────────────────────┤ │
│ │ plantilla-paso.model.ts │ PlantillaPaso │ aprobaciones.plantilla_paso │ │
│ ├───────────────────────────────┼─────────────────────┼───────────────────────────────────┤ │
│ │ solicitud-aprobacion.model.ts │ SolicitudAprobacion │ aprobaciones.solicitud_aprobacion │ │
│ ├───────────────────────────────┼─────────────────────┼───────────────────────────────────┤ │
│ │ paso-solicitud.model.ts │ PasoSolicitud │ aprobaciones.paso_solicitud │ │
│ ├───────────────────────────────┼─────────────────────┼───────────────────────────────────┤ │
│ │ solicitud-adhoc.model.ts │ SolicitudAdhoc │ aprobaciones.solicitud_adhoc │ │
│ ├───────────────────────────────┼─────────────────────┼───────────────────────────────────┤ │
│ │ respuesta-adhoc.model.ts │ RespuestaAdhoc │ aprobaciones.respuesta_adhoc │ │
│ ├───────────────────────────────┼─────────────────────┼───────────────────────────────────┤ │
│ │ auditoria-aprobacion.model.ts │ AuditoriaAprobacion │ aprobaciones.auditoria_aprobacion │ │
│ └───────────────────────────────┴─────────────────────┴───────────────────────────────────┘ │
│ │
│ All entities: @Entity('table_name', { schema: 'aprobaciones' }), Spanish snake_case column names (@Column({ name: 'campo_nombre' })), camelCase TypeScript properties, tenant_id nullable column on each. │
│ │
│ Key types: │
│ - ModuleName = 'daily_report' | 'valorizacion' | 'solicitud_equipo' | 'adhoc' │
│ - EstadoSolicitud = 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO' │
│ - TipoAprobador = 'ROLE' | 'USER_ID' │
│ - LogicaAprobacion = 'ALL_MUST_APPROVE' | 'FIRST_APPROVES' │
│ - AccionAuditoria = 'CREATED' | 'STEP_APPROVED' | 'STEP_REJECTED' | 'COMPLETED' | 'REJECTED' | 'REBASED' | 'CANCELLED' │
│ │
│ Register all 7 in backend/src/config/database.config.ts — add to entities array. │
│ │
│ Step 2 — DTO Layer │
│ │
│ File: backend/src/types/dto/approval.dto.ts │
│ │
│ Output DTOs (snake_case): PlantillaAprobacionDto, PlantillaPasoDto, SolicitudAprobacionDto, PasoSolicitudDto, SolicitudAdhocDto, RespuestaAdhocDto, AuditoriaAprobacionDto, DashboardStatsDto │
│ │
│ Input DTOs: CrearPlantillaDto, InstanciarSolicitudDto, ResponderSolicitudDto, CrearAdhocDto │
│ │
│ Transformer functions: toPlantillaDto(), toSolicitudDto(), toAdhocDto(), toAuditoriaDto() │
│ │
│ Step 3 — Services (4 new files in backend/src/services/) │
│ │
│ approval-callback.service.ts (no dependencies — implement first): │
│ - onAprobado(moduleName, entityId, solicitudId, tenantId) → switch on moduleName → update entity.estado = 'APROBADO' │
│ - onRechazado(moduleName, entityId, solicitudId, tenantId) → update entity.estado = 'RECHAZADO' │
│ - Uses AppDataSource.getRepository() pattern │
│ │
│ approval-template.service.ts: │
│ - crearPlantilla(dto, usuarioId) — validates ≥1 paso, checks no active template for same module/project, saves plantilla + pasos, returns DTO │
│ - obtenerPlantillaActiva(moduleName, proyectoId?) — returns PlantillaAprobacion | null │
│ - listar() — all templates │
│ - obtenerPorId(id) — with pasos eager loaded │
│ - actualizar(id, dto, usuarioId) — increments version, creates new pasos, sets old template to INACTIVO │
│ - activar(id, usuarioId) — sets ACTIVO (deactivates others for same module/project) │
│ - archivar(id, usuarioId) — sets ARCHIVADO │
│ │
│ approval-request.service.ts (core engine logic): │
│ │
│ instanciar(moduleName, entityId, proyectoId, titulo, descripcion, usuarioId, tenantId): │
│ 1. Fetch active template via ApprovalTemplateService.obtenerPlantillaActiva() │
│ 2. If none: throw NotFoundError('No hay plantilla activa para el módulo ...') │
│ 3. Create SolicitudAprobacion with estado='PENDIENTE', pasoActual=firstStep.pasoNumero │
│ 4. Create one PasoSolicitud row per paso (all estadoPaso='PENDIENTE') │
│ 5. Write AuditoriaAprobacion entry with accion='CREATED' │
│ 6. Fire-and-forget: notify eligible approvers for step 1 (via NotificationService) │
│ 7. Return DTO │
│ │
│ aprobarPaso(solicitudId, usuarioId, userRole, comentario?, tenantId?): │
│ 1. Load solicitud, assert estado IN ('PENDIENTE', 'EN_REVISION') │
│ 2. Load PlantillaPaso for paso_actual — verify user's role matches (throw ConflictError if not) │
│ 3. Update PasoSolicitud.estadoPaso = 'APROBADO', set aprobadorId, accionFecha, comentario │
│ 4. Audit STEP_APPROVED │
│ 5. Check if next PlantillaPaso exists: │
│ - YES → advance solicitud.pasoActual, set estado='EN_REVISION', notify next approvers │
│ - NO → set estado='APROBADO', fechaCompletado, audit COMPLETED, call callbackService.onAprobado() │
│ 6. Return DTO │
│ │
│ rechazar(solicitudId, usuarioId, comentario, tenantId?): │
│ 1. Assert estado IN ('PENDIENTE', 'EN_REVISION') │
│ 2. Mark current PasoSolicitud as RECHAZADO │
│ 3. Set solicitud.estado = 'RECHAZADO', audit REJECTED │
│ 4. Call callbackService.onRechazado() │
│ │
│ rebase(solicitudId, newPlantillaId, usuarioId, tenantId?): │
│ - Manual rebase: get new template, create new PasoSolicitud rows for remaining steps, audit REBASED with metadata: { from_version, to_version } │
│ │
│ getDashboardRecibidos(userId, userRole): │
│ - Query all solicitud_aprobacion WHERE estado IN ('PENDIENTE','EN_REVISION') AND plantilla_paso for paso_actual matches userRole OR usuario_id = userId │
│ - Also include solicitud_adhoc WHERE aprobadores @> '[userId]' AND estado = 'PENDIENTE' │
│ │
│ getDashboardEnviados(userId): │
│ - Query all solicitud_aprobacion WHERE usuario_solicitante_id = userId │
│ - Also solicitud_adhoc WHERE usuario_solicitante_id = userId │
│ │
│ approval-adhoc.service.ts: │
│ - crear(dto, usuarioId, tenantId?) — saves SolicitudAdhoc, notifies all aprobadores, writes audit CREATED │
│ - responder(adhocId, userId, respuesta, comentario, tenantId?): │
│ - Saves RespuestaAdhoc │
│ - If logica = FIRST_APPROVES AND respuesta = 'APROBADO' → set estado APROBADO immediately │
│ - If logica = ALL_MUST_APPROVE → check if all aprobadores responded APROBADO → set APROBADO │
│ - Any RECHAZADO response → set RECHAZADO immediately │
│ - Audit entry │
│ - listarMios(userId) — sent by user │
│ - listarPendientes(userId) — where user is in aprobadores and estadoPaso=PENDIENTE │
│ │
│ Step 4 — Controller + Routes │
│ │
│ File: backend/src/api/approvals/approvals.controller.ts │
│ │
│ Standard pattern: one static method per route, try/catch per method, use sendSuccess / sendCreated / sendError. │
│ Service instances at top of file (NOT in constructor — plain class pattern matching existing controllers like solicitudes-equipo.controller.ts). │
│ │
│ File: backend/src/api/approvals/approvals.routes.ts │
│ │
│ GET /templates → getTemplates (all authenticated) │
│ POST /templates → createTemplate (ADMIN only) │
│ GET /templates/:id → getTemplate (all authenticated) │
│ PUT /templates/:id → updateTemplate (ADMIN only) │
│ POST /templates/:id/activate → activateTemplate (ADMIN only) │
│ POST /templates/:id/archive → archiveTemplate (ADMIN only) │
│ │
│ GET /dashboard/recibidos → getDashboardRecibidos (NOTE: before /requests/:id) │
│ GET /dashboard/enviados → getDashboardEnviados │
│ GET /dashboard/stats → getDashboardStats │
│ │
│ GET /requests → getRequests │
│ POST /requests → createRequest │
│ GET /requests/:id → getRequest │
│ POST /requests/:id/approve → approveRequest │
│ POST /requests/:id/reject → rejectRequest │
│ POST /requests/:id/rebase → rebaseRequest (ADMIN only) │
│ GET /requests/:id/audit → getRequestAudit │
│ │
│ GET /adhoc → getAdhocList │
│ POST /adhoc → createAdhoc │
│ GET /adhoc/:id → getAdhoc │
│ POST /adhoc/:id/respond → respondAdhoc │
│ │
│ Register in backend/src/index.ts: app.use('/api/approvals', approvalsRoutes) │
│ │
│ --- │
│ Phase C: Module Integration (Replace Hardcoded Approval) │
│ │
│ Entity Model Changes │
│ │
│ Add to each model (nullable, backward-compat): │
│ @Column({ name: 'solicitud_aprobacion_id', type: 'integer', nullable: true }) │
│ solicitudAprobacionId?: number; │
│ │
│ Files: │
│ - backend/src/models/daily-report-typeorm.model.ts │
│ - backend/src/models/valuation.model.ts │
│ - backend/src/models/solicitud-equipo.model.ts │
│ │
│ parte_diario Integration │
│ │
│ Modified: backend/src/services/report.service.ts │
│ │
│ In enviarReporte() (the submit/send action that moves BORRADOR → ENVIADO): │
│ 1. Check if active template exists for 'daily_report' │
│ 2. If YES: call approvalSvc.instanciar('daily_report', report.id, ...) → store solicitudAprobacionId, set estado = 'ENVIADO' │
│ 3. If NO template (legacy): fall back to direct approval (existing behavior) │
│ │
│ Remove direct role-based aprobar() / rechazar() route guards from report.controller.ts — approvals now go through /api/approvals/requests/:id/approve. │
│ │
│ Callback (approval-callback.service.ts onAprobado 'daily_report'): sets parte_diario.estado = 'APROBADO' │
│ │
│ valorizacion_equipo Integration │
│ │
│ Modified: backend/src/services/valuation.service.ts │
│ │
│ In submitDraft() (BORRADOR → PENDIENTE): │
│ 1. Check active template for 'valorizacion' │
│ 2. If YES: approvalSvc.instanciar('valorizacion', ...), store solicitudAprobacionId, estado = 'PENDIENTE' │
│ │
│ Multi-step callback mapping — ApprovalCallbackService needs a valuation-specific handler: │
│ - onAprobado('valorizacion') → set entity estado = 'APROBADO' │
│ │
│ Valuation engine steps map as: Step 1 = RESIDENTE (was VALIDADO), Step 2 = DIRECTOR (was APROBADO). │
│ │
│ Existing validate / approve routes kept for backward compat on records without solicitudAprobacionId. │
│ │
│ solicitud_equipo Integration │
│ │
│ Modified: backend/src/services/solicitud-equipo.service.ts │
│ │
│ In enviar() (BORRADOR → ENVIADO): │
│ 1. approvalSvc.instanciar('solicitud_equipo', ...), store solicitudAprobacionId │
│ │
│ Callback: onAprobado('solicitud_equipo') → estado = 'APROBADO' │
│ │
│ --- │
│ Phase D: Frontend │
│ │
│ New Files │
│ │
│ frontend/src/app/ │
│ ├── core/services/approval.service.ts ← service with all API calls │
│ └── features/approvals/ │
│ ├── approvals.routes.ts ← lazy-loaded route config │
│ ├── approval-dashboard.component.ts (+ .html + .scss) │
│ ├── approval-detail.component.ts (+ .html + .scss) │
│ ├── approval-templates-list.component.ts (+ .html + .scss) │
│ ├── approval-template-form.component.ts (+ .html + .scss) │
│ └── adhoc-request-form.component.ts (+ .html + .scss) │
│ │
│ Modified Files │
│ │
│ - frontend/src/app/app.routes.ts — add: { path: 'approvals', loadChildren: () => import('./features/approvals/approvals.routes').then(m => m.APPROVALS_ROUTES) } │
│ - frontend/src/app/shared/components/sidebar.component.ts — add "Aprobaciones" nav item (fa-check-circle icon, /approvals/dashboard, visible to all roles) │
│ │
│ Component Specifications │
│ │
│ approval.service.ts — @Injectable({ providedIn: 'root' }), inject(HttpClient), Observable returns. NO .pipe(map(res => res.data)) — apiResponseInterceptor auto-unwraps. Methods: │
│ - getTemplates(), createTemplate(dto), activateTemplate(id), archiveTemplate(id) │
│ - approveRequest(id, comentario?), rejectRequest(id, comentario) │
│ - getDashboardRecibidos(), getDashboardEnviados(), getDashboardStats() │
│ - createAdhoc(dto), respondAdhoc(id, respuesta, comentario?) │
│ │
│ approval-dashboard.component.ts: │
│ - Wrapper: <app-page-layout title="Centro de Aprobaciones" icon="fa-check-circle"> │
│ - Header action: <aero-button>Nueva Solicitud Ad-hoc</aero-button> routes to /approvals/adhoc/new │
│ - Stats grid: 4 stats from getDashboardStats() │
│ - <aero-tabs> with two panels: │
│ - Recibidos: list cards — module badge (daily_report/valorizacion/solicitud_equipo), title, requester, paso_actual/total progress, inline Aprobar + Rechazar buttons (opens comment dialog) │
│ - Enviados: list cards — estado badge (color: PENDIENTE=yellow, APROBADO=green, RECHAZADO=red), approval chain (Step 1: ✓ User → Step 2: ⏳ pending) │
│ - Empty states with clear CTAs │
│ │
│ approval-detail.component.ts: │
│ - Wrapper: <app-entity-detail-shell> │
│ - Main section: request title, description, module + entity reference (link) │
│ - Approval chain: numbered step indicators showing each paso with user, date, status icon │
│ - Comment textarea + Aprobar/Rechazar buttons (shown only if user is eligible for current step) │
│ - Audit trail sidebar card: timeline of all AuditoriaItem entries │
│ │
│ approval-template-form.component.ts: │
│ - Wrapper: <app-form-container title="Configurar Plantilla de Aprobación"> │
│ - Section 1: <app-form-section title="Módulo" icon="fa-cog"> — module_name <app-dropdown>, nombre, descripcion │
│ - Section 2: <app-form-section title="Pasos de Aprobación" icon="fa-list-ol"> — Angular FormArray of step rows │
│ - Each row: paso_numero (auto), nombre_paso <aero-input>, tipo_aprobador <app-dropdown> (ROLE/USER_ID), conditional rol <app-dropdown> or usuario_id user-picker, logica <app-dropdown>, es_opcional checkbox │
│ - Add Step / Remove Step buttons │
│ │
│ adhoc-request-form.component.ts: │
│ - Wrapper: <app-form-container title="Nueva Solicitud Ad-hoc"> │
│ - Fields: titulo, descripcion (textarea), aprobadores (multi-select user picker), usuarios_cc, logica_aprobacion <app-dropdown>, archivos_adjuntos (optional file upload) │
│ │
│ --- │
│ Phase E: Seeding │
│ │
│ Modified: database/002_seed.sql │
│ │
│ Add after existing schema statements: │
│ 1. CREATE SCHEMA IF NOT EXISTS aprobaciones; + all 7 CREATE TABLE statements (matching migration) │
│ 2. Seed 3 default templates using a DO $$ ... $$ block: │
│ - daily_report: 1 step — RESIDENTE, FIRST_APPROVES │
│ - valorizacion: 2 steps — Step 1 RESIDENTE ALL_MUST_APPROVE, Step 2 DIRECTOR ALL_MUST_APPROVE │
│ - solicitud_equipo: 1 step — JEFE_EQUIPO, ALL_MUST_APPROVE │
│ │
│ --- │
│ Phase F: Backend Tests (25+ tests) │
│ │
│ approval-template.service.spec.ts (~8 tests): │
│ - create succeeds with valid dto │
│ - create throws ConflictError if ACTIVO template already exists for same module │
│ - create throws ValidationError if zero pasos │
│ - activate deactivates existing ACTIVO template first │
│ - obtenerPlantillaActiva returns null when none exists │
│ │
│ approval-request.service.spec.ts (~12 tests): │
│ - instanciar creates N paso_solicitud rows │
│ - instanciar throws NotFoundError when no template │
│ - aprobarPaso single-step: calls callbackService.onAprobado │
│ - aprobarPaso multi-step: advances pasoActual, does NOT call callback yet │
│ - aprobarPaso throws ConflictError if wrong role │
│ - aprobarPaso throws ConflictError if already APROBADO │
│ - rechazar sets RECHAZADO, calls callbackService.onRechazado │
│ - getDashboardRecibidos only returns solicitudes matching user's role │
│ │
│ approval-callback.service.spec.ts (~5 tests): │
│ - onAprobado('daily_report') → updates parte_diario.estado = 'APROBADO' │
│ - onAprobado('valorizacion') → updates valorizacion.estado = 'APROBADO' │
│ - onRechazado('solicitud_equipo') → updates solicitud.estado = 'RECHAZADO' │
│ - Unknown module logs warning without throwing │
│ │
│ --- │
│ Implementation Sequence │
│ │
│ 1. Database migration (1771965600000) │
│ 2. 7 TypeORM models │
│ 3. Register entities in database.config.ts │
│ 4. approval.dto.ts (DTO interfaces + transformer functions) │
│ 5. approval-callback.service.ts (no deps) │
│ 6. approval-template.service.ts │
│ 7. approval-request.service.ts │
│ 8. approval-adhoc.service.ts │
│ 9. approvals.controller.ts + approvals.routes.ts │
│ 10. Register /api/approvals in index.ts │
│ 11. Add solicitudAprobacionId column to 3 entity models │
│ 12. Integrate into report.service.ts (daily reports) │
│ 13. Integrate into valuation.service.ts │
│ 14. Integrate into solicitud-equipo.service.ts │
│ 15. Update 002_seed.sql │
│ 16. Backend tests (3 spec files) │
│ 17. approval.service.ts (frontend) │
│ 18. approvals.routes.ts (frontend) │
│ 19. approval-dashboard.component (+ html + scss) │
│ 20. approval-detail.component (+ html + scss) │
│ 21. approval-templates-list.component │
│ 22. approval-template-form.component │
│ 23. adhoc-request-form.component │
│ 24. app.routes.ts + sidebar.component modifications │
│ │
│ --- │
│ Critical Reference Files │
│ │
│ ┌─────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────┐ │
│ │ Purpose │ File │ │
│ ├─────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤ │
│ │ Migration pattern │ backend/src/database/migrations/1771965500000-CreateCotizacionProveedor.ts │ │
│ ├─────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤ │
│ │ Service pattern │ backend/src/services/solicitud-equipo.service.ts │ │
│ ├─────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤ │
│ │ Controller pattern │ backend/src/api/solicitudes-equipo/solicitudes-equipo.controller.ts │ │
│ ├─────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤ │
│ │ List component (frontend gold standard) │ frontend/src/app/features/equipment/solicitud-equipo-list.component.ts │ │
│ ├─────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤ │
│ │ Frontend service pattern │ frontend/src/app/core/services/solicitud-equipo.service.ts │ │
│ ├─────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤ │
│ │ Detail component │ frontend/src/app/features/contracts/contract-detail.component.ts │ │
│ ├─────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤ │
│ │ Form component │ frontend/src/app/features/contracts/contract-form.component.ts │ │
│ └─────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ --- │
│ Verification │
│ │
│ 1. docker-compose up -d --build — zero build errors │
│ 2. docker-compose logs -f backend — migration runs, tables created │
│ 3. POST /api/approvals/templates (as ADMIN) — create daily_report template │
│ 4. Submit a new Parte Diario — verify network response contains solicitud_aprobacion_id │
│ 5. GET /api/approvals/dashboard/recibidos as RESIDENTE — shows the pending approval │
│ 6. POST /api/approvals/requests/:id/approve as RESIDENTE — verify parte_diario.estado = 'APROBADO' │
│ 7. Navigate to /approvals/dashboard — Recibidos and Enviados tabs render │
│ 8. Navigate to /approvals/templates (ADMIN) — create new template, save, verify step builder works │
│ 9. Navigate to /approvals/adhoc/new — create ad-hoc request │
│ 10. docker-compose logs -f frontend — zero Angular compile errors │
│ 11. Browser console — zero errors │
│ 12. cd backend && npm run test — 25+ new tests pass, no regressions
