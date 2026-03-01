import 'report_event_model.dart';
import 'report_photo_model.dart';

class DailyReportModel {
  final String id;
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

  final List<ReportEventModel> events;
  final List<ReportPhotoModel> photos;

  const DailyReportModel({
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
    this.events = const [],
    this.photos = const [],
  });

  factory DailyReportModel.fromJson(Map<String, dynamic> json) {
    var eventsList = json['events'] as List<dynamic>? ?? [];
    var photosList = json['photos'] as List<dynamic>? ?? [];

    return DailyReportModel(
      id: json['id'] as String,
      date: json['date'] as String,
      equipmentId: json['equipmentId'] as String,
      startHourMeter: (json['startHourMeter'] as num).toDouble(),
      endHourMeter: (json['endHourMeter'] as num).toDouble(),
      startOdometer: json['startOdometer'] != null
          ? (json['startOdometer'] as num).toDouble()
          : null,
      endOdometer: json['endOdometer'] != null
          ? (json['endOdometer'] as num).toDouble()
          : null,
      effectiveHours: (json['effectiveHours'] as num).toDouble(),
      activityDescription: json['activityDescription'] as String? ?? '',
      observations: json['observations'] as String?,
      signaturePath: json['signaturePath'] as String?,
      syncStatus: json['syncStatus'] as String? ?? 'DRAFT',
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
      'events': events.map((e) => e.toJson()).toList(),
      'photos': photos.map((e) => e.toJson()).toList(),
    };
  }

  DailyReportModel copyWith({
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
    List<ReportEventModel>? events,
    List<ReportPhotoModel>? photos,
  }) {
    return DailyReportModel(
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
      events: events ?? this.events,
      photos: photos ?? this.photos,
    );
  }
}
