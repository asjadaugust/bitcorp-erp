// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(DashboardNotifier)
final dashboardProvider = DashboardNotifierProvider._();

final class DashboardNotifierProvider
    extends $AsyncNotifierProvider<DashboardNotifier, DashboardSummaryModel> {
  DashboardNotifierProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'dashboardProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$dashboardNotifierHash();

  @$internal
  @override
  DashboardNotifier create() => DashboardNotifier();
}

String _$dashboardNotifierHash() => r'3609513a865d2dafc36df371a79a623365e6ba4d';

abstract class _$DashboardNotifier
    extends $AsyncNotifier<DashboardSummaryModel> {
  FutureOr<DashboardSummaryModel> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref =
        this.ref
            as $Ref<AsyncValue<DashboardSummaryModel>, DashboardSummaryModel>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<
                AsyncValue<DashboardSummaryModel>,
                DashboardSummaryModel
              >,
              AsyncValue<DashboardSummaryModel>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
