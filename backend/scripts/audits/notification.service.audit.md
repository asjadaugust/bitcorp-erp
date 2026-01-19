# Service Audit: notification.service.ts

**Date**: January 19, 2026  
**Session**: 32 (FINAL SESSION - Phase 20 Complete!)  
**Auditor**: OpenCode Agent  
**Service Type**: Infrastructure/Communication  
**Complexity**: 🟡 Moderate

---

## Executive Summary

**notification.service.ts** is an infrastructure service handling in-app user notifications. This is the **FINAL SERVICE** of Phase 20 Service Layer Audit (31/31 services).

### Current State

- **File**: `/backend/src/services/notification.service.ts`
- **Lines of Code**: 199 lines
- **TypeORM Migration**: ✅ **FULLY MIGRATED** (Phase 3.6)
- **Methods**: 12 public methods (6 core + 6 helpers)
- **Dependencies**:
  - Notification entity (notifications table)
  - TypeORM Repository pattern
  - Logger (basic debug logging)

### Service Purpose

Manages in-app notifications for users:

- Create notifications (approval required, warnings, info, etc.)
- Retrieve user notifications (paginated)
- Mark notifications as read (single or bulk)
- Delete notifications
- Helper methods for common notification types

**NOTE**: This is **IN-APP notifications only** (database-backed). Does NOT handle:

- Email sending (separate email service would be needed)
- SMS notifications
- Push notifications (mobile/web push)
- Real-time WebSocket delivery

---

## Methods Analysis

### Core Methods (6)

1. **create(userId, type, title, message, options?): Promise<Notification>**
   - Creates a new notification record
   - TypeORM: ✅ Migrated (repository.save())
   - Input: userId (string), type (NotificationType enum), title, message, optional URL
   - Returns: Saved Notification entity
   - **Issues**:
     - No input validation (title/message could be empty)
     - No generic error → DatabaseError wrap
     - No success logging

2. **getUserNotifications(userId, limit = 20): Promise<Notification[]>**
   - Retrieves user's notifications (paginated, DESC order)
   - TypeORM: ✅ Migrated (repository.find() with options)
   - Input: userId (string), limit (number, default 20)
   - Returns: Array of Notification entities
   - **Issues**:
     - No validation (limit could be negative, 0, or >1000)
     - No generic error → DatabaseError wrap
     - No success logging

3. **getUnreadCount(userId): Promise<number>**
   - Counts unread notifications for user
   - TypeORM: ✅ Migrated (repository.count())
   - Input: userId (string)
   - Returns: Number of unread notifications
   - **Issues**:
     - No generic error → DatabaseError wrap
     - No success logging

4. **markAsRead(id, userId): Promise<Notification | null>**
   - Marks a single notification as read
   - TypeORM: ✅ Migrated (repository.update() + findOne())
   - Input: id (string), userId (string)
   - Returns: Updated notification or null if not found
   - **Issues**:
     - No NotFoundError if notification doesn't exist (returns null silently)
     - No generic error → DatabaseError wrap
     - No success logging

5. **markAllAsRead(userId): Promise<void>**
   - Marks all user's unread notifications as read
   - TypeORM: ✅ Migrated (repository.update() with criteria)
   - Input: userId (string)
   - Returns: void
   - **Issues**:
     - No generic error → DatabaseError wrap
     - No success logging (how many marked?)

6. **deleteNotification(id, userId): Promise<boolean>**
   - Hard deletes a notification
   - TypeORM: ✅ Migrated (repository.delete())
   - Input: id (string), userId (string)
   - Returns: true if deleted, false if not found
   - **Issues**:
     - Hard delete (no soft delete, audit trail lost)
     - No generic error → DatabaseError wrap
     - No success logging (or warning about hard delete)

### Helper Methods (6 - All Similar)

7. **notifyApprovalRequired(userId, title, message, link?)**: Wrapper for create('approval_required')
8. **notifyApprovalCompleted(userId, title, message, link?)**: Wrapper for create('approval_completed')
9. **notifyWarning(userId, title, message, options?)**: Wrapper for create('warning')
10. **notifyError(userId, title, message, options?)**: Wrapper for create('error')
11. **notifySuccess(userId, title, message, options?)**: Wrapper for create('success')
12. **notifyInfo(userId, title, message, options?)**: Wrapper for create('info')

**Issues with helpers**:

- No validation (delegate to create(), which also has no validation)
- No error handling (delegate to create())
- No logging (delegate to create())

### Stub Methods (3)

13. **checkMaintenanceDue()**: TODO stub - checks for maintenance due dates
14. **checkContractExpirations()**: TODO stub - checks for expiring contracts
15. **checkCertificationExpiry()**: TODO stub - checks for expiring certifications

**Issues**:

- All return void (should return notification IDs or counts?)
- Only debug logging (no actual logic implemented)
- Should be marked as @stub in JSDoc

---

## Identified Issues

### 1. Missing Class-Level JSDoc ⚠️

**Current**: Only 16 lines of comments (migration notes)
**Required**: Comprehensive JSDoc with:

- Service purpose and scope
- Notification types (all 6 types documented)
- In-app vs external notifications clarification
- Database schema (notifications table structure)
- Business rules (who can send, read, delete)
- Known limitations (no email/SMS, stubs, no soft delete)
- Usage examples
- Related services (if email service exists)

### 2. Missing Method-Level JSDoc ⚠️

**Current**: Each method has 1-line comment + migration note
**Required**: Full JSDoc for all 12 methods (6 core + 6 helpers):

- @description with detailed purpose
- @param with validation rules
- @returns with structure
- @throws with error conditions
- @example with usage code
- @see cross-references to related methods

### 3. No Input Validation ⚠️

**Missing validations**:

- `create()`: title/message empty, title >200 chars, message >1000 chars
- `getUserNotifications()`: limit < 1 or > 1000
- All methods: userId must be valid integer string

**Fix**: Add ValidationError for invalid inputs

### 4. No Custom Error Types ⚠️

**Current**: No explicit error handling (relies on TypeORM exceptions)
**Required**:

- NotFoundError when notification not found (markAsRead, deleteNotification)
- DatabaseError catch blocks for all database operations
- ValidationError for invalid inputs

**Locations**:

- 0 generic errors to replace (no explicit throws currently)
- Need to add try-catch to all 6 core methods

### 5. No Success Logging ⚠️

**Current**: Only debug logging in stub methods
**Required**: Log success for all operations with relevant metrics:

- `create()`: notification_id, user_id, type, title
- `getUserNotifications()`: user_id, count_returned, limit
- `getUnreadCount()`: user_id, unread_count
- `markAsRead()`: notification_id, user_id
- `markAllAsRead()`: user_id, count_marked
- `deleteNotification()`: notification_id, user_id (with warning about hard delete)

### 6. Hard Delete Without Warning ⚠️

**Issue**: `deleteNotification()` hard deletes records (no audit trail)
**Fix**: Log warning about hard delete (similar to accounts-payable.service.ts pattern)

### 7. Silent Null Returns ⚠️

**Issue**: `markAsRead()` returns null if notification not found (no error)
**Fix**: Check result.affected and throw NotFoundError if 0

---

## NotificationType Enum

```typescript
export enum NotificationType {
  'approval_required',
  'approval_completed',
  'warning',
  'error',
  'success',
  'info',
}
```

### Type Meanings

- **approval_required**: User action needed (approve valuation, contract, etc.)
- **approval_completed**: Approval decision made (approved/rejected)
- **warning**: Important alert (contract expiring soon, maintenance due)
- **error**: System error or failed operation
- **success**: Operation completed successfully
- **info**: General information (new feature, system update)

---

## Database Schema (notifications table)

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES usuarios(id_usuario),
  type VARCHAR(50) NOT NULL,  -- NotificationType enum
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  url VARCHAR(500),           -- Optional link to related resource
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

---

## Business Rules

### Notification Creation

1. Any authenticated user can receive notifications
2. System creates notifications programmatically (not user-submitted)
3. Title max 200 chars, message max 1000 chars
4. URL optional (link to equipment detail, contract, etc.)
5. Default: unread (read = false)

### Notification Reading

1. User can only view their own notifications
2. Marking as read sets read_at timestamp
3. Unread count used for badge in UI

### Notification Deletion

1. User can only delete their own notifications
2. Hard delete (no soft delete or audit trail)
3. Usually used for "dismiss notification" feature

### Pagination

- Default limit: 20 notifications
- Max limit: Should be 100 (not enforced currently)
- Order: DESC by created_at (newest first)

---

## Known Limitations

1. **No Email/SMS/Push**: Only in-app database notifications
2. **No Real-Time Delivery**: No WebSocket/SSE push (requires polling)
3. **Stub Methods**: checkMaintenanceDue, checkContractExpirations, checkCertificationExpiry not implemented
4. **Hard Delete Only**: No soft delete or retention policy
5. **No Notification Templates**: Title/message passed as plain strings
6. **No Batch Creation**: No method to create multiple notifications at once
7. **No Priority/Urgency**: All notifications same priority
8. **No Read Receipts**: Can't track when user actually saw notification

---

## Refactoring Plan

### Step 1: Add Imports

```typescript
import { NotFoundError, ValidationError, DatabaseError, DatabaseErrorType } from '../errors';
import logger from '../config/logger.config';
```

### Step 2: Add Class-Level JSDoc (~200-250 lines)

- Service purpose (in-app notifications)
- All 6 notification types documented
- Database schema
- Business rules (creation, reading, deletion)
- Limitations (no email, stubs, hard delete)
- Usage examples (3-4 scenarios)

### Step 3: Add Method-Level JSDoc (12 methods, ~350-400 lines)

- Core methods: Full documentation with examples
- Helper methods: Reference core create() method
- Stub methods: Mark as @stub, add @todo

### Step 4: Add Input Validation (3 methods)

```typescript
// create()
if (!title?.trim()) throw new ValidationError('title', title, 'Title is required');
if (title.length > 200) throw new ValidationError('title', title, 'Title max 200 chars');
if (!message?.trim()) throw new ValidationError('message', message, 'Message is required');
if (message.length > 1000) throw new ValidationError('message', message, 'Message max 1000 chars');

// getUserNotifications()
if (limit < 1 || limit > 1000) throw new ValidationError('limit', limit, 'Limit must be 1-1000');

// All methods with userId
const parsedUserId = parseInt(userId);
if (isNaN(parsedUserId)) throw new ValidationError('userId', userId, 'Invalid user ID');
```

### Step 5: Replace Silent Null → NotFoundError (1 location)

```typescript
// markAsRead() - check if notification exists before update
const notification = await this.repository.findOne({
  where: { id: notificationId, userId: parsedUserId },
});

if (!notification) {
  throw new NotFoundError('Notification', notificationId.toString());
}

// Then do update...
```

### Step 6: Add DatabaseError Catch Blocks (6 methods)

Wrap all repository operations:

- create()
- getUserNotifications()
- getUnreadCount()
- markAsRead()
- markAllAsRead()
- deleteNotification()

Pattern:

```typescript
try {
  // ... logic
  logger.info('Success message', { context });
  return result;
} catch (error) {
  if (error instanceof NotFoundError || error instanceof ValidationError) {
    throw error;
  }
  logger.error('Failed to...', { error, stack, user_id, context });
  throw new DatabaseError('Failed to...', DatabaseErrorType.QUERY, error, metadata);
}
```

### Step 7: Add Success Logging (6 methods)

- Log after successful operations with metrics
- Special: deleteNotification() should log **warning** about hard delete

### Step 8: Mark Stub Methods

Add JSDoc markers:

```typescript
/**
 * @stub
 * @todo Implement maintenance due date checking
 * @todo Query maintenance_records table for upcoming maintenance
 * @todo Create notifications for equipment with maintenance due in 7 days
 */
```

---

## Testing Considerations

### Current Tests

- No test file found for notification.service.ts
- Tests would be in: `/backend/src/services/notification.service.spec.ts` (doesn't exist)

### Test Coverage Needed (Post-Refactoring)

1. create() - valid inputs, validation errors
2. getUserNotifications() - pagination, empty results
3. getUnreadCount() - zero, multiple unread
4. markAsRead() - success, not found
5. markAllAsRead() - count marked
6. deleteNotification() - success, not found
7. Helper methods - delegate to create()

---

## Performance Considerations

### Current Performance

- **getUserNotifications()**: O(log n) with index on (user_id, created_at)
- **getUnreadCount()**: O(log n) with index on (user_id, read)
- No N+1 queries
- No caching (every call hits database)

### Optimization Opportunities

1. **Cache unread count** per user (Redis)
2. **Batch creation** for multiple users
3. **Soft delete** with periodic cleanup job
4. **Archive old notifications** (>90 days)

---

## Migration Status

✅ **FULLY MIGRATED TO TYPEORM (Phase 3.6)**

All raw SQL queries replaced:

1. INSERT → repository.save()
2. SELECT with pagination → repository.find() with options
3. SELECT COUNT(\*) → repository.count()
4. UPDATE → repository.update()
5. DELETE → repository.delete()

---

## Related Services

- **auth.service.ts**: User authentication (user IDs)
- **contract.service.ts**: Contract approvals (approval_required notifications)
- **valuation.service.ts**: Valuation approvals (approval_required notifications)
- **maintenance.service.ts**: Maintenance due (stub method references)

---

## Refactoring Estimate

- **Complexity**: 🟡 Moderate (simple CRUD, no complex business logic)
- **Estimated JSDoc**: ~550-650 lines (200 class-level + 350-400 method-level)
- **Estimated Final LOC**: ~750-850 lines (199 → ~800 lines, 4x growth)
- **Risk Level**: 🟢 Low (no complex logic, well-isolated)
- **Time Estimate**: 1-2 hours

---

## Success Criteria

✅ Class-level JSDoc added (~200-250 lines)  
✅ Method-level JSDoc added to all 12 methods  
✅ Input validation added (create, getUserNotifications)  
✅ NotFoundError added (markAsRead - check exists first)  
✅ DatabaseError catch blocks added (6 core methods)  
✅ Success logging added (6 core methods, with hard delete warning)  
✅ Stub methods marked (@stub, @todo)  
✅ Build passes (`npm run build`)  
✅ Tests pass (`npm test` - 326 passing)  
✅ Changes committed  
✅ Progress tracker updated to 100%! 🎉

---

## Notes

- This is the **FINAL SERVICE** of Phase 20 (31/31)
- Service is simple and well-structured (good ending note!)
- Main enhancement: Validation and error handling consistency
- Future: Implement stub methods, add email service integration
- Future: Add WebSocket real-time delivery layer

---

**Audit Complete**: Ready for refactoring! 🚀
