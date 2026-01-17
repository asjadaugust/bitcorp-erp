# Service Audit: employee.service.ts

**Date**: January 18, 2026  
**Service**: `backend/src/services/employee.service.ts`  
**Type**: Data-access service (HR employee management)  
**Priority**: 2 (Moderate - first in Priority 2)  
**Current LOC**: 145  
**Methods**: 6

---

## Summary

The `EmployeeService` manages HR employee (trabajador) records. It's already well-migrated with DTOs and TypeORM, but needs standardization for tenant context, error handling, and logging patterns established in Phase 20.

---

## Current State Analysis

### ✅ Strengths

1. **Already has DTOs**: `EmployeeListDto`, `EmployeeDetailDto`, `EmployeeCreateDto`, `EmployeeUpdateDto` fully implemented
2. **TypeORM migration complete**: All methods use TypeORM repository pattern
3. **Good transformation**: Uses transformer functions (toEmployeeListDto, toEmployeeDetailDto)
4. **Partial logging**: Has try/catch in `getAllEmployees` with Logger.error
5. **Soft delete**: `deleteEmployee` uses `isActive = false` (correct pattern)
6. **Validation**: `createEmployee` checks for duplicate DNI
7. **Search functionality**: `searchEmployees` with ILIKE query builder

### ❌ Issues to Fix

#### 1. Missing Tenant Context (CRITICAL)

- ❌ No `tenantId` parameter in any method
- ❌ Database queries don't filter by tenant
- ⚠️ **Note**: `trabajador` table (schema: rrhh) does NOT have `tenant_id` column yet

**Impact**: Medium (schema limitation, add TODO comments)

#### 2. Inconsistent Error Handling

- ❌ `getEmployeeByDni` returns `null` instead of throwing NotFoundError
- ❌ `updateEmployee` returns `null` instead of throwing NotFoundError
- ❌ `deleteEmployee` returns `false` instead of throwing NotFoundError
- ✅ `getAllEmployees` has try/catch (partial)
- ❌ Other methods lack try/catch blocks

**Impact**: High (inconsistent API behavior)

#### 3. Missing Logging

- ✅ `getAllEmployees` has Logger.error only
- ❌ No Logger.info for successful operations
- ❌ Other 5 methods have no logging at all

**Impact**: High (no observability)

#### 4. Generic Error Handling

- ❌ `createEmployee` throws generic `Error` for duplicate DNI
- Should use `ConflictError` for duplicate resources

**Impact**: Medium (non-standard error codes)

#### 5. Controller Issues

- ❌ Controller does manual pagination (should be in service)
- ❌ Controller does in-memory sorting (inefficient for large datasets)
- ❌ Controller uses `any` types extensively
- ❌ Controller checks for null (should catch NotFoundError)

**Impact**: Medium (performance, type safety)

---

## Refactoring Plan

### Step 1: Add Tenant Context to Service

**Pattern**: Add `tenantId` as first parameter to all methods

```typescript
// Before
async getAllEmployees(): Promise<EmployeeListDto[]>

// After
async getAllEmployees(tenantId: number): Promise<{ data: EmployeeListDto[], total: number }>
```

**Methods to update**:

1. `getAllEmployees(tenantId, page?, limit?)`
2. `getEmployeeByDni(tenantId, dni)`
3. `createEmployee(tenantId, data, user)`
4. `updateEmployee(tenantId, dni, data, user)`
5. `deleteEmployee(tenantId, dni)`
6. `searchEmployees(tenantId, query, page?, limit?)`

**Database Filter** (add TODO):

```typescript
// TODO: Add tenant_id filter when column exists in rrhh.trabajador table
// where: { tenantId, isActive: true }
```

### Step 2: Replace `null` with NotFoundError

**Before**:

```typescript
async getEmployeeByDni(dni: string): Promise<EmployeeDetailDto | null> {
  const trabajador = await this.trabajadorRepository.findOne({ where: { dni } });
  return trabajador ? toEmployeeDetailDto(trabajador) : null;
}
```

**After**:

```typescript
async getEmployeeByDni(tenantId: number, dni: string): Promise<EmployeeDetailDto> {
  try {
    Logger.info('Fetching employee by DNI', { tenantId, dni, context: 'EmployeeService.getEmployeeByDni' });

    // TODO: Add tenant_id filter when column exists
    const trabajador = await this.trabajadorRepository.findOne({
      where: { dni, isActive: true }
    });

    if (!trabajador) {
      throw new NotFoundError('Employee', dni, { tenantId });
    }

    Logger.info('Employee fetched successfully', { tenantId, dni, context: 'EmployeeService.getEmployeeByDni' });
    return toEmployeeDetailDto(trabajador as unknown as Record<string, unknown>);
  } catch (error) {
    Logger.error('Error fetching employee', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      dni,
      context: 'EmployeeService.getEmployeeByDni',
    });
    throw error;
  }
}
```

**Apply to**:

- `getEmployeeByDni` (returns null → throw NotFoundError)
- `updateEmployee` (returns null → throw NotFoundError)
- `deleteEmployee` (returns false → throw NotFoundError)

### Step 3: Add Comprehensive Logging

**Pattern**: Logger.info on entry, Logger.info on success, Logger.error on failure

**Apply to all 6 methods**:

1. `getAllEmployees` (update existing logging)
2. `getEmployeeByDni` (add logging)
3. `createEmployee` (add logging)
4. `updateEmployee` (add logging)
5. `deleteEmployee` (add logging)
6. `searchEmployees` (add logging)

### Step 4: Replace Generic Errors with Typed Errors

**Before**:

```typescript
throw new Error('Operator with this DNI already exists');
```

**After**:

```typescript
throw new ConflictError('Employee', { dni: data.dni, tenantId });
```

### Step 5: Move Pagination to Service Layer

**Before** (controller does pagination):

```typescript
// Controller
const allEmployees = await employeeService.getAllEmployees();
const total = allEmployees.length;
const paginatedEmployees = allEmployees.slice(offset, offset + limit);
```

**After** (service does pagination):

```typescript
// Service
async getAllEmployees(
  tenantId: number,
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: 'ASC' | 'DESC'
): Promise<{ data: EmployeeListDto[], total: number }>

// Controller
const result = await employeeService.getAllEmployees(tenantId, page, limit, sortBy, sortOrder);
return sendPaginatedSuccess(res, result.data, { page, limit, total: result.total });
```

**Benefits**:

- Efficient database-level pagination (LIMIT/OFFSET)
- Database-level sorting (ORDER BY)
- Consistent with report.service.ts pattern

### Step 6: Add Filters DTO (Optional Enhancement)

Create `EmployeeFiltersDto` for search parameters:

```typescript
export interface EmployeeFiltersDto {
  search?: string;
  cargo?: string;
  especialidad?: string;
  fecha_ingreso_desde?: string;
  fecha_ingreso_hasta?: string;
}
```

**Method signature**:

```typescript
async getAllEmployees(
  tenantId: number,
  page: number = 1,
  limit: number = 10,
  filters?: EmployeeFiltersDto,
  sortBy: string = 'nombre_completo',
  sortOrder: 'ASC' | 'DESC' = 'ASC'
): Promise<{ data: EmployeeListDto[], total: number }>
```

### Step 7: Update Controller

**Changes needed**:

1. Pass `tenantId` to all service methods
2. Remove manual pagination logic
3. Remove null checks (catch NotFoundError instead)
4. Remove `any` types
5. Let service handle sorting

**Before**:

```typescript
const employee = await employeeService.getEmployeeByDni(dni);
if (!employee) {
  return sendError(res, 404, 'NOT_FOUND', 'Employee not found');
}
```

**After**:

```typescript
try {
  const tenantId = req.tenantContext.id_empresa;
  const employee = await employeeService.getEmployeeByDni(tenantId, dni);
  return sendSuccess(res, employee);
} catch (error) {
  if (error instanceof NotFoundError) {
    return sendError(res, 404, 'NOT_FOUND', error.message);
  }
  // ... other error handling
}
```

---

## Expected Changes

### Service Changes

| Aspect                 | Before | After        | Change |
| ---------------------- | ------ | ------------ | ------ |
| **Lines of Code**      | 145    | ~400         | +176%  |
| **Methods**            | 6      | 6            | Same   |
| **tenantId params**    | 0      | 6            | +6     |
| **NotFoundError**      | 0      | 3            | +3     |
| **ConflictError**      | 0      | 1            | +1     |
| **try/catch blocks**   | 1      | 6            | +5     |
| **Logger.info calls**  | 0      | 12+          | +12    |
| **Logger.error calls** | 1      | 6            | +5     |
| **Service pagination** | No     | Yes          | ✅     |
| **Return types**       | Mixed  | Standardized | ✅     |

### Controller Changes

| Aspect                | Before | After | Change  |
| --------------------- | ------ | ----- | ------- |
| **Lines of Code**     | 170    | ~120  | -29%    |
| **Manual pagination** | Yes    | No    | Removed |
| **In-memory sorting** | Yes    | No    | Removed |
| **Null checks**       | 3      | 0     | Removed |
| **any types**         | Many   | None  | Fixed   |
| **tenantId usage**    | 0      | 5     | +5      |

---

## Files to Modify

### 1. Service Layer

- ✅ `backend/src/services/employee.service.ts` (main refactoring)

### 2. DTO Layer

- ✅ `backend/src/types/dto/employee.dto.ts` (already complete, may add EmployeeFiltersDto)

### 3. Controller Layer

- ✅ `backend/src/api/hr/employee.controller.ts` (update to use tenantId, remove manual pagination)

### 4. Error Classes

- ✅ `backend/src/errors/http.errors.ts` (NotFoundError, ConflictError - already exist)

---

## Testing Strategy

### 1. Unit Tests (if exist)

- Update tests to pass `tenantId` parameter
- Test NotFoundError throwing
- Test ConflictError for duplicate DNI
- Test pagination logic

### 2. Integration Tests

- Test GET /api/employees with pagination
- Test GET /api/employees/:dni (not found case)
- Test POST /api/employees (duplicate DNI)
- Test PUT /api/employees/:dni (not found case)
- Test DELETE /api/employees/:dni (not found case)

### 3. Manual Testing

```bash
# 1. List employees (paginated)
curl -X GET "http://localhost:3000/api/employees?page=1&limit=10"

# 2. Get employee by DNI
curl -X GET "http://localhost:3000/api/employees/12345678"

# 3. Create employee
curl -X POST "http://localhost:3000/api/employees" \
  -H "Content-Type: application/json" \
  -d '{"dni": "87654321", "nombres": "Juan", "apellido_paterno": "Pérez"}'

# 4. Update employee
curl -X PUT "http://localhost:3000/api/employees/87654321" \
  -H "Content-Type: application/json" \
  -d '{"telefono": "999888777"}'

# 5. Delete employee
curl -X DELETE "http://localhost:3000/api/employees/87654321"

# 6. Search employees
curl -X GET "http://localhost:3000/api/employees?search=juan"
```

---

## Success Criteria

- [ ] ✅ All 6 methods have `tenantId` parameter
- [ ] ✅ No `return null` statements (throw NotFoundError)
- [ ] ✅ No `return false` statements (throw NotFoundError)
- [ ] ✅ All methods wrapped in try/catch
- [ ] ✅ Logger.info on entry and success
- [ ] ✅ Logger.error on failure
- [ ] ✅ Duplicate DNI throws ConflictError
- [ ] ✅ Pagination done in service layer
- [ ] ✅ Sorting done in service layer (SQL ORDER BY)
- [ ] ✅ Controller passes tenantId
- [ ] ✅ Controller removes manual pagination
- [ ] ✅ Controller removes null checks
- [ ] ✅ All tests passing (maintain 152)
- [ ] ✅ Clean build (no TypeScript errors)
- [ ] ✅ Clean lint (no eslint warnings)
- [ ] ✅ Committed with detailed message

---

## Estimated Time

**Complexity**: Moderate (first Priority 2 service)

**Tasks**:

1. Refactor service (add tenantId, NotFoundError, logging) - 2 hours
2. Move pagination/sorting to service - 1 hour
3. Update controller (remove pagination, add tenantId) - 1 hour
4. Add EmployeeFiltersDto (optional) - 30 min
5. Test all endpoints - 30 min
6. Build, lint, commit - 15 min

**Total**: 4.5 - 5 hours

**Comparison**:

- Simple services (fuel, sig, inventory): 1.5 - 4 hours
- This service: 4.5 - 5 hours (more methods, pagination migration)

---

## Notes

1. **Schema Limitation**: `rrhh.trabajador` table does NOT have `tenant_id` column
   - Add TODO comments in all methods
   - Queries will not filter by tenant until schema updated

2. **Pagination Migration**: Moving pagination from controller to service is a significant improvement
   - Enables database-level LIMIT/OFFSET (more efficient)
   - Consistent with report.service.ts pattern

3. **Search Enhancement**: `searchEmployees` can be merged into `getAllEmployees` with filters
   - Single method handles both list and search
   - Cleaner API design

4. **Type Safety**: Controller has many `any` types - fix during refactoring

5. **First Priority 2 Service**: This sets the pattern for other moderate services
   - Take extra care to document patterns
   - This will be reference for next 13 moderate services

---

## Related Services (Similar Pattern)

These services will follow the same pattern:

- `operator.service.ts` (368 LOC) - similar to employee, more methods
- `operator-document.service.ts` (148 LOC) - related documents
- `operator-availability.service.ts` (180 LOC) - availability tracking
- `provider.service.ts` (319 LOC) - supplier management
- `provider-contact.service.ts` (197 LOC) - contact management

**Pattern established here applies to all HR/provider management services!**

---

**Audit Complete** ✅  
**Ready for Refactoring** 🚀
