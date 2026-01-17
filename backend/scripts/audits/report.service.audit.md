# Service Audit: report.service.ts

**Date**: 2026-01-18  
**Service**: `backend/src/services/report.service.ts`  
**Purpose**: Daily report management (CRUD operations + PDF generation)  
**Size**: 110 lines  
**Complexity**: 🟢 Simple (mostly read operations, uses Model layer)

---

## Executive Summary

**Status**: ❌ **NEEDS REFACTORING**

**Type**: Data-access service (queries database via DailyReportModel/TypeORM)

**Key Issues**:

- ❌ No tenant context (no `tenantId` parameter)
- ❌ Returns `null` instead of throwing errors
- ❌ No error handling (no try/catch blocks)
- ❌ No logging (debugging impossible)
- ❌ Uses `any` types (line 16, 107)
- ⚠️ Manual pagination in controller (should be in service)
- ⚠️ Generic `Error` instead of custom error classes

**Good Points**:

- ✅ Already uses DTOs (`DailyReportDto`)
- ✅ Has transformation functions (`toDailyReportDto`, `fromDailyReportDto`)
- ✅ Clean separation: service → model → database
- ✅ Uses TypeORM repository (via DailyReportModel wrapper)

---

## Current Implementation Analysis

### Method Inventory (9 methods)

| Method                    | Purpose                 | Returns                  | Issues                                                |
| ------------------------- | ----------------------- | ------------------------ | ----------------------------------------------------- |
| `getAllReports()`         | List all reports        | `DailyReportDto[]`       | ❌ No tenantId, no pagination, no logging, uses `any` |
| `getReportById()`         | Get single report       | `DailyReportDto \| null` | ❌ No tenantId, returns null, no logging              |
| `getReportsByOperator()`  | Get reports by operator | `DailyReportDto[]`       | ❌ No tenantId, no logging                            |
| `createReport()`          | Create new report       | `DailyReportDto`         | ❌ No tenantId, no error handling, no logging         |
| `updateReport()`          | Update report           | `DailyReportDto \| null` | ❌ No tenantId, returns null, no logging              |
| `approveReport()`         | Approve report          | `DailyReportDto \| null` | ❌ No tenantId, returns null, no logging              |
| `rejectReport()`          | Reject report           | `DailyReportDto \| null` | ❌ No tenantId, returns null, no logging              |
| `deleteReport()`          | Delete report           | `boolean`                | ❌ No tenantId, returns boolean, no logging           |
| `getDailyReportPdfData()` | Get PDF data            | `DailyReportPdfDto`      | ⚠️ Throws generic Error, uses `any`, no tenantId      |

### Data Flow

```
Controller
    ↓
ReportService (THIS FILE)
    ↓
DailyReportModel (TypeORM wrapper)
    ↓
TypeORM Repository
    ↓
Database (partes_diarios table)
```

**Note**: The service delegates to `DailyReportModel`, which uses TypeORM. This is a good pattern but needs tenant context added at all layers.

---

## Issue Breakdown

### 🔴 Critical Issues (Must Fix)

#### 1. No Tenant Context

```typescript
// ❌ CURRENT: No tenant filtering
async getAllReports(filters?: any): Promise<DailyReportDto[]> {
  const entities = await DailyReportModel.findAll(filters);
  return entities.map(toDailyReportDto);
}

// ✅ EXPECTED: Tenant-aware
async getAllReports(tenantId: number, filters?: any): Promise<{ data: DailyReportDto[], total: number }> {
  // TODO: Add tenant_id filter when column exists in partes_diarios table
  const entities = await DailyReportModel.findAll(tenantId, filters);
  const total = await DailyReportModel.count(tenantId, filters);
  return {
    data: entities.map(toDailyReportDto),
    total
  };
}
```

**Impact**: Data isolation broken - users can see other companies' reports

#### 2. Returns `null` Instead of Throwing Errors

```typescript
// ❌ CURRENT: Returns null (controller checks for null)
async getReportById(id: string): Promise<DailyReportDto | null> {
  const entity = await DailyReportModel.findById(id);
  return entity ? toDailyReportDto(entity) : null;
}

// ✅ EXPECTED: Throws NotFoundError
async getReportById(tenantId: number, id: string): Promise<DailyReportDto> {
  const entity = await DailyReportModel.findById(tenantId, id);
  if (!entity) {
    throw new NotFoundError('Daily report', { id });
  }
  return toDailyReportDto(entity);
}
```

**Impact**: Inconsistent error handling, forces controller to check nulls

#### 3. No Error Handling

```typescript
// ❌ CURRENT: No try/catch, no logging
async createReport(data: Partial<DailyReportDto>): Promise<DailyReportDto> {
  const sanitizedDto = { ...DailyReportAdapter.toBackendDto(data), ...data };
  const entity = fromDailyReportDto(sanitizedDto);
  const created = await DailyReportModel.create(entity);
  return toDailyReportDto(created);
}

// ✅ EXPECTED: Try/catch with logging
async createReport(tenantId: number, data: Partial<DailyReportDto>): Promise<DailyReportDto> {
  try {
    Logger.info('Creating daily report', {
      tenantId,
      equipoId: data.equipo_id,
      trabajadorId: data.trabajador_id,
      fecha: data.fecha,
      context: 'ReportService.createReport',
    });

    const sanitizedDto = { ...DailyReportAdapter.toBackendDto(data), ...data };
    const entity = fromDailyReportDto(sanitizedDto);
    const created = await DailyReportModel.create(tenantId, entity);

    Logger.info('Daily report created successfully', {
      tenantId,
      reportId: created.id,
      context: 'ReportService.createReport',
    });

    return toDailyReportDto(created);
  } catch (error) {
    Logger.error('Error creating daily report', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      data,
      context: 'ReportService.createReport',
    });
    throw error;
  }
}
```

**Impact**: Silent failures, no debugging information

#### 4. No Logging

**Current**: No Logger imports or usage  
**Expected**: Logger.info on success, Logger.error on failure

**Impact**: Impossible to debug production issues

---

### 🟡 Important Issues (Should Fix)

#### 5. Uses `any` Type (2 occurrences)

```typescript
// Line 16
async getAllReports(filters?: any): Promise<DailyReportDto[]> {
  // ❌ Should define FiltersDto interface

// Line 107
return transformToDailyReportPdfDto(report as any);
  // ❌ Should fix type mismatch properly
```

**Fix**: Create `DailyReportFiltersDto` interface

#### 6. Pagination in Wrong Layer

```typescript
// ❌ CURRENT: Controller does manual pagination
// src/api/reports/report.controller.ts:26-28
const paginatedReports = reports.slice(startIndex, endIndex);

// ✅ EXPECTED: Service returns paginated data
async getAllReports(tenantId: number, page: number, limit: number): Promise<{
  data: DailyReportDto[];
  total: number;
}> {
  // Pagination logic here
}
```

**Impact**: Fetches all data then slices (inefficient for large datasets)

#### 7. Generic Error Instead of Custom Classes

```typescript
// Line 103
if (!report) {
  throw new Error(`Daily report with ID ${id} not found`);
}

// ✅ Should be:
if (!report) {
  throw new NotFoundError('Daily report', { id });
}
```

---

### 🟢 Nice-to-Have Issues

#### 8. Business Validation Missing

```typescript
// createReport() should validate:
// - fecha not in future
// - trabajador_id exists and is active
// - equipo_id exists and is available
// - proyecto_id exists and is active
// - horas_trabajadas > 0 and <= 24
```

#### 9. Delete Method Returns Boolean

```typescript
// ❌ CURRENT:
async deleteReport(id: string): Promise<boolean> {
  return DailyReportModel.delete(id);
}

// ✅ EXPECTED:
async deleteReport(tenantId: number, id: string): Promise<void> {
  const deleted = await DailyReportModel.delete(tenantId, id);
  if (!deleted) {
    throw new NotFoundError('Daily report', { id });
  }
}
```

---

## Database Schema Check

### partes_diarios Table

**Status**: ⚠️ **NEEDS VERIFICATION**

**Expected Columns**:

```sql
CREATE TABLE partes_diarios (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,  -- ❓ DOES THIS EXIST?
  equipo_id INTEGER,
  trabajador_id INTEGER,
  proyecto_id INTEGER,
  fecha DATE,
  estado VARCHAR(50),
  -- ... other columns
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**TODO**: Check if `tenant_id` column exists in partes_diarios table  
**Workaround**: Add TODO comments for tenant filtering

---

## Dependencies

### Imports Needed (After Refactoring)

```typescript
import Logger from '../utils/logger';
import { NotFoundError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';
import { ValidationError } from '../errors/validation.error';
```

### New DTOs Needed

```typescript
// backend/src/types/dto/report.dto.ts (new file)

/**
 * Filters for daily report queries
 */
export interface DailyReportFiltersDto {
  estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  fecha?: string; // YYYY-MM-DD
  fecha_inicio?: string; // YYYY-MM-DD
  fecha_fin?: string; // YYYY-MM-DD
  trabajador_id?: string;
  equipo_id?: string;
  proyecto_id?: string;
}
```

---

## Testing Status

**Current Tests**: ❌ None found  
**Test File**: `backend/src/services/report.service.spec.ts` does not exist  
**Coverage**: 0%

**TODO**: Create tests (defer to batch test creation phase)

---

## Refactoring Plan

### Priority 1: Add Tenant Context & Error Handling (2 hours)

**Step 1: Import Dependencies (5 min)**

```typescript
import Logger from '../utils/logger';
import { NotFoundError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';
```

**Step 2: Create FiltersDto (10 min)**
Create `backend/src/types/dto/report.dto.ts`:

```typescript
export interface DailyReportFiltersDto {
  estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  fecha?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  trabajador_id?: string;
  equipo_id?: string;
  proyecto_id?: string;
}
```

**Step 3: Refactor getAllReports() (20 min)**

- Add `tenantId` parameter
- Change `filters?: any` to `filters?: DailyReportFiltersDto`
- Add pagination parameters (page, limit)
- Return `{ data, total }` structure
- Add try/catch with logging
- Add TODO comment for tenant_id filtering

**Step 4: Refactor getReportById() (15 min)**

- Add `tenantId` parameter
- Replace `return null` with `throw new NotFoundError()`
- Add try/catch with logging
- Add TODO comment for tenant_id filtering

**Step 5: Refactor getReportsByOperator() (15 min)**

- Add `tenantId` parameter
- Add try/catch with logging
- Add TODO comment for tenant_id filtering

**Step 6: Refactor createReport() (20 min)**

- Add `tenantId` parameter
- Add try/catch with logging
- Add business validation
- Add TODO comment for tenant_id

**Step 7: Refactor updateReport() (20 min)**

- Add `tenantId` parameter
- Replace `return null` with `throw new NotFoundError()`
- Add try/catch with logging

**Step 8: Refactor approveReport() (15 min)**

- Add `tenantId` parameter
- Replace `return null` with `throw new NotFoundError()`
- Add try/catch with logging

**Step 9: Refactor rejectReport() (15 min)**

- Add `tenantId` parameter
- Replace `return null` with `throw new NotFoundError()`
- Add try/catch with logging

**Step 10: Refactor deleteReport() (15 min)**

- Add `tenantId` parameter
- Change return type to `void`
- Throw NotFoundError if not deleted
- Add try/catch with logging

**Step 11: Refactor getDailyReportPdfData() (15 min)**

- Add `tenantId` parameter
- Replace generic Error with NotFoundError
- Fix `any` type cast
- Add try/catch with logging
- Add TODO comment for tenant_id filtering

**Step 12: Update Controller (30 min)**

- Update all method calls to pass `tenantId`
- Remove manual pagination (use service pagination)
- Remove null checks (service throws errors now)

---

### Priority 2: Testing (Defer)

Create `backend/src/services/report.service.spec.ts` with tests for:

- getAllReports (with/without filters, pagination)
- getReportById (found/not found)
- createReport (success/validation errors)
- updateReport (success/not found)
- approveReport (success/not found)
- rejectReport (success/not found)
- deleteReport (success/not found)
- getDailyReportPdfData (success/not found)

**Estimated**: 2-3 hours (defer to batch test creation)

---

## Expected Changes Summary

### Files to Modify

1. `backend/src/services/report.service.ts` (110 → ~350 lines)
2. `backend/src/api/reports/report.controller.ts` (update method calls)

### Files to Create

1. `backend/src/types/dto/report.dto.ts` (new, ~30 lines)
2. `backend/scripts/audits/report.service.audit.md` (this file)

### Standards Applied

- ✅ Tenant context (tenantId parameter on all methods)
- ✅ Error handling (try/catch with Logger)
- ✅ Custom errors (NotFoundError, not null)
- ✅ Type safety (no `any` types)
- ✅ Logging (info on success, error on failure)
- ✅ Pagination in service (not controller)
- ✅ Business validation
- ✅ TODO comments for tenant_id schema limitation

---

## Risk Assessment

**Risk Level**: 🟡 **MODERATE**

**Risks**:

1. **Breaking Changes**: Controller needs updates (all method signatures change)
2. **Model Layer**: DailyReportModel also needs tenant context (separate task)
3. **Database Schema**: tenant_id column may not exist in partes_diarios
4. **PDF Generation**: getDailyReportPdfData() uses TypeORM directly (bypasses Model layer)

**Mitigation**:

1. Update controller in same commit
2. Add TODO comments for Model layer refactoring
3. Add TODO comments for tenant_id column
4. Keep PDF method working, add tenant context for future

---

## Success Criteria

Service refactoring is **COMPLETE** when:

- [x] ✅ Audit document created
- [ ] ✅ All methods have `tenantId` parameter
- [ ] ✅ No `return null` statements (throw NotFoundError instead)
- [ ] ✅ All methods wrapped in try/catch
- [ ] ✅ Logger.info on success, Logger.error on failure
- [ ] ✅ No `any` types (created DailyReportFiltersDto)
- [ ] ✅ getAllReports() returns `{ data, total }` with pagination
- [ ] ✅ Controller updated to pass tenantId
- [ ] ✅ Controller removes manual pagination
- [ ] ✅ Controller removes null checks
- [ ] ✅ All tests passing (152 maintained)
- [ ] ✅ Clean build (no TypeScript errors)
- [ ] ✅ Committed with detailed message
- [ ] ✅ Progress tracker updated (5/31, 16%)

---

## Estimated Effort

**Total Time**: ~2-3 hours

- Audit document: 30 min ✅ (DONE)
- Create FiltersDto: 10 min
- Refactor service (11 methods): 2 hours
- Update controller: 30 min
- Build, test, commit: 20 min

**Complexity**: 🟢 Simple (mostly adding tenant context + error handling)

---

## Notes for Implementation

### Pattern to Follow (from inventory.service.ts)

```typescript
async createMovement(tenantId: number, data: MovementCreateDto): Promise<MovementDetailDto> {
  try {
    Logger.info('Creating inventory movement', {
      tenantId,
      tipo: data.tipo_movimiento,
      productoId: data.producto_id,
      context: 'InventoryService.createMovement',
    });

    // Business validation
    if (data.cantidad <= 0) {
      throw new ValidationError('Quantity must be positive', [
        { field: 'cantidad', message: 'Cantidad debe ser mayor a 0', rule: 'min', value: data.cantidad }
      ]);
    }

    // TODO: Add tenant_id filter when column exists
    const created = await this.repository.save({ ...data });

    Logger.info('Inventory movement created successfully', {
      tenantId,
      movementId: created.id,
      context: 'InventoryService.createMovement',
    });

    return this.toDetailDto(created);
  } catch (error) {
    Logger.error('Error creating inventory movement', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      data,
      context: 'InventoryService.createMovement',
    });
    throw error;
  }
}
```

### Key Points

1. **Every method**: try/catch wrapper
2. **Every method**: tenantId as first parameter
3. **Every method**: Logger.info at start and success
4. **Every method**: Logger.error in catch block
5. **Every method**: TODO comment for tenant_id filtering
6. **Not found**: throw NotFoundError (not return null)
7. **Validation**: throw ValidationError with field details

---

## Post-Refactoring Tasks

### Immediate (Same Session)

1. Update controller to pass tenantId
2. Update controller to remove manual pagination
3. Update controller to remove null checks
4. Test all endpoints manually

### Follow-up (Future Sessions)

1. Refactor DailyReportModel to accept tenantId
2. Add tenant_id column to partes_diarios table
3. Remove TODO comments once schema updated
4. Create comprehensive tests

---

## Conclusion

`report.service.ts` is a straightforward data-access service that needs:

- Tenant context (tenantId parameter)
- Error handling (try/catch + logging)
- Custom errors (NotFoundError instead of null)
- Type safety (DailyReportFiltersDto interface)
- Pagination in service layer (not controller)

**Confidence**: 🟢 **HIGH** - Similar to fuel.service.ts and sig.service.ts  
**Complexity**: 🟢 **SIMPLE** - Mostly CRUD operations  
**Breaking Changes**: Yes (controller needs updates)  
**Estimated Time**: 2-3 hours

**Ready to refactor!** ✅
