import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/equipment/domain/models/equipment_detail_model.dart';
import 'package:mobile/features/equipment/domain/models/equipment_list_item.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'equipment_repository.g.dart';

class EquipmentRepository {
  final Dio _dio;

  EquipmentRepository(this._dio);

  Future<EquipmentDetailModel> getEquipmentDetail(String id) async {
    final response = await _dio.get('/equipment/$id');
    final data = response.data['data'] as Map<String, dynamic>;
    return EquipmentDetailModel.fromJson(data);
  }

  /// Fetch equipment available for the current tenant.
  Future<List<EquipmentListItem>> getAvailableEquipment() async {
    try {
      final response = await _dio.get('/equipment/available');
      final List<dynamic> items = response.data['data'] as List<dynamic>;
      return items
          .map((e) => EquipmentListItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Equipment API unavailable: $e, using fallback');
        return const [
          EquipmentListItem(
            id: 1,
            code: 'EXC-001',
            description: 'Excavadora Caterpillar 336D2L',
            estado: 'EN_USO',
          ),
        ];
      }
      rethrow;
    }
  }
}

@riverpod
EquipmentRepository equipmentRepository(Ref ref) {
  final dio = ref.watch(dioProvider);
  return EquipmentRepository(dio);
}

@riverpod
Future<List<EquipmentListItem>> availableEquipment(Ref ref) async {
  final repo = ref.watch(equipmentRepositoryProvider);
  return repo.getAvailableEquipment();
}
