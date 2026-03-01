import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../domain/models/daily_report_model.dart';
import '../../data/repositories/daily_report_repository.dart';

part 'daily_report_list_provider.g.dart';

@riverpod
class DailyReportList extends _$DailyReportList {
  @override
  FutureOr<List<DailyReportModel>> build() async {
    return _fetchReports();
  }

  Future<List<DailyReportModel>> _fetchReports() async {
    final repo = ref.watch(dailyReportRepositoryProvider);
    return await repo.getReports();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchReports());
  }
}
