import 'package:flutter/material.dart';
import 'package:mobile/core/sync/models/sync_conflict.dart';
import 'package:mobile/core/theme/aero_theme.dart';

class ConflictResolutionDialog extends StatelessWidget {
  final SyncConflict conflict;

  const ConflictResolutionDialog({super.key, required this.conflict});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      backgroundColor: AeroTheme.white,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: AeroTheme.accent500,
                  size: 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Conflicto de Sincronización',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AeroTheme.primary900,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              conflict.message,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AeroTheme.grey700),
            ),
            const SizedBox(height: 24),
            _buildOptionButton(
              context: context,
              label: 'Sobrescribir Remoto',
              icon: Icons.upload,
              isDestructive: true,
              onTap: () => Navigator.of(context).pop('OVERWRITE'),
            ),
            const SizedBox(height: 12),
            _buildOptionButton(
              context: context,
              label: 'Mantener Remoto',
              icon: Icons.download,
              onTap: () => Navigator.of(context).pop('KEEP_REMOTE'),
            ),
            const SizedBox(height: 12),
            _buildOptionButton(
              context: context,
              label: 'Guardar como Nuevo (Borrador)',
              icon: Icons.save_as,
              onTap: () => Navigator.of(context).pop('SAVE_NEW'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionButton({
    required BuildContext context,
    required String label,
    required IconData icon,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 20),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        foregroundColor: isDestructive
            ? AeroTheme.accent500
            : AeroTheme.primary500,
        side: BorderSide(
          color: isDestructive ? AeroTheme.accent500 : AeroTheme.primary500,
        ),
        minimumSize: const Size.fromHeight(48),
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
