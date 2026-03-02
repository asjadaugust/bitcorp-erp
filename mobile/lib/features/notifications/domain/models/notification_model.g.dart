// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_NotificationModel _$NotificationModelFromJson(Map<String, dynamic> json) =>
    _NotificationModel(
      id: (json['id'] as num).toInt(),
      title: json['titulo'] as String,
      message: json['mensaje'] as String,
      isRead: json['leido'] as bool,
      createdAtStr: json['created_at'] as String,
      tipo: json['tipo'] as String?,
      url: json['url'] as String?,
    );

Map<String, dynamic> _$NotificationModelToJson(_NotificationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'titulo': instance.title,
      'mensaje': instance.message,
      'leido': instance.isRead,
      'created_at': instance.createdAtStr,
      'tipo': instance.tipo,
      'url': instance.url,
    };
