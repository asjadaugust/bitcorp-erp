// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'daily_report_list_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(DailyReportList)
final dailyReportListProvider = DailyReportListProvider._();

final class DailyReportListProvider
    extends $AsyncNotifierProvider<DailyReportList, List<DailyReportModel>> {
  DailyReportListProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'dailyReportListProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$dailyReportListHash();

  @$internal
  @override
  DailyReportList create() => DailyReportList();
}

String _$dailyReportListHash() => r'631c6bfafc4565faa1c29959b94782154e709b07';

abstract class _$DailyReportList
    extends $AsyncNotifier<List<DailyReportModel>> {
  FutureOr<List<DailyReportModel>> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref =
        this.ref
            as $Ref<AsyncValue<List<DailyReportModel>>, List<DailyReportModel>>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<
                AsyncValue<List<DailyReportModel>>,
                List<DailyReportModel>
              >,
              AsyncValue<List<DailyReportModel>>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
