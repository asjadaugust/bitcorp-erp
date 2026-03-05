import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/notifications/domain/models/notification_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'notifications_repository.g.dart';

class NotificationsRepository {
  final Dio _dio;

  NotificationsRepository(this._dio);

  /// Fetch notifications for the current user.
  Future<List<NotificationModel>> getNotifications({
    bool? unreadOnly,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final queryParams = <String, dynamic>{'page': page, 'limit': limit};
      if (unreadOnly == true) {
        queryParams['leido'] = false;
      }

      final response = await _dio.get(
        '/notifications/',
        queryParameters: queryParams,
      );

      final List<dynamic> items = response.data['data'] as List<dynamic>;
      return items
          .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Notifications API unavailable: $e');
        return [];
      }
      rethrow;
    }
  }

  /// Get count of unread notifications.
  Future<int> getUnreadCount() async {
    try {
      final response = await _dio.get('/notifications/unread-count');
      final data = response.data['data'];
      if (data is int) return data;
      if (data is Map) return data['count'] as int? ?? 0;
      return 0;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Unread count API unavailable: $e');
        return 0;
      }
      rethrow;
    }
  }

  /// Mark a single notification as read.
  Future<void> markAsRead(int notificationId) async {
    await _dio.patch('/notifications/$notificationId/read');
  }

  /// Mark all notifications as read.
  Future<void> markAllAsRead() async {
    await _dio.patch('/notifications/read-all');
  }
}

@riverpod
NotificationsRepository notificationsRepository(Ref ref) {
  return NotificationsRepository(ref.watch(dioProvider));
}
