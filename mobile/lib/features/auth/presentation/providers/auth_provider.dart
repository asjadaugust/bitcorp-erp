import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/auth/domain/models/login_request.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

part 'auth_provider.g.dart';

enum AuthStatus { initial, unauthenticated, authenticated }

class AuthState {
  final AuthStatus status;
  final String? role;
  final String? userName;
  final int? userId;
  final bool isLoading;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.role,
    this.userName,
    this.userId,
    this.isLoading = false,
    this.errorMessage,
  });

  AuthState copyWith({
    AuthStatus? status,
    String? role,
    String? userName,
    int? userId,
    bool? isLoading,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      role: role ?? this.role,
      userName: userName ?? this.userName,
      userId: userId ?? this.userId,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  AuthState build() {
    final repo = ref.watch(authRepositoryProvider);
    Future.microtask(() => _checkInitialAuth(repo));
    return const AuthState(isLoading: true);
  }

  Future<void> _checkInitialAuth(AuthRepository repo) async {
    final token = await repo.getValidTokenPrefix();

    if (token != null) {
      final decodedToken = JwtDecoder.decode(token);
      final role = decodedToken['rol']; // Backend payload uses 'rol'
      final userName = decodedToken['nombre_completo'] as String?;
      final userId = decodedToken['id_usuario'] as int?;

      state = state.copyWith(
        status: AuthStatus.authenticated,
        role: role,
        userName: userName,
        userId: userId,
        isLoading: false,
      );
    } else {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        isLoading: false,
      );
    }
  }

  Future<bool> login(String username, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final repo = ref.read(authRepositoryProvider);
      final token = await repo.login(
        LoginRequest(username: username, password: password),
      );

      final decodedToken = JwtDecoder.decode(token);
      final role = decodedToken['rol'];
      final userName = decodedToken['nombre_completo'] as String?;
      final userId = decodedToken['id_usuario'] as int?;

      state = state.copyWith(
        status: AuthStatus.authenticated,
        role: role,
        userName: userName,
        userId: userId,
        isLoading: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        isLoading: false,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
      return false;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    final repo = ref.read(authRepositoryProvider);
    await repo.logout();

    state = state.copyWith(
      status: AuthStatus.unauthenticated,
      role: null,
      isLoading: false,
    );
  }
}
