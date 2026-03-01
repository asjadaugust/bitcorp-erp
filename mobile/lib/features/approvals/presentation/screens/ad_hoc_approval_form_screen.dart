import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/core/theme/aero_theme.dart';

class AdHocApprovalFormScreen extends StatefulWidget {
  const AdHocApprovalFormScreen({super.key});

  @override
  State<AdHocApprovalFormScreen> createState() =>
      _AdHocApprovalFormScreenState();
}

class _AdHocApprovalFormScreenState extends State<AdHocApprovalFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tituloController = TextEditingController();
  final _descripcionController = TextEditingController();
  final List<XFile> _attachments = [];
  final ImagePicker _picker = ImagePicker();

  // Mock approvers for the demo
  final List<String> _availableApprovers = [
    'Supervisor (Juan Perez)',
    'Residente de Obra (Ana Gomez)',
    'RRHH (Carlos Lopez)',
  ];
  String? _selectedApprover;
  bool _isSubmitting = false;

  Future<void> _pickImage() async {
    if (_attachments.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Máximo 5 adjuntos permitidos.')),
      );
      return;
    }

    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 70,
    );

    if (image != null) {
      setState(() {
        _attachments.add(image);
      });
    }
  }

  void _removeImage(int index) {
    setState(() {
      _attachments.removeAt(index);
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedApprover == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Debe seleccionar al menos un aprobador.'),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    // Simulate API delay for creating an ad-hoc request
    await Future.delayed(const Duration(seconds: 1));

    if (mounted) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Solicitud creada exitosamente.')),
      );
      context.pop(); // Returns to Hub
    }
  }

  @override
  void dispose() {
    _tituloController.dispose();
    _descripcionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: const Text('Nueva Solicitud Ad-Hoc')),
      body: _isSubmitting
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(AeroTheme.spacing16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _tituloController,
                      decoration: InputDecoration(
                        labelText: 'Título de la solicitud',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(
                            AeroTheme.radiusMd,
                          ),
                        ),
                      ),
                      validator: (val) =>
                          val == null || val.isEmpty ? 'Requerido' : null,
                    ),
                    const SizedBox(height: AeroTheme.spacing24),
                    TextFormField(
                      controller: _descripcionController,
                      maxLines: 4,
                      decoration: InputDecoration(
                        labelText: 'Descripción / Justificación',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(
                            AeroTheme.radiusMd,
                          ),
                        ),
                        alignLabelWithHint: true,
                      ),
                      validator: (val) =>
                          val == null || val.isEmpty ? 'Requerido' : null,
                    ),
                    const SizedBox(height: AeroTheme.spacing24),
                    DropdownButtonFormField<String>(
                      decoration: InputDecoration(
                        labelText: 'Enviar aprobación a:',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(
                            AeroTheme.radiusMd,
                          ),
                        ),
                      ),
                      value: _selectedApprover,
                      items: _availableApprovers.map((approver) {
                        return DropdownMenuItem(
                          value: approver,
                          child: Text(approver),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedApprover = val;
                        });
                      },
                      validator: (val) =>
                          val == null ? 'Seleccione un aprobador' : null,
                    ),
                    const SizedBox(height: AeroTheme.spacing32),
                    const Text(
                      'Adjuntos (Max 5)',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AeroTheme.primary900,
                      ),
                    ),
                    const SizedBox(height: AeroTheme.spacing8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        ..._attachments.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final file = entry.value;
                          return Stack(
                            children: [
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(
                                    AeroTheme.radiusSm,
                                  ),
                                  border: Border.all(color: AeroTheme.grey300),
                                  image: DecorationImage(
                                    image: FileImage(File(file.path)),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              Positioned(
                                right: -4,
                                top: -4,
                                child: IconButton(
                                  icon: const Icon(
                                    Icons.cancel,
                                    color: AeroTheme.accent500,
                                  ),
                                  onPressed: () => _removeImage(idx),
                                  constraints: const BoxConstraints(),
                                  padding: EdgeInsets.zero,
                                ),
                              ),
                            ],
                          );
                        }),
                        if (_attachments.length < 5)
                          InkWell(
                            onTap: _pickImage,
                            child: Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: AeroTheme.grey100,
                                borderRadius: BorderRadius.circular(
                                  AeroTheme.radiusSm,
                                ),
                                border: Border.all(
                                  color: AeroTheme.grey300,
                                  style: BorderStyle.solid,
                                ),
                              ),
                              child: const Icon(
                                Icons.add_a_photo,
                                color: AeroTheme.grey500,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: AeroTheme.spacing32),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AeroTheme.primary500,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      onPressed: _submit,
                      child: const Text(
                        'Enviar Solicitud',
                        style: TextStyle(color: Colors.white, fontSize: 16),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
