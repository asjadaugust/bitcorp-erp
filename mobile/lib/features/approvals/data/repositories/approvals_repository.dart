import 'package:dio/dio.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/approvals/domain/models/approval_request_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'approvals_repository.g.dart';

class ApprovalsRepository {
  final Dio _dio;

  ApprovalsRepository(this._dio);

  Future<List<ApprovalRequestModel>> getRecibidos() async {
    final response = await _dio.get('/approvals/dashboard/recibidos');
    final data = response.data['data'] as List;
    return data
        .map((e) => ApprovalRequestModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<ApprovalRequestModel>> getEnviados() async {
    final response = await _dio.get('/approvals/dashboard/enviados');
    final data = response.data['data'] as List;
    return data
        .map((e) => ApprovalRequestModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> approveRequest(int requestId, {String? comment}) async {
    await _dio.post(
      '/approvals/requests/$requestId/approve',
      data: {'comentario': comment},
    );
  }

  Future<void> rejectRequest(int requestId, {required String comment}) async {
    await _dio.post(
      '/approvals/requests/$requestId/reject',
      data: {'comentario': comment},
    );
  }

  Future<void> createAdhoc({
    required String titulo,
    required String descripcion,
    required List<int> aprobadores,
  }) async {
    await _dio.post(
      '/approvals/adhoc',
      data: {
        'titulo': titulo,
        'descripcion': descripcion,
        'aprobadores': aprobadores,
      },
    );
  }

  /// Search users by name (for approver selection).
  Future<List<Map<String, dynamic>>> searchUsers(String query) async {
    final response = await _dio.get(
      '/users/search',
      queryParameters: {'q': query},
    );
    final data = response.data['data'] as List? ?? response.data as List;
    return data.cast<Map<String, dynamic>>();
  }
}

@riverpod
ApprovalsRepository approvalsRepository(Ref ref) {
  final dio = ref.watch(dioProvider);
  return ApprovalsRepository(dio);
}
