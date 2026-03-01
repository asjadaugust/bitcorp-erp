import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/dashboard/data/dashboard_local_source.dart';
import 'package:mobile/features/dashboard/domain/models/dashboard_summary_model.dart';
import 'package:flutter/foundation.dart';

part 'dashboard_repository.g.dart';

class DashboardRepository {
  final Dio _dio;
  final DashboardLocalSource _localSource;

  DashboardRepository(this._dio, this._localSource);

  Future<DashboardSummaryModel> getSummary({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      // Return cached version if it exists to load instantly
      final cached = await _localSource.getCachedSummary();
      if (cached != null) {
        // Trigger a background refresh
        _fetchAndCache();
        return cached;
      }
    }

    // Force network call and cache the result
    return _fetchAndCache();
  }

  Future<DashboardSummaryModel> _fetchAndCache() async {
    try {
      final response = await _dio.get('/dashboard/operator/summary');
      final summary = DashboardSummaryModel.fromJson(response.data);

      // Save for offline access
      await _localSource.cacheSummary(summary);

      return summary;
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.unknown) {
        // App is likely offline or server unreachable. Load from cache.
        final cached = await _localSource.getCachedSummary();
        if (cached != null) return cached;
      }

      // If we don't have cache, throw the error
      debugPrint('Failed to load dashboard: \${e.message}');

      // For Demo/Dev purposes to proceed UI without API server
      // Return a mocked dummy set if the API fails just for visual checks
      if (kDebugMode) {
        final mock = const DashboardSummaryModel(
          equipmentCode: 'EXC-001',
          equipmentDescription: 'Excavadora Caterpillar 336D2L',
          dailyReportStatus: 'Not Submitted',
          pendingChecklistCount: 1,
          pendingApprovalCount: 2,
        );
        await _localSource.cacheSummary(mock);
        return mock;
      }
      rethrow;
    }
  }
}

@riverpod
DashboardRepository dashboardRepository(Ref ref) {
  return DashboardRepository(
    ref.watch(dioProvider),
    ref.watch(dashboardLocalSourceProvider),
  );
}
