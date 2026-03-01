import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mobile/features/approvals/presentation/providers/approvals_provider.dart';

part 'approval_action_provider.g.dart';

@riverpod
class ApprovalAction extends _$ApprovalAction {
  @override
  FutureOr<void> build() {}

  Future<void> approveRequest(String id, String? comment) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await Future.delayed(
        const Duration(milliseconds: 1000),
      ); // Simulate API call network delay

      // We would normally fire an API call here.
      // E.g. await ref.read(approvalsRepositoryProvider).approve(id, comment);

      // After success, refresh list
      ref.invalidate(recibidosListProvider);
    });
  }

  Future<void> rejectRequest(String id, String comment) async {
    if (comment.trim().isEmpty) {
      throw Exception(
        'El comentario es obligatorio para rechazar una solicitud.',
      );
    }
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await Future.delayed(
        const Duration(milliseconds: 1000),
      ); // Simulate API call

      // API call logic...

      // Refresh list
      ref.invalidate(recibidosListProvider);
    });
  }
}
