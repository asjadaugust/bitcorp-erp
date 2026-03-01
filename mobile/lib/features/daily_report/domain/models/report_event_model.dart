class ReportEventModel {
  final String id;
  final String eventType;
  final String startTime;
  final String endTime;
  final double duration;
  final String reason;

  const ReportEventModel({
    required this.id,
    required this.eventType,
    required this.startTime,
    required this.endTime,
    required this.duration,
    required this.reason,
  });

  factory ReportEventModel.fromJson(Map<String, dynamic> json) {
    return ReportEventModel(
      id: json['id'] as String,
      eventType: json['eventType'] as String,
      startTime: json['startTime'] as String,
      endTime: json['endTime'] as String,
      duration: (json['duration'] as num).toDouble(),
      reason: json['reason'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'eventType': eventType,
      'startTime': startTime,
      'endTime': endTime,
      'duration': duration,
      'reason': reason,
    };
  }
}
