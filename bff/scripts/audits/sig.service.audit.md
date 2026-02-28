# Service Audit: SIG (Integrated Management System) Service

**File**: `backend/src/services/sig.service.ts`  
**Date**: January 18, 2026  
**Audited By**: OpenCode Agent  
**Status**: ⚠️ Issues Found

---

## Overview

- **Lines of Code**: 31
- **Public Methods**: 5
- **Has Tests**: ❌ No (`sig.service.spec.ts` does not exist)
- **Test Coverage**: 0%
- **Complexity**: 🟢 Simple (Very basic CRUD)

---

## Error Handling Analysis

### Current Pattern

```typescript
async getDocumentById(id: string) {
  return this.sigRepository.findOneBy({ id: parseInt(id) });
}

async updateDocument(id: string, data: Partial<SigDocument>) {
  await this.sigRepository.update(parseInt(id), data);
  return this.getDocumentById(id);
}

async deleteDocument(id: string) {
  await this.sigRepository.delete(parseInt(id));
}
```

### Issues Found

- [x] **Returns null Instead of Throwing**: `getDocumentById` returns `null` if not found (should throw NotFoundError)
- [x] **No Error Handling**: No try/catch blocks
- [x] **No Error Logging**: Missing error logging with context
- [x] **Silent Failures**: `updateDocument` could return `null` if document doesn't exist (cascade from getDocumentById)
- [x] **Delete Returns void**: No indication if delete succeeded or entity didn't exist

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { NotFoundError } from '../errors/http.errors';
import Logger from '../utils/logger';

async getDocumentById(tenantId: number, id: string): Promise<SigDocumentDto> {
  try {
    const document = await this.sigRepository.findOne({
      where: { id: parseInt(id), tenant_id: tenantId }
    });

    if (!document) {
      throw new NotFoundError('SIG Document', id);
    }

    Logger.info('SIG document retrieved successfully', {
      tenantId,
      documentId: id,
      context: 'SigService.getDocumentById'
    });

    return toSigDocumentDto(document);
  } catch (error) {
    Logger.error('Error retrieving SIG document', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      documentId: id,
      context: 'SigService.getDocumentById'
    });
    throw error;
  }
}
```

**Effort**: 🟢 Small (1-2 hours)

---

## Return Type Analysis

### Current Pattern

```typescript
async getAllDocuments() {
  return this.sigRepository.find({
    order: { createdAt: 'DESC' },
  });
}

async createDocument(data: Partial<SigDocument>) {
  const document = this.sigRepository.create(data);
  return this.sigRepository.save(document);
}

async getDocumentById(id: string) {
  return this.sigRepository.findOneBy({ id: parseInt(id) });
}
```

### Issues Found

- [x] **Returns Raw Entities**: All methods return `SigDocument` entity directly instead of DTOs
- [x] **No Pagination Shape**: `getAllDocuments` doesn't return `{ data, total }` format
- [x] **Missing DTO Types**: No DTO types defined for SIG documents
- [x] **Inconsistent with Standards**: Doesn't follow architecture pattern of explicit DTO transformation

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

// Create DTO file: backend/src/types/dto/sig-document.dto.ts
export interface SigDocumentListDto {
  id: number;
  titulo: string;
  tipo_documento: string;
  estado: string;
  created_at: string;
}

export interface SigDocumentDetailDto extends SigDocumentListDto {
  descripcion?: string;
  version?: string;
  archivo_url?: string;
  updated_at: string;
}

export function toSigDocumentListDto(entity: SigDocument): SigDocumentListDto {
  return {
    id: entity.id,
    titulo: entity.titulo,
    tipo_documento: entity.tipoDocumento,
    estado: entity.estado,
    created_at: entity.createdAt.toISOString(),
  };
}

export function toSigDocumentDetailDto(entity: SigDocument): SigDocumentDetailDto {
  return {
    ...toSigDocumentListDto(entity),
    descripcion: entity.descripcion,
    version: entity.version,
    archivo_url: entity.archivoUrl,
    updated_at: entity.updatedAt.toISOString(),
  };
}

// Then in service:
async getAllDocuments(
  tenantId: number,
  page = 1,
  limit = 10
): Promise<{ data: SigDocumentListDto[]; total: number }> {
  const [documents, total] = await this.sigRepository.findAndCount({
    where: { tenant_id: tenantId },
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data: documents.map(toSigDocumentListDto),
    total,
  };
}

async getDocumentById(tenantId: number, id: string): Promise<SigDocumentDetailDto> {
  const document = await this.sigRepository.findOne({
    where: { id: parseInt(id), tenant_id: tenantId }
  });

  if (!document) {
    throw new NotFoundError('SIG Document', id);
  }

  return toSigDocumentDetailDto(document);
}
```

**Effort**: 🟢 Small (1 hour - create DTO file + update 5 methods)

---

## Tenant Context Analysis

### Current Pattern

```typescript
async getAllDocuments() {
  return this.sigRepository.find({
    order: { createdAt: 'DESC' },
  });
}

async getDocumentById(id: string) {
  return this.sigRepository.findOneBy({ id: parseInt(id) });
}

async updateDocument(id: string, data: Partial<SigDocument>) {
  await this.sigRepository.update(parseInt(id), data);
  return this.getDocumentById(id);
}

async deleteDocument(id: string) {
  await this.sigRepository.delete(parseInt(id));
}
```

### Issues Found

- [x] **No Tenant Parameter**: No methods accept `tenantId` parameter
- [x] **Missing Tenant Filter**: No queries filter by `tenant_id`
- [x] **CRITICAL Cross-Tenant Risk**: User from Company A could access SIG documents from Company B
- [x] **No Tenant Verification**: Update/delete don't verify tenant ownership before modifying

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

async getAllDocuments(
  tenantId: number,
  page = 1,
  limit = 10
): Promise<{ data: SigDocumentListDto[]; total: number }> {
  // TODO: Verify sig_document table has tenant_id column
  // If not, this is a schema limitation (see fuel.service.ts for reference)
  const [documents, total] = await this.sigRepository.findAndCount({
    where: { tenant_id: tenantId },  // ✅ Always filter by tenant
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data: documents.map(toSigDocumentListDto),
    total,
  };
}

async getDocumentById(tenantId: number, id: string): Promise<SigDocumentDetailDto> {
  const document = await this.sigRepository.findOne({
    where: {
      id: parseInt(id),
      tenant_id: tenantId  // ✅ Verify tenant ownership
    }
  });

  if (!document) {
    throw new NotFoundError('SIG Document', id);
  }

  return toSigDocumentDetailDto(document);
}

async updateDocument(
  tenantId: number,
  id: string,
  data: Partial<SigDocumentUpdateDto>
): Promise<SigDocumentDetailDto> {
  // First verify document exists and belongs to tenant
  const document = await this.getDocumentById(tenantId, id);

  // Update
  await this.sigRepository.update(parseInt(id), data);

  // Return updated document
  return this.getDocumentById(tenantId, id);
}

async deleteDocument(tenantId: number, id: string): Promise<void> {
  // Verify document exists and belongs to tenant
  await this.getDocumentById(tenantId, id);

  // Soft delete or hard delete
  await this.sigRepository.delete(parseInt(id));

  Logger.info('SIG document deleted successfully', {
    tenantId,
    documentId: id,
    context: 'SigService.deleteDocument'
  });
}
```

**Effort**: 🟢 Small (30 min - add tenantId parameter to all 5 methods)

**⚠️ CRITICAL NOTE**: Need to verify if `sig_document` table has `tenant_id` column. If not, this is a database schema limitation (same as fuel service).

---

## Query Pattern Analysis

### Current Pattern

```typescript
async getAllDocuments() {
  return this.sigRepository.find({
    order: { createdAt: 'DESC' },
  });
}

async getDocumentById(id: string) {
  return this.sigRepository.findOneBy({ id: parseInt(id) });
}
```

### Issues Found

- [x] **No Pagination**: `getAllDocuments` returns ALL documents (could be hundreds/thousands)
- [x] **Simple find() Only**: Uses basic `find()` - fine for simple queries, but no filtering/search
- [x] **No Dynamic Sorting**: Hardcoded `createdAt DESC`
- [x] **No Relations Loaded**: If SIG documents have relations (author, category), they're not loaded

### Recommendations

For a service this simple, the current query patterns are acceptable AFTER adding:

1. Pagination (mandatory)
2. Tenant filtering (critical)

Future enhancements (not blocking):

```typescript
async getAllDocuments(
  tenantId: number,
  filters?: {
    tipo_documento?: string;
    estado?: string;
    search?: string;
  },
  page = 1,
  limit = 10
): Promise<{ data: SigDocumentListDto[]; total: number }> {
  const queryBuilder = this.sigRepository
    .createQueryBuilder('sig')
    .where('sig.tenant_id = :tenantId', { tenantId });

  // Dynamic filters
  if (filters?.tipo_documento) {
    queryBuilder.andWhere('sig.tipo_documento = :tipo', { tipo: filters.tipo_documento });
  }

  if (filters?.estado) {
    queryBuilder.andWhere('sig.estado = :estado', { estado: filters.estado });
  }

  if (filters?.search) {
    queryBuilder.andWhere(
      '(sig.titulo ILIKE :search OR sig.descripcion ILIKE :search)',
      { search: `%${filters.search}%` }
    );
  }

  queryBuilder
    .orderBy('sig.created_at', 'DESC')
    .skip((page - 1) * limit)
    .take(limit);

  const [documents, total] = await queryBuilder.getManyAndCount();

  return {
    data: documents.map(toSigDocumentListDto),
    total,
  };
}
```

**Effort**: 🟡 Medium (1-2 hours for advanced filters - can skip for now)

---

## Business Logic Analysis

### Current Business Rules

Based on SIG (Sistema Integrado de Gestión - Integrated Management System) context:

**Expected Business Rules**:

- SIG documents have lifecycle: DRAFT → REVIEW → APPROVED → PUBLISHED → ARCHIVED
- Only approved documents should be visible to non-admin users
- Document versions should be tracked
- Cannot delete published/approved documents (must archive)
- Document types might include: ISO procedures, work instructions, forms, policies

### Issues Found

- [x] **No Business Validation**: No validation of document state, version, or lifecycle
- [x] **No State Transitions**: No methods for approve/publish/archive workflow
- [x] **No Version Control**: No tracking of document versions
- [x] **Dangerous Delete**: `deleteDocument` allows deleting any document regardless of state
- [x] **No Access Control**: No differentiation between public/internal documents

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { BusinessRuleError } from '../errors/business.error';

// Add to service:
async createDocument(
  tenantId: number,
  data: SigDocumentCreateDto
): Promise<SigDocumentDetailDto> {
  try {
    // Business rule: New documents start as DRAFT
    const document = this.sigRepository.create({
      ...data,
      tenant_id: tenantId,
      estado: 'DRAFT',
      version: '1.0',
    });

    const saved = await this.sigRepository.save(document);

    Logger.info('SIG document created successfully', {
      tenantId,
      documentId: saved.id,
      context: 'SigService.createDocument'
    });

    return toSigDocumentDetailDto(saved);
  } catch (error) {
    Logger.error('Error creating SIG document', {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      context: 'SigService.createDocument'
    });
    throw error;
  }
}

async deleteDocument(tenantId: number, id: string): Promise<void> {
  const document = await this.getDocumentById(tenantId, id);

  // Business rule: Cannot delete approved or published documents
  if (['APPROVED', 'PUBLISHED'].includes(document.estado)) {
    throw new BusinessRuleError(
      'Cannot delete approved or published SIG documents',
      'CANNOT_DELETE_APPROVED_DOCUMENT',
      { documentId: id, estado: document.estado },
      'Archive the document instead of deleting it'
    );
  }

  await this.sigRepository.delete(parseInt(id));

  Logger.info('SIG document deleted successfully', {
    tenantId,
    documentId: id,
    context: 'SigService.deleteDocument'
  });
}

// New method for state transitions:
async approveDocument(
  tenantId: number,
  id: string,
  approvedBy: string
): Promise<SigDocumentDetailDto> {
  const document = await this.getDocumentById(tenantId, id);

  // Business rule: Can only approve DRAFT or REVIEW documents
  if (!['DRAFT', 'REVIEW'].includes(document.estado)) {
    throw new BusinessRuleError(
      'Can only approve documents in DRAFT or REVIEW state',
      'INVALID_STATE_FOR_APPROVAL',
      { documentId: id, currentState: document.estado },
      'Allowed states: DRAFT, REVIEW'
    );
  }

  await this.sigRepository.update(parseInt(id), {
    estado: 'APPROVED',
    approved_by: approvedBy,
    approved_at: new Date(),
  });

  return this.getDocumentById(tenantId, id);
}
```

**Effort**: 🟡 Medium (2-3 hours - add lifecycle methods)

**Note**: Can implement basic validation now, full workflow later.

---

## Logging Analysis

### Current Logging

```typescript
// NO LOGGING PRESENT IN SERVICE
```

### Issues Found

- [x] **No Logging**: Service has no logging at all
- [x] **No Error Tracking**: Errors not logged before propagating
- [x] **No Audit Trail**: No record of who created/modified/deleted documents

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import Logger from '../utils/logger';

async createDocument(tenantId: number, data: SigDocumentCreateDto): Promise<SigDocumentDetailDto> {
  try {
    Logger.info('Creating SIG document', {
      tenantId,
      data,
      context: 'SigService.createDocument'
    });

    const document = this.sigRepository.create({
      ...data,
      tenant_id: tenantId,
      estado: 'DRAFT',
    });

    const saved = await this.sigRepository.save(document);

    Logger.info('SIG document created successfully', {
      tenantId,
      documentId: saved.id,
      titulo: saved.titulo,
      context: 'SigService.createDocument'
    });

    return toSigDocumentDetailDto(saved);
  } catch (error) {
    Logger.error('Error creating SIG document', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      data,
      context: 'SigService.createDocument'
    });
    throw error;
  }
}

// Apply same pattern to all 5 methods:
// - getAllDocuments (info on retrieve)
// - getDocumentById (info on retrieve, error on not found)
// - createDocument (info on create, error on failure)
// - updateDocument (info on update, error on failure)
// - deleteDocument (info on delete, error on failure)
```

**Effort**: 🟢 Small (30 min - wrap all 5 methods with try/catch + logging)

---

## Testing Analysis

### Current Test Coverage

- **Test File Exists**: ❌ No (`sig.service.spec.ts` does not exist)
- **Test Count**: 0 tests
- **Coverage**: 0%
- **Tests Run**: N/A

### Issues Found

- [x] **No Test File**: Service has no test file
- [x] **Zero Coverage**: No automated verification
- [x] **No Tenant Isolation Tests**: Critical security issue not validated
- [x] **No Business Rule Tests**: Lifecycle/state transitions not tested

### Recommendations

```typescript
// ✅ RECOMMENDED TEST STRUCTURE
// File: backend/src/services/sig.service.spec.ts

import { SigService } from './sig.service';
import { AppDataSource } from '../config/database.config';
import { SigDocument } from '../models/sig-document.model';
import { NotFoundError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';

describe('SigService', () => {
  let service: SigService;
  let repository: any;
  const TENANT_ID = 1;
  const OTHER_TENANT_ID = 2;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    service = new SigService();
    repository = AppDataSource.getRepository(SigDocument);
    await repository.delete({});
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('createDocument', () => {
    it('should create SIG document successfully', async () => {
      const data = {
        titulo: 'ISO 9001 Procedure',
        tipo_documento: 'PROCEDURE',
        descripcion: 'Quality management procedure',
      };

      const result = await service.createDocument(TENANT_ID, data);

      expect(result.id).toBeDefined();
      expect(result.titulo).toBe('ISO 9001 Procedure');
      expect(result.estado).toBe('DRAFT');
      expect(result.tenant_id).toBe(TENANT_ID);
    });

    it('should set initial version to 1.0', async () => {
      const data = { titulo: 'Test Document', tipo_documento: 'FORM' };
      const result = await service.createDocument(TENANT_ID, data);

      expect(result.version).toBe('1.0');
    });
  });

  describe('getAllDocuments', () => {
    it('should return paginated SIG documents for tenant', async () => {
      await service.createDocument(TENANT_ID, { titulo: 'Doc 1', tipo_documento: 'PROCEDURE' });
      await service.createDocument(TENANT_ID, { titulo: 'Doc 2', tipo_documento: 'FORM' });

      const result = await service.getAllDocuments(TENANT_ID, 1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0].titulo).toBeDefined();
    });

    it('should not return other tenant documents (CRITICAL)', async () => {
      await service.createDocument(TENANT_ID, { titulo: 'My Doc', tipo_documento: 'PROCEDURE' });
      await service.createDocument(OTHER_TENANT_ID, {
        titulo: 'Their Doc',
        tipo_documento: 'FORM',
      });

      const result = await service.getAllDocuments(TENANT_ID, 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].titulo).toBe('My Doc');
    });

    it('should paginate results correctly', async () => {
      for (let i = 1; i <= 15; i++) {
        await service.createDocument(TENANT_ID, { titulo: `Doc ${i}`, tipo_documento: 'FORM' });
      }

      const page1 = await service.getAllDocuments(TENANT_ID, 1, 10);
      const page2 = await service.getAllDocuments(TENANT_ID, 2, 10);

      expect(page1.data).toHaveLength(10);
      expect(page2.data).toHaveLength(5);
      expect(page1.total).toBe(15);
      expect(page2.total).toBe(15);
    });

    it('should sort by created_at DESC', async () => {
      await service.createDocument(TENANT_ID, { titulo: 'First', tipo_documento: 'FORM' });
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
      await service.createDocument(TENANT_ID, { titulo: 'Second', tipo_documento: 'FORM' });

      const result = await service.getAllDocuments(TENANT_ID, 1, 10);

      expect(result.data[0].titulo).toBe('Second'); // Most recent first
      expect(result.data[1].titulo).toBe('First');
    });
  });

  describe('getDocumentById', () => {
    it('should return SIG document by ID', async () => {
      const created = await service.createDocument(TENANT_ID, {
        titulo: 'Test',
        tipo_documento: 'FORM',
      });
      const found = await service.getDocumentById(TENANT_ID, created.id.toString());

      expect(found.id).toBe(created.id);
      expect(found.titulo).toBe('Test');
    });

    it('should throw NotFoundError if document not found', async () => {
      await expect(service.getDocumentById(TENANT_ID, '99999')).rejects.toThrow(NotFoundError);
    });

    it('should not return document from other tenant (CRITICAL)', async () => {
      const created = await service.createDocument(TENANT_ID, {
        titulo: 'Test',
        tipo_documento: 'FORM',
      });

      await expect(service.getDocumentById(OTHER_TENANT_ID, created.id.toString())).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('updateDocument', () => {
    it('should update SIG document successfully', async () => {
      const created = await service.createDocument(TENANT_ID, {
        titulo: 'Original',
        tipo_documento: 'FORM',
      });

      const updated = await service.updateDocument(TENANT_ID, created.id.toString(), {
        titulo: 'Updated Title',
      });

      expect(updated.titulo).toBe('Updated Title');
    });

    it('should throw NotFoundError if document not found', async () => {
      await expect(service.updateDocument(TENANT_ID, '99999', { titulo: 'Test' })).rejects.toThrow(
        NotFoundError
      );
    });

    it('should not update document from other tenant (CRITICAL)', async () => {
      const created = await service.createDocument(TENANT_ID, {
        titulo: 'Test',
        tipo_documento: 'FORM',
      });

      await expect(
        service.updateDocument(OTHER_TENANT_ID, created.id.toString(), { titulo: 'Hacked' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteDocument', () => {
    it('should delete DRAFT document successfully', async () => {
      const created = await service.createDocument(TENANT_ID, {
        titulo: 'Test',
        tipo_documento: 'FORM',
      });

      await service.deleteDocument(TENANT_ID, created.id.toString());

      await expect(service.getDocumentById(TENANT_ID, created.id.toString())).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw BusinessRuleError if deleting APPROVED document', async () => {
      const created = await service.createDocument(TENANT_ID, {
        titulo: 'Test',
        tipo_documento: 'FORM',
      });

      // Manually set to APPROVED
      await repository.update(created.id, { estado: 'APPROVED' });

      await expect(service.deleteDocument(TENANT_ID, created.id.toString())).rejects.toThrow(
        BusinessRuleError
      );
    });

    it('should not delete document from other tenant (CRITICAL)', async () => {
      const created = await service.createDocument(TENANT_ID, {
        titulo: 'Test',
        tipo_documento: 'FORM',
      });

      await expect(service.deleteDocument(OTHER_TENANT_ID, created.id.toString())).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('approveDocument', () => {
    it('should approve DRAFT document', async () => {
      const created = await service.createDocument(TENANT_ID, {
        titulo: 'Test',
        tipo_documento: 'FORM',
      });

      const approved = await service.approveDocument(
        TENANT_ID,
        created.id.toString(),
        'admin@test.com'
      );

      expect(approved.estado).toBe('APPROVED');
      expect(approved.approved_by).toBe('admin@test.com');
      expect(approved.approved_at).toBeDefined();
    });

    it('should throw BusinessRuleError if already PUBLISHED', async () => {
      const created = await service.createDocument(TENANT_ID, {
        titulo: 'Test',
        tipo_documento: 'FORM',
      });
      await repository.update(created.id, { estado: 'PUBLISHED' });

      await expect(
        service.approveDocument(TENANT_ID, created.id.toString(), 'admin@test.com')
      ).rejects.toThrow(BusinessRuleError);
    });
  });
});
```

**Test Counts**:

- `createDocument`: 2 tests
- `getAllDocuments`: 4 tests (including critical tenant isolation)
- `getDocumentById`: 3 tests (including critical tenant isolation)
- `updateDocument`: 3 tests (including critical tenant isolation)
- `deleteDocument`: 3 tests (including business rule + tenant isolation)
- `approveDocument`: 2 tests

**Total**: 17 tests (targeting 80%+ coverage)

**Effort**: 🟡 Medium (2-3 hours to write all tests)

---

## Summary

### Critical Issues (Fix First) 🔴

1. **No Tenant Filtering** - Users can access SIG documents from other companies (SECURITY ISSUE)
2. **No Error Handling** - Methods return null instead of throwing NotFoundError
3. **Returns Raw Entities** - All methods return TypeORM entities instead of DTOs

### Important Issues (Fix Next) 🟡

4. **No Logging** - No audit trail of document operations
5. **No Pagination** - getAllDocuments returns ALL documents (performance issue)
6. **No Tests** - Zero test coverage (quality/confidence issue)

### Nice to Have (Optional) 🟢

7. **No Business Rules** - Missing SIG document lifecycle (approve/publish/archive workflow)
8. **No Advanced Filters** - Cannot filter by document type, estado, or search by title

---

## Action Plan

### Step 1: Tenant Context (CRITICAL - 30 min)

- [x] Add `tenantId` parameter to all 5 methods
- [x] Add `tenant_id` filter to all queries
- [x] Verify tenant ownership before update/delete
- [ ] **CHECK DATABASE**: Verify `sig_document` table has `tenant_id` column (if not, add TODO like fuel service)

### Step 2: Error Handling (30 min)

- [ ] Import custom error classes (NotFoundError, BusinessRuleError)
- [ ] Replace `return null` with `throw new NotFoundError()`
- [ ] Wrap all methods in try/catch blocks
- [ ] Add error logging to all catch blocks

### Step 3: Return Types (1 hour)

- [ ] Create `backend/src/types/dto/sig-document.dto.ts`
- [ ] Define `SigDocumentListDto` and `SigDocumentDetailDto`
- [ ] Create transformation functions (toSigDocumentListDto, toSigDocumentDetailDto)
- [ ] Update all method return types to DTOs
- [ ] Apply transformations in all methods

### Step 4: Pagination (15 min)

- [ ] Update `getAllDocuments` to accept `page` and `limit` parameters
- [ ] Change from `find()` to `findAndCount()`
- [ ] Return `{ data, total }` format
- [ ] Add skip/take logic

### Step 5: Logging (30 min)

- [ ] Import Logger utility
- [ ] Add info logs for successful operations (create, update, delete)
- [ ] Add error logs in catch blocks with context
- [ ] Include tenantId in all log messages

### Step 6: Business Validation (1 hour)

- [ ] Add `estado = 'DRAFT'` default in createDocument
- [ ] Add delete validation (cannot delete APPROVED/PUBLISHED)
- [ ] Add `approveDocument` method (optional for now)
- [ ] Document SIG lifecycle in comments

### Step 7: Controller Update (15 min)

- [ ] Update `sig.controller.ts` to extract `tenantId` from request
- [ ] Pass `tenantId` to all service method calls
- [ ] Update error handling to map NotFoundError → 404, BusinessRuleError → 422
- [ ] Test API endpoints manually

### Step 8: Testing (2-3 hours - can defer)

- [ ] Create `sig.service.spec.ts`
- [ ] Write happy path tests (5 tests)
- [ ] Write error handling tests (5 tests)
- [ ] **Write tenant isolation tests (3 CRITICAL tests)**
- [ ] Write business rule tests (4 tests)
- [ ] Aim for 80%+ coverage

### Step 9: Verify & Commit (10 min)

- [ ] Run `npm test` (should pass all existing tests + new ones)
- [ ] Run `npm run build` (verify no TypeScript errors)
- [ ] Run `npm run lint` (verify no linting errors)
- [ ] Commit with message: "refactor(sig): standardize SIG service with tenant context and error handling"
- [ ] Update `service-audit-progress.md` (mark sig.service.ts as complete)

---

## Estimated Total Effort

**Overall Complexity**: 🟢 Small (4-6 hours total)

**Breakdown**:

- Steps 1-7 (Service Refactoring): 3.5 hours
- Step 8 (Testing): 2-3 hours
- Step 9 (Verify & Commit): 0.5 hour

**Recommended Approach for This Session**:

1. **Verify database schema** first (check if tenant_id exists - CRITICAL)
2. **Complete Steps 1-7** (service refactoring) - ~3.5 hours
3. **Skip tests for now** (can batch-write tests later across multiple services)
4. **Verify & commit** - ~0.5 hour

**Total for this session**: ~4 hours (excluding tests)

---

## Database Schema Check Required

**⚠️ BEFORE STARTING** - Need to verify:

```sql
-- Check if sig_document table exists and has tenant_id
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'sig_document';

-- Expected columns:
-- - id (integer)
-- - tenant_id (integer) -- ← VERIFY THIS EXISTS
-- - titulo (varchar)
-- - tipo_documento (varchar)
-- - descripcion (text)
-- - estado (varchar)
-- - version (varchar)
-- - archivo_url (varchar)
-- - created_at (timestamp)
-- - updated_at (timestamp)
```

**If `tenant_id` doesn't exist**: Add TODO comments in service (like fuel service) and plan schema migration for later.

---

## Sign-off

**Audit Complete**: January 18, 2026  
**Issues Identified**: 8 (3 critical, 3 important, 2 nice-to-have)  
**Estimated Effort**: 4-6 hours  
**Tests Planned**: 17 tests  
**Next Action**: Check database schema, then begin Step 1 (Tenant Context)

---

**Next Service After SIG**: `export.service.ts` (utility service, 35 lines) or `inventory.service.ts` (75 lines)
