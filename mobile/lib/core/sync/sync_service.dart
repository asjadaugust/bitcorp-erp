import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

import 'models/sync_conflict.dart';

import 'package:mobile/features/vouchers/data/repositories/vale_combustible_repository.dart';

part 'sync_service.g.dart';

enum SyncStatus { idle, syncing, error, conflict }

class SyncState {
  final SyncStatus status;
  final SyncConflict? currentConflict;
  final String? errorMessage;
  final int pendingCount;

  const SyncState({
    this.status = SyncStatus.idle,
    this.currentConflict,
    this.errorMessage,
    this.pendingCount = 0,
  });

  SyncState copyWith({
    SyncStatus? status,
    SyncConflict? currentConflict,
    String? errorMessage,
    int? pendingCount,
    bool clearConflict = false,
  }) {
    return SyncState(
      status: status ?? this.status,
      currentConflict: clearConflict
          ? null
          : (currentConflict ?? this.currentConflict),
      errorMessage: errorMessage, // deliberate override
      pendingCount: pendingCount ?? this.pendingCount,
    );
  }
}

@riverpod
class SyncService extends _$SyncService {
  @override
  SyncState build() {
    _initConnectivityListener();
    // Try to start processing right away just in case
    Future.microtask(() => processQueue());
    return const SyncState();
  }

  void _initConnectivityListener() {
    Connectivity().onConnectivityChanged.listen((
      List<ConnectivityResult> results,
    ) {
      if (results.contains(ConnectivityResult.mobile) ||
          results.contains(ConnectivityResult.wifi)) {
        // We regained connection, trigger sync
        if (state.status == SyncStatus.idle ||
            state.status == SyncStatus.error) {
          processQueue();
        }
      }
    });
  }

  Future<void> processQueue() async {
    if (state.status == SyncStatus.syncing ||
        state.status == SyncStatus.conflict)
      return;

    state = state.copyWith(status: SyncStatus.syncing, errorMessage: null);

    try {
      // 1. Fetch pending reports
      // 2. Fetch pending checklists
      // 3. Fetch pending incidents
      // 4. Fetch pending fuel vouchers
      final valeConfigRepo = ref.read(valeCombustibleRepositoryProvider);
      final pendingVales = await valeConfigRepo.getValesCombustible();
      final pendingSyncVales = pendingVales
          .where((v) => v.syncStatus == 'PENDING_SYNC')
          .toList();

      final totalPending = pendingSyncVales.length;

      // MOCK: Simulate network latency and finding items
      await Future.delayed(const Duration(seconds: 2));

      // MOCK: Suppose we hit a hardcoded conflict for testing
      // Remove this mock once verified, but keep it for Walkthrough step
      const mockConflict = false;

      if (mockConflict) {
        state = state.copyWith(
          status: SyncStatus.conflict,
          currentConflict: const SyncConflict(
            recordId: 'mock-123',
            recordType: 'CHECKLIST',
            localData: {},
            remoteData: {},
            message:
                'El equipo ya tiene un checklist reportado hoy por otro usuario.',
          ),
        );
        return;
      }

      // MOCK: Auto-approve pending vales
      for (final vale in pendingSyncVales) {
        await valeConfigRepo.updateValeStatus(vale.id, vale.estado);
        // We would technically update sync_status to SUBMITTED here,
        // but for now we'll just mock the iteration
      }

      state = state.copyWith(
        status: SyncStatus.idle,
        pendingCount: totalPending,
      );
    } catch (e) {
      state = state.copyWith(
        status: SyncStatus.error,
        errorMessage: 'Error de sincronización: $e',
      );
    }
  }

  Future<void> resolveConflict(String choice) async {
    // choice: 'OVERWRITE', 'KEEP_REMOTE', 'SAVE_NEW'
    state = state.copyWith(status: SyncStatus.syncing, clearConflict: true);

    try {
      // Execute the respective logic based on choice
      await Future.delayed(
        const Duration(seconds: 1),
      ); // Mock network operation

      // After resolving, continue syncing the rest of the queue
      state = state.copyWith(status: SyncStatus.idle);
      await processQueue();
    } catch (e) {
      state = state.copyWith(
        status: SyncStatus.error,
        errorMessage: 'Error al resolver conflicto: \$e',
      );
    }
  }
}
