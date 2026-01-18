# Tender Service Audit Report

**Service**: `tender.service.ts`  
**Date**: January 18, 2026  
**Phase**: 20 - Service Layer Audit  
**Session**: 11  
**Auditor**: OpenCode Agent  
**Priority**: 2 (Moderate)

---

## Executive Summary

**Overall Assessment**: 🟡 **MODERATE REFACTORING REQUIRED**

The `tender.service.ts` manages tender/bid (licitaciones) workflow. The service has basic CRUD operations and QueryBuilder usage but lacks multi-tenant context, typed errors, comprehensive logging, and proper DTO transformation. The entity model is clean and well-defined with estado workflow states.

**Key Findings**:

- ✅ **Good**: QueryBuilder with filters, Logger.error in place, estado validation
- ❌ **Critical**: No tenantId parameters (0/5 methods)
- ❌ **Critical**: Returns raw entities instead of DTOs
- ❌ **Major**: Generic Error throws instead of typed errors
- ❌ **Major**: No Logger.info (success logging)
- ❌ **Major**: No pagination in findAll
- ❌ **Major**: Repository getter pattern (should be constructor)
- ⚠️ **Warning**: Database has NO tenant_id column
- ⚠️ **Warning**: DTO file incomplete (missing response DTO and transformers)

**Estimated Refactoring Effort**: 4-5 hours

---

## File Inventory

| File                   | Current LOC | Purpose       | Status               |
| ---------------------- | ----------- | ------------- | -------------------- |
| `tender.service.ts`    | 140         | Service layer | 🔴 Needs refactoring |
| `tender.model.ts`      | 55          | Entity model  | ✅ Clean             |
| `tender.dto.ts`        | 108         | DTOs          | 🟡 Incomplete        |
| `tender.controller.ts` | 32          | Controller    | 🔴 Needs refactoring |
| `tender.routes.ts`     | 16          | Routes        | 🟡 Minimal routes    |

**Total Lines**: 351

---

## Database Schema Analysis

### Table: `licitaciones` (public schema)

```sql
CREATE TABLE licitaciones (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  entidad_convocante VARCHAR(255),
  monto_referencial DECIMAL(15,2),
  fecha_convocatoria DATE,
  fecha_presentacion DATE,
  estado VARCHAR(50) DEFAULT 'PUBLICADO',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_licitaciones_codigo ON licitaciones(codigo);
CREATE INDEX idx_licitaciones_estado ON licitaciones(estado);
```

**Analysis**:

- ❌ **CRITICAL**: No `tenant_id` column (multi-tenancy not implemented at DB level)
- ✅ Has `codigo` unique constraint (business key)
- ✅ Has `estado` with default value ('PUBLICADO')
- ✅ Has audit timestamps (created_at, updated_at)
- ✅ Has indexes on codigo and estado
- ⚠️ In `public` schema (not a domain schema like `proyectos`, `equipo`, etc.)

**Recommendation**: Add TODO comments in service for tenant_id filtering once column is added

---

## Entity Model Analysis

### Model: `Licitacion` (`tender.model.ts`)

**Estado Type Definition**:

```typescript
export type EstadoLicitacion = 'PUBLICADO' | 'EVALUACION' | 'ADJUDICADO' | 'DESIERTO' | 'CANCELADO';
```

**Estado Workflow** (inferred business logic):

```
PUBLICADO → EVALUACION → ADJUDICADO
                      ↘ DESIERTO
         ↘ CANCELADO (can cancel from any state)
```

**Fields**:

- ✅ All fields properly mapped with `@Column` decorators
- ✅ Uses snake_case column names (`entidad_convocante`, `monto_referencial`, etc.)
- ✅ Has indexes defined (`@Index` decorators)
- ✅ Has `legacy_id` for data migration
- ✅ Has `createdAt` and `updatedAt` timestamps

**Strengths**:

- Clean entity definition
- Proper TypeORM decorators
- Estado type is well-defined

**Issues**:

- ❌ No `tenant_id` field (matches database limitation)
- ❌ No relations defined (might be standalone table)

---

## Current Service Implementation Analysis

### File: `tender.service.ts` (140 lines)

#### Method Inventory

| Method               | LOC | tenantId? | Pagination? | Returns              | Error Handling | Logging       |
| -------------------- | --- | --------- | ----------- | -------------------- | -------------- | ------------- |
| `findAll(filters?)`  | 27  | ❌ No     | ❌ No       | `Licitacion[]`       | Generic Error  | ❌ Error only |
| `findById(id)`       | 12  | ❌ No     | N/A         | `Licitacion \| null` | Re-throw       | ❌ Error only |
| `create(data)`       | 21  | ❌ No     | N/A         | `Licitacion`         | Re-throw       | ❌ Error only |
| `update(id, data)`   | 18  | ❌ No     | N/A         | `Licitacion`         | Generic Error  | ❌ Error only |
| `delete(id)`         | 12  | ❌ No     | N/A         | `void`               | Generic Error  | ❌ Error only |
| **Backward compat:** |     |           |             |                      |                |               |
| `getAllTenders()`    | 3   | ❌ No     | ❌ No       | `Licitacion[]`       | Inherited      | ❌ Error only |
| `getTenderById(id)`  | 3   | ❌ No     | N/A         | `Licitacion \| null` | Inherited      | ❌ Error only |
| `createTender(data)` | 13  | ❌ No     | N/A         | `Licitacion`         | Inherited      | ❌ Error only |

**Total Methods**: 8 (5 core + 3 backward compat)

#### Detailed Method Analysis

##### 1. `findAll(filters?)` - Lines 14-41

**Current Signature**:

```typescript
async findAll(filters?: { search?: string; estado?: string }): Promise<Licitacion[]>
```

**Issues**:

- ❌ Missing `tenantId` parameter
- ❌ No pagination (returns full array)
- ❌ Returns raw `Licitacion[]` instead of DTOs
- ❌ No Logger.info on success
- ❌ Generic Error throw on failure
- ❌ No TODO comment for tenant filtering

**Strengths**:

- ✅ Uses QueryBuilder (good pattern)
- ✅ Has search filter (ILIKE on nombre, codigo, entidad_convocante)
- ✅ Has estado filter
- ✅ Has Logger.error with context
- ✅ Orders by fecha_presentacion ASC (business logic)

**Required Changes**:

```typescript
async findAll(
  tenantId: number,
  filters?: { search?: string; estado?: EstadoLicitacion },
  page = 1,
  limit = 10
): Promise<{ data: TenderDto[]; total: number }>
```

##### 2. `findById(id)` - Lines 43-55

**Current Signature**:

```typescript
async findById(id: number): Promise<Licitacion | null>
```

**Issues**:

- ❌ Missing `tenantId` parameter
- ❌ Returns `null` instead of throwing `NotFoundError`
- ❌ Returns raw `Licitacion` instead of DTO
- ❌ No Logger.info on success
- ❌ Re-throws generic error

**Strengths**:

- ✅ Has Logger.error with context
- ✅ Simple and clean implementation

**Required Changes**:

```typescript
async findById(tenantId: number, id: number): Promise<TenderDto>
// Throws NotFoundError if not found
```

##### 3. `create(data)` - Lines 57-78

**Current Signature**:

```typescript
async create(data: Partial<Licitacion>): Promise<Licitacion>
```

**Issues**:

- ❌ Missing `tenantId` parameter
- ❌ Returns raw `Licitacion` instead of DTO
- ❌ Generic Error throw for duplicate codigo
- ❌ No Logger.info on success
- ❌ Should use typed DTO for input (`LicitacionCreateDto`)

**Strengths**:

- ✅ Validates codigo uniqueness (business logic)
- ✅ Has Logger.error with context

**Required Changes**:

```typescript
async create(tenantId: number, data: LicitacionCreateDto): Promise<TenderDto>
// Throws ConflictError if codigo exists
```

##### 4. `update(id, data)` - Lines 80-98

**Current Signature**:

```typescript
async update(id: number, data: Partial<Licitacion>): Promise<Licitacion>
```

**Issues**:

- ❌ Missing `tenantId` parameter
- ❌ Generic Error throw for not found
- ❌ Returns raw `Licitacion` instead of DTO
- ❌ No Logger.info on success
- ❌ No estado transition validation
- ❌ Should use typed DTO for input (`LicitacionUpdateDto`)

**Strengths**:

- ✅ Checks existence before update
- ✅ Has Logger.error with context
- ✅ Uses Object.assign for partial updates

**Required Changes**:

```typescript
async update(tenantId: number, id: number, data: LicitacionUpdateDto): Promise<TenderDto>
// Throws NotFoundError if not found
// Validates estado transitions
```

**Estado Transition Logic Needed**:

```typescript
// Valid transitions:
// PUBLICADO → EVALUACION ✅
// PUBLICADO → CANCELADO ✅
// EVALUACION → ADJUDICADO ✅
// EVALUACION → DESIERTO ✅
// EVALUACION → CANCELADO ✅
// ADJUDICADO → (no transitions) ❌
// DESIERTO → (no transitions) ❌
// CANCELADO → (no transitions) ❌
```

##### 5. `delete(id)` - Lines 100-112

**Current Signature**:

```typescript
async delete(id: number): Promise<void>
```

**Issues**:

- ❌ Missing `tenantId` parameter
- ❌ No existence verification (direct delete)
- ❌ Generic Error throw on failure
- ❌ No Logger.info on success

**Strengths**:

- ✅ Has Logger.error with context
- ✅ Returns void (correct)

**Required Changes**:

```typescript
async delete(tenantId: number, id: number): Promise<void>
// Verify existence first, throw NotFoundError if not found
```

**Consideration**: Should this be soft delete instead? (No deleted_at in DB schema)

##### 6-8. Backward Compatibility Methods - Lines 114-137

**Methods**:

- `getAllTenders()` - Wrapper for findAll()
- `getTenderById(id)` - Wrapper for findById()
- `createTender(data)` - Field mapper + wrapper for create()

**Analysis**:

- ❌ No `@deprecated` JSDoc tags
- ⚠️ `createTender()` maps old English field names to Spanish (data migration logic)
- ✅ Controller uses `getAllTenders()` and `createTender()` - **NEED TO REFACTOR**

**Required Changes**:

- Add `@deprecated` JSDoc to all three
- Keep them for now (controller depends on them)
- Refactor internally to call new methods with tenantId

---

## DTO Analysis

### File: `tender.dto.ts` (108 lines)

#### Current Structure

**Exists**:

- ✅ `LicitacionCreateDto` class (lines 26-64) - Input validation with class-validator
- ✅ `LicitacionUpdateDto` class (lines 70-108) - Partial update validation
- ✅ `EstadoLicitacion` type (line 21)

**Missing**:

- ❌ **Response DTO interface** (`TenderDto`)
- ❌ **Transformation functions** (`toTenderDto`, `toTenderDtoArray`)

#### Required Additions

**1. Response DTO Interface** (after line 21):

```typescript
export interface TenderDto {
  id: number;
  legacy_id?: string;
  codigo: string;
  nombre: string;
  entidad_convocante?: string;
  monto_referencial?: number;
  fecha_convocatoria?: string; // ISO date string
  fecha_presentacion?: string; // ISO date string
  estado: EstadoLicitacion;
  observaciones?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
```

**2. Transformation Functions** (after LicitacionUpdateDto):

```typescript
export function toTenderDto(licitacion: Licitacion): TenderDto {
  return {
    id: licitacion.id,
    legacy_id: licitacion.legacyId,
    codigo: licitacion.codigo,
    nombre: licitacion.nombre,
    entidad_convocante: licitacion.entidadConvocante,
    monto_referencial: licitacion.montoReferencial
      ? Number(licitacion.montoReferencial)
      : undefined,
    fecha_convocatoria: licitacion.fechaConvocatoria?.toISOString().split('T')[0],
    fecha_presentacion: licitacion.fechaPresentacion?.toISOString().split('T')[0],
    estado: licitacion.estado,
    observaciones: licitacion.observaciones,
    created_at: licitacion.createdAt.toISOString(),
    updated_at: licitacion.updatedAt.toISOString(),
  };
}

export function toTenderDtoArray(licitaciones: Licitacion[]): TenderDto[] {
  return licitaciones.map(toTenderDto);
}
```

---

## Controller Analysis

### File: `tender.controller.ts` (32 lines)

#### Current Routes

| Route    | Method       | Handler                  | Service Called | Response Format |
| -------- | ------------ | ------------------------ | -------------- | --------------- |
| `GET /`  | getTenders   | `getAllTenders()`        | Raw entities   | ❌              |
| `POST /` | createTender | `createTender(req.body)` | Raw entity     | ❌              |

**Total Routes**: 2

#### Issues Identified

**1. getTenders Method** (lines 9-22):

- ❌ Calls `getAllTenders()` (backward compat wrapper)
- ❌ No tenantId passed
- ❌ No pagination
- ❌ Returns raw entities
- ❌ Generic error handling (500 only)

**Required Changes**:

```typescript
getTenders = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = 1; // TODO: Get from req.tenantContext
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      search: req.query.search as string,
      estado: req.query.estado as EstadoLicitacion,
    };

    const result = await this.tenderService.findAll(tenantId, filters, page, limit);

    sendSuccess(res, result.data, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error: any) {
    Logger.error('Error in getTenders', { error: error.message });
    sendError(res, 500, 'TENDERS_FETCH_FAILED', 'Error al obtener las licitaciones');
  }
};
```

**2. createTender Method** (lines 24-31):

- ❌ Calls `createTender(req.body)` (backward compat wrapper)
- ❌ No tenantId passed
- ❌ Returns raw entity
- ❌ No ConflictError handling (duplicate codigo)

**Required Changes**:

```typescript
createTender = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = 1; // TODO: Get from req.tenantContext
    const tender = await this.tenderService.create(tenantId, req.body);
    sendCreated(res, tender);
  } catch (error: any) {
    if (error instanceof ConflictError) {
      sendError(res, 409, 'TENDER_DUPLICATE', error.message);
      return;
    }
    Logger.error('Error in createTender', { error: error.message });
    sendError(res, 500, 'TENDER_CREATE_FAILED', 'Error al crear la licitación');
  }
};
```

#### Missing Routes

**Need to Add**:

- `GET /:id` - Get single tender by ID
- `PUT /:id` - Update tender
- `DELETE /:id` - Delete tender

---

## Routes Analysis

### File: `tender.routes.ts` (16 lines)

#### Current Routes

```typescript
router.get('/', tenderController.getTenders);
router.post('/', validateDto(LicitacionCreateDto), tenderController.createTender);
```

**Issues**:

- ❌ Only 2 routes (missing GET/:id, PUT/:id, DELETE/:id)
- ⚠️ Has `authenticate` middleware (good)
- ✅ Has `validateDto` on POST (good)

**Required Changes**:

```typescript
router.get('/', tenderController.getTenders);
router.get('/:id', tenderController.getTenderById); // NEW
router.post('/', validateDto(LicitacionCreateDto), tenderController.createTender);
router.put('/:id', validateDto(LicitacionUpdateDto), tenderController.updateTender); // NEW
router.delete('/:id', tenderController.deleteTender); // NEW
```

---

## Error Handling Assessment

### Current Errors

| Location   | Error Type               | Count | Issue                    |
| ---------- | ------------------------ | ----- | ------------------------ |
| Service    | `throw new Error('...')` | 3     | Generic errors           |
| Service    | `throw error`            | 4     | Re-throw without context |
| Service    | Return `null`            | 1     | Should be NotFoundError  |
| Controller | Generic 500              | 2     | No typed error handling  |

**Total Generic Errors**: 10

### Required Typed Errors

| Error Type      | Usage                                                         | Count |
| --------------- | ------------------------------------------------------------- | ----- |
| `NotFoundError` | findById, update, delete                                      | 3     |
| `ConflictError` | create (duplicate codigo), update (invalid estado transition) | 2     |

**Total Typed Errors Needed**: 5

---

## Logging Assessment

### Current Logging

| Method   | Logger.info | Logger.error | Status        |
| -------- | ----------- | ------------ | ------------- |
| findAll  | ❌ None     | ✅ Yes       | 🔴 Incomplete |
| findById | ❌ None     | ✅ Yes       | 🔴 Incomplete |
| create   | ❌ None     | ✅ Yes       | 🔴 Incomplete |
| update   | ❌ None     | ✅ Yes       | 🔴 Incomplete |
| delete   | ❌ None     | ✅ Yes       | 🔴 Incomplete |

**Logger.info Coverage**: 0/5 methods (0%)  
**Logger.error Coverage**: 5/5 methods (100%)

**Required Logger.info Additions**: 10 calls (entry + success for each method)

---

## Business Logic Requirements

### Estado Transition Rules

**Valid Transitions**:

```typescript
const ESTADO_TRANSITIONS: Record<EstadoLicitacion, EstadoLicitacion[]> = {
  PUBLICADO: ['EVALUACION', 'CANCELADO'],
  EVALUACION: ['ADJUDICADO', 'DESIERTO', 'CANCELADO'],
  ADJUDICADO: [], // Terminal state
  DESIERTO: [], // Terminal state
  CANCELADO: [], // Terminal state
};

function validateEstadoTransition(
  currentEstado: EstadoLicitacion,
  newEstado: EstadoLicitacion
): void {
  const allowedTransitions = ESTADO_TRANSITIONS[currentEstado];
  if (!allowedTransitions.includes(newEstado)) {
    throw new ConflictError(`Invalid estado transition from ${currentEstado} to ${newEstado}`, {
      currentEstado,
      newEstado,
      allowedTransitions,
    });
  }
}
```

### Business Validations Needed

1. **Create**:
   - ✅ Validate codigo uniqueness (already present)
   - ⚠️ Validate estado is in whitelist (optional, defaults to PUBLICADO)

2. **Update**:
   - ❌ Validate estado transitions (NOT present - **CRITICAL**)
   - ❌ Prevent updates to ADJUDICADO/DESIERTO/CANCELADO tenders
   - ⚠️ Validate fecha_presentacion >= fecha_convocatoria

3. **Delete**:
   - ⚠️ Should we allow deleting ADJUDICADO tenders? (Business decision)
   - Consider soft delete instead of hard delete

---

## Testing Status

**Current Test Coverage**: Assumed 0% (no test files found)

**Tests Needed** (deferred to Phase 21):

- Unit tests for all 5 core methods
- Estado transition validation tests
- Edge cases (null handling, invalid dates, etc.)

---

## Refactoring Priority Assessment

### High Priority (Must Fix)

1. ✅ Add tenantId parameter to all 5 core methods
2. ✅ Replace generic Error throws with NotFoundError/ConflictError
3. ✅ Add Logger.info (success logging) to all methods
4. ✅ Add pagination to findAll
5. ✅ Return DTOs instead of raw entities
6. ✅ Add estado transition validation to update()
7. ✅ Complete tender.dto.ts (add response DTO + transformers)
8. ✅ Refactor controller to pass tenantId
9. ✅ Add missing controller methods (getById, update, delete)
10. ✅ Add missing routes

### Medium Priority (Should Fix)

1. ⚠️ Change repository from getter to constructor initialization
2. ⚠️ Add TODO comments for tenant_id filtering (10+ places)
3. ⚠️ Add ConflictError handling in controller
4. ⚠️ Validate fecha_presentacion >= fecha_convocatoria

### Low Priority (Nice to Have)

1. 📝 Add JSDoc comments to all methods
2. 📝 Consider soft delete instead of hard delete
3. 📝 Add business rule: prevent editing finalized tenders
4. 📝 Add unit tests (deferred to Phase 21)

---

## Estimated Refactoring Effort

| Task                                                               | Estimated Time  |
| ------------------------------------------------------------------ | --------------- |
| Complete tender.dto.ts (response DTO + transformers)               | 30 min          |
| Refactor service (add tenantId, typed errors, logging, pagination) | 2-3 hours       |
| Add estado transition validation                                   | 30 min          |
| Refactor controller (tenantId, error handling, new methods)        | 1 hour          |
| Add missing routes                                                 | 15 min          |
| Test + build + commit                                              | 30 min          |
| **Total**                                                          | **4.5-5 hours** |

---

## Refactoring Checklist

### Service Layer (tender.service.ts)

- [ ] Add imports: `NotFoundError`, `ConflictError`, `TenderDto`, `LicitacionCreateDto`, `LicitacionUpdateDto`
- [ ] Change repository from getter to constructor initialization
- [ ] Add tenantId parameter to findAll, findById, create, update, delete
- [ ] Replace `throw new Error('...')` with typed errors (5 places)
- [ ] Replace null return with NotFoundError in findById
- [ ] Add Logger.info on method entry (5 methods)
- [ ] Add Logger.info on success (5 methods)
- [ ] Add TODO comments for tenant_id filtering (10+ places)
- [ ] Add pagination to findAll (return `{ data, total }`)
- [ ] Change return types from `Licitacion` to `TenderDto`
- [ ] Add estado transition validation to update()
- [ ] Add estado whitelist validation
- [ ] Refactor backward compat methods to use new signatures internally
- [ ] Add `@deprecated` JSDoc to backward compat methods
- [ ] Verify existence in delete() before deleting

### DTO Layer (tender.dto.ts)

- [ ] Add `TenderDto` response interface
- [ ] Add `toTenderDto(licitacion)` transformation function
- [ ] Add `toTenderDtoArray(licitaciones)` transformation function
- [ ] Verify input DTOs have proper validation decorators

### Controller Layer (tender.controller.ts)

- [ ] Add tenantId extraction (hardcode to 1 with TODO comment)
- [ ] Refactor getTenders to use findAll() with pagination
- [ ] Refactor createTender to use create()
- [ ] Add getTenderById() method (NEW)
- [ ] Add updateTender() method (NEW)
- [ ] Add deleteTender() method (NEW)
- [ ] Add NotFoundError handling (404)
- [ ] Add ConflictError handling (409)
- [ ] Add pagination params extraction (page, limit)
- [ ] Add filters extraction (search, estado)

### Routes Layer (tender.routes.ts)

- [ ] Add GET /:id route
- [ ] Add PUT /:id route with LicitacionUpdateDto validation
- [ ] Add DELETE /:id route

### Testing

- [ ] Run `npm test` - verify 152 tests still pass
- [ ] Run `npm run build` - verify clean build
- [ ] Run `npx eslint` - verify no warnings
- [ ] Manual test: Check estado transitions work correctly

### Documentation

- [ ] Update service-audit-progress.md (mark tender.service.ts as complete)
- [ ] Commit with detailed message

---

## Success Criteria

The refactoring is **COMPLETE** when:

1. ✅ All 5 core methods have tenantId parameter
2. ✅ No generic Error throws (use NotFoundError, ConflictError)
3. ✅ All methods have Logger.info (entry + success)
4. ✅ Estado transition validation implemented
5. ✅ DTOs used consistently (no raw entities returned)
6. ✅ Pagination added to findAll
7. ✅ Repository in constructor (not getter)
8. ✅ Controller passes tenantId to all service calls
9. ✅ All 5 CRUD routes exist (GET, GET/:id, POST, PUT/:id, DELETE/:id)
10. ✅ TODO comments for tenant_id filtering (10+ places)
11. ✅ All tests passing (152/152)
12. ✅ Clean build
13. ✅ Clean lint
14. ✅ Committed with detailed message
15. ✅ Progress tracker updated (should be 11/31, 35%)

---

## Next Steps

**After this audit is complete**:

1. Complete `tender.dto.ts` (add response DTO + transformers)
2. Refactor `tender.service.ts` following the patterns from sst.service.ts
3. Refactor `tender.controller.ts` (add new methods, handle typed errors)
4. Update `tender.routes.ts` (add missing routes)
5. Test frequently (`npm run build`, `npm test`)
6. Commit when all checks pass

**Estimated completion**: End of Session 11

---

## Appendix A: Estado Workflow Diagram

```
┌─────────────┐
│  PUBLICADO  │ (Initial state, default)
└─────────────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌──────────────┐
│ EVALUACION  │    │  CANCELADO   │ (Terminal)
└─────────────┘    └──────────────┘
       │
       ├──────────────────┬──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌──────────────┐  ┌──────────────┐
│ ADJUDICADO  │    │   DESIERTO   │  │  CANCELADO   │
│ (Terminal)  │    │  (Terminal)  │  │  (Terminal)  │
└─────────────┘    └──────────────┘  └──────────────┘
```

**Rules**:

- PUBLICADO can transition to EVALUACION or CANCELADO
- EVALUACION can transition to ADJUDICADO, DESIERTO, or CANCELADO
- ADJUDICADO, DESIERTO, CANCELADO are terminal states (no further transitions)
- Cannot reverse estados (e.g., EVALUACION → PUBLICADO is invalid)

---

## Appendix B: Field Mapping Reference

| Database Column (snake_case) | Entity Property (camelCase) | DTO Field (snake_case) | Type               |
| ---------------------------- | --------------------------- | ---------------------- | ------------------ |
| `id`                         | `id`                        | `id`                   | number             |
| `legacy_id`                  | `legacyId`                  | `legacy_id`            | string?            |
| `codigo`                     | `codigo`                    | `codigo`               | string             |
| `nombre`                     | `nombre`                    | `nombre`               | string             |
| `entidad_convocante`         | `entidadConvocante`         | `entidad_convocante`   | string?            |
| `monto_referencial`          | `montoReferencial`          | `monto_referencial`    | number?            |
| `fecha_convocatoria`         | `fechaConvocatoria`         | `fecha_convocatoria`   | string (ISO date)? |
| `fecha_presentacion`         | `fechaPresentacion`         | `fecha_presentacion`   | string (ISO date)? |
| `estado`                     | `estado`                    | `estado`               | EstadoLicitacion   |
| `observaciones`              | `observaciones`             | `observaciones`        | string?            |
| `created_at`                 | `createdAt`                 | `created_at`           | string (ISO)       |
| `updated_at`                 | `updatedAt`                 | `updated_at`           | string (ISO)       |

---

**End of Audit Report**
