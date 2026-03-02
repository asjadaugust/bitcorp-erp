import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mobile/features/approvals/data/repositories/approvals_repository.dart';
import 'package:mobile/features/approvals/presentation/providers/approvals_provider.dart';

part 'approval_action_provider.g.dart';

@riverpod
class ApprovalAction extends _$ApprovalAction {
  @override
  FutureOr<void> build() {}

  Future<void> approveRequest(int id, String? comment) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = ref.read(approvalsRepositoryProvider);
      await repo.approveRequest(id, comment: comment);
      ref.invalidate(recibidosListProvider);
    });
  }

  Future<void> rejectRequest(int id, String comment) async {
    if (comment.trim().isEmpty) {
      throw Exception(
        'El comentario es obligatorio para rechazar una solicitud.',
      );
    }
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = ref.read(approvalsRepositoryProvider);
      await repo.rejectRequest(id, comment: comment);
      ref.invalidate(recibidosListProvider);
    });
  }
}
