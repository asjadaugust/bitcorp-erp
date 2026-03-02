import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/features/vouchers/domain/models/vale_combustible_model.dart';
import 'package:mobile/features/vouchers/presentation/providers/vale_list_provider.dart';
import 'package:mobile/core/widgets/global_search_delegate.dart';

class ValeListScreen extends ConsumerWidget {
  const ValeListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final valeListState = ref.watch(valeListProvider);

    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: const Text('Vales de Combustible'),
        backgroundColor: Colors.white,
        foregroundColor: AeroTheme.primary900,
        elevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              showSearch(context: context, delegate: GlobalSearchDelegate());
            },
          ),
        ],
      ),
      body: valeListState.when(
        data: (vales) => _buildList(context, ref, vales),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => _buildError(context, ref, error),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/vouchers/new'),
        backgroundColor: AeroTheme.primary500,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text(
          'Nuevo Vale',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildList(
    BuildContext context,
    WidgetRef ref,
    List<ValeCombustibleModel> vales,
  ) {
    if (vales.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long, size: 64, color: AeroTheme.grey500),
            const SizedBox(height: 16),
            Text(
              'No hay vales registrados',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AeroTheme.grey700,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Registra el combustible escaneando vales.',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AeroTheme.grey500),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(valeListProvider.notifier).refresh(),
      color: AeroTheme.primary500,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: vales.length,
        separatorBuilder: (context, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final vale = vales[index];
          return _ValeCard(vale: vale);
        },
      ),
    );
  }

  Widget _buildError(BuildContext context, WidgetRef ref, Object error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: AeroTheme.accent500),
            const SizedBox(height: 16),
            Text(
              'Hubo un problema cargando los vales.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AeroTheme.primary900,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(valeListProvider.notifier).refresh(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AeroTheme.primary500,
              ),
              child: const Text(
                'Reintentar',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ValeCard extends StatelessWidget {
  final ValeCombustibleModel vale;

  const _ValeCard({required this.vale});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd MMM yyyy, HH:mm');
    final isVinculado = vale.estado == 'VINCULADO';
    final statusColor = isVinculado
        ? AeroTheme.semanticGreen500
        : AeroTheme.semanticBlue500;

    // Status text logic matching exact terms requested
    String statusText = isVinculado ? 'Vinculado' : 'No Vinculado';
    if (vale.syncStatus == 'PENDING_SYNC') {
      statusText += ' • PENDIENTE SYNC';
    }

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Vale #\${vale.numeroVale}',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              color: AeroTheme.primary900,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Equipo: \${vale.idEquipo}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AeroTheme.grey700,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '\${vale.cantidadGalones} Galones (\${vale.tipoCombustible})',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AeroTheme.primary500,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Icon(
                            Icons.calendar_today,
                            size: 14,
                            color: AeroTheme.grey500,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            dateFormat.format(vale.fecha),
                            style: Theme.of(context).textTheme.labelSmall
                                ?.copyWith(color: AeroTheme.grey500),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AeroTheme.grey100,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: AeroTheme.grey300),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: Image.file(
                      File(vale.fotoPath),
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          Icon(Icons.broken_image, color: AeroTheme.grey500),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(8),
                bottomRight: Radius.circular(8),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isVinculado ? Icons.link : Icons.link_off,
                  size: 16,
                  color: statusColor,
                ),
                const SizedBox(width: 8),
                Text(
                  statusText.toUpperCase(),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
