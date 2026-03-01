import 'checklist_item_model.dart';

class ChecklistModel {
  final String id;
  final String fecha;
  final String idEquipo;
  final String tipo; // 'DAILY', 'WEEKLY'
  final String estado; // 'PASS', 'FAIL'
  final String estadoSincronizacion; // 'DRAFT', 'PENDING_SYNC'
  final List<ChecklistItemModel>? items;

  const ChecklistModel({
    required this.id,
    required this.fecha,
    required this.idEquipo,
    required this.tipo,
    required this.estado,
    required this.estadoSincronizacion,
    this.items,
  });

  ChecklistModel copyWith({
    String? id,
    String? fecha,
    String? idEquipo,
    String? tipo,
    String? estado,
    String? estadoSincronizacion,
    List<ChecklistItemModel>? items,
  }) {
    return ChecklistModel(
      id: id ?? this.id,
      fecha: fecha ?? this.fecha,
      idEquipo: idEquipo ?? this.idEquipo,
      tipo: tipo ?? this.tipo,
      estado: estado ?? this.estado,
      estadoSincronizacion: estadoSincronizacion ?? this.estadoSincronizacion,
      items: items ?? this.items,
    );
  }

  factory ChecklistModel.fromMap(
    Map<String, dynamic> map, {
    List<ChecklistItemModel>? items,
  }) {
    return ChecklistModel(
      id: map['id'] as String,
      fecha: map['fecha'] as String,
      idEquipo: map['id_equipo'] as String,
      tipo: map['tipo'] as String,
      estado: map['estado'] as String,
      estadoSincronizacion: map['estado_sincronizacion'] as String,
      items: items,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'fecha': fecha,
      'id_equipo': idEquipo,
      'tipo': tipo,
      'estado': estado,
      'estado_sincronizacion': estadoSincronizacion,
    };
  }
}
