import 'package:dio/dio.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../domain/models/checklist_model.dart';
import '../../domain/models/incidente_model.dart';
import '../sources/checklist_local_source.dart';

part 'checklist_repository.g.dart';

class ChecklistRepository {
  final ChecklistLocalSource _localSource;
  final Dio _dio;

  ChecklistRepository(this._localSource, this._dio);

  Future<void> saveChecklist(ChecklistModel checklist) async {
    final modelToSave = checklist.copyWith(
      estadoSincronizacion: 'PENDING_SYNC',
    );
    await _localSource.saveChecklist(modelToSave);

    // Attempt API sync
    try {
      await _dio.post('/checklists/inspections', data: checklist.toMap());
    } catch (_) {
      // Will be synced later
    }
  }

  Future<List<ChecklistModel>> getChecklists() async {
    // Checklists are primarily offline-first (filled in field)
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

  Future<List<ChecklistModel>> getPendingSync() async {
    return await _localSource.getPendingSync();
  }

  Future<void> syncChecklist(ChecklistModel checklist) async {
    await _dio.post('/checklists/inspections', data: checklist.toMap());
    await _localSource.updateSyncStatus(checklist.id, 'SYNCED');
  }

  Future<List<IncidenteModel>> getIncidentesByEquipment(
    String equipmentId,
  ) async {
    return await _localSource.getIncidentesByEquipment(equipmentId);
  }
}

@riverpod
ChecklistRepository checklistRepository(Ref ref) {
  final localSource = ref.watch(checklistLocalSourceProvider);
  final dio = ref.watch(dioProvider);
  return ChecklistRepository(localSource, dio);
}
