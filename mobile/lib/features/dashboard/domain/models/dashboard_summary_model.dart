class DashboardStatsModel {
  final int partesHoy;
  final int partesSemana;
  final int partesMes;
  final double horasMes;

  const DashboardStatsModel({
    required this.partesHoy,
    required this.partesSemana,
    required this.partesMes,
    required this.horasMes,
  });

  factory DashboardStatsModel.fromJson(Map<String, dynamic> json) {
    return DashboardStatsModel(
      partesHoy: json['partes_hoy'] as int? ?? 0,
      partesSemana: json['partes_semana'] as int? ?? 0,
      partesMes: json['partes_mes'] as int? ?? 0,
      horasMes: (json['horas_mes'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class DashboardRecentParteModel {
  final int id;
  final String fecha;
  final String estado;
  final String? codigo;
  final double? horasTrabajadas;

  const DashboardRecentParteModel({
    required this.id,
    required this.fecha,
    required this.estado,
    this.codigo,
    this.horasTrabajadas,
  });

  factory DashboardRecentParteModel.fromJson(Map<String, dynamic> json) {
    return DashboardRecentParteModel(
      id: json['id'] as int,
      fecha: json['fecha'] as String? ?? '',
      estado: json['estado'] as String? ?? '',
      codigo: json['codigo'] as String?,
      horasTrabajadas: (json['horas_trabajadas'] as num?)?.toDouble(),
    );
  }
}

class DashboardSummaryModel {
  final String equipmentCode;
  final String equipmentDescription;
  final String? equipmentId;
  final String dailyReportStatus;
  final int pendingChecklistCount;
  final int pendingApprovalCount;
  final DashboardStatsModel? stats;
  final List<DashboardRecentParteModel> recentPartes;

  const DashboardSummaryModel({
    required this.equipmentCode,
    required this.equipmentDescription,
    this.equipmentId,
    required this.dailyReportStatus,
    required this.pendingChecklistCount,
    required this.pendingApprovalCount,
    this.stats,
    this.recentPartes = const [],
  });

  factory DashboardSummaryModel.fromJson(Map<String, dynamic> json) {
    return DashboardSummaryModel(
      equipmentCode: json['equipmentCode'] as String? ?? 'N/A',
      equipmentDescription: (() {
        final raw = (json['equipmentDescription'] as String? ?? '').trim();
        return (raw.isEmpty || raw == 'None' || raw == 'None None')
            ? 'Sin asignar'
            : raw;
      })(),
      equipmentId: json['equipmentId']?.toString(),
      dailyReportStatus:
          json['dailyReportStatus'] as String? ?? 'Not Submitted',
      pendingChecklistCount: json['pendingChecklistCount'] as int? ?? 0,
      pendingApprovalCount: json['pendingApprovalCount'] as int? ?? 0,
      stats: json['stats'] != null
          ? DashboardStatsModel.fromJson(
              json['stats'] as Map<String, dynamic>,
            )
          : null,
      recentPartes: (json['recent_partes'] as List<dynamic>?)
              ?.map(
                (e) => DashboardRecentParteModel.fromJson(
                  e as Map<String, dynamic>,
                ),
              )
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'equipmentCode': equipmentCode,
      'equipmentDescription': equipmentDescription,
      'equipmentId': equipmentId,
      'dailyReportStatus': dailyReportStatus,
      'pendingChecklistCount': pendingChecklistCount,
      'pendingApprovalCount': pendingApprovalCount,
    };
  }
}
