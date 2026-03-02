import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:uuid/uuid.dart';
import 'package:mobile/core/utils/image_compressor.dart';

import '../../../../core/theme/aero_theme.dart';
import '../../../../core/widgets/discard_changes_dialog.dart';
import '../providers/incidente_form_provider.dart';

class IncidenteFormScreen extends ConsumerStatefulWidget {
  const IncidenteFormScreen({super.key});

  @override
  ConsumerState<IncidenteFormScreen> createState() =>
      _IncidenteFormScreenState();
}

class _IncidenteFormScreenState extends ConsumerState<IncidenteFormScreen> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(incidenteFormProvider);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final shouldDiscard = await showDiscardChangesDialog(context);
        if (shouldDiscard && context.mounted) {
          context.pop();
        }
      },
      child: Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: const Text(
          'Reportar Inoperatividad',
          style: TextStyle(
            color: AeroTheme.primary900,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AeroTheme.white,
        centerTitle: false,
        elevation: 1,
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildGeneralInfo(state),
              const SizedBox(height: 16),
              _buildDetailsForm(state),
              const SizedBox(height: 16),
              _buildPhotosSection(state),
              const SizedBox(height: 24),
              if (state.errorText != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    state.errorText!,
                    style: const TextStyle(
                      color: AeroTheme.accent500,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              _buildSubmitButton(state),
            ],
          ),
        ),
      ),
    ));
  }

  Widget _buildGeneralInfo(IncidenteFormState state) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AeroTheme.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Información General',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            initialValue: state.equipmentId.isNotEmpty
                ? state.equipmentId
                : 'No Especificado',
            decoration: const InputDecoration(
              labelText: 'Equipo Afectado',
              border: OutlineInputBorder(),
            ),
            enabled: false,
          ),
        ],
      ),
    );
  }

  Widget _buildDetailsForm(IncidenteFormState state) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AeroTheme.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Detalles de Falla',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: InputDecoration(
              labelText: 'Descripción de la Falla*',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
              ),
              focusedBorder: OutlineInputBorder(
                borderSide: const BorderSide(color: AeroTheme.primary500),
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
              ),
            ),
            maxLines: 4,
            onChanged: (val) =>
                ref.read(incidenteFormProvider.notifier).updateDescripcion(val),
          ),
          const SizedBox(height: 24),
          DropdownButtonFormField<String>(
            decoration: InputDecoration(
              labelText: 'Severidad',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
              ),
            ),
            value: state.severidad,
            items: const [
              DropdownMenuItem(
                value: 'MINOR',
                child: Text('Menor (Puede Operar)'),
              ),
              DropdownMenuItem(
                value: 'MAJOR',
                child: Text('Mayor (Operativo con Restricciones)'),
              ),
              DropdownMenuItem(
                value: 'CRITICAL',
                child: Text('Crítica (INOPERATIVO - Stand-by)'),
              ),
            ],
            onChanged: (val) {
              if (val != null) {
                ref.read(incidenteFormProvider.notifier).updateSeveridad(val);
              }
            },
          ),
          const SizedBox(height: 24),
          TextFormField(
            decoration: InputDecoration(
              labelText: 'Horas Estimadas de Reparación (Opcional)',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
              ),
              suffixText: 'hrs',
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            onChanged: (val) => ref
                .read(incidenteFormProvider.notifier)
                .updateHorasEstimadas(val),
          ),
        ],
      ),
    );
  }

  Widget _buildPhotosSection(IncidenteFormState state) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AeroTheme.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Evidencia Fotográfica',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Máximo 5 fotos (${state.rutasFotos.length}/5)',
            style: const TextStyle(color: AeroTheme.grey700),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              ...state.rutasFotos.map((path) => _buildPhotoThumbnail(path)),
              if (state.rutasFotos.length < 5)
                InkWell(
                  onTap: _takePhoto,
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AeroTheme.primary100,
                      borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                      border: Border.all(
                        color: AeroTheme.primary500,
                        style: BorderStyle.solid,
                      ),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.camera_alt,
                        color: AeroTheme.primary500,
                        size: 32,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoThumbnail(String filePath) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
          child: Image.file(
            File(filePath),
            width: 80,
            height: 80,
            fit: BoxFit.cover,
          ),
        ),
        Positioned(
          top: -8,
          right: -8,
          child: InkWell(
            onTap: () =>
                ref.read(incidenteFormProvider.notifier).removeFoto(filePath),
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: const BoxDecoration(
                color: AeroTheme.accent500,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, size: 16, color: AeroTheme.white),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.camera);

    if (pickedFile != null) {
      final compressedFile = await ImageCompressor.compressFile(
        File(pickedFile.path),
      );
      if (compressedFile == null) return;

      final appDir = await getApplicationDocumentsDirectory();
      final fileName = '${const Uuid().v4()}.jpg';
      final savedImage = await compressedFile.copy(
        path.join(appDir.path, fileName),
      );

      if (await compressedFile.exists()) {
        await compressedFile.delete();
      }

      ref.read(incidenteFormProvider.notifier).addFoto(savedImage.path);
    }
  }

  Widget _buildSubmitButton(IncidenteFormState state) {
    return ElevatedButton(
      onPressed: state.isSubmitting
          ? null
          : () async {
              final success = await ref
                  .read(incidenteFormProvider.notifier)
                  .saveIncidente();
              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Incidente reportado offline.')),
                );
                // Return to Dashboard or Checklists?
                // Probably to Checklists list so they know it's pending.
                context.go('/checklists');
              }
            },
      style: ElevatedButton.styleFrom(
        backgroundColor: AeroTheme.accent500,
        foregroundColor: AeroTheme.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
        ),
      ),
      child: state.isSubmitting
          ? const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                color: AeroTheme.white,
                strokeWidth: 2,
              ),
            )
          : const Text(
              'Enviar Reporte',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
    );
  }
}
