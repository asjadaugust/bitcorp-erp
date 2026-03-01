import 'package:mobile/features/equipment/domain/models/equipment_detail_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'equipment_repository.g.dart';

class EquipmentRepository {
  // Mocked JSON response for Equipment Detail
  static const _mockEquipment = {
    "success": true,
    "data": {
      "id": "eq-001",
      "codigo": "EXC-001",
      "descripcion": "Excavadora Oruga 320",
      "marca": "Caterpillar",
      "modelo": "320 GC",
      "anio": 2023,
      "placa": "MTE-123",
      "contrato": {
        "estado": "ACTIVO",
        "tipo_tarifa": "HORA_MAQUINA",
        "anexo_a": ["Operador", "Mantenimiento Preventivo"],
      },
      "documentos": [
        {
          "tipo": "SOAT",
          "fecha_vencimiento": "2026-03-25T00:00:00Z",
          "estado": "WARNING",
        },
        {
          "tipo": "TREC",
          "fecha_vencimiento": "2026-02-01T00:00:00Z",
          "estado": "EXPIRED",
        },
        {
          "tipo": "REVISION_TECNICA",
          "fecha_vencimiento": "2026-10-01T00:00:00Z",
          "estado": "VALID",
        },
      ],
    },
  };

  Future<EquipmentDetailModel> getEquipmentDetail(String id) async {
    await Future.delayed(const Duration(milliseconds: 800)); // Simulate network
    final data = _mockEquipment['data'] as Map<String, dynamic>;
    // Override ID for mock
    data['id'] = id;
    return EquipmentDetailModel.fromJson(data);
  }
}

@riverpod
EquipmentRepository equipmentRepository(Ref ref) {
  return EquipmentRepository();
}
