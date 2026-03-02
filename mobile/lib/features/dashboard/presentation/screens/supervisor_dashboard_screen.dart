import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/core/widgets/global_search_delegate.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/dashboard/domain/models/supervisor_dashboard_model.dart';
import 'package:mobile/features/dashboard/presentation/providers/supervisor_dashboard_provider.dart';

class SupervisorDashboardScreen extends ConsumerWidget {
  const SupervisorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(supervisorDashboardProvider);

    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: const Text('Dashboard Inspector'),
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
        ],
      ),
      body: RefreshIndicator(
        color: AeroTheme.primary500,
        backgroundColor: Colors.white,
        onRefresh: () =>
            ref.read(supervisorDashboardProvider.notifier).refresh(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: state.when(
            data: (data) => _buildContent(context, data, ref),
            loading: () => const Center(
              child: Padding(
                padding: EdgeInsets.all(48.0),
                child: CircularProgressIndicator(),
              ),
            ),
            error: (e, st) => Container(
              padding: const EdgeInsets.all(24),
              child: Text(
                'Error: $e',
                style: const TextStyle(color: AeroTheme.accent500),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    SupervisorDashboardModel data,
    WidgetRef ref,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildMetricsRow(context, data),
        const SizedBox(height: 24),
        Text(
          'Observaciones Abiertas',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: AeroTheme.primary900,
          ),
        ),
        const SizedBox(height: 16),
        _buildObservationsList(context, data.observacionesAbiertas, ref),
      ],
    );
  }

  Widget _buildMetricsRow(BuildContext context, SupervisorDashboardModel data) {
    return Row(
      children: [
        Expanded(
          child: _MetricCard(
            title: 'Equipos',
            value: data.totalEquipos.toString(),
            icon: Icons.agriculture,
            color: AeroTheme.primary500,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _MetricCard(
            title: 'Auditado',
            value: data.inspeccionadosPeriodo.toString(),
            icon: Icons.fact_check,
            color: AeroTheme.semanticGreen500,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _MetricCard(
            title: 'Vencidas',
            value: data.inspeccionesVencidas.toString(),
            icon: Icons.warning_rounded,
            color: data.inspeccionesVencidas > 0
                ? AeroTheme.accent500
                : AeroTheme.grey500,
          ),
        ),
      ],
    );
  }

  Widget _buildObservationsList(
    BuildContext context,
    List<ObservationModel> observations,
    WidgetRef ref,
  ) {
    final pendingObs = observations
        .where((o) => o.estado == 'PENDIENTE')
        .toList();

    if (pendingObs.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
          border: Border.all(color: AeroTheme.grey300),
        ),
        child: const Column(
          children: [
            Icon(
              Icons.check_circle_outline,
              color: AeroTheme.semanticGreen500,
              size: 48,
            ),
            SizedBox(height: 16),
            Text(
              'Todo al día',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: AeroTheme.primary900,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'No hay observaciones abiertas.',
              style: TextStyle(color: AeroTheme.grey500),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: pendingObs.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        return _ObservationCard(observation: pendingObs[index], ref: ref);
      },
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        border: Border.all(color: AeroTheme.grey200),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            offset: Offset(0, 2),
            blurRadius: 4,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              fontFamily: AeroTheme.headingFont,
            ),
          ),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              color: AeroTheme.grey700,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _ObservationCard extends StatelessWidget {
  final ObservationModel observation;
  final WidgetRef ref;

  const _ObservationCard({required this.observation, required this.ref});

  void _showResolveDialog(BuildContext context) {
    final commentController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
          ),
          title: const Text(
            'Resolver Observación',
            style: TextStyle(
              color: AeroTheme.primary900,
              fontWeight: FontWeight.bold,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '¿Marcar la observación de ${observation.equipoCodigo} como resuelta?',
              ),
              const SizedBox(height: 16),
              TextField(
                controller: commentController,
                decoration: InputDecoration(
                  labelText: 'Comentario (opcional)',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                    borderSide: const BorderSide(color: AeroTheme.primary500),
                  ),
                ),
                maxLines: 2,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Cancelar',
                style: TextStyle(color: AeroTheme.grey700),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                ref
                    .read(supervisorDashboardProvider.notifier)
                    .resolveObservation(observation.id, commentController.text);
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Observación resuelta',
                      style: TextStyle(color: Colors.white),
                    ),
                    backgroundColor: AeroTheme.semanticGreen500,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AeroTheme.primary500,
              ),
              child: const Text(
                'Resolver',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        border: Border.all(color: AeroTheme.accent500.withOpacity(0.5)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x05000000),
            offset: Offset(0, 2),
            blurRadius: 4,
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AeroTheme.primary100,
                    borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                  ),
                  child: Text(
                    observation.equipoCodigo,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AeroTheme.primary900,
                      fontSize: 12,
                    ),
                  ),
                ),
                Text(
                  observation.fecha.split('T')[0],
                  style: const TextStyle(
                    color: AeroTheme.grey500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              observation.descripcion,
              style: const TextStyle(color: AeroTheme.primary900, fontSize: 14),
            ),
            if (observation.photoUrl != null) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(
                    Icons.broken_image_outlined,
                    size: 16,
                    color: AeroTheme.grey500,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '1 Foto adjunta',
                    style: TextStyle(
                      color: AeroTheme.primary500,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: OutlinedButton.icon(
                onPressed: () => _showResolveDialog(context),
                icon: const Icon(
                  Icons.check_circle_outline,
                  color: AeroTheme.primary500,
                  size: 18,
                ),
                label: const Text(
                  'Resolver',
                  style: TextStyle(color: AeroTheme.primary500),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AeroTheme.primary500),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
