import 'package:mobile/core/providers/global_project_provider.dart';
import 'package:mobile/features/valorizations/data/repositories/valorizations_repository.dart';
import 'package:mobile/features/valorizations/domain/models/valorization_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'valorizations_provider.g.dart';

@riverpod
class Valorizations extends _$Valorizations {
  @override
  Future<List<ValorizationModel>> build() async {
    final projectId = ref.watch(globalProjectProvider);
    final repo = ref.watch(valorizationsRepositoryProvider);
    return repo.getValorizations(projectId);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => build());
  }
}
