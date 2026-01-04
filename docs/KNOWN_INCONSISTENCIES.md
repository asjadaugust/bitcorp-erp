# Known Schema Inconsistencies

This document tracks models and services that still use inconsistent naming conventions and need refactoring.

## Status: Sprint 2 Complete ✅

**Date**: January 4, 2026  
**Sprint**: 2 - Cleanup & Standards

## ✅ Fixed in Sprint 1 & 2

The following files have been fixed and use proper camelCase property names:

1. ✅ `/backend/src/api/logistics/movement.controller.ts`
2. ✅ `/backend/src/api/logistics/product.controller.ts`
3. ✅ `/backend/src/models/scheduled-task.model.ts`
4. ✅ `/backend/src/models/safety-incident.model.ts`
5. ✅ `/backend/src/services/scheduling.service.ts`
6. ✅ `/backend/src/services/reporting.service.ts`
7. ✅ `/backend/src/services/inventory.service.ts`
8. ✅ `/backend/src/services/administration.service.ts`
9. ✅ `/backend/src/services/cost-center.service.ts`

## ⚠️ Models Using snake_case (Legacy - Non-Critical)

These models use snake_case TypeScript properties but are working correctly. They should be refactored to camelCase in a future sprint for consistency:

### 1. Contract Model
**File**: `/backend/src/models/contract.model.ts`
**Issue**: Uses snake_case properties (`equipment_id`, `numero_contrato`, `fecha_inicio`, etc.)
**Impact**: LOW - Model is internally consistent
**Priority**: P3 (Nice to have)

**Example**:
```typescript
// Current (snake_case)
@Column({ name: 'equipo_id' })
equipment_id?: number;

// Should be (camelCase)
@Column({ name: 'equipo_id' })
equipmentId?: number;
```

### 2. Daily Report Model  
**File**: `/backend/src/models/daily-report.model.ts`
**Issue**: Uses snake_case properties (`operator_name`, `equipment_code`, `gps_latitude`, etc.)
**Impact**: LOW - Model is internally consistent
**Priority**: P3 (Nice to have)

### 3. Availability Model
**File**: `/backend/src/models/operator-availability.model.ts` (if exists)
**Issue**: Query builders use `is_active` in snake_case
**Impact**: LOW - Working correctly
**Priority**: P3 (Nice to have)

## ⚠️ Services Using Snake Case in Query Builders (Non-Critical)

These services use snake_case in query builders but are working because they're querying models that also use snake_case:

1. **Contract Service** (`/backend/src/services/contract.service.ts`)
   - Uses: `contract.equipment_id`
   - Works because Contract model uses snake_case
   - Should be refactored when Contract model is fixed

2. **Operator Availability Service** (if exists)
   - Uses: `avail.is_active`
   - Works with corresponding model
   - Non-critical

3. **Operator Document Service** (`/backend/src/services/operator-document.service.ts`)
   - Uses: `doc.is_active`, `doc.expiry_date`
   - Works with corresponding model
   - Non-critical

## 📝 Refactoring Plan (Future Sprint)

### Phase 1: Identify All Inconsistent Models
- [ ] Audit all models in `/backend/src/models/`
- [ ] Create list of models using snake_case
- [ ] Assess impact and dependencies

### Phase 2: Create Migration Script
- [ ] Build script to automatically convert snake_case to camelCase
- [ ] Update model properties
- [ ] Update all services/controllers using those models
- [ ] Add tests to verify no breakage

### Phase 3: Execute Refactoring
- [ ] Start with models with fewest dependencies
- [ ] Update one model + its services at a time
- [ ] Test thoroughly after each change
- [ ] Commit incrementally

### Phase 4: Verify & Document
- [ ] Run full test suite
- [ ] Check all endpoints
- [ ] Update SCHEMA_CONVENTIONS.md if needed
- [ ] Mark as complete

## 🎯 Current Standards (Enforced)

All **new** code must follow these standards:

### ✅ DO Use:
```typescript
// Models - Spanish-based camelCase
@Column({ name: 'equipo_id' })
equipmentId!: number;

@Column({ name: 'tipo_movimiento' })
tipoMovimiento!: string;

// Query Builders - TypeScript property names
.where('e.equipmentId = :id', { id })
.andWhere('m.tipoMovimiento = :type', { type })

// Raw SQL - Database column names
SELECT e.equipo_id, m.tipo_movimiento
FROM equipo.equipo e
```

### ❌ DON'T Use:
```typescript
// DON'T mix conventions
@Column({ name: 'equipo_id' })
equipment_id!: number;  // ❌ Should be equipmentId

// DON'T use DB columns in query builder  
.where('e.equipo_id = :id', { id })  // ❌ Should be e.equipmentId

// DON'T use TS properties in raw SQL
SELECT e.equipmentId FROM equipo e  // ❌ Should be e.equipo_id
```

## 🔍 How to Check for Issues

Run these commands to find potential issues:

```bash
# Find snake_case properties in models (excluding decorators)
rg "^\s+[a-z_]+_[a-z_]+[?!]:" backend/src/models/*.ts --no-filename | grep -v "@"

# Find snake_case usage in query builders
rg "\.where\(.*[a-z_]+_[a-z_]+" backend/src/services/*.ts

# Find models not using column name mapping
rg "@Column\(\)" backend/src/models/*.ts
```

## 📊 Progress Tracking

| Sprint | Files Fixed | Models Fixed | Services Fixed | Status |
|--------|-------------|--------------|----------------|--------|
| Sprint 1 | 8 | 2 | 5 | ✅ Complete |
| Sprint 2 | 3 | 0 | 2 | ✅ Complete |
| Sprint 3 | TBD | TBD | TBD | 🔜 Planned |

## 🚨 Critical vs Non-Critical

### Critical (Must Fix) ✅ DONE
Issues that cause "column does not exist" errors or runtime failures.
- All critical issues have been fixed in Sprint 1 & 2

### Non-Critical (Nice to Have)
Models internally consistent but not following project naming standards.
- Contract model - uses snake_case throughout
- Daily Report model - uses snake_case throughout
- These work fine but should be standardized eventually

## ✅ Quality Checks Passed

- [x] Zero "column does not exist" errors in logs
- [x] All critical endpoints tested and working
- [x] Documentation created (SCHEMA_CONVENTIONS.md)
- [x] README updated with references
- [x] Code compiles without errors
- [x] Services using camelCase where applicable

## 📚 Related Documentation

- [SCHEMA_CONVENTIONS.md](./SCHEMA_CONVENTIONS.md) - Complete naming guide
- [README.md](../README.md) - Project overview
- `/backend/src/models/` - Model definitions
- `/database/001_init_schema.sql` - Database schema

---

**Last Updated**: January 4, 2026  
**Maintained by**: Bitcorp ERP Development Team
