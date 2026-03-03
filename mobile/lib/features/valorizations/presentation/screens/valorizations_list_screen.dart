import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/features/valorizations/domain/models/valorization_model.dart';
import 'package:mobile/features/valorizations/presentation/providers/valorizations_provider.dart';
import 'package:mobile/core/widgets/global_search_delegate.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/notifications/presentation/widgets/notification_bell_button.dart';
import 'package:mobile/core/widgets/empty_state_widget.dart';
import 'package:mobile/core/widgets/error_state_widget.dart';
import 'package:mobile/core/widgets/shimmer_loading.dart';

class ValorizationsListScreen extends ConsumerWidget {
  const ValorizationsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(valorizationsProvider);

    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: const Text('Valorizaciones'),
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
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        color: AeroTheme.primary500,
        backgroundColor: Colors.white,
        onRefresh: () => ref.read(valorizationsProvider.notifier).refresh(),
        child: state.when(
          data: (list) {
            if (list.isEmpty) {
              return const EmptyStateWidget(
                icon: Icons.request_quote_outlined,
                title: 'No hay valorizaciones',
                subtitle: 'Aún no hay registros de pago para este proyecto.',
              );
            }
            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(AeroTheme.spacing16),
              itemCount: list.length,
              separatorBuilder: (_, _) =>
                  const SizedBox(height: AeroTheme.spacing16),
              itemBuilder: (context, index) {
                return _ValorizationCard(valorization: list[index]);
              },
            );
          },
          loading: () => const ShimmerLoadingList(),
          error: (e, st) => ErrorStateWidget(
            message: 'Error al cargar valorizaciones',
            onRetry: () => ref.read(valorizationsProvider.notifier).refresh(),
          ),
        ),
      ),
    );
  }

}

class _ValorizationCard extends StatefulWidget {
  final ValorizationModel valorization;

  const _ValorizationCard({required this.valorization});

  @override
  State<_ValorizationCard> createState() => _ValorizationCardState();
}

class _ValorizationCardState extends State<_ValorizationCard> {
  @override
  Widget build(BuildContext context) {
    final v = widget.valorization;

    // Formatting helper
    String formatCurrency(double val) => 'S/ ${val.toStringAsFixed(2)}';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        border: Border.all(color: AeroTheme.grey300),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000), // very light shadow
            offset: Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            title: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      v.periodo,
                      style: const TextStyle(
                        fontFamily: AeroTheme.headingFont,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AeroTheme.primary900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      formatCurrency(v.totalConIgv),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: AeroTheme.primary500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            subtitle: Align(
              alignment: Alignment.centerLeft,
              child: Container(
                margin: const EdgeInsets.only(top: AeroTheme.spacing8),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: v.estado == 'PAGADO'
                      ? const Color(0xFF00C853).withValues(alpha: 0.1)
                      : Colors.orange.shade700.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                  border: Border.all(
                    color: v.estado == 'PAGADO'
                        ? const Color(0xFF00C853)
                        : Colors.orange.shade700,
                  ),
                ),
                child: Text(
                  v.estado,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: v.estado == 'PAGADO'
                        ? const Color(0xFF00C853)
                        : Colors.orange.shade700,
                  ),
                ),
              ),
            ),
            children: [
              Container(
                color: AeroTheme.primary100,
                padding: const EdgeInsets.all(AeroTheme.spacing16),
                child: Column(
                  children: [
                    _buildLineItem('Total Valorizado', v.totalValorizado, true),
                    if (v.igvMonto != null) ...[
                      const SizedBox(height: AeroTheme.spacing8),
                      _buildLineItem('IGV', v.igvMonto!, false),
                    ],
                    const SizedBox(height: AeroTheme.spacing8),
                    const Divider(color: AeroTheme.grey300),
                    const SizedBox(height: AeroTheme.spacing8),
                    _buildLineItem('TOTAL CON IGV', v.totalConIgv, true),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLineItem(String label, double amount, bool isTotal) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isTotal ? AeroTheme.primary900 : AeroTheme.grey700,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            fontSize: isTotal ? 14 : 12,
          ),
        ),
        Text(
          isTotal
              ? 'S/ ${amount.toStringAsFixed(2)}'
              : '- S/ ${amount.toStringAsFixed(2)}',
          style: TextStyle(
            color: isTotal && amount >= 0
                ? AeroTheme.primary900
                : AeroTheme.accent500,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
            fontSize: isTotal ? 14 : 12,
          ),
        ),
      ],
    );
  }
}
