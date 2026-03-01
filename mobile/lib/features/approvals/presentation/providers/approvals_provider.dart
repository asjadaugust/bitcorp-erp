import 'package:mobile/features/approvals/data/repositories/approvals_repository.dart';
import 'package:mobile/features/approvals/domain/models/approval_request_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'approvals_provider.g.dart';

@riverpod
class RecibidosList extends _$RecibidosList {
  @override
  Future<List<ApprovalRequestModel>> build() async {
    final repo = ref.watch(approvalsRepositoryProvider);
    return repo.getRecibidos();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => build());
  }
}

@riverpod
class EnviadosList extends _$EnviadosList {
  @override
  Future<List<ApprovalRequestModel>> build() async {
    final repo = ref.watch(approvalsRepositoryProvider);
    return repo.getEnviados();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => build());
  }
}

@riverpod
int receivedCount(Ref ref) {
  final recibidos = ref.watch(recibidosListProvider);
  return recibidos.maybeWhen(data: (list) => list.length, orElse: () => 0);
}
