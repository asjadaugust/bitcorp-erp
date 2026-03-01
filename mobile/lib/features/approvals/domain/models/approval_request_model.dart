import 'package:freezed_annotation/freezed_annotation.dart';

part 'approval_request_model.freezed.dart';
part 'approval_request_model.g.dart';

@freezed
class ApprovalRequestModel with _$ApprovalRequestModel {
  const factory ApprovalRequestModel({
    required String id,
    required String tipo,
    required String titulo,
    required String descripcion,
    required Map<String, dynamic> solicitante,
    @JsonKey(name: 'fecha_creacion') required DateTime fechaCreacion,
    required String estado,
    @Default([]) List<String> adjuntos,
    @JsonKey(name: 'linea_tiempo')
    @Default([])
    List<ApprovalTimelineNode> lineaTiempo,
  }) = _ApprovalRequestModel;

  factory ApprovalRequestModel.fromJson(Map<String, dynamic> json) =>
      _$ApprovalRequestModelFromJson(json);
}

@freezed
class ApprovalTimelineNode with _$ApprovalTimelineNode {
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
