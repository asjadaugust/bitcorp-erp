import 'package:freezed_annotation/freezed_annotation.dart';

part 'vale_combustible_model.freezed.dart';
part 'vale_combustible_model.g.dart';

@freezed
abstract class ValeCombustibleModel with _$ValeCombustibleModel {
  const factory ValeCombustibleModel({
    @JsonKey(fromJson: _idFromJson) required String id,
    String? codigo,
    @JsonKey(name: 'numero_vale') required String numeroVale,
    @JsonKey(name: 'fecha') required DateTime fecha,
    @JsonKey(name: 'tipo_combustible') required String tipoCombustible,
    @JsonKey(name: 'cantidad_galones') required double cantidadGalones,
    @JsonKey(name: 'precio_unitario') double? precioUnitario,
    @JsonKey(name: 'monto_total') double? montoTotal,
    @JsonKey(name: 'equipo_id', fromJson: _idFromJson) required String equipoId,
    @JsonKey(name: 'foto_path') String? fotoPath,
    @JsonKey(name: 'observaciones') String? observaciones,
    @JsonKey(name: 'estado')
    @Default('PENDIENTE')
    String estado, // Backend states: PENDIENTE, REGISTRADO, ANULADO
    @JsonKey(name: 'sync_status')
    @Default('PENDING_SYNC')
    String syncStatus,
  }) = _ValeCombustibleModel;

  factory ValeCombustibleModel.fromJson(Map<String, dynamic> json) =>
      _$ValeCombustibleModelFromJson(json);
}

String _idFromJson(dynamic value) => value.toString();
