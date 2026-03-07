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

  // New canonical fields
  final String? proyectoId;
  final String? turno;
  final String? horaInicio;
  final String? horaFin;
  final String? lugarSalida;
  final String? lugarLlegada;
  final double? combustibleInicial;
  final double? combustibleCargado;
  final String? numValeCombustible;
  final String? weatherConditions;
  final double? horasPrecalentamiento;
  final String? responsableFrente;
  final double? gpsLatitude;
  final double? gpsLongitude;
  final String? firmaOperador;
  final String? firmaSupervisor;
  final String? firmaJefeEquipos;

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
    this.proyectoId,
    this.turno,
    this.horaInicio,
    this.horaFin,
    this.lugarSalida,
    this.lugarLlegada,
    this.combustibleInicial,
    this.combustibleCargado,
    this.numValeCombustible,
    this.weatherConditions,
    this.horasPrecalentamiento,
    this.responsableFrente,
    this.gpsLatitude,
    this.gpsLongitude,
    this.firmaOperador,
    this.firmaSupervisor,
    this.firmaJefeEquipos,
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
      startOdometer: (json['odometro_inicial'] as num?)?.toDouble(),
      endOdometer: (json['odometro_final'] as num?)?.toDouble(),
      effectiveHours: (json['horas_trabajadas'] as num?)?.toDouble() ?? 0,
      activityDescription: json['observaciones'] as String? ?? '',
      observations: json['observaciones'] as String?,
      syncStatus: 'SINCRONIZADO',
      estado: json['estado'] as String?,
      codigo: json['codigo'] as String?,
      equipoCodigo: json['equipo_codigo'] as String?,
      proyectoId: (json['proyecto_id'])?.toString(),
      turno: json['turno'] as String?,
      horaInicio: json['hora_inicio'] as String?,
      horaFin: json['hora_fin'] as String?,
      lugarSalida: json['lugar_salida'] as String?,
      lugarLlegada: json['lugar_llegada'] as String?,
      combustibleInicial: (json['combustible_inicial'] as num?)?.toDouble(),
      combustibleCargado: (json['combustible_cargado'] as num?)?.toDouble(),
      numValeCombustible: json['num_vale_combustible'] as String?,
      weatherConditions: json['weather_conditions'] as String?,
      horasPrecalentamiento: (json['horas_precalentamiento'] as num?)?.toDouble(),
      responsableFrente: json['responsable_frente'] as String?,
      gpsLatitude: (json['gps_latitude'] as num?)?.toDouble(),
      gpsLongitude: (json['gps_longitude'] as num?)?.toDouble(),
      firmaOperador: json['firma_operador'] as String?,
      firmaSupervisor: json['firma_supervisor'] as String?,
      firmaJefeEquipos: json['firma_jefe_equipos'] as String?,
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
      syncStatus: json['syncStatus'] as String? ?? 'BORRADOR',
      idValeCombustible: json['idValeCombustible'] as String?,
      estado: json['estado'] as String?,
      codigo: json['codigo'] as String?,
      equipoCodigo: json['equipo_codigo'] as String?,
      proyectoId: (json['proyectoId'] ?? json['proyecto_id'])?.toString(),
      turno: json['turno'] as String?,
      horaInicio: json['horaInicio'] as String? ?? json['hora_inicio'] as String?,
      horaFin: json['horaFin'] as String? ?? json['hora_fin'] as String?,
      lugarSalida: json['lugarSalida'] as String? ?? json['lugar_salida'] as String?,
      lugarLlegada: json['lugarLlegada'] as String? ?? json['lugar_llegada'] as String?,
      combustibleInicial: json['combustibleInicial'] != null
          ? (json['combustibleInicial'] as num).toDouble()
          : json['combustible_inicial'] != null
              ? (json['combustible_inicial'] as num).toDouble()
              : null,
      combustibleCargado: json['combustibleCargado'] != null
          ? (json['combustibleCargado'] as num).toDouble()
          : json['combustible_cargado'] != null
              ? (json['combustible_cargado'] as num).toDouble()
              : null,
      numValeCombustible: json['numValeCombustible'] as String? ?? json['num_vale_combustible'] as String?,
      weatherConditions: json['weatherConditions'] as String? ?? json['weather_conditions'] as String?,
      horasPrecalentamiento: json['horasPrecalentamiento'] != null
          ? (json['horasPrecalentamiento'] as num).toDouble()
          : json['horas_precalentamiento'] != null
              ? (json['horas_precalentamiento'] as num).toDouble()
              : null,
      responsableFrente: json['responsableFrente'] as String? ?? json['responsable_frente'] as String?,
      gpsLatitude: json['gpsLatitude'] != null
          ? (json['gpsLatitude'] as num).toDouble()
          : json['gps_latitude'] != null
              ? (json['gps_latitude'] as num).toDouble()
              : null,
      gpsLongitude: json['gpsLongitude'] != null
          ? (json['gpsLongitude'] as num).toDouble()
          : json['gps_longitude'] != null
              ? (json['gps_longitude'] as num).toDouble()
              : null,
      firmaOperador: json['firmaOperador'] as String? ?? json['firma_operador'] as String?,
      firmaSupervisor: json['firmaSupervisor'] as String? ?? json['firma_supervisor'] as String?,
      firmaJefeEquipos: json['firmaJefeEquipos'] as String? ?? json['firma_jefe_equipos'] as String?,
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
      'proyectoId': proyectoId,
      'turno': turno,
      'horaInicio': horaInicio,
      'horaFin': horaFin,
      'lugarSalida': lugarSalida,
      'lugarLlegada': lugarLlegada,
      'combustibleInicial': combustibleInicial,
      'combustibleCargado': combustibleCargado,
      'numValeCombustible': numValeCombustible,
      'weatherConditions': weatherConditions,
      'horasPrecalentamiento': horasPrecalentamiento,
      'responsableFrente': responsableFrente,
      'gpsLatitude': gpsLatitude,
      'gpsLongitude': gpsLongitude,
      'firmaOperador': firmaOperador,
      'firmaSupervisor': firmaSupervisor,
      'firmaJefeEquipos': firmaJefeEquipos,
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
      'odometro_inicial': startOdometer,
      'odometro_final': endOdometer,
      'horas_trabajadas': effectiveHours,
      'observaciones': activityDescription,
      'proyecto_id': proyectoId != null ? (int.tryParse(proyectoId!) ?? proyectoId) : null,
      'turno': turno,
      'hora_inicio': horaInicio,
      'hora_fin': horaFin,
      'lugar_salida': lugarSalida,
      'lugar_llegada': lugarLlegada,
      'combustible_inicial': combustibleInicial,
      'combustible_cargado': combustibleCargado,
      'num_vale_combustible': numValeCombustible,
      'weather_conditions': weatherConditions,
      'horas_precalentamiento': horasPrecalentamiento,
      'responsable_frente': responsableFrente,
      'gps_latitude': gpsLatitude,
      'gps_longitude': gpsLongitude,
      'firma_operador': firmaOperador,
      'firma_supervisor': firmaSupervisor,
      'firma_jefe_equipos': firmaJefeEquipos,
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
    String? proyectoId,
    String? turno,
    String? horaInicio,
    String? horaFin,
    String? lugarSalida,
    String? lugarLlegada,
    double? combustibleInicial,
    double? combustibleCargado,
    String? numValeCombustible,
    String? weatherConditions,
    double? horasPrecalentamiento,
    String? responsableFrente,
    double? gpsLatitude,
    double? gpsLongitude,
    String? firmaOperador,
    String? firmaSupervisor,
    String? firmaJefeEquipos,
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
      proyectoId: proyectoId ?? this.proyectoId,
      turno: turno ?? this.turno,
      horaInicio: horaInicio ?? this.horaInicio,
      horaFin: horaFin ?? this.horaFin,
      lugarSalida: lugarSalida ?? this.lugarSalida,
      lugarLlegada: lugarLlegada ?? this.lugarLlegada,
      combustibleInicial: combustibleInicial ?? this.combustibleInicial,
      combustibleCargado: combustibleCargado ?? this.combustibleCargado,
      numValeCombustible: numValeCombustible ?? this.numValeCombustible,
      weatherConditions: weatherConditions ?? this.weatherConditions,
      horasPrecalentamiento: horasPrecalentamiento ?? this.horasPrecalentamiento,
      responsableFrente: responsableFrente ?? this.responsableFrente,
      gpsLatitude: gpsLatitude ?? this.gpsLatitude,
      gpsLongitude: gpsLongitude ?? this.gpsLongitude,
      firmaOperador: firmaOperador ?? this.firmaOperador,
      firmaSupervisor: firmaSupervisor ?? this.firmaSupervisor,
      firmaJefeEquipos: firmaJefeEquipos ?? this.firmaJefeEquipos,
      events: events ?? this.events,
      photos: photos ?? this.photos,
    );
  }
}
