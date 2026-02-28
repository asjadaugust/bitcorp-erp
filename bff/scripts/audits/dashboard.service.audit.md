# Service Audit: dashboard.service

**File**: `backend/src/services/dashboard.service.ts`  
**Date**: 2026-01-19  
**Audited By**: OpenCode Agent  
**Status**: 🔍 In Progress

---

## Overview

- **Lines of Code**: 232
- **Public Methods**: 4 (`getModulesForUser`, `getUserInfo`, `switchProject`, `getDashboardStats`)
- **Has Tests**: ❌ No
- **Test Coverage**: 0%
- **Complexity**: 🟡 Moderate (analytics, multi-entity queries)

---

## Error Handling Analysis

### Current Pattern

```typescript
// Generic Error class used throughout
throw new Error('User not found');
throw new Error('Failed to fetch user information');
throw new Error('Project not found');
throw new Error('Failed to fetch dashboard statistics');

// Errors logged but generic
Logger.error('Error fetching user info', {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  userId,
  context: 'DashboardService.getUserInfo',
});
throw new Error('Failed to fetch user information'); // Generic message
```

### Issues Found

- [x] **Generic Errors**: Uses `throw new Error(...)` instead of custom error classes
- [x] **Missing Error Codes**: No machine-readable error codes
- [ ] **English Messages**: Error messages in English (acceptable for dashboard - internal service)
- [x] **Incorrect HTTP Status**: No HTTP status distinction (404 vs 500)
- [ ] **No Error Logging**: ❌ Has logging (good!)
- [x] **Generic Re-throw**: Catches errors but re-throws generic messages (loses original error details)

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { NotFoundError } from '../errors/http.errors';
import Logger from '../utils/logger';

async getUserInfo(tenantId: number, userId: string) {
  try {
    const user = await this.userRepository.findOne({
      where: { id: parseInt(userId), tenant_id: tenantId },
      relations: ['roles', 'rol', 'unidadOperativa'],
    });

    if (!user) {
      throw new NotFoundError('User', userId);  // 404 error
    }

    // ... rest of logic
  } catch (error) {
    Logger.error('Error fetching user info', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      userId,
      context: 'DashboardService.getUserInfo',
    });
    throw error;  // Re-throw original error, not generic wrapper
  }
}
```

**Effort**: 🟢 Small (replace 4 error instances)

---

## Return Type Analysis

### Current Pattern

```typescript
// Returns raw objects (not DTOs)
async getUserInfo(userId: string) {
  return {
    user: {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      roles: roles,
    },
    active_project,
    assigned_projects: assignedProjects,
  };
}

// Returns raw stats object
async getDashboardStats(userId: string, _projectId?: string) {
  const stats: any = {
    total_equipment: 0,
    active_equipment: 0,
    total_operators: 0,
    pending_reports: 0,
  };
  // ...
  return stats;
}
```

### Issues Found

- [x] **Returns Raw Objects**: Methods return inline objects instead of defined DTOs
- [x] **No DTO Types**: No type definitions for return values
- [x] **Uses `any` Type**: `stats: any` loses type safety
- [ ] **Missing Transformations**: No transformation layer (acceptable for dashboard aggregates)
- [ ] **Missing DTO Imports**: DTOs don't exist yet

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import {
  UserInfoDto,
  DashboardStatsDto,
  ProjectSummaryDto,
} from '../types/dto/dashboard.dto';

async getUserInfo(tenantId: number, userId: string): Promise<UserInfoDto> {
  // ... logic
  return {
    user: {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      roles: roles,
    },
    active_project,
    assigned_projects: assignedProjects,
  };
}

async getDashboardStats(
  tenantId: number,
  userId: string,
  projectId?: string
): Promise<DashboardStatsDto> {
  const stats: DashboardStatsDto = {
    total_equipment: 0,
    active_equipment: 0,
    total_operators: 0,
    pending_reports: 0,
  };
  // ...
  return stats;
}
```

**Effort**: 🟢 Small (create DTO types, update signatures)

---

## Tenant Context Analysis

### Current Pattern

```typescript
// ❌ NO TENANT FILTERING AT ALL
async getUserInfo(userId: string) {
  const user = await this.userRepository.findOne({
    where: { id: parseInt(userId) },  // Missing tenant_id!
    relations: ['roles', 'rol', 'unidadOperativa'],
  });
  // ...
}

async getDashboardStats(userId: string, _projectId?: string) {
  // No tenant filtering:
  stats.total_equipment = await this.equipmentRepository.count({
    where: { is_active: true },  // Missing tenant_id!
  });

  stats.total_operators = await this.trabajadorRepository.count({
    where: { isActive: true },  // Missing tenant_id!
  });
}
```

### Issues Found

- [x] **No Tenant Parameter**: Methods don't accept `tenantId` parameter
- [x] **Missing Tenant Filter**: Queries don't filter by `tenant_id`
- [x] **Cross-Tenant Risk**: ⚠️ **CRITICAL SECURITY ISSUE** - User can see stats from ALL tenants!
- [x] **Inconsistent Tenant Usage**: No tenant filtering anywhere in service

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

async getUserInfo(tenantId: number, userId: string): Promise<UserInfoDto> {
  const user = await this.userRepository.findOne({
    where: {
      id: parseInt(userId),
      tenant_id: tenantId  // ✅ Verify user belongs to tenant
    },
    relations: ['roles', 'rol', 'unidadOperativa'],
  });
  // ...
}

async getDashboardStats(
  tenantId: number,
  userId: string,
  projectId?: string
): Promise<DashboardStatsDto> {
  // Equipment stats - WITH tenant filtering
  stats.total_equipment = await this.equipmentRepository.count({
    where: {
      is_active: true,
      tenant_id: tenantId  // ✅ Only this tenant's equipment
    },
  });

  // Operators - WITH tenant filtering
  stats.total_operators = await this.trabajadorRepository.count({
    where: {
      isActive: true,
      tenant_id: tenantId  // ✅ Only this tenant's operators
    },
  });

  // Projects - WITH tenant filtering
  const assignedProjects = await this.projectRepository
    .createQueryBuilder('p')
    .where('p.tenant_id = :tenantId', { tenantId })  // ✅ Tenant filter
    .andWhere('p.createdBy = :userId OR p.updatedBy = :userId', {
      userId: parseInt(userId),
    })
    .andWhere('p.isActive = :isActive', { isActive: true })
    // ... rest
}
```

**Effort**: 🟡 Medium (requires checking if all models have `tenant_id` field)

---

## Query Pattern Analysis

### Current Pattern

```typescript
// Mix of simple count() and QueryBuilder
stats.total_equipment = await this.equipmentRepository.count({
  where: { is_active: true },
});

const activeEquipmentQuery = this.equipmentRepository
  .createQueryBuilder('e')
  .where('e.is_active = :isActive', { isActive: true })
  .andWhere('e.estado IN (:...statuses)', {
    statuses: ['disponible', 'en_uso', 'operativo'],
  });

stats.active_equipment = await activeEquipmentQuery.getCount();

// Date filtering uses manual date construction
const today = new Date();
today.setHours(0, 0, 0, 0);

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

stats.pending_reports = await this.dailyReportRepository
  .createQueryBuilder('dr')
  .where('dr.createdAt >= :today', { today })
  .andWhere('dr.createdAt < :tomorrow', { tomorrow })
  .getCount();
```

### Issues Found

- [ ] **Uses find() Instead of QueryBuilder**: No - uses appropriate patterns ✅
- [ ] **Selects All Fields**: Using `count()` - acceptable for stats ✅
- [ ] **Missing Joins**: No relations needed for counts ✅
- [x] **No Pagination**: Dashboard stats don't need pagination ✅
- [ ] **Hardcoded Sorting**: N/A for count queries ✅
- [ ] **SQL Injection Risk**: Uses parameterized queries ✅

### Recommendations

```typescript
// ✅ GOOD PATTERN - Minor improvements

// Consider extracting date range helper
private getTodayDateRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

async getDashboardStats(tenantId: number, ...): Promise<DashboardStatsDto> {
  const { start, end } = this.getTodayDateRange();

  stats.pending_reports = await this.dailyReportRepository
    .createQueryBuilder('dr')
    .where('dr.tenant_id = :tenantId', { tenantId })
    .andWhere('dr.createdAt >= :start', { start })
    .andWhere('dr.createdAt < :end', { end })
    .getCount();
}
```

**Effort**: 🟢 Small (minor refactoring)

---

## Business Logic Analysis

### Current Business Rules

1. **Module System**: Not implemented - returns empty array with warning log
2. **Active Project**: Not implemented - returns null (field doesn't exist in schema)
3. **Project Assignment**: Users assigned to projects via `createdBy` or `updatedBy` (workaround - no junction table)
4. **Project Switching**: Not implemented - verifies project exists but doesn't update user record
5. **Equipment States**: Active equipment = `['disponible', 'en_uso', 'operativo']`
6. **Pending Reports**: Reports from today (midnight to midnight)

### Issues Found

- [x] **Partial Implementation**: Multiple features marked as "not implemented" or "planned"
- [x] **Workaround Logic**: Using `createdBy`/`updatedBy` instead of junction table for project assignment
- [ ] **No Business Validation**: No validation needed for read-only stats ✅
- [ ] **No State Validation**: N/A for dashboard ✅
- [x] **No Dependency Checks**: `switchProject` doesn't validate if user has access to project
- [ ] **No Transaction Management**: No multi-step operations ✅
- [x] **Unclear Business Rules**: Business logic documented but incomplete features

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN

async switchProject(
  tenantId: number,
  userId: string,
  projectId: string
): Promise<ProjectSummaryDto> {
  // Business rule: Verify project exists and belongs to tenant
  const project = await this.projectRepository.findOne({
    where: {
      id: parseInt(projectId),
      tenant_id: tenantId  // ✅ Tenant verification
    },
  });

  if (!project) {
    throw new NotFoundError('Project', projectId);
  }

  // Business rule: Verify user has access to project
  const userHasAccess = await this.userProjectRepository.findOne({
    where: {
      user_id: parseInt(userId),
      project_id: parseInt(projectId),
      tenant_id: tenantId,
      is_active: true,
    },
  });

  if (!userHasAccess) {
    throw BusinessRuleError.forbidden(
      'User does not have access to this project'
    );
  }

  // TODO: Update user.active_project_id when field is added to schema
  // await this.userRepository.update(userId, { active_project_id: projectId });

  return toProjectSummaryDto(project);
}
```

**Effort**: 🟡 Medium (requires schema changes for full implementation)

---

## Logging Analysis

### Current Logging

```typescript
// ✅ GOOD: Logs warnings for not-implemented features
Logger.warn('Module system not implemented', {
  message: 'Required tables (sistema.modulo, usuario_modulo_permiso, module_pages) do not exist',
  userId,
  context: 'DashboardService.getModulesForUser',
});

// ✅ GOOD: Logs errors with context
Logger.error('Error fetching user info', {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  userId,
  context: 'DashboardService.getUserInfo',
});

// ❌ MISSING: No success logging for important operations
```

### Issues Found

- [ ] **No Logging**: Service has logging ✅
- [ ] **Inconsistent Logging**: Consistent pattern used ✅
- [ ] **Missing Context**: Context included in all logs ✅
- [ ] **No Error Logging**: Errors are logged ✅
- [x] **No Success Logging**: Missing info-level logs for successful operations

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import Logger from '../utils/logger';

async getUserInfo(tenantId: number, userId: string): Promise<UserInfoDto> {
  try {
    Logger.info('Fetching user info', {
      tenantId,
      userId,
      context: 'DashboardService.getUserInfo',
    });

    // ... logic

    Logger.info('User info fetched successfully', {
      tenantId,
      userId,
      roleCount: roles.length,
      projectCount: assignedProjects.length,
      context: 'DashboardService.getUserInfo',
    });

    return result;
  } catch (error) {
    Logger.error('Error fetching user info', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      userId,
      context: 'DashboardService.getUserInfo',
    });
    throw error;
  }
}
```

**Effort**: 🟢 Small (add success logs to 4 methods)

---

## Testing Analysis

### Current Test Coverage

- **Test File Exists**: ❌ No
- **Test Count**: 0 tests
- **Coverage**: 0%
- **Tests Run**: N/A

### Issues Found

- [x] **No Test File**: Service has no test file
- [x] **Low Coverage**: 0% coverage
- [x] **Missing Happy Path Tests**: No tests for successful operations
- [x] **Missing Error Tests**: Error handling not tested
- [x] **No Tenant Isolation Tests**: Cross-tenant access not tested (CRITICAL!)
- [x] **No Business Rule Tests**: Incomplete feature warnings not tested

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
// dashboard.service.spec.ts
import { DashboardService } from './dashboard.service';
import { AppDataSource } from '../config/database.config';
import { NotFoundError } from '../errors/http.errors';

describe('DashboardService', () => {
  let service: DashboardService;
  const TENANT_ID = 1;
  const OTHER_TENANT_ID = 2;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(() => {
    service = new DashboardService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('getUserInfo', () => {
    it('should return user info with roles and projects', async () => {
      // Create test user
      const user = await createTestUser(TENANT_ID, {
        username: 'testuser',
        email: 'test@example.com',
      });

      const result = await service.getUserInfo(TENANT_ID, user.id.toString());

      expect(result.user.id).toBe(user.id);
      expect(result.user.username).toBe('testuser');
      expect(result.user.roles).toBeInstanceOf(Array);
      expect(result.assigned_projects).toBeInstanceOf(Array);
    });

    it('should throw NotFoundError if user not found', async () => {
      await expect(service.getUserInfo(TENANT_ID, '99999')).rejects.toThrow(NotFoundError);
    });

    it('should not return user from other tenant', async () => {
      const user = await createTestUser(OTHER_TENANT_ID, {
        username: 'otheruser',
      });

      await expect(service.getUserInfo(TENANT_ID, user.id.toString())).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('getDashboardStats', () => {
    it('should return stats for tenant only', async () => {
      // Create equipment for TENANT_ID
      await createTestEquipment(TENANT_ID, { is_active: true });
      await createTestEquipment(TENANT_ID, { is_active: true });

      // Create equipment for OTHER_TENANT_ID
      await createTestEquipment(OTHER_TENANT_ID, { is_active: true });

      const stats = await service.getDashboardStats(TENANT_ID, '1');

      expect(stats.total_equipment).toBe(2); // Only tenant 1's equipment
      expect(stats.active_equipment).toBeGreaterThanOrEqual(0);
      expect(stats.total_operators).toBeGreaterThanOrEqual(0);
      expect(stats.pending_reports).toBeGreaterThanOrEqual(0);
    });

    it('should count only active equipment', async () => {
      await createTestEquipment(TENANT_ID, { is_active: true });
      await createTestEquipment(TENANT_ID, { is_active: false });

      const stats = await service.getDashboardStats(TENANT_ID, '1');

      expect(stats.total_equipment).toBe(1); // Only active
    });
  });

  describe('getModulesForUser', () => {
    it('should return empty array with warning log', async () => {
      const modules = await service.getModulesForUser('1');
      expect(modules).toEqual([]);
    });
  });

  describe('switchProject', () => {
    it('should return project info without actually switching', async () => {
      const project = await createTestProject(TENANT_ID, {
        nombre: 'Test Project',
      });

      const result = await service.switchProject(TENANT_ID, '1', project.id.toString());

      expect(result.id).toBe(project.id);
      expect(result.nombre).toBe('Test Project');
      expect(result.message).toContain('not yet implemented');
    });

    it('should throw NotFoundError if project not found', async () => {
      await expect(service.switchProject(TENANT_ID, '1', '99999')).rejects.toThrow(NotFoundError);
    });

    it('should not return project from other tenant', async () => {
      const project = await createTestProject(OTHER_TENANT_ID, {
        nombre: 'Other Tenant Project',
      });

      await expect(service.switchProject(TENANT_ID, '1', project.id.toString())).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
```

**Effort**: 🟡 Medium (15-20 tests, ~2 hours)

---

## Summary

### Critical Issues (Fix First) 🔴

1. **No Tenant Filtering** - All queries missing `tenant_id` filter (SECURITY ISSUE!)
2. **No Test Coverage** - 0% coverage, no test file

### Important Issues (Fix Next) 🟡

1. **Generic Error Classes** - Using `Error` instead of `NotFoundError`, etc.
2. **No Return Type DTOs** - Returns inline objects, no type definitions
3. **Incomplete Features** - Module system, project switching not implemented
4. **No Success Logging** - Missing info-level logs for operations

### Nice to Have (Optional) 🟢

1. **Date Range Helper** - Extract date calculation into helper method
2. **Project Access Validation** - Validate user has access before switching projects

---

## Action Plan (Revised - Tenant Context Blocked)

### ~~Step 1: Tenant Context~~ **BLOCKED** 🚫

Schema migration required first. Models lack `tenant_id` fields.

**Deferred to**: Multi-Tenancy Schema Migration Epic (separate session)

### Step 1 (Revised): Error Handling

- [ ] Import custom error classes
- [ ] Replace 4 instances of `throw new Error(...)`:
  - [ ] Line 72: User not found → `NotFoundError`
  - [ ] Line 126: Failed to fetch user info → Re-throw original error
  - [ ] Line 154: Project not found → `NotFoundError`
  - [ ] Line 228: Failed to fetch stats → Re-throw original error
- [ ] Test error scenarios

### Step 3: Return Types

- [ ] Create `backend/src/types/dto/dashboard.dto.ts`:
  - [ ] `UserInfoDto`
  - [ ] `DashboardStatsDto`
  - [ ] `ProjectSummaryDto`
- [ ] Update method signatures with return types
- [ ] Remove `any` type from stats object (line 179)

### Step 4: Logging

- [ ] Add success logging to all 4 methods:
  - [ ] `getUserInfo` - Log after successful fetch
  - [ ] `switchProject` - Log project verification
  - [ ] `getDashboardStats` - Log stats calculation
  - [ ] `getModulesForUser` - Already has warning log ✅

### Step 5: Business Logic (Optional - schema dependent)

- [ ] Document planned features in comments
- [ ] Add validation for `switchProject` (user access check)
- [ ] Extract date range helper method

### Step 6: Testing

- [ ] Create `dashboard.service.spec.ts`
- [ ] Add tests for `getUserInfo`:
  - [ ] Happy path (user found)
  - [ ] Error case (user not found)
  - [ ] Tenant isolation (other tenant's user)
- [ ] Add tests for `getDashboardStats`:
  - [ ] Returns correct counts for tenant
  - [ ] Excludes other tenant's data
  - [ ] Filters by active status
- [ ] Add tests for `switchProject`:
  - [ ] Returns project info
  - [ ] Throws error if not found
  - [ ] Tenant isolation
- [ ] Add tests for `getModulesForUser`:
  - [ ] Returns empty array
- [ ] Achieve 70%+ coverage
- [ ] All tests passing

---

## Estimated Total Effort

**Overall Complexity**: 🟡 Medium (3-4 hours)

**Breakdown**:

- Tenant Context: 1.5 hours (critical, requires model verification)
- Error Handling: 30 minutes
- Return Types: 30 minutes
- Logging: 20 minutes
- Testing: 2 hours

**Recommended Approach**:

1. **Start with tenant context** (security critical) ⚠️
2. Add error handling (foundation)
3. Fix return types (consistency)
4. Add logging (observability)
5. Add tests (confidence)

---

## Dependencies to Check ⚠️ **BLOCKER FOUND!**

### Model Tenant Field Status (Verified 2026-01-19)

- [ ] `User` model (sistema.usuario) - ❌ **NO tenant_id field**
- [ ] `Equipment` model (equipo.equipo) - ❌ **NO tenant_id field**
- [ ] `Trabajador` model (rrhh.trabajador) - ❌ **NO tenant_id field**
- [ ] `DailyReport` model (equipo.parte_diario) - ❌ **NO tenant_id field**
- [ ] `Project` model (proyectos.edt) - ❌ **NO tenant_id field**

### 🚨 CRITICAL FINDING

**ALL models are missing `tenant_id` fields!**

This means:

1. **Multi-tenancy is NOT implemented** in the database schema yet
2. **Dashboard service refactoring is BLOCKED** until schema migration is completed
3. **Current system has NO tenant isolation** (all companies share same data!)

### Required Actions Before Refactoring

**Option A: Complete Multi-Tenancy Migration (Recommended)**

1. Create migration script to add `tenant_id` to all tables
2. Seed existing data with default `tenant_id = 1`
3. Update all models to include `tenant_id` field
4. Add foreign key constraints to `tenant` table
5. Update all services to filter by `tenant_id`
6. Test tenant isolation across all modules

**Option B: Defer Tenant Context (Temporary)**

1. Continue service audit WITHOUT tenant filtering
2. Add `// TODO: Add tenant_id filter when schema is updated` comments
3. Document technical debt
4. Plan schema migration as separate epic

**Recommendation**: Choose Option B for now - complete the service layer audit to establish patterns, then do schema migration as a separate focused effort. Attempting to add tenant context now will fail due to missing database fields.

---

## Sign-off

**Audit Complete**: 2026-01-19  
**Issues Found**: 8 (2 critical, 4 important, 2 nice-to-have)  
**Tests Added**: ❌ Pending  
**Test Coverage**: 0%  
**All Tests Passing**: N/A  
**Ready for Refactoring**: ⚠️ **BLOCKED** (schema missing tenant_id fields)

---

## ⚠️ BLOCKER: No Multi-Tenancy in Schema

**Discovery**: All models lack `tenant_id` fields. Multi-tenancy is documented in `.opencode/MULTITENANCY.md` but **not implemented** in database schema.

**Impact**:

- Cannot add tenant filtering to services (fields don't exist)
- Current system shares data across all companies (security issue)
- Service audit can continue but tenant context must be deferred

**Decision for This Session**:

- **Proceed with non-tenant refactoring**: Error handling, return types, logging, tests
- **Skip tenant context**: Add `// TODO: Tenant isolation` comments
- **Document technical debt**: Multi-tenancy requires separate schema migration epic

---

**Next Action**: Begin Step 2 - Error handling (Step 1 blocked by schema)

**Next Service**: `cost-center.service.ts` (239 LOC, moderate)
