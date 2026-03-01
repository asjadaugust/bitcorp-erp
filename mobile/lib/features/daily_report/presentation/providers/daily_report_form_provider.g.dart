// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'daily_report_form_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(DailyReportForm)
final dailyReportFormProvider = DailyReportFormProvider._();

final class DailyReportFormProvider
    extends $NotifierProvider<DailyReportForm, DailyReportModel> {
  DailyReportFormProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'dailyReportFormProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$dailyReportFormHash();

  @$internal
  @override
  DailyReportForm create() => DailyReportForm();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(DailyReportModel value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<DailyReportModel>(value),
    );
  }
}

String _$dailyReportFormHash() => r'dec98e0cb6d815408ae4216ca64b2306b01dd984';

abstract class _$DailyReportForm extends $Notifier<DailyReportModel> {
  DailyReportModel build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<DailyReportModel, DailyReportModel>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<DailyReportModel, DailyReportModel>,
              DailyReportModel,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
