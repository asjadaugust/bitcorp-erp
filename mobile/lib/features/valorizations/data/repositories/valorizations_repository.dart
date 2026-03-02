import 'package:dio/dio.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/valorizations/domain/models/valorization_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'valorizations_repository.g.dart';

class ValorizationsRepository {
  final Dio _dio;

  ValorizationsRepository(this._dio);

  Future<List<ValorizationModel>> getValorizations(String? projectId) async {
    final queryParams = <String, dynamic>{};
    if (projectId != null) {
      queryParams['proyecto_id'] = projectId;
    }
    final response =
        await _dio.get('/valuations/', queryParameters: queryParams);
    final data = response.data['data'] as List;
    return data
        .map((e) => ValorizationModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

@riverpod
ValorizationsRepository valorizationsRepository(Ref ref) {
  final dio = ref.watch(dioProvider);
  return ValorizationsRepository(dio);
}
