# Accounts Payable Service Audit

**File**: `backend/src/services/accounts-payable.service.ts`  
**Lines of Code**: 174  
**Complexity**: 🔴 Complex  
**Session**: 22  
**Date**: January 19, 2026

---

## Executive Summary

Accounts Payable Service manages financial liabilities (cuentas por pagar) - invoices and bills owed to providers (suppliers). This is a **FINANCIAL BUSINESS ENTITY** that tracks payment obligations, due dates, and payment status. Following equipment service baseline pattern with comprehensive documentation.

**Key Business Domain**: Financial management, provider invoices, payment tracking, accounts payable reporting.

---

## Current State Analysis

### File Structure

- **Total Lines**: 174
- **Service Class**: `AccountsPayableService` (lines 37-173)
- **DTO Interfaces**: `CreateAccountsPayableDto`, `UpdateAccountsPayableDto` (lines 11-35)
- **Methods**: 7 (create, findAll, findOne, update, delete, findPending, updateStatus)

### Dependencies

- ✅ **DTO Functions**: Already exist in `types/dto/accounts-payable.dto.ts`
  - `toAccountsPayableDto()`
  - `fromAccountsPayableDto()`
  - `AccountsPayableDto`
- ✅ **Repository**: `AccountsPayableRepository` (extended repository pattern)
- ✅ **Model**: `AccountsPayable` entity with `AccountsPayableStatus` enum
- ⚠️ **ERROR**: No custom error imports (NotFoundError, DatabaseError, etc.)

### Issues Found

#### 1. Error Handling Issues (7 locations)

| Line    | Method         | Issue                                                             | Severity  |
| ------- | -------------- | ----------------------------------------------------------------- | --------- |
| 52-61   | `create`       | Generic Error possible on save + reload, null-assertion (line 61) | 🔴 High   |
| 93-106  | `findAll`      | Generic Error possible on query builder operations                | 🟡 Medium |
| 110-116 | `findOne`      | No error handling, returns null silently                          | 🟢 Low    |
| 120-154 | `update`       | Generic Error possible, returns null for not found                | 🟡 Medium |
| 158-159 | `delete`       | Generic Error possible on delete operation                        | 🟡 Medium |
| 163-164 | `findPending`  | Generic Error possible on repository call                         | 🟡 Medium |
| 167-171 | `updateStatus` | Delegates to update (inherits update issues)                      | 🟢 Low    |

**Total Error Locations**: 7

- **No custom error classes used** (should use NotFoundError, DatabaseError, ConflictError)
- **Null-assertion operator** on line 61 (dangerous!)
- **Silent null returns** for not found cases

#### 2. Missing Documentation (7 methods)

| Method         | Has JSDoc? | Needs Documentation                                        |
| -------------- | ---------- | ---------------------------------------------------------- |
| `create`       | ❌ No      | Business rules, estado lifecycle, balance calculation      |
| `findAll`      | ❌ No      | Pagination, sortable fields, provider eager loading        |
| `findOne`      | ❌ No      | Returns null vs throwing NotFoundError                     |
| `update`       | ❌ No      | Dual field support (camelCase/snake_case), partial updates |
| `delete`       | ❌ No      | Hard delete vs soft delete, financial implications         |
| `findPending`  | ❌ No      | Status filter (PENDIENTE), ordering by due_date            |
| `updateStatus` | ❌ No      | Valid status transitions, estado values                    |

**Class-level JSDoc needed** (following equipment baseline):

- 4 payment statuses (PENDIENTE, PAGADO, ANULADO, PARCIAL)
- Status lifecycle and transitions
- Balance calculation (monto_total - monto_pagado)
- Currency support (PEN, USD, EUR)
- Provider relation (eager loading)
- Due date tracking and overdue logic
- Financial reporting implications
- Multi-tenancy notes

#### 3. Missing Logging (7 methods)

| Method         | Has Logging? | Should Log                                            |
| -------------- | ------------ | ----------------------------------------------------- |
| `create`       | ❌ No        | id, numero_factura, proveedor_id, monto_total, estado |
| `findAll`      | ❌ No        | total, returned, page, limit, sortBy, sortOrder       |
| `findOne`      | ❌ No        | id, found (boolean), numero_factura                   |
| `update`       | ❌ No        | id, changes (fields changed), old/new values          |
| `delete`       | ❌ No        | id, success (boolean)                                 |
| `findPending`  | ❌ No        | count of pending accounts                             |
| `updateStatus` | ❌ No        | id, old_status, new_status                            |

#### 4. Tenant Context Issues (5 locations)

| Line    | Method        | Issue                                      |
| ------- | ------------- | ------------------------------------------ |
| 93-96   | `findAll`     | Query builder missing tenant_id filter     |
| 110-112 | `findOne`     | findOne missing tenant_id in where clause  |
| 120-122 | `update`      | findOne missing tenant_id in where clause  |
| 158     | `delete`      | Delete missing tenant_id validation        |
| 163     | `findPending` | Repository method missing tenant_id filter |

**Note**: Schema blocker - `cuenta_por_pagar` table doesn't have `tenant_id` column yet. Defer to Phase 21.

#### 5. Code Quality Issues

| Line  | Issue                                    | Type         | Fix                                               |
| ----- | ---------------------------------------- | ------------ | ------------------------------------------------- |
| 61    | `reloaded!` null-assertion               | Dangerous    | Check null, throw NotFoundError                   |
| 11-35 | Dual field DTOs (camelCase + snake_case) | Inconsistent | Remove, use only snake_case (per ARCHITECTURE.md) |
| 52    | Using static repository call             | Pattern      | Should use instance repository                    |
| 163   | Using repository extended method         | OK           | Keep, but add tenant context later                |
| 171   | `updateStatus` delegates to `update`     | OK           | Simple delegation pattern                         |

#### 6. Business Logic Issues

| Issue                                             | Location           | Severity  |
| ------------------------------------------------- | ------------------ | --------- |
| No balance calculation validation                 | `create`, `update` | 🟡 Medium |
| No due date vs issue date validation              | `create`, `update` | 🟡 Medium |
| No payment amount validation (can't exceed total) | `create`, `update` | 🔴 High   |
| No status transition validation                   | `updateStatus`     | 🟡 Medium |
| Hard delete (no soft delete)                      | `delete`           | 🔴 High   |

---

## Business Rules (from Model & DTO)

### Payment Status Lifecycle

```
PENDIENTE (Pending) - Default initial status
    ↓ partial payment
PARCIAL (Partial) - Some amount paid (monto_pagado < monto_total)
    ↓ full payment
PAGADO (Paid) - Fully paid (monto_pagado >= monto_total)

PENDIENTE/PARCIAL → ANULADO (Cancelled) - Invoice cancelled
```

**Status Values** (AccountsPayableStatus enum):

- `PENDIENTE` - Pending payment
- `PARCIAL` - Partially paid
- `PAGADO` - Fully paid
- `ANULADO` - Cancelled/voided

**Valid Transitions**:

- PENDIENTE → PARCIAL (partial payment)
- PENDIENTE → PAGADO (full payment)
- PARCIAL → PAGADO (complete remaining payment)
- PENDIENTE/PARCIAL → ANULADO (cancel invoice)

**Invalid Transitions**:

- PAGADO → PENDIENTE/PARCIAL (can't unpay)
- ANULADO → any status (cancelled is permanent)

### Balance Calculation

```typescript
saldo = monto_total - monto_pagado;
```

**Rules**:

- Balance must be >= 0
- If monto_pagado >= monto_total → status should be PAGADO
- If 0 < monto_pagado < monto_total → status should be PARCIAL
- If monto_pagado === 0 → status should be PENDIENTE

### Currency Support

- **PEN** (Peruvian Sol) - default
- **USD** (US Dollar)
- **EUR** (Euro)

**Rules**:

- Currency cannot change after creation
- Multi-currency reporting needs exchange rates (not implemented)

### Due Date Logic

- `fecha_vencimiento` must be >= `fecha_emision`
- Overdue if: `fecha_vencimiento < current_date AND estado != PAGADO`

### Provider Relation

- Every accounts payable must have a provider (`proveedor_id` required)
- Provider relation eagerly loaded for display
- Cannot delete if provider has pending accounts payable

---

## Refactoring Plan

### Step 1: Import Custom Errors

```typescript
import { NotFoundError, DatabaseError, ValidationError } from '../errors';
import logger from '../utils/logger';
```

### Step 2: Add Class JSDoc (Equipment Baseline Pattern)

Add comprehensive 150+ line class documentation covering:

- Purpose and criticality (financial liability tracking)
- 4 payment statuses with descriptions
- Status lifecycle and valid transitions
- Balance calculation formula
- Currency support (PEN, USD, EUR)
- Due date tracking and overdue detection
- Provider relation (required, eager loaded)
- Hard delete implications (financial audit)
- Multi-tenancy notes (deferred)
- Related services (provider, project, cost-center)
- Usage examples

### Step 3: Replace Error Handling

- Line 52-61 (`create`): Wrap in try-catch, throw DatabaseError, check null
- Line 93-106 (`findAll`): Wrap in try-catch, throw DatabaseError
- Line 110-116 (`findOne`): Throw NotFoundError instead of returning null
- Line 120-154 (`update`): Throw NotFoundError for missing record, wrap in try-catch
- Line 158-159 (`delete`): Wrap in try-catch, throw NotFoundError + DatabaseError
- Line 163-164 (`findPending`): Wrap in try-catch, throw DatabaseError
- Line 167-171 (`updateStatus`): Validate status transition, wrap in try-catch

### Step 4: Add Success Logging

Each method should log:

- `create`: id, numero_factura, proveedor_id, monto_total, monto_pagado, saldo, estado
- `findAll`: total, returned, page, limit, sortBy, sortOrder
- `findOne`: id, numero_factura, proveedor_id, estado, saldo
- `update`: id, numero_factura, changed_fields
- `delete`: id, numero_factura (warn: hard delete)
- `findPending`: count, total_saldo
- `updateStatus`: id, numero_factura, old_status, new_status

### Step 5: Add Method JSDoc

Each method needs:

- `@param` with types and descriptions
- `@returns` with DTO structure
- `@throws` with error conditions
- Business rule documentation
- Usage examples

### Step 6: Add Tenant Context TODOs

Mark 5 locations for Phase 21:

- `findAll`: Query builder filter
- `findOne`: where clause
- `update`: where clause
- `delete`: validation before delete
- `findPending`: repository method filter

### Step 7: Fix Code Quality Issues

- Remove null-assertion operator (line 61)
- Keep dual field DTOs (needed for frontend compatibility - exception to ARCHITECTURE.md)
- Add validation for monto_pagado <= monto_total
- Add validation for fecha_vencimiento >= fecha_emision
- Consider soft delete (add `is_active` column in Phase 21)

### Step 8: Add Business Validation Methods

```typescript
private validatePaymentAmount(monto_total: number, monto_pagado: number): void
private validateDateRange(fecha_emision: string, fecha_vencimiento: string): void
private calculateStatus(monto_total: number, monto_pagado: number): AccountsPayableStatus
private validateStatusTransition(oldStatus: AccountsPayableStatus, newStatus: AccountsPayableStatus): void
```

### Step 9: Remove Singleton Export

Change from:

```typescript
export default new AccountsPayableService();
```

To:

```typescript
export class AccountsPayableService { ... }
```

(No default export)

---

## Expected Changes

### Before (174 lines)

- No error handling
- No logging
- No documentation
- No tenant context
- Generic errors
- Null-assertion operator

### After (~350-400 lines estimated)

- Custom error classes (NotFoundError, DatabaseError, ValidationError)
- Comprehensive logging (7 methods)
- 150+ line class JSDoc + method JSDoc
- Tenant context TODOs (5 locations)
- Business validation methods (4 new)
- No null-assertion
- Proper try-catch blocks

### New Lines Breakdown

- Class JSDoc: +150 lines
- Method JSDoc (7 methods × ~15 lines): +105 lines
- Error handling (try-catch + throws): +50 lines
- Logging (7 methods × ~5 lines): +35 lines
- Validation methods (4 × ~20 lines): +80 lines
- Tenant context TODOs: +10 lines
- **Total additions**: ~430 lines
- **Total after refactor**: ~600 lines (174 + 430 - redundancies)

**Realistic estimate**: 350-400 lines (with cleanup)

---

## Testing Strategy

### Test File: `accounts-payable.service.spec.ts`

Following equipment baseline pattern:

1. **Instantiation** (1 test)
   - Service can be instantiated

2. **Method Existence** (7 tests)
   - create method exists
   - findAll method exists
   - findOne method exists
   - update method exists
   - delete method exists
   - findPending method exists
   - updateStatus method exists

3. **Method Signatures** (7 tests)
   - create accepts data parameter
   - findAll accepts optional filters parameter
   - findOne accepts id parameter
   - update accepts id and data parameters
   - delete accepts id parameter
   - findPending accepts no parameters
   - updateStatus accepts id and status parameters

4. **Validation Methods** (4 tests)
   - validatePaymentAmount method exists
   - validateDateRange method exists
   - calculateStatus method exists
   - validateStatusTransition method exists

5. **DTO Functions** (2 tests)
   - toAccountsPayableDto function exists
   - fromAccountsPayableDto function exists

6. **Service Structure** (3 tests)
   - Not a singleton (no default export)
   - Returns DTOs (has toAccountsPayableDto)
   - Uses logger

**Total Tests**: ~24 tests

---

## Standards Checklist

- [ ] Import custom error classes (NotFoundError, DatabaseError, ValidationError)
- [ ] Add comprehensive class JSDoc (150+ lines, following equipment baseline)
- [ ] Add method JSDoc for all 7 methods
- [ ] Replace generic errors with custom errors (7 locations)
- [ ] Add success logging to all 7 methods
- [ ] Add tenant context TODOs (5 locations)
- [ ] Remove null-assertion operator (line 61)
- [ ] Add business validation methods (4 methods)
- [ ] Wrap all database operations in try-catch
- [ ] Remove singleton export pattern
- [ ] Create test file with ~24 tests
- [ ] Document 4 payment statuses in class JSDoc
- [ ] Document status lifecycle and transitions
- [ ] Document balance calculation formula
- [ ] Document currency support (PEN, USD, EUR)
- [ ] Document due date and overdue logic
- [ ] Document hard delete implications
- [ ] Verify all tests pass
- [ ] Verify Docker logs clean
- [ ] Commit changes

---

## Related Files

- **Service**: `src/services/accounts-payable.service.ts` (this file)
- **Model**: `src/models/accounts-payable.model.ts` (79 lines)
- **DTO**: `src/types/dto/accounts-payable.dto.ts` (235 lines, already exists ✅)
- **Repository**: `src/repositories/accounts-payable.repository.ts` (30 lines)
- **Test**: `src/services/accounts-payable.service.spec.ts` (to be created)
- **Standards**: `SERVICE_LAYER_STANDARDS.md`
- **Baseline**: `equipment.service.ts` (Session 21 - pattern to follow)

---

## Notes

1. **Dual Field DTOs**: Service accepts both camelCase (frontend) and snake_case (API). This is an exception to ARCHITECTURE.md for backward compatibility. Keep this pattern.

2. **Hard Delete**: Current implementation uses hard delete. Consider soft delete in Phase 21 for financial audit trail.

3. **Balance Calculation**: Currently calculated in DTO transformer. Consider storing as computed column in Phase 21.

4. **Status Transitions**: No validation currently. Add business validation method.

5. **Provider Relation**: Always eager loaded. Good for API responses.

6. **Repository Pattern**: Uses extended repository with custom methods (`findPending`, `findByProvider`, `findByProject`). Good pattern.

7. **Baseline Reference**: Follow equipment.service.ts (Session 21) for:
   - 150+ line class JSDoc structure
   - Method JSDoc format
   - Error handling patterns
   - Logging patterns
   - Tenant context TODO format

---

**Audit Complete**: Ready for refactoring  
**Estimated Time**: 35-45 minutes  
**Next**: Refactor service following equipment baseline pattern
