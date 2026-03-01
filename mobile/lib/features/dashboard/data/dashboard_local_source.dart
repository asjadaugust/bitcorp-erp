import 'dart:convert';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mobile/core/storage/local_database.dart';
import 'package:mobile/features/dashboard/domain/models/dashboard_summary_model.dart';
import 'package:sqflite/sqflite.dart';

part 'dashboard_local_source.g.dart';

class DashboardLocalSource {
  final LocalDatabase _localDb;

  DashboardLocalSource(this._localDb);

  Future<void> cacheSummary(DashboardSummaryModel summary) async {
    final db = await _localDb.database;
    await db.insert('dashboard_summary', {
      'id': 'operator_dashboard',
      'payload': jsonEncode(summary.toJson()),
      'updated_at': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<DashboardSummaryModel?> getCachedSummary() async {
    final db = await _localDb.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'dashboard_summary',
      where: 'id = ?',
      whereArgs: ['operator_dashboard'],
    );

    if (maps.isNotEmpty) {
      final payload =
          jsonDecode(maps.first['payload'] as String) as Map<String, dynamic>;
      return DashboardSummaryModel.fromJson(payload);
    }
    return null;
  }
}

@riverpod
DashboardLocalSource dashboardLocalSource(Ref ref) {
  return DashboardLocalSource(ref.watch(localDatabaseProvider));
}
