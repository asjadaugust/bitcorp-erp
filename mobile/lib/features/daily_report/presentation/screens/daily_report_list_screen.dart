import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/aero_theme.dart';
import '../providers/daily_report_list_provider.dart';
import '../../domain/models/daily_report_model.dart';
import 'package:mobile/core/widgets/global_search_delegate.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/notifications/presentation/widgets/notification_bell_button.dart';
import 'package:mobile/core/widgets/empty_state_widget.dart';
import 'package:mobile/core/widgets/error_state_widget.dart';
import 'package:mobile/core/widgets/shimmer_loading.dart';
import 'package:mobile/core/widgets/status_badge.dart';

class DailyReportListScreen extends ConsumerStatefulWidget {
  const DailyReportListScreen({super.key});

  @override
  ConsumerState<DailyReportListScreen> createState() =>
      _DailyReportListScreenState();
}

class _DailyReportListScreenState extends ConsumerState<DailyReportListScreen> {
  String _selectedStatus = 'Todos';

  List<DailyReportModel> _filterReports(List<DailyReportModel> all) {
    return all.where((r) {
      if (_selectedStatus == 'Todos') return true;
      if (_selectedStatus == 'Borrador') return r.syncStatus == 'DRAFT';
      if (_selectedStatus == 'Aprobado') return r.estado == 'APPROVED';
      if (_selectedStatus == 'Rechazado') return r.estado == 'REJECTED';
      if (_selectedStatus == 'Pendiente Sync') {
        return r.syncStatus == 'PENDING_SYNC';
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final reportsState = ref.watch(dailyReportListProvider);

    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: const Text('Reportes Diarios'),
        backgroundColor: Colors.white,
        foregroundColor: AeroTheme.primary900,
        elevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              showSearch(
                context: context,
                delegate: GlobalSearchDelegate(ref.read(dioProvider)),
              );
            },
          ),
          const NotificationBellButton(),
          const SizedBox(width: 8),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/reports/new'),
        backgroundColor: AeroTheme.primary500,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text(
          'Nuevo Reporte',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: Column(
        children: [
          _buildFilterBar(),
          Expanded(
            child: RefreshIndicator(
              color: AeroTheme.primary500,
              onRefresh: () =>
                  ref.read(dailyReportListProvider.notifier).refresh(),
              child: reportsState.when(
                data: (reports) {
                  final filtered = _filterReports(reports);
                  if (filtered.isEmpty) {
                    return EmptyStateWidget(
                      icon: Icons.assignment_outlined,
                      title: 'No hay reportes diarios',
                      subtitle:
                          'No hay registros que coincidan con los filtros seleccionados.',
                      ctaLabel: 'Crear Primer Reporte',
                      onCta: () => context.push('/reports/new'),
                    );
                  }
                  return ListView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(AeroTheme.spacing16),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      return _buildReportCard(filtered[index]);
                    },
                  );
                },
                loading: () => const ShimmerLoadingList(),
                error: (error, stack) => ErrorStateWidget(
                  message: 'Error al cargar reportes',
                  onRetry: () =>
                      ref.read(dailyReportListProvider.notifier).refresh(),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(
        horizontal: AeroTheme.spacing16,
        vertical: 12,
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildFilterChip('Todos'),
            const SizedBox(width: 8),
            _buildFilterChip('Borrador'),
            const SizedBox(width: 8),
            _buildFilterChip('Aprobado'),
            const SizedBox(width: 8),
            _buildFilterChip('Rechazado'),
            const SizedBox(width: 8),
            _buildFilterChip('Pendiente Sync'),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _selectedStatus == label;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() => _selectedStatus = label);
        }
      },
      selectedColor: AeroTheme.primary500.withValues(alpha: 0.1),
      labelStyle: TextStyle(
        color: isSelected ? AeroTheme.primary500 : AeroTheme.grey700,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      backgroundColor: AeroTheme.grey100,
      side: BorderSide(
        color: isSelected ? AeroTheme.primary500 : AeroTheme.grey300,
      ),
    );
  }

  Widget _buildReportCard(DailyReportModel report) {
    return Card(
      margin: const EdgeInsets.only(bottom: AeroTheme.spacing16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      elevation: 2,
      color: Colors.white,
      child: InkWell(
        onTap: () {
          final id = report.serverId?.toString() ?? report.id;
          context.push('/reports/$id', extra: report);
        },
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        child: Padding(
          padding: const EdgeInsets.all(AeroTheme.spacing16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today,
                        size: 14,
                        color: AeroTheme.grey500,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        report.date,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AeroTheme.primary900,
                        ),
                      ),
                    ],
                  ),
                  StatusBadge.fromStatus(report.estado ?? report.syncStatus),
                ],
              ),
              const SizedBox(height: AeroTheme.spacing8),
              Row(
                children: [
                  const Icon(
                    Icons.directions_car,
                    size: 16,
                    color: AeroTheme.grey500,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    report.equipoCodigo ?? 'Equipo ${report.equipmentId}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AeroTheme.primary900,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AeroTheme.spacing4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Horas Efectivas: ${report.effectiveHours.toStringAsFixed(1)}',
                    style: const TextStyle(color: AeroTheme.grey700),
                  ),
                  Row(
                    children: [
                      const Icon(Icons.chevron_right, color: AeroTheme.grey500),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
