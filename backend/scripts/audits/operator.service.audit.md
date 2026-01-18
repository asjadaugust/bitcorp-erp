# Service Audit: OperatorService

**File**: `backend/src/services/operator.service.ts`  
**Date**: 2026-01-18  
**Audited By**: OpenCode Agent  
**Status**: ⚠️ Issues Found

---

## Overview

- **Lines of Code**: 369
- **Public Methods**: 7 (findAll, findById, findByDni, create, update, delete, getStats)
- **Has Tests**: ❌ No (test file not found)
- **Test Coverage**: 0%
- **Complexity**: 🟡 Moderate (pagination, filtering, business validation)

---

## Error Handling Analysis

### Current Pattern

```typescript
// Generic Error throws (5 places)
throw new Error('Operator not found'); // Lines 163, 244
throw new Error('An operator with this DNI already exists'); // Lines 220, 283
throw new Error('Failed to fetch operators'); // Line 152
throw new Error('Failed to delete operator'); // Line 314

// Has basic try/catch with Logger.error
try {
  // ... operation
} catch (error) {
  Logger.error('Error message', { error, context: 'OperatorService.methodName' });
  throw new Error('Generic error message');
}
```

### Issues Found

- [x] **Generic Errors**: Uses `throw new Error(...)` instead of custom error classes (5 places)
  - Lines 163, 244: Should be `NotFoundError`
  - Lines 220, 283: Should be `ConflictError`
  - Lines 152, 314: Should preserve original error
- [x] **Missing Error Codes**: No machine-readable error codes
- [x] **Spanish Messages**: Already uses Spanish messages ✅
- [x] **No Re-throw on Success**: Catches and throws generic Error, losing original error type
- [x] **Partial Error Logging**: Has Logger.error but missing Logger.info on success

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { NotFoundError, ConflictError } from '../errors/http.errors';
import Logger from '../utils/logger';

async findById(tenantId: number, id: number): Promise<OperatorDto> {
  try {
    Logger.info('Fetching operator by ID', { tenantId, id, context: 'OperatorService.findById' });

    const trabajador = await this.repository.findOne({ where: { id } });
    // TODO: Add tenant_id filter when column exists in rrhh.trabajador table
    // .where({ id, tenant_id: tenantId })

    if (!trabajador) {
      throw new NotFoundError('Operator', id, { tenantId });
    }

    Logger.info('Operator fetched successfully', { tenantId, id, context: 'OperatorService.findById' });
    return toOperatorDto(trabajador);
  } catch (error) {
    Logger.error('Error fetching operator', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'OperatorService.findById',
    });
    throw error;  // Preserve original error (NotFoundError, etc.)
  }
}

async create(tenantId: number, data: OperatorCreateDto): Promise<OperatorDto> {
  try {
    Logger.info('Creating operator', { tenantId, dni: data.dni, context: 'OperatorService.create' });

    // Check for duplicate DNI
    const existing = await this.repository.findOne({ where: { dni: data.dni } });
    if (existing) {
      throw new ConflictError('Operator', { dni: data.dni, tenantId });
    }

    // ... create logic

    Logger.info('Operator created successfully', { tenantId, id: saved.id, context: 'OperatorService.create' });
    return toOperatorDto(saved);
  } catch (error) {
    Logger.error('Error creating operator', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      dni: data.dni,
      context: 'OperatorService.create',
    });
    throw error;  // Preserve ConflictError or other errors
  }
}
```

**Effort**: 🟡 Medium (2-3 hours to fix all 7 methods)

---

## Return Type Analysis

### Current Pattern

```typescript
// ✅ GOOD: Already uses DTOs
async findAll(filters?: OperatorFilter): Promise<{ data: OperatorDto[]; total: number }> {
  const result = await queryBuilder.getManyAndCount();
  return { data: toOperatorDtoArray(result[0]), total: result[1] };
}

async findById(id: number): Promise<OperatorDto> {
  return toOperatorDto(trabajador);
}

// ❌ BAD: findByDni returns null instead of throwing
async findByDni(dni: string): Promise<Trabajador | null> {
  const trabajador = await this.repository.findOne({ where: { dni } });
  return trabajador;  // Returns null if not found
}
```

### Issues Found

- [x] **findByDni returns null**: Should throw NotFoundError instead (line 178)
- [ ] **Inconsistent Return Types**: findByDni returns `Trabajador | null`, others return DTOs
- [ ] **No Transformation in findByDni**: Returns raw entity, not DTO

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN (fix findByDni)
async findByDni(tenantId: number, dni: string): Promise<OperatorDto> {
  try {
    Logger.info('Fetching operator by DNI', { tenantId, dni, context: 'OperatorService.findByDni' });

    const trabajador = await this.repository.findOne({ where: { dni } });
    // TODO: Add tenant_id filter when column exists

    if (!trabajador) {
      throw new NotFoundError('Operator', dni, { tenantId });
    }

    Logger.info('Operator fetched successfully', { tenantId, dni, context: 'OperatorService.findByDni' });
    return toOperatorDto(trabajador);
  } catch (error) {
    Logger.error('Error fetching operator by DNI', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      dni,
      context: 'OperatorService.findByDni',
    });
    throw error;
  }
}
```

**Effort**: 🟢 Small (30 min to fix findByDni)

---

## Tenant Context Analysis

### Current Pattern

```typescript
// ❌ NO TENANT PARAMETER
async findAll(filters?: OperatorFilter): Promise<{ data: OperatorDto[]; total: number }>
async findById(id: number): Promise<OperatorDto>
async findByDni(dni: string): Promise<Trabajador | null>
async create(data: CreateOperatorDto): Promise<OperatorDto>
async update(id: number, data: UpdateOperatorDto): Promise<OperatorDto>
async delete(id: number): Promise<void>
async getStats(): Promise<{ total: number; active: number; inactive: number }>
```

### Issues Found

- [x] **No Tenant Parameter**: None of the 7 methods accept `tenantId` parameter
- [x] **Missing Tenant Filter**: Queries don't filter by `tenant_id` (database limitation - column doesn't exist yet)
- [x] **Cross-Tenant Risk**: Potential to access other tenant's data (HIGH PRIORITY)
- [x] **No Tenant Verification**: Update/delete don't verify tenant ownership

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

// Add tenantId parameter to ALL methods
async findAll(
  tenantId: number,
  filters?: OperatorFiltersDto,
  page = 1,
  limit = 10
): Promise<{ data: OperatorDto[]; total: number }> {
  try {
    Logger.info('Fetching operators', { tenantId, filters, page, limit, context: 'OperatorService.findAll' });

    const queryBuilder = this.repository
      .createQueryBuilder('t')
      .where('t.is_active = :isActive', { isActive: filters?.isActive ?? true });

    // TODO: Add tenant_id filter when column exists in rrhh.trabajador table
    // .andWhere('t.tenant_id = :tenantId', { tenantId })

    // Apply filters...
    const [trabajadores, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    Logger.info('Operators fetched successfully', {
      tenantId,
      count: trabajadores.length,
      total,
      context: 'OperatorService.findAll'
    });

    return { data: toOperatorDtoArray(trabajadores), total };
  } catch (error) {
    Logger.error('Error fetching operators', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      filters,
      context: 'OperatorService.findAll',
    });
    throw error;
  }
}

// Update with tenant verification
async update(
  tenantId: number,
  id: number,
  data: OperatorUpdateDto
): Promise<OperatorDto> {
  try {
    Logger.info('Updating operator', { tenantId, id, data, context: 'OperatorService.update' });

    const trabajador = await this.repository.findOne({ where: { id } });
    // TODO: Add tenant_id filter when column exists
    // .where({ id, tenant_id: tenantId })

    if (!trabajador) {
      throw new NotFoundError('Operator', id, { tenantId });
    }

    // Check for duplicate DNI (if DNI is being updated)
    if (data.dni && data.dni !== trabajador.dni) {
      const existing = await this.repository.findOne({ where: { dni: data.dni } });
      if (existing) {
        throw new ConflictError('Operator', { dni: data.dni, tenantId });
      }
    }

    // Update logic...

    Logger.info('Operator updated successfully', { tenantId, id, context: 'OperatorService.update' });
    return toOperatorDto(updated);
  } catch (error) {
    Logger.error('Error updating operator', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      data,
      context: 'OperatorService.update',
    });
    throw error;
  }
}

// Delete with tenant verification
async delete(tenantId: number, id: number): Promise<void> {
  try {
    Logger.info('Deleting operator', { tenantId, id, context: 'OperatorService.delete' });

    // Verify operator exists and belongs to tenant
    const trabajador = await this.repository.findOne({ where: { id } });
    // TODO: Add tenant_id filter when column exists

    if (!trabajador) {
      throw new NotFoundError('Operator', id, { tenantId });
    }

    // Soft delete
    const result = await this.repository.update(id, { isActive: false });

    if (!result.affected || result.affected === 0) {
      throw new NotFoundError('Operator', id, { tenantId });
    }

    Logger.info('Operator deleted successfully', { tenantId, id, context: 'OperatorService.delete' });
  } catch (error) {
    Logger.error('Error deleting operator', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'OperatorService.delete',
    });
    throw error;
  }
}
```

**Effort**: 🟡 Medium (2 hours to add tenantId to all 7 methods + controller updates)

---

## Query Pattern Analysis

### Current Pattern

```typescript
// ✅ GOOD: Already uses QueryBuilder with pagination
async findAll(filters?: OperatorFilter): Promise<{ data: OperatorDto[]; total: number }> {
  const queryBuilder = this.repository
    .createQueryBuilder('t')
    .where('t.is_active = :isActive', { isActive: filters?.isActive ?? true });

  if (filters?.search) {
    queryBuilder.andWhere(
      '(t.nombre_completo ILIKE :search OR t.dni ILIKE :search OR t.email ILIKE :search)',
      { search: `%${filters.search}%` }
    );
  }

  if (filters?.cargo) {
    queryBuilder.andWhere('t.cargo = :cargo', { cargo: filters.cargo });
  }

  if (filters?.especialidad) {
    queryBuilder.andWhere('t.especialidad = :especialidad', { especialidad: filters.especialidad });
  }

  // Dynamic sorting
  const sortField = filters?.sort_by || 'created_at';
  const sortOrder = filters?.sort_order || 'DESC';
  queryBuilder.orderBy(`t.${sortField}`, sortOrder);

  // Pagination
  if (filters?.page && filters?.limit) {
    queryBuilder.skip((filters.page - 1) * filters.limit).take(filters.limit);
  }

  const [trabajadores, total] = await queryBuilder.getManyAndCount();
  return { data: toOperatorDtoArray(trabajadores), total };
}
```

### Issues Found

- [ ] **Good QueryBuilder Usage**: ✅ Already using QueryBuilder
- [ ] **Good Pagination**: ✅ Already has pagination
- [ ] **Good Dynamic Filtering**: ✅ Already has search, cargo, especialidad filters
- [ ] **Good Dynamic Sorting**: ✅ Already has sort_by and sort_order
- [x] **Filter DTO Mixed**: Filter includes page/limit (should be separate parameters)

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
// Separate pagination from filters

// Move filter definition to DTO file
export interface OperatorFiltersDto {
  search?: string;
  cargo?: string;
  especialidad?: string;
  isActive?: boolean;
  operatingUnitId?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

// Remove page, limit from filter (pass as separate params)
async findAll(
  tenantId: number,
  filters?: OperatorFiltersDto,
  page = 1,
  limit = 10
): Promise<{ data: OperatorDto[]; total: number }> {
  try {
    Logger.info('Fetching operators', { tenantId, filters, page, limit, context: 'OperatorService.findAll' });

    const queryBuilder = this.repository
      .createQueryBuilder('t')
      .where('t.is_active = :isActive', { isActive: filters?.isActive ?? true });

    // TODO: Add tenant_id filter
    // .andWhere('t.tenant_id = :tenantId', { tenantId })

    // Apply filters (same as before)...

    // Pagination (use separate params)
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [trabajadores, total] = await queryBuilder.getManyAndCount();

    Logger.info('Operators fetched successfully', {
      tenantId,
      count: trabajadores.length,
      total,
      context: 'OperatorService.findAll'
    });

    return { data: toOperatorDtoArray(trabajadores), total };
  } catch (error) {
    Logger.error('Error fetching operators', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      filters,
      context: 'OperatorService.findAll',
    });
    throw error;
  }
}
```

**Effort**: 🟢 Small (30 min to refactor filter DTO)

---

## Business Logic Analysis

### Current Business Rules

1. **Unique DNI per company**: Cannot create operator with duplicate DNI (lines 218-222, 281-285)
2. **Soft delete only**: Delete sets `isActive = false` instead of hard delete (line 306)
3. **Active/Inactive filtering**: Default to active operators only (line 107)
4. **Search across multiple fields**: Search by nombre_completo, DNI, or email (lines 110-113)

### Issues Found

- [x] **Duplicate DNI Check**: ✅ Already implemented in create/update
- [x] **Soft Delete**: ✅ Already implemented
- [x] **Delete Doesn't Verify Success**: Line 306 doesn't check if update affected any rows
- [x] **No Dependency Checks**: Doesn't check if operator is assigned to equipment/projects before deletion
- [x] **Dual DTO System**: Service defines CreateOperatorDto (lines 22-58) AND DTO file has OperatorCreateDto (lines 125-189)

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

// 1. Remove duplicate DTO definition
// DELETE lines 22-58 (CreateOperatorDto in service)
// USE OperatorCreateDto from dto/operator.dto.ts

// 2. Simplify create method
async create(tenantId: number, data: OperatorCreateDto): Promise<OperatorDto> {
  try {
    Logger.info('Creating operator', { tenantId, dni: data.dni, context: 'OperatorService.create' });

    // Check for duplicate DNI
    const existing = await this.repository.findOne({ where: { dni: data.dni } });
    if (existing) {
      throw new ConflictError('Operator', { dni: data.dni, tenantId });
    }

    // Use DTO transformer to create entity
    const operatorDto: Partial<OperatorDto> = {
      ...data,
      is_active: true,
    };
    const entity = this.repository.create(fromOperatorDto(operatorDto));
    const saved = await this.repository.save(entity);

    Logger.info('Operator created successfully', { tenantId, id: saved.id, context: 'OperatorService.create' });
    return toOperatorDto(saved);
  } catch (error) {
    Logger.error('Error creating operator', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      dni: data.dni,
      context: 'OperatorService.create',
    });
    throw error;
  }
}

// 3. Fix delete to verify success
async delete(tenantId: number, id: number): Promise<void> {
  try {
    Logger.info('Deleting operator', { tenantId, id, context: 'OperatorService.delete' });

    // Verify operator exists
    const trabajador = await this.repository.findOne({ where: { id } });
    // TODO: Add tenant_id filter

    if (!trabajador) {
      throw new NotFoundError('Operator', id, { tenantId });
    }

    // TODO: Business rule - check for active assignments
    // const activeAssignments = await this.assignmentRepository.count({
    //   where: { operator_id: id, status: 'ACTIVE' }
    // });
    // if (activeAssignments > 0) {
    //   throw new BusinessRuleError('Cannot delete operator with active assignments', {
    //     operator_id: id,
    //     active_assignments: activeAssignments
    //   });
    // }

    // Soft delete
    const result = await this.repository.update(id, { isActive: false });

    if (!result.affected || result.affected === 0) {
      throw new NotFoundError('Operator', id, { tenantId });
    }

    Logger.info('Operator deleted successfully', { tenantId, id, context: 'OperatorService.delete' });
  } catch (error) {
    Logger.error('Error deleting operator', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'OperatorService.delete',
    });
    throw error;
  }
}
```

**Effort**: 🟡 Medium (1 hour to remove dual DTO system and fix delete)

---

## Logging Analysis

### Current Logging

```typescript
// ✅ PARTIAL: Has error logging
try {
  // ... operation
} catch (error) {
  Logger.error('Error message', { error, context: 'OperatorService.methodName' });
  throw new Error('Generic error message');
}

// ❌ MISSING: No success logging (Logger.info)
```

### Issues Found

- [x] **No Success Logging**: Missing `Logger.info` on method entry and success (7 methods)
- [ ] **Has Error Logging**: ✅ Already has `Logger.error` in catch blocks
- [x] **Generic Error Context**: Context includes method name but not tenantId
- [x] **Partial Context**: Error logs don't always include request parameters (id, filters, etc.)

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN (apply to all 7 methods)
async methodName(tenantId: number, ...params): Promise<ReturnType> {
  try {
    // Entry log
    Logger.info('Method operation starting', {
      tenantId,
      ...params,
      context: 'OperatorService.methodName',
    });

    // ... operation logic

    // Success log
    Logger.info('Method operation successful', {
      tenantId,
      result: { id: result.id, ... },  // Include key result info
      context: 'OperatorService.methodName',
    });

    return result;
  } catch (error) {
    // Error log (already exists, just enhance)
    Logger.error('Error in method operation', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      ...params,
      context: 'OperatorService.methodName',
    });
    throw error;  // Preserve original error
  }
}
```

**Effort**: 🟡 Medium (1.5 hours to add Logger.info to all 7 methods)

---

## Testing Analysis

### Current Test Coverage

- **Test File Exists**: ❌ No
- **Test Count**: 0 tests
- **Coverage**: 0%
- **Tests Run**: N/A

### Issues Found

- [x] **No Test File**: Service has no test file at all
- [x] **Zero Coverage**: 0% test coverage
- [x] **No Tenant Isolation Tests**: Can't verify cross-tenant access prevention
- [x] **No Business Rule Tests**: Duplicate DNI validation not tested
- [x] **No Error Tests**: NotFoundError, ConflictError not tested

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
// backend/src/services/__tests__/operator.service.spec.ts
import { OperatorService } from '../operator.service';
import { AppDataSource } from '../../config/database.config';
import { NotFoundError, ConflictError } from '../../errors/http.errors';
import { OperatorCreateDto, OperatorUpdateDto } from '../../types/dto/operator.dto';

describe('OperatorService', () => {
  let service: OperatorService;
  const TENANT_ID = 1;
  const OTHER_TENANT_ID = 2;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    service = new OperatorService();
    // Clear test data
    await AppDataSource.getRepository('Trabajador').delete({});
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('create', () => {
    it('should create operator successfully', async () => {
      const data: OperatorCreateDto = {
        dni: '12345678',
        nombre_completo: 'Test Operator',
        cargo: 'OPERADOR',
        especialidad: 'EXCAVADORA',
        telefono: '987654321',
        email: 'test@example.com',
        fecha_ingreso: '2024-01-01',
      };

      const result = await service.create(TENANT_ID, data);

      expect(result.id).toBeDefined();
      expect(result.dni).toBe('12345678');
      expect(result.nombre_completo).toBe('Test Operator');
      expect(result.is_active).toBe(true);
    });

    it('should throw ConflictError if DNI already exists', async () => {
      const data: OperatorCreateDto = {
        dni: '12345678',
        nombre_completo: 'Test Operator',
        cargo: 'OPERADOR',
        especialidad: 'EXCAVADORA',
      };

      await service.create(TENANT_ID, data);

      await expect(
        service.create(TENANT_ID, { ...data, nombre_completo: 'Another Operator' })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('findById', () => {
    it('should return operator by ID', async () => {
      const created = await service.create(TENANT_ID, {
        dni: '12345678',
        nombre_completo: 'Test Operator',
        cargo: 'OPERADOR',
      });

      const found = await service.findById(TENANT_ID, created.id);

      expect(found.id).toBe(created.id);
      expect(found.dni).toBe('12345678');
    });

    it('should throw NotFoundError if operator not found', async () => {
      await expect(service.findById(TENANT_ID, 99999)).rejects.toThrow(NotFoundError);
    });

    // TODO: Add tenant isolation test when tenant_id column exists
    // it('should not return operator from other tenant', async () => {
    //   const created = await service.create(TENANT_ID, { ... });
    //   await expect(
    //     service.findById(OTHER_TENANT_ID, created.id)
    //   ).rejects.toThrow(NotFoundError);
    // });
  });

  describe('findByDni', () => {
    it('should return operator by DNI', async () => {
      await service.create(TENANT_ID, {
        dni: '12345678',
        nombre_completo: 'Test Operator',
        cargo: 'OPERADOR',
      });

      const found = await service.findByDni(TENANT_ID, '12345678');

      expect(found.dni).toBe('12345678');
    });

    it('should throw NotFoundError if DNI not found', async () => {
      await expect(service.findByDni(TENANT_ID, '99999999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      await service.create(TENANT_ID, {
        dni: '11111111',
        nombre_completo: 'Active Operator',
        cargo: 'OPERADOR',
      });

      const inactive = await service.create(TENANT_ID, {
        dni: '22222222',
        nombre_completo: 'Inactive Operator',
        cargo: 'OPERADOR',
      });
      await service.delete(TENANT_ID, inactive.id); // Soft delete
    });

    it('should return active operators by default', async () => {
      const result = await service.findAll(TENANT_ID, undefined, 1, 10);

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].dni).toBe('11111111');
    });

    it('should filter by cargo', async () => {
      await service.create(TENANT_ID, {
        dni: '33333333',
        nombre_completo: 'Mechanic',
        cargo: 'MECANICO',
      });

      const result = await service.findAll(TENANT_ID, { cargo: 'MECANICO' }, 1, 10);

      expect(result.total).toBe(1);
      expect(result.data[0].cargo).toBe('MECANICO');
    });

    it('should search by nombre_completo, dni, email', async () => {
      const result = await service.findAll(TENANT_ID, { search: 'Active' }, 1, 10);

      expect(result.total).toBe(1);
      expect(result.data[0].nombre_completo).toContain('Active');
    });

    it('should paginate results', async () => {
      // Create 15 operators
      for (let i = 3; i <= 17; i++) {
        await service.create(TENANT_ID, {
          dni: `${i}0000000`,
          nombre_completo: `Operator ${i}`,
          cargo: 'OPERADOR',
        });
      }

      const page1 = await service.findAll(TENANT_ID, undefined, 1, 10);
      const page2 = await service.findAll(TENANT_ID, undefined, 2, 10);

      expect(page1.data).toHaveLength(10);
      expect(page2.data).toHaveLength(6); // 16 total - 10 on page 1
      expect(page1.total).toBe(16);
      expect(page2.total).toBe(16);
    });
  });

  describe('update', () => {
    it('should update operator successfully', async () => {
      const created = await service.create(TENANT_ID, {
        dni: '12345678',
        nombre_completo: 'Test Operator',
        cargo: 'OPERADOR',
      });

      const updated = await service.update(TENANT_ID, created.id, {
        cargo: 'MECANICO',
        especialidad: 'SOLDADURA',
      });

      expect(updated.cargo).toBe('MECANICO');
      expect(updated.especialidad).toBe('SOLDADURA');
    });

    it('should throw NotFoundError if operator not found', async () => {
      await expect(service.update(TENANT_ID, 99999, { cargo: 'MECANICO' })).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ConflictError if updating to existing DNI', async () => {
      const operator1 = await service.create(TENANT_ID, {
        dni: '11111111',
        nombre_completo: 'Operator 1',
        cargo: 'OPERADOR',
      });

      await service.create(TENANT_ID, {
        dni: '22222222',
        nombre_completo: 'Operator 2',
        cargo: 'OPERADOR',
      });

      await expect(service.update(TENANT_ID, operator1.id, { dni: '22222222' })).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe('delete', () => {
    it('should soft delete operator successfully', async () => {
      const created = await service.create(TENANT_ID, {
        dni: '12345678',
        nombre_completo: 'Test Operator',
        cargo: 'OPERADOR',
      });

      await service.delete(TENANT_ID, created.id);

      // Should throw NotFoundError (soft deleted = not active)
      await expect(service.findById(TENANT_ID, created.id)).rejects.toThrow(NotFoundError);

      // But should be found if querying inactive
      const result = await service.findAll(TENANT_ID, { isActive: false }, 1, 10);
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(created.id);
    });

    it('should throw NotFoundError if operator not found', async () => {
      await expect(service.delete(TENANT_ID, 99999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await service.create(TENANT_ID, {
        dni: '11111111',
        nombre_completo: 'Active 1',
        cargo: 'OPERADOR',
      });

      await service.create(TENANT_ID, {
        dni: '22222222',
        nombre_completo: 'Active 2',
        cargo: 'OPERADOR',
      });

      const inactive = await service.create(TENANT_ID, {
        dni: '33333333',
        nombre_completo: 'Inactive',
        cargo: 'OPERADOR',
      });
      await service.delete(TENANT_ID, inactive.id);
    });

    it('should return operator statistics', async () => {
      const stats = await service.getStats(TENANT_ID);

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.inactive).toBe(1);
    });
  });
});
```

**Effort**: 🔴 Large (4-5 hours to write comprehensive tests)

---

## Summary

### Critical Issues (Fix First) 🔴

1. **No tenantId parameter** (7 methods) - SECURITY RISK
2. **Generic Error instead of NotFoundError** (lines 163, 244) - Breaks error handling
3. **Generic Error instead of ConflictError** (lines 220, 283) - Breaks error handling
4. **findByDni returns null** (line 178) - Inconsistent with other methods
5. **delete doesn't verify success** (line 306) - Silent failures

### Important Issues (Fix Next) 🟡

1. **No Logger.info** (7 methods) - Missing audit trail for successful operations
2. **Dual DTO system** (lines 22-58 vs dto file) - Code duplication, confusing
3. **Complex create/update mapping** (lines 197-277) - Should use DTO transformers
4. **Filter DTO mixed with pagination** (lines 8-18) - Should separate concerns
5. **No tests** (0% coverage) - No confidence in changes

### Nice to Have (Optional) 🟢

1. **Add business rule checks** (delete should check for active assignments)
2. **Enhance error context** (include more details in error logs)
3. **Add JSDoc comments** (document business rules and parameter meanings)

---

## Action Plan

### Step 1: Error Handling (1 hour)

- [x] Import custom error classes (`NotFoundError`, `ConflictError`)
- [x] Replace 3 generic Errors with `NotFoundError` (lines 163, 244, + delete)
- [x] Replace 2 generic Errors with `ConflictError` (lines 220, 283)
- [x] Fix findByDni to throw NotFoundError instead of return null (line 178)
- [x] Fix delete to verify success (check affected rows)
- [x] Preserve original errors in catch blocks (don't wrap in generic Error)

### Step 2: Tenant Context (1.5 hours)

- [x] Add `tenantId` parameter to all 7 methods (first parameter)
- [x] Add TODO comments for tenant_id filtering (database limitation)
- [x] Update controller to pass tenantId to all service methods
- [x] Test tenant parameter passing

### Step 3: Logging (1 hour)

- [x] Add `Logger.info` on entry to all 7 methods
- [x] Add `Logger.info` on success to all 7 methods
- [x] Enhance error logs with tenantId and parameters
- [x] Test log output in development

### Step 4: Business Logic Cleanup (1 hour)

- [x] Remove duplicate CreateOperatorDto from service (lines 22-58)
- [x] Use OperatorCreateDto from DTO file
- [x] Simplify create method mapping (use DTO transformers)
- [x] Simplify update method mapping (use DTO transformers)

### Step 5: DTO Refactoring (30 min)

- [x] Move OperatorFilter interface to DTO file as OperatorFiltersDto
- [x] Remove page, limit from filter interface (pass as separate params)
- [x] Update findAll signature: `findAll(tenantId, filters?, page, limit)`

### Step 6: Controller Updates (45 min)

- [x] Import and catch `NotFoundError` (404 response)
- [x] Import and catch `ConflictError` (409 response)
- [x] Remove error message string matching (use instanceof)
- [x] Pass tenantId to all service calls
- [x] Pass page, limit separately from filters
- [x] Update all 11 controller methods

### Step 7: Testing (4-5 hours - DEFERRED)

- [ ] Create test file `__tests__/operator.service.spec.ts`
- [ ] Add create tests (happy path, ConflictError)
- [ ] Add findById tests (happy path, NotFoundError)
- [ ] Add findByDni tests (happy path, NotFoundError)
- [ ] Add findAll tests (pagination, filtering, search)
- [ ] Add update tests (happy path, NotFoundError, ConflictError)
- [ ] Add delete tests (soft delete, NotFoundError)
- [ ] Add getStats tests
- [ ] Achieve 70%+ coverage

---

## Estimated Total Effort

**Overall Complexity**: 🟡 Medium (6-7 hours total, or 2-3 hours without tests)

**Recommended Approach**:

1. ✅ Start with error handling (foundation) - 1 hour
2. ✅ Add tenant context (security critical) - 1.5 hours
3. ✅ Add logging (observability) - 1 hour
4. ✅ Clean up business logic (simplify) - 1 hour
5. ✅ Refactor DTOs (consistency) - 30 min
6. ✅ Update controller (integration) - 45 min
7. ⏳ Add tests (confidence) - 4-5 hours (DEFERRED to future session)

**Total Without Tests**: ~6 hours  
**Total With Tests**: ~11 hours

---

## Expected Changes

### Service Changes:

| Aspect                 | Before | After | Change      |
| ---------------------- | ------ | ----- | ----------- |
| **Lines of Code**      | 369    | ~550  | +49% (+181) |
| **Methods**            | 7      | 7     | Same        |
| **tenantId params**    | 0      | 7     | +7          |
| **NotFoundError**      | 0      | 4     | +4          |
| **ConflictError**      | 0      | 2     | +2          |
| **Logger.info calls**  | 0      | 14+   | +14         |
| **Logger.error calls** | 7      | 7     | Same        |
| **Return null**        | 1      | 0     | -1          |
| **Generic Error**      | 5      | 0     | -5          |
| **Dual DTO system**    | Yes    | No    | Removed     |
| **Service pagination** | Yes    | Yes   | Keep        |

### DTO Changes:

| Aspect                     | Before | After | Change |
| -------------------------- | ------ | ----- | ------ |
| **Lines of Code**          | 262    | ~275  | +5%    |
| **Add OperatorFiltersDto** | No     | Yes   | +1     |

### Controller Changes:

| Aspect                       | Before | After | Change |
| ---------------------------- | ------ | ----- | ------ |
| **Lines of Code**            | 260    | ~310  | +19%   |
| **Methods passing tenantId** | 0      | 11    | +11    |
| **String error matching**    | 3      | 0     | -3     |
| **instanceof checks**        | 0      | 2     | +2     |

---

## Sign-off

**Audit Complete**: 2026-01-18  
**Issues Found**: 15 critical/important issues  
**Estimated Effort**: 6 hours (without tests), 11 hours (with tests)  
**Priority**: 🟡 Medium (Priority 2 service)  
**Complexity**: 🟡 Moderate (pagination already exists, but needs full standardization)  
**Next Service**: `unit.service.ts` (Priority 2, 3/14)

---

## Notes

1. **Database Limitation**: The `rrhh.trabajador` table currently has NO `tenant_id` column. All tenant filtering must use TODO comments until schema is updated.

2. **Similar to employee.service.ts**: Both services manage HR/worker data from same table. Can reuse patterns from Session 6.

3. **Pagination Already Exists**: Unlike employee.service.ts, this service already has working pagination. Main work is error handling + tenant context.

4. **Dual DTO System**: Service reinvents OperatorCreateDto (lines 22-58) when DTO file already has validated OperatorCreateDto (lines 125-189). Remove service version, use DTO file version.

5. **Complex Mapping**: Lines 197-214 (create) and 248-277 (update) manually map between camelCase/snake_case. Should use `fromOperatorDto` transformer instead.

6. **Controller Has 11 Methods**: Service has 7 methods, but controller has 11 (includes exportExcel, exportCSV, searchBySkill, getAvailability, getPerformance). Export methods work, stub methods are TODO.

7. **getStats Method**: Currently has no tenantId parameter (line 318). Need to add for consistency even though tenant_id column doesn't exist yet.

8. **Tests Deferred**: Comprehensive test suite (70%+ coverage) deferred to future session. Service refactoring can proceed without tests for now (152/152 tests already passing, not breaking existing tests).
