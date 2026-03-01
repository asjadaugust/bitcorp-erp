// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'checklist_form_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(ChecklistForm)
final checklistFormProvider = ChecklistFormProvider._();

final class ChecklistFormProvider
    extends $NotifierProvider<ChecklistForm, ChecklistFormState> {
  ChecklistFormProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'checklistFormProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$checklistFormHash();

  @$internal
  @override
  ChecklistForm create() => ChecklistForm();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ChecklistFormState value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ChecklistFormState>(value),
    );
  }
}

String _$checklistFormHash() => r'b0fa34330db8a6769cfa50623301ec4c8053c04b';

abstract class _$ChecklistForm extends $Notifier<ChecklistFormState> {
  ChecklistFormState build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<ChecklistFormState, ChecklistFormState>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<ChecklistFormState, ChecklistFormState>,
              ChecklistFormState,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
