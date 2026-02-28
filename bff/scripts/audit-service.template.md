# Service Audit: [SERVICE_NAME]

**File**: `backend/src/services/[service-name].service.ts`  
**Date**: [DATE]  
**Audited By**: OpenCode Agent  
**Status**: 🔍 In Progress | ✅ Complete | ⚠️ Issues Found

---

## Overview

- **Lines of Code**: [COUNT]
- **Public Methods**: [COUNT]
- **Has Tests**: ✅ Yes (`[service-name].service.spec.ts`) | ❌ No
- **Test Coverage**: [PERCENTAGE]% (if tests exist)
- **Complexity**: 🟢 Simple | 🟡 Moderate | 🔴 Complex

---

## Error Handling Analysis

### Current Pattern

```typescript
// Example of how errors are currently thrown
// [PASTE CODE SAMPLE]
```

### Issues Found

- [ ] **Generic Errors**: Uses `throw new Error(...)` instead of custom error classes
- [ ] **Missing Error Codes**: No machine-readable error codes
- [ ] **English Messages**: Error messages in English (should be Spanish where appropriate)
- [ ] **Incorrect HTTP Status**: Wrong status codes for error types
- [ ] **No Error Logging**: Missing error logging with context
- [ ] **No Re-throw**: Catches errors but doesn't re-throw

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { NotFoundError, ConflictError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';
import Logger from '../utils/logger';

async findById(tenantId: number, id: number): Promise<EntityDto> {
  try {
    const entity = await this.repository.findOne({
      where: { id, tenant_id: tenantId }
    });

    if (!entity) {
      throw new NotFoundError('Entity', id);
    }

    return toEntityDto(entity);
  } catch (error) {
    Logger.error('Error finding entity', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: '[ServiceName].findById',
    });
    throw error;
  }
}
```

**Effort**: 🟢 Small | 🟡 Medium | 🔴 Large

---

## Return Type Analysis

### Current Pattern

```typescript
// Example of current return types
// [PASTE CODE SAMPLE]
```

### Issues Found

- [ ] **Returns Raw Entities**: Methods return `Entity` instead of `EntityDto`
- [ ] **Inconsistent Return Types**: Some methods return DTOs, others return entities
- [ ] **Missing Transformations**: No DTO transformation functions used
- [ ] **Missing DTO Imports**: DTO types not imported
- [ ] **No Pagination Shape**: List methods don't return `{ data, total }`

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import {
  EntityListDto,
  EntityDetailDto,
  toEntityListDto,
  toEntityDetailDto,
  toEntityListDtoArray,
} from '../types/dto/entity.dto';

async findAll(
  tenantId: number,
  page = 1,
  limit = 10
): Promise<{ data: EntityListDto[]; total: number }> {
  const [entities, total] = await this.repository
    .createQueryBuilder('e')
    .where('e.tenant_id = :tenantId', { tenantId })
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data: toEntityListDtoArray(entities),
    total,
  };
}

async findById(tenantId: number, id: number): Promise<EntityDetailDto> {
  const entity = await this.repository.findOne({
    where: { id, tenant_id: tenantId },
    relations: ['relatedEntity'],
  });

  if (!entity) {
    throw new NotFoundError('Entity', id);
  }

  return toEntityDetailDto(entity);
}
```

**Effort**: 🟢 Small | 🟡 Medium | 🔴 Large

---

## Tenant Context Analysis

### Current Pattern

```typescript
// Example of current tenant filtering (or lack thereof)
// [PASTE CODE SAMPLE]
```

### Issues Found

- [ ] **No Tenant Parameter**: Methods don't accept `tenantId` parameter
- [ ] **Missing Tenant Filter**: Queries don't filter by `tenant_id`
- [ ] **Cross-Tenant Risk**: Potential to access other tenant's data
- [ ] **Inconsistent Tenant Usage**: Some methods filter, others don't
- [ ] **No Tenant Verification**: Update/delete don't verify tenant ownership

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

// List with tenant filtering
async findAll(
  tenantId: number,
  filter?: FilterDto,
  page = 1,
  limit = 10
): Promise<{ data: EntityDto[]; total: number }> {
  const queryBuilder = this.repository
    .createQueryBuilder('e')
    .where('e.tenant_id = :tenantId', { tenantId })  // ✅ Always filter
    .andWhere('e.is_active = true');

  // Additional filters...

  const [entities, total] = await queryBuilder.getManyAndCount();
  return { data: toEntityDtoArray(entities), total };
}

// Update with tenant verification
async update(
  tenantId: number,
  id: number,
  data: UpdateDto
): Promise<EntityDto> {
  const entity = await this.repository.findOne({
    where: { id, tenant_id: tenantId }  // ✅ Verify tenant ownership
  });

  if (!entity) {
    throw new NotFoundError('Entity', id);
  }

  // Update logic...
}
```

**Effort**: 🟢 Small | 🟡 Medium | 🔴 Large

---

## Query Pattern Analysis

### Current Pattern

```typescript
// Example of current query patterns
// [PASTE CODE SAMPLE]
```

### Issues Found

- [ ] **Uses find() Instead of QueryBuilder**: Simple `find()` used for complex queries
- [ ] **Selects All Fields**: Uses `SELECT *` implicitly
- [ ] **Missing Joins**: Relations not loaded efficiently
- [ ] **No Pagination**: List methods don't paginate
- [ ] **Hardcoded Sorting**: No dynamic sorting support
- [ ] **SQL Injection Risk**: String concatenation in queries (very rare with TypeORM)

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
async findAll(
  tenantId: number,
  filter?: FilterDto,
  page = 1,
  limit = 10
): Promise<{ data: EntityDto[]; total: number }> {
  const queryBuilder = this.repository
    .createQueryBuilder('e')
    .leftJoinAndSelect('e.relatedEntity', 'r')  // ✅ Load relations
    .select([  // ✅ Select specific fields
      'e.id',
      'e.name',
      'e.status',
      'r.id',
      'r.name',
    ])
    .where('e.tenant_id = :tenantId', { tenantId })
    .andWhere('e.is_active = true');

  // Dynamic filters
  if (filter?.status) {
    queryBuilder.andWhere('e.status = :status', { status: filter.status });
  }

  if (filter?.search) {
    queryBuilder.andWhere(
      '(e.name ILIKE :search OR e.code ILIKE :search)',
      { search: `%${filter.search}%` }
    );
  }

  // Dynamic sorting
  const sortField = filter?.sort_by || 'created_at';
  const sortOrder = filter?.sort_order || 'DESC';
  queryBuilder.orderBy(`e.${sortField}`, sortOrder);

  // Pagination
  queryBuilder.skip((page - 1) * limit).take(limit);

  const [entities, total] = await queryBuilder.getManyAndCount();

  return {
    data: toEntityDtoArray(entities),
    total,
  };
}
```

**Effort**: 🟢 Small | 🟡 Medium | 🔴 Large

---

## Business Logic Analysis

### Current Business Rules

[LIST BUSINESS RULES IMPLEMENTED IN THIS SERVICE]

Example:

- Cannot delete entity if it has active dependencies
- Status transitions: DRAFT → PENDING → APPROVED
- Only ADMIN role can perform certain operations

### Issues Found

- [ ] **No Business Validation**: Missing validation of business rules
- [ ] **No State Validation**: Doesn't check entity state before operations
- [ ] **No Dependency Checks**: Doesn't verify foreign key constraints
- [ ] **No Transaction Management**: Multi-step operations not wrapped in transactions
- [ ] **Unclear Business Rules**: Business logic not documented

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { BusinessRuleError } from '../errors/business.error';
import { AppDataSource } from '../config/database.config';

async delete(tenantId: number, id: number): Promise<void> {
  const entity = await this.findById(tenantId, id);

  // Business rule: Check for active dependencies
  const activeDependencies = await this.dependencyRepository.count({
    where: {
      entity_id: id,
      status: 'ACTIVE',
    },
  });

  if (activeDependencies > 0) {
    throw BusinessRuleError.cannotDelete(
      'Entity',
      'has active dependencies',
      { activeDependencies }
    );
  }

  // Soft delete
  entity.is_active = false;
  await this.repository.save(entity);
}

async approve(tenantId: number, id: number): Promise<EntityDto> {
  const entity = await this.findById(tenantId, id);

  // Business rule: Can only approve PENDING entities
  if (entity.status !== 'PENDING') {
    throw BusinessRuleError.invalidState(
      'Entity',
      entity.status,
      'approve',
      ['PENDING']
    );
  }

  entity.status = 'APPROVED';
  entity.approved_at = new Date();

  const saved = await this.repository.save(entity);
  return toEntityDto(saved);
}

async complexOperation(tenantId: number, data: any): Promise<void> {
  // Business rule: Use transaction for multi-step operations
  await AppDataSource.transaction(async (manager) => {
    // Step 1
    const entity1 = manager.create(Entity1, { ... });
    await manager.save(entity1);

    // Step 2
    const entity2 = manager.create(Entity2, { entity1_id: entity1.id });
    await manager.save(entity2);

    // All or nothing
  });
}
```

**Effort**: 🟢 Small | 🟡 Medium | 🔴 Large

---

## Logging Analysis

### Current Logging

```typescript
// Example of current logging (or lack thereof)
// [PASTE CODE SAMPLE]
```

### Issues Found

- [ ] **No Logging**: Service has no logging at all
- [ ] **Inconsistent Logging**: Some methods log, others don't
- [ ] **Missing Context**: Logs don't include service/method context
- [ ] **No Error Logging**: Errors not logged before re-throwing
- [ ] **Excessive Logging**: Logs too much (debug info in production)

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import Logger from '../utils/logger';

async create(tenantId: number, data: CreateDto): Promise<EntityDto> {
  try {
    Logger.info('Creating entity', {
      tenantId,
      data,
      context: '[ServiceName].create',
    });

    // ... create logic

    Logger.info('Entity created successfully', {
      tenantId,
      entityId: saved.id,
      context: '[ServiceName].create',
    });

    return toEntityDto(saved);
  } catch (error) {
    Logger.error('Error creating entity', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      data,
      context: '[ServiceName].create',
    });
    throw error;
  }
}
```

**Effort**: 🟢 Small | 🟡 Medium | 🔴 Large

---

## Testing Analysis

### Current Test Coverage

- **Test File Exists**: ✅ Yes | ❌ No
- **Test Count**: [NUMBER] tests
- **Coverage**: [PERCENTAGE]%
- **Tests Run**: ✅ Passing | ❌ Failing | ⏭️ Skipped

### Issues Found

- [ ] **No Test File**: Service has no test file
- [ ] **Low Coverage**: < 70% coverage
- [ ] **Missing Happy Path Tests**: Successful operations not tested
- [ ] **Missing Error Tests**: Error handling not tested
- [ ] **No Tenant Isolation Tests**: Cross-tenant access not tested
- [ ] **No Business Rule Tests**: Business logic not validated

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
// [service-name].service.spec.ts
import { [ServiceName]Service } from './[service-name].service';
import { AppDataSource } from '../config/database.config';
import { NotFoundError, ConflictError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';

describe('[ServiceName]Service', () => {
  let service: [ServiceName]Service;
  const TENANT_ID = 1;
  const OTHER_TENANT_ID = 2;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    service = new [ServiceName]Service();
    // Clear test data
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('create', () => {
    it('should create entity successfully', async () => {
      const data = { name: 'Test Entity' };
      const result = await service.create(TENANT_ID, data);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Entity');
      expect(result.tenant_id).toBe(TENANT_ID);
    });

    it('should throw ConflictError if duplicate', async () => {
      const data = { name: 'Test Entity' };
      await service.create(TENANT_ID, data);

      await expect(
        service.create(TENANT_ID, data)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('findById', () => {
    it('should return entity by ID', async () => {
      const created = await service.create(TENANT_ID, { name: 'Test' });
      const found = await service.findById(TENANT_ID, created.id);

      expect(found.id).toBe(created.id);
      expect(found.name).toBe('Test');
    });

    it('should throw NotFoundError if not found', async () => {
      await expect(
        service.findById(TENANT_ID, 99999)
      ).rejects.toThrow(NotFoundError);
    });

    it('should not return entity from other tenant', async () => {
      const created = await service.create(TENANT_ID, { name: 'Test' });

      await expect(
        service.findById(OTHER_TENANT_ID, created.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete entity successfully', async () => {
      const created = await service.create(TENANT_ID, { name: 'Test' });
      await service.delete(TENANT_ID, created.id);

      await expect(
        service.findById(TENANT_ID, created.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if entity has dependencies', async () => {
      const created = await service.create(TENANT_ID, { name: 'Test' });
      // Create dependency...

      await expect(
        service.delete(TENANT_ID, created.id)
      ).rejects.toThrow(BusinessRuleError);
    });
  });
});
```

**Effort**: 🟢 Small | 🟡 Medium | 🔴 Large

---

## Summary

### Critical Issues (Fix First) 🔴

1. [Critical issue 1]
2. [Critical issue 2]

### Important Issues (Fix Next) 🟡

1. [Important issue 1]
2. [Important issue 2]

### Nice to Have (Optional) 🟢

1. [Nice to have 1]
2. [Nice to have 2]

---

## Action Plan

### Step 1: Error Handling

- [ ] Import custom error classes
- [ ] Replace all `throw new Error(...)` with appropriate error classes
- [ ] Add error logging
- [ ] Test error scenarios

### Step 2: Return Types

- [ ] Import DTO types and transformation functions
- [ ] Update method return types to DTOs
- [ ] Add DTO transformations
- [ ] Update controller to handle new types

### Step 3: Tenant Context

- [ ] Add `tenantId` parameter to all methods
- [ ] Add tenant filtering to all queries
- [ ] Test tenant isolation
- [ ] Update controller to pass tenantId

### Step 4: Query Optimization

- [ ] Convert to QueryBuilder where appropriate
- [ ] Add pagination
- [ ] Add dynamic filtering/sorting
- [ ] Select specific fields

### Step 5: Business Logic

- [ ] Document business rules
- [ ] Add business validation
- [ ] Add transaction management
- [ ] Test business rule enforcement

### Step 6: Logging

- [ ] Add success logging (info level)
- [ ] Add error logging (error level)
- [ ] Include context in all logs
- [ ] Test log output

### Step 7: Testing

- [ ] Create test file (if missing)
- [ ] Add happy path tests
- [ ] Add error handling tests
- [ ] Add tenant isolation tests
- [ ] Add business rule tests
- [ ] Achieve 70%+ coverage

---

## Estimated Total Effort

**Overall Complexity**: 🟢 Small (< 2 hours) | 🟡 Medium (2-4 hours) | 🔴 Large (> 4 hours)

**Recommended Approach**:

1. Start with error handling (foundation)
2. Add tenant context (security critical)
3. Fix return types (consistency)
4. Optimize queries (performance)
5. Add tests (confidence)

---

## Sign-off

**Audit Complete**: [DATE]  
**Issues Fixed**: [COUNT] / [TOTAL]  
**Tests Added**: ✅ Yes | ❌ No  
**Test Coverage**: [PERCENTAGE]%  
**All Tests Passing**: ✅ Yes | ❌ No  
**Ready for Production**: ✅ Yes | ❌ No

---

**Next Service**: [Next service to audit]
