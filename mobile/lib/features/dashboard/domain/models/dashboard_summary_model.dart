class DashboardSummaryModel {
  final String equipmentCode;
  final String equipmentDescription;
  final String dailyReportStatus;
  final int pendingChecklistCount;
  final int pendingApprovalCount;

  const DashboardSummaryModel({
    required this.equipmentCode,
    required this.equipmentDescription,
    required this.dailyReportStatus,
    required this.pendingChecklistCount,
    required this.pendingApprovalCount,
  });

  factory DashboardSummaryModel.fromJson(Map<String, dynamic> json) {
    return DashboardSummaryModel(
      equipmentCode: json['equipmentCode'] as String? ?? 'N/A',
      equipmentDescription:
          json['equipmentDescription'] as String? ?? 'Sin asignar',
      dailyReportStatus:
          json['dailyReportStatus'] as String? ?? 'Not Submitted',
      pendingChecklistCount: json['pendingChecklistCount'] as int? ?? 0,
      pendingApprovalCount: json['pendingApprovalCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'equipmentCode': equipmentCode,
      'equipmentDescription': equipmentDescription,
      'dailyReportStatus': dailyReportStatus,
      'pendingChecklistCount': pendingChecklistCount,
      'pendingApprovalCount': pendingApprovalCount,
    };
  }
}
