// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'valorization_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ValorizationModel _$ValorizationModelFromJson(Map<String, dynamic> json) =>
    _ValorizationModel(
      id: (json['id'] as num).toInt(),
      periodo: json['periodo'] as String,
      numeroValorizacion: json['numero_valorizacion'] as String?,
      equipoId: (json['equipo_id'] as num?)?.toInt(),
      contratoId: (json['contrato_id'] as num?)?.toInt(),
      fechaInicio: json['fecha_inicio'] as String?,
      fechaFin: json['fecha_fin'] as String?,
      diasTrabajados: (json['dias_trabajados'] as num?)?.toInt(),
      horasTrabajadas: (json['horas_trabajadas'] as num?)?.toDouble(),
      totalValorizado: (json['total_valorizado'] as num?)?.toDouble() ?? 0,
      igvMonto: (json['igv_monto'] as num?)?.toDouble(),
      totalConIgv: (json['total_con_igv'] as num?)?.toDouble() ?? 0,
      estado: json['estado'] as String,
      codigoEquipo: json['codigo_equipo'] as String?,
      equipoMarca: json['equipo_marca'] as String?,
      equipoModelo: json['equipo_modelo'] as String?,
    );

Map<String, dynamic> _$ValorizationModelToJson(_ValorizationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'periodo': instance.periodo,
      'numero_valorizacion': instance.numeroValorizacion,
      'equipo_id': instance.equipoId,
      'contrato_id': instance.contratoId,
      'fecha_inicio': instance.fechaInicio,
      'fecha_fin': instance.fechaFin,
      'dias_trabajados': instance.diasTrabajados,
      'horas_trabajadas': instance.horasTrabajadas,
      'total_valorizado': instance.totalValorizado,
      'igv_monto': instance.igvMonto,
      'total_con_igv': instance.totalConIgv,
      'estado': instance.estado,
      'codigo_equipo': instance.codigoEquipo,
      'equipo_marca': instance.equipoMarca,
      'equipo_modelo': instance.equipoModelo,
    };
