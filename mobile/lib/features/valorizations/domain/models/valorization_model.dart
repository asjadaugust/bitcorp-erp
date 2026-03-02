import 'package:freezed_annotation/freezed_annotation.dart';

part 'valorization_model.freezed.dart';
part 'valorization_model.g.dart';

@freezed
abstract class ValorizationModel with _$ValorizationModel {
  const factory ValorizationModel({
    required int id,
    required String periodo,
    @JsonKey(name: 'numero_valorizacion') String? numeroValorizacion,
    @JsonKey(name: 'equipo_id') int? equipoId,
    @JsonKey(name: 'contrato_id') int? contratoId,
    @JsonKey(name: 'fecha_inicio') String? fechaInicio,
    @JsonKey(name: 'fecha_fin') String? fechaFin,
    @JsonKey(name: 'dias_trabajados') int? diasTrabajados,
    @JsonKey(name: 'horas_trabajadas') double? horasTrabajadas,
    @JsonKey(name: 'total_valorizado') @Default(0) double totalValorizado,
    @JsonKey(name: 'igv_monto') double? igvMonto,
    @JsonKey(name: 'total_con_igv') @Default(0) double totalConIgv,
    required String estado,
    @JsonKey(name: 'codigo_equipo') String? codigoEquipo,
    @JsonKey(name: 'equipo_marca') String? equipoMarca,
    @JsonKey(name: 'equipo_modelo') String? equipoModelo,
  }) = _ValorizationModel;

  factory ValorizationModel.fromJson(Map<String, dynamic> json) =>
      _$ValorizationModelFromJson(json);
}
