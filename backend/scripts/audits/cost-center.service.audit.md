# Cost Center Service Audit

**Service**: `cost-center.service.ts`  
**Lines of Code**: 240  
**Complexity**: 🟡 Moderate  
**Last Updated**: January 19, 2026  
**Audit Date**: January 19, 2026

---

## Executive Summary

The Cost Center Service manages cost centers (centros de costo) for project budget tracking. It provides CRUD operations, filtering by project, budget calculations, and soft delete functionality. The service needs standardization for error handling, return types, and tenant context.

**Overall Assessment**: 🟡 Good foundation, needs standardization

**Effort to Fix**: Medium (2-3 hours)

---

## Service Overview

### Purpose

Manages cost centers for project budget tracking and cost allocation.

### Key Responsibilities

1. CRUD operations for cost centers
2. Search and filtering (by code, project, active status)
3. Budget calculations (total budget by project)
4. Pagination and sorting
5. Soft delete (isActive flag)

### Business Rules

1. **Unique Cost Code**: Each cost center must have unique `codigo`
2. **Required Fields**: `codigo` and `nombre` are mandatory
3. **Project Association**: Cost centers can be linked to projects
4. **Budget Tracking**: Each center can have a budget allocation
5. **Soft Delete**: Deletion sets `isActive = false` (not hard delete)
6. **Active by Default**: New cost centers are active unless specified

### Database Schema

- **Table**: `administracion.centro_costo`
- **Fields**: id, legacy_id, codigo (unique), nombre, descripcion, proyecto_id, presupuesto, is_active
- **Indexes**: idx_centro_costo_codigo, idx_centro_costo_project

---

## Standards Compliance Checklist

| Standard                | Status     | Notes                                                             |
| ----------------------- | ---------- | ----------------------------------------------------------------- |
| ✅ Custom Error Classes | ❌ Fails   | Uses generic `Error`, should use `NotFoundError`, `ConflictError` |
| ✅ Return Type DTOs     | ❌ Fails   | Returns raw `CentroCosto` entities                                |
| ✅ Tenant Context       | ❌ Fails   | No `tenant_id` parameter or filtering (schema blocker)            |
| ✅ Tenant Filtering     | ❌ Fails   | No `tenant_id` in queries (schema blocker)                        |
| ✅ Query Patterns       | ✅ Partial | Uses QueryBuilder correctly but needs improvements                |
| ✅ Pagination           | ✅ Pass    | Returns `{ data, total }` correctly                               |
| ✅ Logging              | ⚠️ Partial | Has error logging but missing success logs                        |
| ✅ Business Rules       | ⚠️ Partial | Validates some rules but not documented                           |
| ✅ Transactions         | ✅ Pass    | Simple operations don't need transactions                         |
| ✅ Tests                | ❌ Fails   | No test file exists                                               |

**Compliance Score**: 3/10 (30%)

---

## Issues Identified

### 🔴 Critical Issues (Must Fix)

#### 1. Generic Error Classes

**Lines**: 9, 74, 85, 137, 143, 171, 198

**Problem**: Uses generic `Error` instead of custom error classes

**Current Code**:

```typescript
// Line 9
throw new Error('Database not initialized');

// Line 74
throw new Error('Failed to fetch cost centers');

// Line 85
throw new Error('Cost center not found');

// Line 137
throw new Error('codigo and nombre are required');

// Line 143
throw new Error('Cost center with this codigo already exists');

// Line 171
throw new Error('Cost center with this codigo already exists');

// Line 198
throw new Error('Failed to delete cost center');
```

**Should Be**:

```typescript
import { DatabaseError, NotFoundError, ValidationError, ConflictError } from '../errors/errors';

// Line 9
throw new DatabaseError('Database not initialized');

// Line 74
throw new DatabaseError('Failed to fetch cost centers');

// Line 85
throw new NotFoundError('CentroCosto', id);

// Line 137
throw new ValidationError('codigo and nombre are required');

// Line 143
throw new ConflictError('CentroCosto', 'codigo', data.codigo);

// Line 171
throw new ConflictError('CentroCosto', 'codigo', data.codigo);

// Line 198
throw new DatabaseError('Failed to delete cost center');
```

**Impact**:

- Inconsistent error handling across application
- Controllers can't differentiate error types
- HTTP status codes must be hardcoded in controllers

**Effort**: 30 minutes

---

#### 2. No Return Type DTOs

**Lines**: All methods (findAll, findById, findByCode, findByProject, create, update)

**Problem**: Returns raw `CentroCosto` entities instead of DTOs

**Current Code**:

```typescript
async findById(id: number): Promise<CentroCosto> {
  // Returns raw entity
  return costCenter;
}

async findAll(...): Promise<{ data: CentroCosto[]; total: number }> {
  // Returns raw entities
  return { data, total };
}
```

**Should Be**:

```typescript
async findById(id: number): Promise<CostCenterDto> {
  const costCenter = await this.repository.findOne({ where: { id } });
  if (!costCenter) throw new NotFoundError('CentroCosto', id);
  return toCostCenterDto(costCenter);
}

async findAll(...): Promise<{ data: CostCenterListDto[]; total: number }> {
  // ... query logic ...
  return {
    data: data.map(toCostCenterListDto),
    total
  };
}
```

**DTO Definitions Needed**:

```typescript
// backend/src/types/dto/cost-center.dto.ts

export interface CostCenterListDto {
  id: number;
  codigo: string;
  nombre: string;
  proyecto_id?: number;
  presupuesto?: number;
  is_active: boolean;
}

export interface CostCenterDto extends CostCenterListDto {
  descripcion?: string;
  legacy_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CostCenterCreateDto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  proyecto_id?: number;
  presupuesto?: number;
  is_active?: boolean;
}

export interface CostCenterUpdateDto {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  proyecto_id?: number;
  presupuesto?: number;
  is_active?: boolean;
}

export interface BudgetSummaryDto {
  proyecto_id: number;
  total_presupuesto: number;
  total_centros: number;
}
```

**Impact**:

- Exposes internal entity structure to API consumers
- Can't control API response format
- Breaking changes when entity changes

**Effort**: 1 hour

---

### 🟡 Important Issues (Should Fix)

#### 3. Missing Success Logging

**Lines**: All methods

**Problem**: Has error logging but no success logging

**Current Code**:

```typescript
async findById(id: number): Promise<CentroCosto> {
  try {
    const costCenter = await this.repository.findOne({ where: { id } });
    if (!costCenter) throw new Error('Cost center not found');
    return costCenter; // No success log
  } catch (error) {
    Logger.error('Error finding cost center', { ... });
    throw error;
  }
}
```

**Should Be**:

```typescript
async findById(id: number): Promise<CostCenterDto> {
  try {
    const costCenter = await this.repository.findOne({ where: { id } });
    if (!costCenter) throw new NotFoundError('CentroCosto', id);

    Logger.info('Cost center retrieved successfully', {
      context: 'CostCenterService.findById',
      costCenterId: id,
      codigo: costCenter.codigo,
    });

    return toCostCenterDto(costCenter);
  } catch (error) {
    Logger.error('Error finding cost center', { ... });
    throw error;
  }
}
```

**Methods Needing Success Logs**:

- findAll (with count)
- findById
- findByCode
- findByProject (with count)
- create (with codigo)
- update (with changed fields)
- delete (soft delete confirmation)
- getTotalBudgetByProject (with total)
- getActiveCount (with count)

**Effort**: 30 minutes

---

#### 4. No Tenant Context (Schema Blocker)

**Lines**: All methods

**Problem**: Model lacks `tenant_id` field, can't implement tenant filtering

**Current Schema**:

```typescript
// administracion.centro_costo table
@Entity('centro_costo', { schema: 'administracion' })
export class CentroCosto {
  @PrimaryGeneratedColumn()
  id!: number;
  // ... other fields ...
  // ❌ NO tenant_id field
}
```

**Required Schema** (Future):

```typescript
@Entity('centro_costo', { schema: 'administracion' })
export class CentroCosto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'tenant_id', type: 'integer' })
  @Index('idx_centro_costo_tenant')
  tenantId!: number; // ✅ Add this

  // ... other fields ...
}
```

**Service Changes Required** (After Schema Migration):

```typescript
// All methods must accept tenantId parameter
async findById(tenantId: number, id: number): Promise<CostCenterDto> {
  const costCenter = await this.repository.findOne({
    where: { id, tenantId }, // Filter by tenant
  });
  // ...
}

async findAll(
  tenantId: number, // Add tenant parameter
  filters?: { /* ... */ }
): Promise<{ data: CostCenterListDto[]; total: number }> {
  const queryBuilder = this.repository
    .createQueryBuilder('cc')
    .where('cc.tenantId = :tenantId', { tenantId }) // Filter by tenant
    .andWhere('cc.isActive = :isActive', { isActive: filters?.isActive ?? true });
  // ...
}

async findByCode(tenantId: number, codigo: string): Promise<CostCenterDto | null> {
  return await this.repository.findOne({
    where: { codigo, tenantId }, // Filter by tenant
  });
}
```

**Current Action**: Add `// TODO: Add tenant_id filter when schema updated` comments

**Impact**:

- ⚠️ No tenant isolation (all companies see same cost centers)
- 🚨 Security risk if multi-tenant
- Must be fixed before production

**Effort**: Deferred to Phase 21 (schema migration)

---

#### 5. No JSDoc Documentation

**Lines**: All methods

**Problem**: Missing comprehensive documentation for business rules

**Example of Missing Documentation**:

````typescript
// Current: No documentation
async create(data: Partial<CentroCosto>): Promise<CentroCosto> {
  // ...
}

// Should Have:
/**
 * Create a new cost center
 *
 * Business Rules:
 * - codigo must be unique within tenant
 * - codigo and nombre are required
 * - New cost centers are active by default
 * - Budget (presupuesto) is optional
 * - Can be associated with a project (proyecto_id)
 *
 * @param data - Cost center creation data
 * @returns Created cost center with ID
 * @throws {ValidationError} If codigo or nombre missing
 * @throws {ConflictError} If codigo already exists
 * @throws {DatabaseError} If save operation fails
 *
 * @example
 * ```typescript
 * const costCenter = await service.create({
 *   codigo: 'CC-001',
 *   nombre: 'Operaciones',
 *   presupuesto: 50000,
 *   proyecto_id: 123
 * });
 * ```
 */
async create(data: CostCenterCreateDto): Promise<CostCenterDto> {
  // ...
}
````

**Effort**: 30 minutes

---

#### 6. Singleton Export (Anti-pattern)

**Line**: 239

**Problem**: Exports singleton instance at module load time

**Current Code**:

```typescript
export default new CostCenterService();
```

**Should Be**:

```typescript
// Remove singleton export
// Controllers should instantiate lazily
```

**Why This is Wrong**:

- Service instantiated before database connects
- Can cause "Database not initialized" errors
- Same bug we fixed in Session 12 (SST, Tender, Operator services)

**Controller Pattern** (Lazy Instantiation):

```typescript
// backend/src/api/cost-centers/cost-center.routes.ts
let costCenterController: CostCenterController | null = null;

function getController(): CostCenterController {
  if (!costCenterController) {
    const service = new CostCenterService();
    costCenterController = new CostCenterController(service);
  }
  return costCenterController;
}

router.get('/', (req, res) => getController().findAll(req, res));
```

**Effort**: 15 minutes

---

### 🟢 Nice-to-Have Issues (Optional)

#### 7. Better Type Safety for Filters

**Lines**: 14-22

**Problem**: Filter types are inline, could be extracted to DTO

**Current Code**:

```typescript
async findAll(filters?: {
  search?: string;
  projectId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}): Promise<{ data: CentroCosto[]; total: number }> {
  // ...
}
```

**Should Be**:

```typescript
interface CostCenterQueryDto {
  search?: string;
  proyecto_id?: number;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'codigo' | 'nombre' | 'presupuesto' | 'proyecto_id' | 'created_at';
  sort_order?: 'ASC' | 'DESC';
}

async findAll(filters?: CostCenterQueryDto): Promise<PaginatedResponse<CostCenterListDto>> {
  // ...
}
```

**Benefits**:

- Reusable type definition
- Better autocomplete in controllers
- Easier to validate query parameters

**Effort**: 15 minutes

---

#### 8. Validation Could Be More Explicit

**Lines**: 136-138

**Problem**: Validation logic mixed with business logic

**Current Code**:

```typescript
async create(data: Partial<CentroCosto>): Promise<CentroCosto> {
  try {
    // Validation inline
    if (!data.codigo || !data.nombre) {
      throw new Error('codigo and nombre are required');
    }

    // Check uniqueness
    const existing = await this.findByCode(data.codigo);
    if (existing) {
      throw new Error('Cost center with this codigo already exists');
    }

    // Create
    const costCenter = this.repository.create({ ...data });
    return await this.repository.save(costCenter);
  } catch (error) {
    // ...
  }
}
```

**Could Extract Validation**:

```typescript
private validateCreateData(data: CostCenterCreateDto): void {
  if (!data.codigo || data.codigo.trim() === '') {
    throw new ValidationError('codigo is required and cannot be empty');
  }

  if (!data.nombre || data.nombre.trim() === '') {
    throw new ValidationError('nombre is required and cannot be empty');
  }

  if (data.presupuesto !== undefined && data.presupuesto < 0) {
    throw new ValidationError('presupuesto cannot be negative');
  }
}

async create(data: CostCenterCreateDto): Promise<CostCenterDto> {
  this.validateCreateData(data);

  // Check uniqueness
  const existing = await this.findByCode(data.codigo);
  if (existing) {
    throw new ConflictError('CentroCosto', 'codigo', data.codigo);
  }

  // Create
  const costCenter = this.repository.create({ ...data, isActive: true });
  const saved = await this.repository.save(costCenter);

  Logger.info('Cost center created successfully', {
    context: 'CostCenterService.create',
    costCenterId: saved.id,
    codigo: saved.codigo,
  });

  return toCostCenterDto(saved);
}
```

**Benefits**:

- Cleaner method logic
- Testable validation in isolation
- Easy to extend validation rules

**Effort**: 20 minutes

---

## Code Quality Analysis

### ✅ Strengths

1. **Good QueryBuilder Usage**
   - Uses TypeORM QueryBuilder correctly for complex queries
   - Proper parameterization (no SQL injection risk)
   - Good use of ILIKE for case-insensitive search

2. **Pagination Implemented**
   - Returns `{ data, total }` format correctly
   - Calculates skip/take properly
   - Default pagination values (page=1, limit=20)

3. **Soft Delete Pattern**
   - Uses `isActive` flag (not hard delete)
   - Preserves data for audit trail
   - Good for business applications

4. **Sort Field Whitelist**
   - Lines 29-36: Prevents SQL injection via sort fields
   - Maps user-friendly names to database columns
   - Good security practice

5. **Budget Calculation Logic**
   - `getTotalBudgetByProject`: Aggregates budgets correctly
   - Uses SUM with proper type casting
   - Handles null results (defaults to 0)

6. **Error Logging**
   - All errors logged with context
   - Includes stack traces
   - Good for debugging

### ⚠️ Weaknesses

1. **Generic Error Handling**
   - All errors are generic `Error` type
   - Controllers can't distinguish error types
   - No semantic HTTP status mapping

2. **Raw Entity Returns**
   - Exposes internal TypeORM entities
   - No API contract enforcement
   - Tight coupling to database schema

3. **No Success Logging**
   - Can't track successful operations
   - Missing audit trail for creates/updates/deletes
   - Harder to monitor system usage

4. **Singleton Export**
   - Service instantiated at module load time
   - Can cause database initialization errors
   - Same bug we fixed in Session 12

5. **No Tenant Context**
   - Missing multi-tenant isolation (schema blocker)
   - Security risk in production
   - Deferred to Phase 21

6. **No Tests**
   - No `cost-center.service.spec.ts` file
   - Can't verify behavior
   - Risky refactoring without tests

### 📊 Metrics

| Metric                | Value | Target  | Status  |
| --------------------- | ----- | ------- | ------- |
| Lines of Code         | 240   | <300    | ✅ Pass |
| Cyclomatic Complexity | Low   | Low-Med | ✅ Pass |
| Methods               | 9     | <15     | ✅ Pass |
| Custom Errors         | 0     | 9       | ❌ Fail |
| Return DTOs           | 0     | 9       | ❌ Fail |
| Success Logs          | 0     | 9       | ❌ Fail |
| Test Coverage         | 0%    | 70%+    | ❌ Fail |

---

## Refactoring Plan

### Phase 1: Critical Fixes (Must Do)

**Estimated Time**: 1.5 hours

1. **Replace Generic Errors** (30 min)
   - Import custom error classes
   - Replace 7 `throw new Error()` instances
   - Test error scenarios

2. **Create and Apply DTOs** (1 hour)
   - Create `cost-center.dto.ts` with 5 DTOs
   - Create `toCostCenterDto()` transformer
   - Update all return types
   - Apply transformations in all methods

### Phase 2: Important Fixes (Should Do)

**Estimated Time**: 1 hour

3. **Add Success Logging** (30 min)
   - Add info-level logs to all 9 methods
   - Include relevant context (IDs, counts, totals)
   - Log business events (creates, updates, deletes)

4. **Add JSDoc Documentation** (30 min)
   - Document business rules
   - Document parameters and return types
   - Add error conditions
   - Include examples

### Phase 3: Tenant Context (Deferred)

**Estimated Time**: Deferred to Phase 21

5. **Add Tenant Context TODOs**
   - Add `// TODO: Add tenant_id filter` comments
   - Document as deferred in audit
   - Plan for Phase 21 schema migration

### Phase 4: Testing (Should Do)

**Estimated Time**: 45 minutes

6. **Create Test Suite** (45 min)
   - Create `cost-center.service.spec.ts`
   - Test service instantiation
   - Test method signatures
   - Test parameter validation
   - Aim for 15-20 basic tests

### Phase 5: Optional Improvements (Nice to Have)

**Estimated Time**: 35 minutes (optional)

7. **Remove Singleton Export** (15 min)
   - Remove `export default new CostCenterService()`
   - Update controller to lazy instantiate

8. **Extract Filter DTO** (15 min)
   - Create `CostCenterQueryDto` interface
   - Update `findAll` signature

9. **Extract Validation Method** (20 min)
   - Create `validateCreateData()` method
   - Cleaner `create()` logic

---

## Testing Strategy

### Test File: `cost-center.service.spec.ts`

**Coverage Goals**:

- Service instantiation
- Method signatures and return types
- Parameter validation (basic)

**Example Test Structure**:

```typescript
describe('CostCenterService', () => {
  let service: CostCenterService;

  beforeEach(() => {
    service = new CostCenterService();
  });

  describe('Instantiation', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(CostCenterService);
    });
  });

  describe('Method Signatures', () => {
    it('should have findAll method', () => {
      expect(service.findAll).toBeDefined();
      expect(typeof service.findAll).toBe('function');
    });

    it('should have findById method', () => {
      expect(service.findById).toBeDefined();
      expect(typeof service.findById).toBe('function');
    });

    it('should have create method', () => {
      expect(service.create).toBeDefined();
      expect(typeof service.create).toBe('function');
    });

    it('should have update method', () => {
      expect(service.update).toBeDefined();
      expect(typeof service.update).toBe('function');
    });

    it('should have delete method', () => {
      expect(service.delete).toBeDefined();
      expect(typeof service.delete).toBe('function');
    });

    it('should have getTotalBudgetByProject method', () => {
      expect(service.getTotalBudgetByProject).toBeDefined();
      expect(typeof service.getTotalBudgetByProject).toBe('function');
    });

    it('should have getActiveCount method', () => {
      expect(service.getActiveCount).toBeDefined();
      expect(typeof service.getActiveCount).toBe('function');
    });
  });

  describe('Parameter Types', () => {
    it('findById should accept number parameter', () => {
      expect(service.findById.length).toBe(1);
    });

    it('findAll should accept optional filters object', () => {
      expect(service.findAll.length).toBe(1);
    });

    it('create should accept data object', () => {
      expect(service.create.length).toBe(1);
    });

    it('update should accept id and data parameters', () => {
      expect(service.update.length).toBe(2);
    });

    it('delete should accept id parameter', () => {
      expect(service.delete.length).toBe(1);
    });
  });
});
```

**Note**: These are lightweight tests (no database mocking). Integration tests deferred until repository mocking pattern established.

---

## Before/After Comparison

### Error Handling

**Before**:

```typescript
throw new Error('Cost center not found');
```

**After**:

```typescript
throw new NotFoundError('CentroCosto', id);
```

### Return Types

**Before**:

```typescript
async findById(id: number): Promise<CentroCosto> {
  return costCenter;
}
```

**After**:

```typescript
async findById(id: number): Promise<CostCenterDto> {
  Logger.info('Cost center retrieved', { costCenterId: id });
  return toCostCenterDto(costCenter);
}
```

### Method Documentation

**Before**:

```typescript
async create(data: Partial<CentroCosto>): Promise<CentroCosto> {
  // No documentation
}
```

**After**:

```typescript
/**
 * Create a new cost center
 *
 * Business Rules:
 * - codigo must be unique
 * - codigo and nombre are required
 * - Active by default
 *
 * @param data - Cost center creation data
 * @returns Created cost center DTO
 * @throws {ValidationError} If required fields missing
 * @throws {ConflictError} If codigo already exists
 */
async create(data: CostCenterCreateDto): Promise<CostCenterDto> {
  // ...
}
```

---

## Risk Assessment

### Low Risk ✅

- Error handling updates (isolated changes)
- DTO creation (additive only)
- Success logging (additive only)
- JSDoc documentation (no code changes)

### Medium Risk ⚠️

- Return type changes (affects controllers)
- Singleton removal (affects route initialization)
- Must verify all controllers updated

### High Risk 🚨

- Tenant context (requires schema migration)
- **Deferred to Phase 21** - too risky without schema

### Mitigation Strategy

1. **Run tests after each change** (verify 162 tests passing)
2. **Check build** (`npm run build`)
3. **Verify Docker logs** (no runtime errors)
4. **Test API endpoints** in browser/Postman after refactoring
5. **Commit incrementally** if needed

---

## Related Services

### Dependencies

- **project.service.ts**: Cost centers are linked to projects (proyecto_id)
- **budget.service.ts** (if exists): Budget tracking and allocation

### Similar Services

- **account.service.ts** (if exists): Account management
- **department.service.ts** (if exists): Department/org structure

### Impacted Controllers

- **cost-center.controller.ts**: Must handle new DTOs
- **cost-center.routes.ts**: Must use lazy controller instantiation

---

## Acceptance Criteria

### Definition of Done

- [x] Audit document created
- [ ] All 7 generic errors replaced with custom error classes
- [ ] All 5 DTOs created and applied
- [ ] All 9 methods have success logging
- [ ] All methods have JSDoc documentation
- [ ] Singleton export removed
- [ ] Test file created with 15-20 tests
- [ ] All 162+ tests passing
- [ ] Build successful (no TypeScript errors)
- [ ] Docker logs clean (no runtime errors)
- [ ] Changes committed

### Success Metrics

- ✅ Compliance Score: 30% → 80%+
- ✅ Test Coverage: 0% → Basic structure coverage
- ✅ Custom Errors: 0 → 7 instances
- ✅ Success Logs: 0 → 9 instances
- ✅ DTOs Applied: 0 → 9 methods
- ✅ JSDoc Coverage: 0% → 100%

---

## Next Steps

1. **Create DTOs** (`cost-center.dto.ts`)
2. **Refactor Service** (apply all standards)
3. **Create Tests** (`cost-center.service.spec.ts`)
4. **Update Controllers** (if needed for DTOs)
5. **Verify & Commit** (run tests, build, check logs)
6. **Update Progress Tracker** (mark cost-center as complete)

---

## Additional Notes

### Why Cost Centers Matter

Cost centers are critical for project financial management:

- Track budget allocations by department/category
- Enable cost analysis and reporting
- Support budget vs actual comparisons
- Required for financial auditing

### Business Domain Knowledge

- **Centro de Costo**: Organizational unit for budget tracking
- **Presupuesto**: Allocated budget for the cost center
- **Proyecto**: Parent project the cost center belongs to
- **Código**: Unique identifier (e.g., "CC-001", "OPS-2024")

### Performance Considerations

- `findAll` with pagination is efficient
- `getTotalBudgetByProject` uses SUM aggregate (efficient)
- Indexes on `codigo` and `proyecto_id` support queries
- Soft delete (isActive) maintains performance (no need to query deleted records unless needed)

---

**Audit Status**: ✅ Complete  
**Ready for Refactoring**: ✅ Yes  
**Estimated Total Effort**: 2.5 - 3 hours

---

_This audit follows SERVICE_LAYER_STANDARDS.md and uses patterns from sessions 1-13_
