import 'package:mobile/features/valorizations/domain/models/valorization_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'valorizations_repository.g.dart';

class ValorizationsRepository {
  // Mocked JSON response for Valorizations
  static const _mockValorizations = {
    "success": true,
    "data": [
      {
        "id": "val-001",
        "periodo": "Febrero 2026",
        "monto_bruto": 15000.0,
        "deducciones": {"combustible": 1200.0, "reparaciones": 300.0},
        "monto_neto": 13500.0,
        "estado": "PAGADO",
      },
      {
        "id": "val-002",
        "periodo": "Marzo 2026",
        "monto_bruto": 16500.0,
        "deducciones": {"combustible": 1500.0, "reparaciones": 0.0},
        "monto_neto": 15000.0,
        "estado": "PENDIENTE",
      },
    ],
    "pagination": {"page": 1, "limit": 10, "total": 2, "total_pages": 1},
  };

  Future<List<ValorizationModel>> getValorizations(String? projectId) async {
    await Future.delayed(const Duration(milliseconds: 800)); // Simulate network
    final data = _mockValorizations['data'] as List;
    return data
        .map((e) => ValorizationModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

@riverpod
ValorizationsRepository valorizationsRepository(Ref ref) {
  return ValorizationsRepository();
}
