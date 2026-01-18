# Service Audit: operator-availability.service.ts

**File**: `backend/src/services/operator-availability.service.ts`  
**Date**: January 18, 2026  
**Audited By**: OpenCode Agent (Session 9)  
**Status**: ✅ Ready for Refactoring

---

## Overview

- **Lines of Code**: 180 lines
- **Public Methods**: 8
  - `findAll(filters?)` - List with pagination
  - `findById(id)` - Get single availability record
  - `findByOperator(operatorId, startDate?, endDate?)` - Get operator's availability
  - `findAvailableOperators(startDate, endDate)` - Find available operators in date range
  - `create(data)` - Create availability record
  - `update(id, data)` - Update availability record
  - `delete(id)` - Delete availability record
  - `bulkCreate(availabilities)` - Create multiple records
- **Has Tests**: ❌ No (`operator-availability.service.spec.ts` does not exist)
- **Test Coverage**: 0%
- **Complexity**: 🟡 Moderate (date range logic, overlap detection needed)

**Database Table**: `rrhh.disponibilidad_trabajador`  
**Tenant Column**: ❌ NO `tenant_id` column (same pattern as trabajador, documento_trabajador)

---

## Error Handling Analysis

### Current Pattern

```typescript
// ❌ Service does NOT throw any errors at all!
async findById(id: number): Promise<OperatorAvailabilityDto | null> {
  const entity = await this.repository.findOne({
    where: { id },
    relations: ['trabajador'],
  });
  return entity ? this.transformToDto(entity) : null;  // ❌ Returns null
}

async update(
  id: number,
  data: Partial<OperatorAvailability>
): Promise<OperatorAvailabilityDto | null> {
  await this.repository.update(id, data);
  return await this.findById(id);  // ❌ Returns null if not found
}

async delete(id: number): Promise<boolean> {
  const result = await this.repository.delete(id);
  return (result.affected || 0) > 0;  // ❌ Returns false instead of throwing error
}
```

### Issues Found

- [x] **No Error Handling**: Service has NO try/catch blocks at all (0 errors thrown)
- [x] **Returns Null**: `findById` and `update` return null instead of throwing NotFoundError
- [x] **Returns Boolean**: `delete` returns boolean instead of throwing error or returning void
- [x] **No Business Validation**: No overlap detection, no date validation
- [x] **Missing Error Logging**: No error logging whatsoever
- [x] **No Conflict Detection**: Can create overlapping availability periods without validation

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { NotFoundError, ConflictError } from '../errors/http.errors';
import Logger from '../utils/logger';

async findById(tenantId: number, id: number): Promise<OperatorAvailabilityDto> {
  try {
    Logger.info('Fetching operator availability', { tenantId, id, context: 'OperatorAvailabilityService.findById' });

    const entity = await this.repository.findOne({
      where: { id },
      // TODO: Add tenant_id filter when column exists
      relations: ['trabajador'],
    });

    if (!entity) {
      throw new NotFoundError('Operator availability', id, { tenantId });
    }

    Logger.info('Operator availability fetched', { tenantId, id, context: 'OperatorAvailabilityService.findById' });
    return this.transformToDto(entity);
  } catch (error) {
    Logger.error('Error fetching operator availability', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'OperatorAvailabilityService.findById',
    });
    throw error;
  }
}

async create(tenantId: number, data: Partial<OperatorAvailability>): Promise<OperatorAvailabilityDto> {
  try {
    Logger.info('Creating operator availability', { tenantId, data, context: 'OperatorAvailabilityService.create' });

    // Business validation: Date range check
    if (data.fechaInicio && data.fechaFin) {
      const startDate = new Date(data.fechaInicio);
      const endDate = new Date(data.fechaFin);

      if (startDate >= endDate) {
        throw new ConflictError('Date range invalid: fecha_inicio must be before fecha_fin', {
          fecha_inicio: data.fechaInicio,
          fecha_fin: data.fechaFin,
          tenantId,
        });
      }
    }

    // Business validation: Check for overlapping availability
    const overlaps = await this.repository
      .createQueryBuilder('avail')
      .where('avail.trabajadorId = :trabajadorId', { trabajadorId: data.trabajadorId })
      .andWhere('(avail.fechaInicio <= :fechaFin AND avail.fechaFin >= :fechaInicio)', {
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
      })
      .getCount();

    if (overlaps > 0) {
      throw new ConflictError('Availability period overlaps with existing record', {
        trabajador_id: data.trabajadorId,
        fecha_inicio: data.fechaInicio,
        fecha_fin: data.fechaFin,
        tenantId,
      });
    }

    const availability = this.repository.create(data);
    const saved = await this.repository.save(availability);

    // Reload with relations
    const entity = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['trabajador'],
    });

    Logger.info('Operator availability created', { tenantId, id: saved.id, context: 'OperatorAvailabilityService.create' });
    return this.transformToDto(entity!);
  } catch (error) {
    Logger.error('Error creating operator availability', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      data,
      context: 'OperatorAvailabilityService.create',
    });
    throw error;
  }
}

async delete(tenantId: number, id: number): Promise<void> {
  try {
    Logger.info('Deleting operator availability', { tenantId, id, context: 'OperatorAvailabilityService.delete' });

    // Verify existence (throws NotFoundError if not found)
    await this.findById(tenantId, id);

    await this.repository.delete(id);

    Logger.info('Operator availability deleted', { tenantId, id, context: 'OperatorAvailabilityService.delete' });
  } catch (error) {
    Logger.error('Error deleting operator availability', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'OperatorAvailabilityService.delete',
    });
    throw error;
  }
}
```

**Effort**: 🟡 Medium (3-4 hours - includes date validation and overlap detection)

---

## Return Type Analysis

### Current Pattern

```typescript
// ✅ Good: Service already uses DTOs!
async findAll(filters?: { ... }): Promise<{
  data: OperatorAvailabilityDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;  // ❌ Should be simplified
}> { ... }

async findById(id: number): Promise<OperatorAvailabilityDto | null> {
  // ❌ Returns null instead of throwing error
}

// ✅ Good: Already has transformation function
private transformToDto(entity: OperatorAvailability): OperatorAvailabilityDto {
  return {
    id: entity.id,
    trabajador_id: entity.trabajadorId,
    fecha_inicio: entity.fechaInicio,
    fecha_fin: entity.fechaFin,
    disponible: entity.disponible,
    motivo: entity.motivo || null,
    created_at: entity.createdAt,
    updated_at: entity.updatedAt,
    trabajador_nombre: entity.trabajador?.nombres,
    trabajador_apellido: entity.trabajador
      ? `${entity.trabajador.apellidoPaterno} ${entity.trabajador.apellidoMaterno || ''}`.trim()
      : undefined,
  };
}
```

### Issues Found

- [x] **Duplicate DTO Definition**: DTO defined in service file (lines 5-18) but also exists in `src/types/dto/operator-availability.dto.ts`
- [x] **Inconsistent Pagination Format**: Returns `{ data, page, limit, total, totalPages }` instead of simplified `{ data, total }`
- [x] **Nullable Return Types**: `findById` and `update` return `null` instead of throwing errors
- [x] **No DTO Import**: DTO not imported from dedicated file

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

// 1. Remove duplicate DTO definition from service file
// 2. Import DTO from dedicated file
import { OperatorAvailabilityDto } from '../types/dto/operator-availability.dto';

// 3. Simplify pagination format (consistent with employee/operator services)
async findAll(
  tenantId: number,
  filters?: {
    trabajadorId?: number;
    disponible?: boolean;
    fechaInicio?: Date;
    fechaFin?: Date;
  },
  page = 1,
  limit = 10
): Promise<{ data: OperatorAvailabilityDto[]; total: number }> {
  // ... query logic

  const [entities, total] = await query.getManyAndCount();

  return {
    data: entities.map((e) => this.transformToDto(e)),
    total,  // ✅ Controller calculates totalPages
  };
}

// 4. Change return type to non-nullable (throw error instead)
async findById(tenantId: number, id: number): Promise<OperatorAvailabilityDto> {
  // Throws NotFoundError instead of returning null
}

async update(
  tenantId: number,
  id: number,
  data: Partial<OperatorAvailability>
): Promise<OperatorAvailabilityDto> {
  // Throws NotFoundError instead of returning null
}
```

**Effort**: 🟢 Small (30 minutes - remove duplicate DTO, simplify pagination)

---

## Tenant Context Analysis

### Current Pattern

```typescript
// ❌ NO TENANT CONTEXT AT ALL
async findAll(filters?: { ... }): Promise<{ ... }> {
  // No tenantId parameter
  const query = this.repository.createQueryBuilder('avail');
  // No tenant filtering
}

async findById(id: number): Promise<OperatorAvailabilityDto | null> {
  // No tenantId parameter
  const entity = await this.repository.findOne({ where: { id } });
  // No tenant filtering
}

async create(data: Partial<OperatorAvailability>): Promise<OperatorAvailabilityDto> {
  // No tenantId parameter
  const availability = this.repository.create(data);
  // No tenant validation
}
```

### Issues Found

- [x] **No Tenant Parameter**: ALL 8 methods missing `tenantId` parameter
- [x] **Missing Tenant Filter**: Queries don't filter by tenant (table has NO tenant_id column)
- [x] **Cross-Tenant Risk**: HIGH - User could potentially access other tenant's availability data
- [x] **No Tenant Verification**: Update/delete don't verify tenant ownership

**Database Limitation**: The `rrhh.disponibilidad_trabajador` table does NOT have a `tenant_id` column. This is the same pattern as `rrhh.trabajador` and `rrhh.documento_trabajador`. Tenant filtering will require:

1. Adding TODO comments in service methods
2. Future database migration to add `tenant_id` column
3. Data backfill for existing records

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

async findAll(
  tenantId: number,  // ✅ Add parameter
  filters?: {
    trabajadorId?: number;
    disponible?: boolean;
    fechaInicio?: Date;
    fechaFin?: Date;
  },
  page = 1,
  limit = 10
): Promise<{ data: OperatorAvailabilityDto[]; total: number }> {
  try {
    Logger.info('Finding operator availabilities', {
      tenantId,
      filters,
      page,
      limit,
      context: 'OperatorAvailabilityService.findAll',
    });

    const query = this.repository
      .createQueryBuilder('avail')
      .leftJoinAndSelect('avail.trabajador', 'trabajador');
    // TODO: Add tenant_id filter when column exists in rrhh.disponibilidad_trabajador table
    // .where('avail.tenant_id = :tenantId', { tenantId })

    // Apply filters...

    Logger.info('Operator availabilities found', {
      tenantId,
      count: entities.length,
      total,
      context: 'OperatorAvailabilityService.findAll',
    });

    return { data: entities.map((e) => this.transformToDto(e)), total };
  } catch (error) {
    Logger.error('Error finding operator availabilities', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      filters,
      context: 'OperatorAvailabilityService.findAll',
    });
    throw error;
  }
}

async findById(tenantId: number, id: number): Promise<OperatorAvailabilityDto> {
  const entity = await this.repository.findOne({
    where: {
      id,
      // TODO: Add tenant_id filter when column exists
      // tenant_id: tenantId,
    },
    relations: ['trabajador'],
  });

  if (!entity) {
    throw new NotFoundError('Operator availability', id, { tenantId });
  }

  return this.transformToDto(entity);
}

async create(
  tenantId: number,  // ✅ Add parameter
  data: Partial<OperatorAvailability>
): Promise<OperatorAvailabilityDto> {
  // TODO: Set tenant_id when creating
  // data.tenant_id = tenantId;

  const availability = this.repository.create(data);
  const saved = await this.repository.save(availability);

  // ...
}
```

**Effort**: 🟢 Small (1 hour - add parameter, add TODO comments for filtering)

---

## Query Pattern Analysis

### Current Pattern

```typescript
// ✅ Good: Already uses QueryBuilder!
async findAll(filters?: { ... }): Promise<{ ... }> {
  const query = this.repository
    .createQueryBuilder('avail')
    .leftJoinAndSelect('avail.trabajador', 'trabajador');

  if (filters?.trabajadorId) {
    query.andWhere('avail.trabajadorId = :trabajadorId', {
      trabajadorId: filters.trabajadorId,
    });
  }

  if (filters?.disponible !== undefined) {
    query.andWhere('avail.disponible = :disponible', { disponible: filters.disponible });
  }

  // ✅ Good: Date range overlap check
  if (filters?.fechaInicio && filters?.fechaFin) {
    query.andWhere('(avail.fechaInicio <= :fechaFin AND avail.fechaFin >= :fechaInicio)', {
      fechaInicio: filters.fechaInicio,
      fechaFin: filters.fechaFin,
    });
  }

  const [entities, total] = await query
    .orderBy('avail.fechaInicio', 'DESC')
    .skip(skip)
    .take(limit)
    .getManyAndCount();
}

// ✅ Good: findByOperator uses QueryBuilder with date range
async findByOperator(
  operatorId: number,
  startDate?: Date,
  endDate?: Date
): Promise<OperatorAvailabilityDto[]> {
  const query = this.repository
    .createQueryBuilder('avail')
    .leftJoinAndSelect('avail.trabajador', 'trabajador')
    .where('avail.trabajadorId = :trabajadorId', { trabajadorId: operatorId });

  if (startDate && endDate) {
    query.andWhere('(avail.fechaInicio <= :endDate AND avail.fechaFin >= :startDate)', {
      startDate,
      endDate,
    });
  }

  const entities = await query.orderBy('avail.fechaInicio', 'ASC').getMany();
  return entities.map((e) => this.transformToDto(e));
}
```

### Issues Found

- [x] **No Pagination on findByOperator**: Returns all records (could be many for a single operator)
- [x] **No Pagination on findAvailableOperators**: Returns all available operators (could be large)
- [ ] **Query Pattern Generally Good**: Uses QueryBuilder, parameterized queries, left joins

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN (mostly already implemented!)

// 1. Add pagination to findByOperator
async findByOperator(
  tenantId: number,
  operatorId: number,
  startDate?: Date,
  endDate?: Date,
  page = 1,
  limit = 10
): Promise<{ data: OperatorAvailabilityDto[]; total: number }> {
  const query = this.repository
    .createQueryBuilder('avail')
    .leftJoinAndSelect('avail.trabajador', 'trabajador')
    .where('avail.trabajadorId = :trabajadorId', { trabajadorId: operatorId });
  // TODO: Add tenant_id filter

  if (startDate && endDate) {
    query.andWhere('(avail.fechaInicio <= :endDate AND avail.fechaFin >= :startDate)', {
      startDate,
      endDate,
    });
  }

  const [entities, total] = await query
    .orderBy('avail.fechaInicio', 'ASC')
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data: entities.map((e) => this.transformToDto(e)),
    total,
  };
}

// 2. Add pagination to findAvailableOperators
async findAvailableOperators(
  tenantId: number,
  startDate: Date,
  endDate: Date,
  page = 1,
  limit = 10
): Promise<{ data: OperatorAvailabilityDto[]; total: number }> {
  const [entities, total] = await this.repository
    .createQueryBuilder('avail')
    .leftJoinAndSelect('avail.trabajador', 'trabajador')
    .where('avail.disponible = :disponible', { disponible: true })
    .andWhere('(avail.fechaInicio <= :endDate AND avail.fechaFin >= :startDate)', {
      startDate,
      endDate,
    })
    // TODO: Add tenant_id filter
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data: entities.map((e) => this.transformToDto(e)),
    total,
  };
}
```

**Effort**: 🟢 Small (30 minutes - add pagination to 2 methods)

---

## Business Logic Analysis

### Current Business Rules

Based on the schema and service methods:

1. **Date Range Validity**: `fecha_inicio` must be before `fecha_fin`
2. **Overlap Detection**: Multiple availability periods for same operator should not overlap (NOT CURRENTLY ENFORCED)
3. **Disponible Flag**: Boolean indicating if operator is available (`true`) or unavailable (`false`)
4. **Motivo Field**: Optional reason for unavailability (e.g., "Vacaciones", "Licencia médica", "Capacitación")
5. **Trabajador Relation**: Availability must reference valid trabajador

### Issues Found

- [x] **No Date Validation**: Doesn't check if `fecha_inicio < fecha_fin`
- [x] **No Overlap Detection**: Can create overlapping availability periods without validation
- [x] **No Trabajador Verification**: Doesn't verify trabajador exists before creating availability
- [x] **No Business Logic in Update**: Update allows changing dates without overlap check
- [x] **No Soft Delete**: Delete is hard delete (could break historical records)

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { ConflictError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';

async create(
  tenantId: number,
  data: Partial<OperatorAvailability>
): Promise<OperatorAvailabilityDto> {
  try {
    Logger.info('Creating operator availability', {
      tenantId,
      data,
      context: 'OperatorAvailabilityService.create',
    });

    // Business rule 1: Date range validation
    if (data.fechaInicio && data.fechaFin) {
      const startDate = new Date(data.fechaInicio);
      const endDate = new Date(data.fechaFin);

      if (startDate >= endDate) {
        throw new ConflictError(
          'Date range invalid: fecha_inicio must be before fecha_fin',
          {
            fecha_inicio: data.fechaInicio,
            fecha_fin: data.fechaFin,
            tenantId,
          }
        );
      }

      // Business rule 2: No past dates (optional, depends on business requirements)
      // const today = new Date();
      // today.setHours(0, 0, 0, 0);
      // if (endDate < today) {
      //   throw new ConflictError('Cannot create availability in the past', {
      //     fecha_fin: data.fechaFin,
      //     tenantId,
      //   });
      // }
    }

    // Business rule 3: Check for overlapping availability
    const overlaps = await this.repository
      .createQueryBuilder('avail')
      .where('avail.trabajadorId = :trabajadorId', { trabajadorId: data.trabajadorId })
      .andWhere('avail.fechaInicio <= :fechaFin', { fechaFin: data.fechaFin })
      .andWhere('avail.fechaFin >= :fechaInicio', { fechaInicio: data.fechaInicio })
      .getCount();

    if (overlaps > 0) {
      throw new ConflictError(
        'Availability period overlaps with existing record',
        {
          trabajador_id: data.trabajadorId,
          fecha_inicio: data.fechaInicio,
          fecha_fin: data.fechaFin,
          existing_overlaps: overlaps,
          tenantId,
        }
      );
    }

    // Business rule 4: Verify trabajador exists (optional, DB foreign key handles this)
    // const trabajadorExists = await this.trabajadorRepository.findOne({
    //   where: { id: data.trabajadorId },
    // });
    // if (!trabajadorExists) {
    //   throw new NotFoundError('Trabajador', data.trabajadorId, { tenantId });
    // }

    const availability = this.repository.create(data);
    const saved = await this.repository.save(availability);

    const entity = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['trabajador'],
    });

    Logger.info('Operator availability created', {
      tenantId,
      id: saved.id,
      trabajadorId: data.trabajadorId,
      context: 'OperatorAvailabilityService.create',
    });

    return this.transformToDto(entity!);
  } catch (error) {
    Logger.error('Error creating operator availability', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      data,
      context: 'OperatorAvailabilityService.create',
    });
    throw error;
  }
}

async update(
  tenantId: number,
  id: number,
  data: Partial<OperatorAvailability>
): Promise<OperatorAvailabilityDto> {
  try {
    Logger.info('Updating operator availability', {
      tenantId,
      id,
      data,
      context: 'OperatorAvailabilityService.update',
    });

    // Verify existence first
    const existing = await this.findById(tenantId, id);

    // Business rule 1: Date range validation (if dates are being updated)
    if (data.fechaInicio || data.fechaFin) {
      const startDate = new Date(data.fechaInicio || existing.fecha_inicio);
      const endDate = new Date(data.fechaFin || existing.fecha_fin);

      if (startDate >= endDate) {
        throw new ConflictError(
          'Date range invalid: fecha_inicio must be before fecha_fin',
          {
            fecha_inicio: startDate,
            fecha_fin: endDate,
            tenantId,
          }
        );
      }
    }

    // Business rule 2: Check for overlapping availability (exclude current record)
    if (data.fechaInicio || data.fechaFin || data.trabajadorId) {
      const trabajadorId = data.trabajadorId || existing.trabajador_id;
      const fechaInicio = data.fechaInicio || existing.fecha_inicio;
      const fechaFin = data.fechaFin || existing.fecha_fin;

      const overlaps = await this.repository
        .createQueryBuilder('avail')
        .where('avail.trabajadorId = :trabajadorId', { trabajadorId })
        .andWhere('avail.id != :currentId', { currentId: id })
        .andWhere('avail.fechaInicio <= :fechaFin', { fechaFin })
        .andWhere('avail.fechaFin >= :fechaInicio', { fechaInicio })
        .getCount();

      if (overlaps > 0) {
        throw new ConflictError(
          'Updated availability period overlaps with existing record',
          {
            trabajador_id: trabajadorId,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            existing_overlaps: overlaps,
            tenantId,
          }
        );
      }
    }

    await this.repository.update(id, data);

    const updated = await this.findById(tenantId, id);

    Logger.info('Operator availability updated', {
      tenantId,
      id,
      context: 'OperatorAvailabilityService.update',
    });

    return updated;
  } catch (error) {
    Logger.error('Error updating operator availability', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      data,
      context: 'OperatorAvailabilityService.update',
    });
    throw error;
  }
}
```

**Effort**: 🟡 Medium (2 hours - overlap detection logic is moderately complex)

---

## Logging Analysis

### Current Logging

```typescript
// ❌ NO LOGGING AT ALL
// Service has zero Logger.info or Logger.error calls
```

### Issues Found

- [x] **No Logging**: Service has NO logging at all (0 log statements)
- [x] **No Success Logging**: No info-level logs for successful operations
- [x] **No Error Logging**: No error-level logs when operations fail
- [x] **No Context**: N/A (no logs to add context to)
- [x] **No Debugging Info**: Cannot trace operations in production

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import Logger from '../utils/logger';

async findAll(
  tenantId: number,
  filters?: { ... },
  page = 1,
  limit = 10
): Promise<{ data: OperatorAvailabilityDto[]; total: number }> {
  try {
    Logger.info('Finding operator availabilities', {
      tenantId,
      filters,
      page,
      limit,
      context: 'OperatorAvailabilityService.findAll',
    });

    // ... query logic

    Logger.info('Operator availabilities found', {
      tenantId,
      count: entities.length,
      total,
      page,
      context: 'OperatorAvailabilityService.findAll',
    });

    return { data: entities.map((e) => this.transformToDto(e)), total };
  } catch (error) {
    Logger.error('Error finding operator availabilities', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      filters,
      page,
      limit,
      context: 'OperatorAvailabilityService.findAll',
    });
    throw error;
  }
}

async create(tenantId: number, data: any): Promise<OperatorAvailabilityDto> {
  try {
    Logger.info('Creating operator availability', {
      tenantId,
      trabajadorId: data.trabajadorId,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      context: 'OperatorAvailabilityService.create',
    });

    // ... create logic

    Logger.info('Operator availability created successfully', {
      tenantId,
      id: saved.id,
      trabajadorId: data.trabajadorId,
      context: 'OperatorAvailabilityService.create',
    });

    return this.transformToDto(entity);
  } catch (error) {
    Logger.error('Error creating operator availability', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      data,
      context: 'OperatorAvailabilityService.create',
    });
    throw error;
  }
}
```

**Effort**: 🟢 Small (1 hour - add to all 8 methods)

---

## Testing Analysis

### Current Test Coverage

- **Test File Exists**: ❌ No (`operator-availability.service.spec.ts` does not exist)
- **Test Count**: 0 tests
- **Coverage**: 0%
- **Tests Run**: ⏭️ N/A (no tests)

### Issues Found

- [x] **No Test File**: Service has no test file at all
- [x] **Zero Coverage**: 0% test coverage
- [x] **Missing Happy Path Tests**: No tests for successful operations
- [x] **Missing Error Tests**: No tests for error handling (but no errors are thrown currently!)
- [x] **No Tenant Isolation Tests**: No tests for cross-tenant access prevention
- [x] **No Business Rule Tests**: No tests for overlap detection, date validation

### Recommendations

**NOTE**: Test creation is DEFERRED to Phase 21 (Testing Phase). For now, we focus on making the service testable by:

1. Adding proper error handling
2. Adding tenant context
3. Adding business validation

Tests will be written later following this pattern:

```typescript
// ✅ FUTURE PATTERN (Phase 21)
// operator-availability.service.spec.ts

describe('OperatorAvailabilityService', () => {
  let service: OperatorAvailabilityService;
  const TENANT_ID = 1;
  const OTHER_TENANT_ID = 2;
  let testOperatorId: number;

  beforeEach(async () => {
    service = new OperatorAvailabilityService();
    // Create test operator
    testOperatorId = 1; // or create via OperatorService
  });

  describe('create', () => {
    it('should create availability record successfully', async () => {
      const data = {
        trabajadorId: testOperatorId,
        fechaInicio: new Date('2026-02-01'),
        fechaFin: new Date('2026-02-28'),
        disponible: true,
        motivo: null,
      };

      const result = await service.create(TENANT_ID, data);

      expect(result.id).toBeDefined();
      expect(result.trabajador_id).toBe(testOperatorId);
      expect(result.disponible).toBe(true);
    });

    it('should throw ConflictError if date range invalid', async () => {
      const data = {
        trabajadorId: testOperatorId,
        fechaInicio: new Date('2026-02-28'),
        fechaFin: new Date('2026-02-01'), // End before start!
        disponible: true,
      };

      await expect(service.create(TENANT_ID, data)).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError if availability overlaps', async () => {
      // Create first availability
      await service.create(TENANT_ID, {
        trabajadorId: testOperatorId,
        fechaInicio: new Date('2026-02-01'),
        fechaFin: new Date('2026-02-28'),
        disponible: true,
      });

      // Try to create overlapping availability
      const overlapping = {
        trabajadorId: testOperatorId,
        fechaInicio: new Date('2026-02-15'),
        fechaFin: new Date('2026-03-15'),
        disponible: false,
      };

      await expect(service.create(TENANT_ID, overlapping)).rejects.toThrow(ConflictError);
    });
  });

  describe('findById', () => {
    it('should return availability by ID', async () => {
      const created = await service.create(TENANT_ID, {
        trabajadorId: testOperatorId,
        fechaInicio: new Date('2026-03-01'),
        fechaFin: new Date('2026-03-31'),
        disponible: true,
      });

      const found = await service.findById(TENANT_ID, created.id);

      expect(found.id).toBe(created.id);
      expect(found.trabajador_id).toBe(testOperatorId);
    });

    it('should throw NotFoundError if not found', async () => {
      await expect(service.findById(TENANT_ID, 99999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByOperator', () => {
    it('should return all availability for operator', async () => {
      await service.create(TENANT_ID, {
        trabajadorId: testOperatorId,
        fechaInicio: new Date('2026-02-01'),
        fechaFin: new Date('2026-02-28'),
        disponible: true,
      });

      await service.create(TENANT_ID, {
        trabajadorId: testOperatorId,
        fechaInicio: new Date('2026-03-01'),
        fechaFin: new Date('2026-03-31'),
        disponible: false,
        motivo: 'Vacaciones',
      });

      const result = await service.findByOperator(TENANT_ID, testOperatorId);

      expect(result.total).toBe(2);
    });
  });
});
```

**Effort**: 🔴 Large (4-6 hours for comprehensive tests - deferred to Phase 21)

---

## Summary

### Critical Issues (Fix First) 🔴

1. **No Error Handling** - Service returns null/boolean instead of throwing typed errors (NotFoundError, ConflictError)
2. **No Tenant Context** - ALL methods missing tenantId parameter (security risk!)
3. **No Business Validation** - No overlap detection, no date range validation
4. **No Logging** - Zero log statements (cannot debug production issues)

### Important Issues (Fix Next) 🟡

1. **Duplicate DTO Definition** - DTO defined in service and separate file
2. **Inconsistent Pagination** - Returns `{ data, page, limit, total, totalPages }` instead of `{ data, total }`
3. **No Pagination on 2 Methods** - `findByOperator` and `findAvailableOperators` return unpaginated arrays
4. **No Tests** - 0% test coverage (deferred to Phase 21)

### Nice to Have (Optional) 🟢

1. **Soft Delete** - Currently hard delete (could break historical records)
2. **Past Date Validation** - Optional business rule to prevent past dates
3. **Trabajador Verification** - Explicit check that trabajador exists (DB foreign key already handles this)

---

## Action Plan

### Step 1: Add Imports and Remove Duplicate DTO

- [x] Import `NotFoundError`, `ConflictError` from `../errors/http.errors`
- [x] Import `Logger` from `../utils/logger`
- [x] Remove duplicate `OperatorAvailabilityDto` interface from service (lines 5-18)
- [x] Import `OperatorAvailabilityDto` from `../types/dto/operator-availability.dto`

**Estimate**: 10 minutes

### Step 2: Add tenantId Parameter to All Methods

- [x] Add `tenantId: number` as first parameter to all 8 methods
- [x] Add TODO comments for tenant_id filtering (database table doesn't have tenant_id column yet)
- [x] Update method signatures

**Estimate**: 20 minutes

### Step 3: Add Error Handling and Logging

- [x] Wrap all 8 methods in try/catch blocks
- [x] Add `Logger.info` at method entry
- [x] Add `Logger.info` on success
- [x] Add `Logger.error` in catch blocks with full context
- [x] Change `findById` to throw `NotFoundError` instead of returning null
- [x] Change `update` to throw `NotFoundError` instead of returning null
- [x] Change `delete` to verify existence and throw `NotFoundError` (return void)

**Estimate**: 1.5 hours

### Step 4: Add Business Validation

- [x] Add date range validation (fecha_inicio < fecha_fin) in `create` and `update`
- [x] Add overlap detection in `create` and `update` (check for conflicting availability periods)
- [x] Throw `ConflictError` for validation failures

**Estimate**: 1 hour

### Step 5: Simplify Pagination Format

- [x] Change `findAll` return type from `{ data, page, limit, total, totalPages }` to `{ data, total }`
- [x] Add pagination to `findByOperator` (currently unpaginated)
- [x] Add pagination to `findAvailableOperators` (currently unpaginated)

**Estimate**: 30 minutes

### Step 6: Update Controller

- [x] Update all 8 controller methods to pass `tenantId` (hardcoded `const tenantId = 1` for now)
- [x] Add TODO comments for future `req.tenantContext` extraction
- [x] Catch `NotFoundError` → return 404
- [x] Catch `ConflictError` → return 409
- [x] Update pagination handling for simplified format

**Estimate**: 1 hour

### Step 7: Test, Build, Commit

- [x] Run `npm test` (should remain 152/152 passing)
- [x] Run `npm run build` (should be clean)
- [x] Run `npx eslint` (should pass)
- [x] Commit with detailed message

**Estimate**: 30 minutes

---

## Estimated Total Effort

**Overall Complexity**: 🟡 Medium (4-5 hours)

**Breakdown**:

- Imports and cleanup: 10 min
- Add tenantId parameters: 20 min
- Error handling + logging: 1.5 hours
- Business validation: 1 hour
- Simplify pagination: 30 min
- Update controller: 1 hour
- Test + build + commit: 30 min

**Total**: ~4.5 hours

**Recommended Approach**:

1. Add imports and remove duplicate DTO (foundation)
2. Add tenantId to all methods (security critical)
3. Add error handling and logging (observability)
4. Add business validation (data integrity)
5. Simplify pagination (consistency)
6. Update controller (complete the feature)
7. Test and commit (confidence)

---

## Sign-off

**Audit Complete**: January 18, 2026  
**Issues Identified**: 12 (4 critical, 4 important, 4 nice-to-have)  
**Estimated Refactoring Time**: 4-5 hours  
**Tests Added**: ❌ Deferred to Phase 21  
**Test Coverage**: 0% → 0% (no change in this phase)  
**Ready for Refactoring**: ✅ Yes

---

**Next Service**: `sst.service.ts` (Safety management - Priority 2, Moderate)
