// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'daily_report_local_source.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(dailyReportLocalSource)
final dailyReportLocalSourceProvider = DailyReportLocalSourceProvider._();

final class DailyReportLocalSourceProvider
    extends
        $FunctionalProvider<
          DailyReportLocalSource,
          DailyReportLocalSource,
          DailyReportLocalSource
        >
    with $Provider<DailyReportLocalSource> {
  DailyReportLocalSourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'dailyReportLocalSourceProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$dailyReportLocalSourceHash();

  @$internal
  @override
  $ProviderElement<DailyReportLocalSource> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  DailyReportLocalSource create(Ref ref) {
    return dailyReportLocalSource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(DailyReportLocalSource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<DailyReportLocalSource>(value),
    );
  }
}

String _$dailyReportLocalSourceHash() =>
    r'cd2e994b41cdd0ea99e95b79def7d9b903aba233';
