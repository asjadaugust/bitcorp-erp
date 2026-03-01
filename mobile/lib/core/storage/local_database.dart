import 'package:path/path.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:sqflite/sqflite.dart';

part 'local_database.g.dart';

class LocalDatabase {
  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _initDB('bitcorp_mobile.db');
    return _db!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(path, version: 1, onCreate: _createDB);
  }

  Future<void> _createDB(Database db, int version) async {
    // Dashboard Summary Table
    await db.execute('''
      CREATE TABLE dashboard_summary (
        id TEXT PRIMARY KEY,
        equipment_code TEXT,
        equipment_description TEXT,
        daily_report_status TEXT,
        pending_checklist_count INTEGER,
        pending_approval_count INTEGER,
        last_updated INTEGER
      )
    ''');

    // Daily Reports Table
    await db.execute('''
      CREATE TABLE daily_reports (
        id TEXT PRIMARY KEY,
        date TEXT,
        equipment_id TEXT,
        start_hour_meter REAL,
        end_hour_meter REAL,
        start_odometer REAL,
        end_odometer REAL,
        effective_hours REAL,
        activity_description TEXT,
        observations TEXT,
        signature_path TEXT,
        sync_status TEXT
      )
    ''');

    // Checklists Table
    await db.execute('''
      CREATE TABLE checklists (
        id TEXT PRIMARY KEY,
        equipment_code TEXT NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        data TEXT NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      )
    ''');

    // Sync Queue Table for offline actions
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    ''');

    // Report Events Table
    await db.execute('''
      CREATE TABLE report_events (
        id TEXT PRIMARY KEY,
        report_id TEXT,
        event_type TEXT,
        start_time TEXT,
        end_time TEXT,
        duration REAL,
        reason TEXT
      )
    ''');

    // Report Photos Table
    await db.execute('''
      CREATE TABLE report_photos (
        id TEXT PRIMARY KEY,
        report_id TEXT,
        file_path TEXT
      )
    ''');
  }

  Future<void> close() async {
    final db = await database;
    db.close();
  }
}

@Riverpod(keepAlive: true)
LocalDatabase localDatabase(Ref ref) {
  return LocalDatabase();
}
