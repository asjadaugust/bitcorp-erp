import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

import '../../data/repositories/checklist_repository.dart';
import '../../domain/models/checklist_model.dart';
import '../../domain/models/checklist_item_model.dart';

part 'checklist_form_provider.g.dart';

class ChecklistFormState {
  final String date;
  final String? equipmentId;
  final String checklistType; // 'DAILY' or 'WEEKLY'
  final List<ChecklistItemModel> items;
  final bool isSubmitting;
  final String? errorText;

  ChecklistFormState({
    required this.date,
    this.equipmentId,
    required this.checklistType,
    required this.items,
    this.isSubmitting = false,
    this.errorText,
  });

  ChecklistFormState copyWith({
    String? date,
    String? equipmentId,
    String? checklistType,
    List<ChecklistItemModel>? items,
    bool? isSubmitting,
    String? errorText,
  }) {
    return ChecklistFormState(
      date: date ?? this.date,
      equipmentId: equipmentId ?? this.equipmentId,
      checklistType: checklistType ?? this.checklistType,
      items: items ?? this.items,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorText: errorText, // deliberate override
    );
  }
}

@riverpod
class ChecklistForm extends _$ChecklistForm {
  @override
  ChecklistFormState build() {
    return ChecklistFormState(
      date: DateTime.now().toIso8601String(),
      checklistType: 'DAILY',
      items: [],
    );
  }

  void setEquipment(String eqId) {
    // MOCK LOGIC: Auto-determine type based on equipment prefix
    String type = 'DAILY';
    if (eqId.startsWith('EXC-') || eqId.startsWith('CAR-')) {
      type = 'WEEKLY'; // Heavy equipment
    }

    // MOCK TEMPLATE items
    final _uuid = const Uuid();
    final items = [
      ChecklistItemModel(
        id: _uuid.v4(),
        idChecklist: '', // Assigned later
        nombreItem: 'Nivel de Aceite del Motor',
        categoria: 'Fluidos y Filtros',
      ),
      ChecklistItemModel(
        id: _uuid.v4(),
        idChecklist: '',
        nombreItem: 'Nivel de Refrigerante',
        categoria: 'Fluidos y Filtros',
      ),
      ChecklistItemModel(
        id: _uuid.v4(),
        idChecklist: '',
        nombreItem: 'Estado de Neumáticos / Orugas',
        categoria: 'Tren de Rodaje',
      ),
      ChecklistItemModel(
        id: _uuid.v4(),
        idChecklist: '',
        nombreItem: 'Frenos y Dirección',
        categoria: 'Sistemas Críticos',
      ),
      ChecklistItemModel(
        id: _uuid.v4(),
        idChecklist: '',
        nombreItem: 'Luces y Señalización',
        categoria: 'Seguridad',
      ),
    ];

    state = state.copyWith(
      equipmentId: eqId,
      checklistType: type,
      items: items,
      errorText: null,
    );
  }

  void updateItemStatus(String itemId, bool passed) {
    final newItems = state.items.map((item) {
      if (item.id == itemId) {
        return item.copyWith(aprobado: passed);
      }
      return item;
    }).toList();
    state = state.copyWith(items: newItems, errorText: null);
  }

  void updateItemComment(String itemId, String comment) {
    final newItems = state.items.map((item) {
      if (item.id == itemId) {
        return item.copyWith(comentario: comment);
      }
      return item;
    }).toList();
    state = state.copyWith(items: newItems);
  }

  void updateItemPhoto(String itemId, String photoPath) {
    final newItems = state.items.map((item) {
      if (item.id == itemId) {
        return item.copyWith(rutaFoto: photoPath);
      }
      return item;
    }).toList();
    state = state.copyWith(items: newItems);
  }

  bool _validate() {
    if (state.equipmentId == null || state.equipmentId!.isEmpty) {
      state = state.copyWith(errorText: 'Debe seleccionar un equipo.');
      return false;
    }
    if (state.items.isEmpty) {
      state = state.copyWith(errorText: 'El checklist no tiene ítems.');
      return false;
    }
    for (var item in state.items) {
      if (item.aprobado == null) {
        state = state.copyWith(
          errorText: 'Debe marcar todos los ítems como Aprobado o Fallido.',
        );
        return false;
      }
      if (item.aprobado == false &&
          (item.comentario == null || item.comentario!.trim().isEmpty)) {
        state = state.copyWith(
          errorText:
              'Debe ingresar un comentario para los ítems fallidos (${item.nombreItem}).',
        );
        return false;
      }
    }
    return true;
  }

  bool get hasCriticalFailures {
    return state.items.any(
      (item) => item.aprobado == false && item.categoria == 'Sistemas Críticos',
    );
  }

  Future<bool> saveChecklist() async {
    if (!_validate()) return false;

    state = state.copyWith(isSubmitting: true, errorText: null);

    final _uuid = const Uuid();
    final checklistId = _uuid.v4();
    final isPass = state.items.every((item) => item.aprobado == true);

    final checklistItems = state.items
        .map((item) => item.copyWith(idChecklist: checklistId))
        .toList();

    final model = ChecklistModel(
      id: checklistId,
      fecha: state.date,
      idEquipo: state.equipmentId!,
      tipo: state.checklistType,
      estado: isPass ? 'PASS' : 'FAIL',
      estadoSincronizacion: 'PENDING_SYNC',
      items: checklistItems,
    );

    try {
      final repo = ref.read(checklistRepositoryProvider);
      await repo.saveChecklist(model);
      state = state.copyWith(isSubmitting: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        errorText: 'Error al guardar el checklist: \$e',
      );
      return false;
    }
  }
}
