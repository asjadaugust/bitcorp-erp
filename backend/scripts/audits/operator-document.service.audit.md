# Service Audit: operator-document.service.ts

**File**: `backend/src/services/operator-document.service.ts`  
**Date**: January 18, 2026  
**Audited By**: OpenCode Agent  
**Status**: ✅ Complete

---

## Overview

- **Lines of Code**: 149
- **Public Methods**: 7 (findAll, findById, findByOperator, findExpiring, create, update, delete)
- **Has Tests**: ❌ No (`operator-document.service.spec.ts` does not exist)
- **Test Coverage**: 0% (no tests)
- **Complexity**: 🟡 Moderate (document management with expiration tracking)

---

## Error Handling Analysis

### Current Pattern

```typescript
// Line 95-101: Returns null instead of throwing
async findById(id: number): Promise<OperatorDocumentDto | null> {
  const entity = await this.repository.findOne({
    where: { id },
    relations: ['trabajador'],
  });
  return entity ? this.transformToDto(entity) : null;
}

// Line 139-142: Update returns null if not found
async update(id: number, data: Partial<OperatorDocument>): Promise<OperatorDocumentDto | null> {
  await this.repository.update(id, data);
  return await this.findById(id);
}

// Line 144-147: Delete returns boolean (doesn't verify entity exists)
async delete(id: number): Promise<boolean> {
  const result = await this.repository.delete(id);
  return (result.affected || 0) > 0;
}
```

### Issues Found

- [x] **Returns null**: Methods return null instead of throwing NotFoundError (lines 95-101, 139-142)
- [x] **No Error Logging**: No Logger.error calls anywhere
- [x] **No Success Logging**: No Logger.info calls for method execution
- [x] **No try/catch**: Methods don't catch and log errors
- [x] **No Business Validation**: No validation for document expiration, duplicate checks, etc.

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { NotFoundError } from '../errors/http.errors';
import Logger from '../utils/logger';

async findById(tenantId: number, id: number): Promise<OperatorDocumentDto> {
  try {
    Logger.info('Fetching operator document', { tenantId, id, context: 'OperatorDocumentService.findById' });

    const entity = await this.repository.findOne({
      where: { id },
      // TODO: Add tenant_id filter when column exists in rrhh.documento_trabajador
      relations: ['trabajador'],
    });

    if (!entity) {
      throw new NotFoundError('Operator document', id, { tenantId });
    }

    Logger.info('Operator document fetched', { tenantId, id, context: 'OperatorDocumentService.findById' });
    return this.transformToDto(entity);
  } catch (error) {
    Logger.error('Error fetching operator document', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'OperatorDocumentService.findById',
    });
    throw error;
  }
}
```

**Effort**: 🟢 Small (2-3 hours)

---

## Return Type Analysis

### Current Pattern

```typescript
// Line 50-93: findAll returns paginated response (GOOD!)
async findAll(filters?: {
  trabajadorId?: number;
  tipoDocumento?: string;
  page?: number;
  limit?: number;
}): Promise<{
  data: OperatorDocumentDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  // ... pagination implemented
}

// Line 95-101: findById returns DTO | null
async findById(id: number): Promise<OperatorDocumentDto | null> {
  // ...
}

// Line 103-110: findByOperator returns array (GOOD!)
async findByOperator(operatorId: number): Promise<OperatorDocumentDto[]> {
  // ...
}
```

### Issues Found

- [x] **Returns null**: `findById` and `update` return `| null` instead of throwing (lines 95, 139)
- [x] **DTO defined in service**: OperatorDocumentDto interface in service file (lines 6-20) instead of separate DTO file
- [ ] **Good transformation**: Has `transformToDto` method (lines 30-48)
- [ ] **Good pagination**: findAll returns proper paginated shape

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
// 1. Move OperatorDocumentDto to src/types/dto/operator-document.dto.ts (already exists!)
// 2. Import DTO from separate file
import {
  OperatorDocumentDto,
  OperatorDocumentCreateDto,
  OperatorDocumentUpdateDto,
  toOperatorDocumentDto,
} from '../types/dto/operator-document.dto';

// 3. Remove null returns, throw NotFoundError instead
async findById(tenantId: number, id: number): Promise<OperatorDocumentDto> {
  const entity = await this.repository.findOne({
    where: { id },
    relations: ['trabajador'],
  });

  if (!entity) {
    throw new NotFoundError('Operator document', id, { tenantId });
  }

  return toOperatorDocumentDto(entity);
}
```

**Effort**: 🟢 Small (1 hour)

---

## Tenant Context Analysis

### Current Pattern

```typescript
// Line 50-93: No tenantId parameter
async findAll(filters?: {
  trabajadorId?: number;
  tipoDocumento?: string;
  page?: number;
  limit?: number;
}): Promise<{...}> {
  // No tenant_id filtering
}

// Line 95-101: No tenantId parameter
async findById(id: number): Promise<OperatorDocumentDto | null> {
  const entity = await this.repository.findOne({
    where: { id },  // ❌ No tenant_id filter
    relations: ['trabajador'],
  });
  return entity ? this.transformToDto(entity) : null;
}
```

### Issues Found

- [x] **No Tenant Parameter**: All 7 methods lack `tenantId` parameter
- [x] **Missing Tenant Filter**: No tenant_id filtering in queries
- [x] **Cross-Tenant Risk**: Potential to access other tenant's documents
- [x] **No Tenant in DTO**: OperatorDocumentDto doesn't include tenant context

**Database Limitation**: The `rrhh.documento_trabajador` table has NO `tenant_id` column (confirmed in schema). Must add TODO comments until schema migration.

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

// Add tenantId to all methods
async findAll(
  tenantId: number,
  filters?: {
    trabajadorId?: number;
    tipoDocumento?: string;
  },
  page = 1,
  limit = 10
): Promise<{ data: OperatorDocumentDto[]; total: number }> {
  try {
    Logger.info('Listing operator documents', { tenantId, filters, page, limit, context: 'OperatorDocumentService.findAll' });

    const query = this.repository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.trabajador', 'trabajador');

    // TODO: Add tenant_id filter when column exists in rrhh.documento_trabajador
    // query.andWhere('doc.tenant_id = :tenantId', { tenantId });

    if (filters?.trabajadorId) {
      query.andWhere('doc.trabajadorId = :trabajadorId', { trabajadorId: filters.trabajadorId });
    }

    if (filters?.tipoDocumento) {
      query.andWhere('doc.tipoDocumento = :tipoDocumento', { tipoDocumento: filters.tipoDocumento });
    }

    const [entities, total] = await query
      .orderBy('doc.fechaVencimiento', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    Logger.info('Operator documents listed', { tenantId, count: entities.length, total, context: 'OperatorDocumentService.findAll' });

    return {
      data: entities.map((e) => this.transformToDto(e)),
      total,
    };
  } catch (error) {
    Logger.error('Error listing operator documents', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      filters,
      context: 'OperatorDocumentService.findAll',
    });
    throw error;
  }
}

async findById(tenantId: number, id: number): Promise<OperatorDocumentDto> {
  // TODO: Add tenant_id filter
}

async create(tenantId: number, data: OperatorDocumentCreateDto): Promise<OperatorDocumentDto> {
  // TODO: Validate trabajador belongs to tenantId
}

async update(tenantId: number, id: number, data: OperatorDocumentUpdateDto): Promise<OperatorDocumentDto> {
  // TODO: Add tenant_id filter to verify ownership
}

async delete(tenantId: number, id: number): Promise<void> {
  // TODO: Add tenant_id filter to verify ownership
}
```

**Effort**: 🟡 Medium (2-3 hours)

---

## Query Pattern Analysis

### Current Pattern

```typescript
// Line 66-84: QueryBuilder used (GOOD!)
const query = this.repository
  .createQueryBuilder('doc')
  .leftJoinAndSelect('doc.trabajador', 'trabajador');

if (filters?.trabajadorId) {
  query.andWhere('doc.trabajadorId = :trabajadorId', { trabajadorId: filters.trabajadorId });
}

if (filters?.tipoDocumento) {
  query.andWhere('doc.tipoDocumento = :tipoDocumento', {
    tipoDocumento: filters.tipoDocumento,
  });
}

const [entities, total] = await query
  .orderBy('doc.fechaVencimiento', 'ASC')
  .skip(skip)
  .take(limit)
  .getManyAndCount();

// Line 116-124: findExpiring uses QueryBuilder (GOOD!)
const entities = await this.repository
  .createQueryBuilder('doc')
  .leftJoinAndSelect('doc.trabajador', 'trabajador')
  .where('doc.fechaVencimiento IS NOT NULL')
  .andWhere('doc.fechaVencimiento <= :futureDate', { futureDate })
  .andWhere('doc.fechaVencimiento >= CURRENT_DATE')
  .orderBy('doc.fechaVencimiento', 'ASC')
  .getMany();
```

### Issues Found

- [ ] **Good QueryBuilder usage**: Uses QueryBuilder with parameterized queries
- [ ] **Good pagination**: Implements skip/take pagination
- [ ] **Good filtering**: Dynamic filtering for trabajadorId and tipoDocumento
- [ ] **Good joins**: Loads trabajador relation efficiently
- [x] **Inconsistent pagination format**: findAll returns custom shape instead of `{ data, total }` (should simplify)
- [x] **findExpiring not paginated**: Could return many documents without pagination

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

// 1. Simplify pagination shape (like employee/operator services)
async findAll(
  tenantId: number,
  filters?: {
    trabajadorId?: number;
    tipoDocumento?: string;
  },
  page = 1,
  limit = 10
): Promise<{ data: OperatorDocumentDto[]; total: number }> {
  // Return simple { data, total } shape
  // Let controller add page/limit/totalPages
}

// 2. Add pagination to findExpiring
async findExpiring(
  tenantId: number,
  daysAhead: number = 30,
  page = 1,
  limit = 50
): Promise<{ data: OperatorDocumentDto[]; total: number }> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const query = this.repository
    .createQueryBuilder('doc')
    .leftJoinAndSelect('doc.trabajador', 'trabajador')
    .where('doc.fechaVencimiento IS NOT NULL')
    .andWhere('doc.fechaVencimiento <= :futureDate', { futureDate })
    .andWhere('doc.fechaVencimiento >= CURRENT_DATE')
    .orderBy('doc.fechaVencimiento', 'ASC');

  // TODO: Add tenant_id filter

  const [entities, total] = await query
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data: entities.map((e) => this.transformToDto(e)),
    total,
  };
}
```

**Effort**: 🟢 Small (1 hour)

---

## Business Logic Analysis

### Current Business Rules

1. **Document Expiration Tracking**: Documents have fecha_vencimiento and can be queried by expiration status
2. **Document Types**: tipo_documento field (e.g., 'DNI', 'LICENCIA', 'CERTIFICADO')
3. **File Storage**: archivo_url stores document file location (URL or path)
4. **Soft Relations**: Links to trabajador (operator) entity

### Issues Found

- [x] **No File Validation**: No validation of archivo_url (file exists, path security, etc.)
- [x] **No Duplicate Checks**: Can create multiple documents with same tipo_documento for same trabajador
- [x] **No Expiration Logic**: No business rules for expired documents (block operations, notifications, etc.)
- [x] **No Document Type Validation**: tipo_documento accepts any string (should be enum/whitelist)
- [x] **No trabajador Existence Check**: create() doesn't verify trabajador exists
- [x] **No File Cleanup**: delete() doesn't remove archivo_url file from storage

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { ConflictError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';

// Define valid document types
const VALID_DOCUMENT_TYPES = [
  'DNI',
  'LICENCIA_CONDUCIR',
  'CERTIFICADO_OPERACION',
  'SCTR',
  'EXAMEN_MEDICO',
  'CAPACITACION',
  'OTRO',
];

async create(tenantId: number, data: OperatorDocumentCreateDto): Promise<OperatorDocumentDto> {
  try {
    Logger.info('Creating operator document', { tenantId, data, context: 'OperatorDocumentService.create' });

    // Business rule: Validate document type
    if (!VALID_DOCUMENT_TYPES.includes(data.tipo_documento)) {
      throw new BusinessRuleError(
        'Invalid document type',
        { tipo_documento: data.tipo_documento, valid_types: VALID_DOCUMENT_TYPES }
      );
    }

    // Business rule: Check trabajador exists
    // TODO: Verify trabajador belongs to tenantId
    const trabajadorExists = await this.trabajadorRepository.findOne({
      where: { id: data.trabajador_id },
    });
    if (!trabajadorExists) {
      throw new NotFoundError('Trabajador', data.trabajador_id, { tenantId });
    }

    // Business rule: Prevent duplicate active documents (same type for same operator)
    const existing = await this.repository.findOne({
      where: {
        trabajadorId: data.trabajador_id,
        tipoDocumento: data.tipo_documento,
        // TODO: Add tenant_id filter
      },
    });
    if (existing && existing.fechaVencimiento && existing.fechaVencimiento > new Date()) {
      throw new ConflictError('Operator document', {
        message: 'Active document of this type already exists',
        trabajador_id: data.trabajador_id,
        tipo_documento: data.tipo_documento,
      });
    }

    // Business rule: Validate archivo_url if provided
    if (data.archivo_url) {
      // Check file path doesn't contain directory traversal
      if (data.archivo_url.includes('..') || data.archivo_url.includes('~')) {
        throw new BusinessRuleError('Invalid file path', { archivo_url: data.archivo_url });
      }
    }

    const document = this.repository.create({
      trabajadorId: data.trabajador_id,
      tipoDocumento: data.tipo_documento,
      numeroDocumento: data.numero_documento,
      fechaEmision: data.fecha_emision ? new Date(data.fecha_emision) : undefined,
      fechaVencimiento: data.fecha_vencimiento ? new Date(data.fecha_vencimiento) : undefined,
      archivoUrl: data.archivo_url,
      observaciones: data.observaciones,
    });

    const saved = await this.repository.save(document);

    // Reload with relations
    const entity = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['trabajador'],
    });

    Logger.info('Operator document created', { tenantId, id: saved.id, context: 'OperatorDocumentService.create' });
    return this.transformToDto(entity!);
  } catch (error) {
    Logger.error('Error creating operator document', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      data,
      context: 'OperatorDocumentService.create',
    });
    throw error;
  }
}

async delete(tenantId: number, id: number): Promise<void> {
  try {
    Logger.info('Deleting operator document', { tenantId, id, context: 'OperatorDocumentService.delete' });

    const entity = await this.findById(tenantId, id);

    // Business rule: Delete file from storage if exists
    if (entity.archivo_url) {
      // TODO: Implement file deletion from storage
      // await this.fileStorageService.delete(entity.archivo_url);
      Logger.info('File deletion pending', { archivo_url: entity.archivo_url });
    }

    const result = await this.repository.delete(id);
    // TODO: Add tenant_id filter when column exists

    if ((result.affected || 0) === 0) {
      throw new NotFoundError('Operator document', id, { tenantId });
    }

    Logger.info('Operator document deleted', { tenantId, id, context: 'OperatorDocumentService.delete' });
  } catch (error) {
    Logger.error('Error deleting operator document', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'OperatorDocumentService.delete',
    });
    throw error;
  }
}
```

**Effort**: 🟡 Medium (2-3 hours for validation, file handling needs separate implementation)

---

## Logging Analysis

### Current Logging

```typescript
// NO LOGGING PRESENT
// Service has no Logger.info or Logger.error calls
```

### Issues Found

- [x] **No Logging**: Service has no logging at all
- [x] **No Context**: Can't trace method execution
- [x] **No Error Logging**: Errors not logged
- [x] **No Audit Trail**: No log of document creation/deletion

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import Logger from '../utils/logger';

async findAll(
  tenantId: number,
  filters?: FilterDto,
  page = 1,
  limit = 10
): Promise<{ data: OperatorDocumentDto[]; total: number }> {
  try {
    Logger.info('Listing operator documents', {
      tenantId,
      filters,
      page,
      limit,
      context: 'OperatorDocumentService.findAll',
    });

    // ... query logic

    Logger.info('Operator documents listed', {
      tenantId,
      count: entities.length,
      total,
      context: 'OperatorDocumentService.findAll',
    });

    return { data, total };
  } catch (error) {
    Logger.error('Error listing operator documents', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      filters,
      page,
      limit,
      context: 'OperatorDocumentService.findAll',
    });
    throw error;
  }
}

// Apply to all 7 methods: findAll, findById, findByOperator, findExpiring, create, update, delete
```

**Effort**: 🟢 Small (1 hour)

---

## Testing Analysis

### Current Test Coverage

- **Test File Exists**: ❌ No (`operator-document.service.spec.ts` does not exist)
- **Test Count**: 0 tests
- **Coverage**: 0%
- **Tests Run**: N/A

### Issues Found

- [x] **No Test File**: Service has no test file (deferred to Phase 21)
- [x] **No Business Rule Tests**: Document type validation, expiration logic, duplicate checks
- [x] **No Tenant Isolation Tests**: Cross-tenant document access
- [x] **No Error Tests**: NotFoundError, ConflictError scenarios

### Recommendations

Testing deferred to Phase 21 per project plan.

**Effort**: 🟡 Medium (3-4 hours to achieve 70%+ coverage)

---

## Summary

### Critical Issues (Fix First) 🔴

1. **No tenant context** - All methods lack tenantId parameter (security risk)
2. **Returns null instead of throwing** - findById, update return null (inconsistent error handling)
3. **No logging** - Can't trace execution or debug issues

### Important Issues (Fix Next) 🟡

4. **No business validation** - Missing document type validation, duplicate checks, file path validation
5. **Pagination inconsistency** - findAll returns custom shape, findExpiring not paginated
6. **DTO in service file** - Should use separate DTO file (already exists!)

### Nice to Have (Optional) 🟢

7. **File cleanup on delete** - Should remove archivo_url file from storage
8. **Document expiration business rules** - Block operations on expired documents

---

## Action Plan

### Step 1: Add Tenant Context (2 hours)

- [x] Add `tenantId` parameter to all 7 methods
- [x] Add TODO comments for tenant_id filtering
- [x] Update method signatures
- [x] Document database limitation (no tenant_id column)

### Step 2: Replace null Returns with Errors (1 hour)

- [x] Import NotFoundError
- [x] Update findById to throw NotFoundError
- [x] Update update method to throw NotFoundError
- [x] Update delete method to throw NotFoundError and verify affected rows

### Step 3: Add Logging (1.5 hours)

- [x] Import Logger
- [x] Add Logger.info at method start (all 7 methods)
- [x] Add Logger.info on success (all 7 methods)
- [x] Add try/catch with Logger.error (all 7 methods)

### Step 4: Simplify Pagination (1 hour)

- [x] Change findAll to return `{ data, total }` instead of custom shape
- [x] Add pagination to findExpiring method
- [x] Update controller to handle simplified response

### Step 5: Use Separate DTO File (30 min)

- [x] Import OperatorDocumentDto from existing DTO file
- [x] Remove DTO interface from service (lines 6-20)
- [x] Import transformation functions (if created in DTO file)

### Step 6: Add Business Validation (2 hours)

- [x] Add document type validation (VALID_DOCUMENT_TYPES enum)
- [x] Add trabajador existence check
- [x] Add duplicate document check (same type, same operator, active)
- [x] Add archivo_url path validation (no directory traversal)
- [x] Add file cleanup TODO in delete method

### Step 7: Update Controller (1 hour)

- [x] Pass tenantId to all service methods
- [x] Catch NotFoundError → 404
- [x] Catch ConflictError → 409
- [x] Catch BusinessRuleError → 400

---

## Estimated Total Effort

**Overall Complexity**: 🟡 Medium (4-5 hours total)

**Recommended Approach**:

1. Add tenant context (security critical) ✅
2. Replace null returns with errors (consistency) ✅
3. Add logging (observability) ✅
4. Simplify pagination (consistency) ✅
5. Use separate DTO file (code organization) ✅
6. Add business validation (data integrity) ✅
7. Update controller (complete the flow) ✅

---

## Sign-off

**Audit Complete**: January 18, 2026  
**Issues Identified**: 8 (3 critical, 3 important, 2 nice-to-have)  
**Tests Added**: ❌ No (deferred to Phase 21)  
**Test Coverage**: 0% → 0% (deferred)  
**All Tests Passing**: ⏭️ Skipped (no tests yet)  
**Ready for Refactoring**: ✅ Yes

---

**Next Service**: `operator-availability.service.ts` (Priority 2, moderate)
