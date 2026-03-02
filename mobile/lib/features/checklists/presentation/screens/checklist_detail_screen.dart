import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import '../../domain/models/checklist_model.dart';
import '../../domain/models/checklist_item_model.dart';

class ChecklistDetailScreen extends StatelessWidget {
  final ChecklistModel checklist;

  const ChecklistDetailScreen({super.key, required this.checklist});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: Text(
          checklist.tipo == 'DAILY' ? 'Checklist Diario' : 'Checklist Semanal',
        ),
        backgroundColor: Colors.white,
        foregroundColor: AeroTheme.primary900,
        elevation: 1,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AeroTheme.spacing16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildSummaryCard(context),
            if (checklist.items != null && checklist.items!.isNotEmpty) ...[
              const SizedBox(height: AeroTheme.spacing16),
              _buildItemsSection(context),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCard(BuildContext context) {
    final passCount = checklist.items?.where((i) => i.aprobado == true).length ?? 0;
    final failCount = checklist.items?.where((i) => i.aprobado == false).length ?? 0;
    final totalCount = checklist.items?.length ?? 0;

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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      checklist.idEquipo,
                      style: const TextStyle(
                        fontFamily: AeroTheme.headingFont,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AeroTheme.primary900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      checklist.tipo == 'DAILY'
                          ? 'Inspección Diaria'
                          : 'Inspección Semanal',
                      style: const TextStyle(
                        fontSize: 14,
                        color: AeroTheme.grey500,
                      ),
                    ),
                  ],
                ),
              ),
              _buildStatusBadge(),
            ],
          ),
          const SizedBox(height: AeroTheme.spacing16),
          const Divider(color: AeroTheme.grey300),
          const SizedBox(height: AeroTheme.spacing16),
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 16, color: AeroTheme.grey500),
              const SizedBox(width: 8),
              Text(
                _formatDate(checklist.fecha),
                style: const TextStyle(
                  fontSize: 14,
                  color: AeroTheme.grey700,
                ),
              ),
            ],
          ),
          if (totalCount > 0) ...[
            const SizedBox(height: AeroTheme.spacing16),
            Row(
              children: [
                _buildCountChip(
                  Icons.check_circle_outline,
                  '$passCount aprobados',
                  AeroTheme.semanticBlue500,
                ),
                const SizedBox(width: 12),
                _buildCountChip(
                  Icons.cancel_outlined,
                  '$failCount con fallas',
                  AeroTheme.accent500,
                ),
                const SizedBox(width: 12),
                _buildCountChip(
                  Icons.list,
                  '$totalCount total',
                  AeroTheme.grey700,
                ),
              ],
            ),
          ],
          if (checklist.estadoSincronizacion == 'PENDING_SYNC') ...[
            const SizedBox(height: AeroTheme.spacing16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AeroTheme.grey200,
                borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.cloud_upload_outlined,
                      size: 14, color: AeroTheme.grey700),
                  SizedBox(width: 4),
                  Text(
                    'Pendiente de Sincronización',
                    style: TextStyle(fontSize: 12, color: AeroTheme.grey700),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCountChip(IconData icon, String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  Widget _buildItemsSection(BuildContext context) {
    // Group items by category
    final grouped = <String, List<ChecklistItemModel>>{};
    for (final item in checklist.items!) {
      grouped.putIfAbsent(item.categoria, () => []).add(item);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Ítems de Inspección',
          style: TextStyle(
            fontFamily: AeroTheme.headingFont,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AeroTheme.primary900,
          ),
        ),
        const SizedBox(height: AeroTheme.spacing8),
        ...grouped.entries.map((entry) {
          return _buildCategoryGroup(entry.key, entry.value);
        }),
      ],
    );
  }

  Widget _buildCategoryGroup(String category, List<ChecklistItemModel> items) {
    return Container(
      margin: const EdgeInsets.only(bottom: AeroTheme.spacing16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        border: Border.all(color: AeroTheme.grey300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(
              horizontal: AeroTheme.spacing16,
              vertical: 12,
            ),
            decoration: BoxDecoration(
              color: AeroTheme.primary500.withValues(alpha: 0.05),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(AeroTheme.radiusMd),
                topRight: Radius.circular(AeroTheme.radiusMd),
              ),
            ),
            child: Text(
              category,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: AeroTheme.primary900,
              ),
            ),
          ),
          ...items.map((item) => _buildChecklistItem(item)),
        ],
      ),
    );
  }

  Widget _buildChecklistItem(ChecklistItemModel item) {
    IconData icon;
    Color iconColor;

    if (item.aprobado == true) {
      icon = Icons.check_circle;
      iconColor = AeroTheme.semanticBlue500;
    } else if (item.aprobado == false) {
      icon = Icons.cancel;
      iconColor = AeroTheme.accent500;
    } else {
      icon = Icons.radio_button_unchecked;
      iconColor = AeroTheme.grey500;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AeroTheme.spacing16,
        vertical: 12,
      ),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AeroTheme.grey200),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: iconColor),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  item.nombreItem,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AeroTheme.primary900,
                  ),
                ),
              ),
            ],
          ),
          if (item.comentario != null && item.comentario!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Padding(
              padding: const EdgeInsets.only(left: 32),
              child: Text(
                item.comentario!,
                style: const TextStyle(
                  fontSize: 12,
                  color: AeroTheme.grey700,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusBadge() {
    Color bgColor;
    Color textColor;
    String text;

    if (checklist.estado == 'PASS') {
      bgColor = AeroTheme.semanticBlue100;
      textColor = AeroTheme.semanticBlue500;
      text = 'Aprobado';
    } else if (checklist.estado == 'FAIL') {
      bgColor = AeroTheme.accent500.withValues(alpha: 0.1);
      textColor = AeroTheme.accent500;
      text = 'Con Fallas';
    } else {
      bgColor = AeroTheme.grey200;
      textColor = AeroTheme.grey700;
      text = 'Borrador';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  String _formatDate(String isoString) {
    try {
      final date = DateTime.parse(isoString);
      return DateFormat('dd MMM yyyy, HH:mm').format(date);
    } catch (e) {
      return isoString;
    }
  }
}
