import { pool } from '../config/database.config';

interface NotificationData {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  mensaje: string | null;
  url: string | null;
  leido: boolean;
  leido_at: Date | null;
  created_at: Date;
}

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'approval_required' | 'approval_completed';

export class NotificationService {
  async create(
    userId: string, 
    type: NotificationType, 
    title: string, 
    message: string, 
    options?: { link?: string }
  ): Promise<NotificationData> {
    const query = `
      INSERT INTO notificaciones (user_id, tipo, titulo, mensaje, url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [
      userId, 
      type, 
      title, 
      message, 
      options?.link || null
    ]);
    return result.rows[0];
  }

  async getUserNotifications(userId: string, limit: number = 20): Promise<NotificationData[]> {
    const query = `
      SELECT * FROM notificaciones 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM notificaciones 
      WHERE user_id = $1 AND leido = false
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  async markAsRead(id: string, userId: string): Promise<NotificationData | null> {
    const query = `
      UPDATE notificaciones 
      SET leido = true, leido_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND user_id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const query = `
      UPDATE notificaciones 
      SET leido = true, leido_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1 AND leido = false
    `;
    await pool.query(query, [userId]);
  }

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM notificaciones 
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [id, userId]);
    return (result.rowCount || 0) > 0;
  }

  // --- Notification Creation Helpers ---

  async notifyApprovalRequired(
    userId: string, 
    title: string, 
    message: string,
    link?: string
  ): Promise<NotificationData> {
    return this.create(userId, 'approval_required', title, message, { link });
  }

  async notifyApprovalCompleted(
    userId: string,
    title: string,
    message: string,
    link?: string
  ): Promise<NotificationData> {
    return this.create(userId, 'approval_completed', title, message, { link });
  }

  async notifyWarning(
    userId: string,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<NotificationData> {
    return this.create(userId, 'warning', title, message, options);
  }

  async notifyError(
    userId: string,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<NotificationData> {
    return this.create(userId, 'error', title, message, options);
  }

  async notifySuccess(
    userId: string,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<NotificationData> {
    return this.create(userId, 'success', title, message, options);
  }

  async notifyInfo(
    userId: string,
    title: string,
    message: string,
    options?: { link?: string }
  ): Promise<NotificationData> {
    return this.create(userId, 'info', title, message, options);
  }

  async checkMaintenanceDue(): Promise<void> {
    // TODO: Implement maintenance check logic
    console.log('Checking maintenance due...');
  }

  async checkContractExpirations(): Promise<void> {
    // TODO: Implement contract expiration check logic
    console.log('Checking contract expirations...');
  }

  async checkCertificationExpiry(): Promise<void> {
    // TODO: Implement certification expiry check logic
    console.log('Checking certification expiry...');
  }
}
