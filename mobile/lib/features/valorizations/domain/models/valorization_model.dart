import 'package:freezed_annotation/freezed_annotation.dart';

part 'valorization_model.freezed.dart';
part 'valorization_model.g.dart';

@freezed
class ValorizationModel with _$ValorizationModel {
  const factory ValorizationModel({
    required String id,
    required String periodo,
    @JsonKey(name: 'monto_bruto') required double montoBruto,
    required Map<String, double> deducciones,
    @JsonKey(name: 'monto_neto') required double montoNeto,
    required String estado,
  }) = _ValorizationModel;

  factory ValorizationModel.fromJson(Map<String, dynamic> json) =>
      _$ValorizationModelFromJson(json);
}
