import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import '../../domain/models/vale_combustible_model.dart';

class ValeDetailScreen extends StatelessWidget {
  final ValeCombustibleModel vale;

  const ValeDetailScreen({super.key, required this.vale});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: Text('Vale #${vale.numeroVale}'),
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
            _buildDetailsCard(context),
            if (vale.fotoPath != null && vale.fotoPath!.isNotEmpty) ...[
              const SizedBox(height: AeroTheme.spacing16),
              _buildPhotoCard(context),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCard(BuildContext context) {
    final isVinculado = vale.estado == 'VINCULADO';
    final statusColor = isVinculado
        ? AeroTheme.semanticGreen500
        : AeroTheme.semanticBlue500;
    final statusText = isVinculado ? 'Vinculado' : 'No Vinculado';

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
                  'Vale #${vale.numeroVale}',
                  style: const TextStyle(
                    fontFamily: AeroTheme.headingFont,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AeroTheme.primary900,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                  border: Border.all(color: statusColor),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isVinculado ? Icons.link : Icons.link_off,
                      size: 14,
                      color: statusColor,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      statusText,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AeroTheme.spacing16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AeroTheme.spacing16),
            decoration: BoxDecoration(
              color: AeroTheme.primary500.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
            ),
            child: Column(
              children: [
                Text(
                  '${vale.cantidadGalones}',
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    color: AeroTheme.primary500,
                  ),
                ),
                Text(
                  'Galones de ${vale.tipoCombustible}',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AeroTheme.grey700,
                  ),
                ),
              ],
            ),
          ),
          if (vale.syncStatus == 'PENDING_SYNC') ...[
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

  Widget _buildDetailsCard(BuildContext context) {
    final dateFormat = DateFormat('dd MMM yyyy, HH:mm');

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
            'Detalles',
            style: TextStyle(
              fontFamily: AeroTheme.headingFont,
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          ),
          const SizedBox(height: AeroTheme.spacing16),
          _buildDetailRow('Equipo', vale.equipoId),
          const Divider(color: AeroTheme.grey200, height: 24),
          _buildDetailRow('Tipo Combustible', vale.tipoCombustible),
          const Divider(color: AeroTheme.grey200, height: 24),
          _buildDetailRow(
            'Cantidad',
            '${vale.cantidadGalones} galones',
          ),
          const Divider(color: AeroTheme.grey200, height: 24),
          _buildDetailRow(
            'Fecha',
            dateFormat.format(vale.fecha),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: AeroTheme.grey500,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AeroTheme.primary900,
          ),
        ),
      ],
    );
  }

  Widget _buildPhotoCard(BuildContext context) {
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
            'Foto del Vale',
            style: TextStyle(
              fontFamily: AeroTheme.headingFont,
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          ),
          const SizedBox(height: AeroTheme.spacing16),
          ClipRRect(
            borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
            child: GestureDetector(
              onTap: () => _showFullScreenPhoto(context),
              child: Image.file(
                File(vale.fotoPath!),
                fit: BoxFit.cover,
                width: double.infinity,
                height: 200,
                errorBuilder: (_, __, ___) => Container(
                  height: 200,
                  color: AeroTheme.grey100,
                  child: const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.broken_image, size: 48, color: AeroTheme.grey500),
                        SizedBox(height: 8),
                        Text(
                          'No se pudo cargar la imagen',
                          style: TextStyle(color: AeroTheme.grey500),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showFullScreenPhoto(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            title: Text('Vale #${vale.numeroVale}'),
          ),
          body: Center(
            child: InteractiveViewer(
              child: Image.file(
                File(vale.fotoPath!),
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const Icon(
                  Icons.broken_image,
                  size: 64,
                  color: Colors.white54,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
