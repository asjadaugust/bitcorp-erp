// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'daily_report_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(dailyReportRepository)
final dailyReportRepositoryProvider = DailyReportRepositoryProvider._();

final class DailyReportRepositoryProvider
    extends
        $FunctionalProvider<
          DailyReportRepository,
          DailyReportRepository,
          DailyReportRepository
        >
    with $Provider<DailyReportRepository> {
  DailyReportRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'dailyReportRepositoryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$dailyReportRepositoryHash();

  @$internal
  @override
  $ProviderElement<DailyReportRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  DailyReportRepository create(Ref ref) {
    return dailyReportRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(DailyReportRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<DailyReportRepository>(value),
    );
  }
}

String _$dailyReportRepositoryHash() =>
    r'946ab0d18054edff23e1b2966ab7175bb4f1083f';
