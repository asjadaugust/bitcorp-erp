# Maintenance Schedule Recurring Service Audit

**Date**: 2026-01-19  
**Service**: `backend/src/services/maintenance-schedule-recurring.service.ts`  
**Lines of Code**: 378  
**Complexity**: 🟡 Moderate  
**Status**: ✅ Audit Complete - Ready for Refactoring

---

## Executive Summary

The `MaintenanceScheduleRecurringService` manages recurring maintenance schedules for equipment (e.g., "change oil every 250 hours"). This service handles patterns like preventive maintenance intervals and automatically calculates next due dates. The service requires standardization of error handling, logging, DTOs, and documentation to comply with `SERVICE_LAYER_STANDARDS.md`.

**Key Findings**:

- ✅ Already using TypeORM (migrated)
- ❌ No proper DTOs (mixing camelCase and snake_case)
- ❌ Generic `Error` object (1 instance - line 87)
- ❌ Missing error handling for database operations
- ❌ No success logging
- ❌ Minimal documentation needs enhancement
- ❌ Missing tenant context filtering
- ❌ Hard delete instead of soft delete (line 325)
- ❌ Null-assertion operators (`!`) at lines 279, 318, 375

---

## Current State Analysis

### 1. Error Handling Issues

**Generic Errors**: 1 direct throw + **11 locations need error handling**

| Method              | Line    | Issue                             | Current Behavior           | Required Fix                             |
| ------------------- | ------- | --------------------------------- | -------------------------- | ---------------------------------------- |
| `repository` getter | 87      | Generic `Error`                   | Throws generic error       | Replace with `DatabaseError`             |
| `findAll`           | 227     | No error handling on `.getMany()` | Silent failure or crash    | Wrap in try-catch, throw `DatabaseError` |
| `findById`          | 239     | No error handling on `.findOne()` | Silent failure or crash    | Wrap in try-catch, throw `DatabaseError` |
| `create`            | 271     | No error handling on `.save()`    | Silent failure or crash    | Wrap in try-catch, throw `DatabaseError` |
| `create`            | 279     | Assumes entity exists (uses `!`)  | Potential runtime error    | Check for null, throw `NotFoundError`    |
| `update`            | 289-292 | Returns null instead of throwing  | Inconsistent error pattern | Throw `NotFoundError`                    |
| `update`            | 310     | No error handling on `.save()`    | Silent failure or crash    | Wrap in try-catch, throw `DatabaseError` |
| `update`            | 318     | Assumes entity exists (uses `!`)  | Potential runtime error    | Check for null, throw `NotFoundError`    |
| `delete`            | 325     | No error handling on `.delete()`  | Silent failure or crash    | Wrap in try-catch, throw `DatabaseError` |
| `findDueSoon`       | 344     | No error handling on `.getMany()` | Silent failure or crash    | Wrap in try-catch, throw `DatabaseError` |
| `complete`          | 353-356 | Returns null instead of throwing  | Inconsistent error pattern | Throw `NotFoundError`                    |
| `complete`          | 367     | No error handling on `.save()`    | Silent failure or crash    | Wrap in try-catch, throw `DatabaseError` |
| `complete`          | 375     | Assumes entity exists (uses `!`)  | Potential runtime error    | Check for null, throw `NotFoundError`    |

**Expected Error Types**:

- `DatabaseError`: For database initialization and operations (10 instances)
- `NotFoundError`: When schedule not found (4 instances)

### 2. Return Type Issues

❌ **NON-COMPLIANT**: DTOs mix camelCase and snake_case, not following API standards.

**Current DTOs** (defined inline in service file):

- `MaintenanceScheduleDto`: Uses camelCase fields (`equipmentId`, `projectId`, etc.)
- `CreateMaintenanceScheduleDto`: Uses camelCase fields
- `UpdateMaintenanceScheduleDto`: Uses camelCase fields
- `MaintenanceScheduleFilter`: Uses camelCase fields

**Required**:

- Create proper DTO file: `/backend/src/types/dto/maintenance-schedule-recurring.dto.ts`
- Use snake_case for all API-facing fields (equipment_id, project_id, etc.)
- Implement transformation functions (toDto, fromDto)
- Support dual input format (camelCase + snake_case) for backward compatibility

### 3. Logging Issues

**Missing Success Logs**: All 7 methods lack success logging

| Method        | Missing Log               | Key Context                                                              |
| ------------- | ------------------------- | ------------------------------------------------------------------------ |
| `findAll`     | List schedules success    | `total`, `returned`, `filters`, `page`, `limit`                          |
| `findById`    | Get schedule success      | `id`, `equipment_id`, `maintenance_type`, `status`                       |
| `create`      | Create schedule success   | `id`, `equipment_id`, `interval_type`, `interval_value`, `next_due_date` |
| `update`      | Update schedule success   | `id`, `changed_fields`, `status`, `next_due_date`                        |
| `delete`      | Delete schedule success   | `id`                                                                     |
| `findDueSoon` | Get due soon success      | `total`, `days_ahead`                                                    |
| `complete`    | Complete schedule success | `id`, `last_completed_date`, `next_due_date`                             |

**Action**: Add `Logger.info()` calls to all 7 methods.

### 4. Documentation Issues

Current documentation is **minimal**.

**Required**:

- Comprehensive class-level JSDoc explaining:
  - Purpose: Recurring maintenance scheduling (vs one-time work orders)
  - Maintenance types: preventive, corrective, predictive, calibration, inspection
  - Interval types: hours, days, weeks, months, kilometers
  - Status states: active, inactive, suspended, completed
  - Auto-generation of maintenance tasks
  - Next due date calculation logic
- Method-level JSDoc with:
  - Detailed descriptions
  - `@param` tags
  - `@returns` tags
  - `@throws` tags for all error types
  - Examples for complex methods (especially `complete` method)

### 5. Tenant Context Issues

**No tenant filtering**: All queries lack `tenant_id` filtering.

**Locations needing TODOs** (9 locations):

1. `findAll` - Line 193 (queryBuilder)
2. `findById` - Line 239 (findOne)
3. `create` - Line 274 (findOne after save)
4. `update` - Line 289 (findOne - existence check)
5. `update` - Line 313 (findOne after save)
6. `delete` - Line 325 (delete)
7. `findDueSoon` - Line 336 (queryBuilder)
8. `complete` - Line 353 (findOne - existence check)
9. `complete` - Line 370 (findOne after save)

**Action**: Add `// TODO: Add tenant_id filter when schema updated (Phase 21)` comments.

### 6. Hard Delete Issue

**Line 325**: Uses `repository.delete()` which permanently removes data.

**Action**: Change to soft delete by setting `status = 'inactive'` or add `deleted_at` field.

**Note**: Since model doesn't have `deleted_at`, use `status = 'inactive'` for soft delete.

### 7. Repository Getter Pattern

**Lines 85-90**: Uses a getter pattern that throws generic error.

**Issues**:

1. Throws generic `Error` instead of custom error class
2. Getter pattern is unusual for service layer
3. Not consistent with other services

**Action**: Replace with standard constructor pattern.

---

## Required Changes Summary

### 1. Create DTO File

- New file: `/backend/src/types/dto/maintenance-schedule-recurring.dto.ts`
- Define snake_case DTOs (MaintenanceScheduleRecurringDto)
- Implement transformation functions (toDto, fromDto)
- Support dual input format for backward compatibility

### 2. Error Handling (13 locations)

- Import `NotFoundError`, `DatabaseError`, `DatabaseErrorType`
- Replace generic Error with `DatabaseError` (1 instance)
- Wrap all database operations in try-catch blocks (10 instances)
- Throw `NotFoundError` when schedule not found (4 instances)
- Remove null-assertion operator (`!`) and check explicitly (3 instances)

### 3. Logging (7 methods)

- Add success logs to all methods
- Include relevant context (id, equipment_id, interval info, dates, etc.)

### 4. Documentation

- Add comprehensive class-level JSDoc
- Add detailed method-level JSDoc with @param, @returns, @throws
- Document maintenance types and interval types
- Document status lifecycle
- Document next due date calculation logic
- Add examples

### 5. Tenant Context (9 locations)

- Add TODO comments for tenant_id filtering (deferred to Phase 21)

### 6. Soft Delete (1 location)

- Replace `repository.delete()` with status change (`status = 'inactive'`)

### 7. Repository Pattern (1 location)

- Replace getter pattern with standard constructor pattern

---

## Business Rules Documented

### Maintenance Types

1. **preventive**: Scheduled preventive maintenance (default)
2. **corrective**: Corrective maintenance to fix issues
3. **predictive**: Predictive maintenance based on analysis
4. **calibration**: Equipment calibration
5. **inspection**: Regular inspections

### Interval Types

1. **hours**: Based on equipment hours (e.g., every 250 hours)
2. **days**: Calendar days (e.g., every 30 days)
3. **weeks**: Calendar weeks (e.g., every 4 weeks)
4. **months**: Calendar months (e.g., every 6 months)
5. **kilometers**: Based on distance (e.g., every 1000 km)

### Status States

- `active`: Schedule is active and generating tasks
- `inactive`: Schedule is inactive (soft delete)
- `suspended`: Schedule temporarily suspended
- `completed`: Schedule completed (no longer recurring)

### Auto-Generate Tasks

- `true`: Automatically generate maintenance tasks when due
- `false`: Manual task creation required

### Next Due Date Calculation

- **days**: Current date + interval value
- **weeks**: Current date + (interval value × 7 days)
- **months**: Current date + interval value months
- **hours/kilometers**: Default to 30 days ahead (time-based approximation)

### Completion Workflow

When marking a schedule as complete:

1. Set `lastCompletedDate` to current date
2. Set `lastCompletedHours` to equipment hours at completion
3. Calculate `nextDueDate` based on interval
4. Calculate `nextDueHours` based on completion hours + interval

---

## Refactoring Plan

### Step 1: Create DTO File

- Create `/backend/src/types/dto/maintenance-schedule-recurring.dto.ts`
- Define interfaces with snake_case fields
- Implement transformation functions
- Export all types

### Step 2: Update Service Imports

- Import custom error classes
- Import Logger
- Import new DTOs from DTO file
- Remove inline DTO definitions

### Step 3: Replace Repository Getter

- Replace getter pattern with standard constructor pattern
- Initialize repository in constructor

### Step 4: Add Class Documentation

- Comprehensive class-level JSDoc
- Document maintenance types
- Document interval types
- Document status lifecycle
- Document business rules

### Step 5: Refactor `findAll`

- Wrap in try-catch
- Add `DatabaseError` on catch
- Add tenant context TODO
- Add success logging
- Update return type to use new DTOs

### Step 6: Refactor `findById`

- Wrap in try-catch
- Add `DatabaseError` on catch
- Add tenant context TODO
- Add success logging
- Update return type to use new DTOs

### Step 7: Refactor `create`

- Wrap save in try-catch
- Add `DatabaseError` on catch
- Check null explicitly instead of `!`
- Throw `NotFoundError` if reload fails
- Add tenant context TODO (reload query)
- Add success logging
- Update parameters to use new DTOs

### Step 8: Refactor `update`

- Throw `NotFoundError` instead of returning null
- Wrap save in try-catch
- Add `DatabaseError` on catch
- Check null explicitly instead of `!`
- Add tenant context TODOs (2 locations)
- Add success logging
- Update parameters to use new DTOs

### Step 9: Refactor `delete`

- Change to soft delete (set status = 'inactive')
- Fetch entity first
- Throw `NotFoundError` if not found
- Wrap save in try-catch
- Add `DatabaseError` on catch
- Add tenant context TODO
- Add success logging

### Step 10: Refactor `findDueSoon`

- Wrap in try-catch
- Add `DatabaseError` on catch
- Add tenant context TODO
- Add success logging
- Update return type to use new DTOs

### Step 11: Refactor `complete`

- Throw `NotFoundError` instead of returning null
- Wrap save in try-catch
- Add `DatabaseError` on catch
- Check null explicitly instead of `!`
- Add tenant context TODOs (2 locations)
- Add success logging
- Update return type to use new DTOs

### Step 12: Update All Method JSDoc

- Add @param tags
- Add @returns tags
- Add @throws tags
- Add examples

### Step 13: Remove Private Methods Export

- Keep `calculateNextDueDate` and `transformToDto` as private
- Document their purpose in class JSDoc

---

## Expected Outcome

### Metrics

- **Error Handling**: 13 locations fixed (1 generic Error, 4 NotFoundError, 10 DatabaseError)
- **Logging**: 7 success logs added
- **Documentation**: Comprehensive JSDoc for class + 7 methods
- **Tenant Context**: 9 TODO comments added
- **Soft Delete**: 1 hard delete → soft delete (status change)
- **Repository Pattern**: 1 getter → constructor
- **DTOs**: 1 new DTO file created with transformation functions
- **Test Coverage**: ~20 new tests

### Compliance

- ✅ Custom error classes
- ✅ Return DTOs (snake_case)
- ✅ Comprehensive logging
- ✅ Business rule documentation
- ✅ Tenant context marked (deferred to Phase 21)
- ✅ No singleton exports

### Files Created/Modified

1. `backend/src/types/dto/maintenance-schedule-recurring.dto.ts` (new file, ~350 lines)
2. `backend/src/services/maintenance-schedule-recurring.service.ts` (378 → ~750 lines)
3. `backend/src/services/maintenance-schedule-recurring.service.spec.ts` (new file, ~20 tests)

---

## Test Plan

### Test File: `maintenance-schedule-recurring.service.spec.ts`

**Structure** (~20 tests):

1. Service instantiation (1 test)
2. Method existence (7 tests)
3. Method signatures (7 tests)
4. Method names validation (1 test)
5. Service structure (4 tests: repository, calculateNextDueDate exists, transformToDto exists, no singleton)

**Pattern**: Lightweight tests, no database calls, follows established pattern from Sessions 1-19.

---

## DTO Design

### MaintenanceScheduleRecurringDto (snake_case)

```typescript
export interface MaintenanceScheduleRecurringDto {
  id: number;
  equipment_id: number;
  project_id?: number;
  maintenance_type: MaintenanceType;
  interval_type: IntervalType;
  interval_value: number;
  description?: string;
  notes?: string;
  status: ScheduleStatus;
  auto_generate_tasks: boolean;
  last_completed_date?: string; // ISO date
  last_completed_hours?: number;
  next_due_date?: string; // ISO date
  next_due_hours?: number;
  created_by_id?: number;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime

  // Computed relation fields
  equipment_code?: string;
  equipment_name?: string;
  project_name?: string;
}
```

### CreateMaintenanceScheduleRecurringDto (dual format)

```typescript
export interface CreateMaintenanceScheduleRecurringDto {
  // Spanish snake_case (preferred)
  equipment_id?: number;
  project_id?: number;
  maintenance_type?: MaintenanceType;
  interval_type?: IntervalType;
  interval_value?: number;
  description?: string;
  notes?: string;
  auto_generate_tasks?: boolean;
  created_by_id?: number;

  // English camelCase (backward compatibility)
  equipmentId?: number;
  projectId?: number;
  maintenanceType?: MaintenanceType;
  intervalType?: IntervalType;
  intervalValue?: number;
  autoGenerateTasks?: boolean;
  createdById?: number;
}
```

---

## Checklist

- [x] Audit document created
- [x] Error handling locations identified (13)
- [x] Logging locations identified (7)
- [x] Documentation needs assessed
- [x] Tenant context locations identified (9)
- [x] Business rules documented
- [x] Soft delete identified (1 location)
- [x] DTO design created
- [x] Repository pattern issue identified
- [x] Test plan created
- [x] Refactoring plan created

---

**Status**: ✅ Ready for refactoring  
**Estimated Refactoring Time**: 25-30 minutes  
**Complexity**: 🟡 Moderate (more complex than maintenance.service due to DTOs + more methods)
