import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../../services/notification.service';

export class NotificationController {
  private notificationService = new NotificationService();

  getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const notifications = await this.notificationService.getUserNotifications(userId);
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      
      res.json({
        success: true,
        data: {
          notifications,
          unreadCount
        }
      });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      
      await this.notificationService.markAsRead(id, userId);
      
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      
      await this.notificationService.markAllAsRead(userId);
      
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  };

  deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      
      const deleted = await this.notificationService.deleteNotification(id, userId);
      
      if (deleted) {
        res.json({ success: true, message: 'Notification deleted' });
      } else {
        res.status(404).json({ success: false, message: 'Notification not found' });
      }
    } catch (error) {
      next(error);
    }
  };
}
