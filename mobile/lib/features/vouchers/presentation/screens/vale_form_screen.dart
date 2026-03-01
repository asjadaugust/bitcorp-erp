import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/features/vouchers/presentation/providers/vale_form_provider.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:uuid/uuid.dart';

class ValeFormScreen extends ConsumerStatefulWidget {
  const ValeFormScreen({super.key});

  @override
  ConsumerState<ValeFormScreen> createState() => _ValeFormScreenState();
}

class _ValeFormScreenState extends ConsumerState<ValeFormScreen> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(valeFormProvider);

    return Scaffold(
      backgroundColor: AeroTheme.primary100,
      appBar: AppBar(
        title: const Text('Nuevo Vale'),
        backgroundColor: Colors.white,
        foregroundColor: AeroTheme.primary900,
        elevation: 1,
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildValeDetails(state),
              const SizedBox(height: 16),
              _buildPhotoSection(state),
              const SizedBox(height: 24),
              if (state.error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    state.error!,
                    style: const TextStyle(
                      color: AeroTheme.accent500,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ElevatedButton(
                onPressed: state.isSubmitting || !state.isValid
                    ? null
                    : () async {
                        final success = await ref
                            .read(valeFormProvider.notifier)
                            .submit();
                        if (success && mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Vale guardado localmente.'),
                            ),
                          );
                          context.pop();
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AeroTheme.primary500,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                  ),
                ),
                child: state.isSubmitting
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'Guardar Vale',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildValeDetails(valeState) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Detalles del Vale',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            decoration: InputDecoration(
              labelText: 'Número de Vale*',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
              ),
            ),
            onChanged: (val) =>
                ref.read(valeFormProvider.notifier).updateNumeroVale(val),
          ),
          const SizedBox(height: 24),
          TextFormField(
            decoration: InputDecoration(
              labelText: 'ID Equipo*',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
              ),
            ),
            onChanged: (val) =>
                ref.read(valeFormProvider.notifier).updateEquipo(val),
          ),
          const SizedBox(height: 24),
          DropdownButtonFormField<String>(
            decoration: InputDecoration(
              labelText: 'Tipo de Combustible*',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
              ),
            ),
            value: valeState.tipoCombustible,
            items: const [
              DropdownMenuItem(value: 'Diesel', child: Text('Diesel')),
              DropdownMenuItem(value: 'Gasolina', child: Text('Gasolina')),
            ],
            onChanged: (val) {
              if (val != null) {
                ref.read(valeFormProvider.notifier).updateTipoCombustible(val);
              }
            },
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  decoration: InputDecoration(
                    labelText: 'Galones*',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                    ),
                  ),
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  onChanged: (val) => ref
                      .read(valeFormProvider.notifier)
                      .updateCantidadGalones(val),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextFormField(
                  decoration: InputDecoration(
                    labelText: 'Precio Unitario',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                    ),
                    prefixText: '\$ ',
                  ),
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  onChanged: (val) => ref
                      .read(valeFormProvider.notifier)
                      .updatePrecioUnitario(val),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          TextFormField(
            decoration: InputDecoration(
              labelText: 'Notas (Opcional)',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
              ),
            ),
            maxLines: 2,
            onChanged: (val) =>
                ref.read(valeFormProvider.notifier).updateNotas(val),
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoSection(valeState) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Foto del Vale',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AeroTheme.primary900,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Requerido* para procesar la contabilidad.',
            style: TextStyle(color: AeroTheme.grey700),
          ),
          const SizedBox(height: 16),
          if (valeState.fotoPath.isNotEmpty)
            Stack(
              clipBehavior: Clip.none,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(AeroTheme.radiusSm),
                  child: Image.file(
                    File(valeState.fotoPath),
                    width: double.infinity,
                    height: 200,
                    fit: BoxFit.cover,
                  ),
                ),
                Positioned(
                  top: -8,
                  right: -8,
                  child: InkWell(
                    onTap: () => ref
                        .read(valeFormProvider.notifier)
                        .updateFotoPath(''), // Clear photo
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: AeroTheme.accent500,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.close,
                        size: 20,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            )
          else
            InkWell(
              onTap: _takePhoto,
              child: Container(
                width: double.infinity,
                height: 150,
                decoration: BoxDecoration(
                  color: AeroTheme.primary100,
                  borderRadius: BorderRadius.circular(AeroTheme.radiusMd),
                  border: Border.all(
                    color: AeroTheme.primary500,
                    style: BorderStyle.solid,
                  ),
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.camera_alt,
                      color: AeroTheme.primary500,
                      size: 48,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Tomar Foto',
                      style: TextStyle(
                        color: AeroTheme.primary500,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 70,
    );

    if (pickedFile != null) {
      final appDir = await getApplicationDocumentsDirectory();
      final fileName = 'vale_\${const Uuid().v4()}.jpg';
      final savedImage = await File(
        pickedFile.path,
      ).copy(path.join(appDir.path, fileName));

      ref.read(valeFormProvider.notifier).updateFotoPath(savedImage.path);
    }
  }
}
