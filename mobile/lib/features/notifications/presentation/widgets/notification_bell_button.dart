import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:badges/badges.dart' as badges;
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/features/notifications/presentation/providers/notifications_provider.dart';
import 'package:mobile/features/notifications/presentation/screens/notification_center_sheet.dart';

class NotificationBellButton extends ConsumerWidget {
  const NotificationBellButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unreadCount = ref.watch(unreadNotificationsCountProvider);

    return badges.Badge(
      position: badges.BadgePosition.topEnd(top: 8, end: 8),
      showBadge: unreadCount > 0,
      badgeContent: Text(
        unreadCount.toString(),
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
      badgeStyle: const badges.BadgeStyle(
        badgeColor: AeroTheme.accent500,
        padding: EdgeInsets.all(4),
      ),
      child: IconButton(
        icon: const Icon(Icons.notifications_none),
        onPressed: () => showNotificationCenter(context),
      ),
    );
  }
}
