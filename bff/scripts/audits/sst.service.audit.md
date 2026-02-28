# Service Audit: SstService (Safety & Health - Seguridad y Salud en el Trabajo)

**File**: `backend/src/services/sst.service.ts`  
**Date**: January 18, 2026  
**Audited By**: OpenCode Agent  
**Status**: 🔍 In Progress

---

## Overview

- **Lines of Code**: 139
- **Public Methods**: 8 (5 core + 3 backward compatibility)
- **Has Tests**: ❌ No (`sst.service.spec.ts` does not exist)
- **Test Coverage**: 0% (no tests)
- **Complexity**: 🟡 Moderate (CRUD + estado transitions + backward compatibility)
- **Related Files**:
  - Controller: `src/api/sst/sst.controller.ts` (62 lines)
  - Entity: `src/models/safety-incident.model.ts` (69 lines)
  - DTO: ❌ **MISSING** - need to create `src/types/dto/safety-incident.dto.ts`
  - Routes: `src/api/sst/sst.routes.ts`

---

## Database Analysis

### Table: `sst.incidente`

```sql
CREATE TABLE sst.incidente (
  id SERIAL PRIMARY KEY,
  legacy_id VARCHAR(50) UNIQUE,
  fecha_incidente TIMESTAMP NOT NULL,
  tipo_incidente VARCHAR(100),
  severidad VARCHAR(50),
  ubicacion TEXT,
  descripcion TEXT,
  acciones_tomadas TEXT,
  proyecto_id INTEGER REFERENCES proyectos.edt(id),
  reportado_por INTEGER REFERENCES sistema.usuario(id),
  estado VARCHAR(50) DEFAULT 'ABIERTO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**⚠️ CRITICAL FINDING**: Table has **NO `tenant_id` column**

**Impact**:

- Multi-tenant isolation NOT enforced at database level
- Service will need TODO comments for future migration
- Current implementation CAN access across tenants (security risk!)

**Indexes**:

- ✅ `idx_incidente_fecha` (fecha_incidente)
- ✅ `idx_incidente_tipo` (tipo_incidente)
- ✅ `idx_incidente_proyecto` (proyecto_id)
- ✅ `idx_incidente_estado` (estado)

---

## Entity Analysis

### Incidente Model

**File**: `src/models/safety-incident.model.ts`

**Enums Defined**:

```typescript
export type EstadoIncidente = 'ABIERTO' | 'EN_INVESTIGACION' | 'CERRADO';
export type SeveridadIncidente = 'LEVE' | 'MODERADO' | 'GRAVE' | 'MUY_GRAVE';
```

**Fields** (13 total):

- `id` (PK)
- `legacyId` (optional, unique)
- `fechaIncidente` (required, indexed)
- `tipoIncidente` (optional, indexed, no enum!)
- `severidad` (optional, enum SeveridadIncidente)
- `ubicacion` (optional)
- `descripcion` (optional)
- `accionesTomadas` (optional)
- `proyectoId` (optional, indexed)
- `reportadoPor` (optional)
- `estado` (required, default 'ABIERTO', enum EstadoIncidente, indexed)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Relations**:

- `reportador?: User` (ManyToOne, via reportadoPor)

**Backward Compatibility**:

```typescript
export { Incidente as SafetyIncident };
```

---

## Current Method Analysis

### 1. findAll(filters?)

**Signature**: `async findAll(filters?: { search?: string; estado?: string; severidad?: string; }): Promise<Incidente[]>`

**Current Implementation**:

```typescript
async findAll(filters?: {
  search?: string;
  estado?: string;
  severidad?: string;
}): Promise<Incidente[]> {
  try {
    const queryBuilder = this.repository.createQueryBuilder('i');

    if (filters?.estado) {
      queryBuilder.andWhere('i.estado = :estado', { estado: filters.estado });
    }

    if (filters?.severidad) {
      queryBuilder.andWhere('i.severidad = :severidad', { severidad: filters.severidad });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(i.descripcion ILIKE :search OR i.ubicacion ILIKE :search OR i.tipo_incidente ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    queryBuilder.orderBy('i.fecha_incidente', 'DESC');

    return await queryBuilder.getMany();
  } catch (error) {
    Logger.error('Error finding incidents', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      filters,
      context: 'SstService.findAll',
    });
    throw new Error('Error fetching incidents');
  }
}
```

**Issues**:

- ❌ No `tenantId` parameter
- ❌ No tenant_id filtering (missing column anyway)
- ❌ Returns raw `Incidente[]` instead of DTOs
- ❌ No pagination (`{ data, total }`)
- ❌ No Logger.info (only Logger.error)
- ❌ Throws generic `Error` instead of typed error

**Effort**: 🟡 Medium (add tenantId, pagination, DTOs, logging)

---

### 2. findById(id)

**Signature**: `async findById(id: number): Promise<Incidente | null>`

**Current Implementation**:

```typescript
async findById(id: number): Promise<Incidente | null> {
  try {
    return await this.repository.findOne({ where: { id } });
  } catch (error) {
    Logger.error('Error finding incident by id', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      id,
      context: 'SstService.findById',
    });
    throw error;
  }
}
```

**Issues**:

- ❌ No `tenantId` parameter
- ❌ No tenant_id filtering
- ❌ Returns `null` instead of throwing `NotFoundError`
- ❌ Returns raw `Incidente` instead of DTO
- ❌ No Logger.info (only Logger.error)

**Effort**: 🟢 Small (add tenantId, NotFoundError, DTO, logging)

---

### 3. create(data)

**Signature**: `async create(data: Partial<Incidente>): Promise<Incidente>`

**Current Implementation**:

```typescript
async create(data: Partial<Incidente>): Promise<Incidente> {
  try {
    const incidente = this.repository.create(data);
    return await this.repository.save(incidente);
  } catch (error) {
    Logger.error('Error creating incident', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: 'SstService.create',
    });
    throw error;
  }
}
```

**Issues**:

- ❌ No `tenantId` parameter
- ❌ No business validation:
  - Estado must be valid (ABIERTO, EN_INVESTIGACION, CERRADO)
  - Severidad must be valid (LEVE, MODERADO, GRAVE, MUY_GRAVE)
  - TipoIncidente has no enum (should we create one?)
- ❌ Returns raw `Incidente` instead of DTO
- ❌ No Logger.info (only Logger.error)
- ❌ No ConflictError for validation failures

**Effort**: 🟡 Medium (add tenantId, validation, DTO, logging)

---

### 4. update(id, data)

**Signature**: `async update(id: number, data: Partial<Incidente>): Promise<Incidente>`

**Current Implementation**:

```typescript
async update(id: number, data: Partial<Incidente>): Promise<Incidente> {
  try {
    const incidente = await this.findById(id);
    if (!incidente) {
      throw new Error('Incident not found');
    }

    Object.assign(incidente, data);
    return await this.repository.save(incidente);
  } catch (error) {
    Logger.error('Error updating incident', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      id,
      context: 'SstService.update',
    });
    throw error;
  }
}
```

**Issues**:

- ❌ No `tenantId` parameter
- ❌ Throws generic `Error('Incident not found')` instead of `NotFoundError`
- ❌ No estado transition validation:
  - ABIERTO → EN_INVESTIGACION ✅
  - ABIERTO → CERRADO ✅
  - EN_INVESTIGACION → CERRADO ✅
  - CERRADO → (no transitions allowed) ❌
  - Cannot reverse state backwards
- ❌ No severidad validation (if changed)
- ❌ Returns raw `Incidente` instead of DTO
- ❌ No Logger.info (only Logger.error)

**Effort**: 🟡 Medium (add tenantId, estado transitions, NotFoundError, DTO, logging)

---

### 5. delete(id)

**Signature**: `async delete(id: number): Promise<void>`

**Current Implementation**:

```typescript
async delete(id: number): Promise<void> {
  try {
    await this.repository.delete(id);
  } catch (error) {
    Logger.error('Error deleting incident', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      id,
      context: 'SstService.delete',
    });
    throw new Error('Failed to delete incident');
  }
}
```

**Issues**:

- ❌ No `tenantId` parameter
- ❌ No existence verification (silently succeeds if ID doesn't exist)
- ❌ Throws generic `Error('Failed to delete incident')` in catch block
- ❌ No Logger.info (only Logger.error)
- ⚠️ **HARD DELETE** - no soft delete (estado = 'ELIMINADO' pattern)

**Effort**: 🟢 Small (add tenantId, existence check, NotFoundError, logging)

---

### 6-8. Backward Compatibility Methods

#### 6. getAllIncidents()

**Signature**: `async getAllIncidents(): Promise<Incidente[]>`

**Implementation**: Simple wrapper around `findAll()`

**Usage Analysis**: ❌ **NOT USED** anywhere in codebase (except service itself)

**Recommendation**: 🗑️ **REMOVE** or add `@deprecated` JSDoc

---

#### 7. getIncidentById(id: string)

**Signature**: `async getIncidentById(id: string): Promise<Incidente | null>`

**Implementation**: Wrapper with string→number conversion

**Usage Analysis**: ❌ **NOT USED** anywhere in codebase

**Recommendation**: 🗑️ **REMOVE** or add `@deprecated` JSDoc

---

#### 8. createIncident(data: any)

**Signature**: `async createIncident(data: any): Promise<Incidente>`

**Implementation**: Field mapping (English → Spanish names)

**Usage Analysis**: ✅ **USED** in controller (`sst.controller.ts:33`)

**Current Mapping**:

```typescript
const mappedData: Partial<Incidente> = {
  proyectoId: data.projectId || data.proyectoId,
  fechaIncidente: data.incidentDate || data.fechaIncidente,
  tipoIncidente: data.incidentType || data.injuryType || data.tipoIncidente,
  severidad: data.severity || data.severidad,
  descripcion: data.description || data.descripcion,
  accionesTomadas: data.correctiveActions || data.accionesTomadas,
  estado: data.status || data.estado || 'ABIERTO',
};
```

**Recommendation**:

- ⚠️ **KEEP** but refactor to use create() internally
- ⚠️ Add `@deprecated` JSDoc
- ⚠️ Add validation
- ⚠️ Update controller to use `create()` directly instead

---

## Error Handling Analysis

### Current Pattern

**Service throws**:

- Generic `new Error('Error fetching incidents')` in findAll
- Generic `new Error('Incident not found')` in update
- Generic `new Error('Failed to delete incident')` in delete
- Re-throws caught errors in findById, create

**Controller has NO error handling**:

```typescript
// Controller directly accesses repository - bypasses service!
const incidentRepo = AppDataSource.getRepository(SafetyIncident);
const incidents = await incidentRepo.find({
  order: { fechaIncidente: 'DESC' },
});
sendSuccess(res, incidents);
```

### Issues Found

- [x] **Generic Errors**: Uses `throw new Error(...)` instead of custom error classes
- [x] **No NotFoundError**: Returns null or throws generic error
- [x] **No ConflictError**: No validation errors for business rules
- [x] **Missing Error Codes**: No machine-readable error codes
- [ ] **English Messages**: Error messages are in English (should be Spanish)
- [x] **No Error Logging**: Has error logging ✅ but missing success logging
- [ ] **No Re-throw**: Re-throws correctly ✅

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { NotFoundError, ConflictError } from '../errors/http.errors';
import Logger from '../utils/logger';

async findById(tenantId: number, id: number): Promise<SafetyIncidentDto> {
  try {
    Logger.info('Fetching safety incident', { tenantId, id, context: 'SstService.findById' });

    // TODO: Add tenant_id filter when column exists in sst.incidente table
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundError('Safety incident', id, { tenantId });
    }

    Logger.info('Safety incident fetched', { tenantId, id, context: 'SstService.findById' });
    return toSafetyIncidentDto(entity);
  } catch (error) {
    Logger.error('Error fetching safety incident', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'SstService.findById',
    });
    throw error;
  }
}

async update(tenantId: number, id: number, data: SafetyIncidentUpdateDto): Promise<SafetyIncidentDto> {
  try {
    Logger.info('Updating safety incident', { tenantId, id, data, context: 'SstService.update' });

    const existing = await this.findById(tenantId, id);

    // Business validation: estado transitions
    if (data.estado && data.estado !== existing.estado) {
      if (existing.estado === 'CERRADO') {
        throw new ConflictError('Cannot modify closed incident', {
          currentEstado: existing.estado,
          tenantId
        });
      }

      const validTransitions: Record<EstadoIncidente, EstadoIncidente[]> = {
        'ABIERTO': ['EN_INVESTIGACION', 'CERRADO'],
        'EN_INVESTIGACION': ['CERRADO'],
        'CERRADO': [],
      };

      if (!validTransitions[existing.estado].includes(data.estado)) {
        throw new ConflictError('Invalid estado transition', {
          from: existing.estado,
          to: data.estado,
          allowed: validTransitions[existing.estado],
          tenantId,
        });
      }
    }

    Object.assign(existing, data);
    const saved = await this.repository.save(existing);

    Logger.info('Safety incident updated', { tenantId, id, context: 'SstService.update' });
    return toSafetyIncidentDto(saved);
  } catch (error) {
    Logger.error('Error updating safety incident', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      data,
      context: 'SstService.update',
    });
    throw error;
  }
}
```

**Effort**: 🟡 Medium

---

## Return Type Analysis

### Current Pattern

**All methods return raw entities**:

- `findAll` → `Incidente[]`
- `findById` → `Incidente | null`
- `create` → `Incidente`
- `update` → `Incidente`
- `delete` → `void`

**Controller DOESN'T USE SERVICE**:

```typescript
// Controller bypasses service completely!
const incidentRepo = AppDataSource.getRepository(SafetyIncident);
const incidents = await incidentRepo.find(...);
sendSuccess(res, incidents);  // Returns raw entities
```

### Issues Found

- [x] **Returns Raw Entities**: All methods return `Incidente` instead of DTOs
- [x] **No DTO File**: `safety-incident.dto.ts` doesn't exist
- [x] **No Transformations**: No transformation functions
- [x] **No Pagination Shape**: findAll returns array, not `{ data, total }`
- [ ] **Controller Bypasses Service**: Controller accesses repository directly!

### Recommendations

**Step 1**: Create DTO file `src/types/dto/safety-incident.dto.ts`:

```typescript
// ✅ RECOMMENDED PATTERN
import { EstadoIncidente, SeveridadIncidente } from '../../models/safety-incident.model';
import { IsString, IsOptional, IsEnum, IsInt, IsDate } from 'class-validator';

// Response DTO (snake_case)
export interface SafetyIncidentDto {
  id: number;
  legacy_id?: string;
  fecha_incidente: Date;
  tipo_incidente?: string;
  severidad?: SeveridadIncidente;
  ubicacion?: string;
  descripcion?: string;
  acciones_tomadas?: string;
  proyecto_id?: number;
  reportado_por?: number;
  estado: EstadoIncidente;
  created_at: Date;
  updated_at: Date;
  reportador_nombre?: string; // From relation
}

// Create DTO with validation
export class SafetyIncidentCreateDto {
  @IsDate()
  fecha_incidente!: Date;

  @IsOptional()
  @IsString()
  tipo_incidente?: string;

  @IsOptional()
  @IsEnum(['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE'])
  severidad?: SeveridadIncidente;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  acciones_tomadas?: string;

  @IsOptional()
  @IsInt()
  proyecto_id?: number;

  @IsOptional()
  @IsInt()
  reportado_por?: number;

  @IsOptional()
  @IsEnum(['ABIERTO', 'EN_INVESTIGACION', 'CERRADO'])
  estado?: EstadoIncidente;
}

// Update DTO (all fields optional)
export class SafetyIncidentUpdateDto {
  @IsOptional()
  @IsString()
  tipo_incidente?: string;

  @IsOptional()
  @IsEnum(['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE'])
  severidad?: SeveridadIncidente;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  acciones_tomadas?: string;

  @IsOptional()
  @IsEnum(['ABIERTO', 'EN_INVESTIGACION', 'CERRADO'])
  estado?: EstadoIncidente;
}

// Transformation functions
export function toSafetyIncidentDto(entity: any): SafetyIncidentDto {
  return {
    id: entity.id,
    legacy_id: entity.legacyId || undefined,
    fecha_incidente: entity.fechaIncidente,
    tipo_incidente: entity.tipoIncidente || undefined,
    severidad: entity.severidad || undefined,
    ubicacion: entity.ubicacion || undefined,
    descripcion: entity.descripcion || undefined,
    acciones_tomadas: entity.accionesTomadas || undefined,
    proyecto_id: entity.proyectoId || undefined,
    reportado_por: entity.reportadoPor || undefined,
    estado: entity.estado,
    created_at: entity.createdAt,
    updated_at: entity.updatedAt,
    reportador_nombre: entity.reportador?.nombre_completo || undefined,
  };
}

export function toSafetyIncidentDtoArray(entities: any[]): SafetyIncidentDto[] {
  return entities.map(toSafetyIncidentDto);
}
```

**Step 2**: Update service to use DTOs:

```typescript
async findAll(
  tenantId: number,
  filters?: { search?: string; estado?: string; severidad?: string; },
  page = 1,
  limit = 10
): Promise<{ data: SafetyIncidentDto[]; total: number }> {
  // ... query logic

  const [entities, total] = await queryBuilder.getManyAndCount();

  return {
    data: toSafetyIncidentDtoArray(entities),
    total,
  };
}

async findById(tenantId: number, id: number): Promise<SafetyIncidentDto> {
  const entity = await this.repository.findOne({ where: { id } });

  if (!entity) {
    throw new NotFoundError('Safety incident', id, { tenantId });
  }

  return toSafetyIncidentDto(entity);
}
```

**Step 3**: Update controller to USE SERVICE instead of repository:

```typescript
// ❌ CURRENT (WRONG)
const incidentRepo = AppDataSource.getRepository(SafetyIncident);
const incidents = await incidentRepo.find(...);

// ✅ FIXED
const tenantId = 1; // TODO: Get from req.tenantContext
const result = await sstService.findAll(tenantId, filters, page, limit);
sendSuccess(res, result.data, result.total);
```

**Effort**: 🔴 Large (create DTO file, update service, refactor controller)

---

## Tenant Context Analysis

### Current Pattern

**No tenant context anywhere**:

```typescript
// Service methods have no tenantId parameter
async findAll(filters?: { ... }): Promise<Incidente[]>
async findById(id: number): Promise<Incidente | null>
async create(data: Partial<Incidente>): Promise<Incidente>
async update(id: number, data: Partial<Incidente>): Promise<Incidente>
async delete(id: number): Promise<void>
```

**Database has NO tenant_id column**:

```sql
CREATE TABLE sst.incidente (
  id SERIAL PRIMARY KEY,
  -- ... no tenant_id column!
);
```

### Issues Found

- [x] **No Tenant Parameter**: Methods don't accept `tenantId` parameter
- [x] **Missing Tenant Filter**: Queries don't filter by `tenant_id` (column doesn't exist!)
- [x] **Cross-Tenant Risk**: Can access other tenant's data (CRITICAL security issue)
- [x] **Inconsistent Tenant Usage**: No tenant usage at all
- [x] **No Tenant Verification**: Update/delete don't verify tenant ownership

### Recommendations

**Step 1**: Add tenantId parameter to all methods (even though column doesn't exist yet):

```typescript
// ✅ RECOMMENDED PATTERN
async findAll(
  tenantId: number,
  filters?: { search?: string; estado?: string; severidad?: string; },
  page = 1,
  limit = 10
): Promise<{ data: SafetyIncidentDto[]; total: number }> {
  try {
    Logger.info('Finding safety incidents', { tenantId, filters, page, limit, context: 'SstService.findAll' });

    const queryBuilder = this.repository
      .createQueryBuilder('i')
      // TODO: Add tenant_id filter when column exists in sst.incidente table
      // .where('i.tenant_id = :tenantId', { tenantId })
      .orderBy('i.fecha_incidente', 'DESC');

    // ... filters

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [entities, total] = await queryBuilder.getManyAndCount();

    Logger.info('Safety incidents found', { tenantId, count: entities.length, total, context: 'SstService.findAll' });
    return { data: toSafetyIncidentDtoArray(entities), total };
  } catch (error) {
    Logger.error('Error finding safety incidents', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      filters,
      context: 'SstService.findAll',
    });
    throw error;
  }
}

async findById(tenantId: number, id: number): Promise<SafetyIncidentDto> {
  try {
    Logger.info('Fetching safety incident', { tenantId, id, context: 'SstService.findById' });

    // TODO: Add tenant_id filter when column exists
    // const entity = await this.repository.findOne({ where: { id, tenant_id: tenantId } });
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundError('Safety incident', id, { tenantId });
    }

    Logger.info('Safety incident fetched', { tenantId, id, context: 'SstService.findById' });
    return toSafetyIncidentDto(entity);
  } catch (error) {
    Logger.error('Error fetching safety incident', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'SstService.findById',
    });
    throw error;
  }
}
```

**Step 2**: Update controller to pass tenantId:

```typescript
getIncidents = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = 1; // TODO: Get from req.tenantContext when auth middleware is implemented
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await sstService.findAll(tenantId, req.query, page, limit);
    sendSuccess(res, result.data, result.total);
  } catch (error: any) {
    // ... error handling
  }
};
```

**Effort**: 🟡 Medium (add tenantId everywhere, update controller, add TODO comments)

---

## Query Pattern Analysis

### Current Pattern

**findAll uses QueryBuilder** ✅:

```typescript
const queryBuilder = this.repository.createQueryBuilder('i');

if (filters?.estado) {
  queryBuilder.andWhere('i.estado = :estado', { estado: filters.estado });
}

queryBuilder.orderBy('i.fecha_incidente', 'DESC');
return await queryBuilder.getMany();
```

**findById uses simple find()** ✅:

```typescript
return await this.repository.findOne({ where: { id } });
```

### Issues Found

- [ ] **Uses find() Instead of QueryBuilder**: Uses QueryBuilder where appropriate ✅
- [x] **No Pagination**: findAll returns array, not getManyAndCount()
- [ ] **Missing Joins**: No relations loaded (but reportador relation exists)
- [ ] **Hardcoded Sorting**: Uses 'fecha_incidente' DESC (reasonable default)
- [ ] **SQL Injection Risk**: Uses parameterized queries ✅

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
async findAll(
  tenantId: number,
  filters?: { search?: string; estado?: string; severidad?: string; },
  page = 1,
  limit = 10
): Promise<{ data: SafetyIncidentDto[]; total: number }> {
  const queryBuilder = this.repository
    .createQueryBuilder('i')
    .leftJoinAndSelect('i.reportador', 'r')  // ✅ Load relation
    // TODO: Add tenant_id filter
    // .where('i.tenant_id = :tenantId', { tenantId })
    .orderBy('i.fecha_incidente', 'DESC');

  // Dynamic filters
  if (filters?.estado) {
    queryBuilder.andWhere('i.estado = :estado', { estado: filters.estado });
  }

  if (filters?.severidad) {
    queryBuilder.andWhere('i.severidad = :severidad', { severidad: filters.severidad });
  }

  if (filters?.search) {
    queryBuilder.andWhere(
      '(i.descripcion ILIKE :search OR i.ubicacion ILIKE :search OR i.tipo_incidente ILIKE :search)',
      { search: `%${filters.search}%` }
    );
  }

  // Pagination
  queryBuilder.skip((page - 1) * limit).take(limit);

  const [entities, total] = await queryBuilder.getManyAndCount();

  return {
    data: toSafetyIncidentDtoArray(entities),
    total,
  };
}
```

**Effort**: 🟢 Small (add pagination, load relation)

---

## Business Logic Analysis

### Current Business Rules

**Estado Transitions** (IMPLICIT - not enforced):

- ABIERTO → EN_INVESTIGACION (allowed)
- ABIERTO → CERRADO (allowed, but should require investigation?)
- EN_INVESTIGACION → CERRADO (allowed)
- CERRADO → (no transitions) (should be blocked)

**Severidad Enum** (DEFINED but not validated):

- LEVE
- MODERADO
- GRAVE
- MUY_GRAVE

**TipoIncidente** (NO ENUM - free text):

- Should we create an enum? (e.g., ACCIDENTE, INCIDENTE, CASI_ACCIDENTE, etc.)

**Default Estado**: 'ABIERTO' (enforced at database level)

### Issues Found

- [x] **No Business Validation**: Missing validation of business rules
- [x] **No State Validation**: Doesn't check estado transitions
- [ ] **No Dependency Checks**: No dependencies exist (incident is leaf entity)
- [ ] **No Transaction Management**: Single-entity operations don't need transactions
- [x] **Unclear Business Rules**: Estado transitions not documented

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import { ConflictError } from '../errors/http.errors';

async create(
  tenantId: number,
  data: SafetyIncidentCreateDto
): Promise<SafetyIncidentDto> {
  try {
    Logger.info('Creating safety incident', { tenantId, data, context: 'SstService.create' });

    // Business validation: estado must be valid
    const validEstados: EstadoIncidente[] = ['ABIERTO', 'EN_INVESTIGACION', 'CERRADO'];
    if (data.estado && !validEstados.includes(data.estado)) {
      throw new ConflictError('Invalid estado', {
        estado: data.estado,
        valid: validEstados,
        tenantId
      });
    }

    // Business validation: severidad must be valid
    const validSeveridades: SeveridadIncidente[] = ['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE'];
    if (data.severidad && !validSeveridades.includes(data.severidad)) {
      throw new ConflictError('Invalid severidad', {
        severidad: data.severidad,
        valid: validSeveridades,
        tenantId
      });
    }

    const entity = this.repository.create(data);
    const saved = await this.repository.save(entity);

    Logger.info('Safety incident created', { tenantId, id: saved.id, context: 'SstService.create' });
    return toSafetyIncidentDto(saved);
  } catch (error) {
    Logger.error('Error creating safety incident', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      data,
      context: 'SstService.create',
    });
    throw error;
  }
}

async update(
  tenantId: number,
  id: number,
  data: SafetyIncidentUpdateDto
): Promise<SafetyIncidentDto> {
  try {
    Logger.info('Updating safety incident', { tenantId, id, data, context: 'SstService.update' });

    // Verify existence first
    const existing = await this.findById(tenantId, id);

    // Business validation: estado transitions
    if (data.estado && data.estado !== existing.estado) {
      // Cannot modify closed incident
      if (existing.estado === 'CERRADO') {
        throw new ConflictError('Cannot modify closed incident', {
          currentEstado: existing.estado,
          tenantId
        });
      }

      // Define valid transitions
      const validTransitions: Record<EstadoIncidente, EstadoIncidente[]> = {
        'ABIERTO': ['EN_INVESTIGACION', 'CERRADO'],
        'EN_INVESTIGACION': ['CERRADO'],
        'CERRADO': [],
      };

      if (!validTransitions[existing.estado].includes(data.estado)) {
        throw new ConflictError('Invalid estado transition', {
          from: existing.estado,
          to: data.estado,
          allowed: validTransitions[existing.estado],
          tenantId,
        });
      }
    }

    // Business validation: severidad if changed
    if (data.severidad) {
      const validSeveridades: SeveridadIncidente[] = ['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE'];
      if (!validSeveridades.includes(data.severidad)) {
        throw new ConflictError('Invalid severidad', {
          severidad: data.severidad,
          valid: validSeveridades,
          tenantId
        });
      }
    }

    Object.assign(existing, data);
    const saved = await this.repository.save(existing);

    Logger.info('Safety incident updated', { tenantId, id, context: 'SstService.update' });
    return toSafetyIncidentDto(saved);
  } catch (error) {
    Logger.error('Error updating safety incident', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      data,
      context: 'SstService.update',
    });
    throw error;
  }
}
```

**Effort**: 🟡 Medium (add estado transitions, severidad validation)

---

## Logging Analysis

### Current Logging

**Service has Logger.error** ✅:

```typescript
Logger.error('Error finding incidents', {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  filters,
  context: 'SstService.findAll',
});
```

**Service has NO Logger.info** ❌:

- No success logging
- No entry logging
- No parameter logging

**Controller has Logger.error** ✅:

```typescript
Logger.error('Error fetching incidents', {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  context: 'SstController.getIncidents',
});
```

### Issues Found

- [ ] **No Logging**: Has error logging ✅
- [x] **Inconsistent Logging**: Only errors, no success logs
- [ ] **Missing Context**: Context included ✅
- [ ] **No Error Logging**: Has error logging ✅
- [ ] **Excessive Logging**: No excessive logging ✅

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
async findById(tenantId: number, id: number): Promise<SafetyIncidentDto> {
  try {
    Logger.info('Fetching safety incident', {
      tenantId,
      id,
      context: 'SstService.findById'
    });

    // ... logic

    Logger.info('Safety incident fetched', {
      tenantId,
      id,
      context: 'SstService.findById'
    });

    return toSafetyIncidentDto(entity);
  } catch (error) {
    Logger.error('Error fetching safety incident', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      id,
      context: 'SstService.findById',
    });
    throw error;
  }
}
```

**Effort**: 🟢 Small (add Logger.info to all methods)

---

## Repository Pattern Analysis

### Current Pattern

**Uses getter for repository** (UNUSUAL):

```typescript
private get repository(): Repository<Incidente> {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized');
  }
  return AppDataSource.getRepository(Incidente);
}
```

**Accessed in every method**:

```typescript
const queryBuilder = this.repository.createQueryBuilder('i');
```

### Issues Found

- [x] **Getter Pattern**: Uses getter instead of constructor initialization
- [x] **Initialization Check**: Checks isInitialized on every call (overhead)

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
export class SstService {
  private repository: Repository<Incidente>;

  constructor() {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    this.repository = AppDataSource.getRepository(Incidente);
  }

  // Methods...
}

export default new SstService();
```

**Effort**: 🟢 Small (change getter to constructor)

---

## Controller Analysis

### Current Implementation

**Controller BYPASSES service** ❌❌❌:

```typescript
export class SstController {
  getIncidents = async (req: Request, res: Response): Promise<void> => {
    try {
      // ❌ CRITICAL: Accesses repository directly, ignoring service layer!
      const incidentRepo = AppDataSource.getRepository(SafetyIncident);
      const incidents = await incidentRepo.find({
        order: { fechaIncidente: 'DESC' },
      });

      sendSuccess(res, incidents); // ❌ Returns raw entities
    } catch (error: any) {
      Logger.error('Error fetching incidents', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'SstController.getIncidents',
      });
      sendError(
        res,
        500,
        'INCIDENTS_FETCH_FAILED',
        'Error al obtener los incidentes de seguridad',
        error.message
      );
    }
  };

  createIncident = async (req: Request, res: Response): Promise<void> => {
    try {
      // ❌ CRITICAL: Accesses repository directly!
      const incidentRepo = AppDataSource.getRepository(SafetyIncident);

      const incidentData = {
        ...req.body,
        reportedById: (req as any).user?.id,
      };

      const incident = incidentRepo.create(incidentData);
      const savedIncident = await incidentRepo.save(incident);

      sendCreated(res, savedIncident); // ❌ Returns raw entity
    } catch (error: any) {
      Logger.error('Error creating incident', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'SstController.createIncident',
      });
      sendError(
        res,
        500,
        'INCIDENT_CREATE_FAILED',
        'Error al crear el incidente de seguridad',
        error.message
      );
    }
  };
}
```

### Issues Found

- [x] **CRITICAL: Service layer bypassed** - Controller accesses repository directly
- [x] **No tenantId usage** - No tenant context passed
- [x] **Returns raw entities** - No DTO transformation
- [x] **No pagination** - getIncidents returns all records
- [x] **No filters** - getIncidents ignores query params
- [x] **Generic error handling** - Doesn't catch NotFoundError, ConflictError
- [x] **Missing methods** - No getById, update, delete endpoints

### Recommendations

```typescript
// ✅ RECOMMENDED PATTERN
import sstService from '../../services/sst.service';
import { NotFoundError, ConflictError } from '../../errors/http.errors';
import { sendSuccess, sendError, sendCreated } from '../../utils/api-response';

export class SstController {
  getIncidents = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = 1; // TODO: Get from req.tenantContext when auth middleware is implemented
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters = {
        search: req.query.search as string,
        estado: req.query.estado as string,
        severidad: req.query.severidad as string,
      };

      const result = await sstService.findAll(tenantId, filters, page, limit);
      sendSuccess(res, result.data, result.total);
    } catch (error: any) {
      Logger.error('Error fetching incidents', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'SstController.getIncidents',
      });
      sendError(
        res,
        500,
        'INCIDENTS_FETCH_FAILED',
        'Error al obtener los incidentes de seguridad',
        error.message
      );
    }
  };

  getIncidentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = 1; // TODO: Get from req.tenantContext
      const id = parseInt(req.params.id);

      const incident = await sstService.findById(tenantId, id);
      sendSuccess(res, incident);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'INCIDENT_NOT_FOUND', 'Incidente no encontrado');
        return;
      }
      sendError(res, 500, 'INTERNAL_ERROR', 'Error al obtener el incidente', error.message);
    }
  };

  createIncident = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = 1; // TODO: Get from req.tenantContext
      const data = {
        ...req.body,
        reportado_por: (req as any).user?.id,
      };

      const incident = await sstService.create(tenantId, data);
      sendCreated(res, incident);
    } catch (error: any) {
      if (error instanceof ConflictError) {
        sendError(res, 409, 'VALIDATION_ERROR', error.message);
        return;
      }
      sendError(res, 500, 'INCIDENT_CREATE_FAILED', 'Error al crear el incidente', error.message);
    }
  };

  updateIncident = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = 1; // TODO: Get from req.tenantContext
      const id = parseInt(req.params.id);

      const incident = await sstService.update(tenantId, id, req.body);
      sendSuccess(res, incident);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'INCIDENT_NOT_FOUND', 'Incidente no encontrado');
        return;
      }
      if (error instanceof ConflictError) {
        sendError(res, 409, 'VALIDATION_ERROR', error.message);
        return;
      }
      sendError(res, 500, 'INTERNAL_ERROR', 'Error al actualizar el incidente', error.message);
    }
  };

  deleteIncident = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = 1; // TODO: Get from req.tenantContext
      const id = parseInt(req.params.id);

      await sstService.delete(tenantId, id);
      sendSuccess(res, { message: 'Incidente eliminado exitosamente' });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'INCIDENT_NOT_FOUND', 'Incidente no encontrado');
        return;
      }
      sendError(res, 500, 'INTERNAL_ERROR', 'Error al eliminar el incidente', error.message);
    }
  };
}
```

**Effort**: 🔴 Large (refactor controller to use service, add missing endpoints)

---

## Testing Analysis

### Current Test Coverage

- **Test File Exists**: ❌ No (`sst.service.spec.ts` does not exist)
- **Test Count**: 0 tests
- **Coverage**: 0%
- **Tests Run**: N/A

### Issues Found

- [x] **No Test File**: Service has no test file
- [x] **Low Coverage**: 0% coverage
- [x] **Missing Happy Path Tests**: No tests
- [x] **Missing Error Tests**: No tests
- [x] **No Tenant Isolation Tests**: No tests
- [x] **No Business Rule Tests**: No estado transition tests

### Recommendations

**DEFERRED to Phase 21** (Testing Phase)

Tests will be written after service refactoring is complete, covering:

- ✅ Happy path (CRUD operations)
- ✅ NotFoundError scenarios
- ✅ ConflictError scenarios (estado transitions, invalid severidad)
- ✅ Estado transition validation
- ✅ Tenant isolation (when tenant_id column exists)
- ✅ Pagination
- ✅ Filters (search, estado, severidad)

**Effort**: 🔴 Large (deferred to Phase 21)

---

## Summary

### Critical Issues (Fix First) 🔴

1. **Controller bypasses service layer** - Accesses repository directly (ARCHITECTURAL VIOLATION)
2. **No tenant context** - Missing tenantId parameter, can access across tenants (SECURITY RISK)
3. **Database missing tenant_id column** - Cannot enforce multi-tenant isolation at DB level
4. **No DTO file exists** - Returns raw entities, no transformation
5. **No pagination** - findAll returns unlimited array

### Important Issues (Fix Next) 🟡

1. **No estado transition validation** - Can update closed incidents, invalid transitions allowed
2. **No severidad validation** - Can set invalid severidad values
3. **Returns null instead of NotFoundError** - Inconsistent error handling
4. **Generic Error throws** - Uses `throw new Error(...)` instead of typed errors
5. **No Logger.info** - Only has error logging, missing success logging
6. **Repository uses getter** - Overhead on every call, should use constructor

### Nice to Have (Optional) 🟢

1. **Backward compat methods unused** - `getAllIncidents()`, `getIncidentById()` not used anywhere
2. **createIncident() used in controller** - Should migrate controller to use `create()` instead
3. **No tipoIncidente enum** - Free text, could benefit from enum
4. **No tests** - 0% coverage (deferred to Phase 21)
5. **Soft delete pattern** - Currently hard deletes, could use estado = 'ELIMINADO'

---

## Action Plan

### Step 1: Create DTO File (30 min)

- [ ] Create `src/types/dto/safety-incident.dto.ts`
- [ ] Define `SafetyIncidentDto` interface (snake_case)
- [ ] Define `SafetyIncidentCreateDto` class with validation decorators
- [ ] Define `SafetyIncidentUpdateDto` class with validation decorators
- [ ] Create transformation functions: `toSafetyIncidentDto()`, `toSafetyIncidentDtoArray()`
- [ ] Export all types

### Step 2: Refactor Service (2-3 hours)

**Import changes**:

- [ ] Import `NotFoundError`, `ConflictError` from errors
- [ ] Import DTO types and transformation functions
- [ ] Keep existing Logger import ✅

**Repository pattern**:

- [ ] Change getter to constructor initialization
- [ ] Move initialization check to constructor

**Method: findAll**:

- [ ] Add `tenantId: number` parameter
- [ ] Add `page = 1, limit = 10` parameters
- [ ] Change return type to `Promise<{ data: SafetyIncidentDto[]; total: number }>`
- [ ] Add TODO comment for tenant_id filter
- [ ] Add `Logger.info` at start
- [ ] Use `getManyAndCount()` instead of `getMany()`
- [ ] Transform entities to DTOs
- [ ] Add `Logger.info` at success
- [ ] Keep existing error logging ✅

**Method: findById**:

- [ ] Add `tenantId: number` parameter
- [ ] Change return type to `Promise<SafetyIncidentDto>`
- [ ] Add TODO comment for tenant_id filter
- [ ] Add `Logger.info` at start
- [ ] Replace `return null` with `throw new NotFoundError()`
- [ ] Transform entity to DTO
- [ ] Add `Logger.info` at success
- [ ] Keep existing error logging ✅

**Method: create**:

- [ ] Add `tenantId: number` parameter
- [ ] Change data type to `SafetyIncidentCreateDto`
- [ ] Change return type to `Promise<SafetyIncidentDto>`
- [ ] Add `Logger.info` at start
- [ ] Add estado validation (whitelist check)
- [ ] Add severidad validation (whitelist check)
- [ ] Transform saved entity to DTO
- [ ] Add `Logger.info` at success
- [ ] Keep existing error logging ✅

**Method: update**:

- [ ] Add `tenantId: number` parameter
- [ ] Change data type to `SafetyIncidentUpdateDto`
- [ ] Change return type to `Promise<SafetyIncidentDto>`
- [ ] Add `Logger.info` at start
- [ ] Call `findById(tenantId, id)` first (throws NotFoundError if not found)
- [ ] Replace generic `Error('Incident not found')` with NotFoundError
- [ ] Add estado transition validation (ABIERTO→EN_INVESTIGACION→CERRADO, no backwards)
- [ ] Add severidad validation if changed
- [ ] Transform saved entity to DTO
- [ ] Add `Logger.info` at success
- [ ] Keep existing error logging ✅

**Method: delete**:

- [ ] Add `tenantId: number` parameter
- [ ] Keep return type `Promise<void>`
- [ ] Add `Logger.info` at start
- [ ] Call `findById(tenantId, id)` first (verifies existence)
- [ ] Keep hard delete for now (can change to soft delete later)
- [ ] Add `Logger.info` at success
- [ ] Keep existing error logging ✅

**Backward compatibility methods**:

- [ ] Add `@deprecated` JSDoc to `getAllIncidents()`
- [ ] Add `@deprecated` JSDoc to `getIncidentById()`
- [ ] Keep `createIncident()` for now (used by controller)
- [ ] Refactor `createIncident()` to call `create()` internally with tenantId = 1

### Step 3: Refactor Controller (1 hour)

**Import changes**:

- [ ] Import `sstService` from service
- [ ] Import `NotFoundError`, `ConflictError` from errors

**Method: getIncidents**:

- [ ] Add tenantId extraction: `const tenantId = 1; // TODO: Get from req.tenantContext`
- [ ] Add pagination: `page`, `limit` from query params
- [ ] Extract filters from query params
- [ ] Replace repository call with `sstService.findAll(tenantId, filters, page, limit)`
- [ ] Update sendSuccess to accept `result.data`, `result.total`

**Method: createIncident**:

- [ ] Add tenantId extraction
- [ ] Replace repository call with `sstService.create(tenantId, data)`
- [ ] Add ConflictError handling (409)
- [ ] Update error handling

**New Methods** (ADD):

- [ ] `getIncidentById` - GET /incidents/:id
- [ ] `updateIncident` - PUT /incidents/:id
- [ ] `deleteIncident` - DELETE /incidents/:id

**Error handling**:

- [ ] Add NotFoundError → 404
- [ ] Add ConflictError → 409
- [ ] Keep generic error → 500

### Step 4: Update Routes (15 min)

**Add missing routes** (if not already present):

- [ ] GET /incidents/:id → getIncidentById
- [ ] PUT /incidents/:id → updateIncident
- [ ] DELETE /incidents/:id → deleteIncident

### Step 5: Test, Build, Commit (30 min)

**Testing**:

- [ ] Run `npm test` - should remain 152/152 passing
- [ ] Run `npm run build` - should be clean
- [ ] Run `npx eslint src/services/sst.service.ts --max-warnings=0`
- [ ] Run `npx eslint src/api/sst/sst.controller.ts --max-warnings=0`

**Git**:

- [ ] `git add backend/src/services/sst.service.ts`
- [ ] `git add backend/src/types/dto/safety-incident.dto.ts`
- [ ] `git add backend/src/api/sst/sst.controller.ts`
- [ ] `git add backend/scripts/audits/sst.service.audit.md`
- [ ] `git add backend/scripts/service-audit-progress.md`
- [ ] Commit message: `"refactor(safety): standardize sst service with tenant context and estado transitions"`

---

## Estimated Total Effort

**Overall Complexity**: 🟡 Medium (4-5 hours)

**Breakdown**:

1. DTO file creation: 30 min
2. Service refactoring: 2.5 hours
3. Controller refactoring: 1 hour
4. Routes update: 15 min
5. Testing & commit: 30 min

**Recommended Approach**:

1. Start with DTO file (foundation)
2. Refactor service methods one by one
3. Update controller to use service
4. Test frequently
5. Commit when all tests pass

---

## Sign-off

**Audit Complete**: January 18, 2026  
**Issues Fixed**: 0 / 21 (audit complete, refactoring pending)  
**Tests Added**: ❌ No (deferred to Phase 21)  
**Test Coverage**: 0% (pre-refactoring)  
**All Tests Passing**: ✅ Yes (152/152, unrelated to this service)  
**Ready for Production**: ❌ No (requires refactoring)

---

**Next Service**: `tender.service.ts` (Priority 2, tender workflow)
