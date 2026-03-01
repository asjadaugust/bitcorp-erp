import 'package:mobile/features/approvals/domain/models/approval_request_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'approvals_repository.g.dart';

class ApprovalsRepository {
  // Mocked JSON response for Recibidos
  static const _mockRecibidos = {
    "success": true,
    "data": [
      {
        "id": "appr-101",
        "tipo": "AD_HOC",
        "titulo": "Salida temprano - Consulta médica",
        "descripcion": "Necesito retirarme a las 15:00 por cita médica.",
        "solicitante": {"id": "usr-1", "nombre": "Juan Perez"},
        "fecha_creacion": "2026-03-01T10:00:00Z",
        "estado": "PENDING",
        "adjuntos": [],
        "linea_tiempo": [
          {
            "paso": 1,
            "estado": "APPROVED",
            "aprobador": {"nombre": "Supervisor Turno"},
            "fecha_completado": "2026-03-01T10:30:00Z",
            "comentario": "Todo en orden.",
          },
          {
            "paso": 2,
            "estado": "PENDING",
            "aprobador": {"nombre": "Residente de Obra", "id": "me"},
            "fecha_completado": null,
            "comentario": null,
          },
        ],
      },
    ],
    "pagination": {"page": 1, "limit": 10, "total": 1, "total_pages": 1},
  };

  static const _mockEnviados = {
    "success": true,
    "data": [
      {
        "id": "appr-102",
        "tipo": "PARTE_DIARIO",
        "titulo": "Aprobación - Parte Diario EXC-001",
        "descripcion":
            "Aprobación requerida para el parte diario de la excavadora 001.",
        "solicitante": {"id": "me", "nombre": "Operador (Yo)"},
        "fecha_creacion": "2026-03-01T08:00:00Z",
        "estado": "PENDING",
        "adjuntos": [],
        "linea_tiempo": [
          {
            "paso": 1,
            "estado": "PENDING",
            "aprobador": {"nombre": "Supervisor Turno"},
            "fecha_completado": null,
            "comentario": null,
          },
        ],
      },
    ],
    "pagination": {"page": 1, "limit": 10, "total": 1, "total_pages": 1},
  };

  Future<List<ApprovalRequestModel>> getRecibidos() async {
    await Future.delayed(const Duration(milliseconds: 800)); // Simulate network
    final data = _mockRecibidos['data'] as List;
    return data
        .map((e) => ApprovalRequestModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<ApprovalRequestModel>> getEnviados() async {
    await Future.delayed(const Duration(milliseconds: 800)); // Simulate network
    final data = _mockEnviados['data'] as List;
    return data
        .map((e) => ApprovalRequestModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

@riverpod
ApprovalsRepository approvalsRepository(Ref ref) {
  return ApprovalsRepository();
}
