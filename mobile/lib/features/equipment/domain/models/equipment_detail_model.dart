import 'package:freezed_annotation/freezed_annotation.dart';

part 'equipment_detail_model.freezed.dart';
part 'equipment_detail_model.g.dart';

@freezed
abstract class EquipmentDetailModel with _$EquipmentDetailModel {
  const EquipmentDetailModel._();

  const factory EquipmentDetailModel({
    required int id,
    @JsonKey(name: 'codigo_equipo') required String codigoEquipo,
    required String marca,
    required String modelo,
    @JsonKey(name: 'anio_fabricacion') int? anioFabricacion,
    String? placa,
    String? estado,
    @JsonKey(name: 'tipo_proveedor') String? tipoProveedor,
    @JsonKey(name: 'medidor_uso') String? medidorUso,
    @JsonKey(name: 'proveedor_razon_social') String? proveedorRazonSocial,
    @JsonKey(name: 'tipo_equipo_nombre') String? tipoEquipoNombre,
    @JsonKey(name: 'categoria_prd') String? categoriaPrd,
    @JsonKey(name: 'fecha_venc_soat') String? fechaVencSoat,
    @JsonKey(name: 'fecha_venc_citv') String? fechaVencCitv,
    @JsonKey(name: 'fecha_venc_poliza') String? fechaVencPoliza,
  }) = _EquipmentDetailModel;

  /// Human-readable description derived from marca + modelo
  String get descripcion => '$marca $modelo';

  /// Build document compliance list from flat date fields
  List<DocumentComplianceModel> get documentos {
    final docs = <DocumentComplianceModel>[];
    if (fechaVencSoat != null) {
      docs.add(DocumentComplianceModel(
        tipo: 'SOAT',
        fechaVencimiento: fechaVencSoat!,
        estado: _calcDocEstado(fechaVencSoat!),
      ));
    }
    if (fechaVencCitv != null) {
      docs.add(DocumentComplianceModel(
        tipo: 'CITV',
        fechaVencimiento: fechaVencCitv!,
        estado: _calcDocEstado(fechaVencCitv!),
      ));
    }
    if (fechaVencPoliza != null) {
      docs.add(DocumentComplianceModel(
        tipo: 'POLIZA',
        fechaVencimiento: fechaVencPoliza!,
        estado: _calcDocEstado(fechaVencPoliza!),
      ));
    }
    return docs;
  }

  static String _calcDocEstado(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      if (date.isBefore(now)) return 'EXPIRED';
      if (date.isBefore(now.add(const Duration(days: 30)))) return 'WARNING';
      return 'VALID';
    } catch (_) {
      return 'UNKNOWN';
    }
  }

  factory EquipmentDetailModel.fromJson(Map<String, dynamic> json) =>
      _$EquipmentDetailModelFromJson({
        ...json,
        'marca': (json['marca'] as String?) ?? '-',
        'modelo': (json['modelo'] as String?) ?? '-',
      });
}

@freezed
abstract class DocumentComplianceModel with _$DocumentComplianceModel {
  const factory DocumentComplianceModel({
    required String tipo,
    required String fechaVencimiento,
    required String estado,
  }) = _DocumentComplianceModel;
}
