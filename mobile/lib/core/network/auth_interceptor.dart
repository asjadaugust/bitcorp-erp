import 'package:dio/dio.dart';
import '../storage/secure_storage_provider.dart';

class AuthInterceptor extends Interceptor {
  // final Ref _ref;
  final SecureStorageService _storageService;

  AuthInterceptor(
    this._storageService,
  ); // AuthInterceptor(this._ref, this._storageService);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Inject JWT token if available
    final token = await _storageService.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    // TODO: Inject multi-tenant headers (id_empresa, id_proyecto) from global state once implemented
    // final empresaId = _ref.read(currentEmpresaProvider);
    // if (empresaId != null) options.headers['id_empresa'] = empresaId;

    super.onRequest(options, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      // Token is invalid or expired
      // Trigger a global state change to log out the user and redirect to login screen
      // _ref.read(authControllerProvider.notifier).logout();
    }
    super.onError(err, handler);
  }
}
