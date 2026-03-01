// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'approval_request_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ApprovalRequestModel _$ApprovalRequestModelFromJson(
  Map<String, dynamic> json,
) => _ApprovalRequestModel(
  id: json['id'] as String,
  tipo: json['tipo'] as String,
  titulo: json['titulo'] as String,
  descripcion: json['descripcion'] as String,
  solicitante: json['solicitante'] as Map<String, dynamic>,
  fechaCreacion: DateTime.parse(json['fecha_creacion'] as String),
  estado: json['estado'] as String,
  adjuntos:
      (json['adjuntos'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
  lineaTiempo:
      (json['linea_tiempo'] as List<dynamic>?)
          ?.map((e) => ApprovalTimelineNode.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$ApprovalRequestModelToJson(
  _ApprovalRequestModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'tipo': instance.tipo,
  'titulo': instance.titulo,
  'descripcion': instance.descripcion,
  'solicitante': instance.solicitante,
  'fecha_creacion': instance.fechaCreacion.toIso8601String(),
  'estado': instance.estado,
  'adjuntos': instance.adjuntos,
  'linea_tiempo': instance.lineaTiempo,
};

_ApprovalTimelineNode _$ApprovalTimelineNodeFromJson(
  Map<String, dynamic> json,
) => _ApprovalTimelineNode(
  paso: (json['paso'] as num).toInt(),
  estado: json['estado'] as String,
  aprobador: json['aprobador'] as Map<String, dynamic>,
  fechaCompletado: json['fecha_completado'] == null
      ? null
      : DateTime.parse(json['fecha_completado'] as String),
  comentario: json['comentario'] as String?,
);

Map<String, dynamic> _$ApprovalTimelineNodeToJson(
  _ApprovalTimelineNode instance,
) => <String, dynamic>{
  'paso': instance.paso,
  'estado': instance.estado,
  'aprobador': instance.aprobador,
  'fecha_completado': instance.fechaCompletado?.toIso8601String(),
  'comentario': instance.comentario,
};
