import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/features/valorizations/domain/models/valorization_model.dart';
import 'package:mobile/features/valorizations/presentation/providers/valorizations_provider.dart';
import 'package:mobile/core/widgets/global_search_delegate.dart';

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
              showSearch(context: context, delegate: GlobalSearchDelegate());
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AeroTheme.primary500,
        backgroundColor: Colors.white,
        onRefresh: () => ref.read(valorizationsProvider.notifier).refresh(),
        child: state.when(
          data: (list) {
            if (list.isEmpty) {
              return _buildEmptyState(context);
            }
            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(AeroTheme.spacing16),
              itemCount: list.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: AeroTheme.spacing16),
              itemBuilder: (context, index) {
                return _ValorizationCard(valorization: list[index]);
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, st) => _buildErrorState(context, e.toString()),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.request_quote_outlined,
              size: 64,
              color: AeroTheme.grey500,
            ),
            const SizedBox(height: 24),
            Text(
              'No hay valorizaciones',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: AeroTheme.primary900,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Aún no hay registros de pago para este proyecto.',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AeroTheme.grey700),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: AeroTheme.accent500),
          const SizedBox(height: AeroTheme.spacing16),
          Text(message, style: const TextStyle(color: AeroTheme.accent500)),
        ],
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
    String formatCurrency(double val) => 'S/ \${val.toStringAsFixed(2)}';

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
                      formatCurrency(v.montoNeto),
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
                      ? const Color(0xFF00C853).withOpacity(0.1)
                      : Colors.orange.shade700.withOpacity(0.1),
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
                    _buildLineItem('Monto Bruto', v.montoBruto, true),
                    const SizedBox(height: AeroTheme.spacing8),
                    const Divider(color: AeroTheme.grey300),
                    const SizedBox(height: AeroTheme.spacing8),
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Deducciones',
                        style: TextStyle(
                          color: AeroTheme.grey500,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: AeroTheme.spacing8),
                    ...v.deducciones.entries
                        .map(
                          (e) => Padding(
                            padding: const EdgeInsets.only(bottom: 4.0),
                            child: _buildLineItem(
                              e.key.toUpperCase(),
                              e.value,
                              false,
                            ),
                          ),
                        )
                        .toList(),
                    const SizedBox(height: AeroTheme.spacing8),
                    const Divider(color: AeroTheme.grey300),
                    const SizedBox(height: AeroTheme.spacing8),
                    _buildLineItem('MONTO TOTAL NETA', v.montoNeto, true),
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
              ? 'S/ \${amount.toStringAsFixed(2)}'
              : '- S/ \${amount.toStringAsFixed(2)}',
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
