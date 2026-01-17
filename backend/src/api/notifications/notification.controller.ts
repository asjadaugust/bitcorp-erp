/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { NotificationService } from '../../services/notification.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class NotificationController {
  private notificationService = new NotificationService();

  getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const notifications = await this.notificationService.getUserNotifications(userId);
      const unreadCount = await this.notificationService.getUnreadCount(userId);

      sendSuccess(res, {
        notifications,
        unreadCount,
      });
    } catch (error: any) {
      sendError(
        res,
        500,
        'NOTIFICATIONS_FETCH_FAILED',
        'Error al obtener las notificaciones',
        error.message
      );
    }
  };

  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      // Validate ID
      const notificationId = parseInt(id);
      if (isNaN(notificationId)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      await this.notificationService.markAsRead(id, userId);

      sendSuccess(res, { message: 'Notificación marcada como leída' });
    } catch (error: any) {
      sendError(
        res,
        500,
        'NOTIFICATION_MARK_READ_FAILED',
        'Error al marcar la notificación como leída',
        error.message
      );
    }
  };

  markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;

      await this.notificationService.markAllAsRead(userId);

      sendSuccess(res, { message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error: any) {
      sendError(
        res,
        500,
        'NOTIFICATIONS_MARK_ALL_READ_FAILED',
        'Error al marcar todas las notificaciones como leídas',
        error.message
      );
    }
  };

  deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      // Validate ID
      const notificationId = parseInt(id);
      if (isNaN(notificationId)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const deleted = await this.notificationService.deleteNotification(id, userId);

      if (deleted) {
        res.status(204).send();
      } else {
        sendError(res, 404, 'NOTIFICATION_NOT_FOUND', 'Notificación no encontrada');
      }
    } catch (error: any) {
      sendError(
        res,
        500,
        'NOTIFICATION_DELETE_FAILED',
        'Error al eliminar la notificación',
        error.message
      );
    }
  };
}
