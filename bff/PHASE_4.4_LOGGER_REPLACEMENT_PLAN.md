# Phase 4.4: Replace console.\* with Logger

## Summary

**Total Occurrences:** 392 console.\* statements across 54 files  
**Strategy:** Replace incrementally by priority, starting with services and controllers  
**Testing:** Run tests after each file to ensure no breaking changes

---

## Console.\* Statement Distribution

```
392 matches
 54 files contained matches
238 files searched
```

### Top 20 Files by Console Usage

| File                                          | Count | Priority | Category   |
| --------------------------------------------- | ----- | -------- | ---------- |
| `services/tenant.service.ts`                  | 24    | HIGH     | Service    |
| `scripts/verify-accounts-payable.ts`          | 24    | LOW      | Script     |
| `scripts/verify-payment-schedule.ts`          | 20    | LOW      | Script     |
| `index.ts`                                    | 15    | CRITICAL | Startup    |
| `services/valuation.service.ts`               | 14    | HIGH     | Service    |
| `services/project.service.ts`                 | 13    | HIGH     | Service    |
| `api/tenant/index.ts`                         | 13    | HIGH     | Controller |
| `services/equipment.service.ts`               | 11    | HIGH     | Service    |
| `services/contract.service.ts`                | 11    | HIGH     | Service    |
| `services/auth.service.ts`                    | 11    | HIGH     | Service    |
| `api/projects/project.controller.ts`          | 11    | HIGH     | Controller |
| `services/puppeteer-pdf.service.ts`           | 10    | HIGH     | Service    |
| `database/seeders/index.ts`                   | 10    | LOW      | Seeder     |
| `api/contracts/contract.controller.ts`        | 10    | HIGH     | Controller |
| `api/auth/auth.simple.ts`                     | 10    | HIGH     | Controller |
| `services/cost-center.service.ts`             | 9     | HIGH     | Service    |
| `api/scheduling/scheduled-task.controller.ts` | 9     | MEDIUM   | Controller |
| `api/admin/cost-center.controller.ts`         | 9     | MEDIUM   | Controller |
| `services/provider.service.ts`                | 8     | HIGH     | Service    |
| `api/scheduling/timesheet.controller.ts`      | 8     | MEDIUM   | Controller |

---

## Replacement Strategy

### Phase 1: Critical Infrastructure (Priority 1)

**Estimated effort:** 30 minutes  
**Files:** 2  
**Occurrences:** ~20

1. **index.ts** (15 occurrences) - CRITICAL
   - Server startup logs
   - Database connection logs
   - Migration logs
   - Error logs

2. **config/database.config.ts** (2 occurrences)
   - Database connection success/failure

### Phase 2: High-Traffic Services (Priority 2)

**Estimated effort:** 2-3 hours  
**Files:** 15  
**Occurrences:** ~150

**Services to update:**

1. `services/auth.service.ts` (11) - Authentication logging
2. `services/project.service.ts` (13) - Project operations
3. `services/equipment.service.ts` (11) - Equipment operations
4. `services/contract.service.ts` (11) - Contract operations
5. `services/valuation.service.ts` (14) - Valuation operations
6. `services/provider.service.ts` (8) - Provider operations
7. `services/operator.service.ts` (7) - Operator operations
8. `services/cost-center.service.ts` (9) - Cost center operations
9. `services/tenant.service.ts` (24) - Multi-tenancy operations
10. `services/notification.service.ts` (3) - Notification operations
11. `services/puppeteer-pdf.service.ts` (10) - PDF generation
12. `services/employee.service.ts` (1) - Employee operations
13. `services/dashboard.service.ts` (4) - Dashboard data
14. `services/scheduling.service.ts` (5) - Scheduling operations
15. `services/sst.service.ts` (5) - Safety operations

### Phase 3: Controllers (Priority 3)

**Estimated effort:** 2-3 hours  
**Files:** 15  
**Occurrences:** ~100

**Controllers to update:**

1. `api/auth/auth.simple.ts` (10) - Authentication
2. `api/projects/project.controller.ts` (11) - Projects
3. `api/contracts/contract.controller.ts` (10) - Contracts
4. `api/admin/cost-center.controller.ts` (9) - Cost centers
5. `api/tenant/index.ts` (13) - Multi-tenancy
6. `api/dashboard/dashboard.controller.ts` (4) - Dashboard
7. `api/reports/report.controller.ts` (8) - Reports
8. `api/scheduling/timesheet.controller.ts` (8) - Timesheets
9. `api/scheduling/scheduled-task.controller.ts` (9) - Scheduled tasks
10. `api/scheduling/maintenance-schedule.controller.ts` (7) - Maintenance
11. `api/accounts-payable/accounts-payable.controller.ts` (6) - AP
12. `api/providers/provider.controller.ts` (8) - Providers
13. `api/sst/sst.controller.ts` (2) - SST
14. `api/analytics.ts` (6) - Analytics
15. `api/logistics/*.controller.ts` (8) - Logistics

### Phase 4: Middleware (Priority 4)

**Estimated effort:** 30 minutes  
**Files:** 2  
**Occurrences:** ~5

1. `middleware/tenant.middleware.ts` (2) - Tenant resolution errors
2. `middleware/auth.middleware.ts` (if any)

### Phase 5: Database Seeders (Priority 5 - Optional)

**Estimated effort:** 1 hour  
**Files:** 10  
**Occurrences:** ~50

**Note:** Seeders are run manually and their console.log statements are useful for tracking progress. These can be left as-is or updated last.

1. `database/seeders/index.ts` (10)
2. `database/seeders/001-sistema-seeder.ts` (2)
3. `database/seeders/002-core-entities-seeder.ts` (2)
4. `database/seeders/003-sig-seeder.ts` (3)
5. `database/seeders/004-operations-seeder.ts` (3)
6. `database/seeders/005-equipment-seeder.ts` (3)
7. `database/seeders/006-logistics-seeder.ts` (3)
8. `database/seeders/007-hr-seeder.ts` (3)
9. `database/seeders/008-checklists-seeder.ts` (3)
10. `database/seeders/009-administration-seeder.ts` (3)
11. `database/seeders/010-sst-seeder.ts` (4)

### Phase 6: Scripts (Priority 6 - Skip)

**Estimated effort:** N/A  
**Files:** 2  
**Occurrences:** ~44

**Note:** Verification scripts are not production code and can keep console.log.

1. `scripts/verify-accounts-payable.ts` (24) - SKIP
2. `scripts/verify-payment-schedule.ts` (20) - SKIP

---

## Replacement Patterns

### 1. Error Logging (console.error)

**Before:**

```typescript
try {
  // operation
} catch (error) {
  console.error('Error finding projects:', error);
  throw error;
}
```

**After:**

```typescript
import Logger from '../../utils/logger';

try {
  // operation
} catch (error) {
  Logger.error('Error finding projects', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: 'ProjectService.findAll',
  });
  throw error;
}
```

### 2. Info Logging (console.log)

**Before:**

```typescript
console.log('User created:', user.id);
console.log(`Found ${projects.length} projects`);
```

**After:**

```typescript
Logger.info('User created', {
  userId: user.id,
  username: user.username,
  context: 'AuthService.register',
});
Logger.info('Projects retrieved', { count: projects.length, context: 'ProjectService.findAll' });
```

### 3. Warning Logging (console.warn)

**Before:**

```typescript
console.warn('Deprecated method used');
console.warn('sistema.user_projects table does not exist');
```

**After:**

```typescript
Logger.warn('Deprecated method used', {
  method: 'oldMethod',
  alternative: 'newMethod',
  context: 'ProjectService.assignUser',
});
Logger.warn('Database table missing', {
  table: 'sistema.user_projects',
  operation: 'assignment',
  context: 'ProjectService.assignUser',
});
```

### 4. Debug Logging (console.log for debugging)

**Before:**

```typescript
console.log('User roles:', JSON.stringify(user.roles, null, 2));
console.log(`Role: ${r.name}, Code: ${r.code}`);
```

**After:**

```typescript
Logger.debug('User roles retrieved', { roles: user.roles, context: 'AuthService.login' });
Logger.debug('Processing role', {
  roleName: r.name,
  roleCode: r.code,
  context: 'AuthService.login',
});
```

### 5. Startup Logging (index.ts)

**Before:**

```typescript
console.log('Initializing databases...');
console.log('✅ All database connections established');
console.error('❌ Failed to start server:', error);
```

**After:**

```typescript
Logger.info('Initializing databases', { context: 'Server.startup' });
Logger.info('Database connections established', { context: 'Server.startup' });
Logger.error('Server startup failed', {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  context: 'Server.startup',
});
```

---

## Best Practices

### 1. Always Include Context

```typescript
Logger.error('Operation failed', {
  context: 'ServiceName.methodName', // REQUIRED
  // ... other metadata
});
```

### 2. Use Structured Metadata

```typescript
// ❌ BAD - String concatenation
Logger.info(`User ${userId} created project ${projectId}`);

// ✅ GOOD - Structured data
Logger.info('User created project', { userId, projectId, context: 'ProjectService.create' });
```

### 3. Include Relevant IDs

```typescript
Logger.error('Project not found', {
  projectId,
  userId,
  companyId,
  context: 'ProjectService.findById',
});
```

### 4. Don't Log Sensitive Data

```typescript
// ❌ BAD
Logger.info('User login', { password: user.password });

// ✅ GOOD
Logger.info('User login attempt', { username: user.username, hasPassword: !!user.password });
```

### 5. Use Appropriate Log Levels

| Level   | Usage                                                    | Examples                                        |
| ------- | -------------------------------------------------------- | ----------------------------------------------- |
| `error` | Unrecoverable errors, bugs, system failures              | Database connection failed, API call failed     |
| `warn`  | Operational errors, deprecated usage, recoverable issues | Missing optional config, deprecated method used |
| `info`  | Important business events, lifecycle events              | User logged in, project created, server started |
| `http`  | Request/response logs                                    | **Automatic via middleware**                    |
| `debug` | Detailed debugging information                           | Variable values, loop iterations, state changes |

### 6. Error Context Pattern

```typescript
try {
  const result = await operation();
  return result;
} catch (error) {
  Logger.error('Operation failed', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    operationParams: { param1, param2 },
    context: 'ServiceName.methodName',
  });

  // Re-throw with custom error if needed
  throw new InternalServerError('Failed to perform operation');
}
```

---

## Testing Checklist

After updating each file:

- [ ] Import Logger: `import Logger from '../utils/logger';` or `import Logger from '../../utils/logger';`
- [ ] All console.error → Logger.error with context
- [ ] All console.warn → Logger.warn with context
- [ ] All console.log → Logger.info or Logger.debug with context
- [ ] All console.debug → Logger.debug with context
- [ ] Run backend tests: `npm test`
- [ ] Check for TypeScript errors: `npm run lint`
- [ ] Verify logs in Docker: `docker-compose logs backend --tail 50`
- [ ] Test affected API endpoints manually (if applicable)

---

## Progress Tracking

### Phase 1: Critical Infrastructure ✅ (Ready to Start)

- [ ] `index.ts` (15 occurrences)
- [ ] `config/database.config.ts` (2 occurrences)

### Phase 2: High-Traffic Services (0/15 complete)

- [ ] `services/auth.service.ts` (11)
- [ ] `services/project.service.ts` (13)
- [ ] `services/equipment.service.ts` (11)
- [ ] `services/contract.service.ts` (11)
- [ ] `services/valuation.service.ts` (14)
- [ ] `services/provider.service.ts` (8)
- [ ] `services/operator.service.ts` (7)
- [ ] `services/cost-center.service.ts` (9)
- [ ] `services/tenant.service.ts` (24)
- [ ] `services/notification.service.ts` (3)
- [ ] `services/puppeteer-pdf.service.ts` (10)
- [ ] `services/employee.service.ts` (1)
- [ ] `services/dashboard.service.ts` (4)
- [ ] `services/scheduling.service.ts` (5)
- [ ] `services/sst.service.ts` (5)

### Phase 3: Controllers (0/15 complete)

- [ ] `api/auth/auth.simple.ts` (10)
- [ ] `api/projects/project.controller.ts` (11)
- [ ] `api/contracts/contract.controller.ts` (10)
- [ ] `api/admin/cost-center.controller.ts` (9)
- [ ] `api/tenant/index.ts` (13)
- [ ] `api/dashboard/dashboard.controller.ts` (4)
- [ ] `api/reports/report.controller.ts` (8)
- [ ] `api/scheduling/timesheet.controller.ts` (8)
- [ ] `api/scheduling/scheduled-task.controller.ts` (9)
- [ ] `api/scheduling/maintenance-schedule.controller.ts` (7)
- [ ] `api/accounts-payable/accounts-payable.controller.ts` (6)
- [ ] `api/providers/provider.controller.ts` (8)
- [ ] `api/sst/sst.controller.ts` (2)
- [ ] `api/analytics.ts` (6)
- [ ] `api/logistics/*.controller.ts` (8)

### Phase 4: Middleware (0/2 complete)

- [ ] `middleware/tenant.middleware.ts` (2)

### Phase 5: Database Seeders (OPTIONAL)

- [ ] All seeders (50+ occurrences)

### Phase 6: Scripts (SKIP)

- Scripts keep console.log (not production code)

---

## Estimated Timeline

| Phase                | Files  | Occurrences | Estimated Time | Status          |
| -------------------- | ------ | ----------- | -------------- | --------------- |
| Phase 1: Critical    | 2      | ~17         | 30 min         | ⏳ Ready        |
| Phase 2: Services    | 15     | ~150        | 2-3 hours      | 🔲 Pending      |
| Phase 3: Controllers | 15     | ~100        | 2-3 hours      | 🔲 Pending      |
| Phase 4: Middleware  | 2      | ~5          | 30 min         | 🔲 Pending      |
| Phase 5: Seeders     | 10     | ~50         | 1 hour         | 🔲 Optional     |
| **Total**            | **44** | **~322**    | **6-8 hours**  | **0% Complete** |

---

## Commit Strategy

Create commits after each phase:

1. **Phase 1 Commit:**

   ```
   feat(core): replace console.* with Logger in startup code

   - Updated index.ts with structured logging
   - Updated database.config.ts with Logger
   - All startup logs now use correlation tracking

   Progress: Phase 4.4 (1/4 complete)
   ```

2. **Phase 2 Commit:**

   ```
   feat(services): replace console.* with Logger in services

   - Updated 15 service files with structured logging
   - All errors now include context and stack traces
   - Business operations properly logged

   Progress: Phase 4.4 (2/4 complete)
   ```

3. **Phase 3 Commit:**

   ```
   feat(controllers): replace console.* with Logger in controllers

   - Updated 15 controller files with structured logging
   - All API errors properly tracked
   - Request context included in all logs

   Progress: Phase 4.4 (3/4 complete)
   ```

4. **Phase 4 Commit:**

   ```
   feat(middleware): replace console.* with Logger in middleware

   - Updated tenant and auth middleware
   - All middleware errors tracked with context

   Progress: Phase 4.4 complete - Ready for Phase 4.5
   ```

---

## Next Steps After Phase 4.4

Once all console.\* statements are replaced:

1. **Phase 4.5:** Update Service Error Handling
   - Use custom error classes in all services
   - Remove generic try-catch blocks
   - Let errors bubble up to global handler

2. **Phase 4.6:** Update Controller Error Handling
   - Use asyncHandler wrapper in all controllers
   - Remove controller-level try-catch blocks
   - Throw custom errors instead of sending responses

3. **Phase 4.7:** Implement Audit Logging
   - Log critical business operations
   - Track user actions (create, update, delete)
   - Compliance and security logging

4. **Phase 4.8:** Enhance Health Checks
   - Add database health check
   - Add cache health check (if applicable)
   - Return detailed status information

---

## Notes

- **Scripts are excluded** - They're not production code
- **Seeders are optional** - Their console.log is useful for progress tracking
- **Focus on production code first** - Services and controllers
- **Test incrementally** - Don't batch too many files before testing
- **Keep correlation IDs** - Logger automatically adds them
- **Use structured data** - Objects, not string concatenation
- **Include context always** - ServiceName.methodName format
