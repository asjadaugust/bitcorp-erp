import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/features/dashboard/presentation/providers/dashboard_provider.dart';
import 'package:mobile/core/providers/global_project_provider.dart';
import 'package:mobile/features/notifications/presentation/widgets/notification_bell_button.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/widgets/global_search_delegate.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/dashboard/domain/models/dashboard_summary_model.dart';

import 'package:mobile/features/auth/presentation/providers/auth_provider.dart';

String _dashboardInitials(String? name) {
  if (name == null || name.trim().isEmpty) return '?';
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.length == 1) return parts[0][0].toUpperCase();
  return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
}

String _estadoLabel(String estado) {
  switch (estado.toUpperCase()) {
    case 'NOT_SUBMITTED':
      return 'No enviado';
    case 'BORRADOR':
      return 'Borrador';
    case 'PENDIENTE_APROBACION':
      return 'Pendiente aprobación';
    case 'APROBADO':
      return 'Aprobado';
    case 'RECHAZADO':
      return 'Rechazado';
    default:
      return estado;
  }
}

Color _estadoColor(String estado) {
  switch (estado.toUpperCase()) {
    case 'APROBADO':
      return AeroTheme.semanticGreen500;
    case 'RECHAZADO':
      return AeroTheme.accent500;
    case 'PENDIENTE_APROBACION':
      return AeroTheme.semanticBlue500;
    default:
      return AeroTheme.grey500;
  }
}

class OperatorDashboardScreen extends ConsumerWidget {
  const OperatorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardState = ref.watch(dashboardProvider);
    final authState = ref.watch(authProvider);

    final selectedProject = ref.watch(globalProjectProvider);

    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: _buildProjectDropdown(context, ref, selectedProject),
        backgroundColor: Colors.white,
        foregroundColor: AeroTheme.primary900,
        elevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              showSearch(context: context, delegate: GlobalSearchDelegate(ref.read(dioProvider)));
            },
          ),
          const NotificationBellButton(),
          IconButton(
            tooltip: 'Mi Cuenta',
            icon: CircleAvatar(
              radius: 14,
              backgroundColor: AeroTheme.primary500,
              child: Text(
                _dashboardInitials(authState.userName),
                style: const TextStyle(
                  fontSize: 11,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            onPressed: () => context.push('/profile'),
          ),
          const SizedBox(width: 8),
        ],
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
                'Hola, ${authState.userName?.split(' ').first ?? 'Operador'}',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: AeroTheme.primary900,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _todayLabel(),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AeroTheme.grey500,
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

  String _todayLabel() {
    final now = DateTime.now();
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return '${days[now.weekday - 1]}, ${now.day} de ${months[now.month - 1]}';
  }

  Widget _buildProjectDropdown(
    BuildContext context,
    WidgetRef ref,
    String? selectedProject,
  ) {
    final projectListState = ref.watch(projectListProvider);

    return projectListState.when(
      data: (projects) {
        if (projects.isEmpty) {
          return Text(
            'Sin proyectos',
            style: TextStyle(
              fontFamily: AeroTheme.headingFont,
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          );
        }
        final validSelection = projects.any((p) => p.id == selectedProject)
            ? selectedProject
            : projects.first.id;

        return DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: validSelection,
            icon: const Icon(
              Icons.arrow_drop_down,
              color: AeroTheme.primary900,
            ),
            style: TextStyle(
              fontFamily: AeroTheme.headingFont,
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
            onChanged: (String? newValue) {
              if (newValue != null) {
                ref.read(globalProjectProvider.notifier).setProject(newValue);
                ref.read(dashboardProvider.notifier).refresh();
              }
            },
            items: projects.map<DropdownMenuItem<String>>((project) {
              return DropdownMenuItem<String>(
                value: project.id,
                child: Text(project.name),
              );
            }).toList(),
          ),
        );
      },
      loading: () => const SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(strokeWidth: 2),
      ),
      error: (_, __) => Text(
        'Proyecto',
        style: TextStyle(
          fontFamily: AeroTheme.headingFont,
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: AeroTheme.primary900,
        ),
      ),
    );
  }

  Widget _buildDashboardContent(BuildContext context, DashboardSummaryModel data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── Stats grid (2×2) ─────────────────────────────────────────────
        _buildStatsGrid(context, data.stats),
        const SizedBox(height: 16),

        // ── Equipo asignado ──────────────────────────────────────────────
        _buildEquipmentCard(
          context,
          data.equipmentCode,
          data.equipmentDescription,
          data.equipmentId,
        ),
        const SizedBox(height: 16),

        // ── Quick actions ────────────────────────────────────────────────
        _buildQuickActions(context),
        const SizedBox(height: 16),

        // ── Parte diario de hoy ──────────────────────────────────────────
        _buildDailyReportCard(context, data.dailyReportStatus),
        const SizedBox(height: 16),

        // ── Reportes recientes ───────────────────────────────────────────
        _buildRecentPartes(context, data.recentPartes),
      ],
    );
  }

  Widget _buildStatsGrid(BuildContext context, DashboardStatsModel? stats) {
    final s = stats;
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _buildStatCard(
          context,
          icon: Icons.assignment,
          label: 'Partes Hoy',
          value: '${s?.partesHoy ?? 0}',
          color: AeroTheme.primary500,
        ),
        _buildStatCard(
          context,
          icon: Icons.date_range,
          label: 'Esta Semana',
          value: '${s?.partesSemana ?? 0}',
          color: AeroTheme.primary500,
        ),
        _buildStatCard(
          context,
          icon: Icons.calendar_month,
          label: 'Este Mes',
          value: '${s?.partesMes ?? 0}',
          color: AeroTheme.primary500,
        ),
        _buildStatCard(
          context,
          icon: Icons.timer,
          label: 'Horas del Mes',
          value: s != null ? s.horasMes.toStringAsFixed(1) : '0.0',
          color: AeroTheme.semanticGreen500,
        ),
      ],
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: AeroTheme.primary900,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AeroTheme.grey500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEquipmentCard(
    BuildContext context,
    String code,
    String description,
    String? equipmentId,
  ) {
    final hasEquipment = equipmentId != null && code != 'N/A';
    return Container(
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
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: hasEquipment ? () => context.push('/equipment/$equipmentId') : null,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: hasEquipment
                        ? AeroTheme.primary100
                        : AeroTheme.grey100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.construction,
                    color: hasEquipment
                        ? AeroTheme.primary500
                        : AeroTheme.grey300,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
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
                      const SizedBox(height: 2),
                      Text(
                        code,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: hasEquipment
                              ? AeroTheme.primary500
                              : AeroTheme.grey500,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        description,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AeroTheme.grey700,
                        ),
                      ),
                    ],
                  ),
                ),
                if (hasEquipment)
                  const Icon(
                    Icons.arrow_forward_ios,
                    size: 14,
                    color: AeroTheme.grey300,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _buildActionButton(
            context,
            icon: Icons.add_circle_outline,
            label: 'Nuevo Parte',
            onTap: () => context.push('/reports/new'),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildActionButton(
            context,
            icon: Icons.history,
            label: 'Ver Historial',
            onTap: () => context.push('/reports'),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildActionButton(
            context,
            icon: Icons.fact_check_outlined,
            label: 'Checklists',
            onTap: () => context.push('/checklists'),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: AeroTheme.primary500, size: 24),
              const SizedBox(height: 4),
              Text(
                label,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AeroTheme.primary900,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDailyReportCard(BuildContext context, String estado) {
    final color = _estadoColor(estado);
    final label = _estadoLabel(estado);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(Icons.assignment_turned_in, color: AeroTheme.grey500, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Parte Diario de Hoy',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AeroTheme.grey500,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: color,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentPartes(
    BuildContext context,
    List<DashboardRecentParteModel> partes,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Text(
            'Reportes Recientes',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: AeroTheme.primary900,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        if (partes.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Center(
              child: Text(
                'No hay reportes recientes',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AeroTheme.grey500,
                ),
              ),
            ),
          )
        else
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: partes.asMap().entries.map((entry) {
                final isLast = entry.key == partes.length - 1;
                final parte = entry.value;
                return _buildRecentParteRow(context, parte, isLast);
              }).toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildRecentParteRow(
    BuildContext context,
    DashboardRecentParteModel parte,
    bool isLast,
  ) {
    final color = _estadoColor(parte.estado);
    final label = _estadoLabel(parte.estado);
    return InkWell(
      onTap: () => context.push('/reports/${parte.id}'),
      borderRadius: isLast
          ? const BorderRadius.vertical(bottom: Radius.circular(8))
          : BorderRadius.zero,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          border: isLast
              ? null
              : const Border(
                  bottom: BorderSide(color: AeroTheme.grey100),
                ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    parte.codigo ?? 'PD-${parte.id}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AeroTheme.primary900,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    parte.fecha,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AeroTheme.grey500,
                    ),
                  ),
                ],
              ),
            ),
            if (parte.horasTrabajadas != null)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Text(
                  '${parte.horasTrabajadas!.toStringAsFixed(1)}h',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AeroTheme.grey700,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
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
              minimumSize: const Size(200, 48),
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
          // Stats grid skeleton
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.6,
            children: List.generate(4, (_) => _buildSkeletonBox(height: 80)),
          ),
          const SizedBox(height: 16),
          _buildSkeletonBox(height: 72),
          const SizedBox(height: 16),
          _buildSkeletonBox(height: 56),
          const SizedBox(height: 16),
          _buildSkeletonBox(height: 72),
          const SizedBox(height: 16),
          _buildSkeletonBox(height: 200),
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
