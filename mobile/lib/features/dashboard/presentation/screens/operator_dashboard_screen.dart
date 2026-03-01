import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/features/dashboard/presentation/providers/dashboard_provider.dart';

class OperatorDashboardScreen extends ConsumerWidget {
  const OperatorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardState = ref.watch(dashboardProvider);

    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: const Text('Inicio'),
        backgroundColor: Colors.white,
        foregroundColor: AeroTheme.primary900,
        elevation: 1,
      ),
      body: RefreshIndicator(
        color: AeroTheme.primary500,
        backgroundColor: Colors.white,
        onRefresh: () => ref.read(dashboardProvider.notifier).refresh(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Hola, Operador',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: AeroTheme.primary900,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              dashboardState.when(
                data: (data) => _buildDashboardContent(context, data),
                loading: () => const _DashboardSkeleton(),
                error: (error, stack) => _buildErrorState(context, ref),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDashboardContent(BuildContext context, data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildEquipmentCard(
          context,
          data.equipmentCode,
          data.equipmentDescription,
        ),
        const SizedBox(height: 16),
        _buildStatusCard(
          context,
          icon: Icons.assignment_turned_in,
          title: 'Parte Diario',
          value: data.dailyReportStatus,
          color: data.dailyReportStatus == 'Enviado'
              ? AeroTheme.semanticGreen500
              : AeroTheme.accent500,
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatusCard(
                context,
                icon: Icons.fact_check,
                title: 'Checklists',
                value: '\${data.pendingChecklistCount} Pendientes',
                color: data.pendingChecklistCount > 0
                    ? AeroTheme.accent500
                    : AeroTheme.semanticGreen500,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildStatusCard(
                context,
                icon: Icons.verified,
                title: 'Aprobaciones',
                value: '\${data.pendingApprovalCount} Solicitudes',
                color: data.pendingApprovalCount > 0
                    ? AeroTheme.primary500
                    : AeroTheme.grey500,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildEquipmentCard(
    BuildContext context,
    String code,
    String description,
  ) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Equipo Asignado',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AeroTheme.grey500,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            code,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              color: AeroTheme.primary500,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            description,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AeroTheme.primary900),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AeroTheme.grey500, size: 28),
          const SizedBox(height: 12),
          Text(
            title,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AeroTheme.grey500,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, WidgetRef ref) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 40),
          Icon(Icons.wifi_off, size: 64, color: AeroTheme.grey500),
          const SizedBox(height: 24),
          Text(
            'No hay conexión',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(color: AeroTheme.primary900),
          ),
          const SizedBox(height: 8),
          Text(
            'No tienes conexión a internet ni datos en caché para mostrar.',
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AeroTheme.grey700),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => ref.read(dashboardProvider.notifier).refresh(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AeroTheme.primary500,
              foregroundColor: Colors.white,
              minimumSize: const Size(200, 48), // Touch target constraint
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }
}

class _DashboardSkeleton extends StatelessWidget {
  const _DashboardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AeroTheme.grey100,
      highlightColor: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildSkeletonBox(height: 120),
          const SizedBox(height: 16),
          _buildSkeletonBox(height: 100),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildSkeletonBox(height: 120)),
              const SizedBox(width: 16),
              Expanded(child: _buildSkeletonBox(height: 120)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSkeletonBox({required double height}) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
      ),
    );
  }
}
