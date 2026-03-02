import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'auth_interceptor.dart';
import '../storage/secure_storage_provider.dart';

part 'dio_client.g.dart';

/// Returns the API base URL.
///
/// For physical Android devices, use `adb reverse` to tunnel the device's
/// localhost back to the Mac (bypasses macOS firewall entirely):
///
///   adb reverse tcp:3410 tcp:3410
///
/// This makes localhost:3410 on the phone resolve to localhost:3410 on the Mac.
/// Works for both emulators and physical devices connected via USB.
String _resolveBaseUrl() {
  // All platforms use localhost because:
  // - Android emulator: add 10.0.2.2 alias is set up by the emulator
  // - Android physical device: `adb reverse tcp:3410 tcp:3410` tunnels over USB
  // - iOS simulator / macOS: localhost works natively
  return 'http://localhost:3410/api';
}

@Riverpod(keepAlive: true)
Dio dio(Ref ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: _resolveBaseUrl(),
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


// # Allow ssh through the application firewall so Colima port forwards are accessible from LAN
// sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/ssh
// sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /usr/bin/ssh

// sudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper
// sudo: a password is required
// sudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper
// sudo: a password is required