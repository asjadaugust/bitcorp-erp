// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'valorization_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ValorizationModel _$ValorizationModelFromJson(Map<String, dynamic> json) =>
    _ValorizationModel(
      id: json['id'] as String,
      periodo: json['periodo'] as String,
      montoBruto: (json['monto_bruto'] as num).toDouble(),
      deducciones: (json['deducciones'] as Map<String, dynamic>).map(
        (k, e) => MapEntry(k, (e as num).toDouble()),
      ),
      montoNeto: (json['monto_neto'] as num).toDouble(),
      estado: json['estado'] as String,
    );

Map<String, dynamic> _$ValorizationModelToJson(_ValorizationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'periodo': instance.periodo,
      'monto_bruto': instance.montoBruto,
      'deducciones': instance.deducciones,
      'monto_neto': instance.montoNeto,
      'estado': instance.estado,
    };
