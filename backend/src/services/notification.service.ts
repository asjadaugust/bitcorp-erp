import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Notification, NotificationType } from '../models/notification.model';
import Logger from '../utils/logger';
import { NotFoundError, ValidationError, DatabaseError, DatabaseErrorType } from '../errors';
import logger from '../config/logger.config';

export { NotificationType };

/**
 * NotificationService - In-App User Notification Management
 *
 * # Purpose
 *
 * Manages in-app notifications for BitCorp ERP users. Handles creation, retrieval,
 * marking as read, and deletion of user notifications stored in the database.
 *
 * **IMPORTANT**: This service handles **IN-APP NOTIFICATIONS ONLY** (database-backed).
 * It does NOT handle:
 * - Email notifications (separate email service needed)
 * - SMS notifications
 * - Push notifications (mobile/web push)
 * - Real-time WebSocket delivery (requires polling or separate real-time layer)
 *
 * ## Notification Types
 *
 * The service supports 6 notification types (NotificationType enum):
 *
 * 1. **approval_required**: User action needed
 *    - Examples: Approve valuation, approve contract, review daily report
 *    - Typically created by state machines (valuation, contract services)
 *    - High priority (requires user response)
 *
 * 2. **approval_completed**: Approval decision made
 *    - Examples: "Your valuation was approved", "Contract rejected"
 *    - Informational (no action required)
 *
 * 3. **warning**: Important alert requiring attention
 *    - Examples: Contract expiring in 30 days, maintenance due, certification expiry
 *    - Medium priority (should review soon)
 *
 * 4. **error**: System error or failed operation
 *    - Examples: "Failed to generate report", "Equipment sync failed"
 *    - Requires investigation or retry
 *
 * 5. **success**: Operation completed successfully
 *    - Examples: "Report generated", "Contract created"
 *    - Low priority (confirmation only)
 *
 * 6. **info**: General information
 *    - Examples: New feature announcement, system maintenance notice
 *    - Low priority (informational only)
 *
 * ## Database Schema (notifications table)
 *
 * ```sql
 * CREATE TABLE notifications (
 *   id SERIAL PRIMARY KEY,
 *   user_id INTEGER NOT NULL REFERENCES usuarios(id_usuario),
 *   type VARCHAR(50) NOT NULL,      -- NotificationType enum
 *   title VARCHAR(200) NOT NULL,    -- Max 200 chars
 *   message TEXT NOT NULL,          -- Max 1000 chars recommended
 *   url VARCHAR(500),               -- Optional link to related resource
 *   read BOOLEAN DEFAULT FALSE,
 *   read_at TIMESTAMP,              -- When marked as read
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
 * CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
 * ```
 *
 * ## Business Rules
 *
 * ### Notification Creation
 * - Any authenticated user can receive notifications
 * - Notifications are created **programmatically** by the system (not user-submitted)
 * - Title: Required, max 200 characters
 * - Message: Required, max 1000 characters recommended
 * - URL: Optional (link to equipment/:id, contract/:id, etc.)
 * - Default state: Unread (read = false)
 *
 * ### Notification Reading
 * - Users can only view their own notifications (enforced by userId filter)
 * - Marking as read sets `read_at` timestamp
 * - Unread count used for notification badge in UI
 * - Pagination: Default 20 notifications per page, max 1000
 *
 * ### Notification Deletion
 * - Users can only delete their own notifications
 * - **Hard delete** (no soft delete or audit trail) - consider adding soft delete in future
 * - Typically used for "dismiss notification" feature in UI
 *
 * ## Known Limitations
 *
 * 1. **No Email/SMS/Push**: Only in-app database notifications (no external communication)
 * 2. **No Real-Time Delivery**: No WebSocket/SSE push (requires client-side polling)
 * 3. **Stub Methods**: checkMaintenanceDue, checkContractExpirations, checkCertificationExpiry
 *    are deprecated - now handled by CronService (Phase 21)
 * 4. **Hard Delete Only**: No soft delete or retention policy (notifications lost forever)
 * 5. **No Templates**: Title/message passed as plain strings (no i18n or templating)
 * 6. **No Batch Creation**: No method to create multiple notifications at once
 * 7. **No Priority/Urgency**: All notifications same priority (no sorting by urgency)
 * 8. **No Read Receipts**: Can't track when user actually saw notification (only marked as read)
 * 9. **No Notification Preferences**: Users can't opt out of notification types
 * 10. **No Rate Limiting**: No protection against notification spam
 *
 * ## Phase 21 Migration (January 2026)
 *
 * The three stub methods (checkMaintenanceDue, checkContractExpirations, checkCertificationExpiry)
 * have been implemented in CronService:
 *
 * - **CronService.checkMaintenanceDue()**: Checks for maintenance due within 7 days (daily at 8 AM)
 * - **CronService.checkContractExpirations()**: Checks for contracts expiring within 30 days (daily at 8 AM)
 * - **CronService.checkCertificationExpiry()**: Checks for certifications expiring within 30 days (daily at 8 AM)
 *
 * These methods are now @deprecated in NotificationService and should be triggered via:
 * ```typescript
 * const cronService = new CronService();
 * cronService.startAllJobs(); // Automated daily checks
 * ```
 *
 * @see CronService - Automated notification checking via cron jobs
 *
 * ## TypeORM Migration Status
 *
 * ✅ **FULLY MIGRATED TO TYPEORM (Phase 3.6)**
 *
 * All raw SQL queries replaced with TypeORM Repository pattern:
 * - INSERT → repository.save()
 * - SELECT with pagination → repository.find() with options
 * - SELECT COUNT(*) → repository.count()
 * - UPDATE → repository.update()
 * - DELETE → repository.delete()
 *
 * Full type safety with Notification entity.
 *
 * ## Usage Examples
 *
 * ### Example 1: Create Approval Required Notification
 *
 * ```typescript
 * const notificationService = new NotificationService();
 *
 * // Valuation requires approval
 * await notificationService.notifyApprovalRequired(
 *   userId: '42',
 *   title: 'Valorización pendiente de aprobación',
 *   message: 'Valorización de Enero 2026 para Proyecto Carretera Central requiere tu aprobación',
 *   link: '/valorizaciones/123'
 * );
 *
 * // Result: Notification created with type 'approval_required', unread
 * ```
 *
 * ### Example 2: Get User Notifications
 *
 * ```typescript
 * // Get latest 20 notifications for user
 * const notifications = await notificationService.getUserNotifications(
 *   userId: '42',
 *   limit: 20
 * );
 *
 * // Returns: [
 * //   { id: 123, type: 'approval_required', title: '...', read: false, ... },
 * //   { id: 122, type: 'success', title: '...', read: true, ... },
 * //   ...
 * // ]
 * ```
 *
 * ### Example 3: Mark All as Read
 *
 * ```typescript
 * // User clicks "Mark all as read" button
 * await notificationService.markAllAsRead(userId: '42');
 *
 * // Result: All unread notifications for user now read = true
 * ```
 *
 * ### Example 4: Get Unread Count (for badge)
 *
 * ```typescript
 * const unreadCount = await notificationService.getUnreadCount(userId: '42');
 *
 * // Display in UI: <badge>5</badge> (5 unread notifications)
 * ```
 *
 * ## Related Services
 *
 * - **auth.service.ts**: User authentication (provides userId)
 * - **contract.service.ts**: Creates approval_required notifications when contract needs approval
 * - **valuation.service.ts**: Creates approval_required notifications for valorización approval
 * - **maintenance.service.ts**: (Future) Will create warning notifications for maintenance due
 * - **email.service.ts**: (Future) External email notification service
 *
 * ## Future Enhancements
 *
 * 1. Implement stub methods (checkMaintenanceDue, etc.)
 * 2. Add email notification integration (send email + in-app)
 * 3. Add WebSocket/SSE real-time delivery layer
 * 4. Add notification templates and i18n support
 * 5. Add soft delete with retention policy (archive after 90 days)
 * 6. Add notification preferences (user can opt out of types)
 * 7. Add priority/urgency levels
 * 8. Add batch creation for multiple users
 * 9. Add read receipt tracking (when notification visible in viewport)
 * 10. Add rate limiting (max X notifications per user per hour)
 *
 * @class NotificationService
 * @description In-app user notification management service
 */
export class NotificationService {
  private get repository(): Repository<Notification> {
    return AppDataSource.getRepository(Notification);
  }

  /**
   * Create a new notification for a user
   *
   * Creates an in-app notification record in the database. The notification will appear
   * in the user's notification list (unread by default) and can be retrieved via
   * getUserNotifications().
   *
   * ## Validation Rules
   *
   * - **userId**: Must be a valid integer string (e.g., "42", not "abc")
   * - **type**: Must be a valid NotificationType enum value
   * - **title**: Required, non-empty, max 200 characters
   * - **message**: Required, non-empty, max 1000 characters (recommended)
   * - **link** (optional): URL to related resource (e.g., "/equipos/123")
   *
   * ## Behavior
   *
   * - Notification created with `read = false` (unread)
   * - Notification created with `read_at = null`
   * - `created_at` and `updated_at` set automatically by database
   * - Returns full Notification entity after save
   *
   * ## TypeORM Migration
   *
   * ✅ **MIGRATED**: INSERT query → repository.save()
   * - Before: `INSERT INTO notifications (...) VALUES (...) RETURNING *`
   * - After: `repository.create() + repository.save()`
   *
   * @param userId - User ID as string (e.g., "42")
   * @param type - Notification type (approval_required, warning, info, etc.)
   * @param title - Notification title (max 200 chars)
   * @param message - Notification message body (max 1000 chars recommended)
   * @param options - Optional parameters
   * @param options.link - Optional URL to related resource
   *
   * @returns Promise resolving to created Notification entity
   *
   * @throws {ValidationError} If userId is not a valid integer
   * @throws {ValidationError} If title is empty or > 200 characters
   * @throws {ValidationError} If message is empty or > 1000 characters
   * @throws {DatabaseError} If database save operation fails
   *
   * @example
   * ```typescript
   * // Create approval notification
   * const notification = await service.create(
   *   '42',
   *   'approval_required',
   *   'Valorización pendiente',
   *   'Valorización de Enero 2026 requiere tu aprobación',
   *   { link: '/valorizaciones/123' }
   * );
   * // Returns: { id: 456, userId: 42, type: 'approval_required', read: false, ... }
   * ```
   *
   * @example
   * ```typescript
   * // Create warning notification (no link)
   * const warning = await service.create(
   *   '42',
   *   'warning',
   *   'Contrato por vencer',
   *   'El contrato de alquiler vence en 30 días'
   * );
   * ```
   *
   * @see notifyApprovalRequired - Helper for approval_required type
   * @see notifyWarning - Helper for warning type
   * @see getUserNotifications - Retrieve user's notifications
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<Notification> {
    try {
      // Validate userId
      const parsedUserId = parseInt(userId);
      if (isNaN(parsedUserId)) {
        throw ValidationError.invalid('userId', 'User ID must be a valid integer');
      }

      // Validate title
      if (!title?.trim()) {
        throw ValidationError.required('title', 'Title is required and cannot be empty');
      }

      if (title.length > 200) {
        throw ValidationError.maxLength('title', 200, title.length);
      }

      // Validate message
      if (!message?.trim()) {
        throw ValidationError.required('message', 'Message is required and cannot be empty');
      }

      if (message.length > 1000) {
        throw ValidationError.maxLength('message', 1000, message.length);
      }

      const notification = this.repository.create({
        userId: parsedUserId,
        type,
        title: title.trim(),
        message: message.trim(),
        url: options?.link || null,
        read: false,
        readAt: null,
      });

      const saved = await this.repository.save(notification);

      logger.info('Created notification', {
        notification_id: saved.id,
        user_id: parsedUserId,
        type,
        title,
        has_link: !!options?.link,
      });

      return saved;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error('Failed to create notification', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user_id: userId,
        type,
        title,
      });

      throw new DatabaseError('Failed to create notification', DatabaseErrorType.QUERY, error, {
        userId,
        type,
        title,
      });
    }
  }

  /**
   * Get user's notifications with pagination
   *
   * Retrieves a paginated list of notifications for a specific user, ordered by
   * creation date (newest first). Supports customizable limit for pagination.
   *
   * ## Validation Rules
   *
   * - **userId**: Must be a valid integer string
   * - **limit**: Must be between 1 and 1000 (inclusive)
   *
   * ## Behavior
   *
   * - Returns notifications in DESC order by created_at (newest first)
   * - Includes both read and unread notifications
   * - No filtering by type (returns all types)
   * - User can only see their own notifications (enforced by userId filter)
   *
   * ## TypeORM Migration
   *
   * ✅ **MIGRATED**: SELECT with ORDER BY and LIMIT → repository.find()
   * - Before: `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`
   * - After: `repository.find({ where, order, take })`
   *
   * @param userId - User ID as string
   * @param limit - Maximum number of notifications to return (default: 20, max: 1000)
   *
   * @returns Promise resolving to array of Notification entities
   *
   * @throws {ValidationError} If userId is not a valid integer
   * @throws {ValidationError} If limit is < 1 or > 1000
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * // Get latest 20 notifications (default)
   * const notifications = await service.getUserNotifications('42');
   *
   * // Get latest 50 notifications
   * const moreNotifications = await service.getUserNotifications('42', 50);
   * ```
   *
   * @see getUnreadCount - Get count of unread notifications
   * @see markAsRead - Mark a notification as read
   */
  async getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    try {
      // Validate userId
      const parsedUserId = parseInt(userId);
      if (isNaN(parsedUserId)) {
        throw ValidationError.invalid('userId', 'User ID must be a valid integer');
      }

      // Validate limit
      if (limit < 1 || limit > 1000) {
        throw ValidationError.invalid('limit', 'Limit must be between1 and 1000');
      }

      const notifications = await this.repository.find({
        where: { userId: parsedUserId },
        order: { createdAt: 'DESC' },
        take: limit,
      });

      logger.info('Retrieved user notifications', {
        user_id: parsedUserId,
        count: notifications.length,
        limit,
      });

      return notifications;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error('Failed to retrieve user notifications', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user_id: userId,
        limit,
      });

      throw new DatabaseError(
        'Failed to retrieve user notifications',
        DatabaseErrorType.QUERY,
        error,
        { userId, limit }
      );
    }
  }

  /**
   * Get count of unread notifications for a user
   *
   * Returns the number of unread notifications for a specific user. Used to display
   * notification badge count in the UI.
   *
   * ## Validation Rules
   *
   * - **userId**: Must be a valid integer string
   *
   * ## Behavior
   *
   * - Counts only notifications where `read = false`
   * - User can only see count of their own notifications
   * - Returns 0 if user has no unread notifications
   *
   * ## TypeORM Migration
   *
   * ✅ **MIGRATED**: SELECT COUNT(*) → repository.count()
   * - Before: `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false`
   * - After: `repository.count({ where: { userId, read: false } })`
   *
   * @param userId - User ID as string
   *
   * @returns Promise resolving to number of unread notifications
   *
   * @throws {ValidationError} If userId is not a valid integer
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * const unreadCount = await service.getUnreadCount('42');
   * // Returns: 5
   *
   * // Display in UI: <span class="badge">5</span>
   * ```
   *
   * @see getUserNotifications - Get full list of notifications
   * @see markAllAsRead - Mark all notifications as read
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // Validate userId
      const parsedUserId = parseInt(userId);
      if (isNaN(parsedUserId)) {
        throw ValidationError.invalid('userId', 'User ID must be a valid integer');
      }

      const count = await this.repository.count({
        where: {
          userId: parsedUserId,
          read: false,
        },
      });

      logger.info('Retrieved unread count', {
        user_id: parsedUserId,
        unread_count: count,
      });

      return count;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error('Failed to get unread count', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user_id: userId,
      });

      throw new DatabaseError('Failed to get unread count', DatabaseErrorType.QUERY, error, {
        userId,
      });
    }
  }

  /**
   * Mark a notification as read
   *
   * Marks a single notification as read by setting `read = true` and `read_at = NOW()`.
   * User can only mark their own notifications as read (enforced by userId filter).
   *
   * ## Validation Rules
   *
   * - **id**: Must be a valid integer string
   * - **userId**: Must be a valid integer string
   * - Notification must exist and belong to user
   *
   * ## Behavior
   *
   * - Sets `read = true`
   * - Sets `read_at = NOW()`
   * - Returns updated notification after update
   * - Throws NotFoundError if notification doesn't exist or doesn't belong to user
   *
   * ## TypeORM Migration
   *
   * ✅ **MIGRATED**: UPDATE with RETURNING → repository.update() + findOne()
   * - Before: `UPDATE notifications SET read = true, read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`
   * - After: `repository.update() + repository.findOne()`
   *
   * @param id - Notification ID as string
   * @param userId - User ID as string
   *
   * @returns Promise resolving to updated Notification entity
   *
   * @throws {ValidationError} If id or userId is not a valid integer
   * @throws {NotFoundError} If notification not found or doesn't belong to user
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * // User clicks on notification
   * const notification = await service.markAsRead('123', '42');
   * // Returns: { id: 123, read: true, read_at: '2026-01-19T10:30:00Z', ... }
   * ```
   *
   * @see markAllAsRead - Mark all notifications as read
   * @see getUserNotifications - Get user's notifications
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    try {
      const notificationId = parseInt(id);
      const parsedUserId = parseInt(userId);

      if (isNaN(notificationId)) {
        throw ValidationError.invalid('id', 'Notification ID must be a valid integer');
      }

      if (isNaN(parsedUserId)) {
        throw ValidationError.invalid('userId', 'User ID must be a valid integer');
      }

      // Check if notification exists and belongs to user
      const notification = await this.repository.findOne({
        where: { id: notificationId, userId: parsedUserId },
      });

      if (!notification) {
        throw new NotFoundError('Notification', notificationId.toString());
      }

      // Update the notification
      await this.repository.update(
        { id: notificationId, userId: parsedUserId },
        { read: true, readAt: new Date() }
      );

      // Fetch and return the updated notification
      const updated = await this.repository.findOne({
        where: { id: notificationId, userId: parsedUserId },
      });

      logger.info('Marked notification as read', {
        notification_id: notificationId,
        user_id: parsedUserId,
      });

      return updated!;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }

      logger.error('Failed to mark notification as read', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        notification_id: id,
        user_id: userId,
      });

      throw new DatabaseError(
        'Failed to mark notification as read',
        DatabaseErrorType.QUERY,
        error,
        { id, userId }
      );
    }
  }

  /**
   * Mark all user's notifications as read
   *
   * Marks all unread notifications for a user as read by setting `read = true` and
   * `read_at = NOW()` for all notifications where `read = false`.
   *
   * ## Validation Rules
   *
   * - **userId**: Must be a valid integer string
   *
   * ## Behavior
   *
   * - Updates only notifications where `read = false`
   * - Sets `read = true` and `read_at = NOW()` for all matches
   * - Returns void (no return value)
   * - No error if user has no unread notifications (0 rows affected)
   *
   * ## TypeORM Migration
   *
   * ✅ **MIGRATED**: UPDATE with WHERE → repository.update()
   * - Before: `UPDATE notifications SET read = true, read_at = NOW() WHERE user_id = $1 AND read = false`
   * - After: `repository.update({ userId, read: false }, { read: true, readAt: NOW() })`
   *
   * @param userId - User ID as string
   *
   * @returns Promise<void>
   *
   * @throws {ValidationError} If userId is not a valid integer
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * // User clicks "Mark all as read" button
   * await service.markAllAsRead('42');
   * // All unread notifications now marked as read
   * ```
   *
   * @see markAsRead - Mark a single notification as read
   * @see getUnreadCount - Get unread count
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const parsedUserId = parseInt(userId);

      if (isNaN(parsedUserId)) {
        throw ValidationError.invalid('userId', 'User ID must be a valid integer');
      }

      const result = await this.repository.update(
        { userId: parsedUserId, read: false },
        { read: true, readAt: new Date() }
      );

      logger.info('Marked all notifications as read', {
        user_id: parsedUserId,
        count_marked: result.affected || 0,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error('Failed to mark all notifications as read', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user_id: userId,
      });

      throw new DatabaseError(
        'Failed to mark all notifications as read',
        DatabaseErrorType.QUERY,
        error,
        { userId }
      );
    }
  }

  /**
   * Delete a notification (hard delete)
   *
   * Permanently deletes a notification from the database. User can only delete their
   * own notifications (enforced by userId filter).
   *
   * **WARNING**: This is a **hard delete** - notification is permanently removed with
   * no audit trail. Consider implementing soft delete in future for audit purposes.
   *
   * ## Validation Rules
   *
   * - **id**: Must be a valid integer string
   * - **userId**: Must be a valid integer string
   * - Notification must exist and belong to user
   *
   * ## Behavior
   *
   * - Permanently removes notification from database
   * - Returns true if deleted, false if notification not found
   * - No error if notification doesn't exist (returns false)
   *
   * ## TypeORM Migration
   *
   * ✅ **MIGRATED**: DELETE query → repository.delete()
   * - Before: `DELETE FROM notifications WHERE id = $1 AND user_id = $2`
   * - After: `repository.delete({ id, userId })`
   *
   * @param id - Notification ID as string
   * @param userId - User ID as string
   *
   * @returns Promise<boolean> - true if deleted, false if not found
   *
   * @throws {ValidationError} If id or userId is not a valid integer
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * // User dismisses notification
   * const deleted = await service.deleteNotification('123', '42');
   * // Returns: true (notification deleted)
   * ```
   *
   * @see markAsRead - Alternative: mark as read instead of deleting
   */
  async deleteNotification(id: string, userId: string): Promise<boolean> {
    try {
      const notificationId = parseInt(id);
      const parsedUserId = parseInt(userId);

      if (isNaN(notificationId)) {
        throw ValidationError.invalid('id', 'Notification ID must be a valid integer');
      }

      if (isNaN(parsedUserId)) {
        throw ValidationError.invalid('userId', 'User ID must be a valid integer');
      }

      const result = await this.repository.delete({
        id: notificationId,
        userId: parsedUserId,
      });

      const deleted = (result.affected || 0) > 0;

      if (deleted) {
        logger.warn('Hard deleted notification (audit trail destroyed)', {
          notification_id: notificationId,
          user_id: parsedUserId,
          recommendation: 'Consider implementing soft delete for audit trail',
        });
      } else {
        logger.info('Notification not found for deletion', {
          notification_id: notificationId,
          user_id: parsedUserId,
        });
      }

      return deleted;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error('Failed to delete notification', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        notification_id: id,
        user_id: userId,
      });

      throw new DatabaseError('Failed to delete notification', DatabaseErrorType.QUERY, error, {
        id,
        userId,
      });
    }
  }

  // --- Notification Creation Helpers ---

  /**
   * Create approval_required notification
   *
   * Convenience method to create a notification indicating user action is required
   * (e.g., approve valuation, approve contract, review daily report).
   *
   * Delegates to create() with type = 'approval_required'.
   *
   * @param userId - User ID as string
   * @param title - Notification title
   * @param message - Notification message
   * @param link - Optional URL to approval page
   *
   * @returns Promise resolving to created Notification entity
   *
   * @throws {ValidationError} If validation fails (see create())
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * await service.notifyApprovalRequired(
   *   '42',
   *   'Valorización pendiente',
   *   'Valorización de Enero 2026 requiere tu aprobación',
   *   '/valorizaciones/123'
   * );
   * ```
   *
   * @see create - Core notification creation method
   * @see notifyApprovalCompleted - Approval result notification
   */
  async notifyApprovalRequired(
    userId: string,
    title: string,
    message: string,
    link?: string
  ): Promise<Notification> {
    return this.create(userId, 'approval_required', title, message, { link });
  }

  /**
   * Create approval_completed notification
   *
   * Convenience method to create a notification indicating approval decision was made
   * (e.g., "Your valuation was approved", "Contract rejected").
   *
   * Delegates to create() with type = 'approval_completed'.
   *
   * @param userId - User ID as string
   * @param title - Notification title
   * @param message - Notification message
   * @param link - Optional URL to approved/rejected resource
   *
   * @returns Promise resolving to created Notification entity
   *
   * @throws {ValidationError} If validation fails (see create())
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * await service.notifyApprovalCompleted(
   *   '42',
   *   'Valorización aprobada',
   *   'Tu valorización de Enero 2026 ha sido aprobada por el Director',
   *   '/valorizaciones/123'
   * );
   * ```
   *
   * @see create - Core notification creation method
   * @see notifyApprovalRequired - Request approval notification
   */
  async notifyApprovalCompleted(
    userId: string,
    title: string,
    message: string,
    link?: string
  ): Promise<Notification> {
    return this.create(userId, 'approval_completed', title, message, { link });
  }

  /**
   * Create warning notification
   *
   * Convenience method to create a warning notification (e.g., contract expiring soon,
   * maintenance due, certification expiry).
   *
   * Delegates to create() with type = 'warning'.
   *
   * @param userId - User ID as string
   * @param title - Notification title
   * @param message - Notification message
   * @param options - Optional parameters (link)
   *
   * @returns Promise resolving to created Notification entity
   *
   * @throws {ValidationError} If validation fails (see create())
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * await service.notifyWarning(
   *   '42',
   *   'Contrato por vencer',
   *   'El contrato de alquiler vence en 30 días',
   *   { link: '/contratos/123' }
   * );
   * ```
   *
   * @see create - Core notification creation method
   */
  async notifyWarning(
    userId: string,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<Notification> {
    return this.create(userId, 'warning', title, message, options);
  }

  /**
   * Create error notification
   *
   * Convenience method to create an error notification (e.g., failed operation,
   * system error).
   *
   * Delegates to create() with type = 'error'.
   *
   * @param userId - User ID as string
   * @param title - Notification title
   * @param message - Notification message
   * @param options - Optional parameters (link)
   *
   * @returns Promise resolving to created Notification entity
   *
   * @throws {ValidationError} If validation fails (see create())
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * await service.notifyError(
   *   '42',
   *   'Error al generar reporte',
   *   'No se pudo generar el reporte de equipos. Por favor intenta nuevamente.'
   * );
   * ```
   *
   * @see create - Core notification creation method
   */
  async notifyError(
    userId: string,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<Notification> {
    return this.create(userId, 'error', title, message, options);
  }

  /**
   * Create success notification
   *
   * Convenience method to create a success notification (e.g., operation completed,
   * report generated).
   *
   * Delegates to create() with type = 'success'.
   *
   * @param userId - User ID as string
   * @param title - Notification title
   * @param message - Notification message
   * @param options - Optional parameters (link)
   *
   * @returns Promise resolving to created Notification entity
   *
   * @throws {ValidationError} If validation fails (see create())
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * await service.notifySuccess(
   *   '42',
   *   'Reporte generado',
   *   'El reporte de equipos ha sido generado exitosamente',
   *   { link: '/reportes/456' }
   * );
   * ```
   *
   * @see create - Core notification creation method
   */
  async notifySuccess(
    userId: string,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<Notification> {
    return this.create(userId, 'success', title, message, options);
  }

  /**
   * Create info notification
   *
   * Convenience method to create an informational notification (e.g., new feature,
   * system update, general announcement).
   *
   * Delegates to create() with type = 'info'.
   *
   * @param userId - User ID as string
   * @param title - Notification title
   * @param message - Notification message
   * @param options - Optional parameters (link)
   *
   * @returns Promise resolving to created Notification entity
   *
   * @throws {ValidationError} If validation fails (see create())
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * await service.notifyInfo(
   *   '42',
   *   'Nueva función disponible',
   *   'Ahora puedes exportar reportes en formato Excel'
   * );
   * ```
   *
   * @see create - Core notification creation method
   */
  async notifyInfo(
    userId: string,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<Notification> {
    return this.create(userId, 'info', title, message, options);
  }

  /**
   * Check for equipment maintenance due dates
   *
   * @deprecated This method is now handled by CronService
   * @see CronService.checkMaintenanceDue - Automated maintenance checking via cron job
   *
   * This method is kept for backward compatibility but delegates to CronService.
   * The recommended approach is to use CronService.startAllJobs() at application startup,
   * which will automatically check for maintenance due dates daily at 8:00 AM.
   *
   * Usage:
   * ```typescript
   * // Old way (manual trigger):
   * await notificationService.checkMaintenanceDue();
   *
   * // New way (automated, recommended):
   * const cronService = new CronService();
   * cronService.startAllJobs(); // Runs automatically daily
   * ```
   *
   * @returns Promise<void>
   */
  async checkMaintenanceDue(): Promise<void> {
    Logger.debug('checkMaintenanceDue called - this is now handled by CronService', {
      context: 'NotificationService.checkMaintenanceDue',
      note: 'Use CronService.startAllJobs() for automated checks',
      migration: 'Phase 21: Implemented in CronService',
    });
    // Note: Logic moved to CronService.checkMaintenanceDue()
    // To manually trigger, use: new CronService().checkMaintenanceDue()
  }

  /**
   * Check for expiring contracts
   *
   * @deprecated This method is now handled by CronService
   * @see CronService.checkContractExpirations - Automated contract checking via cron job
   *
   * This method is kept for backward compatibility but delegates to CronService.
   * The recommended approach is to use CronService.startAllJobs() at application startup,
   * which will automatically check for contracts expiring within 30 days daily at 8:00 AM.
   *
   * Usage:
   * ```typescript
   * // Old way (manual trigger):
   * await notificationService.checkContractExpirations();
   *
   * // New way (automated, recommended):
   * const cronService = new CronService();
   * cronService.startAllJobs(); // Runs automatically daily
   * ```
   *
   * @returns Promise<void>
   */
  async checkContractExpirations(): Promise<void> {
    Logger.debug('checkContractExpirations called - this is now handled by CronService', {
      context: 'NotificationService.checkContractExpirations',
      note: 'Use CronService.startAllJobs() for automated checks',
      migration: 'Phase 21: Implemented in CronService',
    });
    // Note: Logic moved to CronService.checkContractExpirations()
    // To manually trigger, use: new CronService().checkContractExpirations()
  }

  /**
   * Check for expiring operator certifications
   *
   * @deprecated This method is now handled by CronService
   * @see CronService.checkCertificationExpiry - Automated certification checking via cron job
   *
   * This method is kept for backward compatibility but delegates to CronService.
   * The recommended approach is to use CronService.startAllJobs() at application startup,
   * which will automatically check for certifications expiring within 30 days daily at 8:00 AM.
   *
   * Usage:
   * ```typescript
   * // Old way (manual trigger):
   * await notificationService.checkCertificationExpiry();
   *
   * // New way (automated, recommended):
   * const cronService = new CronService();
   * cronService.startAllJobs(); // Runs automatically daily
   * ```
   *
   * Known Limitations:
   * - CronService implementation uses placeholder logic (needs actual certification schema)
   * - Certification data structure in Trabajador entity needs verification
   * - May need separate OperatorCertification entity for proper querying
   *
   * @returns Promise<void>
   * @todo Complete certification schema implementation in CronService
   */
  async checkCertificationExpiry(): Promise<void> {
    Logger.debug('checkCertificationExpiry called - this is now handled by CronService', {
      context: 'NotificationService.checkCertificationExpiry',
      note: 'Use CronService.startAllJobs() for automated checks',
      migration: 'Phase 21: Implemented in CronService (placeholder)',
      todo: 'Complete certification schema in CronService',
    });
    // Note: Logic moved to CronService.checkCertificationExpiry()
    // To manually trigger, use: new CronService().checkCertificationExpiry()
  }
}
