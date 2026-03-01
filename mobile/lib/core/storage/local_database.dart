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

    return await openDatabase(
      path,
      version: 3,
      onCreate: _createDB,
      onUpgrade: _upgradeDB,
    );
  }

  Future<void> _upgradeDB(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('DROP TABLE IF EXISTS checklists');
      await db.execute('''
        CREATE TABLE checklists (
          id TEXT PRIMARY KEY,
          fecha TEXT,
          id_equipo TEXT,
          tipo TEXT,
          estado TEXT,
          estado_sincronizacion TEXT
        )
      ''');
      await db.execute('''
        CREATE TABLE checklist_items (
          id TEXT PRIMARY KEY,
          id_checklist TEXT,
          nombre_item TEXT,
          categoria TEXT,
          aprobado INTEGER,
          comentario TEXT,
          ruta_foto TEXT
        )
      ''');
      await db.execute('''
        CREATE TABLE incidentes (
          id TEXT PRIMARY KEY,
          id_equipo TEXT,
          id_checklist TEXT,
          descripcion TEXT,
          severidad TEXT,
          horas_estimadas REAL,
          rutas_fotos TEXT,
          estado_sincronizacion TEXT
        )
      ''');
    }
    if (oldVersion < 3) {
      await db.execute(
        'ALTER TABLE daily_reports ADD COLUMN id_vale_combustible TEXT;',
      );
      await db.execute('''
        CREATE TABLE combustibles (
          id TEXT PRIMARY KEY,
          numero_vale TEXT,
          fecha TEXT,
          tipo_combustible TEXT,
          cantidad_galones REAL,
          precio_unitario REAL,
          id_equipo TEXT,
          foto_path TEXT,
          notas TEXT,
          estado TEXT,
          sync_status TEXT
        )
      ''');
    }
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
        sync_status TEXT,
        id_vale_combustible TEXT
      )
    ''');

    // Checklists Table
    await db.execute('''
      CREATE TABLE checklists (
        id TEXT PRIMARY KEY,
        fecha TEXT,
        id_equipo TEXT,
        tipo TEXT,
        estado TEXT,
        estado_sincronizacion TEXT
      )
    ''');

    // Checklist Items Table
    await db.execute('''
      CREATE TABLE checklist_items (
        id TEXT PRIMARY KEY,
        id_checklist TEXT,
        nombre_item TEXT,
        categoria TEXT,
        aprobado INTEGER,
        comentario TEXT,
        ruta_foto TEXT
      )
    ''');

    // Incidentes Table
    await db.execute('''
      CREATE TABLE incidentes (
        id TEXT PRIMARY KEY,
        id_equipo TEXT,
        id_checklist TEXT,
        descripcion TEXT,
        severidad TEXT,
        horas_estimadas REAL,
        rutas_fotos TEXT,
        estado_sincronizacion TEXT
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
