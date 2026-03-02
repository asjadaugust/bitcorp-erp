import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

import 'models/sync_conflict.dart';

import 'package:mobile/features/vouchers/data/repositories/vale_combustible_repository.dart';
import 'package:mobile/features/daily_report/data/repositories/daily_report_repository.dart';
import 'package:mobile/features/checklists/data/repositories/checklist_repository.dart';

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
        state.status == SyncStatus.conflict) {
      return;
    }

    state = state.copyWith(status: SyncStatus.syncing, errorMessage: null);

    try {
      final valeRepo = ref.read(valeCombustibleRepositoryProvider);
      final reportRepo = ref.read(dailyReportRepositoryProvider);
      final checklistRepo = ref.read(checklistRepositoryProvider);

      // Gather all pending items
      final pendingVales = await valeRepo.getPendingSync();
      final pendingReports = await reportRepo.getPendingSync();
      final pendingChecklists = await checklistRepo.getPendingSync();

      final totalPending =
          pendingVales.length +
          pendingReports.length +
          pendingChecklists.length;

      if (totalPending == 0) {
        state = state.copyWith(status: SyncStatus.idle, pendingCount: 0);
        return;
      }

      state = state.copyWith(pendingCount: totalPending);

      // Sync fuel vouchers
      for (final vale in pendingVales) {
        await valeRepo.syncVale(vale);
      }

      // Sync daily reports
      for (final report in pendingReports) {
        await reportRepo.syncReport(report);
      }

      // Sync checklists
      for (final checklist in pendingChecklists) {
        await checklistRepo.syncChecklist(checklist);
      }

      state = state.copyWith(
        status: SyncStatus.idle,
        pendingCount: 0,
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
      // After resolving, continue syncing the rest of the queue
      state = state.copyWith(status: SyncStatus.idle);
      await processQueue();
    } catch (e) {
      state = state.copyWith(
        status: SyncStatus.error,
        errorMessage: 'Error al resolver conflicto: $e',
      );
    }
  }
}
