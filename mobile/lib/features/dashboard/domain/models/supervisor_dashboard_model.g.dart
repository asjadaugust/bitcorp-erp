// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'supervisor_dashboard_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ObservationModel _$ObservationModelFromJson(Map<String, dynamic> json) =>
    _ObservationModel(
      id: json['id'] as String,
      fecha: json['fecha'] as String,
      equipoId: json['equipoId'] as String,
      equipoCodigo: json['equipoCodigo'] as String,
      descripcion: json['descripcion'] as String,
      photoUrl: json['photoUrl'] as String?,
      estado: json['estado'] as String,
    );

Map<String, dynamic> _$ObservationModelToJson(_ObservationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'fecha': instance.fecha,
      'equipoId': instance.equipoId,
      'equipoCodigo': instance.equipoCodigo,
      'descripcion': instance.descripcion,
      'photoUrl': instance.photoUrl,
      'estado': instance.estado,
    };

_SupervisorDashboardModel _$SupervisorDashboardModelFromJson(
  Map<String, dynamic> json,
) => _SupervisorDashboardModel(
  totalEquipos: (json['totalEquipos'] as num).toInt(),
  inspeccionadosPeriodo: (json['inspeccionadosPeriodo'] as num).toInt(),
  inspeccionesVencidas: (json['inspeccionesVencidas'] as num).toInt(),
  observacionesAbiertas: (json['observacionesAbiertas'] as List<dynamic>)
      .map((e) => ObservationModel.fromJson(e as Map<String, dynamic>))
      .toList(),
);

Map<String, dynamic> _$SupervisorDashboardModelToJson(
  _SupervisorDashboardModel instance,
) => <String, dynamic>{
  'totalEquipos': instance.totalEquipos,
  'inspeccionadosPeriodo': instance.inspeccionadosPeriodo,
  'inspeccionesVencidas': instance.inspeccionesVencidas,
  'observacionesAbiertas': instance.observacionesAbiertas,
};
