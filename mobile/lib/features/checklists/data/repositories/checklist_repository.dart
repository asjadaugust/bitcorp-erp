import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../domain/models/checklist_model.dart';
import '../../domain/models/incidente_model.dart';
import '../sources/checklist_local_source.dart';

part 'checklist_repository.g.dart';

class ChecklistRepository {
  final ChecklistLocalSource _localSource;

  ChecklistRepository(this._localSource);

  Future<void> saveChecklist(ChecklistModel checklist) async {
    // Force PENDING_SYNC for offline first approach
    final modelToSave = checklist.copyWith(
      estadoSincronizacion: 'PENDING_SYNC',
    );
    await _localSource.saveChecklist(modelToSave);
  }

  Future<List<ChecklistModel>> getChecklists() async {
    return await _localSource.getChecklists();
  }

  Future<ChecklistModel?> getChecklistById(String id) async {
    return await _localSource.getChecklistById(id);
  }

  Future<void> saveIncidente(IncidenteModel incidente) async {
    final modelToSave = incidente.copyWith(
      estadoSincronizacion: 'PENDING_SYNC',
    );
    await _localSource.saveIncidente(modelToSave);
  }

  Future<List<IncidenteModel>> getIncidentesByEquipment(
    String equipmentId,
  ) async {
    return await _localSource.getIncidentesByEquipment(equipmentId);
  }
}

@riverpod
ChecklistRepository checklistRepository(Ref ref) {
  return ChecklistRepository(ref.watch(checklistLocalSourceProvider));
}
