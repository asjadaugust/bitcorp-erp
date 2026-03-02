import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/features/equipment/domain/models/equipment_detail_model.dart';
import 'package:mobile/features/equipment/presentation/providers/equipment_detail_provider.dart';

class EquipmentDetailScreen extends ConsumerWidget {
  final String id;

  const EquipmentDetailScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(equipmentDetailProvider(id));

    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(title: const Text('Detalle de Equipo')),
      body: state.when(
        data: (equipment) {
          return RefreshIndicator(
            onRefresh: () async =>
                ref.refresh(equipmentDetailProvider(id).future),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(AeroTheme.spacing16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _SpecsCard(equipment: equipment),
                  const SizedBox(height: AeroTheme.spacing24),
                  const Text(
                    'Documentación y Cumplimiento',
                    style: TextStyle(
                      fontFamily: AeroTheme.headingFont,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AeroTheme.primary900,
                    ),
                  ),
                  const SizedBox(height: AeroTheme.spacing8),
                  _DocumentComplianceSection(documents: equipment.documentos),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

class _SpecsCard extends StatelessWidget {
  final EquipmentDetailModel equipment;

  const _SpecsCard({required this.equipment});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        border: Border.all(color: AeroTheme.grey300),
      ),
      padding: const EdgeInsets.all(AeroTheme.spacing24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AeroTheme.primary100,
                  borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                ),
                child: const Icon(
                  Icons.directions_car,
                  color: AeroTheme.primary500,
                  size: 32,
                ),
              ),
              const SizedBox(width: AeroTheme.spacing16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      equipment.codigoEquipo,
                      style: const TextStyle(
                        fontFamily: AeroTheme.headingFont,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AeroTheme.primary900,
                      ),
                    ),
                    Text(
                      equipment.descripcion,
                      style: const TextStyle(
                        color: AeroTheme.grey700,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AeroTheme.spacing24),
          const Divider(),
          const SizedBox(height: AeroTheme.spacing16),
          _buildSpecRow('Marca', equipment.marca, 'Modelo', equipment.modelo),
          const SizedBox(height: AeroTheme.spacing16),
          _buildSpecRow(
            'Año',
            (equipment.anioFabricacion ?? 0).toString(),
            'Placa',
            equipment.placa ?? '-',
          ),
          if (equipment.tipoEquipoNombre != null) ...[
            const SizedBox(height: AeroTheme.spacing16),
            _buildSpecRow(
              'Tipo',
              equipment.tipoEquipoNombre!,
              'Estado',
              equipment.estado ?? '-',
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSpecRow(String label1, String val1, String label2, String val2) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label1,
                style: const TextStyle(color: AeroTheme.grey500, fontSize: 12),
              ),
              Text(
                val1,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AeroTheme.primary900,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label2,
                style: const TextStyle(color: AeroTheme.grey500, fontSize: 12),
              ),
              Text(
                val2,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AeroTheme.primary900,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DocumentComplianceSection extends StatelessWidget {
  final List<DocumentComplianceModel> documents;

  const _DocumentComplianceSection({required this.documents});

  @override
  Widget build(BuildContext context) {
    if (documents.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16.0),
        child: Text('No hay documentos registrados.'),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        border: Border.all(color: AeroTheme.grey300),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: documents.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final doc = documents[index];
          Color badgeColor;
          String badgeText;
          IconData icon;

          if (doc.estado == 'EXPIRED') {
            badgeColor = AeroTheme.accent500;
            badgeText = 'Vencido';
            icon = Icons.cancel;
          } else if (doc.estado == 'WARNING') {
            badgeColor = Colors.orange.shade700;
            badgeText = 'Por vencer';
            icon = Icons.warning;
          } else {
            badgeColor = const Color(0xFF00C853);
            badgeText = 'Vigente';
            icon = Icons.check_circle;
          }

          return ListTile(
            leading: Icon(Icons.description, color: AeroTheme.grey500),
            title: Text(
              doc.tipo,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text('Vence: ${doc.fechaVencimiento}'),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: badgeColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                border: Border.all(color: badgeColor),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 12, color: badgeColor),
                  const SizedBox(width: 4),
                  Text(
                    badgeText,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: badgeColor,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
