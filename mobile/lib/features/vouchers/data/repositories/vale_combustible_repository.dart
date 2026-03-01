import 'package:mobile/features/vouchers/data/sources/vale_combustible_local_source.dart';
import 'package:mobile/features/vouchers/domain/models/vale_combustible_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'vale_combustible_repository.g.dart';

class ValeCombustibleRepository {
  final ValeCombustibleLocalSource _localSource;

  const ValeCombustibleRepository(this._localSource);

  Future<void> saveValeCombustible(ValeCombustibleModel vale) async {
    // Vales always default to PENDING_SYNC when saved locally
    final entityToSave = vale.copyWith(syncStatus: 'PENDING_SYNC');
    await _localSource.saveValeCombustible(entityToSave);
  }

  Future<List<ValeCombustibleModel>> getValesCombustible() async {
    return await _localSource.getValesCombustible();
  }

  Future<List<ValeCombustibleModel>> getUnlinkedValesByEquipment(
    String idEquipo,
  ) async {
    return await _localSource.getUnlinkedValesByEquipment(idEquipo);
  }

  Future<void> updateValeStatus(String id, String estado) async {
    await _localSource.updateValeStatus(id, estado);
  }
}

@riverpod
ValeCombustibleRepository valeCombustibleRepository(Ref ref) {
  final localSource = ref.watch(valeCombustibleLocalSourceProvider);
  return ValeCombustibleRepository(localSource);
}
