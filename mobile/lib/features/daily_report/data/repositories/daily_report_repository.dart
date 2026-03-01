import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../domain/models/daily_report_model.dart';
import '../sources/daily_report_local_source.dart';

part 'daily_report_repository.g.dart';

class DailyReportRepository {
  final DailyReportLocalSource _localSource;

  DailyReportRepository(this._localSource);

  Future<List<DailyReportModel>> getReports() async {
    // In a real implementation, we would check network connectivity
    // and attempt to fetch from the remote API, falling back to local.
    // For now, we are entirely offline-first as per the requirement logic.
    return await _localSource.getReports();
  }

  Future<void> saveReport(DailyReportModel report) async {
    await _localSource.saveReport(report);
  }
}

@riverpod
DailyReportRepository dailyReportRepository(Ref ref) {
  final localSource = ref.watch(dailyReportLocalSourceProvider);
  return DailyReportRepository(localSource);
}
