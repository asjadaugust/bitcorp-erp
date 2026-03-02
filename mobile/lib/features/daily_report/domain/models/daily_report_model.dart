import 'report_event_model.dart';
import 'report_photo_model.dart';

class DailyReportModel {
  final int? serverId; // Backend int ID (null for local-only drafts)
  final String id; // Local UUID for offline-first
  final String date;
  final String equipmentId;
  final double startHourMeter;
  final double endHourMeter;
  final double? startOdometer;
  final double? endOdometer;
  final double effectiveHours;
  final String activityDescription;
  final String? observations;
  final String? signaturePath;
  final String syncStatus;
  final String? idValeCombustible;
  final String? estado;
  final String? codigo;
  final String? equipoCodigo;

  final List<ReportEventModel> events;
  final List<ReportPhotoModel> photos;

  const DailyReportModel({
    this.serverId,
    required this.id,
    required this.date,
    required this.equipmentId,
    required this.startHourMeter,
    required this.endHourMeter,
    this.startOdometer,
    this.endOdometer,
    required this.effectiveHours,
    required this.activityDescription,
    this.observations,
    this.signaturePath,
    required this.syncStatus,
    this.idValeCombustible,
    this.estado,
    this.codigo,
    this.equipoCodigo,
    this.events = const [],
    this.photos = const [],
  });

  /// Parse from backend API response (snake_case fields)
  factory DailyReportModel.fromApiJson(Map<String, dynamic> json) {
    return DailyReportModel(
      serverId: json['id'] as int?,
      id: (json['id'] ?? '').toString(),
      date: json['fecha'] as String? ?? '',
      equipmentId: (json['equipo_id'] ?? '').toString(),
      startHourMeter: (json['horometro_inicial'] as num?)?.toDouble() ?? 0,
      endHourMeter: (json['horometro_final'] as num?)?.toDouble() ?? 0,
      startOdometer: null,
      endOdometer: null,
      effectiveHours: (json['horas_trabajadas'] as num?)?.toDouble() ?? 0,
      activityDescription: json['descripcion_actividad'] as String? ?? '',
      observations: json['observaciones'] as String?,
      syncStatus: 'SYNCED',
      estado: json['estado'] as String?,
      codigo: json['codigo'] as String?,
      equipoCodigo: json['equipo_codigo'] as String?,
    );
  }

  /// Parse from local SQLite (camelCase fields, used by DailyReportLocalSource)
  factory DailyReportModel.fromJson(Map<String, dynamic> json) {
    var eventsList = json['events'] as List<dynamic>? ?? [];
    var photosList = json['photos'] as List<dynamic>? ?? [];

    return DailyReportModel(
      id: json['id'].toString(),
      date: json['date'] as String? ?? json['fecha'] as String? ?? '',
      equipmentId: (json['equipmentId'] ?? json['equipo_id'] ?? '').toString(),
      startHourMeter: (json['startHourMeter'] as num?)?.toDouble() ??
          (json['horometro_inicial'] as num?)?.toDouble() ??
          0,
      endHourMeter: (json['endHourMeter'] as num?)?.toDouble() ??
          (json['horometro_final'] as num?)?.toDouble() ??
          0,
      startOdometer: json['startOdometer'] != null
          ? (json['startOdometer'] as num).toDouble()
          : null,
      endOdometer: json['endOdometer'] != null
          ? (json['endOdometer'] as num).toDouble()
          : null,
      effectiveHours: (json['effectiveHours'] as num?)?.toDouble() ??
          (json['horas_trabajadas'] as num?)?.toDouble() ??
          0,
      activityDescription: json['activityDescription'] as String? ??
          json['descripcion_actividad'] as String? ??
          '',
      observations:
          json['observations'] as String? ?? json['observaciones'] as String?,
      signaturePath: json['signaturePath'] as String?,
      syncStatus: json['syncStatus'] as String? ?? 'DRAFT',
      idValeCombustible: json['idValeCombustible'] as String?,
      estado: json['estado'] as String?,
      codigo: json['codigo'] as String?,
      equipoCodigo: json['equipo_codigo'] as String?,
      events: eventsList
          .map((e) => ReportEventModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      photos: photosList
          .map((e) => ReportPhotoModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'date': date,
      'equipmentId': equipmentId,
      'startHourMeter': startHourMeter,
      'endHourMeter': endHourMeter,
      'startOdometer': startOdometer,
      'endOdometer': endOdometer,
      'effectiveHours': effectiveHours,
      'activityDescription': activityDescription,
      'observations': observations,
      'signaturePath': signaturePath,
      'syncStatus': syncStatus,
      'idValeCombustible': idValeCombustible,
      'events': events.map((e) => e.toJson()).toList(),
      'photos': photos.map((e) => e.toJson()).toList(),
    };
  }

  /// Convert to backend API format (snake_case) for POST/PUT
  Map<String, dynamic> toApiJson() {
    return {
      'fecha': date,
      'equipo_id': int.tryParse(equipmentId) ?? equipmentId,
      'horometro_inicial': startHourMeter,
      'horometro_final': endHourMeter,
      'horas_trabajadas': effectiveHours,
      'descripcion_actividad': activityDescription,
      'observaciones': observations,
    };
  }

  DailyReportModel copyWith({
    int? serverId,
    String? id,
    String? date,
    String? equipmentId,
    double? startHourMeter,
    double? endHourMeter,
    double? startOdometer,
    double? endOdometer,
    double? effectiveHours,
    String? activityDescription,
    String? observations,
    String? signaturePath,
    String? syncStatus,
    String? idValeCombustible,
    String? estado,
    String? codigo,
    String? equipoCodigo,
    List<ReportEventModel>? events,
    List<ReportPhotoModel>? photos,
  }) {
    return DailyReportModel(
      serverId: serverId ?? this.serverId,
      id: id ?? this.id,
      date: date ?? this.date,
      equipmentId: equipmentId ?? this.equipmentId,
      startHourMeter: startHourMeter ?? this.startHourMeter,
      endHourMeter: endHourMeter ?? this.endHourMeter,
      startOdometer: startOdometer ?? this.startOdometer,
      endOdometer: endOdometer ?? this.endOdometer,
      effectiveHours: effectiveHours ?? this.effectiveHours,
      activityDescription: activityDescription ?? this.activityDescription,
      observations: observations ?? this.observations,
      signaturePath: signaturePath ?? this.signaturePath,
      syncStatus: syncStatus ?? this.syncStatus,
      idValeCombustible: idValeCombustible ?? this.idValeCombustible,
      estado: estado ?? this.estado,
      codigo: codigo ?? this.codigo,
      equipoCodigo: equipoCodigo ?? this.equipoCodigo,
      events: events ?? this.events,
      photos: photos ?? this.photos,
    );
  }
}
