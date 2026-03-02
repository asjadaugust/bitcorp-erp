// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vale_combustible_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ValeCombustibleModel _$ValeCombustibleModelFromJson(
  Map<String, dynamic> json,
) => _ValeCombustibleModel(
  id: _idFromJson(json['id']),
  codigo: json['codigo'] as String?,
  numeroVale: json['numero_vale'] as String,
  fecha: DateTime.parse(json['fecha'] as String),
  tipoCombustible: json['tipo_combustible'] as String,
  cantidadGalones: (json['cantidad_galones'] as num).toDouble(),
  precioUnitario: (json['precio_unitario'] as num?)?.toDouble(),
  montoTotal: (json['monto_total'] as num?)?.toDouble(),
  equipoId: _idFromJson(json['equipo_id']),
  fotoPath: json['foto_path'] as String?,
  observaciones: json['observaciones'] as String?,
  estado: json['estado'] as String? ?? 'PENDIENTE',
  syncStatus: json['sync_status'] as String? ?? 'PENDING_SYNC',
);

Map<String, dynamic> _$ValeCombustibleModelToJson(
  _ValeCombustibleModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'codigo': instance.codigo,
  'numero_vale': instance.numeroVale,
  'fecha': instance.fecha.toIso8601String(),
  'tipo_combustible': instance.tipoCombustible,
  'cantidad_galones': instance.cantidadGalones,
  'precio_unitario': instance.precioUnitario,
  'monto_total': instance.montoTotal,
  'equipo_id': instance.equipoId,
  'foto_path': instance.fotoPath,
  'observaciones': instance.observaciones,
  'estado': instance.estado,
  'sync_status': instance.syncStatus,
};
