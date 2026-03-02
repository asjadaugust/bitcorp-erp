import 'package:mobile/features/notifications/data/repositories/notifications_repository.dart';
import 'package:mobile/features/notifications/domain/models/notification_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'notifications_provider.g.dart';

@riverpod
class Notifications extends _$Notifications {
  @override
  Future<List<NotificationModel>> build() async {
    final repo = ref.watch(notificationsRepositoryProvider);
    return repo.getNotifications(unreadOnly: true);
  }

  Future<void> markAsRead(int id) async {
    final repo = ref.read(notificationsRepositoryProvider);
    await repo.markAsRead(id);
    // Refresh the list after marking as read
    ref.invalidateSelf();
    // Also refresh the unread count
    ref.invalidate(unreadNotificationsCountProvider);
  }

  Future<void> markAllAsRead() async {
    final repo = ref.read(notificationsRepositoryProvider);
    await repo.markAllAsRead();
    ref.invalidateSelf();
    ref.invalidate(unreadNotificationsCountProvider);
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
  }
}

@riverpod
Future<int> unreadNotificationsCount(Ref ref) async {
  final repo = ref.watch(notificationsRepositoryProvider);
  return repo.getUnreadCount();
}
