import 'package:freezed_annotation/freezed_annotation.dart';

part 'vale_combustible_model.freezed.dart';
part 'vale_combustible_model.g.dart';

@freezed
class ValeCombustibleModel with _$ValeCombustibleModel {
  const factory ValeCombustibleModel({
    required String id,
    @JsonKey(name: 'numero_vale') required String numeroVale,
    @JsonKey(name: 'fecha') required DateTime fecha,
    @JsonKey(name: 'tipo_combustible') required String tipoCombustible,
    @JsonKey(name: 'cantidad_galones') required double cantidadGalones,
    @JsonKey(name: 'precio_unitario') double? precioUnitario,
    @JsonKey(name: 'id_equipo') required String idEquipo,
    @JsonKey(name: 'foto_path') required String fotoPath,
    @JsonKey(name: 'notas') String? notas,
    @JsonKey(name: 'estado')
    @Default('NO_VINCULADO')
    String estado, // 'NO_VINCULADO' or 'VINCULADO'
    @JsonKey(name: 'sync_status')
    @Default('PENDING_SYNC')
    String syncStatus, // 'PENDING_SYNC', 'SUBMITTED', 'ERROR'
  }) = _ValeCombustibleModel;

  factory ValeCombustibleModel.fromJson(Map<String, dynamic> json) =>
      _$ValeCombustibleModelFromJson(json);
}
