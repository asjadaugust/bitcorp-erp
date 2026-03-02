import 'package:freezed_annotation/freezed_annotation.dart';

part 'approval_request_model.freezed.dart';
part 'approval_request_model.g.dart';

@freezed
abstract class ApprovalRequestModel with _$ApprovalRequestModel {
  const factory ApprovalRequestModel({
    required int id,
    @JsonKey(name: 'module_name') String? moduleName,
    @JsonKey(name: 'entity_id') int? entityId,
    required String titulo,
    @Default('') String descripcion,
    required String estado,
    @JsonKey(name: 'paso_actual') int? pasoActual,
    @JsonKey(name: 'fecha_creacion') required DateTime fechaCreacion,
    @JsonKey(name: 'usuario_solicitante_id') int? usuarioSolicitanteId,
    // UI-facing fields (populated from detail endpoint or local mock)
    @Default({}) Map<String, dynamic> solicitante,
    @Default([]) List<String> adjuntos,
    @JsonKey(name: 'linea_tiempo')
    @Default([])
    List<ApprovalTimelineNode> lineaTiempo,
  }) = _ApprovalRequestModel;

  factory ApprovalRequestModel.fromJson(Map<String, dynamic> json) =>
      _$ApprovalRequestModelFromJson(json);
}

@freezed
abstract class ApprovalTimelineNode with _$ApprovalTimelineNode {
  const factory ApprovalTimelineNode({
    required int paso,
    required String estado,
    required Map<String, dynamic> aprobador,
    @JsonKey(name: 'fecha_completado') DateTime? fechaCompletado,
    String? comentario,
  }) = _ApprovalTimelineNode;

  factory ApprovalTimelineNode.fromJson(Map<String, dynamic> json) =>
      _$ApprovalTimelineNodeFromJson(json);
}
