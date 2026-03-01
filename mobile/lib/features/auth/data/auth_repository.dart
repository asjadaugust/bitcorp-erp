import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/core/storage/secure_storage_provider.dart';
import 'package:mobile/features/auth/domain/models/login_request.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

part 'auth_repository.g.dart';

class AuthRepository {
  final Dio _dio;
  final SecureStorageService _storageService;

  AuthRepository(this._dio, this._storageService);

  Future<String> login(LoginRequest request) async {
    try {
      final response = await _dio.post('/auth/login', data: request.toJson());

      final String token = response.data['access_token'];
      await _storageService.saveToken(token);
      return token;
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Credenciales inválidas');
      }
      throw Exception('Error de conexión o servidor');
    } catch (e) {
      throw Exception('Ocurrió un error inesperado');
    }
  }

  Future<void> logout() async {
    await _storageService.deleteToken();
  }

  Future<String?> getValidTokenPrefix() async {
    final token = await _storageService.getToken();
    if (token == null) return null;

    if (JwtDecoder.isExpired(token)) {
      await logout();
      return null;
    }
    return token;
  }
}

@riverpod
AuthRepository authRepository(Ref ref) {
  return AuthRepository(
    ref.watch(dioProvider),
    ref.watch(secureStorageServiceProvider),
  );
}
