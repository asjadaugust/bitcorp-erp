// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_local_source.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(dashboardLocalSource)
final dashboardLocalSourceProvider = DashboardLocalSourceProvider._();

final class DashboardLocalSourceProvider
    extends
        $FunctionalProvider<
          DashboardLocalSource,
          DashboardLocalSource,
          DashboardLocalSource
        >
    with $Provider<DashboardLocalSource> {
  DashboardLocalSourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'dashboardLocalSourceProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$dashboardLocalSourceHash();

  @$internal
  @override
  $ProviderElement<DashboardLocalSource> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  DashboardLocalSource create(Ref ref) {
    return dashboardLocalSource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(DashboardLocalSource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<DashboardLocalSource>(value),
    );
  }
}

String _$dashboardLocalSourceHash() =>
    r'f446bb80639edb97b5dcb8265aa46b9539bd1f15';
