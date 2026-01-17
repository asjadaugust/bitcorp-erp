# Service Audit: Equipment Service

**File**: `backend/src/services/equipment.service.ts`  
**Date**: January 17, 2026  
**Audited By**: OpenCode Agent  
**Status**: ✅ Complete (Baseline Service)

---

## Overview

- **Lines of Code**: 471
- **Public Methods**: 14
- **Has Tests**: ❌ No (`equipment.service.spec.ts` does not exist)
- **Test Coverage**: 0%
- **Complexity**: 🔴 Complex (many methods, business logic)

---

## Error Handling Analysis

### Current Pattern

```typescript
// Line 144 - Generic Error
if (!equipment) {
  throw new Error('Equipment not found');
}

// Line 181 - Generic Error
if (existing) {
  throw new Error('Equipment code already exists');
}

// Line 242 - Generic Error
if (existing && existing.id !== id) {
  throw new Error('Equipment code already exists');
}

// Line 304 - Generic Error with wrapper
throw new Error('Failed to delete equipment');
```

### Issues Found

- [x] **Generic Errors**: Uses `throw new Error(...)` instead of custom error classes (11 occurrences)
- [x] **Missing Error Codes**: No machine-readable error codes
- [ ] **English Messages**: All messages are in English (acceptable for this project)
- [x] **No HTTP Status**: Generic errors don't carry HTTP status codes
- [x] **Error Logging**: ✅ **GOOD** - Has comprehensive error logging with context
- [x] **Re-throws Errors**: ✅ **GOOD** - Catches, logs, then re-throws

### Specific Errors to Fix

| Line                    | Current                                            | Should Be                                                                     |
| ----------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| 144, 235, 315, 342, 357 | `throw new Error('Equipment not found')`           | `throw new NotFoundError('Equipment', id)`                                    |
| 181, 242                | `throw new Error('Equipment code already exists')` | `throw new ConflictError('Equipment code already exists', { codigo_equipo })` |
| 132, 304                | `throw new Error('Failed to...')`                  | Keep logged error, use specific error classes                                 |

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { NotFoundError, ConflictError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';

async findById(id: number): Promise<EquipmentDetailDto> {
  try {
    const equipment = await this.repository.findOne({
      where: { id },
      relations: ['provider'],
    });

    if (!equipment) {
      throw new NotFoundError('Equipment', id);  // ✅ Custom error
    }

    return toEquipmentDetailDto(equipment);
  } catch (error) {
    Logger.error('Error finding equipment by ID', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      id,
      context: 'EquipmentService.findById',
    });
    throw error;
  }
}

async create(data: CreateEquipmentDto): Promise<EquipmentDetailDto> {
  try {
    if (data.codigo_equipo) {
      const existing = await this.findByCode(data.codigo_equipo);
      if (existing) {
        throw new ConflictError(  // ✅ Custom error with context
          `Equipment code '${data.codigo_equipo}' already exists`,
          { codigo_equipo: data.codigo_equipo }
        );
      }
    }
    // ... rest of create logic
  } catch (error) {
    Logger.error('Error creating equipment', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      data,
      context: 'EquipmentService.create',
    });
    throw error;
  }
}
```

**Effort**: 🟡 Medium (30 minutes)

---

## Return Type Analysis

### Current Pattern

```typescript
// ✅ GOOD: Returns DTOs
async findAll(...): Promise<{ data: EquipmentListDto[]; total: number }>
async findById(id: number): Promise<EquipmentDetailDto>
async create(data: CreateEquipmentDto): Promise<EquipmentDetailDto>
async update(id: number, data: UpdateEquipmentDto): Promise<EquipmentDetailDto>
async getStatistics(): Promise<EquipmentStatsDto>

// ⚠️ MIXED: Returns raw entity
async findByCode(codigo: string): Promise<Equipment | null>
```

### Issues Found

- [ ] **Returns Raw Entities**: Only 1 method (`findByCode`) returns raw entity, but it's intentional (internal use)
- [ ] **Inconsistent Return Types**: Mostly consistent
- [ ] **Missing Transformations**: ✅ **GOOD** - Uses transformation functions consistently
- [ ] **Missing DTO Imports**: ✅ **GOOD** - All DTOs imported correctly
- [ ] **No Pagination Shape**: ✅ **GOOD** - Uses `{ data, total }` pattern

### Specific Observations

✅ **EXCELLENT**: Uses transformation functions consistently:

- `toEquipmentListDtoArray(equipment)` - Line 120
- `toEquipmentDetailDto(equipment)` - Line 147, 215, 281, 322, etc.
- `toEquipmentStatsDto(result)` - Line 405

⚠️ **Minor Issue**: `findByCode` returns raw entity (Line 159), but this is acceptable since it's an internal helper method.

### Recommendations

```typescript
// Current findByCode (internal use, OK to keep as is)
async findByCode(codigo: string): Promise<Equipment | null> {
  return await this.repository.findOne({
    where: { codigo_equipo: codigo },
  });
}

// Alternative: Make it return DTO if used externally
async findByCodeDto(codigo: string): Promise<EquipmentDetailDto | null> {
  const equipment = await this.repository.findOne({
    where: { codigo_equipo: codigo },
    relations: ['provider'],
  });
  return equipment ? toEquipmentDetailDto(equipment) : null;
}
```

**Effort**: 🟢 Small (<15 minutes, mostly done correctly)

---

## Tenant Context Analysis

### Current Pattern

```typescript
// ❌ NO TENANT FILTERING
async findAll(filter?: EquipmentFilter, page = 1, limit = 10) {
  const queryBuilder = this.repository
    .createQueryBuilder('e')
    .leftJoinAndSelect('e.provider', 'p')
    .where('e.is_active = :isActive', { isActive: filter?.isActive ?? true });
  // ... NO tenant_id filter!
}

// ❌ NO TENANT PARAMETER
async findById(id: number): Promise<EquipmentDetailDto> {
  const equipment = await this.repository.findOne({
    where: { id },  // Missing tenant_id!
    relations: ['provider'],
  });
}
```

### Issues Found

- [x] **No Tenant Parameter**: ZERO methods accept `tenantId` parameter
- [x] **Missing Tenant Filter**: NO queries filter by `tenant_id`
- [x] **Cross-Tenant Risk**: ⚠️ **CRITICAL SECURITY ISSUE** - Can access other tenant's equipment
- [x] **Inconsistent Tenant Usage**: Consistent (consistently missing!)
- [x] **No Tenant Verification**: Update/delete don't verify tenant ownership

### CRITICAL SECURITY ISSUES

**This service allows cross-tenant data access!** Any user can:

- View equipment from other companies
- Modify equipment from other companies
- Delete equipment from other companies

This is a **BLOCKER** for production deployment.

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

// List with tenant filtering
async findAll(
  tenantId: number,  // ✅ Add tenant parameter
  filter?: EquipmentFilter,
  page = 1,
  limit = 10
): Promise<{ data: EquipmentListDto[]; total: number }> {
  const queryBuilder = this.repository
    .createQueryBuilder('e')
    .leftJoinAndSelect('e.provider', 'p')
    .where('e.tenant_id = :tenantId', { tenantId })  // ✅ Tenant filter
    .andWhere('e.is_active = :isActive', { isActive: filter?.isActive ?? true });

  // ... rest of filtering

  const [equipment, total] = await queryBuilder.getManyAndCount();

  return {
    data: toEquipmentListDtoArray(equipment),
    total,
  };
}

// Find by ID with tenant verification
async findById(tenantId: number, id: number): Promise<EquipmentDetailDto> {
  try {
    const equipment = await this.repository.findOne({
      where: { id, tenant_id: tenantId },  // ✅ Verify tenant ownership
      relations: ['provider'],
    });

    if (!equipment) {
      throw new NotFoundError('Equipment', id);
    }

    return toEquipmentDetailDto(equipment);
  } catch (error) {
    Logger.error('Error finding equipment by ID', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,  // ✅ Log tenant context
      id,
      context: 'EquipmentService.findById',
    });
    throw error;
  }
}

// Create with tenant assignment
async create(
  tenantId: number,  // ✅ Add tenant parameter
  data: CreateEquipmentDto
): Promise<EquipmentDetailDto> {
  try {
    // Check if codigo already exists FOR THIS TENANT
    if (data.codigo_equipo) {
      const existing = await this.repository.findOne({
        where: {
          codigo_equipo: data.codigo_equipo,
          tenant_id: tenantId  // ✅ Scope to tenant
        },
      });

      if (existing) {
        throw new ConflictError(
          `Equipment code '${data.codigo_equipo}' already exists`,
          { codigo_equipo: data.codigo_equipo }
        );
      }
    }

    const equipment = this.repository.create({
      ...data,
      tenant_id: tenantId,  // ✅ Assign tenant
      is_active: true,
    });

    const saved = await this.repository.save(equipment);

    // ... rest of logic
  } catch (error) {
    // ... error handling
  }
}

// Update with tenant verification
async update(
  tenantId: number,  // ✅ Add tenant parameter
  id: number,
  data: UpdateEquipmentDto
): Promise<EquipmentDetailDto> {
  try {
    const equipment = await this.repository.findOne({
      where: { id, tenant_id: tenantId },  // ✅ Verify ownership
      relations: ['provider'],
    });

    if (!equipment) {
      throw new NotFoundError('Equipment', id);
    }

    // If updating codigo, check it doesn't exist FOR THIS TENANT
    if (data.codigo_equipo && data.codigo_equipo !== equipment.codigo_equipo) {
      const existing = await this.repository.findOne({
        where: {
          codigo_equipo: data.codigo_equipo,
          tenant_id: tenantId  // ✅ Scope to tenant
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictError(
          `Equipment code '${data.codigo_equipo}' already exists`
        );
      }
    }

    // ... rest of update logic
  } catch (error) {
    // ... error handling
  }
}

// Delete with tenant verification
async delete(tenantId: number, id: number): Promise<void> {
  try {
    const equipment = await this.repository.findOne({
      where: { id, tenant_id: tenantId },  // ✅ Verify ownership
    });

    if (!equipment) {
      throw new NotFoundError('Equipment', id);
    }

    await this.repository.update(id, { is_active: false });
  } catch (error) {
    Logger.error('Error deleting equipment', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,  // ✅ Log tenant context
      id,
      context: 'EquipmentService.delete',
    });
    throw error;
  }
}
```

**Effort**: 🔴 Large (2-3 hours) - Must update ALL 14 methods + controller integration

---

## Query Pattern Analysis

### Current Pattern

```typescript
// ✅ EXCELLENT: Uses QueryBuilder
const queryBuilder = this.repository
  .createQueryBuilder('e')
  .leftJoinAndSelect('e.provider', 'p')
  .where('e.is_active = :isActive', { isActive: filter?.isActive ?? true });

// ✅ GOOD: Dynamic filters
if (filter?.estado) {
  queryBuilder.andWhere('e.estado = :estado', { estado: filter.estado });
}

// ✅ GOOD: Parameterized queries (SQL injection safe)
if (filter?.search) {
  queryBuilder.andWhere('(e.codigo_equipo ILIKE :search OR e.marca ILIKE :search ...)', {
    search: `%${filter.search}%`,
  });
}

// ✅ GOOD: Dynamic sorting with whitelist
const validSortFields: Record<string, string> = {
  codigo_equipo: 'e.codigo_equipo',
  categoria: 'e.categoria',
  // ... etc
};

// ✅ GOOD: Pagination
queryBuilder.skip((page - 1) * limit).take(limit);
```

### Issues Found

- [ ] **Uses find() Instead of QueryBuilder**: ✅ **GOOD** - Uses QueryBuilder consistently
- [ ] **Selects All Fields**: ⚠️ **Minor** - Implicit `SELECT *` (could optimize)
- [ ] **Missing Joins**: ✅ **GOOD** - Uses `leftJoinAndSelect` appropriately
- [ ] **No Pagination**: ✅ **GOOD** - Implements pagination
- [ ] **Hardcoded Sorting**: ✅ **GOOD** - Dynamic sorting with whitelist
- [ ] **SQL Injection Risk**: ✅ **SAFE** - Uses parameterized queries

### Recommendations

**Optional Optimization**: Select specific fields for list view:

```typescript
// Current (implicit SELECT *)
.leftJoinAndSelect('e.provider', 'p')

// Optimized (explicit fields)
.leftJoinAndSelect('e.provider', 'p')
.select([
  'e.id',
  'e.codigo_equipo',
  'e.categoria',
  'e.marca',
  'e.modelo',
  'e.placa',
  'e.estado',
  'e.created_at',
  'p.id',
  'p.razon_social',
])
```

**Effort**: 🟢 Small (<30 minutes, optional optimization)

---

## Business Logic Analysis

### Current Business Rules

1. **Uniqueness**: Equipment code (`codigo_equipo`) must be unique
2. **Soft Delete**: Equipment is marked `is_active = false` instead of hard delete
3. **Default State**: New equipment gets `estado = 'DISPONIBLE'`
4. **State Filtering**: Can filter by `estado`, `categoria`, `tipo_equipo_id`, `tipo_proveedor`
5. **Statistics**: Groups equipment by `estado` for dashboard

### Issues Found

- [ ] **No Business Validation**: ⚠️ Missing validation for:
  - Cannot delete equipment if it has active contracts
  - Cannot change status to 'EN_USO' without assignment
  - Cannot transfer equipment without target project validation
- [ ] **No State Validation**: ⚠️ No validation for state transitions
- [ ] **No Dependency Checks**: ⚠️ Delete doesn't check for dependencies
- [ ] **No Transaction Management**: ⚠️ Multi-step operations not wrapped
- [ ] **Business Rules Documented**: ❌ Not documented in code

### Recommendations

```typescript
// ✅ RECOMMENDED: Business rule validation
import { BusinessRuleError } from '../errors/business.error';

async delete(tenantId: number, id: number): Promise<void> {
  try {
    const equipment = await this.repository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!equipment) {
      throw new NotFoundError('Equipment', id);
    }

    // Business rule: Cannot delete equipment with active contracts
    const activeContracts = await AppDataSource
      .getRepository('Contract')
      .count({
        where: {
          equipment_id: id,
          status: In(['ACTIVE', 'APPROVED']),
        },
      });

    if (activeContracts > 0) {
      throw BusinessRuleError.cannotDelete(
        'Equipment',
        'has active contracts',
        { activeContracts }
      );
    }

    // Soft delete
    await this.repository.update(id, { is_active: false });

    Logger.info('Equipment deleted (soft)', {
      tenantId,
      equipmentId: id,
      context: 'EquipmentService.delete',
    });
  } catch (error) {
    Logger.error('Error deleting equipment', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'EquipmentService.delete',
    });
    throw error;
  }
}

async updateStatus(
  tenantId: number,
  id: number,
  nuevoEstado: string
): Promise<EquipmentDetailDto> {
  const equipment = await this.findById(tenantId, id);

  // Business rule: Validate state transitions
  const validTransitions: Record<string, string[]> = {
    DISPONIBLE: ['EN_USO', 'MANTENIMIENTO', 'RETIRADO'],
    EN_USO: ['DISPONIBLE', 'MANTENIMIENTO'],
    MANTENIMIENTO: ['DISPONIBLE', 'RETIRADO'],
    RETIRADO: [], // Cannot transition from RETIRADO
  };

  const allowedStates = validTransitions[equipment.estado] || [];

  if (!allowedStates.includes(nuevoEstado)) {
    throw BusinessRuleError.invalidState(
      'Equipment',
      equipment.estado,
      `change status to ${nuevoEstado}`,
      allowedStates
    );
  }

  equipment.estado = nuevoEstado;
  const saved = await this.repository.save(equipment);

  return toEquipmentDetailDto(saved);
}

async transferEquipment(
  tenantId: number,
  id: number,
  targetProjectId: number
): Promise<void> {
  // Business rule: Use transaction for multi-step operation
  await AppDataSource.transaction(async (manager) => {
    // 1. Verify equipment ownership
    const equipment = await manager.findOne(Equipment, {
      where: { id, tenant_id: tenantId },
    });

    if (!equipment) {
      throw new NotFoundError('Equipment', id);
    }

    // 2. Verify equipment not in use
    if (equipment.estado === 'EN_USO') {
      throw BusinessRuleError.resourceInUse(
        'Equipment',
        id,
        `currently assigned to another project`
      );
    }

    // 3. Verify target project exists
    const targetProject = await manager.findOne(Project, {
      where: { id: targetProjectId, tenant_id: tenantId },
    });

    if (!targetProject) {
      throw new NotFoundError('Project', targetProjectId);
    }

    // 4. Create transfer record
    const transfer = manager.create(EquipmentTransfer, {
      equipment_id: id,
      from_project_id: equipment.current_project_id,
      to_project_id: targetProjectId,
      transfer_date: new Date(),
      tenant_id: tenantId,
    });

    await manager.save(transfer);

    // 5. Update equipment
    equipment.current_project_id = targetProjectId;
    equipment.estado = 'EN_USO';
    await manager.save(equipment);

    Logger.info('Equipment transferred', {
      tenantId,
      equipmentId: id,
      targetProjectId,
      context: 'EquipmentService.transferEquipment',
    });
  });
}
```

**Effort**: 🔴 Large (3-4 hours) - Add business rules + transaction management

---

## Logging Analysis

### Current Logging

✅ **EXCELLENT**: This service is a **model for logging**:

```typescript
Logger.error('Error finding equipment', {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  filter,
  page,
  limit,
  context: 'EquipmentService.findAll',
});

Logger.debug('Equipment assignment to project requested', {
  equipmentId: id,
  projectData: data,
  context: 'EquipmentService.assignToProject',
});
```

### Issues Found

- [ ] **No Logging**: ✅ **GOOD** - Has logging
- [ ] **Inconsistent Logging**: ✅ **GOOD** - Consistent throughout
- [ ] **Missing Context**: ✅ **GOOD** - Always includes `context: 'EquipmentService.method'`
- [ ] **No Error Logging**: ✅ **GOOD** - Logs all errors
- [ ] **Excessive Logging**: ✅ **GOOD** - Uses appropriate levels (error, debug)

### Recommendations

**Only Minor Enhancement**: Add success logging for mutations:

```typescript
async create(tenantId: number, data: CreateEquipmentDto): Promise<EquipmentDetailDto> {
  try {
    // ... create logic
    const saved = await this.repository.save(equipment);

    // ✅ Add success logging
    Logger.info('Equipment created', {
      tenantId,
      equipmentId: saved.id,
      codigo_equipo: saved.codigo_equipo,
      context: 'EquipmentService.create',
    });

    return toEquipmentDetailDto(saved);
  } catch (error) {
    // ... error logging
  }
}
```

**Effort**: 🟢 Small (15 minutes, nice to have)

---

## Testing Analysis

### Current Test Coverage

- **Test File Exists**: ❌ No (`equipment.service.spec.ts` does not exist)
- **Test Count**: 0 tests
- **Coverage**: 0%
- **Tests Run**: N/A

### Issues Found

- [x] **No Test File**: Service has no test file
- [x] **Low Coverage**: 0% coverage (target: 70%+)
- [x] **Missing Happy Path Tests**: No tests at all
- [x] **Missing Error Tests**: No error testing
- [x] **No Tenant Isolation Tests**: No tenant testing (critical!)
- [x] **No Business Rule Tests**: No business logic tests

### Recommendations

```typescript
// ✅ RECOMMENDED: equipment.service.spec.ts
import { EquipmentService } from './equipment.service';
import { AppDataSource } from '../config/database.config';
import { Equipment } from '../models/equipment.model';
import { NotFoundError, ConflictError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let equipmentRepo: any;
  const TENANT_ID = 1;
  const OTHER_TENANT_ID = 2;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    service = new EquipmentService();
    equipmentRepo = AppDataSource.getRepository(Equipment);

    // Clear test data
    await equipmentRepo.delete({});
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('create', () => {
    it('should create equipment successfully', async () => {
      const data = {
        codigo_equipo: 'EXC-001',
        categoria: 'EXCAVADORA',
        marca: 'Caterpillar',
        modelo: '320D',
      };

      const result = await service.create(TENANT_ID, data);

      expect(result.id).toBeDefined();
      expect(result.codigo_equipo).toBe('EXC-001');
      expect(result.estado).toBe('DISPONIBLE');
    });

    it('should throw ConflictError if codigo exists', async () => {
      const data = {
        codigo_equipo: 'EXC-001',
        categoria: 'EXCAVADORA',
        marca: 'Caterpillar',
        modelo: '320D',
      };

      await service.create(TENANT_ID, data);

      await expect(service.create(TENANT_ID, data)).rejects.toThrow(ConflictError);
    });

    it('should allow same codigo for different tenants', async () => {
      const data = {
        codigo_equipo: 'EXC-001',
        categoria: 'EXCAVADORA',
        marca: 'Caterpillar',
        modelo: '320D',
      };

      await service.create(TENANT_ID, data);

      // Should not throw - different tenant
      const result2 = await service.create(OTHER_TENANT_ID, data);
      expect(result2.id).toBeDefined();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create test equipment for both tenants
      await service.create(TENANT_ID, {
        codigo_equipo: 'EXC-001',
        categoria: 'EXCAVADORA',
        estado: 'DISPONIBLE',
      });
      await service.create(TENANT_ID, {
        codigo_equipo: 'EXC-002',
        categoria: 'EXCAVADORA',
        estado: 'EN_USO',
      });
      await service.create(OTHER_TENANT_ID, {
        codigo_equipo: 'EXC-003',
        categoria: 'EXCAVADORA',
        estado: 'DISPONIBLE',
      });
    });

    it('should return paginated equipment for tenant', async () => {
      const result = await service.findAll(TENANT_ID, {}, 1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0].codigo_equipo).toMatch(/EXC-00[12]/);
    });

    it('should not return other tenant equipment', async () => {
      const result = await service.findAll(TENANT_ID, {}, 1, 10);

      const otherTenantEquipment = result.data.find((e) => e.codigo_equipo === 'EXC-003');
      expect(otherTenantEquipment).toBeUndefined();
    });

    it('should filter by estado', async () => {
      const result = await service.findAll(TENANT_ID, { estado: 'DISPONIBLE' }, 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].estado).toBe('DISPONIBLE');
    });

    it('should search by codigo', async () => {
      const result = await service.findAll(TENANT_ID, { search: 'EXC-001' }, 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].codigo_equipo).toBe('EXC-001');
    });
  });

  describe('findById', () => {
    it('should return equipment by ID', async () => {
      const created = await service.create(TENANT_ID, {
        codigo_equipo: 'EXC-001',
        categoria: 'EXCAVADORA',
      });

      const found = await service.findById(TENANT_ID, created.id);

      expect(found.id).toBe(created.id);
      expect(found.codigo_equipo).toBe('EXC-001');
    });

    it('should throw NotFoundError if not found', async () => {
      await expect(service.findById(TENANT_ID, 99999)).rejects.toThrow(NotFoundError);
    });

    it('should not return equipment from other tenant', async () => {
      const created = await service.create(TENANT_ID, {
        codigo_equipo: 'EXC-001',
        categoria: 'EXCAVADORA',
      });

      await expect(service.findById(OTHER_TENANT_ID, created.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update equipment successfully', async () => {
      const created = await service.create(TENANT_ID, {
        codigo_equipo: 'EXC-001',
        categoria: 'EXCAVADORA',
        marca: 'Caterpillar',
      });

      const updated = await service.update(TENANT_ID, created.id, {
        marca: 'Komatsu',
      });

      expect(updated.marca).toBe('Komatsu');
      expect(updated.codigo_equipo).toBe('EXC-001'); // Unchanged
    });

    it('should throw NotFoundError if not found', async () => {
      await expect(service.update(TENANT_ID, 99999, { marca: 'Test' })).rejects.toThrow(
        NotFoundError
      );
    });

    it('should not update equipment from other tenant', async () => {
      const created = await service.create(TENANT_ID, {
        codigo_equipo: 'EXC-001',
        categoria: 'EXCAVADORA',
      });

      await expect(service.update(OTHER_TENANT_ID, created.id, { marca: 'Test' })).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('delete', () => {
    it('should soft delete equipment', async () => {
      const created = await service.create(TENANT_ID, {
        codigo_equipo: 'EXC-001',
        categoria: 'EXCAVADORA',
      });

      await service.delete(TENANT_ID, created.id);

      // Should not appear in list (is_active = false)
      const result = await service.findAll(TENANT_ID, {}, 1, 10);
      expect(result.data).toHaveLength(0);

      // Should not be findable by ID
      await expect(service.findById(TENANT_ID, created.id)).rejects.toThrow(NotFoundError);
    });

    it('should throw error if equipment has active contracts', async () => {
      const created = await service.create(TENANT_ID, {
        codigo_equipo: 'EXC-001',
        categoria: 'EXCAVADORA',
      });

      // TODO: Create active contract for this equipment

      await expect(service.delete(TENANT_ID, created.id)).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('updateStatus', () => {
    it('should update equipment status', async () => {
      const created = await service.create(TENANT_ID, {
        codigo_equipo: 'EXC-001',
        categoria: 'EXCAVADORA',
      });

      const updated = await service.updateStatus(TENANT_ID, created.id, 'EN_USO');

      expect(updated.estado).toBe('EN_USO');
    });

    it('should validate state transitions', async () => {
      const created = await service.create(TENANT_ID, {
        codigo_equipo: 'EXC-001',
        categoria: 'EXCAVADORA',
      });

      // Mark as RETIRADO
      await service.updateStatus(TENANT_ID, created.id, 'RETIRADO');

      // Cannot transition from RETIRADO
      await expect(service.updateStatus(TENANT_ID, created.id, 'DISPONIBLE')).rejects.toThrow(
        BusinessRuleError
      );
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      await service.create(TENANT_ID, {
        codigo_equipo: 'EXC-001',
        estado: 'DISPONIBLE',
      });
      await service.create(TENANT_ID, {
        codigo_equipo: 'EXC-002',
        estado: 'DISPONIBLE',
      });
      await service.create(TENANT_ID, {
        codigo_equipo: 'EXC-003',
        estado: 'EN_USO',
      });
    });

    it('should return equipment statistics', async () => {
      const stats = await service.getStatistics(TENANT_ID);

      expect(stats.total).toBe(3);
      expect(stats.disponible).toBe(2);
      expect(stats.enUso).toBe(1);
      expect(stats.mantenimiento).toBe(0);
    });

    it('should only include tenant equipment in stats', async () => {
      await service.create(OTHER_TENANT_ID, {
        codigo_equipo: 'EXC-999',
        estado: 'DISPONIBLE',
      });

      const stats = await service.getStatistics(TENANT_ID);

      expect(stats.total).toBe(3); // Should not include other tenant
    });
  });
});
```

**Test Coverage Goal**: 80%+ (21 tests above cover most critical paths)

**Effort**: 🔴 Large (4-5 hours to write comprehensive tests)

---

## Summary

### Critical Issues (Fix First) 🔴

1. **🚨 SECURITY: No Tenant Context** - Service allows cross-tenant data access
   - Must add `tenantId` parameter to ALL methods
   - Must add `WHERE tenant_id = :tenantId` to ALL queries
   - **BLOCKER for production**

2. **No Tests** - 0% coverage, no tenant isolation verification
   - Must create test file with 70%+ coverage
   - Must test tenant isolation (critical security tests)

### Important Issues (Fix Next) 🟡

3. **Generic Errors** - Uses `Error` instead of custom error classes
   - Replace with `NotFoundError`, `ConflictError`, etc.
   - Add error codes for API consistency

4. **Missing Business Rules** - No validation for:
   - Delete with active contracts
   - State transitions
   - Transfer equipment

### Nice to Have (Optional) 🟢

5. **Query Optimization** - Could select specific fields for performance
6. **Success Logging** - Add info logging for mutations

---

## Action Plan

### Step 1: Tenant Context (CRITICAL - 2-3 hours)

- [ ] Add `tenantId` parameter to all 14 methods
- [ ] Add `WHERE tenant_id = :tenantId` to all queries
- [ ] Update method signatures and types
- [ ] Update controller to pass `tenantId`
- [ ] Test tenant isolation manually

### Step 2: Error Handling (30 minutes)

- [ ] Import `NotFoundError`, `ConflictError`
- [ ] Replace 11 occurrences of `throw new Error(...)`
- [ ] Keep existing error logging (already good)
- [ ] Test error responses

### Step 3: Business Rules (3-4 hours)

- [ ] Add delete validation (check active contracts)
- [ ] Add state transition validation
- [ ] Add transaction management for transfers
- [ ] Document business rules in code comments
- [ ] Test business rule enforcement

### Step 4: Testing (4-5 hours)

- [ ] Create `equipment.service.spec.ts`
- [ ] Write 21+ tests (from template above)
- [ ] Achieve 80%+ coverage
- [ ] Run `npm test` to verify
- [ ] Fix any failing tests

### Step 5: Optional Enhancements (1 hour)

- [ ] Add success logging for mutations
- [ ] Optimize query field selection
- [ ] Add JSDoc comments for public methods

---

## Estimated Total Effort

**Overall Complexity**: 🔴 Large (10-13 hours total)

**Priority Order**:

1. 🚨 Tenant Context (blocking issue)
2. 🔴 Testing (confidence in changes)
3. 🟡 Error Handling (consistency)
4. 🟡 Business Rules (correctness)
5. 🟢 Optional Enhancements

---

## Sign-off

**Audit Complete**: January 17, 2026  
**Issues Fixed**: 0 / 5  
**Tests Added**: ❌ No  
**Test Coverage**: 0%  
**All Tests Passing**: N/A  
**Ready for Production**: ❌ No (tenant context blocking issue)

---

**Next Service**: fuel.service.ts (simple CRUD, good starting point for fixes)

---

## Baseline Service Assessment

### What Makes This Service a Good Baseline?

✅ **Strengths**:

- Excellent logging with context
- Returns DTOs consistently
- Uses QueryBuilder for complex queries
- Implements pagination
- Dynamic filtering and sorting
- SQL injection safe (parameterized queries)

⚠️ **Weaknesses** (Common to Most Services):

- No tenant context (security issue)
- Generic errors (should use custom classes)
- No tests (0% coverage)
- Missing business rule validation

### Apply These Patterns to Other Services

**Copy These**:

- ✅ Logging pattern (with context, error/debug levels)
- ✅ DTO transformation (toEntityDto, toEntityListDtoArray)
- ✅ Pagination shape (`{ data, total }`)
- ✅ QueryBuilder usage (dynamic filters, sorting)
- ✅ Return type consistency

**Fix These**:

- ❌ Add tenant context everywhere
- ❌ Use custom error classes
- ❌ Add business validation
- ❌ Write comprehensive tests
