import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/core/theme/aero_theme.dart';
import 'package:mobile/core/utils/image_compressor.dart';
import 'package:mobile/features/approvals/data/repositories/approvals_repository.dart';
import 'package:mobile/features/approvals/presentation/providers/approvals_provider.dart';

class AdHocApprovalFormScreen extends ConsumerStatefulWidget {
  const AdHocApprovalFormScreen({super.key});

  @override
  ConsumerState<AdHocApprovalFormScreen> createState() =>
      _AdHocApprovalFormScreenState();
}

class _AdHocApprovalFormScreenState
    extends ConsumerState<AdHocApprovalFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tituloController = TextEditingController();
  final _descripcionController = TextEditingController();
  final _approverSearchController = TextEditingController();
  final List<XFile> _attachments = [];
  final ImagePicker _picker = ImagePicker();

  // Selected approvers (id, name)
  final List<({int id, String name})> _selectedApprovers = [];

  // Search results from API
  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;
  bool _isSubmitting = false;
  Timer? _debounce;

  Future<void> _searchApprovers(String query) async {
    if (query.length < 2) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);

    try {
      final repo = ref.read(approvalsRepositoryProvider);
      final results = await repo.searchUsers(query);
      if (mounted) {
        setState(() {
          _searchResults = results
              .where((u) => !_selectedApprovers.any((s) => s.id == u['id']))
              .toList();
          _isSearching = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _searchResults = [];
          _isSearching = false;
        });
      }
    }
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      _searchApprovers(query);
    });
  }

  void _addApprover(Map<String, dynamic> user) {
    setState(() {
      _selectedApprovers.add((
        id: user['id'] as int,
        name: user['nombre_completo'] as String? ??
            user['username'] as String? ??
            'Usuario ${user['id']}',
      ));
      _searchResults = [];
      _approverSearchController.clear();
    });
  }

  void _removeApprover(int index) {
    setState(() {
      _selectedApprovers.removeAt(index);
    });
  }

  Future<void> _pickImage() async {
    if (_attachments.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Máximo 5 adjuntos permitidos.')),
      );
      return;
    }

    final XFile? image = await _picker.pickImage(source: ImageSource.camera);

    if (image != null) {
      final compressedFile = await ImageCompressor.compressFile(
        File(image.path),
      );
      if (compressedFile == null) return;

      setState(() {
        _attachments.add(XFile(compressedFile.path));
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

    if (_selectedApprovers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Debe seleccionar al menos un aprobador.'),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final repo = ref.read(approvalsRepositoryProvider);
      await repo.createAdhoc(
        titulo: _tituloController.text.trim(),
        descripcion: _descripcionController.text.trim(),
        aprobadores: _selectedApprovers.map((a) => a.id).toList(),
      );

      if (mounted) {
        // Refresh the enviados list
        ref.invalidate(enviadosListProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Solicitud creada exitosamente.')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al crear solicitud: ${e.toString().replaceAll('Exception: ', '')}'),
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _tituloController.dispose();
    _descripcionController.dispose();
    _approverSearchController.dispose();
    _debounce?.cancel();
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
                    // Approver search field
                    const Text(
                      'Aprobadores',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AeroTheme.primary900,
                      ),
                    ),
                    const SizedBox(height: AeroTheme.spacing8),
                    // Selected approvers chips
                    if (_selectedApprovers.isNotEmpty)
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: _selectedApprovers
                            .asMap()
                            .entries
                            .map(
                              (entry) => Chip(
                                label: Text(entry.value.name),
                                onDeleted: () => _removeApprover(entry.key),
                                backgroundColor: AeroTheme.primary100,
                                deleteIconColor: AeroTheme.primary500,
                              ),
                            )
                            .toList(),
                      ),
                    const SizedBox(height: AeroTheme.spacing8),
                    TextField(
                      controller: _approverSearchController,
                      decoration: InputDecoration(
                        hintText: 'Buscar por nombre...',
                        prefixIcon: const Icon(Icons.search),
                        suffixIcon: _isSearching
                            ? const Padding(
                                padding: EdgeInsets.all(12),
                                child: SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                ),
                              )
                            : null,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(
                            AeroTheme.radiusMd,
                          ),
                        ),
                      ),
                      onChanged: _onSearchChanged,
                    ),
                    // Search results dropdown
                    if (_searchResults.isNotEmpty)
                      Container(
                        constraints: const BoxConstraints(maxHeight: 200),
                        margin: const EdgeInsets.only(top: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(
                            AeroTheme.radiusMd,
                          ),
                          border: Border.all(color: AeroTheme.grey300),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.08),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: ListView.separated(
                          shrinkWrap: true,
                          itemCount: _searchResults.length,
                          separatorBuilder: (_, __) =>
                              const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final user = _searchResults[index];
                            final name = user['nombre_completo'] as String? ??
                                user['username'] as String? ??
                                '';
                            final role = user['rol'] as String? ?? '';
                            return ListTile(
                              dense: true,
                              title: Text(name),
                              subtitle: role.isNotEmpty ? Text(role) : null,
                              onTap: () => _addApprover(user),
                            );
                          },
                        ),
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
