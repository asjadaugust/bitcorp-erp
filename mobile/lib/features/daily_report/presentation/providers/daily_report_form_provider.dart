import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../domain/models/daily_report_model.dart';
import '../../domain/models/report_event_model.dart';
import '../../domain/models/report_photo_model.dart';
import 'package:uuid/uuid.dart';
import '../providers/daily_report_list_provider.dart';
import '../../data/repositories/daily_report_repository.dart';

part 'daily_report_form_provider.g.dart';

@riverpod
class DailyReportForm extends _$DailyReportForm {
  @override
  DailyReportModel build() {
    final now = DateTime.now();
    return DailyReportModel(
      id: const Uuid().v4(),
      date:
          "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}",
      equipmentId: '',
      startHourMeter: 0.0,
      endHourMeter: 0.0,
      startOdometer: null,
      endOdometer: null,
      effectiveHours: 0.0,
      activityDescription: '',
      observations: null,
      signaturePath: null,
      syncStatus: 'BORRADOR',
      idValeCombustible: null,
      turno: 'DIA',
      horaInicio: null,
      horaFin: null,
      lugarSalida: null,
      lugarLlegada: null,
      combustibleInicial: null,
      combustibleCargado: null,
      numValeCombustible: null,
      weatherConditions: null,
      horasPrecalentamiento: null,
      responsableFrente: null,
      gpsLatitude: null,
      gpsLongitude: null,
      firmaOperador: null,
      firmaSupervisor: null,
      firmaJefeEquipos: null,
      proyectoId: null,
      events: [],
      photos: [],
    );
  }

  void updateEquipment(String equipmentId) {
    state = state.copyWith(equipmentId: equipmentId);
  }

  void updateDate(String date) {
    state = state.copyWith(date: date);
  }

  void updateHourMeters(double start, double end) {
    // effective hours calculation requires knowing if 'events' subtract hours
    // But basic effective hours = end - start
    final effective = end >= start ? end - start : 0.0;
    state = state.copyWith(
      startHourMeter: start,
      endHourMeter: end,
      effectiveHours: effective,
    );
  }

  void updateOdometer(double? start, double? end) {
    state = state.copyWith(startOdometer: start, endOdometer: end);
  }

  void updateDescription(String text) {
    state = state.copyWith(activityDescription: text);
  }

  void updateValeCombustible(String? idVale) {
    state = state.copyWith(idValeCombustible: idVale);
  }

  void updateObservations(String text) {
    state = state.copyWith(observations: text);
  }

  void addEvent(ReportEventModel event) {
    state = state.copyWith(events: [...state.events, event]);
  }

  void removeEvent(String eventId) {
    state = state.copyWith(
      events: state.events.where((e) => e.id != eventId).toList(),
    );
  }

  void addPhoto(ReportPhotoModel photo) {
    if (state.photos.length >= 5) return;
    state = state.copyWith(photos: [...state.photos, photo]);
  }

  void removePhoto(String photoId) {
    state = state.copyWith(
      photos: state.photos.where((p) => p.id != photoId).toList(),
    );
  }

  void updateSignature(String path) {
    state = state.copyWith(signaturePath: path);
  }

  void updateTurno(String turno) {
    state = state.copyWith(turno: turno);
  }

  void updateHoraInicio(String horaInicio) {
    state = state.copyWith(horaInicio: horaInicio);
  }

  void updateHoraFin(String horaFin) {
    state = state.copyWith(horaFin: horaFin);
  }

  void updateLugarSalida(String lugarSalida) {
    state = state.copyWith(lugarSalida: lugarSalida);
  }

  void updateLugarLlegada(String lugarLlegada) {
    state = state.copyWith(lugarLlegada: lugarLlegada);
  }

  void updateCombustibleInicial(double? value) {
    state = state.copyWith(combustibleInicial: value);
  }

  void updateCombustibleCargado(double? value) {
    state = state.copyWith(combustibleCargado: value);
  }

  void updateWeatherConditions(String? value) {
    state = state.copyWith(weatherConditions: value);
  }

  void updateResponsableFrente(String? value) {
    state = state.copyWith(responsableFrente: value);
  }

  Future<void> saveReport() async {
    // Change state to PENDING_SYNC before saving
    final reportToSave = state.copyWith(syncStatus: 'PENDIENTE_SYNC');

    // Attempt saving to repository offline
    final repo = ref.read(dailyReportRepositoryProvider);
    await repo.saveReport(reportToSave);

    // If a vale is linked, update its status to VINCULADO
    if (reportToSave.idValeCombustible != null &&
        reportToSave.idValeCombustible!.isNotEmpty) {
      // NOTE: We'll read the vale repo to update it here
    }

    // Invalidate list provider to reflect changes when going back
    ref.invalidate(dailyReportListProvider);
  }
}
