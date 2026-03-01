import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'secure_storage_provider.g.dart';

@riverpod
FlutterSecureStorage secureStorage(Ref ref) {
  return const FlutterSecureStorage(
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );
}

class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService(this._storage);

  static const _tokenKey = 'jwt_token';

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return _storage.read(key: _tokenKey);
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  Future<void> deleteAll() async {
    await _storage.deleteAll();
  }
}

@riverpod
SecureStorageService secureStorageService(Ref ref) {
  return SecureStorageService(ref.watch(secureStorageProvider));
}
