import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mobile/features/dashboard/domain/models/supervisor_dashboard_model.dart';

part 'supervisor_dashboard_provider.g.dart';

@riverpod
class SupervisorDashboard extends _$SupervisorDashboard {
  @override
  FutureOr<SupervisorDashboardModel> build() async {
    // Mock network delay
    await Future.delayed(const Duration(seconds: 1));

    // Mock data
    return const SupervisorDashboardModel(
      totalEquipos: 145,
      inspeccionadosPeriodo: 120,
      inspeccionesVencidas: 3,
      observacionesAbiertas: [
        ObservationModel(
          id: 'obs-001',
          fecha: '2026-03-01T08:00:00Z',
          equipoId: 'eq-045',
          equipoCodigo: 'VOL-045',
          descripcion:
              'Fuga de aceite detectada en cilindro hidráulico principal.',
          photoUrl: 'mocks/img1.jpg',
          estado: 'PENDIENTE',
        ),
        ObservationModel(
          id: 'obs-002',
          fecha: '2026-02-28T15:30:00Z',
          equipoId: 'eq-012',
          equipoCodigo: 'EXC-012',
          descripcion: 'Espejo retrovisor lateral izquierdo roto.',
          estado: 'PENDIENTE',
        ),
      ],
    );
  }

  Future<void> resolveObservation(String observationId, String comment) async {
    state = const AsyncValue.loading();

    // Mock API call
    await Future.delayed(const Duration(milliseconds: 800));

    if (state.value != null) {
      final updatedList = state.value!.observacionesAbiertas.map((obs) {
        if (obs.id == observationId) {
          return obs.copyWith(estado: 'RESUELTO');
        }
        return obs;
      }).toList();

      state = AsyncValue.data(
        state.value!.copyWith(observacionesAbiertas: updatedList),
      );
    }
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    ref.invalidateSelf();
  }
}
