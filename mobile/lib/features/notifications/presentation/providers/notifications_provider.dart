import 'package:mobile/features/notifications/domain/models/notification_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'notifications_provider.g.dart';

@riverpod
class Notifications extends _$Notifications {
  @override
  Future<List<NotificationModel>> build() async {
    // Return mock unread notifications
    return [
      NotificationModel(
        id: 'notif-1',
        title: 'Aprobación requerida',
        message:
            'Tienes una nueva solicitud de Juan Perez para Aprobar Salida Temprano.',
        isRead: false,
        createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
      ),
      NotificationModel(
        id: 'notif-2',
        title: 'Vale Rechazado',
        message: 'El vale de combustible VC-1002 fue rechazado.',
        isRead: false,
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
    ];
  }

  Future<void> markAsRead(String id) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final currentList = await build(); // re-fetch simulating db look
      return currentList.map((e) {
        if (e.id == id) {
          return e.copyWith(isRead: true);
        }
        return e;
      }).toList();
    });
  }
}

@riverpod
int unreadNotificationsCount(Ref ref) {
  final list = ref.watch(notificationsProvider);
  return list.maybeWhen(
    data: (notes) => notes.where((n) => !n.isRead).length,
    orElse: () => 0,
  );
}
