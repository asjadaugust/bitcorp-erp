# Service Audit: equipment-analytics.service.ts

**Date**: 2026-01-19  
**Service**: EquipmentAnalyticsService  
**Phase**: 20 - Service Layer Audit  
**Session**: 31 (FINAL SERVICE!)  
**Priority**: 3 (Complex)

---

## Metadata

| Metric                | Value                                              |
| --------------------- | -------------------------------------------------- |
| **Total Lines**       | 383                                                |
| **Methods**           | 9 (6 public + 3 interfaces + 1 helper)             |
| **Complexity**        | 🔴 Complex (Analytics, aggregations, calculations) |
| **Has Tests**         | ❌ No                                              |
| **TypeORM Migration** | ✅ Complete (Phase 3.10)                           |
| **Dependencies**      | Equipment, DailyReport entities                    |

---

## Current State Analysis

### Method Inventory

#### Public Methods (6)

1. **getEquipmentUtilization()** - Lines 100-152
   - Calculate utilization for single equipment
   - Inputs: equipmentId, startDate, endDate
   - Returns: UtilizationMetrics
   - Uses: Equipment, DailyReport

2. **getUtilizationTrend()** - Lines 159-203
   - Daily utilization trend over time
   - Inputs: equipmentId, startDate, endDate
   - Returns: UtilizationTrend[]
   - Uses: QueryBuilder aggregation

3. **getFleetUtilization()** - Lines 210-265
   - Fleet-wide metrics (all equipment)
   - Inputs: startDate, endDate, projectId (unused)
   - Returns: FleetUtilizationMetrics
   - Calculates: top performers, underutilized

4. **getFuelMetrics()** - Lines 272-303
   - Fuel consumption metrics
   - Inputs: equipmentId, startDate, endDate
   - Returns: FuelMetrics
   - Calculates: efficiency rating

5. **getFuelTrend()** - Lines 310-343
   - Daily fuel consumption trend
   - Inputs: equipmentId, startDate, endDate
   - Returns: FuelTrend[]

6. **getMaintenanceMetrics()** - Lines 354-370
   - Maintenance metrics (STUB - returns mock data)
   - TODO: Implement when maintenance_records exists
   - Returns: MaintenanceMetrics (hardcoded)

#### Helper Methods (1)

7. **calculateTotalPeriodHours()** - Lines 375-379
   - Calculate 24\*days between dates
   - Private helper

#### Interface Definitions (6)

- UtilizationMetrics
- FleetUtilizationMetrics
- UtilizationTrend
- FuelMetrics
- FuelTrend
- MaintenanceMetrics

---

## Issues Found

### 1. Error Handling ❌

**All methods throw generic Error:**

```typescript
throw new Error('Equipment not found'); // Lines 111, 169
```

**Should use:**

- NotFoundError for equipment not found
- ValidationError for invalid date ranges
- DatabaseError for query failures

### 2. No Success Logging ❌

**No logger.info() calls** for successful operations:

- Should log: equipment_id, date range, metrics calculated
- Should log: aggregation counts, trends returned

### 3. No Input Validation ❌

**Missing validations:**

- Date range validation (startDate < endDate)
- Date not in future
- equipmentId positive integer
- No check for null/undefined dates

### 4. No JSDoc Documentation ❌

**Only minimal comments:**

- No parameter descriptions
- No return type documentation
- No usage examples
- No business rule explanations

### 5. Constants Not Configurable ⚠️

**Hardcoded values:**

```typescript
DEFAULT_HOURLY_RATE = 50.0;
FUEL_PRICE_PER_GALLON = 3.5;
```

**Should consider:**

- Database configuration table
- Environment variables
- Per-equipment hourly rates

### 6. Incomplete Implementation ⚠️

**getMaintenanceMetrics() is a stub:**

- Returns mock data
- TODO comment since Phase 3.10
- Should either implement or remove

**projectId parameter ignored:**

- Line 213: \_projectId marked unused
- Comment says "Equipment table doesn't have project_id"
- Should clarify in documentation

### 7. No Caching ⚠️

**Expensive queries without caching:**

- getFleetUtilization() calls getEquipmentUtilization() for EVERY equipment
- Could be 50+ database queries for large fleets
- Should implement result caching or single aggregated query

---

## Refactoring Plan

### Step 1: Add Imports ✅

```typescript
import { NotFoundError, ValidationError, DatabaseError, DatabaseErrorType } from '../errors';
import logger from '../config/logger.config';
```

### Step 2: Add Class-Level JSDoc ✅

Document:

- Service purpose (analytics/metrics)
- 6 main metrics provided
- Constants used (hourly rate, fuel price)
- TypeORM migration note
- Performance considerations (caching needed)
- Known limitations (maintenance stub, no project filtering)

### Step 3: Add Method-Level JSDoc ✅

For each of 6 public methods:

- Description
- Parameters (with types and purpose)
- Returns (with structure)
- Throws (error types)
- Examples
- Performance notes (if applicable)

### Step 4: Replace Generic Errors ✅

**Pattern for getEquipmentUtilization():**

```typescript
if (!equipment) {
  throw new NotFoundError('Equipment', equipmentId);
}
```

**Pattern for all methods:**

```typescript
try {
  // ... logic
} catch (error) {
  if (error instanceof NotFoundError) {
    throw error;
  }
  throw new DatabaseError(
    'Failed to calculate utilization',
    DatabaseErrorType.QUERY,
    error instanceof Error ? error : undefined,
    { equipment_id: equipmentId, start_date: startDate, end_date: endDate }
  );
}
```

### Step 5: Add Input Validation ✅

**For all methods with date ranges:**

```typescript
// Validate date range
if (startDate >= endDate) {
  throw new ValidationError('Date range invalid', [
    {
      field: 'date_range',
      rule: 'startBeforeEnd',
      message: 'Start date must be before end date',
      value: { start: startDate, end: endDate },
    },
  ]);
}

// Validate dates not in future
const now = new Date();
if (endDate > now) {
  throw new ValidationError('Cannot calculate metrics for future dates', [
    {
      field: 'end_date',
      rule: 'notInFuture',
      message: 'End date cannot be in the future',
      value: endDate,
    },
  ]);
}
```

### Step 6: Add Success Logging ✅

**For each method:**

```typescript
logger.info('Equipment utilization calculated', {
  equipment_id: equipmentId,
  equipment_code: equipment.codigo_equipo,
  start_date: startDate.toISOString().split('T')[0],
  end_date: endDate.toISOString().split('T')[0],
  utilization_rate: utilizationRate.toFixed(2),
  working_hours: workingHours,
  total_cost: totalCost,
});
```

### Step 7: Document Limitations ✅

Add clear JSDoc comments:

- getMaintenanceMetrics() is a stub
- projectId parameter is ignored (no project_id in equipment table)
- Constants are hardcoded (not configurable)
- Fleet queries can be expensive (suggest caching)

---

## Implementation Notes

### Constants

**Current (hardcoded):**

```typescript
DEFAULT_HOURLY_RATE = 50.0;
FUEL_PRICE_PER_GALLON = 3.5;
```

**Future consideration:**

- Move to configuration table
- Support per-equipment hourly rates
- Support regional fuel prices

### Performance Optimization

**Current issue:**

```typescript
// getFleetUtilization() - calls getEquipmentUtilization() per equipment
const utilizationPromises = allEquipment.map((eq) =>
  this.getEquipmentUtilization(eq.id, startDate, endDate)
);
```

**If fleet has 50 equipment:**

- 50 separate Equipment queries
- 50 separate DailyReport queries
- = 100+ database queries

**Optimization suggestion (future):**

- Single aggregated query for all equipment
- Cache results (Redis, 5-15 minute TTL)
- Add "last updated" timestamp to response

### Maintenance Stub

**Current:**

```typescript
async getMaintenanceMetrics(...): Promise<MaintenanceMetrics> {
  // Return mock data - maintenance tracking not yet implemented
  // TODO: Implement when maintenance_records table/entity is created
  return {
    equipmentId,
    totalMaintenances: 0,
    totalDowntimeHours: 0,
    ...
  };
}
```

**Decision:**

- Keep as stub (don't remove - API contract)
- Document clearly in JSDoc
- Add TODO with Phase reference

---

## Business Rules

### Utilization Rate Calculation

```
utilization_rate = (working_hours / total_hours_in_period) * 100
total_hours_in_period = 24 * days_between_dates
```

### Cost Calculation

```
total_cost = working_hours * hourly_rate
hourly_rate = 50.0 (constant)
```

### Fuel Efficiency Rating

```
if avg_fuel_per_hour < 2 → 'good'
if avg_fuel_per_hour 2-4 → 'average'
if avg_fuel_per_hour > 4 → 'poor'
```

### Top Performers / Underutilized

```
top_performers = top 5 equipment by utilization_rate (descending)
underutilized = equipment with utilization_rate < 50% (bottom 5)
```

---

## Testing Recommendations

**Unit tests needed for:**

1. Date range validation
2. Utilization rate calculation
3. Cost calculation
4. Fuel efficiency classification
5. Top performers / underutilized logic
6. Error handling (equipment not found)

**Mock data:**

- Equipment: codigo_equipo, is_active
- DailyReport: horasTrabajadas, combustibleConsumed, fecha

---

## Standards Compliance Checklist

- [ ] Imports (NotFoundError, ValidationError, DatabaseError, logger)
- [ ] Class-level JSDoc (~300 lines)
- [ ] Method-level JSDoc (6 methods)
- [ ] Replace generic Error (2 locations)
- [ ] Add success logging (6 methods)
- [ ] Add input validation (date ranges, all methods)
- [ ] DatabaseError in all catch blocks
- [ ] Document limitations (maintenance stub, projectId)
- [ ] Build verification
- [ ] Tests (create basic tests)

---

## Related Services

- **equipment.service.ts** - Equipment CRUD (Session 21)
- **dashboard.service.ts** - Dashboard metrics (Session 13)
- **reporting.service.ts** - Report generation (Session 25)

---

## Estimated Effort

- JSDoc documentation: ~60 minutes
- Error replacement: ~20 minutes
- Input validation: ~30 minutes
- Success logging: ~20 minutes
- Testing: ~30 minutes (optional)
- **Total**: ~2.5 hours

---

## Priority

**HIGH** - Final service in Phase 20!

This is the **31st and LAST** service to refactor. Once complete:

- Phase 20: 100% complete (31/31 services)
- All services standardized
- Ready for Phase 21 (Tenant Context)

---

## Session Goals

1. ✅ Add comprehensive JSDoc (class + 6 methods)
2. ✅ Replace 2 generic errors with NotFoundError
3. ✅ Add DatabaseError to all 6 catch blocks
4. ✅ Add input validation (date ranges)
5. ✅ Add success logging (6 methods)
6. ✅ Document limitations (maintenance stub)
7. ✅ Build and verify
8. ✅ Commit and push
9. ✅ Update progress to 100% 🎉
10. ✅ Celebrate Phase 20 completion! 🎊

---

**Let's finish strong!** 💪
