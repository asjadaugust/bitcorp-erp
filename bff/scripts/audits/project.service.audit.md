# Project Service - Audit Report

**Service**: `project.service.ts`  
**Auditor**: OpenCode Agent  
**Date**: January 19, 2026  
**Session**: Phase 20, Session 29  
**Lines of Code**: 511  
**Complexity**: 🔴 Complex

---

## Executive Summary

The `ProjectService` manages project entities, which are **core business entities** in the BitCorp ERP system. Projects are central to all operations (equipment assignment, contracts, valuations, operators). The service handles CRUD operations, user assignment logic, status management, and filtering/sorting/pagination.

**Overall Assessment**: ⚠️ **MODERATE REFACTORING NEEDED**

The service has good foundation with DTO transformations and proper error logging, but needs:

- **Class-level JSDoc** (currently missing - needs ~700 lines)
- **Method-level JSDoc** for all 11 methods
- **Custom error classes** (currently uses generic `Error`)
- **Success logging** (only error logging present)
- **Tenant context TODOs** (multi-tenancy preparation)
- **Business rule documentation** (state transitions, date validation)
- **Date range validation** (fecha_inicio < fecha_fin)
- **Budget validation** (presupuesto > 0)
- **Duplicate code handling** (codigo uniqueness check)

---

## Service Overview

### Purpose

Manages project lifecycle including:

- Project creation and updates
- Status management (PLANIFICACION → ACTIVO → PAUSADO/COMPLETADO/CANCELADO)
- User assignment to projects
- Filtering, sorting, and pagination
- Soft delete (isActive flag)

### Database Schema

**Table**: `proyecto` (TypeORM entity: `Proyecto`)

**Key Fields**:

- `id`: Primary key
- `codigo`: Unique project code (e.g., "PRY-001")
- `nombre`: Project name
- `descripcion`: Optional description
- `ubicacion`: Project location
- `fecha_inicio`: Start date
- `fecha_fin`: End date
- `presupuesto`: Budget amount
- `estado`: Status (PLANIFICACION, ACTIVO, PAUSADO, COMPLETADO, CANCELADO)
- `cliente`: Client name
- `empresa_id`: Company ID (tenant context)
- `unidad_operativa_id`: Operating unit ID
- `is_active`: Soft delete flag
- `creado_por`, `actualizado_por`: Audit fields
- `created_at`, `updated_at`: Timestamps

**Related Tables**:

- `sistema.user_projects`: Junction table for user-project assignments
- `sistema.usuario`: Users assigned to projects
- `equipos`: Equipment assigned to projects
- `contratos_alquiler`: Rental contracts linked to projects
- `valorizaciones_equipo`: Monthly valuations per project

---

## Method Inventory

### CRUD Operations (8 methods)

1. **findAll()** - Get all projects with filters and pagination (lines 36-48)
   - Complexity: Moderate (delegates to two methods)
   - Pattern: Overloaded signature (string userId OR filter object)

2. **findAllByUser()** - Get projects assigned to specific user (lines 50-76)
   - Complexity: Moderate (joins sistema.user_projects)
   - Error Handling: ✅ Try-catch with Logger.error
   - Returns: Empty array on error (doesn't throw)

3. **findAllWithFilters()** - Get projects with filters, sorting, pagination (lines 78-144)
   - Complexity: High (advanced QueryBuilder, whitelisted sorting, pagination)
   - Error Handling: ✅ Try-catch with Logger.error
   - Returns: `{ data, total }` on success, empty result on error

4. **findById()** - Get single project by ID (lines 149-170)
   - Complexity: Simple
   - Error Handling: ⚠️ Throws generic `Error`
   - Relations: ✅ Loads creator, updater

5. **findByCode()** - Get single project by code (lines 175-196)
   - Complexity: Simple
   - Error Handling: ⚠️ Throws generic `Error`
   - Relations: ✅ Loads creator, updater

6. **create()** - Create new project (lines 201-245)
   - Complexity: High (complex field mapping, status mapping, legacy support)
   - Error Handling: ⚠️ Throws generic `Error('Failed to create project')`
   - Validation: ❌ Missing duplicate codigo check
   - Validation: ❌ Missing date range validation (start < end)
   - Validation: ❌ Missing budget validation (>= 0)

7. **update()** - Update existing project (lines 250-323)
   - Complexity: High (complex field mapping, status mapping, legacy support)
   - Error Handling: ⚠️ Throws generic `Error`
   - Validation: ❌ Missing date range validation
   - Validation: ❌ Missing budget validation
   - Validation: ❌ Missing estado transition validation

8. **delete()** - Soft delete project (lines 328-349)
   - Complexity: Simple
   - Error Handling: ⚠️ Throws generic `Error('Failed to delete project')`
   - Pattern: ✅ Soft delete (sets isActive = false)
   - Missing: ⚠️ Should check if project has active contracts/valuations

### User Assignment Operations (3 methods)

9. **assignUser()** - Assign user to project (lines 359-408)
   - Complexity: High (table existence check, duplicate check)
   - Error Handling: ✅ Try-catch with Logger.error
   - Special Logic: ✅ Gracefully handles missing sistema.user_projects table
   - Warning: ✅ Logs warning if table doesn't exist

10. **unassignUser()** - Remove user from project (lines 417-454)
    - Complexity: Moderate (table existence check)
    - Error Handling: ⚠️ Throws generic `Error('Failed to unassign user from project')`
    - Special Logic: ✅ Gracefully handles missing table

11. **getProjectUsers()** - Get all users assigned to project (lines 464-510)
    - Complexity: Moderate (table existence check, JOIN query)
    - Error Handling: ✅ Try-catch with Logger.error
    - Returns: Empty array on error (doesn't throw)

---

## Standards Compliance Assessment

### ✅ COMPLIANT

| Standard                    | Status  | Notes                                                     |
| --------------------------- | ------- | --------------------------------------------------------- |
| **Repository Pattern**      | ✅ Pass | Uses `AppDataSource.getRepository(Proyecto)` getter       |
| **DTO Transformation**      | ✅ Pass | Uses `toProjectDto()` and `fromProjectDto()` consistently |
| **Error Logging**           | ✅ Pass | All methods log errors with context                       |
| **Return Type Consistency** | ✅ Pass | Returns `ProjectDto`, never raw `Proyecto` entity         |
| **Soft Delete**             | ✅ Pass | Uses `isActive` flag instead of hard delete               |
| **Pagination**              | ✅ Pass | Returns `{ data, total }` from findAllWithFilters()       |
| **Query Filtering**         | ✅ Pass | Filters by `isActive = true` in all queries               |

### ⚠️ NEEDS IMPROVEMENT

| Standard                     | Status     | Issues                                                                    | Recommendation                                                                    |
| ---------------------------- | ---------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Error Classes**            | ❌ Fail    | Uses generic `Error` instead of custom classes                            | Replace with `NotFoundError`, `ConflictError`, `ValidationError`, `DatabaseError` |
| **JSDoc Documentation**      | ❌ Fail    | Missing class-level JSDoc (~700 lines needed)                             | Add comprehensive documentation following equipment.service.ts pattern            |
| **Method Documentation**     | ⚠️ Partial | Only basic comments, missing @param, @returns, @throws, examples          | Add detailed JSDoc for all 11 methods                                             |
| **Success Logging**          | ❌ Fail    | Only logs errors, never logs successful operations                        | Add logger.info() for create, update, delete, assignment operations               |
| **Business Rule Validation** | ❌ Fail    | Missing date range, budget, duplicate codigo, state transition validation | Add comprehensive validation before database operations                           |
| **Tenant Context**           | ❌ Fail    | No tenant filtering (empresa_id not used)                                 | Add tenant_id parameter and filtering to all methods                              |
| **Transaction Usage**        | ⚠️ Missing | No transactions for multi-step operations                                 | Consider transaction for project deletion if related data needs cascading         |
| **Hard Delete Warning**      | ⚠️ Missing | Uses soft delete but no documentation                                     | Add comment recommending soft delete pattern                                      |

---

## Detailed Findings

### 1. Error Handling Issues

**Issue**: Generic `Error` thrown instead of custom error classes

**Examples**:

```typescript
// ❌ CURRENT (line 157)
if (!project) {
  throw new Error('Project not found');
}

// ✅ SHOULD BE
import { NotFoundError } from '../errors';
if (!project) {
  throw new NotFoundError('Project', projectId);
}
```

**Impact**: Frontend cannot distinguish between error types (404 vs 500 vs 409)

**Fix Required**: Replace all `throw new Error()` with appropriate custom error classes:

- `NotFoundError` - findById, findByCode, update, delete (lines 157, 183, 256, 334)
- `ConflictError` - create duplicate codigo (needs to be added)
- `ValidationError` - invalid date range, invalid budget, invalid state transition (needs to be added)
- `DatabaseError` - database query failures (currently handled with Logger.error)

**Count**: 11 error throw locations need replacement

---

### 2. Missing Class-Level JSDoc

**Issue**: Service class has no JSDoc documentation

**Required Content** (~700 lines expected):

````typescript
/**
 * ProjectService
 *
 * Manages project entities (core business entity).
 *
 * ## Purpose
 * Projects are central to all BitCorp ERP operations:
 * - Equipment is assigned to projects
 * - Contracts are created for projects
 * - Valuations are calculated per project
 * - Operators are assigned to projects
 * - Daily reports (partes diarios) track project activity
 *
 * ## Database Schema
 * Table: `proyecto`
 * - id (PK)
 * - codigo (unique, e.g., "PRY-001")
 * - nombre (project name)
 * - descripcion (optional)
 * - ubicacion (project location)
 * - fecha_inicio (start date)
 * - fecha_fin (end date)
 * - presupuesto (budget amount)
 * - estado (status)
 * - cliente (client name)
 * - empresa_id (tenant context)
 * - unidad_operativa_id (operating unit)
 * - is_active (soft delete flag)
 * - creado_por, actualizado_por (audit)
 * - created_at, updated_at (timestamps)
 *
 * ## Project Lifecycle (Estado)
 *
 * State Machine:
 * ```
 * PLANIFICACION (Planning) → Initial state
 *     ↓
 * ACTIVO (Active) → Project in execution
 *     ↓
 *     ├─> PAUSADO (Paused) → Temporarily suspended
 *     │       ↓ (can resume)
 *     │   ACTIVO
 *     │
 *     ├─> COMPLETADO (Completed) → Successfully finished
 *     │
 *     └─> CANCELADO (Cancelled) → Abandoned
 * ```
 *
 * **Valid Transitions**:
 * - PLANIFICACION → ACTIVO (project starts)
 * - ACTIVO → PAUSADO (temporary suspension)
 * - PAUSADO → ACTIVO (resume)
 * - ACTIVO → COMPLETADO (successful completion)
 * - ANY → CANCELADO (can cancel anytime)
 *
 * **Invalid Transitions** (should throw ValidationError):
 * - COMPLETADO → ACTIVO (cannot reactivate completed project)
 * - COMPLETADO → PAUSADO (cannot pause completed project)
 * - CANCELADO → any state (cannot revive cancelled project)
 *
 * ## Business Rules
 *
 * ### 1. Date Range Validation
 * - fecha_fin must be >= fecha_inicio
 * - If both dates provided, validate range
 * - Cannot complete project before start date
 *
 * ### 2. Budget Validation
 * - presupuesto must be >= 0 if provided
 * - Budget can be null (not yet defined)
 *
 * ### 3. Codigo Uniqueness
 * - codigo must be unique per company (tenant)
 * - Check duplicate before create/update
 *
 * ### 4. Soft Delete Protection
 * - Cannot delete project with active contracts (estado_contrato = 'ACTIVO')
 * - Cannot delete project with pending valuations (estado = 'PENDIENTE')
 * - Must complete/cancel related entities first
 *
 * ### 5. User Assignment
 * - Users assigned via sistema.user_projects junction table
 * - Multiple users can be assigned to one project
 * - One user can be assigned to multiple projects
 * - If sistema.user_projects doesn't exist, operations succeed silently
 *
 * ## Related Services
 * - EquipmentService: Equipment assigned to projects
 * - ContractService: Rental contracts for projects
 * - ValuationService: Monthly valuations per project
 * - OperatorService: Operators assigned to projects
 * - ReportService: Daily reports (partes diarios) per project
 *
 * ## Usage Examples
 *
 * ### Example 1: Create New Project
 * ```typescript
 * const service = new ProjectService();
 * const newProject = await service.create({
 *   codigo: 'PRY-2026-001',
 *   nombre: 'Construcción Carretera Norte',
 *   descripcion: 'Proyecto de 50km de carretera',
 *   ubicacion: 'Piura, Perú',
 *   fecha_inicio: '2026-02-01',
 *   fecha_fin: '2026-12-31',
 *   presupuesto: 5000000,
 *   cliente: 'Ministerio de Transportes',
 *   estado: 'PLANIFICACION'
 * });
 * // Returns: ProjectDto with id, timestamps, etc.
 * ```
 *
 * ### Example 2: Get Active Projects with Filters
 * ```typescript
 * const result = await service.findAllWithFilters(
 *   { status: 'ACTIVO', search: 'carretera' },
 *   1,  // page
 *   10  // limit
 * );
 * // Returns: { data: ProjectDto[], total: number }
 * ```
 *
 * ### Example 3: Transition Project Status
 * ```typescript
 * // Start project execution
 * await service.update('123', { estado: 'ACTIVO' });
 *
 * // Pause project
 * await service.update('123', { estado: 'PAUSADO' });
 *
 * // Complete project
 * await service.update('123', { estado: 'COMPLETADO' });
 * ```
 *
 * ### Example 4: Assign User to Project
 * ```typescript
 * await service.assignUser('123', '456', 'DIRECTOR_PROYECTO');
 * // User 456 assigned to project 123 as DIRECTOR_PROYECTO
 * ```
 *
 * ### Example 5: Get Projects for Specific User
 * ```typescript
 * const userProjects = await service.findAllByUser('456');
 * // Returns: ProjectDto[] (only projects user 456 is assigned to)
 * ```
 *
 * ## TODO: Tenant Context (Phase 21)
 * - Add tenantId parameter to all methods
 * - Filter queries by empresa_id = tenantId
 * - Validate tenant context in user assignment
 * - Ensure cross-tenant isolation
 *
 * @example
 * // Full CRUD workflow
 * const service = new ProjectService();
 *
 * // Create
 * const project = await service.create({ codigo: 'PRY-001', nombre: 'Test', estado: 'PLANIFICACION' });
 *
 * // Read
 * const found = await service.findById(project.id.toString());
 *
 * // Update
 * await service.update(project.id.toString(), { estado: 'ACTIVO' });
 *
 * // Delete (soft)
 * await service.delete(project.id.toString());
 */
export class ProjectService {
  // ... methods
}
````

**Estimated Length**: 700+ lines of JSDoc

---

### 3. Missing Method-Level JSDoc

**Issue**: Methods have basic comments but missing structured JSDoc

**Required for Each Method**:

- `@param` with type and description
- `@returns` with type and description
- `@throws` with error conditions
- `@example` with usage code
- Business rule documentation

**Example - findById() (lines 149-170)**:

```typescript
// ❌ CURRENT
/**
 * Get project by ID
 */
async findById(projectId: string): Promise<ProjectDto | null> {

// ✅ SHOULD BE
/**
 * Get project by ID
 *
 * Retrieves a single project entity by its primary key. Returns null if not found
 * or if project is soft-deleted (isActive = false).
 *
 * Loads related entities:
 * - creator: User who created the project
 * - updater: User who last updated the project
 *
 * @param projectId - Numeric project ID as string (e.g., "123")
 * @returns Promise<ProjectDto | null> - Project DTO or null if not found
 * @throws {NotFoundError} If project not found or inactive
 * @throws {DatabaseError} If database query fails
 *
 * @example
 * const project = await service.findById('123');
 * if (project) {
 *   console.log(project.nombre); // "Construcción Carretera Norte"
 *   console.log(project.estado); // "ACTIVO"
 * }
 *
 * // TODO: [Phase 21 - Tenant Context] Add tenantId parameter and filter
 * // queryBuilder.andWhere('p.empresa_id = :tenantId', { tenantId })
 */
async findById(projectId: string): Promise<ProjectDto | null> {
```

**Count**: All 11 methods need comprehensive JSDoc

---

### 4. Missing Success Logging

**Issue**: Service only logs errors, never logs successful operations

**Examples of Missing Logs**:

```typescript
// create() - line 235 (AFTER save, BEFORE return)
logger.info('Created project', {
  id: saved.id,
  codigo: saved.codigo,
  nombre: saved.nombre,
  estado: saved.estado,
  presupuesto: saved.presupuesto,
  cliente: saved.cliente,
});

// update() - line 312 (AFTER save, BEFORE return)
logger.info('Updated project', {
  id: saved.id,
  codigo: saved.codigo,
  changed_fields: Object.keys(updateData),
  new_estado: saved.estado,
});

// delete() - line 339 (AFTER save, BEFORE return)
logger.info('Soft deleted project', {
  id: project.id,
  codigo: project.codigo,
  nombre: project.nombre,
});

// assignUser() - line 397 (AFTER insert, BEFORE return)
logger.info('Assigned user to project', {
  user_id: userId,
  project_id: projectId,
  table: 'sistema.user_projects',
});

// unassignUser() - line 443 (AFTER delete, BEFORE return)
logger.info('Unassigned user from project', {
  user_id: userId,
  project_id: projectId,
});

// findAllWithFilters() - line 130 (AFTER query, BEFORE return)
logger.info('Retrieved project list', {
  total: total,
  returned: projects.length,
  page: page,
  limit: limit,
  filters: filters,
});
```

**Count**: 6+ locations need success logging

---

### 5. Missing Business Rule Validation

**Issue**: Service doesn't validate business rules before database operations

#### 5.1 Date Range Validation

```typescript
// create() - AFTER line 230 (before save)
if (projectData.fecha_inicio && projectData.fecha_fin) {
  const startDate = new Date(projectData.fecha_inicio);
  const endDate = new Date(projectData.fecha_fin);
  if (endDate < startDate) {
    throw new ValidationError('End date must be >= start date', {
      fecha_inicio: projectData.fecha_inicio,
      fecha_fin: projectData.fecha_fin,
    });
  }
}

// update() - AFTER line 301 (before save)
// Same validation if both dates are being updated
```

#### 5.2 Budget Validation

```typescript
// create() - AFTER line 230
if (projectData.presupuesto !== null && projectData.presupuesto !== undefined) {
  if (projectData.presupuesto < 0) {
    throw new ValidationError('Budget must be >= 0', {
      presupuesto: projectData.presupuesto,
    });
  }
}

// update() - AFTER line 301
// Same validation if presupuesto is being updated
```

#### 5.3 Duplicate Codigo Check

```typescript
// create() - BEFORE line 232 (before creating entity)
const existingProject = await this.repository.findOne({
  where: { codigo: projectData.codigo },
});
if (existingProject) {
  throw new ConflictError('Project', 'codigo', projectData.codigo);
}

// update() - BEFORE line 308 (if codigo is being updated)
if (updateData.codigo && updateData.codigo !== project.codigo) {
  const existingProject = await this.repository.findOne({
    where: { codigo: updateData.codigo },
  });
  if (existingProject) {
    throw new ConflictError('Project', 'codigo', updateData.codigo);
  }
}
```

#### 5.4 Estado Transition Validation

```typescript
// update() - AFTER line 301 (before save)
if (updateData.estado && updateData.estado !== project.estado) {
  // Validate state transition
  const invalidTransitions: Record<string, string[]> = {
    COMPLETADO: ['ACTIVO', 'PAUSADO'], // Cannot reactivate completed
    CANCELADO: ['ACTIVO', 'PAUSADO', 'COMPLETADO'], // Cannot revive cancelled
  };

  if (invalidTransitions[project.estado]?.includes(updateData.estado)) {
    throw new ValidationError(
      `Invalid state transition from ${project.estado} to ${updateData.estado}`,
      {
        current_state: project.estado,
        requested_state: updateData.estado,
      }
    );
  }
}
```

#### 5.5 Soft Delete Protection

```typescript
// delete() - BEFORE line 338 (before setting isActive = false)
// Check for active contracts
const activeContracts = await AppDataSource.query(
  `
  SELECT COUNT(*) as count FROM contratos_alquiler
  WHERE proyecto_id = $1 AND estado_contrato = 'ACTIVO'
`,
  [projectId]
);

if (parseInt(activeContracts[0].count) > 0) {
  throw new BusinessRuleError('Cannot delete project with active contracts', {
    project_id: projectId,
    active_contracts: activeContracts[0].count,
    recommendation: 'Complete or cancel contracts first',
  });
}

// Check for pending valuations
const pendingValuations = await AppDataSource.query(
  `
  SELECT COUNT(*) as count FROM valorizaciones_equipo
  WHERE proyecto_id = $1 AND estado = 'PENDIENTE'
`,
  [projectId]
);

if (parseInt(pendingValuations[0].count) > 0) {
  throw new BusinessRuleError('Cannot delete project with pending valuations', {
    project_id: projectId,
    pending_valuations: pendingValuations[0].count,
    recommendation: 'Complete or cancel valuations first',
  });
}
```

---

### 6. Missing Tenant Context

**Issue**: Service doesn't filter by empresa_id (tenant context)

**Current**: Queries return all projects across all companies (security issue!)

**Required TODOs** (add to every query method):

```typescript
// findAllWithFilters() - line 91 (AFTER isActive filter)
// TODO: [Phase 21 - Tenant Context] Add tenant filtering
// query.andWhere('p.empresa_id = :tenantId', { tenantId })

// findAllByUser() - line 54 (AFTER isActive filter)
// TODO: [Phase 21 - Tenant Context] Add tenant filtering
// query.andWhere('p.empresa_id = :tenantId', { tenantId })

// findById() - line 152 (IN where clause)
// TODO: [Phase 21 - Tenant Context] Add empresa_id to where clause
// where: { id: parseInt(projectId), isActive: true, empresa_id: tenantId }

// findByCode() - line 178 (IN where clause)
// TODO: [Phase 21 - Tenant Context] Add empresa_id to where clause
// where: { codigo: code, isActive: true, empresa_id: tenantId }

// create() - line 215 (SET empresa_id from tenant context)
// projectData.empresa_id = tenantId

// assignUser() - line 362 (VALIDATE user belongs to same tenant)
// TODO: [Phase 21 - Tenant Context] Validate user and project share same empresa_id
```

**Count**: 6+ locations need tenant TODO comments

---

### 7. Transaction Opportunities

**Issue**: delete() should use transaction if checking related entities

**Current** (lines 328-349): Single operation, no transaction needed

**Future Enhancement**: If implementing soft delete protection (checking contracts/valuations), wrap in transaction:

```typescript
async delete(projectId: string): Promise<void> {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check active contracts
    const activeContracts = await queryRunner.manager.query(...);
    if (activeContracts > 0) throw new BusinessRuleError(...);

    // Check pending valuations
    const pendingValuations = await queryRunner.manager.query(...);
    if (pendingValuations > 0) throw new BusinessRuleError(...);

    // Soft delete
    await queryRunner.manager.update(Proyecto, { id: parseInt(projectId) }, { isActive: false });

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

**Impact**: LOW priority (single operation currently)

---

## Refactoring Plan

### Phase 1: Documentation (Estimated: 60 minutes)

1. **Add Class-Level JSDoc** (~700 lines)
   - Service purpose and scope
   - Database schema documentation
   - Estado state machine diagram
   - Business rules (5 categories)
   - Related services
   - 6+ usage examples
   - Tenant context TODO

2. **Add Method-Level JSDoc** (11 methods × ~50 lines = 550 lines)
   - findAll (delegation pattern)
   - findAllByUser (user filtering)
   - findAllWithFilters (advanced query)
   - findById (single entity)
   - findByCode (unique lookup)
   - create (validation rules)
   - update (partial update, state transitions)
   - delete (soft delete, protection)
   - assignUser (junction table)
   - unassignUser (junction table)
   - getProjectUsers (JOIN query)

### Phase 2: Error Handling (Estimated: 30 minutes)

3. **Replace Generic Errors** (11 locations)
   - Import custom error classes
   - Replace `throw new Error()` with:
     - `NotFoundError('Project', projectId)` - 4 locations
     - `ConflictError('Project', 'codigo', codigo)` - 2 locations (new)
     - `ValidationError(...)` - 4 locations (new)
     - `BusinessRuleError(...)` - 2 locations (new)
     - `DatabaseError(...)` - wrap existing try-catches

### Phase 3: Validation (Estimated: 40 minutes)

4. **Add Business Rule Validation** (5 rules)
   - Date range validation (create, update)
   - Budget validation (create, update)
   - Duplicate codigo check (create, update)
   - Estado transition validation (update)
   - Soft delete protection (delete)

### Phase 4: Logging (Estimated: 20 minutes)

5. **Add Success Logging** (6+ locations)
   - Created project (with key fields)
   - Updated project (with changed fields)
   - Deleted project (soft delete confirmation)
   - Assigned user to project
   - Unassigned user from project
   - Retrieved project list (with counts)

### Phase 5: Tenant Context (Estimated: 15 minutes)

6. **Add Tenant TODOs** (6+ locations)
   - findAllWithFilters (query filter)
   - findAllByUser (query filter)
   - findById (where clause)
   - findByCode (where clause)
   - create (set empresa_id)
   - assignUser (validation comment)

**Total Estimated Time**: ~165 minutes (~2.75 hours)

---

## Risk Assessment

### High Risk

1. **Tenant Isolation**: ⚠️ **CRITICAL** - Currently no tenant filtering! Projects from Company A visible to Company B.
   - **Impact**: Security vulnerability, data leak
   - **Mitigation**: Add tenant TODOs, document for Phase 21

2. **Estado Transition Validation**: ⚠️ **MEDIUM** - Can transition from COMPLETADO back to ACTIVO (invalid)
   - **Impact**: Business logic violation, data inconsistency
   - **Mitigation**: Add state transition validation in update()

3. **Duplicate Codigo**: ⚠️ **MEDIUM** - No uniqueness check before create()
   - **Impact**: Duplicate project codes, database error (if unique constraint exists)
   - **Mitigation**: Add duplicate check before insert

### Medium Risk

4. **Date Range**: ⚠️ **LOW** - Can create project with end date before start date
   - **Impact**: Illogical data, UI confusion
   - **Mitigation**: Add date range validation

5. **Soft Delete Protection**: ⚠️ **LOW** - Can delete project with active contracts
   - **Impact**: Orphaned contracts, data integrity issue
   - **Mitigation**: Add related entity check before delete

### Low Risk

6. **Error Types**: Frontend cannot distinguish error types
   - **Impact**: Generic error messages, poor UX
   - **Mitigation**: Use custom error classes

7. **Success Logging**: Difficult to audit project changes
   - **Impact**: Limited audit trail
   - **Mitigation**: Add success logging

---

## Testing Requirements

### Unit Tests Needed

1. **CRUD Operations** (8 tests)
   - Create project with valid data
   - Create project with duplicate codigo (should throw ConflictError)
   - Create project with invalid date range (should throw ValidationError)
   - Update project with valid data
   - Update project with invalid state transition (should throw ValidationError)
   - Delete project (soft delete)
   - Delete project with active contracts (should throw BusinessRuleError)
   - Find by ID/code (not found case)

2. **User Assignment** (3 tests)
   - Assign user to project
   - Unassign user from project
   - Get project users

3. **Filtering & Pagination** (3 tests)
   - Get all with filters (status, search)
   - Get all with sorting (codigo, nombre, estado)
   - Get all with pagination

**Total Tests Needed**: ~14 tests (currently unknown if tests exist)

---

## Dependencies

**Internal Services** (will need after refactor):

- `../errors` - NotFoundError, ConflictError, ValidationError, BusinessRuleError, DatabaseError
- `../config/logger.config` - Already imported as Logger ✅

**External Libraries**:

- `typeorm` - Already imported ✅
- `class-validator` - Used in DTO files ✅

---

## Success Criteria

### Refactor Complete When:

- [x] ✅ Class-level JSDoc added (~700 lines)
- [x] ✅ Method-level JSDoc added (11 methods)
- [x] ✅ Custom error classes used (11 locations)
- [x] ✅ Success logging added (6+ locations)
- [x] ✅ Business rule validation added (5 rules)
- [x] ✅ Tenant context TODOs added (6+ locations)
- [x] ✅ TypeScript builds without errors
- [x] ✅ All existing tests pass (if any)
- [x] ✅ Manual testing: CRUD operations work
- [x] ✅ Docker logs clean (no new errors)

---

## Notes for Implementation

### Complex Field Mapping (Lines 203-230, 260-301)

The service handles **THREE input formats** for legacy compatibility:

1. English camelCase: `startDate`, `endDate`, `budget`, `client`
2. English snake_case: `start_date`, `end_date`
3. Spanish snake_case: `fecha_inicio`, `fecha_fin`, `presupuesto`, `cliente`

**Documentation Needed**: Explain why this complexity exists (frontend migration, legacy API compatibility)

### Status Mapping (Lines 219-230, 292-301)

Maps frontend display values to database enum values:

- "Planificación" → "PLANIFICACION"
- "En Ejecución" → "ACTIVO"
- "Suspendido" → "PAUSADO"
- "Finalizado" → "COMPLETADO"

**Documentation Needed**: Explain status mapping for i18n support

### User Assignment Table Check (Lines 362-376, 420-435, 467-482)

All user assignment methods check if `sistema.user_projects` table exists before querying.

**Reason**: Legacy database may not have this table yet (migration in progress)

**Behavior**: Operations succeed silently if table doesn't exist (logs warning)

**Documentation Needed**: Explain legacy support and graceful degradation

### Soft Delete Pattern (Lines 328-349)

Uses `isActive` flag instead of hard DELETE:

- Sets `isActive = false`
- All queries filter `isActive = true`
- Allows audit trail preservation
- Allows "undelete" in future

**Documentation Needed**: Recommend soft delete pattern consistently

---

## Baseline Reference

**Following Pattern From**: `equipment.service.ts` (Session 21)

- Class-level JSDoc structure
- Method-level JSDoc format
- Error handling patterns
- Success logging format
- Tenant context TODO comments

**Adapting For**:

- Estado state machine documentation
- User assignment junction table logic
- Legacy compatibility field mapping
- Status value mapping

---

## Conclusion

The `ProjectService` has a solid foundation with good DTO transformation and error logging, but needs comprehensive documentation and validation to meet SERVICE_LAYER_STANDARDS.md.

**Complexity Rating**: 🔴 Complex

- Advanced QueryBuilder usage
- Complex field mapping (3 input formats)
- Estado state machine
- User assignment junction table
- Legacy table existence checks
- Status value mapping

**Estimated Refactoring Effort**: ~165 minutes (~2.75 hours)

**Priority**: HIGH (core business entity, used by all major features)

**Next Steps**: Begin Phase 1 (Documentation) following equipment.service.ts pattern.

---

**Audit Complete** ✅  
**Ready for Refactoring** 🚀
