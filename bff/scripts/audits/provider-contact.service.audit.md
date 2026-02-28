# Service Audit: provider-contact.service.ts

**Date**: 2026-01-19  
**Auditor**: AI Assistant  
**Service**: ProviderContactService  
**LOC**: 197 lines  
**Complexity**: 🟡 Moderate

---

## Executive Summary

**Status**: 🟡 Requires Refactoring

The `ProviderContactService` manages provider contact information (commercial, technical, billing contacts). The service has been migrated from raw SQL to TypeORM but needs standards compliance improvements.

**Key Issues**:

- ❌ Generic `Error` instead of custom error classes (3 instances)
- ⚠️ Returns raw `ProviderContact` entities instead of DTOs (4 methods)
- ⚠️ No success logging (0/5 methods)
- ⚠️ Missing comprehensive JSDoc documentation
- ⚠️ Local `ProviderContactInput` interface duplicates DTO types
- ⚠️ No tenant_id filtering in queries (tenant context TODOs needed)

**Estimated Effort**: 1.5-2 hours

---

## Standards Compliance Checklist

### ✅ Already Compliant

- [x] Uses TypeORM Repository pattern
- [x] Error logging present (with context)
- [x] Proper database connection via AppDataSource
- [x] Basic parameter validation
- [x] Handles both snake_case and camelCase input
- [x] Returns boolean from delete method

### ❌ Non-Compliant

#### 1. Error Handling (CRITICAL)

**Issue**: Uses generic `Error` instead of custom error classes

**Locations**:

```typescript
// Line 81: findById - not found
throw new Error('Contact not found');

// Line 142: update - not found
throw new Error('Contact not found');

// Line 163: update - not found after update
throw new Error('Contact not found after update');
```

**Fix Required**:

```typescript
// Import custom errors
import { NotFoundError, ValidationError, DatabaseError } from '../errors';

// Line 81: findById
throw new NotFoundError('ProviderContact', id);

// Line 142: update
throw new NotFoundError('ProviderContact', id);

// Line 163: update (this shouldn't happen, indicates DB issue)
throw new DatabaseError('Failed to retrieve contact after update');

// Wrap repository calls in try/catch with DatabaseError
```

**Impact**: HIGH - Error responses are not standardized, harder to debug

---

#### 2. Return Types (IMPORTANT)

**Issue**: All methods return raw `ProviderContact` entities instead of DTOs

**Affected Methods**:

- `findByProviderId()` - returns `ProviderContact[]`
- `findById()` - returns `ProviderContact`
- `create()` - returns `ProviderContact`
- `update()` - returns `ProviderContact`

**Fix Required**:

```typescript
// Add ProviderContactDto to dto file
export interface ProviderContactDto {
  id: number;
  provider_id: number;
  contact_name: string;
  position?: string;
  primary_phone?: string;
  secondary_phone?: string;
  email?: string;
  secondary_email?: string;
  contact_type: string;
  is_primary: boolean;
  status: string;
  notes?: string;
  tenant_id: number;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

// Transform function
function toProviderContactDto(contact: ProviderContact): ProviderContactDto {
  return {
    id: contact.id,
    provider_id: contact.providerId,
    contact_name: contact.contactName,
    position: contact.position,
    primary_phone: contact.primaryPhone,
    secondary_phone: contact.secondaryPhone,
    email: contact.email,
    secondary_email: contact.secondaryEmail,
    contact_type: contact.contactType,
    is_primary: contact.isPrimary,
    status: contact.status,
    notes: contact.notes,
    tenant_id: contact.tenantId,
    created_by: contact.createdBy,
    updated_by: contact.updatedBy,
    created_at: contact.createdAt.toISOString(),
    updated_at: contact.updatedAt.toISOString(),
  };
}

// Update return types
async findByProviderId(providerId: number): Promise<ProviderContactDto[]>
async findById(id: number): Promise<ProviderContactDto>
async create(data: ProviderContactCreateDto): Promise<ProviderContactDto>
async update(id: number, data: ProviderContactUpdateDto): Promise<ProviderContactDto>
```

**Impact**: HIGH - Breaking API-PATTERNS.md, frontend expects snake_case DTOs

---

#### 3. Success Logging (IMPORTANT)

**Issue**: No success logging (only error logging)

**Missing Locations**:

- Line 47: `findByProviderId()` - no success log
- Line 74: `findById()` - no success log
- Line 101: `create()` - no success log
- Line 137: `update()` - no success log
- Line 183: `delete()` - no success log

**Fix Required**:

```typescript
// After successful operations, add info-level logs
Logger.info('Provider contact found', {
  contactId: contact.id,
  providerId: contact.providerId,
  contactName: contact.contactName,
  isPrimary: contact.isPrimary,
  context: 'ProviderContactService.findById',
});

Logger.info('Provider contact created successfully', {
  id: saved.id,
  providerId: saved.providerId,
  contactName: saved.contactName,
  contactType: saved.contactType,
  isPrimary: saved.isPrimary,
  context: 'ProviderContactService.create',
});

// Similar for update, delete, findByProviderId
```

**Impact**: MEDIUM - Harder to trace successful operations in logs

---

#### 4. JSDoc Documentation (IMPORTANT)

**Issue**: Minimal JSDoc, missing business rules

**Current State**:

```typescript
/**
 * Get all contacts for a provider
 *
 * ✅ MIGRATED: FROM pool.query to TypeORM find
 */
```

**Fix Required**:

```typescript
/**
 * Get all contacts for a provider
 *
 * Business Rules:
 * - Returns contacts ordered by isPrimary DESC (primary contacts first)
 * - Then ordered by createdAt DESC (newest first)
 * - All contacts returned regardless of status (active/inactive)
 * - TODO: Should filter by tenant_id (deferred to Phase 21)
 *
 * @param providerId - Provider ID to find contacts for
 * @returns Array of provider contact DTOs (snake_case)
 * @throws {DatabaseError} If database query fails
 *
 * @example
 * const contacts = await service.findByProviderId(123);
 * // Returns: [{ id: 1, provider_id: 123, contact_name: "Juan Pérez", ... }]
 */
```

**Impact**: MEDIUM - Developers need to read code to understand behavior

---

#### 5. Local DTO Interface (NICE-TO-HAVE)

**Issue**: `ProviderContactInput` interface duplicates standard DTOs

**Current State**:

```typescript
// Lines 7-35: Local interface with both snake_case and camelCase
interface ProviderContactInput {
  provider_id?: number;
  contact_name?: string;
  // ... 30+ lines
}
```

**Fix Required**:

```typescript
// Remove local interface, use standard DTOs
import {
  ProviderContactCreateDto,
  ProviderContactUpdateDto
} from '../types/dto/provider-contact.dto';

// Update method signatures
async create(data: ProviderContactCreateDto): Promise<ProviderContactDto>
async update(id: number, data: ProviderContactUpdateDto): Promise<ProviderContactDto>
```

**Impact**: LOW - Code duplication, but not breaking

---

#### 6. Tenant Context (DEFERRED TO PHASE 21)

**Issue**: No tenant_id filtering in queries

**Missing Filters**:

```typescript
// Line 49: findByProviderId
where: {
  providerId: Number(providerId);
}
// Should be: { providerId: Number(providerId), tenantId }

// Line 76: findById
where: {
  id;
}
// Should be: { id, tenantId }

// Line 140: update - check existence
where: {
  id;
}
// Should be: { id, tenantId }

// Line 185: delete
await this.repository.delete(id);
// Should be: await this.repository.delete({ id, tenantId });
```

**Fix Required** (DEFERRED):

```typescript
// TODO: Add tenant_id filter when schema updated (Phase 21)
// Current: No tenant isolation (all contacts visible)
// Should be: WHERE contact.tenant_id = :tenantId

const contacts = await this.repository.find({
  where: {
    providerId: Number(providerId),
    // tenantId // Add when schema ready
  },
});
```

**Impact**: CRITICAL (security) - But deferred due to schema migration blocker

---

## Business Rules Identified

### Primary Contact Rules

1. **One Primary Per Provider** (potential, not enforced):
   - Each provider should have max 1 primary contact
   - If setting contact as primary, should unset others
   - Currently not enforced in service layer

2. **Contact Types**:
   - Valid types: 'general', 'commercial', 'technical', 'financial', 'logistics'
   - Type determines contact purpose (billing, support, sales)

3. **Status Management**:
   - 'active': Contact is current and should be used
   - 'inactive': Contact is archived, kept for history
   - Soft delete (status=inactive) preferred over hard delete

4. **Ordering Rules**:
   - Primary contacts always listed first
   - Within same priority, newest contacts first

---

## Refactoring Plan

### Phase 1: Error Handling (30 min)

1. Import custom error classes
2. Replace 3 generic `Error` with:
   - `NotFoundError` (2 instances in findById, update)
   - `DatabaseError` (1 instance in update after-update case)
3. Wrap repository calls in try/catch with DatabaseError
4. Test error scenarios

### Phase 2: DTOs (45 min)

1. Add `ProviderContactDto` interface to dto file
2. Create `toProviderContactDto()` transformer function
3. Update all method return types
4. Transform entities to DTOs before returning
5. Remove local `ProviderContactInput` interface
6. Update method signatures to use standard DTOs
7. Test DTO transformation

### Phase 3: Logging (15 min)

1. Add success logs to all 5 methods
2. Include relevant context (id, providerId, contactName, isPrimary)
3. Use consistent format: `Logger.info('Action', { context })`

### Phase 4: Documentation (20 min)

1. Add comprehensive JSDoc to all methods
2. Document business rules (ordering, primary contact)
3. Add parameter descriptions
4. Add return type descriptions
5. Add example usage
6. Document throws clauses

### Phase 5: Tenant Context (10 min - TODOs only)

1. Add TODO comments at 4 query locations
2. Document expected behavior when tenant context added
3. Note: Actual implementation deferred to Phase 21

### Phase 6: Testing (30 min)

1. Create `provider-contact.service.spec.ts`
2. Test service instantiation
3. Test method existence (5 methods)
4. Test parameter counts
5. Keep tests lightweight (no database calls)
6. Aim for ~15-20 tests

---

## Risk Assessment

### Breaking Changes

- ✅ Changing return types from entities to DTOs
  - **Impact**: Controllers must handle DTOs (snake_case)
  - **Mitigation**: Update controllers in same commit

### Non-Breaking Changes

- ✅ Adding success logging (transparent to callers)
- ✅ Improving error messages (better error responses)
- ✅ Adding JSDoc (documentation only)
- ✅ Adding tenant context TODOs (comments only)

### Deferred Risks

- ⚠️ Tenant isolation not implemented
  - **Risk**: Cross-tenant data access possible
  - **Mitigation**: Deferred to Phase 21 (schema migration required)

---

## Test Strategy

### Unit Tests (Lightweight)

```typescript
describe('ProviderContactService', () => {
  it('should instantiate service', () => {
    expect(new ProviderContactService()).toBeDefined();
  });

  it('should have findByProviderId method', () => {
    const service = new ProviderContactService();
    expect(service.findByProviderId).toBeDefined();
    expect(typeof service.findByProviderId).toBe('function');
    expect(service.findByProviderId.length).toBe(1); // 1 param
  });

  it('should have findById method', () => {
    const service = new ProviderContactService();
    expect(service.findById).toBeDefined();
    expect(typeof service.findById).toBe('function');
    expect(service.findById.length).toBe(1); // 1 param
  });

  it('should have create method', () => {
    const service = new ProviderContactService();
    expect(service.create).toBeDefined();
    expect(typeof service.create).toBe('function');
    expect(service.create.length).toBe(1); // 1 param
  });

  it('should have update method', () => {
    const service = new ProviderContactService();
    expect(service.update).toBeDefined();
    expect(typeof service.update).toBe('function');
    expect(service.update.length).toBe(2); // 2 params
  });

  it('should have delete method', () => {
    const service = new ProviderContactService();
    expect(service.delete).toBeDefined();
    expect(typeof service.delete).toBe('function');
    expect(service.delete.length).toBe(1); // 1 param
  });
});
```

---

## Success Criteria

- [x] Audit document created
- [ ] All 3 generic errors replaced with custom classes
- [ ] All 4 methods return DTOs (snake_case)
- [ ] All 5 methods have success logging
- [ ] All 5 methods have comprehensive JSDoc
- [ ] Local `ProviderContactInput` interface removed
- [ ] Standard DTOs used (ProviderContactCreateDto, ProviderContactUpdateDto)
- [ ] 4 tenant context TODOs added (deferred to Phase 21)
- [ ] Test file created with ~15-20 lightweight tests
- [ ] All tests passing (199 → ~214-219)
- [ ] Build passing (no TypeScript errors)
- [ ] Docker logs clean (no runtime errors)
- [ ] Changes committed with detailed message

---

## Next Steps

1. ✅ Create this audit document
2. ⏳ Refactor service (apply all fixes)
3. ⏳ Create test file
4. ⏳ Run tests (verify all pass)
5. ⏳ Check build
6. ⏳ Commit changes
7. ⏳ Update progress tracker to 48% (15/31)
8. ⏳ Move to next service: provider-financial-info.service.ts

---

**Audit Complete** ✅  
**Ready for Refactoring** 🚀
