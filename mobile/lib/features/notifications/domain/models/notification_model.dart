import 'package:freezed_annotation/freezed_annotation.dart';

part 'notification_model.freezed.dart';
part 'notification_model.g.dart';

@freezed
abstract class NotificationModel with _$NotificationModel {
  const factory NotificationModel({
    required int id,
    @JsonKey(name: 'titulo') required String title,
    @JsonKey(name: 'mensaje') required String message,
    @JsonKey(name: 'leido') required bool isRead,
    @JsonKey(name: 'created_at') required String createdAtStr,
    String? tipo,
    String? url,
  }) = _NotificationModel;

  const NotificationModel._();

  DateTime get createdAt => DateTime.tryParse(createdAtStr) ?? DateTime.now();

  /// String ID for backward compatibility with UI code
  String get stringId => id.toString();

  factory NotificationModel.fromJson(Map<String, dynamic> json) =>
      _$NotificationModelFromJson(json);
}
