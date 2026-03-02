import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/network/dio_client.dart';
import '../../domain/models/daily_report_model.dart';
import '../sources/daily_report_local_source.dart';

part 'daily_report_repository.g.dart';

class DailyReportRepository {
  final DailyReportLocalSource _localSource;
  final Dio _dio;

  DailyReportRepository(this._localSource, this._dio);

  Future<List<DailyReportModel>> getReports() async {
    try {
      final response = await _dio.get('/reports/');
      final data = response.data['data'] as List;
      return data
          .map((e) =>
              DailyReportModel.fromApiJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      // Offline fallback
      return await _localSource.getReports();
    }
  }

  Future<void> saveReport(DailyReportModel report) async {
    // Save locally first (offline-first)
    await _localSource.saveReport(report);

    // Attempt to sync to backend
    try {
      await _dio.post('/reports/', data: report.toApiJson());
      await _localSource.updateSyncStatus(report.id, 'SYNCED');
    } catch (_) {
      // Will be synced later
    }
  }

  Future<List<DailyReportModel>> getPendingSync() async {
    return await _localSource.getPendingSync();
  }

  Future<void> syncReport(DailyReportModel report) async {
    await _dio.post('/reports/', data: report.toApiJson());
    await _localSource.updateSyncStatus(report.id, 'SYNCED');
  }
}

@riverpod
DailyReportRepository dailyReportRepository(Ref ref) {
  final localSource = ref.watch(dailyReportLocalSourceProvider);
  final dio = ref.watch(dioProvider);
  return DailyReportRepository(localSource, dio);
}
