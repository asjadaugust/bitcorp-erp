// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'equipment_detail_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_EquipmentDetailModel _$EquipmentDetailModelFromJson(
  Map<String, dynamic> json,
) => _EquipmentDetailModel(
  id: json['id'] as String,
  codigo: json['codigo'] as String,
  descripcion: json['descripcion'] as String,
  marca: json['marca'] as String,
  modelo: json['modelo'] as String,
  anio: (json['anio'] as num).toInt(),
  placa: json['placa'] as String,
  contrato: ContractModel.fromJson(json['contrato'] as Map<String, dynamic>),
  documentos: (json['documentos'] as List<dynamic>)
      .map((e) => DocumentComplianceModel.fromJson(e as Map<String, dynamic>))
      .toList(),
);

Map<String, dynamic> _$EquipmentDetailModelToJson(
  _EquipmentDetailModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'codigo': instance.codigo,
  'descripcion': instance.descripcion,
  'marca': instance.marca,
  'modelo': instance.modelo,
  'anio': instance.anio,
  'placa': instance.placa,
  'contrato': instance.contrato,
  'documentos': instance.documentos,
};

_ContractModel _$ContractModelFromJson(Map<String, dynamic> json) =>
    _ContractModel(
      estado: json['estado'] as String,
      tipoTarifa: json['tipo_tarifa'] as String,
      anexoA: (json['anexo_a'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
    );

Map<String, dynamic> _$ContractModelToJson(_ContractModel instance) =>
    <String, dynamic>{
      'estado': instance.estado,
      'tipo_tarifa': instance.tipoTarifa,
      'anexo_a': instance.anexoA,
    };

_DocumentComplianceModel _$DocumentComplianceModelFromJson(
  Map<String, dynamic> json,
) => _DocumentComplianceModel(
  tipo: json['tipo'] as String,
  fechaVencimiento: DateTime.parse(json['fecha_vencimiento'] as String),
  estado: json['estado'] as String,
);

Map<String, dynamic> _$DocumentComplianceModelToJson(
  _DocumentComplianceModel instance,
) => <String, dynamic>{
  'tipo': instance.tipo,
  'fecha_vencimiento': instance.fechaVencimiento.toIso8601String(),
  'estado': instance.estado,
};
