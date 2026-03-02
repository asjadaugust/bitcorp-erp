// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'equipment_detail_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_EquipmentDetailModel _$EquipmentDetailModelFromJson(
  Map<String, dynamic> json,
) => _EquipmentDetailModel(
  id: (json['id'] as num).toInt(),
  codigoEquipo: json['codigo_equipo'] as String,
  marca: json['marca'] as String,
  modelo: json['modelo'] as String,
  anioFabricacion: (json['anio_fabricacion'] as num?)?.toInt(),
  placa: json['placa'] as String?,
  estado: json['estado'] as String?,
  tipoProveedor: json['tipo_proveedor'] as String?,
  medidorUso: json['medidor_uso'] as String?,
  proveedorRazonSocial: json['proveedor_razon_social'] as String?,
  tipoEquipoNombre: json['tipo_equipo_nombre'] as String?,
  categoriaPrd: json['categoria_prd'] as String?,
  fechaVencSoat: json['fecha_venc_soat'] as String?,
  fechaVencCitv: json['fecha_venc_citv'] as String?,
  fechaVencPoliza: json['fecha_venc_poliza'] as String?,
);

Map<String, dynamic> _$EquipmentDetailModelToJson(
  _EquipmentDetailModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'codigo_equipo': instance.codigoEquipo,
  'marca': instance.marca,
  'modelo': instance.modelo,
  'anio_fabricacion': instance.anioFabricacion,
  'placa': instance.placa,
  'estado': instance.estado,
  'tipo_proveedor': instance.tipoProveedor,
  'medidor_uso': instance.medidorUso,
  'proveedor_razon_social': instance.proveedorRazonSocial,
  'tipo_equipo_nombre': instance.tipoEquipoNombre,
  'categoria_prd': instance.categoriaPrd,
  'fecha_venc_soat': instance.fechaVencSoat,
  'fecha_venc_citv': instance.fechaVencCitv,
  'fecha_venc_poliza': instance.fechaVencPoliza,
};
