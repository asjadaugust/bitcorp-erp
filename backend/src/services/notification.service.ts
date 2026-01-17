import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Notification, NotificationType } from '../models/notification.model';
import Logger from '../utils/logger';

export { NotificationType };

/**
 * NotificationService - User Notification Management
 *
 * ✅ FULLY MIGRATED TO TYPEORM
 * - All 6 raw SQL queries replaced with TypeORM
 * - Full type safety with Notification entity
 * - Proper relations and eager loading support
 *
 * Migration completed: Phase 3.6
 */
export class NotificationService {
  private get repository(): Repository<Notification> {
    return AppDataSource.getRepository(Notification);
  }

  /**
   * Create a new notification
   *
   * ✅ MIGRATED: INSERT query → TypeORM save()
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<Notification> {
    const notification = this.repository.create({
      userId: parseInt(userId),
      type,
      title,
      message,
      url: options?.link || null,
      read: false,
      readAt: null,
    });

    return await this.repository.save(notification);
  }

  /**
   * Get user's notifications with pagination
   *
   * ✅ MIGRATED: SELECT with ORDER BY and LIMIT → TypeORM find() with options
   */
  async getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    return await this.repository.find({
      where: { userId: parseInt(userId) },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get count of unread notifications
   *
   * ✅ MIGRATED: SELECT COUNT(*) → TypeORM count()
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.repository.count({
      where: {
        userId: parseInt(userId),
        read: false,
      },
    });
  }

  /**
   * Mark a notification as read
   *
   * ✅ MIGRATED: UPDATE with RETURNING → TypeORM update() + findOne()
   */
  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const notificationId = parseInt(id);
    const parsedUserId = parseInt(userId);

    // Update the notification
    await this.repository.update(
      { id: notificationId, userId: parsedUserId },
      { read: true, readAt: new Date() }
    );

    // Fetch and return the updated notification
    return await this.repository.findOne({
      where: { id: notificationId, userId: parsedUserId },
    });
  }

  /**
   * Mark all user's notifications as read
   *
   * ✅ MIGRATED: UPDATE with WHERE → TypeORM update() with criteria
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.repository.update(
      { userId: parseInt(userId), read: false },
      { read: true, readAt: new Date() }
    );
  }

  /**
   * Delete a notification
   *
   * ✅ MIGRATED: DELETE query → TypeORM delete()
   */
  async deleteNotification(id: string, userId: string): Promise<boolean> {
    const result = await this.repository.delete({
      id: parseInt(id),
      userId: parseInt(userId),
    });

    return (result.affected || 0) > 0;
  }

  // --- Notification Creation Helpers ---

  async notifyApprovalRequired(
    userId: string,
    title: string,
    message: string,
    link?: string
  ): Promise<Notification> {
    return this.create(userId, 'approval_required', title, message, { link });
  }

  async notifyApprovalCompleted(
    userId: string,
    title: string,
    message: string,
    link?: string
  ): Promise<Notification> {
    return this.create(userId, 'approval_completed', title, message, { link });
  }

  async notifyWarning(
    userId: string,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<Notification> {
    return this.create(userId, 'warning', title, message, options);
  }

  async notifyError(
    userId: string,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<Notification> {
    return this.create(userId, 'error', title, message, options);
  }

  async notifySuccess(
    userId: string,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<Notification> {
    return this.create(userId, 'success', title, message, options);
  }

  async notifyInfo(
    userId: string,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<Notification> {
    return this.create(userId, 'info', title, message, options);
  }

  async checkMaintenanceDue(): Promise<void> {
    // TODO: Implement maintenance check logic
    Logger.debug('Checking maintenance due', {
      context: 'NotificationService.checkMaintenanceDue',
    });
  }

  async checkContractExpirations(): Promise<void> {
    // TODO: Implement contract expiration check logic
    Logger.debug('Checking contract expirations', {
      context: 'NotificationService.checkContractExpirations',
    });
  }

  async checkCertificationExpiry(): Promise<void> {
    // TODO: Implement certification expiry check logic
    Logger.debug('Checking certification expiry', {
      context: 'NotificationService.checkCertificationExpiry',
    });
  }
}
