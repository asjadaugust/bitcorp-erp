import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/core/providers/app_version_provider.dart';
import 'package:mobile/features/auth/presentation/providers/auth_provider.dart';

String _initials(String? name) {
  if (name == null || name.trim().isEmpty) return '?';
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.length == 1) return parts[0][0].toUpperCase();
  return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
}

String _roleLabel(String? role) {
  switch (role) {
    case 'OPERADOR':
      return 'Operador';
    case 'SUPERVISOR':
      return 'Supervisor';
    case 'ADMIN':
      return 'Administrador';
    case 'DIRECTOR':
      return 'Director';
    case 'JEFE_EQUIPO':
      return 'Jefe de Equipo';
    default:
      return role ?? '—';
  }
}

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        ),
        title: const Text(
          'Cerrar Sesión',
          style: TextStyle(
            color: AeroTheme.primary900,
            fontWeight: FontWeight.bold,
          ),
        ),
        content: const Text(
          '¿Estás seguro de que deseas cerrar sesión?',
          style: TextStyle(color: AeroTheme.grey700),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text(
              'Cancelar',
              style: TextStyle(color: AeroTheme.grey700),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AeroTheme.accent500,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
              ),
            ),
            child: const Text('Cerrar Sesión'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(authProvider.notifier).logout();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final versionAsync = ref.watch(appVersionProvider);

    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: const Text('Mi Cuenta'),
        backgroundColor: Colors.white,
        foregroundColor: AeroTheme.primary900,
        elevation: 1,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: AeroTheme.primary500,
                    child: Text(
                      _initials(authState.userName),
                      style: const TextStyle(
                        fontSize: 24,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontFamily: AeroTheme.headingFont,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    authState.userName ?? '—',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AeroTheme.primary900,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AeroTheme.primary100,
                      borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                    ),
                    child: Text(
                      _roleLabel(authState.role),
                      style: const TextStyle(
                        color: AeroTheme.primary500,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Info section
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  _InfoRow(
                    icon: Icons.badge_outlined,
                    label: 'ID de usuario',
                    value: authState.userId?.toString() ?? '—',
                  ),
                  const Divider(height: 1, color: AeroTheme.grey200),
                  versionAsync.when(
                    data: (v) => _InfoRow(
                      icon: Icons.info_outline,
                      label: 'Versión de la app',
                      value: v.currentVersion,
                    ),
                    loading: () => const _InfoRow(
                      icon: Icons.info_outline,
                      label: 'Versión de la app',
                      value: '…',
                    ),
                    error: (_, _) => const _InfoRow(
                      icon: Icons.info_outline,
                      label: 'Versión de la app',
                      value: '—',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            // Logout button
            ElevatedButton.icon(
              onPressed: () => _confirmLogout(context, ref),
              icon: const Icon(Icons.logout),
              label: const Text('Cerrar Sesión'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AeroTheme.accent500,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                ),
                textStyle: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AeroTheme.grey500),
          const SizedBox(width: 12),
          Text(
            label,
            style: const TextStyle(color: AeroTheme.grey700, fontSize: 14),
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              color: AeroTheme.primary900,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
