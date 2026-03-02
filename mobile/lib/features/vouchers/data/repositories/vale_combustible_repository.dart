import 'package:dio/dio.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/vouchers/data/sources/vale_combustible_local_source.dart';
import 'package:mobile/features/vouchers/domain/models/vale_combustible_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'vale_combustible_repository.g.dart';

class ValeCombustibleRepository {
  final ValeCombustibleLocalSource _localSource;
  final Dio _dio;

  const ValeCombustibleRepository(this._localSource, this._dio);

  Future<void> saveValeCombustible(ValeCombustibleModel vale) async {
    final entityToSave = vale.copyWith(syncStatus: 'PENDING_SYNC');
    await _localSource.saveValeCombustible(entityToSave);

    // Attempt to sync to backend
    try {
      await _dio.post('/vales-combustible/', data: vale.toJson());
    } catch (_) {
      // Will be synced later
    }
  }

  Future<List<ValeCombustibleModel>> getValesCombustible() async {
    try {
      final response = await _dio.get('/vales-combustible/');
      final data = response.data['data'] as List;
      return data
          .map((e) => ValeCombustibleModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return await _localSource.getValesCombustible();
    }
  }

  Future<List<ValeCombustibleModel>> getUnlinkedValesByEquipment(
    String idEquipo,
  ) async {
    return await _localSource.getUnlinkedValesByEquipment(idEquipo);
  }

  Future<void> updateValeStatus(String id, String estado) async {
    await _localSource.updateValeStatus(id, estado);
  }

  Future<List<ValeCombustibleModel>> getPendingSync() async {
    return await _localSource.getPendingSync();
  }

  Future<void> syncVale(ValeCombustibleModel vale) async {
    await _dio.post('/vales-combustible/', data: vale.toJson());
    await _localSource.updateSyncStatus(vale.id, 'SYNCED');
  }
}

@riverpod
ValeCombustibleRepository valeCombustibleRepository(Ref ref) {
  final localSource = ref.watch(valeCombustibleLocalSourceProvider);
  final dio = ref.watch(dioProvider);
  return ValeCombustibleRepository(localSource, dio);
}
