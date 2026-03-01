import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/storage/local_database.dart';
import '../../domain/models/daily_report_model.dart';
import 'package:sqflite/sqflite.dart';

part 'daily_report_local_source.g.dart';

class DailyReportLocalSource {
  final LocalDatabase _localDatabase;

  DailyReportLocalSource(this._localDatabase);

  Future<List<DailyReportModel>> getReports() async {
    final db = await _localDatabase.database;
    final List<Map<String, dynamic>> reportMaps = await db.query(
      'daily_reports',
      orderBy: 'date DESC',
    );

    List<DailyReportModel> reports = [];
    for (var map in reportMaps) {
      final reportId = map['id'] as String;

      // Fetch events
      final List<Map<String, dynamic>> eventMaps = await db.query(
        'report_events',
        where: 'report_id = ?',
        whereArgs: [reportId],
      );

      // Fetch photos
      final List<Map<String, dynamic>> photoMaps = await db.query(
        'report_photos',
        where: 'report_id = ?',
        whereArgs: [reportId],
      );

      final Map<String, dynamic> jsonMap = {
        'id': map['id'],
        'date': map['date'],
        'equipmentId': map['equipment_id'],
        'startHourMeter': map['start_hour_meter'],
        'endHourMeter': map['end_hour_meter'],
        'startOdometer': map['start_odometer'],
        'endOdometer': map['end_odometer'],
        'effectiveHours': map['effective_hours'],
        'activityDescription': map['activity_description'],
        'observations': map['observations'],
        'signaturePath': map['signature_path'],
        'syncStatus': map['sync_status'],
        'idValeCombustible': map['id_vale_combustible'],
      };

      jsonMap['events'] = eventMaps
          .map(
            (e) => {
              'id': e['id'],
              'eventType': e['event_type'],
              'startTime': e['start_time'],
              'endTime': e['end_time'],
              'duration': e['duration'],
              'reason': e['reason'],
            },
          )
          .toList();

      jsonMap['photos'] = photoMaps
          .map((p) => {'id': p['id'], 'filePath': p['file_path']})
          .toList();

      reports.add(DailyReportModel.fromJson(jsonMap));
    }

    return reports;
  }

  Future<void> saveReport(DailyReportModel report) async {
    final db = await _localDatabase.database;
    await db.transaction((txn) async {
      await txn.insert('daily_reports', {
        'id': report.id,
        'date': report.date,
        'equipment_id': report.equipmentId,
        'start_hour_meter': report.startHourMeter,
        'end_hour_meter': report.endHourMeter,
        'start_odometer': report.startOdometer,
        'end_odometer': report.endOdometer,
        'effective_hours': report.effectiveHours,
        'activity_description': report.activityDescription,
        'observations': report.observations,
        'signature_path': report.signaturePath,
        'sync_status': report.syncStatus,
        'id_vale_combustible': report.idValeCombustible,
      }, conflictAlgorithm: ConflictAlgorithm.replace);

      // Clear existing events/photos for update
      await txn.delete(
        'report_events',
        where: 'report_id = ?',
        whereArgs: [report.id],
      );
      await txn.delete(
        'report_photos',
        where: 'report_id = ?',
        whereArgs: [report.id],
      );

      for (var event in report.events) {
        await txn.insert('report_events', {
          'id': event.id,
          'report_id': report.id,
          'event_type': event.eventType,
          'start_time': event.startTime,
          'end_time': event.endTime,
          'duration': event.duration,
          'reason': event.reason,
        });
      }

      for (var photo in report.photos) {
        await txn.insert('report_photos', {
          'id': photo.id,
          'report_id': report.id,
          'file_path': photo.filePath,
        });
      }
    });
  }
}

@riverpod
DailyReportLocalSource dailyReportLocalSource(Ref ref) {
  final localDatabase = ref.watch(localDatabaseProvider);
  return DailyReportLocalSource(localDatabase);
}
