# Service Audit: InventoryService

**File**: `backend/src/services/inventory.service.ts`  
**Date**: January 18, 2026  
**Audited By**: OpenCode Agent  
**Status**: ⚠️ Issues Found

---

## Overview

- **Lines of Code**: 76
- **Public Methods**: 2 (`createMovement`, `getStock`)
- **Has Tests**: ❌ No (`inventory.service.spec.ts` not found)
- **Test Coverage**: 0% (no tests exist)
- **Complexity**: 🟡 Moderate (uses transactions, weighted average cost calculation)

---

## Error Handling Analysis

### Current Pattern

```typescript
// Lines 18-68: Transaction with try/catch
try {
  // Create Movement
  const movement = this.movementRepository.create(data);
  const savedMovement = await queryRunner.manager.save(movement);

  // Process Details
  for (const detailData of details) {
    const product = await queryRunner.manager.findOne(Product, {
      where: { id: detailData.productId as any },
    });
    if (!product) {
      throw new Error(`Product not found: ${detailData.productId}`); // ❌
    }

    // ...

    if (Number(product.stockActual) < Number(detail.cantidad)) {
      throw new Error(`Insufficient stock for product: ${product.nombre}`); // ❌
    }
  }

  await queryRunner.commitTransaction();
  return savedMovement;
} catch (error) {
  await queryRunner.rollbackTransaction(); // ✅ Good transaction rollback
  throw error;
} finally {
  await queryRunner.release();
}
```

### Issues Found

- [x] **Generic Errors**: Uses `throw new Error(...)` instead of custom error classes
- [x] **No Error Logging**: Missing error logging with context
- [x] **English Messages**: Error messages in English (should be Spanish)
- [x] **No Error Codes**: No machine-readable error codes
- [ ] **No Re-throw**: Actually does re-throw properly ✅

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { NotFoundError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';
import Logger from '../utils/logger';

async createMovement(
  tenantId: number,
  data: MovementCreateDto,
  details: MovementDetailCreateDto[]
): Promise<MovementDetailDto> {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    Logger.info('Creating inventory movement', {
      tenantId,
      tipo: data.tipoMovimiento,
      detailCount: details.length,
      context: 'InventoryService.createMovement',
    });

    // Create Movement
    const movement = this.movementRepository.create(data);
    const savedMovement = await queryRunner.manager.save(movement);

    // Process Details
    for (const detailData of details) {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: detailData.productId },
      });

      if (!product) {
        throw new NotFoundError('Product', detailData.productId); // ✅
      }

      // Business validation
      if (detailData.cantidad <= 0) {
        throw new BusinessRuleError(
          'Quantity must be positive',
          'INVALID_QUANTITY',
          { cantidad: detailData.cantidad },
          'Enter a positive quantity value'
        );
      }

      if (detailData.precioUnitario < 0) {
        throw new BusinessRuleError(
          'Unit price cannot be negative',
          'INVALID_PRICE',
          { precio: detailData.precioUnitario },
          'Enter a non-negative price'
        );
      }

      // Create Detail
      const detail = this.movementDetailRepository.create({
        ...detailData,
        movementId: savedMovement.id,
      });
      await queryRunner.manager.save(detail);

      // Update Stock
      if (movement.tipoMovimiento === 'entrada') {
        // Update Weighted Average Cost
        const totalValue =
          Number(product.stockActual) * Number(product.precioUnitario || 0) +
          Number(detail.cantidad) * Number(detail.precioUnitario);
        const totalStock = Number(product.stockActual) + Number(detail.cantidad);

        if (totalStock > 0) {
          product.precioUnitario = totalValue / totalStock;
        }
        product.stockActual = totalStock;
      } else if (movement.tipoMovimiento === 'salida') {
        // Business rule: Check sufficient stock
        if (Number(product.stockActual) < Number(detail.cantidad)) {
          throw new BusinessRuleError(
            'Insufficient stock for product',
            'INSUFFICIENT_STOCK',
            {
              productId: product.id,
              productName: product.nombre,
              requested: detail.cantidad,
              available: product.stockActual,
            },
            'Reduce quantity or add stock before withdrawal'
          );
        }
        product.stockActual = Number(product.stockActual) - Number(detail.cantidad);
      }

      await queryRunner.manager.save(product);
    }

    await queryRunner.commitTransaction();

    Logger.info('Inventory movement created successfully', {
      tenantId,
      movementId: savedMovement.id,
      context: 'InventoryService.createMovement',
    });

    return toMovementDetailDto(savedMovement);
  } catch (error) {
    await queryRunner.rollbackTransaction();

    Logger.error('Error creating inventory movement', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      data,
      context: 'InventoryService.createMovement',
    });

    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

**Effort**: 🟡 Medium (requires DTO creation + business validation)

---

## Return Type Analysis

### Current Pattern

```typescript
// Lines 10-13: Returns raw entity
async createMovement(
  data: Partial<Movement>,
  details: Partial<MovementDetail>[]
): Promise<Movement> {  // ❌ Returns raw entity
  // ...
  return savedMovement;  // ❌ No DTO transformation
}

// Lines 71-74: Returns primitive
async getStock(productId: number): Promise<number> {
  const product = await this.productRepository.findOne({ where: { id: productId as any } });
  return product ? Number(product.stockActual) : 0;  // ⚠️ Returns 0 if not found (should throw)
}
```

### Issues Found

- [x] **Returns Raw Entities**: `createMovement` returns `Movement` instead of `MovementDto`
- [x] **Missing Transformations**: No DTO transformation functions used
- [x] **Missing DTO Imports**: DTO types not imported
- [x] **Silent Failures**: `getStock` returns 0 instead of throwing NotFoundError

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import {
  MovementListDto,
  MovementDetailDto,
  MovementCreateDto,
  MovementDetailCreateDto,
  ProductStockDto,
  toMovementDetailDto,
} from '../types/dto/inventory.dto';

async createMovement(
  tenantId: number,
  data: MovementCreateDto,
  details: MovementDetailCreateDto[]
): Promise<MovementDetailDto> {  // ✅ Returns DTO
  // ... logic
  return toMovementDetailDto(savedMovement);  // ✅ Transform to DTO
}

async getStock(tenantId: number, productId: number): Promise<ProductStockDto> {
  try {
    Logger.info('Getting product stock', {
      tenantId,
      productId,
      context: 'InventoryService.getStock',
    });

    // TODO: Add tenant_id filter when column exists
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product', productId);  // ✅ Throw instead of return 0
    }

    Logger.info('Product stock retrieved', {
      tenantId,
      productId,
      stock: product.stockActual,
      context: 'InventoryService.getStock',
    });

    return {
      product_id: product.id,
      codigo: product.codigo,
      nombre: product.nombre,
      stock_actual: Number(product.stockActual),
      stock_minimo: product.stockMinimo ? Number(product.stockMinimo) : null,
      unidad_medida: product.unidadMedida || null,
    };
  } catch (error) {
    Logger.error('Error getting product stock', {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      productId,
      context: 'InventoryService.getStock',
    });
    throw error;
  }
}
```

**Effort**: 🟡 Medium (requires DTO creation)

---

## Tenant Context Analysis

### Current Pattern

```typescript
// Lines 10-13: No tenantId parameter
async createMovement(
  data: Partial<Movement>,  // ❌ No tenant parameter
  details: Partial<MovementDetail>[]
): Promise<Movement> {
  // No tenant filtering in queries
}

// Lines 71-74: No tenantId parameter
async getStock(productId: number): Promise<number> {  // ❌ No tenant parameter
  const product = await this.productRepository.findOne({
    where: { id: productId as any }  // ❌ No tenant filter
  });
  // ...
}
```

### Issues Found

- [x] **No Tenant Parameter**: Methods don't accept `tenantId` parameter
- [x] **Missing Tenant Filter**: Queries don't filter by `tenant_id`
- [x] **Cross-Tenant Risk**: Potential to access other tenant's data
- [x] **Database Schema Limitation**: Tables lack `tenant_id` column (blocker)

### Database Schema Status

**Checked**: `database/001_init_schema.sql`

- ❌ `logistica.producto` - NO tenant_id column
- ❌ `logistica.movimiento` - NO tenant_id column
- ❌ `logistica.detalle_movimiento` - NO tenant_id column

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN (with TODO for schema limitation)

async createMovement(
  tenantId: number,  // ✅ Add tenant parameter
  data: MovementCreateDto,
  details: MovementDetailCreateDto[]
): Promise<MovementDetailDto> {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // TODO: Add tenant_id to movement when column exists
    // const movement = this.movementRepository.create({
    //   ...data,
    //   tenant_id: tenantId,
    // });

    const movement = this.movementRepository.create(data);
    const savedMovement = await queryRunner.manager.save(movement);

    for (const detailData of details) {
      // TODO: Add tenant_id filter when column exists
      // where: { id: detailData.productId, tenant_id: tenantId }
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: detailData.productId },
      });

      if (!product) {
        throw new NotFoundError('Product', detailData.productId);
      }

      // ... rest of logic
    }

    // ...
  } catch (error) {
    // ...
  } finally {
    await queryRunner.release();
  }
}

async getStock(tenantId: number, productId: number): Promise<ProductStockDto> {
  // TODO: Add tenant_id filter when column exists
  // where: { id: productId, tenant_id: tenantId }
  const product = await this.productRepository.findOne({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError('Product', productId);
  }

  return {
    product_id: product.id,
    stock_actual: Number(product.stockActual),
    // ...
  };
}
```

**Effort**: 🟢 Small (add parameter + TODO comments, no actual filtering until schema migration)

---

## Query Pattern Analysis

### Current Pattern

```typescript
// Lines 25-27: Using queryRunner.manager.findOne
const product = await queryRunner.manager.findOne(Product, {
  where: { id: detailData.productId as any }, // ❌ 'as any' type cast
});

// Lines 72-73: Using repository.findOne
const product = await this.productRepository.findOne({
  where: { id: productId as any }, // ❌ 'as any' type cast
});
```

### Issues Found

- [x] **Type Casts**: Unnecessary `as any` type casts
- [x] **No Relations Loaded**: Movement doesn't load details relation
- [ ] **Uses find() Instead of QueryBuilder**: Acceptable for simple queries ✅
- [ ] **Missing Joins**: Not needed for this service ✅

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

// Remove 'as any' casts
const product = await queryRunner.manager.findOne(Product, {
  where: { id: detailData.productId }, // ✅ No cast needed
});

// Load relations for detail view
const movement = await this.movementRepository.findOne({
  where: { id: movementId },
  relations: ['details', 'details.product', 'project'], // ✅ Load relations
});
```

**Effort**: 🟢 Small (remove type casts)

---

## Business Logic Analysis

### Current Business Rules

1. **Weighted Average Cost Calculation** (Lines 41-49):
   - On `entrada` (entry): Calculate new average cost based on current stock value + new stock value
   - Formula: `(currentStock * currentPrice + newQuantity * newPrice) / totalStock`

2. **Stock Update** (Lines 40-56):
   - On `entrada`: Increase stock by quantity
   - On `salida` (withdrawal): Decrease stock by quantity

3. **Insufficient Stock Check** (Lines 52-54):
   - On `salida`: Verify available stock >= requested quantity
   - Throws error if insufficient

4. **Transaction Management** (Lines 14-68):
   - All operations (movement + details + stock updates) wrapped in transaction
   - Rollback on any error

### Issues Found

- [x] **No Input Validation**: Doesn't validate positive quantities or prices
- [x] **No Movement Type Validation**: Doesn't validate `tipoMovimiento` is valid enum value
- [x] **Generic Error Messages**: Error messages not user-friendly
- [ ] **Transaction Management**: ✅ Correctly implemented with rollback
- [x] **No Business Rule Documentation**: Weighted average cost formula not documented

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { BusinessRuleError } from '../errors/business.error';

async createMovement(
  tenantId: number,
  data: MovementCreateDto,
  details: MovementDetailCreateDto[]
): Promise<MovementDetailDto> {
  // Business validation: Validate movement type
  const validTypes: TipoMovimiento[] = ['entrada', 'salida', 'transferencia', 'ajuste'];
  if (!validTypes.includes(data.tipoMovimiento)) {
    throw new BusinessRuleError(
      'Invalid movement type',
      'INVALID_MOVEMENT_TYPE',
      { tipo: data.tipoMovimiento, validTypes },
      'Select a valid movement type'
    );
  }

  // Business validation: At least one detail required
  if (!details || details.length === 0) {
    throw new BusinessRuleError(
      'Movement must have at least one detail',
      'NO_MOVEMENT_DETAILS',
      {},
      'Add at least one product to the movement'
    );
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const movement = this.movementRepository.create(data);
    const savedMovement = await queryRunner.manager.save(movement);

    for (const detailData of details) {
      // Business validation: Positive quantity
      if (detailData.cantidad <= 0) {
        throw new BusinessRuleError(
          'Quantity must be positive',
          'INVALID_QUANTITY',
          { cantidad: detailData.cantidad },
          'Enter a positive quantity'
        );
      }

      // Business validation: Non-negative price
      if (detailData.precioUnitario < 0) {
        throw new BusinessRuleError(
          'Unit price cannot be negative',
          'INVALID_PRICE',
          { precio: detailData.precioUnitario },
          'Enter a non-negative price'
        );
      }

      const product = await queryRunner.manager.findOne(Product, {
        where: { id: detailData.productId },
      });

      if (!product) {
        throw new NotFoundError('Product', detailData.productId);
      }

      // Create detail with calculated total
      const detail = this.movementDetailRepository.create({
        ...detailData,
        movementId: savedMovement.id,
        montoTotal: detailData.cantidad * detailData.precioUnitario,  // ✅ Calculate total
      });
      await queryRunner.manager.save(detail);

      // Update stock based on movement type
      if (movement.tipoMovimiento === 'entrada') {
        // Business rule: Weighted Average Cost (Costo Promedio Ponderado)
        // Formula: (currentValue + newValue) / totalStock
        const currentValue = Number(product.stockActual) * Number(product.precioUnitario || 0);
        const newValue = Number(detail.cantidad) * Number(detail.precioUnitario);
        const totalValue = currentValue + newValue;
        const totalStock = Number(product.stockActual) + Number(detail.cantidad);

        if (totalStock > 0) {
          product.precioUnitario = totalValue / totalStock;
        }
        product.stockActual = totalStock;
      } else if (movement.tipoMovimiento === 'salida') {
        // Business rule: Sufficient stock check
        const currentStock = Number(product.stockActual);
        const requestedQuantity = Number(detail.cantidad);

        if (currentStock < requestedQuantity) {
          throw new BusinessRuleError(
            'Insufficient stock for product',
            'INSUFFICIENT_STOCK',
            {
              productId: product.id,
              productName: product.nombre,
              requested: requestedQuantity,
              available: currentStock,
              shortfall: requestedQuantity - currentStock,
            },
            `Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${requestedQuantity}`
          );
        }

        product.stockActual = currentStock - requestedQuantity;

        // Business rule: Prevent negative stock (safety check)
        if (product.stockActual < 0) {
          throw new BusinessRuleError(
            'Stock cannot be negative',
            'NEGATIVE_STOCK',
            { productId: product.id, calculatedStock: product.stockActual },
            'Internal error: stock calculation resulted in negative value'
          );
        }
      }

      await queryRunner.manager.save(product);
    }

    await queryRunner.commitTransaction();
    return toMovementDetailDto(savedMovement);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

**Effort**: 🟡 Medium (add comprehensive validation)

---

## Logging Analysis

### Current Logging

```typescript
// ❌ NO LOGGING AT ALL
async createMovement(...): Promise<Movement> {
  // ... 58 lines of logic
  // No Logger.info on success
  // No Logger.error on failure
}

async getStock(...): Promise<number> {
  // ... 3 lines of logic
  // No logging
}
```

### Issues Found

- [x] **No Logging**: Service has no logging at all
- [x] **Missing Context**: N/A (no logs)
- [x] **No Error Logging**: Errors not logged before re-throwing
- [x] **No Success Logging**: Successful operations not logged

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import Logger from '../utils/logger';

async createMovement(
  tenantId: number,
  data: MovementCreateDto,
  details: MovementDetailCreateDto[]
): Promise<MovementDetailDto> {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    Logger.info('Creating inventory movement', {
      tenantId,
      tipoMovimiento: data.tipoMovimiento,
      detailCount: details.length,
      projectId: data.projectId,
      context: 'InventoryService.createMovement',
    });

    // ... transaction logic

    Logger.info('Inventory movement created successfully', {
      tenantId,
      movementId: savedMovement.id,
      tipoMovimiento: savedMovement.tipoMovimiento,
      detailCount: details.length,
      context: 'InventoryService.createMovement',
    });

    return toMovementDetailDto(savedMovement);
  } catch (error) {
    await queryRunner.rollbackTransaction();

    Logger.error('Error creating inventory movement', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      tipoMovimiento: data.tipoMovimiento,
      detailCount: details.length,
      context: 'InventoryService.createMovement',
    });

    throw error;
  } finally {
    await queryRunner.release();
  }
}

async getStock(tenantId: number, productId: number): Promise<ProductStockDto> {
  try {
    Logger.info('Getting product stock', {
      tenantId,
      productId,
      context: 'InventoryService.getStock',
    });

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product', productId);
    }

    Logger.info('Product stock retrieved', {
      tenantId,
      productId,
      stock: product.stockActual,
      context: 'InventoryService.getStock',
    });

    return {
      product_id: product.id,
      stock_actual: Number(product.stockActual),
      // ...
    };
  } catch (error) {
    Logger.error('Error getting product stock', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      productId,
      context: 'InventoryService.getStock',
    });
    throw error;
  }
}
```

**Effort**: 🟢 Small (add log statements)

---

## Testing Analysis

### Current Test Coverage

- **Test File Exists**: ❌ No (`inventory.service.spec.ts` not found)
- **Test Count**: 0 tests
- **Coverage**: 0%
- **Tests Run**: N/A

### Issues Found

- [x] **No Test File**: Service has no test file
- [x] **Missing Happy Path Tests**: Successful operations not tested
- [x] **Missing Error Tests**: Error handling not tested
- [x] **No Business Rule Tests**: Weighted average cost calculation not tested
- [x] **No Transaction Tests**: Rollback behavior not tested

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
// inventory.service.spec.ts

import { InventoryService } from './inventory.service';
import { AppDataSource } from '../config/database.config';
import { Product } from '../models/product.model';
import { Movement, MovementDetail } from '../models/movement.model';
import { NotFoundError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';

describe('InventoryService', () => {
  let service: InventoryService;
  let productRepository: any;
  const TENANT_ID = 1;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    service = new InventoryService();
    productRepository = AppDataSource.getRepository(Product);

    // Clear test data
    await AppDataSource.getRepository(MovementDetail).delete({});
    await AppDataSource.getRepository(Movement).delete({});
    await productRepository.delete({});
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('createMovement - entrada', () => {
    it('should create entrada movement and update stock', async () => {
      // Create test product
      const product = await productRepository.save({
        codigo: 'PROD-001',
        nombre: 'Test Product',
        stockActual: 0,
        precioUnitario: 0,
      });

      const data = {
        tipoMovimiento: 'entrada' as const,
        fecha: new Date(),
        observaciones: 'Test entry',
      };

      const details = [
        {
          productId: product.id,
          cantidad: 10,
          precioUnitario: 100,
        },
      ];

      const result = await service.createMovement(TENANT_ID, data, details);

      expect(result.id).toBeDefined();
      expect(result.tipo_movimiento).toBe('entrada');

      // Verify stock updated
      const updatedProduct = await productRepository.findOne({
        where: { id: product.id },
      });
      expect(updatedProduct.stockActual).toBe(10);
      expect(updatedProduct.precioUnitario).toBe(100);
    });

    it('should calculate weighted average cost correctly', async () => {
      // Create product with existing stock
      const product = await productRepository.save({
        codigo: 'PROD-002',
        nombre: 'Test Product 2',
        stockActual: 10,
        precioUnitario: 100, // Current: 10 units @ $100 = $1000
      });

      const data = {
        tipoMovimiento: 'entrada' as const,
        fecha: new Date(),
      };

      const details = [
        {
          productId: product.id,
          cantidad: 5,
          precioUnitario: 120, // New: 5 units @ $120 = $600
        },
      ];

      await service.createMovement(TENANT_ID, data, details);

      // Verify weighted average: (1000 + 600) / (10 + 5) = 1600 / 15 = 106.67
      const updatedProduct = await productRepository.findOne({
        where: { id: product.id },
      });
      expect(updatedProduct.stockActual).toBe(15);
      expect(updatedProduct.precioUnitario).toBeCloseTo(106.67, 2);
    });
  });

  describe('createMovement - salida', () => {
    it('should create salida movement and reduce stock', async () => {
      const product = await productRepository.save({
        codigo: 'PROD-003',
        nombre: 'Test Product 3',
        stockActual: 100,
        precioUnitario: 50,
      });

      const data = {
        tipoMovimiento: 'salida' as const,
        fecha: new Date(),
      };

      const details = [
        {
          productId: product.id,
          cantidad: 30,
          precioUnitario: 50,
        },
      ];

      await service.createMovement(TENANT_ID, data, details);

      const updatedProduct = await productRepository.findOne({
        where: { id: product.id },
      });
      expect(updatedProduct.stockActual).toBe(70);
    });

    it('should throw BusinessRuleError if insufficient stock', async () => {
      const product = await productRepository.save({
        codigo: 'PROD-004',
        nombre: 'Test Product 4',
        stockActual: 10,
        precioUnitario: 50,
      });

      const data = {
        tipoMovimiento: 'salida' as const,
        fecha: new Date(),
      };

      const details = [
        {
          productId: product.id,
          cantidad: 20, // Request more than available
          precioUnitario: 50,
        },
      ];

      await expect(service.createMovement(TENANT_ID, data, details)).rejects.toThrow(
        BusinessRuleError
      );

      // Verify stock unchanged
      const updatedProduct = await productRepository.findOne({
        where: { id: product.id },
      });
      expect(updatedProduct.stockActual).toBe(10);
    });
  });

  describe('createMovement - validation', () => {
    it('should throw NotFoundError if product not found', async () => {
      const data = {
        tipoMovimiento: 'entrada' as const,
        fecha: new Date(),
      };

      const details = [
        {
          productId: 99999,
          cantidad: 10,
          precioUnitario: 100,
        },
      ];

      await expect(service.createMovement(TENANT_ID, data, details)).rejects.toThrow(NotFoundError);
    });

    it('should rollback transaction on error', async () => {
      const product1 = await productRepository.save({
        codigo: 'PROD-005',
        nombre: 'Product 5',
        stockActual: 100,
        precioUnitario: 50,
      });

      const data = {
        tipoMovimiento: 'entrada' as const,
        fecha: new Date(),
      };

      const details = [
        {
          productId: product1.id,
          cantidad: 10,
          precioUnitario: 100,
        },
        {
          productId: 99999, // Invalid product - will fail
          cantidad: 5,
          precioUnitario: 50,
        },
      ];

      await expect(service.createMovement(TENANT_ID, data, details)).rejects.toThrow();

      // Verify first product stock unchanged (rollback)
      const unchanged = await productRepository.findOne({
        where: { id: product1.id },
      });
      expect(unchanged.stockActual).toBe(100);
    });
  });

  describe('getStock', () => {
    it('should return product stock', async () => {
      const product = await productRepository.save({
        codigo: 'PROD-006',
        nombre: 'Product 6',
        stockActual: 42,
        unidadMedida: 'UND',
      });

      const result = await service.getStock(TENANT_ID, product.id);

      expect(result.product_id).toBe(product.id);
      expect(result.stock_actual).toBe(42);
      expect(result.unidad_medida).toBe('UND');
    });

    it('should throw NotFoundError if product not found', async () => {
      await expect(service.getStock(TENANT_ID, 99999)).rejects.toThrow(NotFoundError);
    });
  });
});
```

**Effort**: 🟡 Medium (comprehensive test suite, ~2 hours)

---

## Summary

### Critical Issues (Fix First) 🔴

1. **No Tenant Context**: Methods lack `tenantId` parameter (security risk)
2. **Generic Errors**: Uses `throw new Error(...)` instead of custom error classes
3. **Returns Raw Entities**: Returns `Movement` entity instead of DTO
4. **No Logging**: No logging at all (debugging will be difficult)
5. **Silent Failure**: `getStock` returns 0 instead of throwing NotFoundError

### Important Issues (Fix Next) 🟡

1. **No Input Validation**: Doesn't validate positive quantities, non-negative prices
2. **English Error Messages**: Should be Spanish or at least have Spanish option
3. **No Tests**: 0% test coverage, complex logic untested
4. **Type Casts**: Unnecessary `as any` casts in queries

### Nice to Have (Optional) 🟢

1. **Document Business Rules**: Weighted average cost formula should be documented in code comments
2. **Movement Type Enum Validation**: Validate against allowed types
3. **Additional Methods**: Consider adding `getMovementById`, `listMovements`, `cancelMovement`

---

## Action Plan

### Step 1: Create DTOs (45 min)

- [ ] Create `backend/src/types/dto/inventory.dto.ts`
- [ ] Define `MovementListDto`, `MovementDetailDto`
- [ ] Define `MovementCreateDto`, `MovementDetailCreateDto`
- [ ] Define `ProductStockDto`
- [ ] Create transformation functions

### Step 2: Add Tenant Context (30 min)

- [ ] Add `tenantId` parameter to `createMovement`
- [ ] Add `tenantId` parameter to `getStock`
- [ ] Add TODO comments for tenant filtering (schema limitation)
- [ ] Update method signatures

### Step 3: Error Handling (1 hour)

- [ ] Import `NotFoundError`, `BusinessRuleError`
- [ ] Replace `throw new Error(...)` with custom errors
- [ ] Add business validation (positive quantities, prices)
- [ ] Add movement type validation
- [ ] Make `getStock` throw instead of returning 0

### Step 4: Add Logging (30 min)

- [ ] Import `Logger`
- [ ] Add `Logger.info` at start of each method
- [ ] Add `Logger.info` on success
- [ ] Add `Logger.error` in catch blocks
- [ ] Include context in all logs

### Step 5: Fix Return Types (30 min)

- [ ] Update `createMovement` return type to `MovementDetailDto`
- [ ] Update `getStock` return type to `ProductStockDto`
- [ ] Add DTO transformations
- [ ] Remove `as any` type casts

### Step 6: Controller (if needed) (30 min)

- [ ] Check if controller exists
- [ ] If yes: Update to pass `tenantId`
- [ ] If yes: Update error mapping
- [ ] If no: Document that no controller exists yet

### Step 7: Testing (2 hours - optional for now)

- [ ] Create test file
- [ ] Add happy path tests (entrada, salida)
- [ ] Add weighted average cost test
- [ ] Add insufficient stock test
- [ ] Add transaction rollback test
- [ ] Add validation tests

---

## Estimated Total Effort

**Overall Complexity**: 🟡 Medium (4-5 hours)

**Breakdown**:

- DTOs: 45 min
- Tenant Context: 30 min
- Error Handling: 1 hour
- Logging: 30 min
- Return Types: 30 min
- Controller Check: 30 min
- Tests (deferred): 2 hours

**Total**: ~4 hours (excluding tests)

**Recommended Approach**:

1. Create DTOs (foundation for return types)
2. Add tenant context (security critical)
3. Fix error handling (better error messages)
4. Add logging (debugging support)
5. Fix return types (consistency)
6. Check/update controller (if exists)
7. Tests (can batch-create later)

---

## Database Schema Notes

**Tables Audited**:

- `logistica.producto` - ❌ NO tenant_id column
- `logistica.movimiento` - ❌ NO tenant_id column
- `logistica.detalle_movimiento` - ❌ NO tenant_id column

**Impact**: Cannot enforce tenant isolation at database level yet. Must add `tenantId` parameter to method signatures and add TODO comments for future schema migration.

**Future Migration Required**: Add `tenant_id` column to all three tables.

---

## Sign-off

**Audit Complete**: January 18, 2026  
**Issues Found**: 15 issues (5 critical, 4 important, 6 nice-to-have)  
**Issues Fixed**: 0 / 15  
**Tests Added**: ❌ No  
**Test Coverage**: 0%  
**All Tests Passing**: N/A  
**Ready for Production**: ❌ No

---

**Next Service**: `export.service.ts` (Priority 1 - Simple)
