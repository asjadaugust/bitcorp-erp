import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import '../../domain/models/daily_report_model.dart';

class DailyReportDetailScreen extends StatelessWidget {
  final DailyReportModel report;

  const DailyReportDetailScreen({super.key, required this.report});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: Text(report.codigo ?? 'Reporte Diario'),
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
            const SizedBox(height: AeroTheme.spacing16),
            _buildHoursCard(context),
            if (report.activityDescription.isNotEmpty) ...[
              const SizedBox(height: AeroTheme.spacing16),
              _buildActivityCard(context),
            ],
            if (report.events.isNotEmpty) ...[
              const SizedBox(height: AeroTheme.spacing16),
              _buildEventsCard(context),
            ],
            if (report.observations != null &&
                report.observations!.isNotEmpty) ...[
              const SizedBox(height: AeroTheme.spacing16),
              _buildObservationsCard(context),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCard(BuildContext context) {
    final status = report.estado ?? report.syncStatus;

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
                child: Text(
                  report.equipoCodigo ?? 'Equipo ${report.equipmentId}',
                  style: const TextStyle(
                    fontFamily: AeroTheme.headingFont,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AeroTheme.primary900,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              _buildStatusBadge(status),
            ],
          ),
          const SizedBox(height: AeroTheme.spacing16),
          _buildInfoRow(Icons.calendar_today, 'Fecha', _formatDate(report.date)),
          const SizedBox(height: AeroTheme.spacing8),
          _buildInfoRow(
            Icons.timer,
            'Horas Efectivas',
            '${report.effectiveHours.toStringAsFixed(1)} hrs',
          ),
        ],
      ),
    );
  }

  Widget _buildHoursCard(BuildContext context) {
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
          const Text(
            'Lecturas de Horómetro',
            style: TextStyle(
              fontFamily: AeroTheme.headingFont,
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          ),
          const SizedBox(height: AeroTheme.spacing16),
          Row(
            children: [
              Expanded(
                child: _buildMeterValue(
                  'Inicio',
                  report.startHourMeter.toStringAsFixed(1),
                ),
              ),
              Container(
                width: 1,
                height: 40,
                color: AeroTheme.grey300,
              ),
              Expanded(
                child: _buildMeterValue(
                  'Final',
                  report.endHourMeter.toStringAsFixed(1),
                ),
              ),
            ],
          ),
          if (report.startOdometer != null || report.endOdometer != null) ...[
            const Divider(height: 32),
            const Text(
              'Odómetro',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AeroTheme.primary900,
              ),
            ),
            const SizedBox(height: AeroTheme.spacing8),
            Row(
              children: [
                Expanded(
                  child: _buildMeterValue(
                    'Inicio',
                    report.startOdometer?.toStringAsFixed(1) ?? '-',
                  ),
                ),
                Container(
                  width: 1,
                  height: 40,
                  color: AeroTheme.grey300,
                ),
                Expanded(
                  child: _buildMeterValue(
                    'Final',
                    report.endOdometer?.toStringAsFixed(1) ?? '-',
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMeterValue(String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AeroTheme.grey500,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AeroTheme.primary500,
          ),
        ),
      ],
    );
  }

  Widget _buildActivityCard(BuildContext context) {
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
          const Text(
            'Actividad Realizada',
            style: TextStyle(
              fontFamily: AeroTheme.headingFont,
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          ),
          const SizedBox(height: AeroTheme.spacing8),
          Text(
            report.activityDescription,
            style: const TextStyle(
              color: AeroTheme.grey700,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEventsCard(BuildContext context) {
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
          Text(
            'Eventos (${report.events.length})',
            style: const TextStyle(
              fontFamily: AeroTheme.headingFont,
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          ),
          const SizedBox(height: AeroTheme.spacing16),
          ...report.events.map((event) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AeroTheme.primary500.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                    ),
                    child: const Icon(
                      Icons.flag_outlined,
                      size: 16,
                      color: AeroTheme.primary500,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          event.eventType,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AeroTheme.primary900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${event.startTime} - ${event.endTime} (${event.duration.toStringAsFixed(1)} hrs)',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AeroTheme.grey500,
                          ),
                        ),
                        if (event.reason.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            event.reason,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AeroTheme.grey700,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildObservationsCard(BuildContext context) {
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
          const Text(
            'Observaciones',
            style: TextStyle(
              fontFamily: AeroTheme.headingFont,
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          ),
          const SizedBox(height: AeroTheme.spacing8),
          Text(
            report.observations!,
            style: const TextStyle(
              color: AeroTheme.grey700,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AeroTheme.grey500),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(
            fontSize: 14,
            color: AeroTheme.grey500,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AeroTheme.primary900,
            ),
          ),
        ),
      ],
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
        bgColor = const Color(0xFFFDE8E8);
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
