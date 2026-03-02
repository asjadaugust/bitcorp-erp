import 'package:freezed_annotation/freezed_annotation.dart';

part 'supervisor_dashboard_model.freezed.dart';
part 'supervisor_dashboard_model.g.dart';

@freezed
abstract class ObservationModel with _$ObservationModel {
  const factory ObservationModel({
    required String id,
    required String fecha,
    required String equipoId,
    required String equipoCodigo,
    required String descripcion,
    String? photoUrl,
    required String estado, // PENDIENTE, RESUELTO
  }) = _ObservationModel;

  factory ObservationModel.fromJson(Map<String, dynamic> json) =>
      _$ObservationModelFromJson(json);
}

@freezed
abstract class SupervisorDashboardModel with _$SupervisorDashboardModel {
  const factory SupervisorDashboardModel({
    required int totalEquipos,
    required int inspeccionadosPeriodo,
    required int inspeccionesVencidas,
    required List<ObservationModel> observacionesAbiertas,
  }) = _SupervisorDashboardModel;

  factory SupervisorDashboardModel.fromJson(Map<String, dynamic> json) =>
      _$SupervisorDashboardModelFromJson(json);
}
