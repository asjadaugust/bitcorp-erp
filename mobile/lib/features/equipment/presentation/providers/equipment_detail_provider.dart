import 'package:mobile/features/equipment/data/repositories/equipment_repository.dart';
import 'package:mobile/features/equipment/domain/models/equipment_detail_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'equipment_detail_provider.g.dart';

@riverpod
class EquipmentDetail extends _$EquipmentDetail {
  @override
  Future<EquipmentDetailModel> build(String id) async {
    final repo = ref.watch(equipmentRepositoryProvider);
    return repo.getEquipmentDetail(id);
  }
}
