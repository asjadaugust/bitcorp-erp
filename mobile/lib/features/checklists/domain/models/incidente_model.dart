import 'dart:convert';

class IncidenteModel {
  final String id;
  final String idEquipo;
  final String? idChecklist;
  final String descripcion;
  final String severidad; // 'MINOR', 'MAJOR', 'CRITICAL'
  final double? horasEstimadas;
  final List<String> rutasFotos;
  final String estadoSincronizacion; // 'PENDING_SYNC'

  const IncidenteModel({
    required this.id,
    required this.idEquipo,
    this.idChecklist,
    required this.descripcion,
    required this.severidad,
    this.horasEstimadas,
    required this.rutasFotos,
    required this.estadoSincronizacion,
  });

  IncidenteModel copyWith({
    String? id,
    String? idEquipo,
    String? idChecklist,
    String? descripcion,
    String? severidad,
    double? horasEstimadas,
    List<String>? rutasFotos,
    String? estadoSincronizacion,
  }) {
    return IncidenteModel(
      id: id ?? this.id,
      idEquipo: idEquipo ?? this.idEquipo,
      idChecklist: idChecklist ?? this.idChecklist,
      descripcion: descripcion ?? this.descripcion,
      severidad: severidad ?? this.severidad,
      horasEstimadas: horasEstimadas ?? this.horasEstimadas,
      rutasFotos: rutasFotos ?? this.rutasFotos,
      estadoSincronizacion: estadoSincronizacion ?? this.estadoSincronizacion,
    );
  }

  factory IncidenteModel.fromMap(Map<String, dynamic> map) {
    List<String> fotos = [];
    if (map['rutas_fotos'] != null &&
        map['rutas_fotos'].toString().isNotEmpty) {
      try {
        fotos = List<String>.from(jsonDecode(map['rutas_fotos'] as String));
      } catch (e) {
        // Fallback for comma separated just in case
        fotos = map['rutas_fotos']
            .toString()
            .split(',')
            .where((e) => e.isNotEmpty)
            .toList();
      }
    }

    return IncidenteModel(
      id: map['id'] as String,
      idEquipo: map['id_equipo'] as String,
      idChecklist: map['id_checklist'] as String?,
      descripcion: map['descripcion'] as String,
      severidad: map['severidad'] as String,
      horasEstimadas: map['horas_estimadas'] as double?,
      rutasFotos: fotos,
      estadoSincronizacion: map['estado_sincronizacion'] as String,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'id_equipo': idEquipo,
      'id_checklist': idChecklist,
      'descripcion': descripcion,
      'severidad': severidad,
      'horas_estimadas': horasEstimadas,
      'rutas_fotos': jsonEncode(rutasFotos),
      'estado_sincronizacion': estadoSincronizacion,
    };
  }
}
