import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:uuid/uuid.dart';
import 'package:mobile/core/utils/image_compressor.dart';

import '../../../../core/theme/aero_theme.dart';
import '../../../../core/widgets/discard_changes_dialog.dart';
import '../providers/checklist_form_provider.dart';

class ChecklistFormScreen extends ConsumerStatefulWidget {
  const ChecklistFormScreen({super.key});

  @override
  ConsumerState<ChecklistFormScreen> createState() =>
      _ChecklistFormScreenState();
}

class _ChecklistFormScreenState extends ConsumerState<ChecklistFormScreen> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(checklistFormProvider);

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
          'Nuevo Checklist',
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
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildHeaderCard(state),
              if (state.equipmentId != null) ...[
                const SizedBox(height: 16),
                _buildInspectionList(state),
                const SizedBox(height: 16),
                _buildInoperabilitySection(state),
                const SizedBox(height: 24),
                if (state.errorText != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
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
            ],
          ),
        ),
      ),
    ));
  }

  Widget _buildHeaderCard(ChecklistFormState state) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AeroTheme.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
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
            initialValue: DateFormat(
              'dd MMM yyyy',
            ).format(DateTime.parse(state.date)),
            decoration: const InputDecoration(
              labelText: 'Fecha',
              border: OutlineInputBorder(),
            ),
            enabled: false,
          ),
          const SizedBox(height: 24),
          DropdownButtonFormField<String>(
            decoration: InputDecoration(
              labelText: 'Equipo a Inspeccionar',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                borderSide: const BorderSide(color: AeroTheme.grey300),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                borderSide: const BorderSide(color: AeroTheme.primary500),
              ),
            ),
            value: state.equipmentId,
            items: const [
              DropdownMenuItem(
                value: 'EXC-001',
                child: Text('EXC-001 (Excavadora)'),
              ),
              DropdownMenuItem(
                value: 'CAR-002',
                child: Text('CAR-002 (Cargador)'),
              ),
              DropdownMenuItem(
                value: 'CAM-003',
                child: Text('CAM-003 (Camioneta)'),
              ),
            ],
            onChanged: (val) {
              if (val != null) {
                ref.read(checklistFormProvider.notifier).setEquipment(val);
              }
            },
          ),
          if (state.equipmentId != null) ...[
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AeroTheme.primary100,
                borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
              ),
              child: Text(
                'Tipo de Checklist: ${state.checklistType == 'DAILY' ? 'Diario' : 'Semanal'}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AeroTheme.primary900,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInspectionList(ChecklistFormState state) {
    if (state.items.isEmpty) return const SizedBox.shrink();

    // Group items by category
    final grouped = <String, List<dynamic>>{};
    for (var item in state.items) {
      if (!grouped.containsKey(item.categoria)) {
        grouped[item.categoria] = [];
      }
      grouped[item.categoria]!.add(item);
    }

    final children = <Widget>[];

    grouped.forEach((category, items) {
      children.add(
        Padding(
          padding: const EdgeInsets.only(top: 24, bottom: 8),
          child: Text(
            category,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          ),
        ),
      );

      for (var item in items) {
        children.add(_buildInspectionItem(item));
        children.add(const SizedBox(height: 12));
      }
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: children,
    );
  }

  Widget _buildInspectionItem(dynamic item) {
    final bool isFail = item.aprobado == false;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AeroTheme.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        border: Border.all(
          color: isFail ? AeroTheme.accent500 : AeroTheme.grey300,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Text(
                  item.nombreItem,
                  style: const TextStyle(
                    fontWeight: FontWeight.w500,
                    color: AeroTheme.primary900,
                  ),
                ),
              ),
              _buildToggles(item),
            ],
          ),
          if (isFail) ...[
            const SizedBox(height: 16),
            TextFormField(
              initialValue: item.comentario,
              decoration: InputDecoration(
                labelText: 'Comentario Obligatorio*',
                labelStyle: const TextStyle(color: AeroTheme.accent500),
                focusedBorder: OutlineInputBorder(
                  borderSide: const BorderSide(color: AeroTheme.accent500),
                  borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                ),
                enabledBorder: OutlineInputBorder(
                  borderSide: const BorderSide(color: AeroTheme.accent500),
                  borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                ),
              ),
              maxLines: 2,
              onChanged: (val) {
                ref
                    .read(checklistFormProvider.notifier)
                    .updateItemComment(item.id, val);
              },
            ),
            const SizedBox(height: 12),
            if (item.rutaFoto == null)
              OutlinedButton.icon(
                onPressed: () => _attachPhotoForItem(item.id),
                icon: const Icon(Icons.camera_alt, color: AeroTheme.primary500),
                label: const Text(
                  'Adjuntar Evidencia',
                  style: TextStyle(color: AeroTheme.primary500),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AeroTheme.primary500),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                  ),
                ),
              )
            else
              Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                    child: Image.file(
                      File(item.rutaFoto!),
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 8),
                  TextButton.icon(
                    onPressed: () => ref
                        .read(checklistFormProvider.notifier)
                        .updateItemPhoto(item.id, ''),
                    icon: const Icon(
                      Icons.delete,
                      color: AeroTheme.accent500,
                      size: 18,
                    ),
                    label: const Text(
                      'Eliminar',
                      style: TextStyle(color: AeroTheme.accent500),
                    ),
                  ),
                ],
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildToggles(dynamic item) {
    return Row(
      children: [
        InkWell(
          onTap: () => ref
              .read(checklistFormProvider.notifier)
              .updateItemStatus(item.id, true),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: item.aprobado == true
                  ? AeroTheme.semanticBlue500
                  : AeroTheme.grey100,
              borderRadius: const BorderRadius.horizontal(
                left: Radius.circular(AeroTheme.radiusSm),
              ),
              border: Border.all(
                color: item.aprobado == true
                    ? AeroTheme.semanticBlue500
                    : AeroTheme.grey300,
              ),
            ),
            child: Icon(
              Icons.check,
              size: 20,
              color: item.aprobado == true
                  ? AeroTheme.white
                  : AeroTheme.grey500,
            ),
          ),
        ),
        InkWell(
          onTap: () => ref
              .read(checklistFormProvider.notifier)
              .updateItemStatus(item.id, false),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: item.aprobado == false
                  ? AeroTheme.accent500
                  : AeroTheme.grey100,
              borderRadius: const BorderRadius.horizontal(
                right: Radius.circular(AeroTheme.radiusSm),
              ),
              border: Border.all(
                color: item.aprobado == false
                    ? AeroTheme.accent500
                    : AeroTheme.grey300,
              ),
            ),
            child: Icon(
              Icons.close,
              size: 20,
              color: item.aprobado == false
                  ? AeroTheme.white
                  : AeroTheme.grey500,
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _attachPhotoForItem(String itemId) async {
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

      ref
          .read(checklistFormProvider.notifier)
          .updateItemPhoto(itemId, savedImage.path);
    }
  }

  Widget _buildInoperabilitySection(ChecklistFormState state) {
    final hasCritical = ref
        .read(checklistFormProvider.notifier)
        .hasCriticalFailures;

    if (!hasCritical) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AeroTheme.accent500.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
        border: Border.all(color: AeroTheme.accent500),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: AeroTheme.accent500),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Falla Crítica Detectada',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AeroTheme.accent500,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Para reportar el equipo en estado inoperativo y notificar al responsable mecánico, presione el siguiente botón.',
            style: TextStyle(color: AeroTheme.grey700),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              // Route to incident form
              context.push('/checklists/incidente');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AeroTheme.accent500,
              foregroundColor: AeroTheme.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
              ),
            ),
            child: const Text('Reportar Inoperatividad (Stand-By)'),
          ),
        ],
      ),
    );
  }

  Widget _buildSubmitButton(ChecklistFormState state) {
    return ElevatedButton(
      onPressed: state.isSubmitting
          ? null
          : () async {
              final success = await ref
                  .read(checklistFormProvider.notifier)
                  .saveChecklist();
              if (success && mounted) {
                HapticFeedback.mediumImpact();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Guardado offline. Se sincronizará al conectar.',
                    ),
                  ),
                );
                context.pop();
              }
            },
      style: ElevatedButton.styleFrom(
        backgroundColor: AeroTheme.primary500,
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
              'Guardar y Enviar Checklist',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
    );
  }
}
