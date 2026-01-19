# Service Audit: timesheet.service.ts

**Date**: 2026-01-19  
**Session**: 18  
**Service**: `backend/src/services/timesheet.service.ts`  
**Lines of Code**: 337  
**Complexity**: 🟡 Moderate

---

## Executive Summary

Timesheet service manages employee time tracking (tareo system) with monthly timesheets and daily entries. Already migrated to TypeORM. Needs standardization for error handling, logging, and tenant context.

**Risk Level**: 🟡 **MODERATE**

- Multiple state transitions (BORRADOR → ENVIADO → APROBADO/RECHAZADO)
- Hard delete in deleteTimesheet (should be soft delete)
- 12 generic Error instances need custom error classes
- No success logging
- No tenant context filtering

---

## Current State Analysis

### 1. Error Handling Issues ❌

**Generic Errors Found**: 12 instances

| Line | Current Error                                                          | Issue                          |
| ---- | ---------------------------------------------------------------------- | ------------------------------ |
| 66   | `throw new Error('Trabajador no encontrado')`                          | Should be NotFoundError        |
| 78   | `throw new Error('Ya existe un tareo para el periodo...')`             | Should be ConflictError        |
| 115  | `throw new Error('Tareo no encontrado')`                               | Should be NotFoundError        |
| 145  | `throw new Error('Tareo no encontrado o no puede ser enviado...')`     | Should be StateTransitionError |
| 174  | `throw new Error('Tareo no encontrado o no puede ser aprobado...')`    | Should be StateTransitionError |
| 208  | `throw new Error('Tareo no encontrado o no puede ser rechazado...')`   | Should be StateTransitionError |
| 298  | `throw new Error('Tareo no encontrado o no puede ser eliminado...')`   | Should be StateTransitionError |
| 316  | `throw new Error('Tareo no encontrado o no puede ser actualizado...')` | Should be StateTransitionError |

**DatabaseError Needed**: 8 locations

- Lines 61-67 (trabajador check)
- Lines 70-79 (existing check)
- Lines 92-100 (save + reload)
- Lines 109-131 (findOne with relations + details)
- Lines 140-160 (state transition save)
- Lines 169-190 (state transition save)
- Lines 203-226 (state transition save)
- Lines 234-271 (list with filters)
- Lines 281-286 (getByTrabajadorAndPeriodo)
- Lines 293-304 (delete)
- Lines 311-332 (update)

### 2. Return Types ⚠️

**Current**: Already using DTOs! ✅

- `generateTimesheet` → `TimesheetDetailDto`
- `getTimesheetWithDetails` → `TimesheetWithDetailsDto`
- `submitTimesheet` → `TimesheetDetailDto`
- `approveTimesheet` → `TimesheetDetailDto`
- `rejectTimesheet` → `TimesheetDetailDto`
- `listTimesheets` → `TimesheetListDto[]`
- `getByTrabajadorAndPeriodo` → `TimesheetDetailDto | null`
- `updateTimesheet` → `TimesheetDetailDto`
- `deleteTimesheet` → `boolean`

**Issue**: No private toDto method (uses imported transformers)

- Keep using imported transformers from dto file

### 3. Logging Issues 🔇

**No Success Logging**: 0 instances

- Need to add Logger.info() for:
  - generateTimesheet (periodo, trabajadorId, estado)
  - getTimesheetWithDetails (id, detallesCount)
  - submitTimesheet (id, estado)
  - approveTimesheet (id, aprobadoPor)
  - rejectTimesheet (id, reason)
  - listTimesheets (count, filters)
  - deleteTimesheet (id)
  - updateTimesheet (id, updatedFields)

### 4. Documentation Issues 📝

**Current JSDoc**: Basic migration comments only

- Need comprehensive JSDoc for all 9 methods
- Document state machine: BORRADOR → ENVIADO → APROBADO/RECHAZADO
- Document business rules:
  - Only BORRADOR can be updated/deleted
  - Only ENVIADO can be approved/rejected
  - Periodo format: YYYY-MM
  - Trabajador must exist
  - Duplicate periodo check

### 5. Tenant Context Issues 🏢

**Missing tenant_id filters**: 8 locations

- Line 61 (trabajador check)
- Line 70 (existing check)
- Line 109 (timesheet findOne)
- Line 140 (submit - findOne)
- Line 169 (approve - findOne)
- Line 203 (reject - findOne)
- Line 236 (list - queryBuilder)
- Line 281 (getByTrabajadorAndPeriodo)
- Line 293 (delete - findOne)
- Line 311 (update - findOne)

### 6. Singleton Export ❌

**Line 336**: `export default new TimesheetService()`

- Must be removed (breaks tenant context)

### 7. Hard Delete Issue 🗑️

**Line 303**: `await this.timesheetRepository.remove(timesheet)`

- Should use soft delete (estado='ELIMINADO' or status field)
- Current: Completely removes record from database
- Better: Keep for audit trail

---

## Required Changes

### Priority 1: Error Handling (CRITICAL)

1. **Replace 12 generic Error with custom classes**:
   - 2x NotFoundError (trabajador, tareo)
   - 1x ConflictError (duplicate periodo)
   - 5x StateTransitionError (invalid state transitions)
   - 8x DatabaseError (database operations)

### Priority 2: Logging (IMPORTANT)

2. **Add success logging to all 9 methods**:
   - generateTimesheet: log periodo, trabajadorId, estado
   - getTimesheetWithDetails: log id, detallesCount
   - submitTimesheet: log id, estado change
   - approveTimesheet: log id, aprobadoPor
   - rejectTimesheet: log id, reason
   - listTimesheets: log count, applied filters
   - deleteTimesheet: log id
   - updateTimesheet: log id, updated fields

### Priority 3: Documentation (IMPORTANT)

3. **Add comprehensive JSDoc**:
   - Document state machine
   - Document business rules (periodo, trabajador exists, duplicates)
   - Add examples for all methods
   - Document error conditions

### Priority 4: Tenant Context (DEFERRED TO PHASE 21)

4. **Add tenant_id filtering** (8 locations):
   - Mark with TODO comments
   - Document expected WHERE clauses
   - Will implement when schema updated

### Priority 5: Singleton (CRITICAL)

5. **Remove singleton export**:
   - Remove line 336: `export default new TimesheetService()`
   - Export class only

### Priority 6: Soft Delete (IMPORTANT)

6. **Replace hard delete with soft delete**:
   - Add estado='ELIMINADO' instead of remove()
   - Preserve audit trail

---

## Business Rules to Document

### Timesheet State Machine

1. **BORRADOR** (Draft):
   - Initial state
   - Can be updated, deleted
   - Can be submitted → ENVIADO

2. **ENVIADO** (Submitted):
   - Awaiting approval
   - Can be approved → APROBADO
   - Can be rejected → RECHAZADO

3. **APROBADO** (Approved):
   - Final state
   - Cannot be modified

4. **RECHAZADO** (Rejected):
   - Returned to submitter
   - Can be edited (back to BORRADOR)

### Validation Rules

- Periodo format: YYYY-MM (e.g., "2026-01")
- Trabajador must exist in database
- Cannot create duplicate timesheet for same periodo
- Only BORRADOR can be updated/deleted
- Only ENVIADO can be approved/rejected

### Relationships

- Timesheet belongs to Trabajador (employee)
- Timesheet created by Usuario (creadoPor)
- Timesheet approved by Usuario (aprobadoPor)
- Timesheet has many TimesheetDetail (daily entries)
- TimesheetDetail belongs to Proyecto (optional)

---

## Refactoring Plan

### Step 1: Update Service File

1. Import custom error classes
2. Replace 12 generic Error instances
3. Add DatabaseError wrapping (8 locations)
4. Add success logging (9 methods)
5. Add comprehensive JSDoc
6. Add tenant context TODOs (8 locations)
7. Remove singleton export
8. Change hard delete to soft delete

### Step 2: Update DTO File

- DTO file already excellent! ✅
- No changes needed

### Step 3: Create Test File

- Create timesheet.service.spec.ts
- 15-20 lightweight tests:
  - Service instantiation
  - Method existence (9 methods)
  - Method signatures
  - Method names validation
  - Service structure (repositories)

### Step 4: Verify

- Run tests (expect ~244 passing)
- Run build (no TypeScript errors)
- Check Docker logs (no runtime errors)
- Commit changes

---

## Expected Outcome

**Before**:

- 337 lines
- 12 generic Error instances
- No success logging
- Basic documentation
- Singleton export
- Hard delete

**After**:

- ~650 lines (estimated)
- 0 generic Error instances
- 9 methods with success logging
- Comprehensive JSDoc with state machine
- No singleton export
- Soft delete
- 8 tenant context TODOs

**Standards Compliance**: 100%

- ✅ Custom error classes
- ✅ Return DTOs (already compliant)
- ✅ Comprehensive logging
- ✅ Business rule documentation
- ✅ Tenant context deferred (schema blocker)
- ✅ No singleton exports

---

## Risk Assessment

**Migration Risk**: 🟡 **MODERATE**

- State machine logic must remain intact
- Multiple state transitions to test
- Relationships with trabajador, usuario, proyecto

**Testing Impact**: 🟢 **LOW**

- DTOs already in place
- Existing transformers work well
- Tests will validate structure only

**Deployment Risk**: 🟢 **LOW**

- No breaking API changes
- Error messages more specific
- Better logging for debugging

---

## Notes

- Service already migrated to TypeORM ✅
- DTOs already snake_case ✅
- Transformers already imported ✅
- Good use of TypeORM relations ✅
- State machine logic is complex but well-structured
- Hard delete should become soft delete for audit trail
