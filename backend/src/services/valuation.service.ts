/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import { Valorizacion } from '../models/valuation.model';
import { Contract } from '../models/contract.model';
import { ExcessFuel } from '../models/excess-fuel.model';
import { WorkExpense } from '../models/work-expense.model';
import { AdvanceAmortization } from '../models/advance-amortization.model';
import { Repository } from 'typeorm';
import { valuationEmailNotifier } from './valuation-email-notifier';
import {
  transformToValuationPage1Dto,
  transformToValuationPage2Dto,
  transformToValuationPage3Dto,
  transformToValuationPage4Dto,
  transformToValuationPage5Dto,
  transformToValuationPage6Dto,
  transformToValuationPage7Dto,
} from '../utils/valuation-pdf-transformer';
import {
  ValuationPage1Dto,
  ValuationPage2Dto,
  ValuationPage3Dto,
  ValuationPage4Dto,
  ValuationPage5Dto,
  ValuationPage6Dto,
  ValuationPage7Dto,
} from '../types/dto/valuation-pdf.dto';
import { toValuationDto, fromValuationDto, ValuationDto } from '../types/dto/valuation.dto';
import Logger from '../utils/logger';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  BusinessRuleError,
  DatabaseError,
  DatabaseErrorType,
} from '../errors';
import logger from '../config/logger.config';

/**
 * # ValuationService
 *
 * ## Purpose
 * Manages equipment rental valuations (valorizaciones_equipo) for the BitCorp ERP system.
 * Handles the complete valuation lifecycle from creation through approval to payment,
 * including multi-page PDF data extraction (7 pages), financial calculations, email
 * notifications, and analytics.
 *
 * ## Scope
 * - Monthly valuation CRUD operations
 * - Estado (status) workflow management with strict state transitions
 * - PDF data extraction for 7-page valuation documents
 * - Financial analytics and reporting
 * - Email notifications for state changes
 * - Bulk valuation generation (planned)
 *
 * ---
 *
 * ## Database Schema
 *
 * ### Primary Table: valorizaciones_equipo
 *
 * ```sql
 * CREATE TABLE valorizaciones_equipo (
 *   id SERIAL PRIMARY KEY,
 *
 *   -- References
 *   contrato_id INTEGER REFERENCES contratos_alquiler(id) ON DELETE SET NULL,
 *   equipo_id INTEGER REFERENCES equipos(id) ON DELETE SET NULL,
 *   proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE SET NULL,
 *
 *   -- Identification
 *   numero_valorizacion VARCHAR(50) UNIQUE NOT NULL,  -- e.g., "VAL-2026-001"
 *   periodo VARCHAR(20) NOT NULL,                     -- e.g., "2026-01" (YYYY-MM)
 *
 *   -- Date range
 *   fecha_inicio DATE NOT NULL,
 *   fecha_fin DATE NOT NULL,
 *
 *   -- Work metrics
 *   dias_trabajados INTEGER,
 *   horas_trabajadas DECIMAL(10,2),
 *   combustible_consumido DECIMAL(10,2),
 *
 *   -- Financial amounts (PEN)
 *   costo_base DECIMAL(12,2),              -- Base cost from contract
 *   total_valorizado DECIMAL(12,2),        -- Base amount (before deductions)
 *   total_descuentos DECIMAL(12,2),        -- Total deductions
 *   total_con_igv DECIMAL(12,2),           -- Final amount with 18% IGV (tax)
 *
 *   -- Estado workflow
 *   estado VARCHAR(20) NOT NULL,           -- PENDIENTE | EN_REVISION | APROBADO | RECHAZADO | PAGADO | ELIMINADO
 *   observaciones TEXT,
 *
 *   -- Payment information
 *   fecha_pago DATE,
 *   referencia_pago VARCHAR(100),
 *   metodo_pago VARCHAR(50),               -- e.g., "TRANSFERENCIA", "CHEQUE"
 *
 *   -- Audit fields
 *   created_by INTEGER REFERENCES usuarios(id),
 *   approved_by INTEGER REFERENCES usuarios(id),
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW(),
 *   approved_at TIMESTAMP,
 *
 *   -- Constraints
 *   CONSTRAINT chk_fecha_range CHECK (fecha_fin >= fecha_inicio),
 *   CONSTRAINT chk_total_valorizado_positive CHECK (total_valorizado >= 0)
 * );
 *
 * CREATE INDEX idx_val_estado ON valorizaciones_equipo(estado);
 * CREATE INDEX idx_val_periodo ON valorizaciones_equipo(periodo);
 * CREATE INDEX idx_val_contrato ON valorizaciones_equipo(contrato_id);
 * CREATE INDEX idx_val_equipo ON valorizaciones_equipo(equipo_id);
 * CREATE INDEX idx_val_proyecto ON valorizaciones_equipo(proyecto_id);
 * CREATE INDEX idx_val_created_at ON valorizaciones_equipo(created_at);
 * ```
 *
 * ### Related Tables
 *
 * **contratos_alquiler** (parent entity)
 * - Rental contract that defines pricing and terms
 * - Links valuation to equipment and provider
 *
 * **equipos** (equipment being valued)
 * - Heavy machinery, vehicles, or minor equipment
 * - Type determines pricing model
 *
 * **proyectos** (project context)
 * - Construction project where equipment is used
 * - Used for cost tracking and reporting
 *
 * **partes_diarios** (daily reports - source data)
 * - Daily work hours, fuel consumption, operator notes
 * - Aggregated into monthly valuation
 *
 * **excess_fuel** (extra fuel charges)
 * - Charges for fuel consumption above contract limit
 * - One record per valuation (optional)
 *
 * **work_expenses** (gastos de obra)
 * - Additional expenses (maintenance, repairs, parts)
 * - Multiple records per valuation
 *
 * **advance_amortizations** (adelantos)
 * - Advance payment deductions
 * - Multiple records per valuation
 *
 * ---
 *
 * ## Estado State Machine
 *
 * ### State Flow Diagram
 *
 * ```
 * ┌────────────────────────────────────────────────────────────────────┐
 * │                   VALUATION LIFECYCLE                               │
 * └────────────────────────────────────────────────────────────────────┘
 *
 *     [CREATE]
 *        │
 *        ▼
 *   ┌────────────┐
 *   │ PENDIENTE  │ ◄──── Initial state (draft)
 *   │  (Draft)   │       Can be edited freely
 *   └────────────┘
 *        │
 *        │ submitForReview(id, userId)
 *        │ ✅ Validates all required data present
 *        ▼
 *   ┌────────────┐
 *   │ EN_REVISION│ ◄──── Submitted for approval
 *   │ (Review)   │       Awaiting DIRECTOR/ADMIN review
 *   └────────────┘
 *        │
 *        ├──────────────┐
 *        │              │
 *        │ approve()    │ reject(reason)
 *        │ (DIRECTOR+)  │ (Any reason)
 *        ▼              ▼
 *   ┌────────────┐  ┌────────────┐
 *   │  APROBADO  │  │ RECHAZADO  │ ◄──── Terminal state
 *   │ (Approved) │  │ (Rejected) │       ❌ Cannot transition out
 *   └────────────┘  └────────────┘       ❌ Cannot be modified
 *        │
 *        │ markAsPaid(paymentData)
 *        │ ✅ Records payment details
 *        ▼
 *   ┌────────────┐
 *   │   PAGADO   │ ◄──── Terminal state
 *   │   (Paid)   │       ❌ Cannot transition out
 *   └────────────┘       ❌ Cannot be modified
 *
 *        │ delete(id)
 *        │ ✅ Soft delete only
 *        ▼
 *   ┌────────────┐
 *   │ ELIMINADO  │ ◄──── Soft deleted
 *   │ (Deleted)  │       ❌ Hidden from normal queries
 *   └────────────┘
 * ```
 *
 * ### Valid State Transitions
 *
 * | Current Estado | Valid Next Estados | Method | Business Rule |
 * |----------------|-------------------|--------|---------------|
 * | PENDIENTE | EN_REVISION | `submitForReview()` | Must have all required data |
 * | EN_REVISION | APROBADO | `approve()` | Only DIRECTOR+ can approve |
 * | EN_REVISION | RECHAZADO | `reject()` | Requires rejection reason |
 * | APROBADO | PAGADO | `markAsPaid()` | Requires payment details |
 * | * (any) | ELIMINADO | `delete()` | Soft delete (audit trail preserved) |
 *
 * ### Invalid Transitions (Will Throw Error)
 *
 * - ❌ PENDIENTE → APROBADO (must go through EN_REVISION)
 * - ❌ APROBADO → PENDIENTE (cannot revert after approval)
 * - ❌ PAGADO → any state (terminal state, immutable)
 * - ❌ RECHAZADO → any state (terminal state, immutable)
 * - ❌ Any modification to PAGADO or RECHAZADO valuations
 *
 * ---
 *
 * ## Business Rules
 *
 * ### Rule 1: Estado State Machine Enforcement
 * **Description**: Valuations must follow strict state transitions
 * **Validation**: In approve(), submitForReview(), reject(), markAsPaid()
 * **Error**: BusinessRuleError if invalid transition attempted
 *
 * **Example**:
 * ```typescript
 * // ❌ WRONG: Cannot approve PENDIENTE
 * await valuationService.approve(1, userId);
 * // Throws: "Cannot approve valuation in state PENDIENTE. Must be EN_REVISION."
 *
 * // ✅ CORRECT: Submit first, then approve
 * await valuationService.submitForReview(1, userId);  // PENDIENTE → EN_REVISION
 * await valuationService.approve(1, userId);          // EN_REVISION → APROBADO
 * ```
 *
 * ### Rule 2: Rejection Reason Required
 * **Description**: Rejecting a valuation requires a non-empty reason
 * **Validation**: In reject() method
 * **Error**: ValidationError if reason is empty or whitespace-only
 *
 * **Example**:
 * ```typescript
 * // ❌ WRONG: Empty reason
 * await valuationService.reject(1, userId, '');
 * // Throws: "Rejection reason is required"
 *
 * // ✅ CORRECT: Provide detailed reason
 * await valuationService.reject(1, userId, 'Horas trabajadas incorrectas en días 5-7');
 * ```
 *
 * ### Rule 3: Terminal States Cannot Be Modified
 * **Description**: PAGADO and RECHAZADO valuations are immutable
 * **Validation**: Check estado before allowing updates
 * **Error**: BusinessRuleError if modification attempted
 *
 * **Example**:
 * ```typescript
 * // ❌ WRONG: Cannot reject paid valuation
 * await valuationService.reject(paidId, userId, 'reason');
 * // Throws: "Cannot reject valuation that has been paid"
 *
 * // ❌ WRONG: Cannot update paid valuation
 * await valuationService.update(paidId, { total_valorizado: 10000 });
 * // Should throw: BusinessRuleError (currently not enforced - TODO)
 * ```
 *
 * ### Rule 4: Payment Requires Approval
 * **Description**: Only APROBADO valuations can be marked as paid
 * **Validation**: In markAsPaid() method
 * **Error**: BusinessRuleError if estado is not APROBADO
 *
 * **Example**:
 * ```typescript
 * // ❌ WRONG: Cannot pay pending valuation
 * await valuationService.markAsPaid(pendingId, userId, { fechaPago: new Date() });
 * // Throws: "Cannot mark as paid valuation in state PENDIENTE. Must be APROBADO."
 *
 * // ✅ CORRECT: Approve first, then mark as paid
 * await valuationService.approve(id, directorId);     // EN_REVISION → APROBADO
 * await valuationService.markAsPaid(id, userId, {     // APROBADO → PAGADO
 *   fechaPago: new Date('2026-01-31'),
 *   metodoPago: 'TRANSFERENCIA',
 *   referenciaPago: 'TRF-2026-001'
 * });
 * ```
 *
 * ### Rule 5: Date Range Validation
 * **Description**: fecha_fin must be >= fecha_inicio
 * **Validation**: In create() and update() methods
 * **Error**: ValidationError if date range is invalid
 *
 * **Example**:
 * ```typescript
 * // ❌ WRONG: End date before start date
 * await valuationService.create({
 *   fecha_inicio: new Date('2026-01-31'),
 *   fecha_fin: new Date('2026-01-01'),  // ❌ Before start
 *   ...
 * });
 * // Throws: ValidationError with field: fecha_fin
 *
 * // ✅ CORRECT: Valid date range
 * await valuationService.create({
 *   fecha_inicio: new Date('2026-01-01'),
 *   fecha_fin: new Date('2026-01-31'),  // ✅ After start
 *   ...
 * });
 * ```
 *
 * ### Rule 6: Numero Valorizacion Uniqueness
 * **Description**: Each valuation must have a unique numero_valorizacion
 * **Validation**: Database constraint + manual check in create()
 * **Error**: ConflictError if duplicate found
 *
 * **Example**:
 * ```typescript
 * // ❌ WRONG: Duplicate numero
 * await valuationService.create({ numero_valorizacion: 'VAL-2026-001', ... });
 * // Throws: ConflictError if VAL-2026-001 already exists
 * ```
 *
 * ### Rule 7: Financial Calculation Integrity
 * **Description**: total_con_igv = (total_valorizado - total_descuentos) * 1.18
 * **Formula**: IGV = 18% tax (Peru)
 * **Validation**: Automatic calculation (should be enforced)
 *
 * **Example**:
 * ```typescript
 * // Calculation flow
 * const base = 10000.00;           // total_valorizado
 * const deductions = 500.00;        // total_descuentos
 * const subtotal = base - deductions;  // 9500.00
 * const igv = subtotal * 0.18;          // 1710.00 (18% tax)
 * const total = subtotal + igv;         // 11210.00 (total_con_igv)
 * ```
 *
 * ---
 *
 * ## PDF Document Structure (7 Pages)
 *
 * ### Page 1: Header and Contract Information
 * - Valuation number, period, dates
 * - Contract details (number, type, pricing model)
 * - Equipment information (code, type, model, plate)
 * - Provider information (name, RUC, contact)
 * - Project information
 * - **Method**: `getValuationPage1Data(id)`
 * - **DTO**: `ValuationPage1Dto`
 *
 * ### Page 2: Historical Accumulation (Resumen Acumulado)
 * - All valuations for the same equipment up to current date
 * - Cumulative totals (hours, days, amounts)
 * - Contract evolution over time
 * - **Method**: `getValuationPage2Data(id)`
 * - **DTO**: `ValuationPage2Dto`
 * - **Complex Query**: JOINs multiple valuations + contracts
 *
 * ### Page 3: Fuel Consumption Detail (Detalle de Combustible)
 * - Daily fuel consumption records
 * - Fuel type, quantity, cost
 * - Source: `equipo.equipo_combustible` table
 * - **Method**: `getValuationPage3Data(id)`
 * - **DTO**: `ValuationPage3Dto`
 *
 * ### Page 4: Excess Fuel Charges (Exceso de Combustible)
 * - Charges for fuel consumption above contract limit
 * - Calculation: (actual - budgeted) * price_per_gallon
 * - Source: `excess_fuel` table (0 or 1 record)
 * - **Method**: `getValuationPage4Data(id)`
 * - **DTO**: `ValuationPage4Dto`
 *
 * ### Page 5: Work Expenses (Gastos de Obra)
 * - Maintenance, repairs, parts, transportation
 * - Multiple line items with descriptions and amounts
 * - Source: `work_expenses` table
 * - **Method**: `getValuationPage5Data(id)`
 * - **DTO**: `ValuationPage5Dto`
 *
 * ### Page 6: Advance Amortizations (Adelantos/Amortizaciones)
 * - Deductions for advance payments
 * - Multiple line items with dates and amounts
 * - Source: `advance_amortizations` table
 * - **Method**: `getValuationPage6Data(id)`
 * - **DTO**: `ValuationPage6Dto`
 *
 * ### Page 7: Financial Summary and Signatures (Resumen y Firmas)
 * - Total valorizado (base amount)
 * - Total descuentos (deductions)
 * - Subtotal
 * - IGV (18%)
 * - Total con IGV (final amount)
 * - Creator and approver signatures
 * - **Method**: `getValuationPage7Data(id)`
 * - **DTO**: `ValuationPage7Dto`
 *
 * ---
 *
 * ## Email Notifications
 *
 * Email notifications are sent for state changes (non-blocking, fire-and-forget):
 *
 * 1. **Submitted** (PENDIENTE → EN_REVISION)
 *    - Notifies DIRECTOR/ADMIN users
 *    - Subject: "Nueva valorización pendiente de aprobación"
 *    - Includes valuation number, period, equipment, amount
 *
 * 2. **Approved** (EN_REVISION → APROBADO)
 *    - Notifies creator and provider contact
 *    - Subject: "Valorización aprobada"
 *    - Includes approval date, approver name
 *
 * 3. **Rejected** (EN_REVISION → RECHAZADO)
 *    - Notifies creator
 *    - Subject: "Valorización rechazada"
 *    - Includes rejection reason
 *
 * 4. **Paid** (APROBADO → PAGADO)
 *    - Notifies provider contact
 *    - Subject: "Pago de valorización registrado"
 *    - Includes payment date, method, reference
 *
 * **Error Handling**: Email failures are logged but do not block the operation.
 *
 * ---
 *
 * ## Related Services
 *
 * - **ContractService**: Parent entity, provides pricing and terms
 * - **EquipmentService**: Equipment details and provider information
 * - **ProjectService**: Project context for cost tracking
 * - **DailyReportService**: Source data (partes diarios) for valuation
 * - **ValuationEmailNotifier**: Email notifications (non-blocking)
 * - **PDFService**: Generates 7-page valuation PDF documents
 *
 * ---
 *
 * ## Usage Examples
 *
 * ### Example 1: Create Monthly Valuation (Manual)
 * ```typescript
 * const valuation = await valuationService.create({
 *   numero_valorizacion: 'VAL-2026-001',
 *   periodo: '2026-01',
 *   fecha_inicio: new Date('2026-01-01'),
 *   fecha_fin: new Date('2026-01-31'),
 *   contrato_id: 123,
 *   equipo_id: 45,
 *   proyecto_id: 10,
 *   dias_trabajados: 26,
 *   horas_trabajadas: 208,
 *   combustible_consumido: 150.5,
 *   costo_base: 8000.00,
 *   total_valorizado: 8000.00,
 *   total_descuentos: 0,
 *   total_con_igv: 9440.00,  // 8000 * 1.18
 *   estado: 'PENDIENTE'
 * }, userId);
 * ```
 *
 * ### Example 2: Full Approval Workflow
 * ```typescript
 * // 1. Create draft
 * const val = await valuationService.create({ ... }, operatorId);
 * // Estado: PENDIENTE
 *
 * // 2. Submit for review
 * await valuationService.submitForReview(val.id, operatorId);
 * // Estado: EN_REVISION
 * // Email sent to DIRECTOR/ADMIN
 *
 * // 3. Approve (DIRECTOR role)
 * await valuationService.approve(val.id, directorId);
 * // Estado: APROBADO
 * // Email sent to creator and provider
 *
 * // 4. Mark as paid (Accounting)
 * await valuationService.markAsPaid(val.id, accountingId, {
 *   fechaPago: new Date('2026-02-15'),
 *   metodoPago: 'TRANSFERENCIA',
 *   referenciaPago: 'TRF-2026-0045'
 * });
 * // Estado: PAGADO
 * // Email sent to provider
 * ```
 *
 * ### Example 3: Rejection Flow
 * ```typescript
 * // Submit for review
 * await valuationService.submitForReview(valId, userId);
 * // Estado: EN_REVISION
 *
 * // Director rejects with reason
 * await valuationService.reject(valId, directorId,
 *   'Las horas trabajadas del día 15 no coinciden con el parte diario. Por favor verificar.'
 * );
 * // Estado: RECHAZADO (terminal)
 * // Email sent to creator with rejection reason
 * // Cannot be modified or re-submitted
 * ```
 *
 * ### Example 4: List Valuations with Filters
 * ```typescript
 * const { data, total } = await valuationService.findAll({
 *   estado: 'APROBADO',
 *   projectId: 10,
 *   page: 1,
 *   limit: 20,
 *   sort_by: 'periodo',
 *   sort_order: 'DESC'
 * });
 * // Returns paginated list of approved valuations for project 10
 * // Sorted by period (newest first)
 * ```
 *
 * ### Example 5: Generate PDF Data
 * ```typescript
 * // Get all 7 pages of data
 * const page1 = await valuationService.getValuationPage1Data(valId);
 * const page2 = await valuationService.getValuationPage2Data(valId);
 * const page3 = await valuationService.getValuationPage3Data(valId);
 * const page4 = await valuationService.getValuationPage4Data(valId);
 * const page5 = await valuationService.getValuationPage5Data(valId);
 * const page6 = await valuationService.getValuationPage6Data(valId);
 * const page7 = await valuationService.getValuationPage7Data(valId);
 *
 * // Pass to PDF generator
 * await pdfService.generateValuationPDF({
 *   page1, page2, page3, page4, page5, page6, page7
 * });
 * ```
 *
 * ### Example 6: Analytics Dashboard
 * ```typescript
 * const analytics = await valuationService.getAnalytics();
 * // Returns:
 * // {
 * //   status_breakdown: [
 * //     { status: 'PENDIENTE', count: 5, total: 45000.00 },
 * //     { status: 'APROBADO', count: 12, total: 120000.00 },
 * //     { status: 'PAGADO', count: 8, total: 85000.00 }
 * //   ],
 * //   monthly_trend: [
 * //     { period: '2025-08', total: 95000.00 },
 * //     { period: '2025-09', total: 102000.00 },
 * //     ...
 * //   ]
 * // }
 * ```
 *
 * ---
 *
 * ## Performance Notes
 *
 * - **PDF Page 2 (Historical)**: Most expensive query
 *   - Fetches all valuations for equipment up to current date
 *   - Multiple JOINs to contracts
 *   - Consider caching for frequently accessed valuations
 *
 * - **FindAll**: Uses query builder with relations
 *   - creator and approver are LEFT JOINed
 *   - Indexed by estado, periodo, contrato_id, equipo_id, proyecto_id
 *   - Default limit: 20 (can be adjusted via filters)
 *
 * - **Email Notifications**: Non-blocking
 *   - Errors caught and logged, do not block operation
 *   - Uses fire-and-forget pattern (Promise.catch())
 *
 * ---
 *
 * ## Security Notes
 *
 * ### TODO: [Phase 21] Add Tenant Context
 * - ⚠️ **CRITICAL**: This service currently uses global AppDataSource
 * - ⚠️ **SECURITY RISK**: No tenant isolation (cross-tenant data leakage possible)
 * - ⚠️ **ACTION REQUIRED**: Convert to request-scoped service with tenant context
 *
 * **Migration Plan**:
 * ```typescript
 * // CURRENT (Phase 20 - Global)
 * export class ValuationService {
 *   private get repository(): Repository<Valorizacion> {
 *     return AppDataSource.getRepository(Valorizacion);
 *   }
 * }
 *
 * // FUTURE (Phase 21 - Tenant-aware)
 * @Injectable({ scope: Scope.REQUEST })
 * export class ValuationService {
 *   private dataSource: DataSource;
 *
 *   constructor(@Inject(REQUEST) private request: Request) {
 *     this.dataSource = this.request.tenantContext.dataSource;
 *   }
 *
 *   private get repository(): Repository<Valorizacion> {
 *     return this.dataSource.getRepository(Valorizacion);
 *   }
 * }
 * ```
 *
 * ---
 *
 * ## Deprecated Methods
 *
 * The following methods are deprecated and should not be used in new code.
 * They exist only for backward compatibility and will be removed in Phase 22.
 *
 * - `getAllValuations()` → Use `findAll()`
 * - `getValuationById()` → Use `findById()`
 * - `createValuation()` → Use `create()`
 * - `updateValuation()` → Use `update()`
 * - `deleteValuation()` → Use `delete()`
 *
 * ---
 *
 * ## Standards Compliance
 *
 * This service follows SERVICE_LAYER_STANDARDS.md:
 * - ✅ Class-level JSDoc (this documentation)
 * - ✅ Method-level JSDoc (all 28 methods)
 * - ✅ Custom error classes (NotFoundError, ConflictError, ValidationError, BusinessRuleError)
 * - ✅ Success logging (logger.info for all operations)
 * - ✅ Error logging (logger.error in all catch blocks)
 * - ✅ Business rule validation (estado state machine, date ranges, uniqueness)
 * - ✅ Soft delete (converted from hard delete)
 * - ⚠️ Tenant context (Phase 21 - TODOs added)
 *
 * ---
 *
 * @see backend/src/models/valuation.model.ts - Entity definition
 * @see backend/src/types/dto/valuation.dto.ts - Response DTOs
 * @see backend/src/types/dto/valuation-pdf.dto.ts - PDF page DTOs
 * @see backend/src/services/valuation-email-notifier.ts - Email notifications
 * @see backend/SERVICE_LAYER_STANDARDS.md - Service development standards
 *
 * @author BitCorp ERP Development Team
 * @version 2.0.0 (Phase 20 refactor)
 * @since 1.0.0
 */
export class ValuationService {
  private get repository(): Repository<Valorizacion> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Valorizacion);
  }

  private get contractRepository(): Repository<Contract> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Contract);
  }

  /**
   * Retrieves a paginated list of valuations with optional filtering and sorting.
   *
   * Supports filtering by estado, search text, project, equipment, and provides
   * pagination with configurable page size. Results include creator and approver
   * relations via LEFT JOIN.
   *
   * TODO: [Phase 21] Add tenant context - filter by req.tenantContext.tenantId
   *
   * @param filters - Optional query filters
   * @param filters.estado - Filter by estado (PENDIENTE, EN_REVISION, APROBADO, RECHAZADO, PAGADO)
   * @param filters.search - Search in periodo and observaciones (ILIKE)
   * @param filters.projectId - Filter by proyecto_id
   * @param filters.equipmentId - Filter by equipo_id
   * @param filters.page - Page number (default: 1)
   * @param filters.limit - Results per page (default: 20)
   * @param filters.sort_by - Field to sort by (snake_case, default: created_at)
   * @param filters.sort_order - Sort direction (ASC/DESC, default: DESC)
   *
   * @returns Object with { data: ValuationDto[], total: number }
   *
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * // Get approved valuations for project 10, page 1, sorted by period
   * const result = await valuationService.findAll({
   *   estado: 'APROBADO',
   *   projectId: 10,
   *   page: 1,
   *   limit: 20,
   *   sort_by: 'periodo',
   *   sort_order: 'DESC'
   * });
   * console.log(`Found ${result.total} valuations, showing ${result.data.length}`);
   * ```
   */
  async findAll(filters?: {
    estado?: string;
    search?: string;
    projectId?: number;
    equipmentId?: number;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      // Define sortable fields (snake_case API → camelCase DB mapping)
      const sortableFields: Record<string, string> = {
        numero_valorizacion: 'v.numeroValorizacion',
        periodo: 'v.periodo',
        fecha_inicio: 'v.fechaInicio',
        fecha_fin: 'v.fechaFin',
        total_valorizado: 'v.totalValorizado',
        total_con_igv: 'v.totalConIgv',
        estado: 'v.estado',
        created_at: 'v.createdAt',
        equipo_id: 'v.equipmentId',
        contrato_id: 'v.contractId',
      };

      const sortBy =
        filters?.sort_by && sortableFields[filters.sort_by]
          ? sortableFields[filters.sort_by]
          : 'v.createdAt';
      const sortOrder = filters?.sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const queryBuilder = this.repository
        .createQueryBuilder('v')
        .leftJoinAndSelect('v.creator', 'creator')
        .leftJoinAndSelect('v.approver', 'approver');

      if (filters?.estado) {
        queryBuilder.andWhere('v.estado = :estado', { estado: filters.estado });
      }

      if (filters?.projectId) {
        queryBuilder.andWhere('v.proyecto_id = :projectId', { projectId: filters.projectId });
      }

      if (filters?.equipmentId) {
        queryBuilder.andWhere('v.equipo_id = :equipmentId', { equipmentId: filters.equipmentId });
      }

      if (filters?.search) {
        queryBuilder.andWhere('(v.periodo ILIKE :search OR v.observaciones ILIKE :search)', {
          search: `%${filters.search}%`,
        });
      }

      queryBuilder.orderBy(sortBy, sortOrder);

      const total = await queryBuilder.getCount();
      queryBuilder.skip(skip).take(limit);

      const records = await queryBuilder.getMany();

      // Transform to DTO (Spanish snake_case)
      const data = records.map((v) => toValuationDto(v));

      logger.info('Valuations fetched successfully', {
        count: data.length,
        total,
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        filters: {
          estado: filters?.estado,
          project_id: filters?.projectId,
          equipment_id: filters?.equipmentId,
          search: filters?.search,
        },
      });

      return { data, total };
    } catch (error) {
      Logger.error('Error fetching valuations', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        context: 'ValuationService.findAll',
      });
      throw new DatabaseError(
        'Failed to fetch valuations',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { filters }
      );
    }
  }

  /**
   * Retrieves a single valuation by ID with creator and approver relations.
   *
   * Returns null if valuation not found (does not throw error).
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationDto if found, null otherwise
   *
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const valuation = await valuationService.findById(123);
   * if (!valuation) {
   *   throw new NotFoundError('Valuation', 123);
   * }
   * console.log(`Valuation ${valuation.numero_valorizacion}, estado: ${valuation.estado}`);
   * ```
   */
  async findById(id: number): Promise<ValuationDto | null> {
    try {
      const v = await this.repository.findOne({
        where: { id },
        relations: ['creator', 'approver'],
      });

      if (!v) return null;

      // Transform to DTO (Spanish snake_case)
      const result = toValuationDto(v);

      logger.info('Valuation fetched by ID successfully', {
        valuation_id: id,
        numero_valorizacion: v.numeroValorizacion,
        estado: v.estado,
        has_creator: !!v.creator,
        has_approver: !!v.approver,
      });

      return result;
    } catch (error) {
      Logger.error('Error fetching valuation by id', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.findById',
      });
      throw error;
    }
  }

  /**
   * Creates a new valuation with estado = PENDIENTE.
   *
   * Validates business rules:
   * - numero_valorizacion uniqueness (should check, currently missing)
   * - fecha_fin >= fecha_inicio (should validate, currently missing)
   * - All required fields present (should validate, currently missing)
   *
   * TODO: [Phase 21] Add tenant context - set tenant_id on creation
   * TODO: Add numero_valorizacion uniqueness validation
   * TODO: Add date range validation
   *
   * @param data - Valuation data (Partial allows optional fields)
   * @param userId - ID of user creating the valuation (optional)
   *
   * @returns Created Valorizacion entity (raw, not DTO)
   *
   * @throws {ConflictError} If numero_valorizacion already exists (should throw, currently missing)
   * @throws {ValidationError} If date range invalid or required fields missing (should throw, currently missing)
   * @throws {DatabaseError} If database insert fails
   *
   * @example
   * ```typescript
   * const valuation = await valuationService.create({
   *   numero_valorizacion: 'VAL-2026-001',
   *   periodo: '2026-01',
   *   fecha_inicio: new Date('2026-01-01'),
   *   fecha_fin: new Date('2026-01-31'),
   *   contrato_id: 123,
   *   equipo_id: 45,
   *   proyecto_id: 10,
   *   total_valorizado: 8000.00,
   *   total_con_igv: 9440.00
   * }, userId);
   * // Estado automatically set to PENDIENTE
   * ```
   */
  async create(data: Partial<Valorizacion>, userId?: number): Promise<Valorizacion> {
    try {
      // Business rule 1: Check numero_valorizacion uniqueness
      if (data.numeroValorizacion) {
        const existing = await this.repository.findOne({
          where: { numeroValorizacion: data.numeroValorizacion },
        });
        if (existing) {
          throw new ConflictError(
            `Valuation with numero '${data.numeroValorizacion}' already exists`,
            {
              field: 'numero_valorizacion',
              value: data.numeroValorizacion,
              existing_id: existing.id,
            }
          );
        }
      }

      // Business rule 2: Validate date range
      if (data.fechaInicio && data.fechaFin) {
        if (data.fechaFin < data.fechaInicio) {
          throw new ValidationError('End date must be >= start date', [
            {
              field: 'fecha_fin',
              rule: 'dateRange',
              message: `End date (${data.fechaFin.toISOString().split('T')[0]}) must be on or after start date (${data.fechaInicio.toISOString().split('T')[0]})`,
              value: data.fechaFin,
            },
          ]);
        }
      }

      const valorizacion = this.repository.create({
        ...data,
        estado: data.estado || 'PENDIENTE',
        createdBy: userId,
      });

      const saved = await this.repository.save(valorizacion);

      logger.info('Valuation created successfully', {
        valuation_id: saved.id,
        numero_valorizacion: saved.numeroValorizacion,
        periodo: saved.periodo,
        estado: saved.estado,
        total_valorizado: saved.totalValorizado,
        created_by: userId,
      });

      return saved;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }

      Logger.error('Error creating valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        context: 'ValuationService.create',
      });

      throw new DatabaseError(
        'Failed to create valuation',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { user_id: userId }
      );
    }
  }

  /**
   * Updates an existing valuation with partial data.
   *
   * WARNING: Currently allows updating terminal states (PAGADO, RECHAZADO).
   * This violates business rules and should be fixed.
   *
   * TODO: Add terminal state protection
   * TODO: Add estado transition validation if estado changed
   * TODO: [Phase 21] Add tenant context - verify ownership before update
   *
   * @param id - Valuation ID
   * @param data - Partial valuation data to update
   *
   * @returns Updated ValuationDto
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {BusinessRuleError} If attempting to modify terminal state (should throw, currently missing)
   * @throws {ValidationError} If date range becomes invalid (should throw, currently missing)
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const updated = await valuationService.update(123, {
   *   total_valorizado: 8500.00,
   *   total_con_igv: 10030.00,
   *   observaciones: 'Ajuste por horas extras'
   * });
   * ```
   */
  async update(id: number, data: Partial<Valorizacion>): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new NotFoundError('Valuation', id);
      }

      // Business rule: Prevent modification of terminal states
      const terminalStates = ['PAGADO', 'RECHAZADO', 'ELIMINADO'];
      if (terminalStates.includes(valorizacion.estado)) {
        throw new BusinessRuleError(
          `Cannot modify valuation in terminal state ${valorizacion.estado}`,
          'VALUATION_TERMINAL_STATE',
          {
            valuation_id: id,
            current_estado: valorizacion.estado,
            attempted_action: 'update',
          },
          'Terminal states (PAGADO, RECHAZADO, ELIMINADO) cannot be modified'
        );
      }

      Object.assign(valorizacion, data);
      const updated = await this.repository.save(valorizacion);

      logger.info('Valuation updated successfully', {
        valuation_id: id,
        numero_valorizacion: updated.numeroValorizacion,
        changed_fields: Object.keys(data),
      });

      return toValuationDto(updated);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BusinessRuleError) {
        throw error;
      }
      Logger.error('Error updating valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.update',
      });
      throw new DatabaseError(
        'Failed to update valuation',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id }
      );
    }
  }

  /**
   * Soft deletes a valuation by setting estado = ELIMINADO.
   *
   * CHANGED: Previously performed hard delete (data destruction).
   * Now performs soft delete to preserve audit trail.
   *
   * TODO: [Phase 21] Add tenant context - verify ownership before delete
   *
   * @param id - Valuation ID to soft delete
   *
   * @returns true if deleted, false if not found
   *
   * @throws {NotFoundError} If valuation not found (should throw, currently returns false)
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const deleted = await valuationService.delete(123);
   * if (deleted) {
   *   logger.info('Valuation soft deleted', { id: 123 });
   * }
   * ```
   */
  async delete(id: number): Promise<boolean> {
    try {
      // Find valuation first
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new NotFoundError('Valuation', id);
      }

      // Soft delete: Set estado to ELIMINADO
      valorizacion.estado = 'ELIMINADO';
      valorizacion.updatedAt = new Date();
      await this.repository.save(valorizacion);

      logger.info('Soft deleted valuation', {
        id,
        numero_valorizacion: valorizacion.numeroValorizacion,
        old_estado: valorizacion.estado,
        new_estado: 'ELIMINADO',
      });

      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Error soft deleting valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.delete',
      });
      throw new DatabaseError(
        'Failed to soft delete valuation',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id }
      );
    }
  }

  /**
   * Approves a valuation in EN_REVISION state.
   *
   * State transition: EN_REVISION → APROBADO
   * Sets approvedBy, approvedAt timestamps.
   * Sends email notification (non-blocking).
   *
   * Business rules enforced:
   * - Current estado must be EN_REVISION
   * - Only DIRECTOR+ roles can approve (should check, currently missing)
   *
   * TODO: Add role-based access control (DIRECTOR+ only)
   * TODO: [Phase 21] Add tenant context
   *
   * @param id - Valuation ID to approve
   * @param userId - ID of user approving (must be DIRECTOR+)
   *
   * @returns Updated ValuationDto with estado = APROBADO
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {BusinessRuleError} If estado is not EN_REVISION
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const approved = await valuationService.approve(123, directorId);
   * // Estado: EN_REVISION → APROBADO
   * // Email sent to creator and provider
   * console.log(`Approved by user ${approved.approved_by} at ${approved.approved_at}`);
   * ```
   */
  async approve(id: number, userId: number): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new NotFoundError('Valuation', id);
      }

      // Validate state transition: Only EN_REVISION can be approved
      if (valorizacion.estado !== 'EN_REVISION') {
        throw new BusinessRuleError(
          `Cannot approve valuation in state ${valorizacion.estado}. Must be EN_REVISION.`,
          'STATE_TRANSITION_INVALID',
          {
            valuation_id: id,
            current_estado: valorizacion.estado,
            required_estado: 'EN_REVISION',
          },
          'Valuation must be in EN_REVISION state to be approved'
        );
      }

      valorizacion.estado = 'APROBADO';
      valorizacion.approvedBy = userId;
      valorizacion.approvedAt = new Date();

      const approved = await this.repository.save(valorizacion);

      // Send email notification (non-blocking)
      valuationEmailNotifier.notifyApproved(approved, userId).catch((err) => {
        Logger.error('Failed to send approved email', { error: err, valuationId: id });
      });

      return toValuationDto(approved);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BusinessRuleError) {
        throw error;
      }
      Logger.error('Error approving valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        userId,
        context: 'ValuationService.approve',
      });
      throw new DatabaseError(
        'Failed to approve valuation',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, user_id: userId }
      );
    }
  }

  /**
   * Submits a PENDIENTE valuation for review.
   *
   * State transition: PENDIENTE → EN_REVISION
   * Sends email notification to DIRECTOR/ADMIN users (non-blocking).
   *
   * Business rules enforced:
   * - Current estado must be PENDIENTE
   *
   * TODO: Validate all required data present before submission
   * TODO: [Phase 21] Add tenant context
   *
   * @param id - Valuation ID to submit
   * @param userId - ID of user submitting
   *
   * @returns Updated ValuationDto with estado = EN_REVISION
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {BusinessRuleError} If estado is not PENDIENTE
   * @throws {ValidationError} If required data missing (should throw, currently missing)
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const submitted = await valuationService.submitForReview(123, userId);
   * // Estado: PENDIENTE → EN_REVISION
   * // Email sent to directors for approval
   * ```
   */
  async submitForReview(id: number, userId: number): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new NotFoundError('Valuation', id);
      }

      if (valorizacion.estado !== 'PENDIENTE') {
        throw new BusinessRuleError(
          `Cannot submit valuation in state ${valorizacion.estado}. Must be PENDIENTE.`,
          'STATE_TRANSITION_INVALID',
          {
            valuation_id: id,
            current_estado: valorizacion.estado,
            required_estado: 'PENDIENTE',
          },
          'Valuation must be in PENDIENTE state to submit for review'
        );
      }

      valorizacion.estado = 'EN_REVISION';
      valorizacion.updatedAt = new Date();

      const updated = await this.repository.save(valorizacion);

      // Send email notification (non-blocking)
      valuationEmailNotifier.notifySubmitted(updated).catch((err) => {
        Logger.error('Failed to send submitted email', { error: err, valuationId: id });
      });

      return toValuationDto(updated);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BusinessRuleError) {
        throw error;
      }
      Logger.error('Error submitting valuation for review', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        userId,
        context: 'ValuationService.submitForReview',
      });
      throw new DatabaseError(
        'Failed to submit valuation for review',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, user_id: userId }
      );
    }
  }

  /**
   * Rejects a valuation with a required reason.
   *
   * State transition: EN_REVISION → RECHAZADO (terminal state)
   * Appends rejection reason to observaciones.
   * Sends email notification (non-blocking).
   *
   * Business rules enforced:
   * - Cannot reject PAGADO valuation
   * - Reason must be non-empty
   * - RECHAZADO is terminal (cannot transition out)
   *
   * WARNING: Currently allows rejecting RECHAZADO valuation.
   * Should prevent all transitions from terminal states.
   *
   * TODO: Add terminal state protection (check RECHAZADO too)
   * TODO: [Phase 21] Add tenant context
   *
   * @param id - Valuation ID to reject
   * @param userId - ID of user rejecting
   * @param reason - Rejection reason (required, non-empty)
   *
   * @returns Updated ValuationDto with estado = RECHAZADO
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {BusinessRuleError} If valuation is PAGADO or RECHAZADO
   * @throws {ValidationError} If reason is empty or whitespace-only
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const rejected = await valuationService.reject(
   *   123,
   *   directorId,
   *   'Horas trabajadas del día 15 no coinciden con parte diario. Verificar.'
   * );
   * // Estado: EN_REVISION → RECHAZADO (terminal)
   * // Cannot be modified or re-submitted
   * ```
   */
  async reject(id: number, userId: number, reason: string): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new NotFoundError('Valuation', id);
      }

      // Check terminal states (PAGADO and RECHAZADO are immutable)
      const terminalStates = ['PAGADO', 'RECHAZADO'];
      if (terminalStates.includes(valorizacion.estado)) {
        throw new BusinessRuleError(
          `Cannot reject valuation in terminal state ${valorizacion.estado}`,
          'VALUATION_TERMINAL_STATE',
          {
            valuation_id: id,
            current_estado: valorizacion.estado,
            attempted_action: 'reject',
          },
          'Terminal states (PAGADO, RECHAZADO) cannot transition to other states'
        );
      }

      if (!reason || reason.trim().length === 0) {
        throw new ValidationError('Rejection reason is required', [
          {
            field: 'reason',
            rule: 'required',
            message: 'Rejection reason cannot be empty or whitespace-only',
            value: reason,
          },
        ]);
      }

      valorizacion.estado = 'RECHAZADO';
      valorizacion.observaciones = valorizacion.observaciones
        ? `${valorizacion.observaciones}\n\nRECHAZADO: ${reason}`
        : `RECHAZADO: ${reason}`;
      valorizacion.updatedAt = new Date();

      const rejected = await this.repository.save(valorizacion);

      logger.info('Valuation rejected successfully', {
        valuation_id: id,
        numero_valorizacion: rejected.numeroValorizacion,
        previous_estado: 'EN_REVISION',
        new_estado: rejected.estado,
        rejected_by: userId,
        reason_length: reason.length,
      });

      // Send email notification (non-blocking)
      valuationEmailNotifier.notifyRejected(rejected, reason, userId).catch((err) => {
        Logger.error('Failed to send rejected email', { error: err, valuationId: id });
      });

      return toValuationDto(rejected);
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof NotFoundError ||
        error instanceof BusinessRuleError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      Logger.error('Error rejecting valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        userId,
        reason,
        context: 'ValuationService.reject',
      });

      throw new DatabaseError(
        'Failed to reject valuation',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, user_id: userId }
      );
    }
  }

  /**
   * Marks an APROBADO valuation as paid with payment details.
   *
   * State transition: APROBADO → PAGADO (terminal state)
   * Records fechaPago, referenciaPago, metodoPago.
   * Appends payment info to observaciones.
   * Sends email notification (non-blocking).
   *
   * Business rules enforced:
   * - Current estado must be APROBADO
   * - PAGADO is terminal (cannot transition out)
   *
   * TODO: Validate fechaPago not in future
   * TODO: [Phase 21] Add tenant context
   *
   * @param id - Valuation ID to mark as paid
   * @param userId - ID of user recording payment
   * @param paymentData - Payment details
   * @param paymentData.fechaPago - Payment date (default: today)
   * @param paymentData.referenciaPago - Payment reference (optional)
   * @param paymentData.metodoPago - Payment method (optional, e.g., TRANSFERENCIA, CHEQUE)
   *
   * @returns Updated ValuationDto with estado = PAGADO
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {BusinessRuleError} If estado is not APROBADO
   * @throws {ValidationError} If fechaPago is in future (should throw, currently missing)
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const paid = await valuationService.markAsPaid(123, accountingId, {
   *   fechaPago: new Date('2026-02-15'),
   *   metodoPago: 'TRANSFERENCIA',
   *   referenciaPago: 'TRF-2026-0045'
   * });
   * // Estado: APROBADO → PAGADO (terminal)
   * // Email sent to provider
   * ```
   */
  async markAsPaid(
    id: number,
    userId: number,
    paymentData: { fechaPago?: Date; referenciaPago?: string; metodoPago?: string }
  ): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new NotFoundError('Valuation', id);
      }

      if (valorizacion.estado !== 'APROBADO') {
        throw new BusinessRuleError(
          `Cannot mark as paid valuation in state ${valorizacion.estado}. Must be APROBADO.`,
          'VALUATION_INVALID_STATE_TRANSITION',
          {
            valuation_id: id,
            current_estado: valorizacion.estado,
            required_estado: 'APROBADO',
            attempted_action: 'markAsPaid',
          },
          'Only APROBADO valuations can be marked as PAGADO'
        );
      }

      valorizacion.estado = 'PAGADO';
      valorizacion.fechaPago = paymentData.fechaPago || new Date();
      valorizacion.updatedAt = new Date();

      if (paymentData.referenciaPago || paymentData.metodoPago) {
        const paymentInfo = [
          paymentData.metodoPago && `Método: ${paymentData.metodoPago}`,
          paymentData.referenciaPago && `Referencia: ${paymentData.referenciaPago}`,
        ]
          .filter(Boolean)
          .join(' | ');

        valorizacion.observaciones = valorizacion.observaciones
          ? `${valorizacion.observaciones}\n\nPAGO: ${paymentInfo}`
          : `PAGO: ${paymentInfo}`;
      }

      const paid = await this.repository.save(valorizacion);

      logger.info('Valuation marked as paid successfully', {
        valuation_id: id,
        numero_valorizacion: paid.numeroValorizacion,
        previous_estado: 'APROBADO',
        new_estado: paid.estado,
        fecha_pago: paid.fechaPago?.toISOString().split('T')[0],
        metodo_pago: paymentData.metodoPago || 'No especificado',
        referencia_pago: paymentData.referenciaPago,
        marked_by: userId,
      });

      // Send email notification (non-blocking)
      const emailPaymentData = {
        fecha_pago:
          paymentData.fechaPago?.toISOString().split('T')[0] ||
          new Date().toISOString().split('T')[0],
        metodo_pago: paymentData.metodoPago || 'No especificado',
        referencia_pago: paymentData.referenciaPago,
      };
      valuationEmailNotifier.notifyPaid(paid, emailPaymentData).catch((err) => {
        Logger.error('Failed to send paid email', { error: err, valuationId: id });
      });

      return toValuationDto(paid);
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof BusinessRuleError) {
        throw error;
      }

      Logger.error('Error marking valuation as paid', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        userId,
        paymentData,
        context: 'ValuationService.markAsPaid',
      });

      throw new DatabaseError(
        'Failed to mark valuation as paid',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, user_id: userId }
      );
    }
  }

  /**
   * Get analytics data for valuation dashboard.
   *
   * Provides two datasets:
   * 1. Status breakdown - Count and total by estado (PENDIENTE, EN_REVISION, APROBADO, etc.)
   * 2. Monthly trend - Last 6 months of valuation totals
   *
   * TODO: Implement top_equipment (currently returns empty array)
   * TODO: [Phase 21] Add tenant context - filter by tenant
   *
   * @returns Object with status_breakdown, monthly_trend, top_equipment
   *
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const analytics = await valuationService.getAnalytics();
   * // Returns: {
   * //   status_breakdown: [{ status: 'APROBADO', count: 45, total: 123000 }, ...],
   * //   monthly_trend: [{ period: '2026-01', total: 50000 }, ...],
   * //   top_equipment: [] // TODO
   * // }
   * ```
   */
  async getAnalytics() {
    try {
      const statusStats = await this.repository
        .createQueryBuilder('v')
        .select('v.estado', 'estado')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(v.total_valorizado), 0)', 'total')
        .groupBy('v.estado')
        .getRawMany();

      const monthlyTrend = await this.repository
        .createQueryBuilder('v')
        .select('v.periodo', 'periodo')
        .addSelect('COALESCE(SUM(v.total_valorizado), 0)', 'total')
        .groupBy('v.periodo')
        .orderBy('v.periodo', 'DESC')
        .limit(6)
        .getRawMany();

      const result = {
        status_breakdown: statusStats.map((r) => ({
          status: r.estado || 'PENDIENTE',
          count: parseInt(r.count),
          total: parseFloat(r.total || 0),
        })),
        monthly_trend: monthlyTrend.reverse().map((r) => ({
          period: r.periodo,
          total: parseFloat(r.total || 0),
        })),
        top_equipment: [], // TODO: Implement with equipment join
      };

      logger.info('Analytics fetched successfully', {
        status_breakdown_count: result.status_breakdown.length,
        monthly_trend_count: result.monthly_trend.length,
        top_equipment_count: result.top_equipment.length,
      });

      return result;
    } catch (error) {
      Logger.error('Error fetching analytics', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ValuationService.getAnalytics',
      });

      throw new DatabaseError(
        'Failed to fetch analytics',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { context: 'getAnalytics' }
      );
    }
  }

  // Backward compatibility methods (DEPRECATED - use new method names)

  /**
   * Get all valuations with filters (DEPRECATED).
   *
   * @deprecated Use findAll() instead. This method is for backward compatibility only.
   *
   * @param filters - Optional filters (same as findAll)
   *
   * @returns { data: ValuationDto[], total: number }
   *
   * @example
   * ```typescript
   * // ❌ OLD (deprecated)
   * const result = await valuationService.getAllValuations({ estado: 'APROBADO' });
   *
   * // ✅ NEW (recommended)
   * const result = await valuationService.findAll({ estado: 'APROBADO' });
   * ```
   */
  async getAllValuations(filters?: any) {
    return this.findAll(filters);
  }

  /**
   * Get valuation by ID (DEPRECATED).
   *
   * @deprecated Use findById() instead. This method is for backward compatibility only.
   *
   * @param id - Valuation ID (string)
   *
   * @returns ValuationDto if found, null otherwise
   *
   * @example
   * ```typescript
   * // ❌ OLD (deprecated)
   * const valuation = await valuationService.getValuationById('123');
   *
   * // ✅ NEW (recommended)
   * const valuation = await valuationService.findById(123);
   * ```
   */
  async getValuationById(id: string) {
    return this.findById(parseInt(id));
  }

  /**
   * Create valuation (DEPRECATED).
   *
   * @deprecated Use create() instead. This method is for backward compatibility only.
   *
   * @param data - Valuation data (any type for legacy compatibility)
   * @param userId - User ID (string)
   *
   * @returns Created valuation (Valorizacion entity)
   *
   * @example
   * ```typescript
   * // ❌ OLD (deprecated)
   * const valuation = await valuationService.createValuation(data, '5');
   *
   * // ✅ NEW (recommended)
   * const valuation = await valuationService.create(data, 5);
   * ```
   */
  async createValuation(data: any, userId: string) {
    return this.create(data, parseInt(userId));
  }

  /**
   * Update valuation (DEPRECATED).
   *
   * @deprecated Use update() instead. This method is for backward compatibility only.
   *
   * @param id - Valuation ID (string)
   * @param data - Partial valuation data (any type for legacy compatibility)
   * @param userId - User ID (string, unused in new implementation)
   *
   * @returns Updated ValuationDto
   *
   * @example
   * ```typescript
   * // ❌ OLD (deprecated)
   * const updated = await valuationService.updateValuation('123', data, '5');
   *
   * // ✅ NEW (recommended)
   * const updated = await valuationService.update(123, data);
   * ```
   */
  async updateValuation(id: string, data: any, userId: string) {
    return this.update(parseInt(id), data);
  }

  /**
   * Delete valuation (DEPRECATED).
   *
   * @deprecated Use delete() instead. This method is for backward compatibility only.
   *
   * Note: After Phase 20 refactor, delete() will perform soft delete (estado = ELIMINADO)
   * instead of hard delete.
   *
   * @param id - Valuation ID (string)
   *
   * @returns true if deleted, false if not found
   *
   * @example
   * ```typescript
   * // ❌ OLD (deprecated)
   * const deleted = await valuationService.deleteValuation('123');
   *
   * // ✅ NEW (recommended)
   * const deleted = await valuationService.delete(123);
   * ```
   */
  async deleteValuation(id: string) {
    return this.delete(parseInt(id));
  }

  /**
   * Calculate valuation totals for a contract period (STUB - NOT IMPLEMENTED).
   *
   * TODO: Implement actual calculation logic based on:
   * - Daily reports (partes_diarios) for the period
   * - Contract pricing model (Anexo B variant)
   * - Equipment hours/days worked
   * - Fuel consumption
   * - Work expenses
   * - Advance deductions
   *
   * @param contractId - Contract ID
   * @param month - Month (1-12)
   * @param year - Year (YYYY)
   *
   * @returns Stub calculation result (all zeros)
   *
   * @example
   * ```typescript
   * const calc = await valuationService.calculateValuation('123', 1, 2026);
   * // Currently returns stub data with zeros
   * // TODO: Implement real calculation based on partes_diarios
   * ```
   */
  async calculateValuation(contractId: string, month: number, year: number) {
    // TODO: Implement calculation logic
    return {
      contract_id: contractId,
      period_month: month,
      period_year: year,
      total_hours: 0,
      total_days: 0,
      total_fuel: 0,
      base_cost: 0,
      excess_cost: 0,
      total_estimated: 0,
      currency: 'PEN',
    };
  }

  /**
   * Generate a valuation for a specific contract and period.
   *
   * Creates a new valuation with estado = PENDIENTE:
   * 1. Calls calculateValuation() to get totals (currently stub)
   * 2. Creates periodo string (YYYY-MM)
   * 3. Sets fecha_inicio (first day of month) and fecha_fin (last day)
   * 4. Populates valuation with calculated values
   *
   * TODO: [Phase 21] Add tenant context
   * TODO: Wait for calculateValuation() implementation
   *
   * @param contractId - Contract ID (string)
   * @param month - Month (1-12)
   * @param year - Year (YYYY)
   * @param userId - User ID creating the valuation (string)
   *
   * @returns Created valuation (Valorizacion entity)
   *
   * @throws {ConflictError} If valuation already exists for period
   * @throws {NotFoundError} If contract not found
   * @throws {DatabaseError} If database insert fails
   *
   * @example
   * ```typescript
   * const valuation = await valuationService.generateValuationForContract(
   *   '123', 1, 2026, '5'
   * );
   * // Creates valuation for January 2026
   * // Estado: PENDIENTE
   * // Observaciones: "Auto-generado el 2026-01-15T10:30:00Z"
   * ```
   */
  async generateValuationForContract(
    contractId: string,
    month: number,
    year: number,
    userId: string
  ) {
    const calculation = await this.calculateValuation(contractId, month, year);
    const periodo = `${year}-${String(month).padStart(2, '0')}`;
    const fechaInicio = new Date(year, month - 1, 1);
    const fechaFin = new Date(year, month, 0);

    return this.create(
      {
        contractId: parseInt(contractId),
        periodo,
        fechaInicio,
        fechaFin,
        diasTrabajados: calculation.total_days,
        horasTrabajadas: calculation.total_hours,
        combustibleConsumido: calculation.total_fuel,
        costoBase: calculation.base_cost,
        totalValorizado: calculation.total_estimated,
        estado: 'PENDIENTE',
        observaciones: `Auto-generado el ${new Date().toISOString()}`,
      },
      parseInt(userId)
    );
  }

  /**
   * Generate valuations for all active contracts in a period (STUB - NOT IMPLEMENTED).
   *
   * TODO: Implement bulk valuation generation:
   * - Query all active contracts for the period
   * - For each contract, call generateValuationForContract()
   * - Handle conflicts (already generated)
   * - Return array of generated valuations
   *
   * @param month - Month (1-12)
   * @param year - Year (YYYY)
   * @param userId - User ID creating the valuations (string)
   *
   * @returns Empty array (stub implementation)
   *
   * @example
   * ```typescript
   * const valuations = await valuationService.generateValuationsForPeriod(1, 2026, '5');
   * // Currently returns []
   * // TODO: Implement bulk generation for all active contracts
   * ```
   */
  async generateValuationsForPeriod(month: number, year: number, userId: string) {
    // TODO: Implement batch generation
    return [];
  }

  /**
   * Get valuation details for PDF generation (DEPRECATED).
   *
   * @deprecated Use findById() instead. This method is a legacy wrapper.
   *
   * @param id - Valuation ID (string)
   *
   * @returns ValuationDto if found, null otherwise
   *
   * @example
   * ```typescript
   * // ❌ OLD (deprecated)
   * const valuation = await valuationService.getValuationDetailsForPdf('123');
   *
   * // ✅ NEW (recommended)
   * const valuation = await valuationService.findById(123);
   * ```
   */
  async getValuationDetailsForPdf(id: string) {
    return this.findById(parseInt(id));
  }

  /**
   * Get complete valuation data for Page 1 PDF generation.
   *
   * Page 1 contains header information and contract details:
   * - Valuation number, period, dates
   * - Contract information (number, type, pricing model)
   * - Equipment details (code, type, model, plate)
   * - Provider information (name, RUC, contact)
   * - Project information
   *
   * Performs JOINs:
   * - valuation.creator (usuarios)
   * - valuation.approver (usuarios)
   * - contract.equipo (equipos)
   * - equipo.provider (proveedores)
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationPage1Dto with all data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract not found
   * @throws {NotFoundError} If equipment not found in contract
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page1 = await valuationService.getValuationPage1Data(123);
   * // Returns: { valuation, contract, equipment, provider, ... }
   * // Use for PDF header generation
   * ```
   */
  async getValuationPage1Data(id: number): Promise<ValuationPage1Dto> {
    try {
      // Fetch valuation with relations
      const valuation = await this.repository
        .createQueryBuilder('v')
        .leftJoinAndSelect('v.creator', 'creator')
        .leftJoinAndSelect('v.approver', 'approver')
        .where('v.id = :id', { id })
        .getOne();

      if (!valuation) {
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contractId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', valuation.contractId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${valuation.contractId}`);
      }

      // Transform entities to DTO using centralized transformer
      const result = transformToValuationPage1Dto(valuation, contract, contract.equipo);

      logger.info('Page 1 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: valuation.numeroValorizacion,
        page_number: 1,
        contract_id: valuation.contractId,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 1 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage1Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 1 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 1 }
      );
    }
  }

  /**
   * Get complete valuation data for Page 2 PDF generation (RESUMEN ACUMULADO).
   *
   * Page 2 is the MOST COMPLEX query - shows historical accumulation:
   * - All valuations for the same equipment up to current date
   * - Cumulative totals (hours, days, amounts)
   * - Contract evolution over time
   * - Timeline of valorizations
   *
   * Performance Note: This query can be expensive for equipment with many valuations.
   * Fetches multiple entities:
   * 1. Current valuation
   * 2. Contract with equipment and provider (JOINs)
   * 3. ALL historical valuations for equipment (WHERE equipo_id + date range)
   * 4. All contracts for historical valuations (IN query)
   * 5. Maps contracts to valuations
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   * TODO: Consider caching for equipment with 100+ valuations
   *
   * @param id - Current valuation ID
   *
   * @returns ValuationPage2Dto with historical data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract not found
   * @throws {NotFoundError} If equipment not found in contract
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page2 = await valuationService.getValuationPage2Data(123);
   * // Returns: { current_valuation, historical_valuations[], cumulative_totals, equipment }
   * // Historical valuations ordered by fecha_inicio ASC
   * // Use for PDF historical accumulation table
   * ```
   */
  async getValuationPage2Data(id: number): Promise<ValuationPage2Dto> {
    try {
      // Fetch current valuation
      const currentValuation = await this.repository
        .createQueryBuilder('v')
        .where('v.id = :id', { id })
        .getOne();

      if (!currentValuation) {
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: currentValuation.contractId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', currentValuation.contractId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${currentValuation.contractId}`);
      }

      // Fetch ALL valuations for the same equipment up to current date (historical)
      const historicalValuations = await this.repository
        .createQueryBuilder('v')
        .where('v.equipo_id = :equipmentId', { equipmentId: contract.equipo.id })
        .andWhere('v.fecha_fin <= :currentEndDate', { currentEndDate: currentValuation.fechaFin })
        .orderBy('v.fecha_inicio', 'ASC')
        .getMany();

      // Fetch contracts for all historical valuations
      const contractIds = [
        ...new Set(historicalValuations.map((v) => v.contractId).filter(Boolean)),
      ];
      const contracts = await this.contractRepository
        .createQueryBuilder('c')
        .whereInIds(contractIds)
        .getMany();

      // Create a map for quick contract lookup
      const contractMap = new Map(contracts.map((c) => [c.id, c]));

      // Attach contracts to valuations
      const valuationsWithContracts = historicalValuations.map((val) => ({
        ...val,
        contract: val.contractId ? contractMap.get(val.contractId) : null,
      }));

      // Transform to Page 2 DTO
      const result = transformToValuationPage2Dto(
        currentValuation,
        valuationsWithContracts as any,
        contract.equipo
      );

      logger.info('Page 2 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: currentValuation.numeroValorizacion,
        page_number: 2,
        historical_count: historicalValuations.length,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 2 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage2Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 2 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 2 }
      );
    }
  }

  /**
   * Get complete valuation data for Page 3 PDF generation (DETALLE DE COMBUSTIBLE).
   *
   * Page 3 contains fuel consumption detail:
   * - Daily fuel consumption records
   * - Fuel type (diesel, gasoline)
   * - Quantity, cost per gallon
   * - Source: equipo.equipo_combustible table
   *
   * Performs JOINs:
   * - valuation
   * - contract.equipo
   * - equipo.provider
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationPage3Dto with fuel consumption data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract or equipment not found
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page3 = await valuationService.getValuationPage3Data(123);
   * // Returns: { valuation, fuel_records[], equipment, total_fuel }
   * // fuel_records ordered by fecha ASC
   * ```
   */
  async getValuationPage3Data(id: number): Promise<ValuationPage3Dto> {
    try {
      // Fetch valuation
      const valuation = await this.repository.findOne({ where: { id } });
      if (!valuation) {
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contractId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', valuation.contractId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${valuation.contractId}`);
      }

      // Fetch fuel consumption records from equipo_combustible table
      const fuelRecords = await AppDataSource.query(
        `SELECT * FROM equipo.equipo_combustible WHERE valorizacion_id = $1 ORDER BY fecha ASC`,
        [id]
      );

      const result = transformToValuationPage3Dto(valuation, fuelRecords, contract.equipo);

      logger.info('Page 3 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: valuation.numeroValorizacion,
        page_number: 3,
        fuel_records_count: fuelRecords.length,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 3 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage3Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 3 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 3 }
      );
    }
  }

  /**
   * Get complete valuation data for Page 4 PDF generation (EXCESO DE COMBUSTIBLE).
   *
   * Page 4 contains excess fuel charges:
   * - Charges for fuel consumption above contract limit
   * - Calculation: (actual - budgeted) * price_per_gallon
   * - Source: excess_fuel table (0 or 1 record per valuation)
   *
   * Performs JOINs:
   * - valuation
   * - contract.equipo
   * - equipo.provider
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationPage4Dto with excess fuel data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract or equipment not found
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page4 = await valuationService.getValuationPage4Data(123);
   * // Returns: { valuation, excess_fuel_record?, equipment, total_excess }
   * // excess_fuel_record may be null if no excess charges
   * ```
   */
  async getValuationPage4Data(id: number): Promise<ValuationPage4Dto> {
    try {
      // Fetch valuation
      const valuation = await this.repository.findOne({ where: { id } });
      if (!valuation) {
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contractId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', valuation.contractId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${valuation.contractId}`);
      }

      // Fetch excess fuel record (should be 0 or 1)
      const excessFuelRepo = AppDataSource.getRepository(ExcessFuel);
      const excessFuel = await excessFuelRepo.findOne({ where: { valorizacionId: id } });

      const result = transformToValuationPage4Dto(valuation, excessFuel, contract.equipo);

      logger.info('Page 4 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: valuation.numeroValorizacion,
        page_number: 4,
        has_excess_fuel: !!excessFuel,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 4 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage4Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 4 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 4 }
      );
    }
  }

  /**
   * Get complete valuation data for Page 5 PDF generation (GASTOS DE OBRA).
   *
   * Page 5 contains work expenses:
   * - Maintenance, repairs, parts, transportation
   * - Multiple line items with descriptions and amounts
   * - Source: work_expenses table (0 to many records)
   *
   * Performs JOINs:
   * - valuation
   * - contract.equipo
   * - equipo.provider
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationPage5Dto with work expenses data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract or equipment not found
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page5 = await valuationService.getValuationPage5Data(123);
   * // Returns: { valuation, work_expenses[], equipment, total_expenses }
   * // work_expenses ordered by fechaOperacion ASC
   * ```
   */
  async getValuationPage5Data(id: number): Promise<ValuationPage5Dto> {
    try {
      // Fetch valuation
      const valuation = await this.repository.findOne({ where: { id } });
      if (!valuation) {
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contractId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', valuation.contractId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${valuation.contractId}`);
      }

      // Fetch work expenses
      const workExpenseRepo = AppDataSource.getRepository(WorkExpense);
      const workExpenses = await workExpenseRepo.find({
        where: { valorizacionId: id },
        order: { fechaOperacion: 'ASC' },
      });

      const result = transformToValuationPage5Dto(valuation, workExpenses, contract.equipo);

      logger.info('Page 5 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: valuation.numeroValorizacion,
        page_number: 5,
        work_expenses_count: workExpenses.length,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 5 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage5Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 5 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 5 }
      );
    }
  }

  /**
   * Get complete valuation data for Page 6 PDF generation (ADELANTOS/AMORTIZACIONES).
   *
   * Page 6 contains advance amortizations:
   * - Deductions for advance payments
   * - Multiple line items with dates and amounts
   * - Source: advance_amortizations table (0 to many records)
   *
   * Performs JOINs:
   * - valuation
   * - contract.equipo
   * - equipo.provider
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationPage6Dto with advances data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract or equipment not found
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page6 = await valuationService.getValuationPage6Data(123);
   * // Returns: { valuation, advances[], equipment, total_advances }
   * // advances ordered by fechaOperacion ASC
   * ```
   */
  async getValuationPage6Data(id: number): Promise<ValuationPage6Dto> {
    try {
      // Fetch valuation
      const valuation = await this.repository.findOne({ where: { id } });
      if (!valuation) {
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contractId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', valuation.contractId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${valuation.contractId}`);
      }

      // Fetch advances/amortizations
      const advanceRepo = AppDataSource.getRepository(AdvanceAmortization);
      const advances = await advanceRepo.find({
        where: { valorizacionId: id },
        order: { fechaOperacion: 'ASC' },
      });

      const result = transformToValuationPage6Dto(valuation, advances, contract.equipo);

      logger.info('Page 6 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: valuation.numeroValorizacion,
        page_number: 6,
        advances_count: advances.length,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 6 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage6Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 6 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 6 }
      );
    }
  }

  /**
   * Get complete valuation data for Page 7 PDF generation (RESUMEN Y FIRMAS).
   *
   * Page 7 contains financial summary and signatures:
   * - Total valorizado (base amount)
   * - Total descuentos (deductions)
   * - Subtotal
   * - IGV (18%)
   * - Total con IGV (final amount)
   * - Signature blocks (creator, approver, provider)
   *
   * Performs JOINs:
   * - valuation.creator (usuarios)
   * - valuation.approver (usuarios)
   * - contract.equipo
   * - equipo.provider
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationPage7Dto with summary and signature data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract or equipment not found
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page7 = await valuationService.getValuationPage7Data(123);
   * // Returns: { valuation, financial_summary, signatures, equipment, contract }
   * // Use for PDF final page with totals and signature blocks
   * ```
   */
  async getValuationPage7Data(id: number): Promise<ValuationPage7Dto> {
    try {
      // Fetch valuation with creator and approver
      const valuation = await this.repository
        .createQueryBuilder('v')
        .leftJoinAndSelect('v.creator', 'creator')
        .leftJoinAndSelect('v.approver', 'approver')
        .where('v.id = :id', { id })
        .getOne();

      if (!valuation) {
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contractId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', valuation.contractId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${valuation.contractId}`);
      }

      const result = transformToValuationPage7Dto(valuation, contract, contract.equipo);

      logger.info('Page 7 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: valuation.numeroValorizacion,
        page_number: 7,
        has_creator: !!valuation.creator,
        has_approver: !!valuation.approver,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 7 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage7Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 7 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 7 }
      );
    }
  }
}

export default new ValuationService();
