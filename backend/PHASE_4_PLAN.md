# Phase 4: Error Handling, Logging & Observability

**Start Date:** January 17, 2026  
**Status:** In Progress  
**Priority:** HIGH  
**Estimated Duration:** 3-4 hours

---

## Executive Summary

Phase 4 focuses on implementing production-grade error handling, logging infrastructure, and observability across the Bitcorp ERP backend. Currently, the application uses `console.error` (268 occurrences) and has inconsistent error handling patterns, making debugging and monitoring difficult.

---

## Current State Problems

### 1. Logging Issues

- **268 console.error/warn statements** scattered across codebase
- No structured logging format
- No log levels (DEBUG, INFO, WARN, ERROR)
- Difficult to filter and search logs
- No request correlation tracking
- No performance monitoring

### 2. Error Handling Issues

- Inconsistent error formats in responses
- Generic error messages exposed to clients
- No error classification (validation, business logic, system)
- Stack traces sometimes exposed in production
- Difficult to trace errors across service boundaries
- No centralized error handling

### 3. Observability Issues

- No request/response logging
- No performance metrics
- No database query logging standardization
- Difficult to debug issues in production
- No audit trail for critical operations

---

## Phase 4 Objectives

### Primary Goals

1. ✅ **Implement Structured Logging** - Replace console.\* with Winston logger
2. ✅ **Standardize Error Handling** - Create custom error classes and middleware
3. ✅ **Add Request Tracking** - Implement correlation IDs for request tracing
4. ✅ **Create Error Response Contract** - Standardize all error responses
5. ✅ **Add Audit Logging** - Track critical operations (auth, data changes)

### Secondary Goals

6. ✅ **Performance Monitoring** - Add request duration logging
7. ✅ **Database Query Logging** - Structured TypeORM query logs
8. ✅ **Health Check Improvements** - Add detailed health checks
9. ✅ **Error Recovery** - Implement retry logic where appropriate

---

## Implementation Plan

### Sub-Phase 4.1: Logging Infrastructure ⏳

**Duration:** 1 hour  
**Files to Create:**

- `backend/src/config/logger.config.ts` - Winston logger configuration
- `backend/src/utils/logger.ts` - Logger utility wrapper
- `backend/src/middleware/request-logger.middleware.ts` - HTTP request logging

**Tasks:**

1. Install Winston and related dependencies
2. Create logger configuration with multiple transports
3. Implement log levels (error, warn, info, debug)
4. Add structured logging with metadata
5. Configure log rotation for production
6. Add correlation ID generation and tracking

**Success Criteria:**

- Winston logger configured with file and console transports
- All log levels working (error, warn, info, debug)
- Structured JSON logging for production
- Pretty-printed logs for development
- Correlation IDs added to all requests

---

### Sub-Phase 4.2: Custom Error Classes ⏳

**Duration:** 45 minutes  
**Files to Create:**

- `backend/src/errors/base.error.ts` - Base error class
- `backend/src/errors/http.errors.ts` - HTTP-specific errors
- `backend/src/errors/validation.error.ts` - Validation errors
- `backend/src/errors/database.error.ts` - Database errors
- `backend/src/errors/business.error.ts` - Business logic errors
- `backend/src/errors/index.ts` - Error exports

**Error Classes to Create:**

```typescript
// Base
AppError (abstract base)

// HTTP Errors
BadRequestError (400)
UnauthorizedError (401)
ForbiddenError (403)
NotFoundError (404)
ConflictError (409)
ValidationError (422)
InternalServerError (500)

// Domain-Specific
DatabaseError
BusinessRuleError
ExternalServiceError
```

**Success Criteria:**

- All error classes extend AppError
- Each error has proper HTTP status code
- Errors include context and metadata
- Error serialization to API format
- Type-safe error handling

---

### Sub-Phase 4.3: Error Handling Middleware ⏳

**Duration:** 45 minutes  
**Files to Create:**

- `backend/src/middleware/error-handler.middleware.ts` - Global error handler
- `backend/src/middleware/async-handler.ts` - Async route wrapper
- `backend/src/middleware/validation.middleware.ts` - Request validation

**Tasks:**

1. Create global error handler middleware
2. Implement async error handling wrapper
3. Add request validation middleware
4. Configure error response formatting
5. Add error logging with context
6. Implement error sanitization for production

**Success Criteria:**

- All errors caught and formatted consistently
- Stack traces hidden in production
- Detailed error logs with correlation IDs
- Validation errors return 422 with field details
- Unhandled errors return 500 with safe message

---

### Sub-Phase 4.4: Replace console.\* with Logger ⏳

**Duration:** 1 hour  
**Files to Modify:** ~40 service files

**Strategy:**

```typescript
// Before
console.error('Error finding project:', error);
console.log('Project created:', project.id);

// After
logger.error('Error finding project', {
  error: error.message,
  stack: error.stack,
  projectId: id,
});
logger.info('Project created', { projectId: project.id });
```

**Tasks:**

1. Create migration script to find all console.\* calls
2. Replace console.error → logger.error
3. Replace console.warn → logger.warn
4. Replace console.log → logger.info (in services)
5. Replace console.debug → logger.debug
6. Add context objects to all log calls
7. Ensure no console.\* in services (except startup)

**Success Criteria:**

- Zero console.error in services
- Zero console.warn in services
- Zero console.log in services
- All logs include correlation ID
- All logs have structured metadata

---

### Sub-Phase 4.5: Service Error Handling Update ⏳

**Duration:** 45 minutes  
**Files to Modify:** All service files

**Pattern to Apply:**

```typescript
// Before
async findById(id: string): Promise<Project> {
  try {
    const project = await this.repository.findOne({ where: { id } });
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  } catch (error) {
    console.error('Error finding project:', error);
    throw error;
  }
}

// After
async findById(id: string): Promise<Project> {
  try {
    const project = await this.repository.findOne({ where: { id: parseInt(id) } });

    if (!project) {
      throw new NotFoundError('Project', id);
    }

    return project;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Error finding project', {
      projectId: id,
      error: error.message,
      stack: error.stack
    });

    throw new DatabaseError('Failed to fetch project', error);
  }
}
```

**Tasks:**

1. Update all service methods to use custom errors
2. Add proper error context and metadata
3. Ensure error chaining (don't lose original error)
4. Add logger calls with correlation ID
5. Use specific error types (NotFoundError, ValidationError, etc.)

**Success Criteria:**

- All services use custom error classes
- All errors logged with context
- Error messages are user-friendly
- Technical details only in logs
- Proper error propagation

---

### Sub-Phase 4.6: Controller Error Handling ⏳

**Duration:** 30 minutes  
**Files to Modify:** All controller files

**Pattern to Apply:**

```typescript
// Before
async getProjectById(req: Request, res: Response) {
  try {
    const project = await this.projectService.findById(req.params.id);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

// After
async getProjectById(req: Request, res: Response, next: NextFunction) {
  const project = await this.projectService.findById(req.params.id);
  // Error middleware will catch any errors
  res.json({ success: true, data: project });
}
```

**Tasks:**

1. Remove try-catch from controllers (handled by middleware)
2. Use asyncHandler wrapper for all async routes
3. Add NextFunction parameter to all controller methods
4. Remove manual error response formatting
5. Let error middleware handle all errors

**Success Criteria:**

- Controllers are clean (no try-catch)
- All errors handled by middleware
- Consistent error response format
- Proper HTTP status codes

---

### Sub-Phase 4.7: Audit Logging ⏳

**Duration:** 30 minutes  
**Files to Create:**

- `backend/src/utils/audit-logger.ts` - Audit logging utility
- `backend/src/middleware/audit-logger.middleware.ts` - Audit middleware

**Events to Audit:**

- User login/logout
- Failed authentication attempts
- Data creation (projects, equipment, etc.)
- Data updates (critical fields)
- Data deletion
- Permission changes
- Configuration changes

**Tasks:**

1. Create audit logger with separate log file
2. Implement audit middleware for critical routes
3. Add audit logging to auth service
4. Add audit logging to critical data changes
5. Include user ID, IP, action, before/after values

**Success Criteria:**

- Audit logs in separate file
- All critical actions logged
- Audit logs include who, what, when, where
- Audit logs immutable (append-only)

---

### Sub-Phase 4.8: Health Check & Monitoring ⏳

**Duration:** 20 minutes  
**Files to Modify:**

- `backend/src/api/health/health.controller.ts` - Enhanced health check

**Tasks:**

1. Add database connectivity check
2. Add TypeORM connection status
3. Add Sequelize connection status (if still used)
4. Add memory usage metrics
5. Add uptime information
6. Add version information

**Success Criteria:**

- /health endpoint returns detailed status
- Database health checks working
- Memory and uptime metrics included
- Returns 503 if any critical service down

---

## Testing Strategy

### Unit Tests

- Test custom error classes
- Test logger utility functions
- Test error middleware

### Integration Tests

- Test error responses from endpoints
- Test correlation ID propagation
- Test audit logging triggers

### Manual Testing

- Verify all log levels working
- Verify error responses formatted correctly
- Verify logs include correlation IDs
- Verify audit logs capture critical actions
- Test error scenarios (404, 500, validation, etc.)

---

## Migration Strategy

### Phase 1: Infrastructure (Non-Breaking)

1. Add logger configuration
2. Add custom error classes
3. Add error middleware
4. Deploy without breaking existing code

### Phase 2: Service Migration (Breaking for Logs Only)

1. Replace console.\* with logger
2. Add custom errors to services
3. Test each service after migration
4. Deploy incrementally

### Phase 3: Controller Cleanup

1. Remove try-catch from controllers
2. Use asyncHandler wrapper
3. Test all endpoints
4. Deploy

### Phase 4: Monitoring & Observability

1. Add audit logging
2. Enhance health checks
3. Add performance monitoring
4. Deploy

---

## Success Criteria

### Must Have ✅

- [x] Winston logger configured and working
- [x] All console.error replaced with logger.error
- [x] All console.warn replaced with logger.warn
- [x] Custom error classes created
- [x] Global error handler middleware active
- [x] All errors return consistent format
- [x] Correlation IDs in all requests/logs
- [x] Audit logging for critical actions

### Nice to Have

- [ ] Performance metrics collection
- [ ] Log aggregation setup (ELK/CloudWatch)
- [ ] Error rate monitoring
- [ ] Automated alerts for errors

---

## Risks & Mitigation

### Risk 1: Breaking Existing Error Handling

**Impact:** HIGH  
**Probability:** MEDIUM  
**Mitigation:**

- Test thoroughly after each change
- Deploy incrementally
- Keep fallback to old error format if needed
- Monitor error rates after deployment

### Risk 2: Performance Impact from Logging

**Impact:** MEDIUM  
**Probability:** LOW  
**Mitigation:**

- Use async logging (Winston)
- Log rotation to prevent disk fills
- Adjustable log levels via environment
- Sampling for high-frequency logs

### Risk 3: Log File Growth

**Impact:** MEDIUM  
**Probability:** HIGH  
**Mitigation:**

- Implement log rotation (daily)
- Set max file size limits
- Configure retention policy (7-30 days)
- Use log aggregation service

---

## Rollback Plan

If Phase 4 causes issues:

1. **Revert Commits** - Each sub-phase is committed separately
2. **Feature Flag** - Add ENABLE_NEW_LOGGING env var
3. **Fallback Logger** - Keep console.\* as fallback
4. **Monitoring** - Watch error rates after deployment

---

## Dependencies

### NPM Packages to Install

```json
{
  "winston": "^3.11.0",
  "winston-daily-rotate-file": "^4.7.1",
  "express-async-handler": "^1.2.0",
  "uuid": "^9.0.1"
}
```

### Dev Dependencies

```json
{
  "@types/uuid": "^9.0.7"
}
```

---

## Documentation to Create

1. **PHASE_4_LOGGING_GUIDE.md** - How to use the logger
2. **PHASE_4_ERROR_HANDLING_GUIDE.md** - How to handle errors properly
3. **PHASE_4_AUDIT_LOGGING_GUIDE.md** - What actions trigger audit logs
4. **PHASE_4_IMPLEMENTATION.md** - Complete implementation details

---

## Timeline

| Sub-Phase                     | Duration       | Status  |
| ----------------------------- | -------------- | ------- |
| 4.1 Logging Infrastructure    | 1h             | Pending |
| 4.2 Custom Error Classes      | 45m            | Pending |
| 4.3 Error Middleware          | 45m            | Pending |
| 4.4 Replace console.\*        | 1h             | Pending |
| 4.5 Service Error Handling    | 45m            | Pending |
| 4.6 Controller Error Handling | 30m            | Pending |
| 4.7 Audit Logging             | 30m            | Pending |
| 4.8 Health Check              | 20m            | Pending |
| **Total**                     | **~5.5 hours** | **0%**  |

---

## Post-Phase 4 Improvements

After Phase 4 is complete, we can:

1. **Phase 5: Testing Infrastructure** - Add comprehensive tests
2. **Phase 6: API Documentation** - Generate OpenAPI/Swagger docs
3. **Phase 7: Performance Optimization** - Add caching, query optimization
4. **Phase 8: Security Hardening** - Rate limiting, input sanitization

---

**Next Steps:** Begin Sub-Phase 4.1 - Logging Infrastructure
