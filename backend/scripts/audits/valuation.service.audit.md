# Valuation Service Audit Report

**Service**: `valuation.service.ts`  
**Date**: January 19, 2026  
**Auditor**: Phase 20 Service Layer Audit  
**Status**: 🔴 Needs Refactoring

---

## Executive Summary

| Metric                   | Value            | Status                       |
| ------------------------ | ---------------- | ---------------------------- |
| **Total Lines**          | 842              | 🔴 Very Complex              |
| **Methods**              | 28               | 🔴 Very High                 |
| **Complexity**           | 🔴 Very Complex  | Critical service             |
| **JSDoc Coverage**       | ~2%              | 🔴 Insufficient              |
| **Error Handling**       | Generic `Error`  | 🔴 Non-standard              |
| **Logging**              | Error only       | 🟡 Success logging missing   |
| **Has Tests**            | ✅ Yes           | 🟢 valuation.service.spec.ts |
| **Tenant Context**       | ❌ No            | 🔴 Security risk             |
| **Estado State Machine** | ✅ Implemented   | 🟢 5 states                  |
| **Estimated Effort**     | ~120-140 minutes | ~2-2.5 hours                 |

---

## Service Overview

### Purpose

Manages equipment rental valuations (valorizaciones) including:

- Monthly valuation lifecycle (PENDIENTE → EN_REVISION → APROBADO → PAGADO)
- State transitions with validation
- Multi-page PDF data extraction (7 pages)
- Financial calculations and analytics
- Email notifications for state changes
- Bulk valuation generation for periods

### Database Schema

**Primary Table**: `valorizaciones_equipo`

```sql
CREATE TABLE valorizaciones_equipo (
  id SERIAL PRIMARY KEY,

  -- References
  contrato_id INTEGER REFERENCES contratos_alquiler(id),
  equipo_id INTEGER REFERENCES equipos(id),
  proyecto_id INTEGER REFERENCES proyectos(id),

  -- Identification
  numero_valorizacion VARCHAR(50) UNIQUE NOT NULL,
  periodo VARCHAR(20),  -- e.g., "2026-01" (YYYY-MM)

  -- Date range
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,

  -- Financial amounts
  total_valorizado DECIMAL(12,2),     -- Base amount
  total_descuentos DECIMAL(12,2),     -- Deductions
  total_con_igv DECIMAL(12,2),        -- Amount with tax (18% IGV)

  -- Estado workflow
  estado VARCHAR(20) NOT NULL,        -- PENDIENTE | EN_REVISION | APROBADO | RECHAZADO | PAGADO
  observaciones TEXT,

  -- Payment info
  fecha_pago DATE,
  referencia_pago VARCHAR(100),
  metodo_pago VARCHAR(50),

  -- Audit fields
  created_by INTEGER REFERENCES usuarios(id),
  approved_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP
);
```

**Related Tables**:

- `contratos_alquiler` - Rental contract (parent entity)
- `equipos` - Equipment being valued
- `proyectos` - Project context
- `partes_diarios` - Daily reports (source data for valuation)
- `excess_fuel` - Extra fuel charges
- `work_expenses` - Work expenses (gastos de obra)
- `advance_amortizations` - Advance payment deductions

---

## Estado State Machine

### State Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    VALUATION LIFECYCLE                            │
└──────────────────────────────────────────────────────────────────┘

    [CREATE]
       │
       ▼
  ┌────────────┐
  │ PENDIENTE  │ ◄──── Initial state (draft)
  │  (Draft)   │
  └────────────┘
       │
       │ submitForReview()
       ▼
  ┌────────────┐
  │ EN_REVISION│ ◄──── Submitted for approval
  │ (Review)   │
  └────────────┘
       │
       ├──────────┐
       │          │
       │ approve()│ reject()
       ▼          ▼
  ┌────────────┐  ┌────────────┐
  │  APROBADO  │  │ RECHAZADO  │ ◄──── Terminal state (cannot transition)
  │ (Approved) │  │ (Rejected) │
  └────────────┘  └────────────┘
       │
       │ markAsPaid()
       ▼
  ┌────────────┐
  │   PAGADO   │ ◄──── Terminal state (cannot transition)
  │   (Paid)   │
  └────────────┘
```

### Valid State Transitions

| Current State | Valid Next States | Method              | Business Rule                          |
| ------------- | ----------------- | ------------------- | -------------------------------------- |
| PENDIENTE     | EN_REVISION       | `submitForReview()` | Must have all required data            |
| EN_REVISION   | APROBADO          | `approve()`         | Only authorized users (DIRECTOR+)      |
| EN_REVISION   | RECHAZADO         | `reject()`          | Requires rejection reason              |
| APROBADO      | PAGADO            | `markAsPaid()`      | Requires payment details               |
| RECHAZADO     | -                 | -                   | Terminal state (cannot transition out) |
| PAGADO        | -                 | -                   | Terminal state (cannot transition out) |

### Invalid Transitions

- ❌ PENDIENTE → APROBADO (must go through EN_REVISION)
- ❌ APROBADO → PENDIENTE (cannot revert after approval)
- ❌ PAGADO → any state (terminal state)
- ❌ RECHAZADO → any state (terminal state)

---

## Business Rules

### Rule 1: Estado State Machine Enforcement

**Description**: Valuations must follow strict state transitions  
**Implementation**: Validation in `approve()`, `submitForReview()`, `reject()`, `markAsPaid()`  
**Example**:

```typescript
// ❌ WRONG: Cannot approve PENDIENTE
await valuationService.approve(1, userId);
// Error: Cannot approve valuation in state PENDIENTE. Must be EN_REVISION.

// ✅ CORRECT: Submit first, then approve
await valuationService.submitForReview(1, userId); // PENDIENTE → EN_REVISION
await valuationService.approve(1, userId); // EN_REVISION → APROBADO
```

### Rule 2: Rejection Reason Required

**Description**: Rejecting a valuation requires a reason  
**Implementation**: Validation in `reject()` method  
**Example**:

```typescript
// ❌ WRONG: Empty reason
await valuationService.reject(1, userId, '');
// Error: Rejection reason is required

// ✅ CORRECT: Provide reason
await valuationService.reject(1, userId, 'Horas trabajadas incorrectas');
```

### Rule 3: Terminal States Cannot Transition

**Description**: PAGADO and RECHAZADO states cannot transition to other states  
**Implementation**: Check estado before allowing transitions  
**Example**:

```typescript
// ❌ WRONG: Cannot reject paid valuation
await valuationService.reject(paidId, userId, 'reason');
// Error: Cannot reject valuation that has been paid
```

### Rule 4: Payment Requires Approval

**Description**: Only APROBADO valuations can be marked as paid  
**Implementation**: Validation in `markAsPaid()` method  
**Example**:

```typescript
// ❌ WRONG: Cannot pay pending valuation
await valuationService.markAsPaid(pendingId, userId, { fechaPago: new Date() });
// Error: Cannot mark as paid valuation in state PENDIENTE. Must be APROBADO.
```

### Rule 5: Numero Valorizacion Uniqueness

**Description**: Each valuation must have a unique numero_valorizacion  
**Implementation**: Database constraint + validation (missing in current code)  
**Example**:

```typescript
// Should check for duplicates
const exists = await findByNumero(data.numero_valorizacion);
if (exists) throw new ConflictError(...);
```

### Rule 6: Date Range Validation

**Description**: fecha_fin must be >= fecha_inicio  
**Implementation**: Missing validation (should be added in create/update)  
**Example**:

```typescript
// Should validate
if (fecha_fin < fecha_inicio) {
  throw new ValidationError('End date must be >= start date');
}
```

### Rule 7: Financial Calculation Integrity

**Description**: total_con_igv = total_valorizado - total_descuentos + IGV (18%)  
**Implementation**: Automatic calculation (missing validation)  
**Example**:

```typescript
// Should enforce
const subtotal = total_valorizado - total_descuentos;
const igv = subtotal * 0.18;
const total_con_igv = subtotal + igv;
```

---

## Method Analysis

### Core CRUD Methods

| Method       | LOC | Complexity  | Issues                                          | Priority |
| ------------ | --- | ----------- | ----------------------------------------------- | -------- |
| `findAll()`  | 30  | 🟡 Moderate | Missing success logging, tenant context         | High     |
| `findById()` | 22  | 🟢 Simple   | Missing success logging, tenant context         | High     |
| `create()`   | 19  | 🟢 Simple   | Generic Error, missing validation, no logging   | High     |
| `update()`   | 19  | 🟢 Simple   | Generic Error, no estado validation, no logging | High     |
| `delete()`   | 14  | 🟢 Simple   | Hard delete (should be soft), no protection     | Critical |

### Estado Workflow Methods

| Method              | LOC | Complexity  | Issues                            | Priority |
| ------------------- | --- | ----------- | --------------------------------- | -------- |
| `approve()`         | 36  | 🟡 Moderate | Generic Error, no success logging | High     |
| `submitForReview()` | 34  | 🟡 Moderate | Generic Error, no success logging | High     |
| `reject()`          | 39  | 🟡 Moderate | Generic Error, no success logging | High     |
| `markAsPaid()`      | 32  | 🟡 Moderate | Generic Error, no success logging | High     |

### PDF Data Methods (7 pages)

| Method                    | LOC | Complexity  | Issues                        | Priority |
| ------------------------- | --- | ----------- | ----------------------------- | -------- |
| `getValuationPage1Data()` | 50  | 🟡 Moderate | Generic Error, complex query  | Medium   |
| `getValuationPage2Data()` | 78  | 🔴 Complex  | Generic Error, multiple joins | Medium   |
| `getValuationPage3Data()` | 43  | 🟡 Moderate | Generic Error                 | Medium   |
| `getValuationPage4Data()` | 41  | 🟡 Moderate | Generic Error                 | Medium   |
| `getValuationPage5Data()` | 44  | 🟡 Moderate | Generic Error                 | Medium   |
| `getValuationPage6Data()` | 44  | 🟡 Moderate | Generic Error                 | Medium   |
| `getValuationPage7Data()` | 37  | 🟡 Moderate | Generic Error                 | Medium   |

### Utility/Analytics Methods

| Method                           | LOC | Complexity  | Issues                    | Priority |
| -------------------------------- | --- | ----------- | ------------------------- | -------- |
| `getAnalytics()`                 | 42  | 🟡 Moderate | Generic Error, no logging | Low      |
| `calculateValuation()`           | 16  | 🟢 Simple   | Stub (not implemented)    | Low      |
| `generateValuationForContract()` | 29  | 🟡 Moderate | Generic Error             | Low      |
| `generateValuationsForPeriod()`  | 5   | 🟢 Simple   | Stub (not implemented)    | Low      |

### Deprecated/Duplicate Methods

| Method               | Status                  | Action          |
| -------------------- | ----------------------- | --------------- |
| `getAllValuations()` | Duplicate of findAll()  | Mark deprecated |
| `getValuationById()` | Duplicate of findById() | Mark deprecated |
| `createValuation()`  | Duplicate of create()   | Mark deprecated |
| `updateValuation()`  | Duplicate of update()   | Mark deprecated |
| `deleteValuation()`  | Duplicate of delete()   | Mark deprecated |

---

## Issues Found

### 🔴 Critical Issues (Must Fix)

1. **No Tenant Context** (28 methods)
   - Security vulnerability: Cross-tenant data leakage
   - All queries use global AppDataSource
   - **Fix**: Add tenant context, use request-scoped service

2. **Hard Delete** (`delete()` method)
   - Destroys audit trail
   - Should be soft delete (estado = 'ELIMINADO')
   - **Fix**: Implement soft delete

3. **Generic Error Classes** (28 methods)
   - All methods throw generic `Error`
   - Not catchable by type
   - **Fix**: Use NotFoundError, ConflictError, ValidationError, BusinessRuleError

4. **Missing Business Rule Validation**
   - No numero_valorizacion uniqueness check
   - No date range validation (fecha_fin >= fecha_inicio)
   - No financial calculation validation
   - **Fix**: Add validation in create/update

### 🟡 Major Issues (Should Fix)

5. **No Class-Level JSDoc** (~800 lines needed)
   - Service purpose unclear
   - Estado state machine not documented
   - Business rules not explained
   - **Fix**: Add comprehensive class-level JSDoc

6. **No Method-Level JSDoc** (28 methods)
   - Method purpose unclear
   - Parameters not documented
   - Return types not explained
   - **Fix**: Add JSDoc to all methods

7. **No Success Logging** (24+ methods)
   - Only error logs present
   - Cannot trace successful operations
   - **Fix**: Add logger.info() for success cases

8. **Terminal State Protection Missing**
   - No check to prevent transitions from PAGADO/RECHAZADO
   - `reject()` only checks PAGADO, not RECHAZADO
   - **Fix**: Add comprehensive terminal state checks

### 🟢 Minor Issues (Nice to Have)

9. **Deprecated Methods Not Marked** (5 methods)
   - getAllValuations, getValuationById, etc.
   - **Fix**: Add @deprecated JSDoc tags

10. **Magic Numbers** (IGV = 18%)
    - Hardcoded tax rate
    - **Fix**: Extract to constant or config

---

## Refactoring Checklist

### Phase 1: Import Custom Error Classes ✅

```typescript
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  BusinessRuleError,
  DatabaseError,
} from '../errors';
import logger from '../config/logger.config';
```

### Phase 2: Add Class-Level JSDoc (~800 lines)

- [ ] Service purpose and scope
- [ ] Database schema documentation (valorizaciones_equipo + related tables)
- [ ] Estado state machine diagram (ASCII art)
- [ ] 7 business rules with examples
- [ ] State transition table
- [ ] Financial calculation formulas
- [ ] PDF page structure (7 pages)
- [ ] Related services (contract, equipment, project)
- [ ] Usage examples (6+)
- [ ] Performance notes
- [ ] TODO: Tenant context (Phase 21)

### Phase 3: Add Method-Level JSDoc (28 methods)

**Core CRUD**:

- [ ] findAll() - List with filters, pagination, sorting
- [ ] findById() - Single entity lookup
- [ ] create() - With estado = PENDIENTE default
- [ ] update() - Partial update
- [ ] delete() - Convert to soft delete

**Estado Workflow**:

- [ ] approve() - APROBADO transition (EN_REVISION required)
- [ ] submitForReview() - EN_REVISION transition (PENDIENTE required)
- [ ] reject() - RECHAZADO transition (requires reason)
- [ ] markAsPaid() - PAGADO transition (APROBADO required)

**PDF Data** (7 methods):

- [ ] getValuationPage1Data() - Header and contract info
- [ ] getValuationPage2Data() - Equipment details and daily reports
- [ ] getValuationPage3Data() - Work hours summary
- [ ] getValuationPage4Data() - Fuel consumption
- [ ] getValuationPage5Data() - Excess fuel charges
- [ ] getValuationPage6Data() - Work expenses
- [ ] getValuationPage7Data() - Advance amortizations and totals

**Utility**:

- [ ] getAnalytics() - Dashboard statistics
- [ ] calculateValuation() - Stub (mark as TODO)
- [ ] generateValuationForContract() - Single contract generation
- [ ] generateValuationsForPeriod() - Bulk generation (stub)
- [ ] getValuationDetailsForPdf() - Legacy method

**Deprecated** (add @deprecated tag):

- [ ] getAllValuations() - Use findAll()
- [ ] getValuationById() - Use findById()
- [ ] createValuation() - Use create()
- [ ] updateValuation() - Use update()
- [ ] deleteValuation() - Use delete()

### Phase 4: Replace Generic Errors (28 methods)

**Pattern**:

```typescript
// ❌ OLD
throw new Error('Valuation not found');

// ✅ NEW
throw new NotFoundError('Valuation', id);
```

**Breakdown**:

- [ ] NotFoundError - findById, update, approve, reject, markAsPaid, PDF methods (15 locations)
- [ ] ConflictError - Duplicate numero_valorizacion (2 locations)
- [ ] ValidationError - Date range, required fields, estado checks (8 locations)
- [ ] BusinessRuleError - Terminal state transitions (3 locations)
- [ ] DatabaseError - Query failures (catch blocks)

### Phase 5: Add Success Logging (24+ methods)

**Core CRUD**:

- [ ] findAll() - Log count, page, limit, filters
- [ ] findById() - Log id, numero_valorizacion, estado
- [ ] create() - Log id, numero_valorizacion, periodo, estado
- [ ] update() - Log id, changed_fields
- [ ] delete() - Log soft delete confirmation

**Estado Workflow**:

- [ ] approve() - Log id, new_estado, approved_by, approved_at
- [ ] submitForReview() - Log id, old_estado, new_estado
- [ ] reject() - Log id, new_estado, reason
- [ ] markAsPaid() - Log id, fecha_pago, metodo_pago

**PDF Data** (7 methods):

- [ ] All getValuationPageXData() methods - Log id, page_number

**Utility**:

- [ ] getAnalytics() - Log analytics summary
- [ ] generateValuationForContract() - Log contract_id, valuation_id

### Phase 6: Add Business Rule Validation

**In create() method**:

- [ ] Validate numero_valorizacion uniqueness
- [ ] Validate fecha_fin >= fecha_inicio
- [ ] Validate contrato_id exists
- [ ] Validate periodo format (YYYY-MM)
- [ ] Set default estado = 'PENDIENTE'

**In update() method**:

- [ ] Validate estado transitions (if estado changed)
- [ ] Validate terminal states cannot be modified
- [ ] Validate date range (if dates changed)

**In approve() method**:

- [ ] Validate current estado = EN_REVISION
- [ ] Validate user has approval permission (future)

**In reject() method**:

- [ ] Validate reason is not empty
- [ ] Validate estado is not PAGADO or RECHAZADO

**In markAsPaid() method**:

- [ ] Validate current estado = APROBADO
- [ ] Validate fechaPago is not in future

### Phase 7: Convert Hard Delete to Soft Delete

**Change delete() method**:

```typescript
// ❌ OLD: Hard delete
await this.repository.delete(id);

// ✅ NEW: Soft delete
valuation.estado = 'ELIMINADO';
await this.repository.save(valuation);
```

### Phase 8: Add Tenant Context TODOs (28 methods)

```typescript
// TODO: [Phase 21] Add tenant context - use req.tenantContext.dataSource
```

### Phase 9: Mark Deprecated Methods

```typescript
/**
 * @deprecated Use findAll() instead
 */
async getAllValuations(filters?: any) { ... }
```

---

## Testing Strategy

### Existing Tests

✅ File exists: `valuation.service.spec.ts` (539 bytes - minimal tests)

### Test Coverage Needed

- [ ] Estado state machine transitions (valid + invalid)
- [ ] Business rule validation
- [ ] Error handling (custom error classes)
- [ ] Success logging verification
- [ ] Soft delete behavior
- [ ] PDF data methods (7 pages)

---

## Estimated Effort

| Task                                | Estimated Time              |
| ----------------------------------- | --------------------------- |
| Class-level JSDoc (~800 lines)      | 60 minutes                  |
| Method-level JSDoc (28 methods)     | 40 minutes                  |
| Replace generic errors (28 methods) | 20 minutes                  |
| Add success logging (24 methods)    | 15 minutes                  |
| Business rule validation (6 rules)  | 20 minutes                  |
| Convert to soft delete              | 10 minutes                  |
| Add tenant context TODOs            | 5 minutes                   |
| Testing & verification              | 15 minutes                  |
| **Total**                           | **~185 minutes (~3 hours)** |

---

## Related Files

- **Model**: `backend/src/models/valuation.model.ts`
- **DTO**: `backend/src/types/dto/valuation.dto.ts`
- **PDF DTOs**: `backend/src/types/dto/valuation-pdf.dto.ts`
- **Tests**: `backend/src/services/valuation.service.spec.ts`
- **Email Notifier**: `backend/src/services/valuation-email-notifier.ts`
- **Controller**: `backend/src/controllers/valuation.controller.ts`

---

## Dependencies

- TypeORM Repository pattern
- Custom error classes (backend/src/errors)
- Logger (backend/src/config/logger.config.ts)
- Email notifications (non-blocking, fire-and-forget)

---

## Notes

1. **Very Complex Service**: 842 lines, 28 methods - largest service so far
2. **PDF Generation**: 7-page PDF structure requires careful documentation
3. **Estado State Machine**: Critical business logic - must be clearly documented
4. **Email Notifications**: Non-blocking, catch errors independently
5. **Financial Calculations**: IGV (18%), deductions, totals - document formulas
6. **Deprecated Methods**: 5 duplicate methods - mark as deprecated
7. **Soft Delete**: Currently hard deletes - convert to soft delete (estado = 'ELIMINADO')
8. **Terminal States**: PAGADO and RECHAZADO cannot transition - enforce protection

---

**Audit Completed**: January 19, 2026  
**Next Step**: Begin refactoring following this checklist  
**Priority**: High (critical business service with security vulnerabilities)
