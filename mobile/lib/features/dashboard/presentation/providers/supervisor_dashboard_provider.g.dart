// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'supervisor_dashboard_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(SupervisorDashboard)
final supervisorDashboardProvider = SupervisorDashboardProvider._();

final class SupervisorDashboardProvider
    extends
        $AsyncNotifierProvider<SupervisorDashboard, SupervisorDashboardModel> {
  SupervisorDashboardProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'supervisorDashboardProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$supervisorDashboardHash();

  @$internal
  @override
  SupervisorDashboard create() => SupervisorDashboard();
}

String _$supervisorDashboardHash() =>
    r'326e402549f88ee628c101b411ab6765dcedcb47';

abstract class _$SupervisorDashboard
    extends $AsyncNotifier<SupervisorDashboardModel> {
  FutureOr<SupervisorDashboardModel> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref =
        this.ref
            as $Ref<
              AsyncValue<SupervisorDashboardModel>,
              SupervisorDashboardModel
            >;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<
                AsyncValue<SupervisorDashboardModel>,
                SupervisorDashboardModel
              >,
              AsyncValue<SupervisorDashboardModel>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
