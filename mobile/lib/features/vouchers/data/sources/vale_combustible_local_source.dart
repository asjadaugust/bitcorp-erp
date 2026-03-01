import 'package:mobile/core/storage/local_database.dart';
import 'package:mobile/features/vouchers/domain/models/vale_combustible_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'vale_combustible_local_source.g.dart';

class ValeCombustibleLocalSource {
  final LocalDatabase _localDatabase;

  const ValeCombustibleLocalSource(this._localDatabase);

  Future<void> saveValeCombustible(ValeCombustibleModel vale) async {
    final db = await _localDatabase.database;
    await db.insert('combustibles', vale.toJson());
    // Hardcoded SQL Replace via explicit statement if the generic insert causes issues
    await db.execute(
      '''
      INSERT OR REPLACE INTO combustibles (
        id, numero_vale, fecha, tipo_combustible, cantidad_galones, 
        precio_unitario, id_equipo, foto_path, notas, estado, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''',
      [
        vale.id,
        vale.numeroVale,
        vale.fecha.toIso8601String(),
        vale.tipoCombustible,
        vale.cantidadGalones,
        vale.precioUnitario,
        vale.idEquipo,
        vale.fotoPath,
        vale.notas,
        vale.estado,
        vale.syncStatus,
      ],
    );
  }

  Future<List<ValeCombustibleModel>> getValesCombustible() async {
    final db = await _localDatabase.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'combustibles',
      orderBy: 'fecha DESC',
    );
    return maps.map((map) {
      // Need to transform strings to correct types manually because SQLite stores everything flat
      final mutableMap = Map<String, dynamic>.from(map);
      return ValeCombustibleModel.fromJson(mutableMap);
    }).toList();
  }

  Future<List<ValeCombustibleModel>> getUnlinkedValesByEquipment(
    String idEquipo,
  ) async {
    final db = await _localDatabase.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'combustibles',
      where: 'id_equipo = ? AND estado = ?',
      whereArgs: [idEquipo, 'NO_VINCULADO'],
      orderBy: 'fecha DESC',
    );
    return maps.map((map) {
      final mutableMap = Map<String, dynamic>.from(map);
      return ValeCombustibleModel.fromJson(mutableMap);
    }).toList();
  }

  Future<void> updateValeStatus(String id, String estado) async {
    final db = await _localDatabase.database;
    await db.update(
      'combustibles',
      {'estado': estado},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<List<ValeCombustibleModel>> getPendingSync() async {
    final db = await _localDatabase.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'combustibles',
      where: 'sync_status = ?',
      whereArgs: ['PENDING_SYNC'],
    );
    return maps
        .map(
          (map) =>
              ValeCombustibleModel.fromJson(Map<String, dynamic>.from(map)),
        )
        .toList();
  }
}

@riverpod
ValeCombustibleLocalSource valeCombustibleLocalSource(Ref ref) {
  final db = ref.watch(localDatabaseProvider);
  return ValeCombustibleLocalSource(db);
}
