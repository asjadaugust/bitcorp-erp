import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/aero_theme.dart';
import '../providers/daily_report_list_provider.dart';
import '../../domain/models/daily_report_model.dart';
import 'package:shimmer/shimmer.dart';

class DailyReportListScreen extends ConsumerWidget {
  const DailyReportListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reportsState = ref.watch(dailyReportListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reportes Diarios'),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () {}),
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/reports/new'),
        backgroundColor: AeroTheme.primary500,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Column(
        children: [
          _buildFilterBar(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () =>
                  ref.read(dailyReportListProvider.notifier).refresh(),
              child: reportsState.when(
                data: (reports) {
                  if (reports.isEmpty) {
                    return _buildEmptyState(context);
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.all(AeroTheme.spacing16),
                    itemCount: reports.length,
                    itemBuilder: (context, index) {
                      return _buildReportCard(reports[index]);
                    },
                  );
                },
                loading: () => _buildLoadingState(),
                error: (error, stack) => Center(
                  child: Text(
                    'Error: $error',
                    style: const TextStyle(color: AeroTheme.accent500),
                  ),
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
      padding: const EdgeInsets.symmetric(
        horizontal: AeroTheme.spacing16,
        vertical: AeroTheme.spacing8,
      ),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          TextButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.calendar_today, size: 16),
            label: const Text('Fecha'),
          ),
          TextButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.filter_list, size: 16),
            label: const Text('Filtros'),
          ),
        ],
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
      child: Padding(
        padding: const EdgeInsets.all(AeroTheme.spacing16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  report.date,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AeroTheme.primary900,
                  ),
                ),
                _buildStatusBadge(report.syncStatus),
              ],
            ),
            const SizedBox(height: AeroTheme.spacing8),
            Text(
              'Equipo: ${report.equipmentId}',
              style: const TextStyle(color: AeroTheme.grey700),
            ),
            const SizedBox(height: AeroTheme.spacing4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Horas Efectivas: ${report.effectiveHours.toStringAsFixed(1)}',
                  style: const TextStyle(color: AeroTheme.grey700),
                ),
                Text(
                  'Eventos: ${report.events.length}',
                  style: const TextStyle(color: AeroTheme.grey700),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    String label;

    switch (status) {
      case 'DRAFT':
        bgColor = AeroTheme.grey200;
        textColor = AeroTheme.primary900;
        label = 'Borrador';
        break;
      case 'PENDING_SYNC':
        bgColor = AeroTheme.grey100;
        textColor = AeroTheme.grey700;
        label = 'Pendiente Sync';
        break;
      case 'APPROVED':
        bgColor = AeroTheme.semanticBlue100;
        textColor = AeroTheme.semanticBlue500;
        label = 'Aprobado';
        break;
      case 'REJECTED':
        bgColor = const Color(0xFFFDE8E8); // Light Accent
        textColor = AeroTheme.accent500;
        label = 'Rechazado';
        break;
      default:
        bgColor = AeroTheme.grey200;
        textColor = AeroTheme.primary900;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.assignment_outlined,
            size: 64,
            color: AeroTheme.grey300,
          ),
          const SizedBox(height: AeroTheme.spacing16),
          const Text(
            'No hay reportes diarios',
            style: TextStyle(fontSize: 18, color: AeroTheme.primary900),
          ),
          const SizedBox(height: AeroTheme.spacing8),
          const Text(
            'Aún no has creado ningún parte diario.',
            style: TextStyle(color: AeroTheme.grey700),
          ),
          const SizedBox(height: AeroTheme.spacing24),
          ElevatedButton(
            onPressed: () => context.push('/reports/new'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AeroTheme.primary500,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
              ),
            ),
            child: const Text('Crear Primer Reporte'),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return ListView.builder(
      padding: const EdgeInsets.all(AeroTheme.spacing16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
          baseColor: AeroTheme.grey200,
          highlightColor: Colors.white,
          child: Card(
            margin: const EdgeInsets.only(bottom: AeroTheme.spacing16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
            ),
            child: const SizedBox(height: 100, width: double.infinity),
          ),
        );
      },
    );
  }
}
