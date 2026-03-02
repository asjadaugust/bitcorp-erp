import 'package:flutter/material.dart';
import 'package:mobile/core/theme/aero_theme.dart';

/// Reusable status badge widget with consistent styling across all screens.
class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;
  final IconData? icon;

  const StatusBadge({
    super.key,
    required this.label,
    required this.backgroundColor,
    required this.textColor,
    this.icon,
  });

  /// Factory for common report/approval statuses
  factory StatusBadge.fromStatus(String status) {
    switch (status) {
      case 'APPROVED':
        return const StatusBadge(
          label: 'Aprobado',
          backgroundColor: AeroTheme.semanticBlue100,
          textColor: AeroTheme.semanticBlue500,
          icon: Icons.check_circle_outline,
        );
      case 'REJECTED':
        return StatusBadge(
          label: 'Rechazado',
          backgroundColor: AeroTheme.accent500.withValues(alpha: 0.1),
          textColor: AeroTheme.accent500,
          icon: Icons.cancel_outlined,
        );
      case 'PENDING':
        return StatusBadge(
          label: 'Pendiente',
          backgroundColor: AeroTheme.semanticBlue500.withValues(alpha: 0.1),
          textColor: AeroTheme.semanticBlue500,
          icon: Icons.schedule,
        );
      case 'DRAFT':
        return const StatusBadge(
          label: 'Borrador',
          backgroundColor: AeroTheme.grey200,
          textColor: AeroTheme.primary900,
          icon: Icons.edit_outlined,
        );
      case 'PENDING_SYNC':
        return const StatusBadge(
          label: 'Pendiente Sync',
          backgroundColor: AeroTheme.grey100,
          textColor: AeroTheme.grey700,
          icon: Icons.cloud_upload_outlined,
        );
      case 'SYNCED':
        return const StatusBadge(
          label: 'Sincronizado',
          backgroundColor: AeroTheme.semanticBlue100,
          textColor: AeroTheme.semanticBlue500,
          icon: Icons.cloud_done_outlined,
        );
      case 'PASS':
        return const StatusBadge(
          label: 'Aprobado',
          backgroundColor: AeroTheme.semanticBlue100,
          textColor: AeroTheme.semanticBlue500,
          icon: Icons.check_circle_outline,
        );
      case 'FAIL':
        return StatusBadge(
          label: 'Con Fallas',
          backgroundColor: AeroTheme.accent500.withValues(alpha: 0.1),
          textColor: AeroTheme.accent500,
          icon: Icons.warning_amber_outlined,
        );
      default:
        return StatusBadge(
          label: status,
          backgroundColor: AeroTheme.grey200,
          textColor: AeroTheme.primary900,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: textColor,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
