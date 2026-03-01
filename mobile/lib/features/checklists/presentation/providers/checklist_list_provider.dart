import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../data/repositories/checklist_repository.dart';
import '../../domain/models/checklist_model.dart';
import '../../domain/models/incidente_model.dart';

part 'checklist_list_provider.g.dart';

@riverpod
class ChecklistList extends _$ChecklistList {
  @override
  FutureOr<List<ChecklistModel>> build() async {
    return _fetchChecklists();
  }

  Future<List<ChecklistModel>> _fetchChecklists() async {
    final repo = ref.read(checklistRepositoryProvider);
    return await repo.getChecklists();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchChecklists());
  }
}
