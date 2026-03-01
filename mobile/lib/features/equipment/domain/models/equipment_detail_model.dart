import 'package:freezed_annotation/freezed_annotation.dart';

part 'equipment_detail_model.freezed.dart';
part 'equipment_detail_model.g.dart';

@freezed
class EquipmentDetailModel with _$EquipmentDetailModel {
  const factory EquipmentDetailModel({
    required String id,
    required String codigo,
    required String descripcion,
    required String marca,
    required String modelo,
    required int anio,
    required String placa,
    required ContractModel contrato,
    required List<DocumentComplianceModel> documentos,
  }) = _EquipmentDetailModel;

  factory EquipmentDetailModel.fromJson(Map<String, dynamic> json) =>
      _$EquipmentDetailModelFromJson(json);
}

@freezed
class ContractModel with _$ContractModel {
  const factory ContractModel({
    required String estado,
    @JsonKey(name: 'tipo_tarifa') required String tipoTarifa,
    @JsonKey(name: 'anexo_a') required List<String> anexoA,
  }) = _ContractModel;

  factory ContractModel.fromJson(Map<String, dynamic> json) =>
      _$ContractModelFromJson(json);
}

@freezed
class DocumentComplianceModel with _$DocumentComplianceModel {
  const factory DocumentComplianceModel({
    required String tipo,
    @JsonKey(name: 'fecha_vencimiento') required DateTime fechaVencimiento,
    required String estado,
  }) = _DocumentComplianceModel;

  factory DocumentComplianceModel.fromJson(Map<String, dynamic> json) =>
      _$DocumentComplianceModelFromJson(json);
}
