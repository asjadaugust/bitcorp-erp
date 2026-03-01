import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:sqflite/sqflite.dart';

import '../../../../core/storage/local_database.dart';
import '../../domain/models/checklist_model.dart';
import '../../domain/models/checklist_item_model.dart';
import '../../domain/models/incidente_model.dart';

part 'checklist_local_source.g.dart';

class ChecklistLocalSource {
  final LocalDatabase _localDatabase;

  ChecklistLocalSource(this._localDatabase);

  Future<void> saveChecklist(ChecklistModel checklist) async {
    final db = await _localDatabase.database;
    await db.transaction((txn) async {
      await txn.insert(
        'checklists',
        checklist.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      // Save related items
      if (checklist.items != null) {
        for (final item in checklist.items!) {
          await txn.insert(
            'checklist_items',
            item.toMap(),
            conflictAlgorithm: ConflictAlgorithm.replace,
          );
        }
      }
    });
  }

  Future<List<ChecklistModel>> getChecklists() async {
    final db = await _localDatabase.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'checklists',
      orderBy: 'fecha DESC',
    );

    List<ChecklistModel> checklists = [];
    for (final map in maps) {
      final itemsMap = await db.query(
        'checklist_items',
        where: 'id_checklist = ?',
        whereArgs: [map['id']],
      );
      final items = itemsMap.map((e) => ChecklistItemModel.fromMap(e)).toList();
      checklists.add(ChecklistModel.fromMap(map, items: items));
    }

    return checklists;
  }

  Future<ChecklistModel?> getChecklistById(String id) async {
    final db = await _localDatabase.database;
    final maps = await db.query('checklists', where: 'id = ?', whereArgs: [id]);

    if (maps.isEmpty) return null;

    final itemsMap = await db.query(
      'checklist_items',
      where: 'id_checklist = ?',
      whereArgs: [id],
    );
    final items = itemsMap.map((e) => ChecklistItemModel.fromMap(e)).toList();

    return ChecklistModel.fromMap(maps.first, items: items);
  }

  Future<void> saveIncidente(IncidenteModel incidente) async {
    final db = await _localDatabase.database;
    await db.insert(
      'incidentes',
      incidente.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<IncidenteModel>> getIncidentesByEquipment(
    String equipmentId,
  ) async {
    final db = await _localDatabase.database;
    final maps = await db.query(
      'incidentes',
      where: 'id_equipo = ?',
      whereArgs: [equipmentId],
    );

    return maps.map((e) => IncidenteModel.fromMap(e)).toList();
  }
}

@riverpod
ChecklistLocalSource checklistLocalSource(Ref ref) {
  return ChecklistLocalSource(ref.watch(localDatabaseProvider));
}
