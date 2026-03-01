// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vale_combustible_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ValeCombustibleModel _$ValeCombustibleModelFromJson(
  Map<String, dynamic> json,
) => _ValeCombustibleModel(
  id: json['id'] as String,
  numeroVale: json['numero_vale'] as String,
  fecha: DateTime.parse(json['fecha'] as String),
  tipoCombustible: json['tipo_combustible'] as String,
  cantidadGalones: (json['cantidad_galones'] as num).toDouble(),
  precioUnitario: (json['precio_unitario'] as num?)?.toDouble(),
  idEquipo: json['id_equipo'] as String,
  fotoPath: json['foto_path'] as String,
  notas: json['notas'] as String?,
  estado: json['estado'] as String? ?? 'NO_VINCULADO',
  syncStatus: json['sync_status'] as String? ?? 'PENDING_SYNC',
);

Map<String, dynamic> _$ValeCombustibleModelToJson(
  _ValeCombustibleModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'numero_vale': instance.numeroVale,
  'fecha': instance.fecha.toIso8601String(),
  'tipo_combustible': instance.tipoCombustible,
  'cantidad_galones': instance.cantidadGalones,
  'precio_unitario': instance.precioUnitario,
  'id_equipo': instance.idEquipo,
  'foto_path': instance.fotoPath,
  'notas': instance.notas,
  'estado': instance.estado,
  'sync_status': instance.syncStatus,
};
