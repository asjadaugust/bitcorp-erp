import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
// removed duplicate import
import 'auth_interceptor.dart';
import '../storage/secure_storage_provider.dart';

part 'dio_client.g.dart';

@Riverpod(keepAlive: true)
Dio dio(Ref ref) {
  final dio = Dio(
    BaseOptions(
      // TODO: Replace with environment variable base URL
      baseUrl: 'https://api.bitcorp-erp.com/v1',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
      sendTimeout: const Duration(seconds: 20),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  // Add Auth Interceptor
  final secureStorage = ref.watch(secureStorageServiceProvider);
  dio.interceptors.add(AuthInterceptor(secureStorage));

  // Add Logging Interceptor in Debug mode
  dio.interceptors.add(
    LogInterceptor(
      request: true,
      requestHeader: true,
      requestBody: true,
      responseHeader: true,
      responseBody: true,
      error: true,
    ),
  );

  return dio;
}
