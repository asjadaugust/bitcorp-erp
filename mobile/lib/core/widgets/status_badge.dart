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

  /// Factory for common report/approval statuses.
  ///
  /// Supports both legacy mobile-only keys (APPROVED, REJECTED, DRAFT, etc.)
  /// and canonical backend keys (BORRADOR, PENDIENTE, APROBADO, etc.) for
  /// cross-surface consistency with the web Admin and Operator views.
  factory StatusBadge.fromStatus(String status) {
    switch (status) {
      // ── Canonical Parte Diario statuses (backend keys) ──────────
      case 'BORRADOR':
      case 'DRAFT':
        return const StatusBadge(
          label: 'Borrador',
          backgroundColor: AeroTheme.grey200,
          textColor: AeroTheme.grey500,
          icon: Icons.edit_outlined,
        );
      case 'PENDIENTE':
      case 'PENDING':
        return StatusBadge(
          label: 'Pendiente',
          backgroundColor: AeroTheme.primary500.withValues(alpha: 0.1),
          textColor: AeroTheme.primary500,
          icon: Icons.schedule,
        );
      case 'APROBADO':
      case 'APPROVED':
      case 'PASS':
        return const StatusBadge(
          label: 'Aprobado',
          backgroundColor: AeroTheme.semanticBlue100,
          textColor: AeroTheme.semanticGreen500,
          icon: Icons.check_circle_outline,
        );
      case 'RECHAZADO':
      case 'REJECTED':
      case 'FAIL':
        return StatusBadge(
          label: 'Rechazado',
          backgroundColor: AeroTheme.accent500.withValues(alpha: 0.1),
          textColor: AeroTheme.accent500,
          icon: Icons.cancel_outlined,
        );
      case 'APROBADO_SUPERVISOR':
        return StatusBadge(
          label: 'Aprob. Supervisor',
          backgroundColor: AeroTheme.primary500.withValues(alpha: 0.1),
          textColor: AeroTheme.primary500,
          icon: Icons.supervisor_account,
        );
      case 'REVISADO_COSTOS':
        return StatusBadge(
          label: 'Rev. Costos',
          backgroundColor: AeroTheme.primary500.withValues(alpha: 0.1),
          textColor: AeroTheme.primary500,
          icon: Icons.calculate_outlined,
        );
      case 'PENDIENTE_FINANZAS':
        return StatusBadge(
          label: 'Pend. Finanzas',
          backgroundColor: AeroTheme.primary500.withValues(alpha: 0.1),
          textColor: AeroTheme.primary500,
          icon: Icons.account_balance_outlined,
        );
      case 'APROBADO_FINANZAS':
        return const StatusBadge(
          label: 'Aprob. Finanzas',
          backgroundColor: AeroTheme.semanticBlue100,
          textColor: AeroTheme.semanticGreen500,
          icon: Icons.paid_outlined,
        );
      case 'ENVIADO':
        return StatusBadge(
          label: 'Enviado',
          backgroundColor: AeroTheme.primary500.withValues(alpha: 0.1),
          textColor: AeroTheme.primary500,
          icon: Icons.send_outlined,
        );
      // ── Mobile-only sync statuses ───────────────────────────────
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
