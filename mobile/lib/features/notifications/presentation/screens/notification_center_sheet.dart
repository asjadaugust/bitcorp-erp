import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/features/notifications/presentation/providers/notifications_provider.dart';

class NotificationCenterSheet extends ConsumerWidget {
  const NotificationCenterSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationsProvider);

    return Container(
      decoration: const BoxDecoration(
        color: AeroTheme.primary100,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AeroTheme.radiusLg),
        ),
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.8,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildHeader(context),
          Expanded(
            child: state.when(
              data: (items) {
                final unread = items.where((n) => !n.isRead).toList();
                if (unread.isEmpty) {
                  return const Center(
                    child: Text('No tienes notificaciones nuevas.'),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(AeroTheme.spacing16),
                  itemCount: unread.length,
                  itemBuilder: (context, index) {
                    final note = unread[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: AeroTheme.spacing8),
                      elevation: 1,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                      ),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AeroTheme.primary100,
                          child: const Icon(
                            Icons.notifications,
                            color: AeroTheme.primary500,
                          ),
                        ),
                        title: Text(
                          note.title,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text(note.message),
                            const SizedBox(height: 4),
                            Text(
                              '${note.createdAt.hour}:${note.createdAt.minute.toString().padLeft(2, '0')} - ${note.createdAt.day}/${note.createdAt.month}/${note.createdAt.year}',
                              style: const TextStyle(
                                fontSize: 10,
                                color: AeroTheme.grey500,
                              ),
                            ),
                          ],
                        ),
                        trailing: IconButton(
                          icon: const Icon(
                            Icons.check_circle_outline,
                            color: AeroTheme.semanticBlue500,
                          ),
                          onPressed: () {
                            ref
                                .read(notificationsProvider.notifier)
                                .markAsRead(note.id);
                          },
                          tooltip: 'Marcar como leída',
                        ),
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, st) => Center(child: Text('Error: $e')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AeroTheme.spacing16,
        vertical: AeroTheme.spacing12,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AeroTheme.radiusLg),
        ),
        border: Border(bottom: BorderSide(color: AeroTheme.grey300)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Notificaciones',
            style: TextStyle(
              fontFamily: AeroTheme.headingFont,
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }
}

void showNotificationCenter(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => const NotificationCenterSheet(),
  );
}
