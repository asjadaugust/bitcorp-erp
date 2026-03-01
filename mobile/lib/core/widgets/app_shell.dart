import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/core/sync/sync_service.dart';
import 'package:mobile/core/sync/presentation/widgets/conflict_resolution_dialog.dart';

class AppShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const AppShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Listen to sync state explicitly to trigger overlays
    ref.listen<SyncState>(syncServiceProvider, (previous, next) {
      if (next.status == SyncStatus.conflict &&
          next.currentConflict != null &&
          (previous?.status != SyncStatus.conflict)) {
        // Show dialog and pass result back
        showDialog<String>(
          context: context,
          barrierDismissible: false,
          builder: (context) =>
              ConflictResolutionDialog(conflict: next.currentConflict!),
        ).then((choice) {
          if (choice != null) {
            ref.read(syncServiceProvider.notifier).resolveConflict(choice);
          }
        });
      } else if (next.status == SyncStatus.error &&
          next.errorMessage != null &&
          (previous?.status != SyncStatus.error)) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.errorMessage!),
            backgroundColor: AeroTheme.accent500,
          ),
        );
      }
    });

    final syncState = ref.watch(syncServiceProvider);

    return Scaffold(
      backgroundColor: AeroTheme.primary100, // Matches scaffold background rule
      appBar: _buildGlobalAppBar(syncState),
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) {
          navigationShell.goBranch(
            index,
            initialLocation: index == navigationShell.currentIndex,
          );
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AeroTheme.primary500, // Active interaction color
        unselectedItemColor: AeroTheme.grey700,
        backgroundColor: Colors.white,
        selectedFontSize: 12,
        unselectedFontSize: 12,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Inicio',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_outlined),
            activeIcon: Icon(Icons.assignment),
            label: 'Reportes',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_gas_station_outlined),
            activeIcon: Icon(Icons.local_gas_station),
            label: 'Vales',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.fact_check_outlined),
            activeIcon: Icon(Icons.fact_check),
            label: 'Checklists',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.verified_user_outlined),
            activeIcon: Icon(Icons.verified_user),
            label: 'Aprobaciones',
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget? _buildGlobalAppBar(SyncState state) {
    // Only show global app bar if we are syncing, otherwise let child screens dictate their app bars
    if (state.status == SyncStatus.syncing) {
      return AppBar(
        backgroundColor: AeroTheme.primary500,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Sincronizando...',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      );
    }
    return null;
  }
}
