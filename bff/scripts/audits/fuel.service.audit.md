# Service Audit: Fuel Service

**File**: `backend/src/services/fuel.service.ts`  
**Date**: January 17, 2026  
**Audited By**: OpenCode Agent  
**Status**: ✅ Complete

---

## Overview

- **Lines of Code**: 177
- **Public Methods**: 7
- **Has Tests**: ❌ No (`fuel.service.spec.ts` does not exist)
- **Test Coverage**: 0%
- **Complexity**: 🟢 Simple (Basic CRUD with fuel cost calculations)

---

## Error Handling Analysis

### Current Pattern

```typescript
// Line 95-101: Returns null instead of throwing
async getFuelRecordById(id: number): Promise<FuelRecordDto | null> {
  const record = await this.fuelRepository.findOne({
    where: { id },
    relations: ['valorizacion'],
  });
  return record ? toFuelRecordDto(record) : null;
}

// Line 124-129: Returns null instead of throwing
async updateFuelRecord(id: number, data: UpdateFuelRecordDto): Promise<FuelRecordDto | null> {
  const existing = await this.fuelRepository.findOne({
    where: { id },
    relations: ['valorizacion'],
  });
  if (!existing) return null;
  // ...
}

// Line 153-156: Returns boolean, no error handling
async deleteFuelRecord(id: number): Promise<boolean> {
  const result = await this.fuelRepository.delete(id);
  return (result.affected ?? 0) > 0;
}
```

### Issues Found

- [x] **No Error Classes**: Returns `null` instead of throwing `NotFoundError`
- [x] **No Error Logging**: No try/catch blocks, no logging at all
- [x] **Inconsistent Pattern**: Some methods return null, others return boolean
- [x] **No Business Validation**: No validation of calculations or business rules

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { NotFoundError } from '../errors/http.errors';
import Logger from '../utils/logger';

async getFuelRecordById(tenantId: number, id: number): Promise<FuelRecordDto> {
  try {
    const record = await this.fuelRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['valorizacion'],
    });

    if (!record) {
      throw new NotFoundError('FuelRecord', id);
    }

    return toFuelRecordDto(record);
  } catch (error) {
    Logger.error('Error finding fuel record', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'FuelService.getFuelRecordById',
    });
    throw error;
  }
}

async updateFuelRecord(
  tenantId: number,
  id: number,
  data: UpdateFuelRecordDto
): Promise<FuelRecordDto> {
  try {
    const existing = await this.fuelRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['valorizacion'],
    });

    if (!existing) {
      throw new NotFoundError('FuelRecord', id);
    }

    // ... update logic

    Logger.info('Fuel record updated', {
      tenantId,
      fuelRecordId: id,
      context: 'FuelService.updateFuelRecord',
    });

    return toFuelRecordDto(withRelations!);
  } catch (error) {
    Logger.error('Error updating fuel record', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'FuelService.updateFuelRecord',
    });
    throw error;
  }
}

async deleteFuelRecord(tenantId: number, id: number): Promise<void> {
  try {
    const existing = await this.fuelRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!existing) {
      throw new NotFoundError('FuelRecord', id);
    }

    await this.fuelRepository.delete(id);

    Logger.info('Fuel record deleted', {
      tenantId,
      fuelRecordId: id,
      context: 'FuelService.deleteFuelRecord',
    });
  } catch (error) {
    Logger.error('Error deleting fuel record', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'FuelService.deleteFuelRecord',
    });
    throw error;
  }
}
```

**Effort**: 🟡 Medium (1 hour)

---

## Return Type Analysis

### Current Pattern

```typescript
// ✅ GOOD: Returns DTOs
async getAllFuelRecords(filters?: any): Promise<{ data: FuelRecordDto[]; total: number }>
async getFuelRecordById(id: number): Promise<FuelRecordDto | null>
async createFuelRecord(data: CreateFuelRecordDto): Promise<FuelRecordDto>
async updateFuelRecord(id: number, data: UpdateFuelRecordDto): Promise<FuelRecordDto | null>

// ⚠️ INCONSISTENT: Returns boolean instead of void
async deleteFuelRecord(id: number): Promise<boolean>
```

### Issues Found

- [ ] **Returns Raw Entities**: ✅ **GOOD** - Always returns DTOs
- [ ] **Inconsistent Return Types**: ⚠️ Delete returns `boolean`, should return `void`
- [ ] **Missing Transformations**: ✅ **GOOD** - Uses `toFuelRecordDto` consistently
- [ ] **Nullable Returns**: ⚠️ Returns `null` for not found (should throw error)

### Recommendations

```typescript
// Change from:
async deleteFuelRecord(id: number): Promise<boolean>

// To:
async deleteFuelRecord(tenantId: number, id: number): Promise<void>

// Change from:
async getFuelRecordById(id: number): Promise<FuelRecordDto | null>

// To:
async getFuelRecordById(tenantId: number, id: number): Promise<FuelRecordDto>
```

**Effort**: 🟢 Small (15 minutes, part of error handling fix)

---

## Tenant Context Analysis

### Current Pattern

```typescript
// ❌ NO TENANT FILTERING AT ALL
async getAllFuelRecords(filters?: any): Promise<{ data: FuelRecordDto[]; total: number }> {
  const queryBuilder = this.fuelRepository
    .createQueryBuilder('fuel')
    .leftJoinAndSelect('fuel.valorizacion', 'val');

  // NO tenant_id filter!
}

async getFuelRecordById(id: number): Promise<FuelRecordDto | null> {
  const record = await this.fuelRepository.findOne({
    where: { id },  // Missing tenant_id!
    relations: ['valorizacion'],
  });
}
```

### Issues Found

- [x] **No Tenant Parameter**: ZERO methods accept `tenantId` parameter
- [x] **Missing Tenant Filter**: NO queries filter by `tenant_id`
- [x] **Cross-Tenant Risk**: 🚨 **CRITICAL** - Can access other tenant's fuel records
- [x] **No Tenant Verification**: All methods missing tenant checks

### CRITICAL SECURITY ISSUE

This service allows:

- Viewing fuel records from any company
- Modifying fuel records from any company
- Deleting fuel records from any company
- Getting fuel costs for any company's valuations

**This is a BLOCKER for production.**

### Recommendations

```typescript
// ✅ ALL METHODS NEED TENANT CONTEXT

async getAllFuelRecords(
  tenantId: number,  // ✅ Add parameter
  filters?: any
): Promise<{ data: FuelRecordDto[]; total: number }> {
  const page = parseInt(filters?.page) || 1;
  const limit = parseInt(filters?.limit) || 20;
  const skip = (page - 1) * limit;

  const queryBuilder = this.fuelRepository
    .createQueryBuilder('fuel')
    .leftJoinAndSelect('fuel.valorizacion', 'val')
    .where('fuel.tenant_id = :tenantId', { tenantId });  // ✅ Add filter

  // ... rest of filters

  const total = await queryBuilder.getCount();
  const records = await queryBuilder.skip(skip).take(limit).getMany();

  return {
    data: records.map((r) => toFuelRecordDto(r)),
    total,
  };
}

async getFuelRecordById(tenantId: number, id: number): Promise<FuelRecordDto> {
  const record = await this.fuelRepository.findOne({
    where: { id, tenant_id: tenantId },  // ✅ Verify ownership
    relations: ['valorizacion'],
  });

  if (!record) {
    throw new NotFoundError('FuelRecord', id);
  }

  return toFuelRecordDto(record);
}

async createFuelRecord(
  tenantId: number,  // ✅ Add parameter
  data: CreateFuelRecordDto
): Promise<FuelRecordDto> {
  const dtoData = mapCreateFuelRecordDto(data);

  if (dtoData.cantidad && dtoData.precio_unitario && !dtoData.monto_total) {
    dtoData.monto_total = dtoData.cantidad * dtoData.precio_unitario;
  }

  const fuelRecord = this.fuelRepository.create({
    ...fromFuelRecordDto(dtoData),
    tenant_id: tenantId,  // ✅ Assign tenant
  });

  const saved = await this.fuelRepository.save(fuelRecord);

  const withRelations = await this.fuelRepository.findOne({
    where: { id: saved.id, tenant_id: tenantId },  // ✅ Verify
    relations: ['valorizacion'],
  });

  return toFuelRecordDto(withRelations!);
}

async updateFuelRecord(
  tenantId: number,  // ✅ Add parameter
  id: number,
  data: UpdateFuelRecordDto
): Promise<FuelRecordDto> {
  const existing = await this.fuelRepository.findOne({
    where: { id, tenant_id: tenantId },  // ✅ Verify ownership
    relations: ['valorizacion'],
  });

  if (!existing) {
    throw new NotFoundError('FuelRecord', id);
  }

  // ... update logic
}

async deleteFuelRecord(tenantId: number, id: number): Promise<void> {
  const existing = await this.fuelRepository.findOne({
    where: { id, tenant_id: tenantId },  // ✅ Verify ownership
  });

  if (!existing) {
    throw new NotFoundError('FuelRecord', id);
  }

  await this.fuelRepository.delete(id);
}

async getFuelRecordsByValorizacion(
  tenantId: number,  // ✅ Add parameter
  valorizacionId: number
): Promise<FuelRecordDto[]> {
  const records = await this.fuelRepository.find({
    where: {
      valorizacionId,
      tenant_id: tenantId  // ✅ Add filter
    },
    relations: ['valorizacion'],
    order: { fecha: 'DESC' },
  });
  return records.map((r) => toFuelRecordDto(r));
}

async getTotalFuelCostByValorizacion(
  tenantId: number,  // ✅ Add parameter
  valorizacionId: number
): Promise<number> {
  const result = await this.fuelRepository
    .createQueryBuilder('fuel')
    .select('SUM(fuel.montoTotal)', 'total')
    .where('fuel.valorizacionId = :valorizacionId', { valorizacionId })
    .andWhere('fuel.tenant_id = :tenantId', { tenantId })  // ✅ Add filter
    .getRawOne();

  return parseFloat(result?.total || '0');
}
```

**Effort**: 🟡 Medium (2 hours - update all 7 methods + controller)

---

## Query Pattern Analysis

### Current Pattern

```typescript
// ✅ GOOD: Uses QueryBuilder
const queryBuilder = this.fuelRepository
  .createQueryBuilder('fuel')
  .leftJoinAndSelect('fuel.valorizacion', 'val');

// ✅ GOOD: Dynamic filters with parameterized queries
if (filters?.valorizacionId) {
  queryBuilder.andWhere('fuel.valorizacionId = :valorizacionId', {
    valorizacionId: filters.valorizacionId,
  });
}

// ✅ GOOD: Search with ILIKE (safe)
if (filters?.search) {
  queryBuilder.andWhere('(fuel.proveedor ILIKE :search OR fuel.numeroDocumento ILIKE :search)', {
    search: `%${filters.search}%`,
  });
}

// ✅ GOOD: Sorting with whitelist
const sortableFields: Record<string, string> = {
  fecha: 'fuel.fecha',
  cantidad: 'fuel.cantidad',
  // ... etc
};

// ✅ GOOD: Pagination
const total = await queryBuilder.getCount();
const records = await queryBuilder.skip(skip).take(limit).getMany();
```

### Issues Found

- [ ] **Uses find() Instead of QueryBuilder**: ✅ **GOOD** - Uses QueryBuilder
- [ ] **Selects All Fields**: ⚠️ Minor - Implicit SELECT \* (acceptable for small table)
- [ ] **Missing Joins**: ✅ **GOOD** - Uses leftJoinAndSelect
- [ ] **No Pagination**: ✅ **GOOD** - Has pagination
- [ ] **Hardcoded Sorting**: ✅ **GOOD** - Dynamic sorting with whitelist
- [ ] **SQL Injection Risk**: ✅ **SAFE** - Parameterized queries

### Recommendations

**Query patterns are already excellent!** Only need to add tenant filtering.

**Effort**: 🟢 Small (already done correctly)

---

## Business Logic Analysis

### Current Business Rules

1. **Auto-Calculate Total**: `monto_total = cantidad * precio_unitario` (if not provided)
2. **Recalculate on Update**: If cantidad or precio_unitario changes, recalculate monto_total
3. **Fuel Cost by Valorizacion**: Sum all fuel costs for a valuation

### Issues Found

- [ ] **No Business Validation**: ⚠️ Missing validation:
  - Negative cantidad or precio_unitario
  - Fuel record belongs to valuation's tenant
  - Cannot delete fuel record if valuation is approved
- [ ] **No State Validation**: No checks on valuation state
- [ ] **No Dependency Checks**: Delete doesn't check valuation status
- [ ] **No Transaction Management**: Not needed (simple CRUD)
- [ ] **Business Rules Documented**: ❌ Not documented

### Recommendations

```typescript
import { BusinessRuleError } from '../errors/business.error';

async createFuelRecord(
  tenantId: number,
  data: CreateFuelRecordDto
): Promise<FuelRecordDto> {
  try {
    const dtoData = mapCreateFuelRecordDto(data);

    // Business rule: Validate positive values
    if (dtoData.cantidad && dtoData.cantidad <= 0) {
      throw new BusinessRuleError(
        'Fuel quantity must be positive',
        'INVALID_QUANTITY',
        { cantidad: dtoData.cantidad }
      );
    }

    if (dtoData.precio_unitario && dtoData.precio_unitario < 0) {
      throw new BusinessRuleError(
        'Fuel price must be non-negative',
        'INVALID_PRICE',
        { precio_unitario: dtoData.precio_unitario }
      );
    }

    // Business rule: Verify valuation exists and belongs to tenant
    if (dtoData.valorizacion_id) {
      const valuation = await AppDataSource
        .getRepository('Valuation')
        .findOne({
          where: {
            id: dtoData.valorizacion_id,
            tenant_id: tenantId
          },
        });

      if (!valuation) {
        throw new NotFoundError('Valuation', dtoData.valorizacion_id);
      }
    }

    // Calculate monto_total
    if (dtoData.cantidad && dtoData.precio_unitario && !dtoData.monto_total) {
      dtoData.monto_total = dtoData.cantidad * dtoData.precio_unitario;
    }

    const fuelRecord = this.fuelRepository.create({
      ...fromFuelRecordDto(dtoData),
      tenant_id: tenantId,
    });

    const saved = await this.fuelRepository.save(fuelRecord);

    const withRelations = await this.fuelRepository.findOne({
      where: { id: saved.id, tenant_id: tenantId },
      relations: ['valorizacion'],
    });

    Logger.info('Fuel record created', {
      tenantId,
      fuelRecordId: saved.id,
      valorizacionId: dtoData.valorizacion_id,
      context: 'FuelService.createFuelRecord',
    });

    return toFuelRecordDto(withRelations!);
  } catch (error) {
    Logger.error('Error creating fuel record', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      data,
      context: 'FuelService.createFuelRecord',
    });
    throw error;
  }
}

async deleteFuelRecord(tenantId: number, id: number): Promise<void> {
  try {
    const existing = await this.fuelRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['valorizacion'],
    });

    if (!existing) {
      throw new NotFoundError('FuelRecord', id);
    }

    // Business rule: Cannot delete if valuation is approved
    if (existing.valorizacion?.status === 'APPROVED') {
      throw BusinessRuleError.cannotDelete(
        'FuelRecord',
        'belongs to an approved valuation',
        { valuationStatus: existing.valorizacion.status }
      );
    }

    await this.fuelRepository.delete(id);

    Logger.info('Fuel record deleted', {
      tenantId,
      fuelRecordId: id,
      context: 'FuelService.deleteFuelRecord',
    });
  } catch (error) {
    Logger.error('Error deleting fuel record', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'FuelService.deleteFuelRecord',
    });
    throw error;
  }
}
```

**Effort**: 🟡 Medium (1-2 hours - add validation + valuation checks)

---

## Logging Analysis

### Current Logging

❌ **NO LOGGING AT ALL** - This service has zero logging.

### Issues Found

- [x] **No Logging**: Service has no logging
- [x] **No Success Logging**: Mutations not logged
- [x] **No Error Logging**: Errors not logged
- [x] **Missing Context**: N/A (no logs exist)

### Recommendations

Add logging to all methods (see examples in Business Logic section above).

**Effort**: 🟢 Small (30 minutes, part of error handling)

---

## Testing Analysis

### Current Test Coverage

- **Test File Exists**: ❌ No
- **Test Count**: 0
- **Coverage**: 0%
- **Tests Run**: N/A

### Recommendations

```typescript
// ✅ RECOMMENDED: fuel.service.spec.ts
import { FuelService } from './fuel.service';
import { AppDataSource } from '../config/database.config';
import { FuelRecord } from '../models/fuel-record.model';
import { NotFoundError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';

describe('FuelService', () => {
  let service: FuelService;
  let fuelRepo: any;
  const TENANT_ID = 1;
  const OTHER_TENANT_ID = 2;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    service = new FuelService();
    fuelRepo = AppDataSource.getRepository(FuelRecord);
    await fuelRepo.delete({});
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('createFuelRecord', () => {
    it('should create fuel record successfully', async () => {
      const data = {
        fecha: new Date('2026-01-15'),
        cantidad: 100,
        precio_unitario: 5.5,
        tipo_combustible: 'DIESEL',
        proveedor: 'PetroPerú',
        numero_documento: 'F001-123',
      };

      const result = await service.createFuelRecord(TENANT_ID, data);

      expect(result.id).toBeDefined();
      expect(result.cantidad).toBe(100);
      expect(result.monto_total).toBe(550); // Auto-calculated
    });

    it('should auto-calculate monto_total', async () => {
      const data = {
        fecha: new Date('2026-01-15'),
        cantidad: 50,
        precio_unitario: 6.0,
        tipo_combustible: 'GAS',
      };

      const result = await service.createFuelRecord(TENANT_ID, data);

      expect(result.monto_total).toBe(300);
    });

    it('should throw error for negative cantidad', async () => {
      const data = {
        fecha: new Date('2026-01-15'),
        cantidad: -10,
        precio_unitario: 5.0,
        tipo_combustible: 'DIESEL',
      };

      await expect(service.createFuelRecord(TENANT_ID, data)).rejects.toThrow(BusinessRuleError);
    });

    it('should throw error for negative precio_unitario', async () => {
      const data = {
        fecha: new Date('2026-01-15'),
        cantidad: 10,
        precio_unitario: -5.0,
        tipo_combustible: 'DIESEL',
      };

      await expect(service.createFuelRecord(TENANT_ID, data)).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('getAllFuelRecords', () => {
    beforeEach(async () => {
      await service.createFuelRecord(TENANT_ID, {
        fecha: new Date('2026-01-15'),
        cantidad: 100,
        precio_unitario: 5.0,
        tipo_combustible: 'DIESEL',
      });
      await service.createFuelRecord(TENANT_ID, {
        fecha: new Date('2026-01-16'),
        cantidad: 50,
        precio_unitario: 6.0,
        tipo_combustible: 'GAS',
      });
      await service.createFuelRecord(OTHER_TENANT_ID, {
        fecha: new Date('2026-01-17'),
        cantidad: 200,
        precio_unitario: 5.5,
        tipo_combustible: 'DIESEL',
      });
    });

    it('should return paginated fuel records for tenant', async () => {
      const result = await service.getAllFuelRecords(TENANT_ID, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should not return other tenant records', async () => {
      const result = await service.getAllFuelRecords(TENANT_ID, {});

      const otherTenantRecord = result.data.find((r) => r.cantidad === 200);
      expect(otherTenantRecord).toBeUndefined();
    });

    it('should filter by tipo_combustible', async () => {
      const result = await service.getAllFuelRecords(TENANT_ID, {
        tipoCombustible: 'DIESEL',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].tipo_combustible).toBe('DIESEL');
    });

    it('should filter by date range', async () => {
      const result = await service.getAllFuelRecords(TENANT_ID, {
        startDate: '2026-01-15',
        endDate: '2026-01-15',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].cantidad).toBe(100);
    });

    it('should search by proveedor', async () => {
      await service.createFuelRecord(TENANT_ID, {
        fecha: new Date('2026-01-18'),
        cantidad: 75,
        precio_unitario: 5.25,
        tipo_combustible: 'DIESEL',
        proveedor: 'PetroPerú',
      });

      const result = await service.getAllFuelRecords(TENANT_ID, {
        search: 'PetroPerú',
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].proveedor).toBe('PetroPerú');
    });

    it('should sort by fecha descending by default', async () => {
      const result = await service.getAllFuelRecords(TENANT_ID, {});

      expect(result.data[0].fecha).toBeAfter(result.data[1].fecha);
    });
  });

  describe('getFuelRecordById', () => {
    it('should return fuel record by ID', async () => {
      const created = await service.createFuelRecord(TENANT_ID, {
        fecha: new Date('2026-01-15'),
        cantidad: 100,
        precio_unitario: 5.0,
        tipo_combustible: 'DIESEL',
      });

      const found = await service.getFuelRecordById(TENANT_ID, created.id);

      expect(found.id).toBe(created.id);
      expect(found.cantidad).toBe(100);
    });

    it('should throw NotFoundError if not found', async () => {
      await expect(service.getFuelRecordById(TENANT_ID, 99999)).rejects.toThrow(NotFoundError);
    });

    it('should not return record from other tenant', async () => {
      const created = await service.createFuelRecord(TENANT_ID, {
        fecha: new Date('2026-01-15'),
        cantidad: 100,
        precio_unitario: 5.0,
        tipo_combustible: 'DIESEL',
      });

      await expect(service.getFuelRecordById(OTHER_TENANT_ID, created.id)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('updateFuelRecord', () => {
    it('should update fuel record successfully', async () => {
      const created = await service.createFuelRecord(TENANT_ID, {
        fecha: new Date('2026-01-15'),
        cantidad: 100,
        precio_unitario: 5.0,
        tipo_combustible: 'DIESEL',
      });

      const updated = await service.updateFuelRecord(TENANT_ID, created.id, {
        cantidad: 150,
      });

      expect(updated.cantidad).toBe(150);
      expect(updated.monto_total).toBe(750); // Recalculated
    });

    it('should recalculate monto_total when precio_unitario changes', async () => {
      const created = await service.createFuelRecord(TENANT_ID, {
        fecha: new Date('2026-01-15'),
        cantidad: 100,
        precio_unitario: 5.0,
        tipo_combustible: 'DIESEL',
      });

      const updated = await service.updateFuelRecord(TENANT_ID, created.id, {
        precio_unitario: 6.0,
      });

      expect(updated.precio_unitario).toBe(6.0);
      expect(updated.monto_total).toBe(600); // Recalculated
    });

    it('should throw NotFoundError if not found', async () => {
      await expect(service.updateFuelRecord(TENANT_ID, 99999, { cantidad: 50 })).rejects.toThrow(
        NotFoundError
      );
    });

    it('should not update record from other tenant', async () => {
      const created = await service.createFuelRecord(TENANT_ID, {
        fecha: new Date('2026-01-15'),
        cantidad: 100,
        precio_unitario: 5.0,
        tipo_combustible: 'DIESEL',
      });

      await expect(
        service.updateFuelRecord(OTHER_TENANT_ID, created.id, { cantidad: 50 })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteFuelRecord', () => {
    it('should delete fuel record successfully', async () => {
      const created = await service.createFuelRecord(TENANT_ID, {
        fecha: new Date('2026-01-15'),
        cantidad: 100,
        precio_unitario: 5.0,
        tipo_combustible: 'DIESEL',
      });

      await service.deleteFuelRecord(TENANT_ID, created.id);

      await expect(service.getFuelRecordById(TENANT_ID, created.id)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if not found', async () => {
      await expect(service.deleteFuelRecord(TENANT_ID, 99999)).rejects.toThrow(NotFoundError);
    });

    it('should not delete record from other tenant', async () => {
      const created = await service.createFuelRecord(TENANT_ID, {
        fecha: new Date('2026-01-15'),
        cantidad: 100,
        precio_unitario: 5.0,
        tipo_combustible: 'DIESEL',
      });

      await expect(service.deleteFuelRecord(OTHER_TENANT_ID, created.id)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw error if valuation is approved', async () => {
      // TODO: Create approved valuation with fuel record
      // Expect BusinessRuleError
    });
  });

  describe('getTotalFuelCostByValorizacion', () => {
    it('should calculate total fuel cost for valuation', async () => {
      const valorizacionId = 1;

      await service.createFuelRecord(TENANT_ID, {
        fecha: new Date('2026-01-15'),
        cantidad: 100,
        precio_unitario: 5.0,
        tipo_combustible: 'DIESEL',
        valorizacion_id: valorizacionId,
      });

      await service.createFuelRecord(TENANT_ID, {
        fecha: new Date('2026-01-16'),
        cantidad: 50,
        precio_unitario: 6.0,
        tipo_combustible: 'GAS',
        valorizacion_id: valorizacionId,
      });

      const total = await service.getTotalFuelCostByValorizacion(TENANT_ID, valorizacionId);

      expect(total).toBe(800); // 500 + 300
    });

    it('should return 0 if no fuel records for valuation', async () => {
      const total = await service.getTotalFuelCostByValorizacion(TENANT_ID, 999);

      expect(total).toBe(0);
    });

    it('should not include other tenant fuel costs', async () => {
      const valorizacionId = 1;

      await service.createFuelRecord(TENANT_ID, {
        fecha: new Date('2026-01-15'),
        cantidad: 100,
        precio_unitario: 5.0,
        tipo_combustible: 'DIESEL',
        valorizacion_id: valorizacionId,
      });

      await service.createFuelRecord(OTHER_TENANT_ID, {
        fecha: new Date('2026-01-16'),
        cantidad: 200,
        precio_unitario: 10.0,
        tipo_combustible: 'DIESEL',
        valorizacion_id: valorizacionId,
      });

      const total = await service.getTotalFuelCostByValorizacion(TENANT_ID, valorizacionId);

      expect(total).toBe(500); // Only tenant 1's record
    });
  });
});
```

**Test Coverage Goal**: 80%+ (23 tests cover all critical paths)

**Effort**: 🟡 Medium (2-3 hours)

---

## Summary

### Critical Issues (Fix First) 🔴

1. **🚨 SECURITY: No Tenant Context** - Service allows cross-tenant data access
2. **No Tests** - 0% coverage
3. **No Error Handling** - Returns null, no logging, no error classes

### Important Issues (Fix Next) 🟡

4. **Missing Business Validation** - No validation for negative values, valuation ownership
5. **No Logging** - Zero logging throughout service

### Nice to Have (Optional) 🟢

6. **Business Rule Documentation** - Document calculation logic

---

## Action Plan

### Step 1: Add Tenant Context (CRITICAL - 2 hours)

- [ ] Add `tenantId` parameter to all 7 methods
- [ ] Add `WHERE tenant_id = :tenantId` to all queries
- [ ] Update method signatures
- [ ] Assign tenant_id on create

### Step 2: Add Error Handling (1 hour)

- [ ] Import NotFoundError, BusinessRuleError, Logger
- [ ] Replace null returns with NotFoundError
- [ ] Add try/catch blocks to all methods
- [ ] Add error logging
- [ ] Add success logging

### Step 3: Add Business Validation (1-2 hours)

- [ ] Validate positive cantidad and precio_unitario
- [ ] Verify valuation exists and belongs to tenant
- [ ] Check valuation status before delete
- [ ] Add validation error messages

### Step 4: Create Tests (2-3 hours)

- [ ] Create fuel.service.spec.ts
- [ ] Write 23 tests (from template above)
- [ ] Achieve 80%+ coverage
- [ ] Run npm test to verify
- [ ] All tests passing

### Step 5: Update Controller (30 min)

- [ ] Update fuel.routes.ts to extract and pass tenantId
- [ ] Update error handling in routes
- [ ] Test API endpoints manually

---

## Estimated Total Effort

**Overall Complexity**: 🟡 Medium (6-8 hours total)

**Priority Order**:

1. 🚨 Tenant Context (2 hours) - security critical
2. 🔴 Error Handling (1 hour) - consistency
3. 🟡 Business Validation (1-2 hours) - correctness
4. 🟡 Tests (2-3 hours) - confidence
5. 🟢 Controller Update (30 min) - integration

---

## Sign-off

**Audit Complete**: January 17, 2026  
**Issues Fixed**: 0 / 5  
**Tests Added**: ❌ No  
**Test Coverage**: 0%  
**All Tests Passing**: N/A  
**Ready for Production**: ❌ No (tenant context blocking issue)

---

**Next Action**: Start implementing fixes (Step 1: Tenant Context)
