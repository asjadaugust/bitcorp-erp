# Backend API DTO Consistency - Implementation Summary

## Completed

### ✅ Module 1: Report Controller (CRITICAL)

**Commit**: `254d716` - fix(api): add response wrapper and pagination to report controller

**Changes Made**:

- Added `{success, data, pagination}` wrapper to all endpoints
- Replaced raw `res.json()` with proper wrapper format
- Implemented pagination for `getReports` endpoint (page, limit, total, totalPages)
- Replaced inline error responses with `sendError(res, status, code, message, details?)`
- All error responses now have proper error codes (e.g., `REPORT_NOT_FOUND`, `REPORT_LIST_FAILED`)

**Status**: ✅ COMPLETE - Backend restarted successfully

---

## Infrastructure Created

### Shared Types (`backend/src/types/dto/base.dto.ts`)

```typescript
- PaginationMeta interface
- PaginatedResponse<T> interface
- SingleResponse<T> interface
- ListResponse<T> interface (for small datasets <100 rows)
- ErrorResponse interface
- ApiResponse<T> type (union)
- ApiListResponse<T> type (union)
```

### Shared Utilities (`backend/src/utils/dto-transformer.ts`)

```typescript
- TransformFn<TEntity, TDto> type
- sendPaginatedDto() - Apply transformation + send paginated response
- sendDto() - Apply transformation + send single entity
- sendListDto() - Apply transformation + send list (no pagination)
- createTransformer() - Generic field mapper function
```

### Existing Utilities (`backend/src/utils/api-response.ts`)

```typescript
- sendSuccess() - Standard success response
- sendError() - Standard error response with code
- sendCreated() - 201 response
- sendNoContent() - 204 response
```

---

## Remaining High-Priority Modules

### 🔴 Module 2: Equipment Controller (HIGH - Core Module)

**File**: `backend/src/api/equipment/equipment.controller.ts`
**Service**: `backend/src/services/equipment.service.ts`

**Current Issues**:

- Returns raw TypeORM entity
- No `{success, data}` wrapper
- No pagination
- Manual field mapping in controller (camelCase→snake_case) should be in service
- Error responses use `{error: message}` instead of `sendError()`

**Required Changes**:

1. Service layer: Add transformation method

   ```typescript
   private transformToDto(equipment: Equipment): EquipmentDto {
     return {
       id: equipment.id,
       code: equipment.codigo_equipo,
       equipment_type: equipment.categoria,
       brand: equipment.marca,
       model: equipment.modelo,
       plate_number: equipment.placa,
       serial_number: equipment.numero_serie_equipo,
       status: equipment.estado,
       year: equipment.anio_fabricacion,
       provider_id: equipment.provider_id,
       provider_name: equipment.provider?.razon_social || null,
       hourmeter_reading: equipment.horometro || 0,
       odometer_reading: equipment.odometro || 0,
       is_active: equipment.is_active,
       created_at: equipment.created_at,
       updated_at: equipment.updated_at,
     };
   }
   ```

2. Update `findAll()` to return paginated DTO

   ```typescript
   async findAll(filter, page = 1, limit = 10): Promise<{data: EquipmentDto[], total: number}> {
     const [equipment, total] = await queryBuilder.getManyAndCount();
     return {
       data: equipment.map(e => this.transformToDto(e)),
       total
     };
   }
   ```

3. Controller: Use `sendPaginatedDto` or direct wrapper

   ```typescript
   const result = await this.equipmentService.findAll(filters, page, limit);
   res.json({
     success: true,
     data: result.data,
     pagination: {
       page,
       limit,
       total: result.total,
       totalPages: Math.ceil(result.total / limit),
     },
   });
   ```

4. Replace all `res.status().json({error})` with `sendError(res, status, code, message)`

5. Update `create()` and `update()` to return transformed DTO (not raw entity)

**Frontend Impact**: Equipment list/detail pages need update to handle `{success, data}` wrapper

---

### 🔴 Module 3: Fuel Controller (HIGH - Transform to snake_case)

**File**: `backend/src/api/fuel/fuel.controller.ts`
**Service**: `backend/src/services/fuel.service.ts`

**Current Issues**:

- Has `{success, data}` wrapper ✅
- Has pagination ✅
- BUT returns raw camelCase entity fields (`tipoCombustible`, `precioUnitario`)
- Inconsistent with movement/product controllers (snake_case)

**Required Changes**:

1. Service layer: Add transformation

   ```typescript
   private transformToDto(fuel: FuelRecord): FuelRecordDto {
     return {
       id: fuel.id,
       equipment_id: fuel.equipmentId,
       equipment_code: fuel.equipment?.codigo_equipo || null,
       fecha: fuel.fecha,
       tipo_combustible: fuel.tipoCombustible,
       cantidad: fuel.cantidad,
       precio_unitario: fuel.precioUnitario,
       monto_total: fuel.montoTotal,
       odometro: fuel.odometro,
       horometro: fuel.horometro,
       proyecto_id: fuel.projectId,
       project_name: fuel.project?.nombre || null,
       trabajador_id: fuel.trabajadorId,
       operator_name: fuel.trabajador ? `${fuel.trabajador.nombres} ${fuel.trabajador.apellido_paterno}` : null,
       created_at: fuel.createdAt,
     };
   }
   ```

2. Apply transformation in `findAll()` and `findById()`

**Frontend Impact**: Fuel module needs update to use snake_case field names

---

### 🟡 Module 4: Operator Document Controller (MEDIUM)

**File**: `backend/src/api/hr/operator-document.controller.ts`
**Service**: `backend/src/services/operator-document.service.ts`

**Current Issues**:

- Returns raw TypeORM entity with snake_case ✅ (already correct naming)
- No `{success, data}` wrapper
- No pagination
- Error responses use `{error: message}`

**Required Changes**:

1. Add `{success, data}` wrapper to all responses
2. Add pagination to `getAll()` endpoint
3. Replace error responses with `sendError()`
4. Optional: Add transformation to include operator_name from relation

**Frontend Impact**: HR document pages need wrapper handling

---

### 🟡 Module 5: Operator Availability Controller (MEDIUM)

**File**: `backend/src/api/hr/operator-availability.controller.ts`

**Current Issues**: Same as operator-document (raw entity, no wrapper, no pagination)

**Required Changes**: Same pattern as operator-document

---

### 🟡 Module 6: Accounts Payable Controller (MEDIUM)

**File**: `backend/src/api/accounts-payable/accounts-payable.controller.ts`

**Current Issues**:

- Returns raw entity
- No wrapper
- No pagination
- Error responses use `{message}` instead of `{error: {code, message}}`

**Required Changes**:

1. Add wrapper
2. Add pagination
3. Use `sendError()` for all errors
4. Transform to include provider_name from relation

---

### 🟢 Module 7: SST Controller (LOW - Incomplete CRUD)

**File**: `backend/src/api/sst/sst.controller.ts`

**Current Issues**:

- Missing getById, update, delete endpoints
- Has wrapper ✅ but no pagination

**Required Changes**:

1. Complete CRUD operations
2. Add pagination
3. Move repository access to service layer (currently in controller)

---

### 🟢 Module 8: Tender Controller (LOW - Incomplete CRUD)

**File**: `backend/src/api/tenders/tender.controller.ts`

**Current Issues**:

- Service has complete CRUD but controller doesn't expose it
- No wrapper
- No pagination

**Required Changes**:

1. Add missing controller methods (getById, update, delete)
2. Add wrapper
3. Add pagination

---

## Implementation Pattern Template

For any controller needing fixes, follow this pattern:

### Controller Pattern

```typescript
import { Request, Response } from 'express';
import { sendError } from '../../utils/api-response';
import { YourService } from '../../services/your.service';

export class YourController {
  private service = new YourService();

  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { data, total } = await this.service.findAll(filters, page, limit);

      res.json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      return sendError(res, 500, 'LIST_FAILED', 'Failed to fetch records', error.message);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const record = await this.service.findById(id);

      if (!record) {
        return sendError(res, 404, 'NOT_FOUND', 'Record not found');
      }

      res.json({
        success: true,
        data: record,
      });
    } catch (error: any) {
      return sendError(res, 500, 'GET_FAILED', 'Failed to fetch record', error.message);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const record = await this.service.create(req.body);

      res.status(201).json({
        success: true,
        data: record,
      });
    } catch (error: any) {
      return sendError(res, 400, 'CREATE_FAILED', 'Failed to create record', error.message);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const record = await this.service.update(id, req.body);

      if (!record) {
        return sendError(res, 404, 'NOT_FOUND', 'Record not found');
      }

      res.json({
        success: true,
        data: record,
      });
    } catch (error: any) {
      return sendError(res, 400, 'UPDATE_FAILED', 'Failed to update record', error.message);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = await this.service.delete(id);

      if (!success) {
        return sendError(res, 404, 'NOT_FOUND', 'Record not found');
      }

      res.json({
        success: true,
        data: { message: 'Record deleted successfully' },
      });
    } catch (error: any) {
      return sendError(res, 500, 'DELETE_FAILED', 'Failed to delete record', error.message);
    }
  }
}
```

### Service Pattern with Transformation

```typescript
export interface YourEntityDto {
  id: number;
  field_name: string; // snake_case
  related_name: string | null;
  created_at: Date;
  updated_at: Date;
}

export class YourService {
  private transformToDto(entity: YourEntity): YourEntityDto {
    return {
      id: entity.id,
      field_name: entity.fieldName, // camelCase DB → snake_case API
      related_name: entity.relation?.nombre || null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  async findAll(
    filters: any,
    page = 1,
    limit = 10
  ): Promise<{ data: YourEntityDto[]; total: number }> {
    const [entities, total] = await this.repository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.relation', 'r')
      // ... filters
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: entities.map((e) => this.transformToDto(e)),
      total,
    };
  }

  async findById(id: number): Promise<YourEntityDto | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['relation'],
    });

    return entity ? this.transformToDto(entity) : null;
  }

  async create(data: CreateDto): Promise<YourEntityDto> {
    const entity = this.repository.create(data);
    const saved = await this.repository.save(entity);

    // Reload with relations
    const full = await this.findById(saved.id);
    return full!;
  }

  async update(id: number, data: UpdateDto): Promise<YourEntityDto | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }
}
```

---

## Testing Checklist (Per Module)

After implementing each module:

1. **Restart backend**: `docker-compose restart backend`
2. **Check logs**: `docker-compose logs backend --tail=20`
3. **Test list endpoint**:

   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:3400/api/your-module?page=1&limit=10"
   ```

   Verify response has `{success: true, data: [], pagination: {}}`

4. **Test detail endpoint**:

   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:3400/api/your-module/1"
   ```

   Verify response has `{success: true, data: {}}`

5. **Navigate to frontend module** (e.g., `http://localhost:3420/equipment`)
6. **Check browser console** for errors
7. **Check frontend logs**: `docker-compose logs frontend --tail=20`
8. **Verify data displays correctly** in UI

---

## Frontend Update Pattern

For each fixed module, update the frontend service:

```typescript
// Before
getAll(): Observable<Entity[]> {
  return this.http.get<Entity[]>('/api/module');
}

// After
getAll(): Observable<Entity[]> {
  return this.http.get<any>('/api/module').pipe(
    map(response => response?.data || [])
  );
}
```

If pagination is added:

```typescript
getAll(page = 1, limit = 10): Observable<{data: Entity[], pagination: any}> {
  return this.http.get<any>(`/api/module?page=${page}&limit=${limit}`).pipe(
    map(response => ({
      data: response?.data || [],
      pagination: response?.pagination || {}
    }))
  );
}
```

---

## Commit Message Template

```
fix(api): add response wrapper and pagination to [module] controller

- Add {success, data, pagination} wrapper to all [module] endpoints
- Transform entity fields from camelCase to snake_case
- Replace raw error responses with sendError() utility
- Add pagination support to get[Module]s endpoint
- Ensure consistent error handling with error codes

BREAKING CHANGE: [module] endpoints now return {success, data} wrapper
```

---

## Rollout Strategy

### Phase 1: Critical (Do First)

1. ✅ Report Controller - COMPLETED
2. Equipment Controller
3. Fuel Controller

### Phase 2: High Usage

4. Operator Document
5. Operator Availability
6. Accounts Payable

### Phase 3: Complete CRUD

7. SST Controller
8. Tender Controller

### Phase 4: Verification

- Run E2E tests
- Manual testing of all modules
- Performance testing with pagination

---

## Risk Mitigation

### Frontend Breaking Changes

- Deploy backend + frontend together in same PR
- Test locally before deployment
- Have rollback plan (revert commit)

### Database Performance

- Pagination helps with large datasets
- Monitor query performance
- Add indexes if needed:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_table_created_at ON schema.table(created_at DESC);
  ```

### Error Response Changes

- All frontend error handlers need update
- Search for `error.message` → update to `error.error.message`
- Or use interceptor:
  ```typescript
  // Global HTTP interceptor
  return next.handle(req).pipe(
    catchError((err) => {
      const apiError = err.error?.error || { message: err.message };
      return throwError(() => apiError);
    })
  );
  ```

---

## Next Steps

1. Continue with Equipment Controller (high priority)
2. Apply same pattern to Fuel Controller
3. Update frontend services for fixed modules
4. Test each module in browser
5. Commit per module with conventional commits
6. Document any deviations or issues encountered
