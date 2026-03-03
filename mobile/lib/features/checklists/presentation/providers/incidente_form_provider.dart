import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

import '../../data/repositories/checklist_repository.dart';
import '../../domain/models/incidente_model.dart';
import 'checklist_form_provider.dart';

part 'incidente_form_provider.g.dart';

class IncidenteFormState {
  final String equipmentId;
  final String? checklistId;
  final String descripcion;
  final String severidad; // 'MINOR', 'MAJOR', 'CRITICAL'
  final String? horasEstimadas; // Text input, parsed later
  final List<String> rutasFotos;
  final bool isSubmitting;
  final String? errorText;

  IncidenteFormState({
    required this.equipmentId,
    this.checklistId,
    this.descripcion = '',
    this.severidad = 'MAJOR',
    this.horasEstimadas,
    this.rutasFotos = const [],
    this.isSubmitting = false,
    this.errorText,
  });

  IncidenteFormState copyWith({
    String? equipmentId,
    String? checklistId,
    String? descripcion,
    String? severidad,
    String? horasEstimadas,
    List<String>? rutasFotos,
    bool? isSubmitting,
    String? errorText,
  }) {
    return IncidenteFormState(
      equipmentId: equipmentId ?? this.equipmentId,
      checklistId: checklistId ?? this.checklistId,
      descripcion: descripcion ?? this.descripcion,
      severidad: severidad ?? this.severidad,
      horasEstimadas: horasEstimadas ?? this.horasEstimadas,
      rutasFotos: rutasFotos ?? this.rutasFotos,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorText: errorText,
    );
  }
}

@riverpod
class IncidenteForm extends _$IncidenteForm {
  @override
  IncidenteFormState build() {
    // If we came from a checklist form, prefill the equipment ID
    final checkState = ref.watch(checklistFormProvider);
    return IncidenteFormState(
      equipmentId: checkState.equipmentId ?? '',
      severidad:
          'CRITICAL', // Prefilled to CRITICAL if coming from checklist failure
    );
  }

  void updateDescripcion(String text) {
    state = state.copyWith(descripcion: text, errorText: null);
  }

  void updateSeveridad(String val) {
    state = state.copyWith(severidad: val);
  }

  void updateHorasEstimadas(String val) {
    state = state.copyWith(horasEstimadas: val);
  }

  void addFoto(String path) {
    if (state.rutasFotos.length < 5) {
      state = state.copyWith(rutasFotos: [...state.rutasFotos, path]);
    }
  }

  void removeFoto(String path) {
    final newList = List<String>.from(state.rutasFotos)..remove(path);
    state = state.copyWith(rutasFotos: newList);
  }

  bool _validate() {
    if (state.equipmentId.isEmpty) {
      state = state.copyWith(errorText: 'El equipo no está definido.');
      return false;
    }
    if (state.descripcion.trim().isEmpty) {
      state = state.copyWith(
        errorText: 'Debe ingresar una descripción de la falla.',
      );
      return false;
    }
    if (state.horasEstimadas != null && state.horasEstimadas!.isNotEmpty) {
      if (double.tryParse(state.horasEstimadas!) == null) {
        state = state.copyWith(
          errorText: 'Las horas estimadas deben ser un número válido.',
        );
        return false;
      }
    }
    return true;
  }

  Future<bool> saveIncidente() async {
    if (!_validate()) return false;

    state = state.copyWith(isSubmitting: true, errorText: null);

    final uuid = const Uuid();
    final model = IncidenteModel(
      id: uuid.v4(),
      idEquipo: state.equipmentId,
      descripcion: state.descripcion,
      severidad: state.severidad,
      horasEstimadas:
          state.horasEstimadas != null && state.horasEstimadas!.isNotEmpty
          ? double.parse(state.horasEstimadas!)
          : null,
      rutasFotos: state.rutasFotos,
      estadoSincronizacion: 'PENDING_SYNC',
    );

    try {
      final repo = ref.read(checklistRepositoryProvider);
      await repo.saveIncidente(model);
      state = state.copyWith(isSubmitting: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        errorText: 'Error al guardar el reporte: $e',
      );
      return false;
    }
  }
}
