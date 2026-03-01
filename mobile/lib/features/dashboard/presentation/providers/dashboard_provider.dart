import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mobile/features/dashboard/data/dashboard_repository.dart';
import 'package:mobile/features/dashboard/domain/models/dashboard_summary_model.dart';

part 'dashboard_provider.g.dart';

@riverpod
class DashboardNotifier extends _$DashboardNotifier {
  @override
  Future<DashboardSummaryModel> build() async {
    final repo = ref.watch(dashboardRepositoryProvider);
    return repo.getSummary();
  }

  Future<void> refresh() async {
    // Set state to loading to optionally show skeleton on pull-to-refresh
    state = const AsyncValue.loading();
    try {
      final repo = ref.read(dashboardRepositoryProvider);
      final newData = await repo.getSummary(forceRefresh: true);
      state = AsyncValue.data(newData);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}
